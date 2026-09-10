import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPayPalAccessToken, guidedProduct, paypalBaseUrl, requirePayPalConfiguration } from "@/lib/paypal";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new Error("Sign in is required.");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Payment service configuration is missing.");
    requirePayPalConfiguration();

    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } } });
    const { case_id: caseId } = await request.json() as { case_id?: string };
    if (!caseId) throw new Error("Case ID is required.");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Your session is no longer valid.");
    const { data: caseRecord } = await supabase.from("cases").select("id,user_id,paid_tier").eq("id", caseId).single();
    if (!caseRecord || caseRecord.user_id !== userData.user.id) throw new Error("Case not found.");
    if (caseRecord.paid_tier !== "free") return NextResponse.json({ alreadyPaid: true });

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          custom_id: `${userData.user.id}:${caseRecord.id}`,
          description: guidedProduct.name,
          amount: { currency_code: guidedProduct.currency, value: guidedProduct.amount },
        }],
      }),
    });
    const order = await response.json().catch(() => ({})) as { id?: string; message?: string };
    if (!response.ok || !order.id) throw new Error(order.message || "PayPal could not create the order.");
    return NextResponse.json({ id: order.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment could not be started." }, { status: 400 });
  }
}
