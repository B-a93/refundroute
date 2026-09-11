import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let documentId: string | undefined;
  let supabase: SupabaseClient | undefined;
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("Sign in is required.");
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) throw new Error("OPENAI_API_KEY is missing from the Hostinger environment variables.");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase server configuration is missing.");

    supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } } });
    const body = await request.json() as { document_id?: string };
    documentId = body.document_id;
    if (!documentId) throw new Error("Document ID is required.");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Your session is no longer valid.");
    const { data: document, error: documentError } = await supabase.from("documents").select("id,case_id,user_id,bucket_name,object_path,original_filename,content_type").eq("id", documentId).single();
    if (documentError || !document || document.user_id !== userData.user.id) throw new Error("Evidence not found.");
    await supabase.from("documents").update({ processing_status: "processing" }).eq("id", document.id);

    const { data: file, error: downloadError } = await supabase.storage.from(document.bucket_name).download(document.object_path);
    if (downloadError || !file) throw downloadError ?? new Error("Could not read evidence.");
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mediaInput = document.content_type === "application/pdf"
      ? { type: "input_file", filename: document.original_filename, file_data: `data:application/pdf;base64,${base64}` }
      : { type: "input_image", image_url: `data:${document.content_type};base64,${base64}`, detail: "high" };

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_EXTRACTION_MODEL ?? "gpt-4.1-mini",
        store: false,
        input: [{ role: "user", content: [
          { type: "input_text", text: "Classify and read this evidence. Transaction evidence visibly shows a purchase, charge, receipt, invoice, order, subscription, merchant, amount, transaction reference or payment record. Supporting evidence includes a cancellation confirmation, seller response, delivery record or item-condition proof. Mark unrelated for personal photos, greeting or planning cards, and files with no visible connection to a purchase or recovery case. Extract only details visibly supported by this single document. Never infer transaction details from decorative or unrelated content. Use null when unknown. Dates must be YYYY-MM-DD and currency must be a three-letter ISO code." },
          mediaInput,
        ] }],
        text: { format: { type: "json_schema", name: "receipt_extraction", strict: true, schema: {
          type: "object",
          properties: {
            document_relevance: { type: "string", enum: ["transaction_evidence", "supporting_evidence", "unrelated"] },
            relevance_reason: { type: "string" },
            merchant_name: { type: ["string", "null"] },
            amount: { type: ["string", "null"] },
            currency: { type: ["string", "null"] },
            charge_date: { type: ["string", "null"] },
            transaction_reference: { type: ["string", "null"] },
            product_name: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["document_relevance", "relevance_reason", "merchant_name", "amount", "currency", "charge_date", "transaction_reference", "product_name", "confidence"],
          additionalProperties: false,
        } } },
      }),
    });
    if (!aiResponse.ok) {
      const failure = await aiResponse.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(failure?.error?.message || `AI extraction failed (${aiResponse.status}).`);
    }
    const responseBody = await aiResponse.json() as { output?: Array<{ content?: Array<{ type: string; text?: string }> }> };
    const outputText = responseBody.output?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? []).find((item: { type: string }) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("No details could be extracted.");
    const extracted = JSON.parse(outputText) as Record<string, string | number | null>;

    await supabase.from("extracted_fields").delete().eq("document_id", document.id);
    const rows = ["document_relevance", "relevance_reason", "merchant_name", "amount", "currency", "charge_date", "transaction_reference", "product_name"].map((fieldName) => ({
      document_id: document.id,
      case_id: document.case_id,
      user_id: userData.user.id,
      field_name: fieldName,
      field_value: extracted[fieldName] === null ? null : String(extracted[fieldName]),
      confidence: Number(extracted.confidence),
    }));
    const { error: fieldsError } = await supabase.from("extracted_fields").insert(rows);
    if (fieldsError) throw fieldsError;
    await supabase.from("documents").update({ processing_status: "completed" }).eq("id", document.id);
    await supabase.from("case_events").insert({ case_id: document.case_id, user_id: userData.user.id, event_type: "evidence_extracted", title: "Evidence details extracted", details: { document_id: document.id } });
    return NextResponse.json({ fields: rows, relevance: extracted.document_relevance, relevance_reason: extracted.relevance_reason });
  } catch (error) {
    if (supabase && documentId) await supabase.from("documents").update({ processing_status: "failed" }).eq("id", documentId);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Extraction failed." }, { status: 400 });
  }
}
