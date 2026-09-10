"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

const subscriptionProblems = [
  ["Unexpected renewal", "unexpected_renewal"], ["Charged after cancellation", "charged_after_cancellation"],
  ["Free trial became paid", "free_trial_converted"], ["Duplicate charge", "duplicate_charge"],
  ["Unrecognized purchase", "unrecognized_purchase"], ["Refund was rejected", "refund_rejected"], ["Refund was ignored", "refund_ignored"],
] as const;
const purchaseProblems = [
  ["Item was not received", "item_not_received"], ["Item was not as described", "not_as_described"],
  ["Wrong amount charged", "wrong_amount"], ["Order cancelled but not refunded", "cancelled_not_refunded"],
  ["Refund was promised but not received", "refund_promised_not_received"], ["Duplicate charge", "duplicate_charge"], ["Unrecognized purchase", "unrecognized_purchase"],
] as const;
type Merchant = { id: string | null; name: string };
const fallbackMerchants: Merchant[] = ["Apple App Store", "Google Play", "Adobe", "Canva", "Microsoft", "Other"].map(name => ({ id: null, name }));

export default function NewCasePage() {
  const [recoveryType, setRecoveryType] = useState<"subscription" | "online_purchase">("subscription");
  const [problem, setProblem] = useState("");
  const [merchant, setMerchant] = useState("");
  const [otherMerchant, setOtherMerchant] = useState("");
  const [otherRoute, setOtherRoute] = useState("unknown");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [chargeDate, setChargeDate] = useState("");
  const [merchants, setMerchants] = useState(fallbackMerchants);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const problems = recoveryType === "subscription" ? subscriptionProblems : purchaseProblems;
  const merchantName = merchant === "Other" ? otherMerchant.trim() : merchant;
  const canContinue = Boolean(problem && merchant && merchantName && Number(amount) > 0 && chargeDate);

  useEffect(() => {
    let active = true;
    async function prepare() {
      if (!supabase) { window.location.replace("/auth"); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { window.location.replace("/auth"); return; }
      const { data } = await supabase.from("companies").select("id,name").eq("active", true).order("name");
      if (active && data?.length) setMerchants([...data, { id: null, name: "Other" }]);
    }
    void prepare();
    return () => { active = false; };
  }, []);

  async function createCase() {
    if (!supabase || !canContinue) return;
    setSaving(true); setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { window.location.assign("/auth"); return; }
      const selectedMerchant = merchants.find(item => item.name === merchant);
      const route = merchant === "Apple App Store" ? "apple" : merchant === "Google Play" ? "google_play" : merchant === "Other" ? otherRoute : "direct";
      const { data: savedCase, error: caseError } = await supabase.from("cases").insert({
        user_id: sessionData.session.user.id,
        company_id: selectedMerchant?.id ?? null,
        merchant_name: merchantName,
        recovery_type: recoveryType,
        problem, route, amount: Number(amount), currency, charge_date: chargeDate,
        status: "assessed", paid_tier: "free",
      }).select("id").single();
      if (caseError || !savedCase) throw caseError || new Error("The case could not be created.");
      await supabase.from("case_events").insert({ case_id: savedCase.id, user_id: sessionData.session.user.id, event_type: "case_created", title: "Free assessment started", details: { source: "new_case_page" } });
      window.location.assign(`/cases/${savedCase.id}`);
    } catch (caseError) {
      setError(caseError instanceof Error ? caseError.message : "We could not create this case.");
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />Dashboard</a></div></header>
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">New recovery case</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Check a charge</h1><p className="mt-3 text-[#62736d]">Enter what you know now. You can upload evidence on the next screen.</p></div>
      <section className="space-y-6 rounded-3xl border border-[#d7e2de] bg-white p-5 shadow-[0_24px_70px_rgba(24,57,48,.1)] sm:p-8">
        <fieldset><legend className="mb-3 font-semibold">What are you trying to recover money from?</legend><div className="grid grid-cols-2 gap-2">{[["Online subscription", "subscription"], ["Online purchase", "online_purchase"]].map(([label, value]) => <button key={value} type="button" onClick={() => { setRecoveryType(value as typeof recoveryType); setProblem(""); }} className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${recoveryType === value ? "border-[#0b8062] bg-[#eaf7f2] text-[#075e49] ring-2 ring-[#0b8062]/10" : "border-[#dfe7e4] bg-[#fbfcfc] text-[#455953]"}`}>{label}</button>)}</div></fieldset>
        <fieldset><legend className="mb-3 font-semibold">What happened?</legend><div className="grid gap-2 sm:grid-cols-2">{problems.map(([label, value]) => <button key={value} type="button" onClick={() => setProblem(value)} className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${problem === value ? "border-[#0b8062] bg-[#eaf7f2] text-[#075e49] ring-2 ring-[#0b8062]/10" : "border-[#dfe7e4] bg-[#fbfcfc] text-[#455953]"}`}>{label}</button>)}</div></fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Company or platform<select value={merchant} onChange={event => setMerchant(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] bg-white px-3 font-normal"><option value="">Select one</option>{merchants.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="text-sm font-semibold">Charge date<input type="date" value={chargeDate} onChange={event => setChargeDate(event.target.value)} max={new Date().toISOString().slice(0, 10)} className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] px-3 font-normal" /></label></div>
        {merchant === "Other" && <div className="grid gap-4 rounded-xl bg-[#f7faf9] p-4 sm:grid-cols-2"><label className="text-sm font-semibold">Company or app name<input value={otherMerchant} onChange={event => setOtherMerchant(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d7e2de] px-3 font-normal" /></label><label className="text-sm font-semibold">How did you pay?<select value={otherRoute} onChange={event => setOtherRoute(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d7e2de] bg-white px-3 font-normal"><option value="unknown">Not sure</option><option value="direct">Directly by card</option><option value="apple">Apple App Store</option><option value="google_play">Google Play</option><option value="paypal">PayPal</option><option value="mobile_carrier">Mobile carrier</option><option value="reseller">Reseller</option></select></label></div>}
        <div className="grid gap-4 sm:grid-cols-[130px_1fr]"><label className="text-sm font-semibold">Currency<select value={currency} onChange={event => setCurrency(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] bg-white px-3 font-normal">{["USD","EUR","GBP","CAD","AUD","AED","SAR","INR","NGN","GMD"].map(code => <option key={code}>{code}</option>)}</select></label><label className="text-sm font-semibold">Amount charged<input type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] px-3 font-normal" /></label></div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Button disabled={!canContinue || saving} onClick={createCase} className="h-12 w-full rounded-xl bg-[#0b6b53] text-base font-semibold hover:bg-[#095d49]">{saving ? "Creating your case…" : "Create case and continue"}<ArrowRight className="ml-2 size-4" /></Button>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-[#74837e]"><LockKeyhole className="size-3.5" />Free assessment. No bank connection required.</p>
      </section>
    </div>
  </main>;
}
