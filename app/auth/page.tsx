"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/dashboard");
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!supabase) { setError("Account access is temporarily unavailable."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (authError) throw authError;
        if (data.session) window.location.replace("/dashboard");
        else setMessage("Check your email to confirm your MyResolveCenter account.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.replace("/dashboard");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "We could not complete that request.");
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    setError(""); setMessage("");
    if (!email) { setError("Enter your email address first."); return; }
    if (!supabase) { setError("Account access is temporarily unavailable."); return; }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
    if (resetError) setError(resetError.message);
    else setMessage("Password reset instructions have been sent to your email.");
  }

  return <main className="grid min-h-screen bg-[#f4f8f6] lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-[#102d25] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <a href="/" className="flex items-center gap-2.5 text-lg font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-[#8de0c6] text-[#10362b]"><Route className="size-5" /></span>MyResolveCenter</a>
      <div className="max-w-lg"><p className="text-sm font-bold uppercase tracking-[.14em] text-[#8de0c6]">Your private recovery workspace</p><h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-[-.05em]">Keep every document, deadline and response in one clear place.</h1><div className="mt-8 space-y-4 text-[#c5d9d2]"><p className="flex gap-3"><LockKeyhole className="mt-1 size-5 shrink-0 text-[#8de0c6]" />Your cases are protected by account-level access rules.</p><p className="flex gap-3"><Mail className="mt-1 size-5 shrink-0 text-[#8de0c6]" />Receive reminders when a response or follow-up is due.</p></div></div>
      <p className="text-sm text-[#8eaaa1]">No bank connection. No subscription. No percentage fee.</p>
    </section>
    <section className="flex items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <a href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />Back to MyResolveCenter</a>
        <div className="mb-8 flex rounded-xl bg-[#e4ece9] p-1"><button onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "signin" ? "bg-white text-[#12352b] shadow-sm" : "text-[#647770]"}`}>Sign in</button><button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "signup" ? "bg-white text-[#12352b] shadow-sm" : "text-[#647770]"}`}>Create account</button></div>
        <h2 className="text-3xl font-semibold tracking-[-.04em]">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="mt-2 text-[#65766f]">{mode === "signin" ? "Sign in to continue managing your recovery cases." : "Save your assessment and manage your case securely."}</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {mode === "signup" && <label className="block text-sm font-semibold">Full name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label>}
          <label className="block text-sm font-semibold">Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label>
          <label className="block text-sm font-semibold">Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} className="mt-2 h-12 w-full rounded-xl border bg-white px-4 font-normal outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /><span className="mt-1.5 block text-xs font-normal text-[#7c8b86]">Minimum 8 characters</span></label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
          <Button disabled={loading} className="h-12 w-full rounded-xl bg-[#0b6b53] text-base font-semibold hover:bg-[#095d49]">{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight className="ml-1 size-4" /></Button>
        </form>
        {mode === "signin" && <button onClick={resetPassword} className="mt-5 w-full text-sm font-semibold text-[#0b6b53] hover:underline">Forgot your password?</button>}
        <p className="mt-8 text-center text-xs leading-5 text-[#7b8b85]">By continuing, you agree to MyResolveCenter’s <a href="/terms" className="underline hover:text-[#0b6b53]">Terms</a> and <a href="/privacy" className="underline hover:text-[#0b6b53]">Privacy Policy</a>.</p>
      </div>
    </section>
  </main>;
}
