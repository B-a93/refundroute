import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { creatorOffer, normalizeReferralCode, requirePayPalConfiguration } from "@/lib/paypal";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const code = normalizeReferralCode(request.nextUrl.searchParams.get("code"));
    if (!code) return NextResponse.json({ valid: false });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error("Referral service is unavailable.");
    const { serviceRoleKey } = requirePayPalConfiguration();
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await admin.from("creator_partners").select("display_name").eq("code", code).eq("status", "active").maybeSingle();
    if (!data) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, code, creator: data.display_name, price: creatorOffer.amount });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
