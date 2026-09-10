"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type PayPalButtons = { render: (element: HTMLElement) => Promise<void>; close?: () => void };
type PayPalNamespace = { Buttons: (options: Record<string, unknown>) => PayPalButtons };
declare global { interface Window { paypal?: PayPalNamespace } }

export function PayPalCheckout({ caseId, onPaid }: { caseId: string; onPaid: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const onPaidRef = useRef(onPaid);
  const [state, setState] = useState<"loading" | "ready" | "error" | "paid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);

  useEffect(() => {
    let buttons: PayPalButtons | undefined;
    let cancelled = false;
    async function setup() {
      try {
        const configResponse = await fetch("/api/paypal/config", { cache: "no-store" });
        const config = await configResponse.json() as { clientId?: string; error?: string };
        if (!configResponse.ok || !config.clientId) throw new Error(config.error || "PayPal checkout is unavailable.");
        const scriptId = "paypal-checkout-sdk";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=USD&intent=capture`;
          script.async = true;
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => { script!.addEventListener("load", () => resolve(), { once: true }); script!.addEventListener("error", () => reject(new Error("PayPal could not load.")), { once: true }); });
        } else if (!window.paypal) {
          await new Promise<void>((resolve, reject) => { script!.addEventListener("load", () => resolve(), { once: true }); script!.addEventListener("error", () => reject(new Error("PayPal could not load.")), { once: true }); });
        }
        if (cancelled || !container.current || !window.paypal) return;
        buttons = window.paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "paypal" },
          createOrder: async () => {
            if (!supabase) throw new Error("Payment service is unavailable.");
            const session = (await supabase.auth.getSession()).data.session;
            if (!session) throw new Error("Sign in again to continue.");
            const response = await fetch("/api/paypal/create-order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ case_id: caseId }) });
            const result = await response.json() as { id?: string; error?: string; alreadyPaid?: boolean };
            if (result.alreadyPaid) { onPaidRef.current(); throw new Error("This case is already unlocked."); }
            if (!response.ok || !result.id) throw new Error(result.error || "Payment could not be started.");
            return result.id;
          },
          onApprove: async (data: { orderID: string }) => {
            setState("loading"); setMessage("Confirming your payment…");
            if (!supabase) throw new Error("Payment service is unavailable.");
            const session = (await supabase.auth.getSession()).data.session;
            if (!session) throw new Error("Sign in again to continue.");
            const response = await fetch("/api/paypal/capture-order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ case_id: caseId, order_id: data.orderID }) });
            const result = await response.json() as { completed?: boolean; error?: string };
            if (!response.ok || !result.completed) throw new Error(result.error || "Payment could not be confirmed.");
            setState("paid"); setMessage("Payment confirmed. Guided recovery is unlocked."); onPaidRef.current();
          },
          onCancel: () => { setState("ready"); setMessage("Payment cancelled. You have not been charged."); },
          onError: (error: unknown) => { setState("error"); setMessage(error instanceof Error ? error.message : "PayPal checkout could not be completed."); },
        });
        await buttons.render(container.current);
        if (!cancelled) setState("ready");
      } catch (error) {
        if (!cancelled) { setState("error"); setMessage(error instanceof Error ? error.message : "PayPal checkout is unavailable."); }
      }
    }
    void setup();
    return () => { cancelled = true; buttons?.close?.(); };
  }, [caseId]);

  return <section className="mt-6 rounded-2xl border border-[#cce0d8] bg-[#f4faf7] p-5 sm:p-7">
    <div className="grid gap-5 md:grid-cols-[1fr_320px] md:items-center"><div><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]"><LockKeyhole className="size-4" />One-time payment</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Unlock guided recovery for $9</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#5d726b]">Generate and save personalized refund requests, analyze replies, and track follow-up actions for this case. No subscription and no percentage of your refund.</p></div><div><div ref={container} className={state === "paid" ? "hidden" : "min-h-12"} />{state === "loading" && <p className="flex items-center justify-center gap-2 text-sm text-[#5d726b]"><LoaderCircle className="size-4 animate-spin" />{message || "Loading PayPal…"}</p>}{message && state !== "loading" && <p role={state === "error" ? "alert" : "status"} className={`mt-2 flex items-center gap-2 text-sm ${state === "error" ? "text-red-700" : "text-[#276b57]"}`}>{state === "paid" && <CheckCircle2 className="size-4" />}{message}</p>}</div></div>
  </section>;
}
