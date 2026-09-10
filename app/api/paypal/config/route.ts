import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "PayPal checkout is not configured yet." }, { status: 503 });
  return NextResponse.json({ clientId, environment: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox" });
}
