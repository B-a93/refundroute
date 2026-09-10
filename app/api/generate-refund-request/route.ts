import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeneratedRequest = {
  subject: string;
  body: string;
  route_summary: string;
  next_step: string;
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("Sign in is required.");

    const openAIKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!openAIKey) throw new Error("Refund request generation is not configured.");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase server configuration is missing.");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authorization } },
    });
    const payload = await request.json() as { case_id?: string };
    if (!payload.case_id) throw new Error("Case ID is required.");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Your session is no longer valid.");

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("id,user_id,company_id,merchant_name,recovery_type,problem,route,product_name,amount,currency,charge_date,strength_score,strength_label")
      .eq("id", payload.case_id)
      .single();
    if (caseError || !caseRecord || caseRecord.user_id !== userData.user.id) throw new Error("Case not found.");
    if (!caseRecord.merchant_name || !caseRecord.amount || !caseRecord.currency || !caseRecord.charge_date) {
      throw new Error("Confirm the merchant, amount, currency and charge date before generating a request.");
    }

    const [{ data: company }, { data: profile }, { data: extractedFields }, { data: evidenceItems }] = await Promise.all([
      caseRecord.company_id
        ? supabase.from("companies").select("name,support_url").eq("id", caseRecord.company_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
      supabase.from("extracted_fields").select("field_name,confirmed_value").eq("case_id", caseRecord.id).not("confirmed_at", "is", null),
      supabase.from("evidence_items").select("label,status").eq("case_id", caseRecord.id),
    ]);

    const confirmed = Object.fromEntries(
      (extractedFields ?? []).filter((field) => field.confirmed_value).map((field) => [field.field_name, field.confirmed_value]),
    );
    const availableEvidence = (evidenceItems ?? []).filter((item) => item.status === "available").map((item) => item.label);

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_WRITING_MODEL ?? "gpt-4.1-mini",
        store: false,
        instructions: [
          "You write concise, professional consumer refund requests.",
          "Use only facts supplied in the case data. Never invent order numbers, dates, policies, laws, deadlines, cancellation attempts, delivery facts, or promises.",
          "Do not threaten, guarantee a refund, or claim legal entitlement. Ask the recipient to confirm the outcome in writing.",
          "The body should be approximately 150 to 250 words and ready for the customer to review and send.",
          "For an Apple route, address the request to Apple and say it concerns an App Store purchase. For Google Play, address Google Play. For a direct route, address the merchant.",
          "If the problem is unrecognized_purchase, write an unrecognized transaction investigation and dispute request for the payment provider, not a normal merchant refund request. Ask them to identify the merchant, prevent further charges, investigate the transaction, and refund it if confirmed unauthorized. Refer to uploaded proof as transaction evidence or a transaction screenshot, never as proof of purchase. Advise the customer separately to contact their bank or payment provider promptly and secure the affected account.",
          "For other problems using unknown, card, PayPal, carrier, or reseller routes, make the first request to the named merchant without asserting that it is the final escalation channel.",
          "End with the supplied customer name when present. If it is absent, omit the name completely; never output brackets or placeholder text.",
        ].join(" "),
        input: JSON.stringify({
          merchant: company?.name ?? caseRecord.merchant_name,
          recovery_type: caseRecord.recovery_type,
          problem: caseRecord.problem,
          purchase_route: caseRecord.route,
          product: caseRecord.product_name,
          amount: `${caseRecord.currency} ${Number(caseRecord.amount).toFixed(2)}`,
          charge_date: caseRecord.charge_date,
          confirmed_transaction_reference: confirmed.transaction_reference ?? null,
          available_evidence: availableEvidence,
          customer_name: profile?.display_name?.trim() || null,
        }),
        text: { format: { type: "json_schema", name: "refund_request", strict: true, schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            route_summary: { type: "string" },
            next_step: { type: "string" },
          },
          required: ["subject", "body", "route_summary", "next_step"],
          additionalProperties: false,
        } } },
      }),
    });
    if (!aiResponse.ok) {
      const failure = await aiResponse.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(failure?.error?.message || `Request generation failed (${aiResponse.status}).`);
    }

    const responseBody = await aiResponse.json() as { output?: Array<{ content?: Array<{ type: string; text?: string }> }> };
    const outputText = responseBody.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("No refund request was generated.");
    const generated = JSON.parse(outputText) as GeneratedRequest;

    const { data: savedMessage, error: messageError } = await supabase.from("messages").insert({
      case_id: caseRecord.id,
      user_id: userData.user.id,
      direction: "outbound",
      message_type: "refund_request",
      subject: generated.subject,
      body: generated.body,
      classification: "draft",
    }).select("id").single();
    if (messageError) throw messageError;

    await supabase.from("case_events").insert({
      case_id: caseRecord.id,
      user_id: userData.user.id,
      event_type: "refund_request_generated",
      title: "Refund request generated",
      details: { message_id: savedMessage.id, route: caseRecord.route },
    });

    return NextResponse.json({
      id: savedMessage.id,
      ...generated,
      support_url: company?.support_url ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request generation failed." }, { status: 400 });
  }
}
