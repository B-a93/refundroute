"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, Download, ExternalLink, FileSearch, FileText, LoaderCircle, LockKeyhole, Route, Send, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayPalCheckout } from "@/components/paypal-checkout";
import { supabase } from "@/lib/supabase/client";

type CaseRecord = {
  id: string;
  merchant_name: string | null;
  problem: string;
  status: string;
  recovery_type: "subscription" | "online_purchase";
  amount: number | null;
  currency: string | null;
  charge_date: string | null;
  product_name: string | null;
  strength_score: number | null;
  strength_label: string | null;
  route: "direct" | "apple" | "google_play" | "paypal" | "bank_card" | "mobile_carrier" | "reseller" | "unknown";
  paid_tier: "free" | "guided" | "escalation";
};

type DocumentRecord = {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  object_path: string;
  processing_status: string;
  created_at: string;
};

type ExtractedField = { id: string; document_id: string; field_name: string; field_value: string | null; confidence: number | null };
type EvidenceItem = { id: string; evidence_type: string; label: string; status: "missing" | "available" | "required" | "not_applicable"; importance: number; document_id: string | null };
type RefundDraft = { id: string; subject: string; body: string; route_summary?: string; next_step?: string; support_url?: string | null };

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxSize = 10 * 1024 * 1024;
const reviewFieldNames = ["merchant_name", "amount", "currency", "charge_date", "transaction_reference", "product_name"] as const;
type ReviewValues = Record<(typeof reviewFieldNames)[number], string>;
const emptyReview: ReviewValues = { merchant_name: "", amount: "", currency: "", charge_date: "", transaction_reference: "", product_name: "" };

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const caseId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewValues, setReviewValues] = useState<ReviewValues>(emptyReview);
  const [confirming, setConfirming] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("proof_of_purchase");
  const [refundDraft, setRefundDraft] = useState<RefundDraft | null>(null);
  const [generatingRequest, setGeneratingRequest] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCase = useCallback(async () => {
    if (!supabase) { window.location.replace("/auth"); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { window.location.replace("/auth"); return; }
    setUser(sessionData.session.user);

    const [{ data: caseData, error: caseError }, { data: documentData, error: documentError }, { data: fieldData }, { data: evidenceData }, { data: messageData }] = await Promise.all([
      supabase.from("cases").select("id,merchant_name,problem,status,recovery_type,amount,currency,charge_date,product_name,strength_score,strength_label,route,paid_tier").eq("id", caseId).single(),
      supabase.from("documents").select("id,original_filename,content_type,size_bytes,object_path,processing_status,created_at").eq("case_id", caseId).order("created_at", { ascending: false }),
      supabase.from("extracted_fields").select("id,document_id,field_name,field_value,confidence").eq("case_id", caseId).order("created_at"),
      supabase.from("evidence_items").select("id,evidence_type,label,status,importance,document_id").eq("case_id", caseId).order("importance", { ascending: false }),
      supabase.from("messages").select("id,subject,body").eq("case_id", caseId).eq("message_type", "refund_request").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (caseError) setError(caseError.code === "PGRST116" ? "This case does not exist or you do not have access to it." : caseError.message);
    else setCaseRecord(caseData as CaseRecord);
    if (documentError) setError(documentError.message);
    setDocuments((documentData as DocumentRecord[] | null) ?? []);
    setExtractedFields((fieldData as ExtractedField[] | null) ?? []);
    setEvidenceItems((evidenceData as EvidenceItem[] | null) ?? []);
    if (messageData) setRefundDraft({ id: messageData.id, subject: messageData.subject ?? "Refund request", body: messageData.body });
    setLoading(false);
  }, [caseId]);

  function beginUpload(category: string) {
    setUploadCategory(category);
    fileInput.current?.click();
  }

  useEffect(() => { void loadCase(); }, [loadCase]);

  useEffect(() => {
    if (!caseRecord) return;
    const values = { ...emptyReview };
    const extractedDocumentIds = [...new Set(extractedFields.map((field) => field.document_id))];
    const fieldsToUse = extractedDocumentIds.length === 1 ? extractedFields : [];
    for (const field of fieldsToUse) {
      if (reviewFieldNames.includes(field.field_name as keyof ReviewValues) && field.field_value) values[field.field_name as keyof ReviewValues] = field.field_value;
    }
    values.merchant_name ||= caseRecord.merchant_name ?? "";
    values.amount ||= caseRecord.amount?.toString() ?? "";
    values.currency ||= caseRecord.currency ?? "";
    values.charge_date ||= caseRecord.charge_date ?? "";
    setReviewValues(values);
  }, [caseRecord, extractedFields]);

  async function requestExtraction(documentId: string) {
    if (!supabase) throw new Error("Automatic reading is unavailable.");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error("Sign in again to read this document.");
    const response = await fetch("/api/extract-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` },
      body: JSON.stringify({ document_id: documentId }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || "Automatic reading failed.");
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user || !caseRecord || !supabase) return;
    setError(""); setSuccess("");
    if (!allowedTypes.includes(file.type)) { setError("Upload a JPG, PNG, WebP or PDF file."); return; }
    if (file.size > maxSize) { setError("The file must be 10 MB or smaller."); return; }

    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const objectPath = `${user.id}/${caseRecord.id}/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error: storageError } = await supabase.storage.from("case-evidence").upload(objectPath, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;
      const { data: savedDocument, error: documentError } = await supabase.from("documents").insert({
        case_id: caseRecord.id,
        user_id: user.id,
        bucket_name: "case-evidence",
        object_path: objectPath,
        original_filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        category: uploadCategory,
      }).select("id").single();
      if (documentError) {
        await supabase.storage.from("case-evidence").remove([objectPath]);
        throw documentError;
      }
      await supabase.from("case_events").insert({ case_id: caseRecord.id, user_id: user.id, event_type: "evidence_uploaded", title: "Evidence uploaded", details: { filename: file.name } });
      await supabase.from("evidence_items").upsert({ case_id: caseRecord.id, user_id: user.id, evidence_type: uploadCategory, label: uploadCategory.replaceAll("_", " "), status: "available", document_id: savedDocument.id, importance: uploadCategory === "proof_of_purchase" ? 3 : 2 }, { onConflict: "case_id,evidence_type" });
      if (uploadCategory === "proof_of_purchase" || uploadCategory === "transaction_reference") {
        setSuccess("Evidence uploaded securely. Reading its details…");
        try { await requestExtraction(savedDocument.id); setSuccess("Evidence uploaded and details extracted."); }
        catch { setSuccess("Evidence uploaded. Select Read details after automatic reading is configured."); }
      } else setSuccess("Supporting evidence uploaded securely.");
      await loadCase();
      await recalculateStrength();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We could not upload this file.");
    } finally { setUploading(false); }
  }

  async function extractDocument(documentId: string) {
    if (!supabase) return;
    setError(""); setSuccess(""); setUploading(true);
    try {
      await requestExtraction(documentId);
      setSuccess("Document details extracted.");
      await loadCase();
    } catch (extractionError) {
      setError(extractionError instanceof Error ? extractionError.message : "Automatic reading failed. Your uploaded file is safe.");
    }
    setUploading(false);
  }

  async function downloadDocument(document: DocumentRecord) {
    if (!supabase) return;
    setError("");
    const { data, error: signedUrlError } = await supabase.storage.from("case-evidence").createSignedUrl(document.object_path, 60);
    if (signedUrlError) { setError(signedUrlError.message); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function useDocumentDetails(documentId: string) {
    if (!caseRecord) return;
    const values = { ...emptyReview };
    for (const field of extractedFields.filter((item) => item.document_id === documentId)) {
      if (reviewFieldNames.includes(field.field_name as keyof ReviewValues) && field.field_value) values[field.field_name as keyof ReviewValues] = field.field_value;
    }
    values.merchant_name ||= caseRecord.merchant_name ?? "";
    values.amount ||= caseRecord.amount?.toString() ?? "";
    values.currency ||= caseRecord.currency ?? "";
    values.charge_date ||= caseRecord.charge_date ?? "";
    setReviewValues(values);
    setError("");
    setSuccess("Only this file’s extracted details are now shown for review. Confirm them before continuing.");
  }

  async function removeDocument(document: DocumentRecord) {
    if (!supabase || !caseRecord || !user) return;
    if (!window.confirm(`Remove ${document.original_filename} from this case?`)) return;
    setError(""); setSuccess("");
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", document.id);
    if (deleteError) { setError(deleteError.message); return; }
    await supabase.storage.from("case-evidence").remove([document.object_path]);
    await supabase.from("case_events").insert({ case_id: caseRecord.id, user_id: user.id, event_type: "evidence_removed", title: "Evidence removed", details: { filename: document.original_filename } });
    setSuccess("The unrelated file was removed from this case.");
    await loadCase();
  }

  async function confirmDetails() {
    if (!supabase || !user || !caseRecord) return;
    const client = supabase;
    setError(""); setSuccess("");
    if (!reviewValues.merchant_name || Number(reviewValues.amount) <= 0 || !/^[A-Z]{3}$/.test(reviewValues.currency.toUpperCase()) || !reviewValues.charge_date) {
      setError("Confirm the merchant, amount, three-letter currency and charge date."); return;
    }
    setConfirming(true);
    try {
      await Promise.all(extractedFields.map((field) => client.from("extracted_fields").update({ confirmed_value: reviewValues[field.field_name as keyof ReviewValues] ?? field.field_value, confirmed_at: new Date().toISOString() }).eq("id", field.id)));
      let score = 25;
      score += reviewValues.merchant_name ? 10 : 0;
      score += Number(reviewValues.amount) > 0 ? 10 : 0;
      score += reviewValues.currency ? 5 : 0;
      score += reviewValues.charge_date ? 10 : 0;
      score += reviewValues.transaction_reference ? 10 : 0;
      score += reviewValues.product_name ? 5 : 0;
      const strengthLabel = score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Weak";
      const status = score >= 75 ? "ready" : "evidence_needed";
      const { error: caseError } = await client.from("cases").update({ merchant_name: reviewValues.merchant_name, amount: Number(reviewValues.amount), currency: reviewValues.currency.toUpperCase(), charge_date: reviewValues.charge_date, product_name: reviewValues.product_name || null, strength_score: score, strength_label: strengthLabel, urgency_label: "Check deadlines", status }).eq("id", caseRecord.id);
      if (caseError) throw caseError;
      const checklist = [
        { evidence_type: "proof_of_purchase", label: "Proof of purchase", status: "available", document_id: documents[0]?.id ?? null, importance: 3 },
        { evidence_type: "transaction_reference", label: "Transaction reference", status: reviewValues.transaction_reference ? "available" : "missing", document_id: reviewValues.transaction_reference ? documents[0]?.id ?? null : null, importance: 2 },
        { evidence_type: "seller_response", label: "Seller response", status: "missing", document_id: null, importance: 2 },
        ...(caseRecord.recovery_type === "subscription" && caseRecord.problem === "charged_after_cancellation" ? [{ evidence_type: "cancellation_confirmation", label: "Cancellation confirmation", status: "required", document_id: null, importance: 3 }] : []),
        ...(caseRecord.recovery_type === "online_purchase" && caseRecord.problem === "item_not_received" ? [{ evidence_type: "delivery_tracking", label: "Delivery or tracking evidence", status: "required", document_id: null, importance: 3 }] : []),
        ...(caseRecord.recovery_type === "online_purchase" && caseRecord.problem === "not_as_described" ? [{ evidence_type: "item_condition", label: "Photos showing the item condition", status: "required", document_id: null, importance: 3 }] : []),
      ].map((item) => ({ ...item, case_id: caseRecord.id, user_id: user.id }));
      await client.from("evidence_items").upsert(checklist, { onConflict: "case_id,evidence_type" });
      await client.from("case_events").insert({ case_id: caseRecord.id, user_id: user.id, event_type: "details_confirmed", title: "Transaction details confirmed", details: { strength_score: score, strength_label: strengthLabel } });
      setCaseRecord({ ...caseRecord, merchant_name: reviewValues.merchant_name, amount: Number(reviewValues.amount), currency: reviewValues.currency.toUpperCase(), charge_date: reviewValues.charge_date, strength_score: score, strength_label: strengthLabel, status });
      setSuccess(`Details confirmed. Evidence strength: ${score}/100 (${strengthLabel}).`);
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : "We could not confirm these details.");
    } finally { setConfirming(false); }
  }

  async function recalculateStrength(nextItems?: EvidenceItem[]) {
    if (!supabase || !caseRecord) return;
    let items = nextItems;
    if (!items) {
      const { data } = await supabase.from("evidence_items").select("id,evidence_type,label,status,importance,document_id").eq("case_id", caseRecord.id);
      items = (data as EvidenceItem[] | null) ?? evidenceItems;
      setEvidenceItems(items);
    }
    const available = new Set(items.filter((item) => item.status === "available").map((item) => item.evidence_type));
    let score = available.has("proof_of_purchase") || documents.length > 0 ? 25 : 0;
    score += caseRecord.merchant_name ? 10 : 0;
    score += caseRecord.amount && caseRecord.amount > 0 ? 10 : 0;
    score += caseRecord.currency ? 5 : 0;
    score += caseRecord.charge_date ? 10 : 0;
    score += available.has("transaction_reference") ? 10 : 0;
    score += caseRecord.product_name ? 5 : 0;
    score += available.has("seller_response") ? 10 : 0;
    score += available.has("cancellation_confirmation") || available.has("delivery_tracking") || available.has("item_condition") ? 15 : 0;
    score = Math.min(score, 100);
    const strengthLabel = score >= 75 ? "Strong" : score >= 50 ? "Developing" : "Weak";
    const status = score >= 75 ? "ready" : "evidence_needed";
    await supabase.from("cases").update({ strength_score: score, strength_label: strengthLabel, status }).eq("id", caseRecord.id);
    setCaseRecord({ ...caseRecord, strength_score: score, strength_label: strengthLabel, status });
  }

  async function setEvidenceStatus(item: EvidenceItem, status: EvidenceItem["status"]) {
    if (!supabase || !user || !caseRecord) return;
    setError("");
    const { error: itemError } = await supabase.from("evidence_items").update({ status, document_id: status === "available" ? item.document_id : null }).eq("id", item.id);
    if (itemError) { setError(itemError.message); return; }
    const nextItems = evidenceItems.map((current) => current.id === item.id ? { ...current, status, document_id: status === "available" ? current.document_id : null } : current);
    setEvidenceItems(nextItems);
    await supabase.from("case_events").insert({ case_id: caseRecord.id, user_id: user.id, event_type: "evidence_status_updated", title: `${item.label}: ${status.replaceAll("_", " ")}`, details: { evidence_type: item.evidence_type, status } });
    await recalculateStrength(nextItems);
  }

  async function generateRefundRequest() {
    if (!supabase || !caseRecord) return;
    setError(""); setSuccess(""); setGeneratingRequest(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Sign in again to generate your request.");
      const response = await fetch("/api/generate-refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` },
        body: JSON.stringify({ case_id: caseRecord.id }),
      });
      const result = await response.json().catch(() => ({})) as RefundDraft & { error?: string; route_summary: string; next_step: string };
      if (!response.ok) throw new Error(result.error || "We could not generate the refund request.");
      setRefundDraft(result);
      setSuccess("Your refund request is ready to review.");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "We could not generate the refund request.");
    } finally { setGeneratingRequest(false); }
  }

  async function saveDraft() {
    if (!supabase || !refundDraft) return;
    setError(""); setSavingDraft(true);
    const { error: draftError } = await supabase.from("messages").update({ subject: refundDraft.subject, body: refundDraft.body }).eq("id", refundDraft.id);
    if (draftError) setError(draftError.message);
    else setSuccess("Draft changes saved privately.");
    setSavingDraft(false);
  }

  async function copyDraft() {
    if (!refundDraft) return;
    await navigator.clipboard.writeText(`Subject: ${refundDraft.subject}\n\n${refundDraft.body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const routeActionUrl = refundDraft?.support_url || (caseRecord?.route === "apple" ? "https://reportaproblem.apple.com/" : caseRecord?.route === "google_play" ? "https://support.google.com/googleplay/" : null);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f8f6]"><p className="text-[#5c716a]">Opening your case…</p></main>;

  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />Dashboard</a></div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      {!caseRecord ? <div className="rounded-2xl border bg-white p-8"><h1 className="text-2xl font-semibold">Case unavailable</h1><p className="mt-3 text-[#677873]">{error}</p></div> : <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">{caseRecord.recovery_type === "online_purchase" ? "Online purchase recovery" : "Subscription recovery"}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{caseRecord.merchant_name || "Unidentified charge"}</h1><p className="mt-2 capitalize text-[#62736d]">{caseRecord.problem.replaceAll("_", " ")} · {caseRecord.status.replaceAll("_", " ")}</p></div><div className="rounded-2xl border bg-white px-5 py-3"><p className="text-xs text-[#71817c]">Amount disputed</p><p className="mt-1 text-xl font-semibold">{caseRecord.currency} {caseRecord.amount?.toFixed(2)}</p></div></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Evidence</h2><p className="mt-1 text-sm leading-6 text-[#6c7c77]">Add a receipt, invoice, order confirmation or transaction screenshot.</p>
            <input ref={fileInput} type="file" accept={allowedTypes.join(",")} onChange={uploadEvidence} className="hidden" />
            <button type="button" disabled={uploading} onClick={() => beginUpload("proof_of_purchase")} className="mt-6 grid w-full place-items-center rounded-2xl border-2 border-dashed border-[#b9cdc6] bg-[#f6faf8] px-5 py-10 text-center transition hover:border-[#72a18f] disabled:opacity-60"><span className="grid size-12 place-items-center rounded-2xl bg-[#e2f3ed] text-[#0b755a]"><UploadCloud className="size-6" /></span><span className="mt-4 font-semibold">{uploading ? "Uploading securely…" : "Choose evidence to upload"}</span><span className="mt-1 text-sm text-[#73837e]">JPG, PNG, WebP or PDF · maximum 10 MB</span></button>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{success}</p>}
            <div className="mt-7"><h3 className="font-semibold">Uploaded files</h3>{documents.length === 0 ? <p className="mt-3 rounded-xl bg-[#f7f9f8] px-4 py-5 text-sm text-[#71817c]">No evidence uploaded yet.</p> : <div className="mt-3 divide-y">{documents.map(document => <div key={document.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f2] text-[#0b755a]"><FileText className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{document.original_filename}</p><p className="mt-1 text-xs text-[#75857f]">{(document.size_bytes / 1024 / 1024).toFixed(2)} MB · <span className="capitalize">{document.processing_status}</span></p></div></div><div className="flex flex-wrap items-center justify-end"><Button variant="ghost" size="sm" disabled={uploading} onClick={() => extractDocument(document.id)}>{document.processing_status === "completed" ? "Read again" : "Read details"}</Button>{document.processing_status === "completed" && <Button variant="ghost" size="sm" onClick={() => useDocumentDetails(document.id)}>Use details</Button>}<Button variant="ghost" size="icon" onClick={() => downloadDocument(document)} aria-label={`Open ${document.original_filename}`}><Download className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => removeDocument(document)} aria-label={`Remove ${document.original_filename}`} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></Button></div></div>)}</div>}</div>
            {evidenceItems.length > 0 && <div className="mt-8"><h3 className="font-semibold">Evidence checklist</h3><p className="mt-1 text-sm text-[#71817c]">Continue even if you do not have every item.</p><div className="mt-3 space-y-3">{evidenceItems.map(item => <div key={item.id} className="rounded-xl border border-[#dfe7e4] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.label}</p><p className={`mt-1 text-xs font-semibold capitalize ${item.status === "available" ? "text-emerald-700" : item.status === "not_applicable" ? "text-[#71817c]" : "text-amber-700"}`}>{item.status.replaceAll("_", " ")}</p></div>{item.status === "available" && <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-4" /></span>}</div>{item.status !== "available" && item.status !== "not_applicable" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => beginUpload(item.evidence_type)} className="bg-[#0b6b53] hover:bg-[#095d49]"><UploadCloud className="mr-1.5 size-3.5" />Upload</Button><Button size="sm" variant="outline" onClick={() => setEvidenceStatus(item, "missing")}><X className="mr-1.5 size-3.5" />I don’t have this</Button><Button size="sm" variant="ghost" onClick={() => setEvidenceStatus(item, "not_applicable")}>Not applicable</Button></div>}</div>)}</div></div>}
          </section>
          <aside className="space-y-5"><section className="rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><FileSearch className="size-4 text-[#0b755a]" />Review details</h2>{uploading && <p className="mt-4 flex items-center gap-2 text-sm text-[#667a73]"><LoaderCircle className="size-4 animate-spin" />Reading document…</p>}{extractedFields.length === 0 && !uploading ? <p className="mt-3 text-sm leading-6 text-[#71817c]">Upload evidence to automatically identify transaction details.</p> : <div className="mt-4 space-y-3">{caseRecord.charge_date && reviewValues.charge_date && caseRecord.charge_date !== reviewValues.charge_date && <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />The extracted date differs from the date you entered. Please correct it before confirming.</p>}{reviewFieldNames.map((fieldName) => { const extracted = extractedFields.find(field => field.field_name === fieldName); return <label key={fieldName} className="block text-sm font-semibold capitalize">{fieldName.replaceAll("_", " ")} {extracted?.confidence !== null && extracted?.confidence !== undefined && <span className="float-right text-xs font-normal text-[#74857f]">{Math.round(extracted.confidence * 100)}% confidence</span>}<input type={fieldName === "charge_date" ? "date" : fieldName === "amount" ? "number" : "text"} step={fieldName === "amount" ? "0.01" : undefined} value={reviewValues[fieldName]} onChange={(event) => setReviewValues({ ...reviewValues, [fieldName]: fieldName === "currency" ? event.target.value.toUpperCase() : event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-[#d7e2de] bg-white px-3 font-normal outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label>})}<Button disabled={confirming} onClick={confirmDetails} className="mt-2 h-11 w-full rounded-xl bg-[#0b6b53] font-semibold hover:bg-[#095d49]"><ShieldCheck className="mr-2 size-4" />{confirming ? "Confirming…" : "Confirm details and assess case"}</Button></div>}</section>{caseRecord.strength_score !== null && <section className="rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5"><p className="text-sm font-semibold text-[#557068]">Evidence strength</p><div className="mt-2 flex items-end justify-between"><p className="text-3xl font-semibold text-[#155c49]">{caseRecord.strength_score}/100</p><p className="font-semibold text-[#155c49]">{caseRecord.strength_label}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#0b8062]" style={{ width: `${caseRecord.strength_score}%` }} /></div><p className="mt-3 text-sm leading-6 text-[#557068]">{caseRecord.recovery_type === "online_purchase" ? "Add seller messages, delivery records or item photos when relevant." : "Add cancellation proof or seller responses when relevant."}</p></section>}<section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Case details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-[#788782]">Recovery type</dt><dd className="mt-1 font-semibold">{caseRecord.recovery_type === "online_purchase" ? "Online purchase" : "Online subscription"}</dd></div><div><dt className="text-[#788782]">Charge date</dt><dd className="mt-1 font-semibold">{caseRecord.charge_date ? new Date(`${caseRecord.charge_date}T00:00:00`).toLocaleDateString() : "Not provided"}</dd></div><div><dt className="text-[#788782]">Current stage</dt><dd className="mt-1 capitalize font-semibold">{caseRecord.status.replaceAll("_", " ")}</dd></div></dl></section><section className="rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5"><p className="flex items-center gap-2 font-semibold text-[#155c49]"><LockKeyhole className="size-4" />Private evidence</p><p className="mt-2 text-sm leading-6 text-[#547068]">Files are stored in a private bucket. Only your signed-in account can access this case folder.</p></section></aside>
        </div>
        {caseRecord.strength_score !== null && caseRecord.paid_tier === "free" && <PayPalCheckout caseId={caseRecord.id} onPaid={() => { setCaseRecord({ ...caseRecord, paid_tier: "guided" }); setSuccess("Payment confirmed. Guided recovery is unlocked."); }} />}
        {caseRecord.strength_score !== null && caseRecord.paid_tier !== "free" && <section className="mt-6 rounded-2xl border bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Next action</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Refund request draft</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#667a73]">Generate a request from your confirmed case facts, review it, then copy it into the company’s official support channel.</p></div><Button disabled={generatingRequest} onClick={generateRefundRequest} className="h-11 rounded-xl bg-[#0b6b53] px-5 font-semibold hover:bg-[#095d49]"><Send className="mr-1 size-4" />{generatingRequest ? "Generating…" : refundDraft ? "Generate again" : "Generate my refund request"}</Button></div>
          {refundDraft ? <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-[#dce6e2] bg-[#fbfcfc] p-4 sm:p-5"><label className="text-sm font-semibold">Subject<input value={refundDraft.subject} onChange={(event) => setRefundDraft({ ...refundDraft, subject: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d7e2de] bg-white px-3 font-normal outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label><label className="mt-4 block text-sm font-semibold">Message<textarea value={refundDraft.body} onChange={(event) => setRefundDraft({ ...refundDraft, body: event.target.value })} rows={12} className="mt-2 w-full resize-y rounded-xl border border-[#d7e2de] bg-white p-3 font-normal leading-6 outline-none focus:border-[#0b8062] focus:ring-2 focus:ring-[#0b8062]/10" /></label><div className="mt-4 flex flex-wrap gap-2"><Button onClick={copyDraft} className="bg-[#0b6b53] hover:bg-[#095d49]"><Copy className="mr-1 size-4" />{copied ? "Copied" : "Copy request"}</Button><Button variant="outline" disabled={savingDraft} onClick={saveDraft}>{savingDraft ? "Saving…" : "Save changes"}</Button>{routeActionUrl && <Button variant="outline" asChild><a href={routeActionUrl} target="_blank" rel="noopener noreferrer">Open support page<ExternalLink className="ml-1 size-4" /></a></Button>}</div></div>
            <aside className="rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5"><h3 className="font-semibold text-[#155c49]">How to use it</h3><p className="mt-3 text-sm leading-6 text-[#557068]">{refundDraft.route_summary || `This draft is prepared for the ${caseRecord.route.replaceAll("_", " ")} route.`}</p><p className="mt-3 text-sm leading-6 text-[#557068]">{refundDraft.next_step || "Copy the request and submit it through the company’s official support channel."}</p><p className="mt-4 border-t border-[#cce0d8] pt-4 text-xs leading-5 text-[#60756e]">Review every detail before sending. MyResolveCenter saves a private draft but does not send it automatically.</p></aside>
          </div> : <div className="mt-6 rounded-2xl border border-dashed border-[#b9cdc6] bg-[#f6faf8] px-5 py-8 text-center"><FileText className="mx-auto size-7 text-[#0b755a]" /><p className="mt-3 font-semibold">Your confirmed facts are ready</p><p className="mt-1 text-sm text-[#71817c]">Generate a professional request without adding unsupported claims.</p></div>}
        </section>}
      </>}
    </div>
  </main>;
}
