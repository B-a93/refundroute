import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Sign in is required.");
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) throw new Error("Automatic extraction is not configured.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const { document_id } = await request.json();
    if (!document_id) throw new Error("document_id is required.");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Your session is no longer valid.");

    const { data: document, error: documentError } = await supabase.from("documents").select("id,case_id,user_id,bucket_name,object_path,original_filename,content_type").eq("id", document_id).single();
    if (documentError || !document || document.user_id !== userData.user.id) throw new Error("Evidence not found.");
    await supabase.from("documents").update({ processing_status: "processing" }).eq("id", document.id);

    const { data: file, error: downloadError } = await supabase.storage.from(document.bucket_name).download(document.object_path);
    if (downloadError || !file) throw downloadError ?? new Error("Could not read evidence.");
    const base64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
    const mediaInput = document.content_type === "application/pdf"
      ? { type: "input_file", filename: document.original_filename, file_data: `data:application/pdf;base64,${base64}` }
      : { type: "input_image", image_url: `data:${document.content_type};base64,${base64}`, detail: "high" };

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_EXTRACTION_MODEL") ?? "gpt-4.1-mini",
        store: false,
        input: [{ role: "user", content: [
          { type: "input_text", text: "Read this purchase evidence. Extract only details visibly supported by the document. Use null when unknown. Dates must be YYYY-MM-DD and currency must be a three-letter ISO code." },
          mediaInput,
        ] }],
        text: { format: { type: "json_schema", name: "receipt_extraction", strict: true, schema: {
          type: "object",
          properties: {
            merchant_name: { type: ["string", "null"] },
            amount: { type: ["string", "null"] },
            currency: { type: ["string", "null"] },
            charge_date: { type: ["string", "null"] },
            transaction_reference: { type: ["string", "null"] },
            product_name: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["merchant_name", "amount", "currency", "charge_date", "transaction_reference", "product_name", "confidence"],
          additionalProperties: false,
        } } },
      }),
    });
    if (!aiResponse.ok) throw new Error(`AI extraction failed (${aiResponse.status}).`);
    const responseBody = await aiResponse.json();
    const outputText = responseBody.output?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? []).find((item: { type: string }) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("No details could be extracted.");
    const extracted = JSON.parse(outputText) as Record<string, string | number | null>;

    await supabase.from("extracted_fields").delete().eq("document_id", document.id);
    const rows = ["merchant_name", "amount", "currency", "charge_date", "transaction_reference", "product_name"].map((fieldName) => ({
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
    return new Response(JSON.stringify({ fields: rows }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
