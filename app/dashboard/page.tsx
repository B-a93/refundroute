"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, FilePlus2, FolderOpen, LogOut, Route, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type CaseItem = { id: string; merchant_name: string | null; problem: string; status: string; amount: number | null; currency: string | null; created_at: string };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const savingDraft = useRef(false);

  useEffect(() => {
    if (!supabase) { window.location.replace("/auth"); return; }
    const client = supabase;
    async function load() {
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) { window.location.replace("/auth"); return; }
      setUser(sessionData.session.user);
      const pendingCase = sessionStorage.getItem("refundroute_pending_case");
      if (pendingCase && !savingDraft.current) {
        savingDraft.current = true;
        try {
          const draft = JSON.parse(pendingCase) as Record<string, unknown>;
          const { data: savedCase, error: saveError } = await client.from("cases").insert({ ...draft, user_id: sessionData.session.user.id }).select("id").single();
          if (saveError) throw saveError;
          await client.from("case_events").insert({ case_id: savedCase.id, user_id: sessionData.session.user.id, event_type: "case_created", title: "Free assessment completed", details: { source: "free_assessment" } });
          sessionStorage.removeItem("refundroute_pending_case");
        } catch (draftError) {
          setError(draftError instanceof Error ? draftError.message : "We could not save your assessment yet.");
        }
      }
      const { data, error: casesError } = await client.from("cases").select("id,merchant_name,problem,status,amount,currency,created_at").order("created_at", { ascending: false });
      if (casesError) setError(casesError.message);
      setCases((data as CaseItem[] | null) ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  async function signOut() { await supabase?.auth.signOut(); window.location.replace("/"); }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f8f6]"><p className="text-[#5c716a]">Opening your secure workspace…</p></main>;

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><Button onClick={signOut} variant="ghost" className="gap-2 text-[#5d7069]"><LogOut className="size-4" />Sign out</Button></div></header>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Your recovery workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Welcome, {name}</h1><p className="mt-2 text-[#62736d]">Track evidence, responses and deadlines for every case.</p></div><Button asChild className="h-12 rounded-xl bg-[#0b6b53] px-5 font-semibold hover:bg-[#095d49]"><a href="/new-case"><FilePlus2 className="mr-2 size-4" />Start a new case</a></Button></div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#687872]">Active cases</p><p className="mt-2 text-3xl font-semibold">{cases.filter(item => !["completed","closed"].includes(item.status)).length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#687872]">Action needed</p><p className="mt-2 text-3xl font-semibold">{cases.filter(item => ["evidence_needed","follow_up_due","escalation_ready"].includes(item.status)).length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#687872]">Privacy status</p><p className="mt-2 flex items-center gap-2 font-semibold text-[#0b755a]"><ShieldCheck className="size-5" />Protected</p></div></div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <section className="mt-8 rounded-2xl border bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your cases</h2><p className="mt-1 text-sm text-[#6c7c77]">Only you can view these records.</p></div></div>
        {cases.length === 0 ? <div className="grid place-items-center py-16 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#e9f5f1] text-[#0b755a]"><FolderOpen className="size-6" /></span><h3 className="mt-5 text-lg font-semibold">No recovery cases yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#6b7b76]">Start with a free charge assessment. You’ll see the likely route before deciding whether to continue.</p><Button asChild variant="outline" className="mt-5 rounded-xl"><a href="/new-case">Check my first charge <ArrowRight className="ml-2 size-4" /></a></Button></div> : <div className="mt-5 divide-y">{cases.map(item => <a href={`/cases/${item.id}`} key={item.id} className="group flex items-center justify-between gap-4 py-4"><div><h3 className="font-semibold group-hover:text-[#0b6b53]">{item.merchant_name || "Unidentified charge"}</h3><p className="mt-1 text-sm capitalize text-[#6b7b76]">{item.problem.replaceAll("_", " ")} · {item.status.replaceAll("_", " ")}</p></div><div className="flex items-center gap-3"><p className="font-semibold">{item.currency} {item.amount?.toFixed(2)}</p><ArrowRight className="size-4 text-[#7f918b] transition group-hover:translate-x-1" /></div></a>)}</div>}
      </section>
    </div>
  </main>;
}
