import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPayPalAccessToken, guidedProduct, paypalBaseUrl, requirePayPalConfiguration } from "@/lib/paypal";

export const runtime = "nodejs";

type CaptureResponse = {
  id?: string;
  status?: string;
  message?: string;
  purchase_units?: Array<{ custom_id?: string; payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> } }>;
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("Sign in is required.");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Payment service configuration is missing.");
    const { serviceRoleKey } = requirePayPalConfiguration();
    const { case_id: caseId, order_id: orderId } = await request.json() as { case_id?: string; order_id?: string };
    if (!caseId || !orderId) throw new Error("Payment details are incomplete.");

    const userClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) throw new Error("Your session is no longer valid.");
    const { data: caseRecord } = await userClient.from("cases").select("id,user_id,paid_tier").eq("id", caseId).single();
    if (!caseRecord || caseRecord.user_id !== userData.user.id) throw new Error("Case not found.");
    if (caseRecord.paid_tier !== "free") return NextResponse.json({ completed: true });

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": orderId },
    });
    const payment = await response.json().catch(() => ({})) as CaptureResponse;
    const unit = payment.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const expectedOwner = `${userData.user.id}:${caseRecord.id}`;
    if (!response.ok || payment.status !== "COMPLETED" || capture?.status !== "COMPLETED") throw new Error(payment.message || "PayPal did not complete the payment.");
    if (unit?.custom_id !== expectedOwner || capture.amount?.currency_code !== guidedProduct.currency || capture.amount?.value !== guidedProduct.amount) {
      throw new Error("The completed payment did not match this recovery case.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const completedAt = new Date().toISOString();
    const { error: paymentError } = await admin.from("payments").upsert({
      case_id: caseRecord.id,
      user_id: userData.user.id,
      provider: "paypal",
      provider_order_id: payment.id || orderId,
      package: "guided",
      amount: Number(guidedProduct.amount),
      currency: guidedProduct.currency,
      status: "completed",
      completed_at: completedAt,
    }, { onConflict: "provider_order_id" });
    if (paymentError) throw new Error("Payment was confirmed, but access could not be recorded. Contact support with your PayPal order ID.");
    const { error: caseError } = await admin.from("cases").update({ paid_tier: "guided" }).eq("id", caseRecord.id).eq("user_id", userData.user.id);
    if (caseError) throw new Error("Payment was confirmed, but access could not be unlocked. Contact support with your PayPal order ID.");
    await admin.from("case_events").insert({ case_id: caseRecord.id, user_id: userData.user.id, event_type: "payment_completed", title: "Guided recovery unlocked", details: { provider: "paypal", order_id: payment.id || orderId } });
    return NextResponse.json({ completed: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment could not be completed." }, { status: 400 });
  }
}
