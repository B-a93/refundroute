"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, FileSearch, LockKeyhole, ReceiptText, Route, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

const problems = ["Unexpected renewal", "Charged after cancellation", "Free trial became paid", "Duplicate charge", "Unrecognized purchase", "Refund ignored or rejected"];
const fallbackMerchants = ["Apple App Store", "Google Play", "Adobe", "Canva", "Microsoft", "Other"];

export default function Home() {
  const [problem, setProblem] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [merchants, setMerchants] = useState(fallbackMerchants);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const canCheck = problem && merchant && amount;
  const resultCopy = useMemo(() => problem === "Charged after cancellation" ? "A cancellation confirmation can make this a strong evidence-based case." : problem === "Duplicate charge" ? "Two matching transaction records can support a duplicate-billing request." : "Timing, payment route and available evidence will determine your next step.", [problem]);

  useEffect(() => {
    let active = true;

    async function loadCompanies() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("companies")
        .select("name")
        .eq("active", true)
        .order("name");

      if (!active || error || !data?.length) return;
      setMerchants([...data.map((company) => company.name), "Other"]);
      setDatabaseConnected(true);
    }

    void loadCompanies();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9f8] text-[#13231f]">
      <header className="border-b border-[#dce5e1] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white shadow-[0_8px_20px_rgba(11,107,83,.18)]"><Route className="size-5" aria-hidden="true" /></span>
            <span className="text-lg">RefundRoute</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-[#53645f] md:flex" aria-label="Main navigation">
            <a className="transition hover:text-[#0b6b53]" href="#how-it-works">How it works</a>
            <a className="transition hover:text-[#0b6b53]" href="#supported">Supported companies</a>
            <a className="transition hover:text-[#0b6b53]" href="#pricing">Pricing</a>
          </nav>
          <Button variant="outline" className="rounded-full border-[#cbd8d3] bg-white px-5 text-[#26453d]">Sign in</Button>
        </div>
      </header>

      <section id="top" className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_25%_5%,rgba(26,170,126,.12),transparent_36%),radial-gradient(circle_at_86%_20%,rgba(231,177,79,.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-24">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfe0da] bg-white px-3.5 py-2 text-sm font-medium text-[#356157] shadow-sm"><ShieldCheck className="size-4 text-[#0b6b53]" aria-hidden="true" />Private by design. No bank connection.</div>
            <h1 className="text-[clamp(2.5rem,6vw,4.9rem)] font-semibold leading-[.98] tracking-[-0.055em] text-[#10251f]">Find the right route to recover your money.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#52655f]">Upload a receipt or enter a charge. We help identify who billed you, check the relevant process and organize your next steps.</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#435a53]">
              {["Free initial check", "No subscription", "No percentage fee"].map((item) => <span key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-[#dff4ec] text-[#087359]"><Check className="size-3.5" /></span>{item}</span>)}
            </div>
          </div>

          <div className="relative rounded-[28px] border border-[#d7e2de] bg-white p-5 shadow-[0_30px_80px_rgba(24,57,48,.12)] sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-[.13em] text-[#0b8062]">Free assessment</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Check my charge</h2><p className="mt-2 text-sm leading-6 text-[#64746f]">Enter the details you know. You can add evidence in the next step.</p></div>
              <span className="hidden rounded-full bg-[#eef7f4] px-3 py-1.5 text-xs font-semibold text-[#32705e] sm:block">{databaseConnected ? `${merchants.length - 1} verified routes` : "About 2 min"}</span>
            </div>
            {!showResult ? (
              <div className="space-y-5">
                <fieldset><legend className="mb-2.5 text-sm font-semibold">What happened?</legend><div className="grid gap-2 sm:grid-cols-2">
                  {problems.map((item) => <button key={item} type="button" onClick={() => setProblem(item)} className={`rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition ${problem === item ? "border-[#0b8062] bg-[#eaf7f2] text-[#075e49] ring-2 ring-[#0b8062]/10" : "border-[#dfe7e4] bg-[#fbfcfc] text-[#455953] hover:border-[#adc9c0]"}`}>{item}</button>)}
                </div></fieldset>
                <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
                  <label className="text-sm font-semibold">Company or platform<select value={merchant} onChange={(event) => setMerchant(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] bg-white px-3.5 font-normal text-[#233b34] outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10"><option value="">Select one</option>{merchants.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="text-sm font-semibold">Amount charged<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="$ 0.00" className="mt-2 h-12 w-full rounded-xl border border-[#d7e2de] bg-white px-3.5 font-normal text-[#233b34] outline-none placeholder:text-[#91a09b] focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label>
                </div>
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9cdc6] bg-[#f6faf8] px-4 py-4 text-sm font-medium text-[#49665e] transition hover:border-[#7ba898] hover:bg-[#f0f8f5]"><Upload className="size-4.5" /> Upload a receipt or screenshot <span className="font-normal text-[#7a8b85]">(optional)</span></button>
                <Button disabled={!canCheck} onClick={() => setShowResult(true)} className="h-13 w-full rounded-xl bg-[#0b6b53] text-base font-semibold text-white shadow-[0_10px_24px_rgba(11,107,83,.2)] hover:bg-[#095d49] disabled:bg-[#b7c8c2]">Check my charge <ArrowRight className="ml-1 size-4.5" /></Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#74837e]"><LockKeyhole className="size-3.5" /> Your evidence stays private and is never used to access your bank.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#b9ddd1] bg-[#f0faf6] p-5 sm:p-6">
                <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0b8062] text-white"><FileSearch className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.13em] text-[#0b8062]">Preliminary result</p><h3 className="mt-1.5 text-xl font-semibold">Your case needs a timing and evidence check</h3><p className="mt-2 text-sm leading-6 text-[#48645b]">{resultCopy}</p></div></div>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2"><div className="rounded-xl bg-white p-3.5"><span className="text-xs text-[#6c7c76]">Payment route</span><p className="mt-1 font-semibold">{merchant}</p></div><div className="rounded-xl bg-white p-3.5"><span className="text-xs text-[#6c7c76]">Urgency</span><p className="mt-1 flex items-center gap-1.5 font-semibold"><Clock3 className="size-4 text-[#c47b13]" /> Confirm charge date</p></div></div>
                <Button className="mt-5 h-12 w-full rounded-xl bg-[#0b6b53] font-semibold hover:bg-[#095d49]">Continue assessment <ArrowRight className="ml-1 size-4" /></Button>
                <button type="button" onClick={() => setShowResult(false)} className="mt-3 w-full text-sm font-medium text-[#527168] hover:text-[#0b6b53]">Edit details</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#dfe8e4] bg-white py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">One clear recovery journey</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Know what to do next—not just what to write.</h2></div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">{[[ReceiptText,"Identify the charge","Confirm the merchant, payment route, amount and relevant dates."],[FileSearch,"Check your evidence","See what strengthens the case and what information is still missing."],[Route,"Follow the right route","Use the verified company process instead of searching across support pages."],[Sparkles,"Track every next step","Prepare follow-ups, understand replies and watch important deadlines."]].map(([Icon,title,copy],index) => { const I = Icon as typeof ReceiptText; return <article key={title as string} className="rounded-2xl border border-[#dfe7e4] bg-[#fbfcfc] p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f5f0] text-[#0b755a]"><I className="size-5" /></span><span className="text-sm font-semibold text-[#a3b0ac]">0{index+1}</span></div><h3 className="mt-5 text-lg font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#60716b]">{copy as string}</p></article>})}</div>
      </div></section>

      <section id="supported" className="py-16 sm:py-20"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Verified playbooks</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Built around how companies actually handle refunds.</h2><p className="mt-5 leading-7 text-[#5b6d67]">RefundRoute distinguishes the company providing the service from the platform that processed the payment, then directs you to the appropriate process.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{["Apple","Google Play","Adobe","Canva","Microsoft","More coming"].map((name)=><div key={name} className="rounded-2xl border border-[#dce6e2] bg-white px-4 py-6 text-center font-semibold shadow-sm">{name}</div>)}</div></div></section>

      <section id="pricing" className="bg-[#102d25] py-16 text-white sm:py-20"><div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#8de0c6]">Simple pricing</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Check for free. Pay once when you’re ready.</h2><div className="mt-9 grid w-full gap-4 text-left md:grid-cols-2"><div className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold text-[#a8c6bd]">Initial assessment</p><p className="mt-2 text-4xl font-semibold">Free</p><p className="mt-4 leading-6 text-[#b8cbc5]">Identify the route, urgency and missing evidence before deciding to continue.</p></div><div className="rounded-2xl border border-[#71d3b6]/50 bg-[#174538] p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-[#9ee5cf]">Guided recovery case</p><p className="mt-2 text-4xl font-semibold">$9 <span className="text-base font-normal text-[#b8d5cc]">once</span></p></div><span className="rounded-full bg-[#8de0c6] px-3 py-1 text-xs font-bold text-[#10362b]">No subscription</span></div><p className="mt-4 leading-6 text-[#c5ddd6]">Personalized request, evidence checklist, reply analysis, deadlines and follow-up tracking.</p></div></div><p className="mt-7 max-w-2xl text-sm leading-6 text-[#9fb8b0]">RefundRoute provides guidance and document-preparation tools. It does not guarantee a refund or provide legal representation.</p></div></section>
      <footer className="border-t border-[#dce5e1] bg-white py-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm text-[#65756f] sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© 2026 RefundRoute. A product by Elegant Empire AI.</p><div className="flex gap-5"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Support</a></div></div></footer>
    </main>
  );
}
