"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Download, FileSearch, FileText, LoaderCircle, LockKeyhole, Route, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type CaseRecord = {
  id: string;
  merchant_name: string | null;
  problem: string;
  status: string;
  amount: number | null;
  currency: string | null;
  charge_date: string | null;
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

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxSize = 10 * 1024 * 1024;

export default function CasePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCase = useCallback(async () => {
    if (!supabase) { window.location.replace("/auth"); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { window.location.replace("/auth"); return; }
    setUser(sessionData.session.user);

    const [{ data: caseData, error: caseError }, { data: documentData, error: documentError }, { data: fieldData }] = await Promise.all([
      supabase.from("cases").select("id,merchant_name,problem,status,amount,currency,charge_date").eq("id", params.id).single(),
      supabase.from("documents").select("id,original_filename,content_type,size_bytes,object_path,processing_status,created_at").eq("case_id", params.id).order("created_at", { ascending: false }),
      supabase.from("extracted_fields").select("id,document_id,field_name,field_value,confidence").eq("case_id", params.id).order("created_at"),
    ]);
    if (caseError) setError(caseError.code === "PGRST116" ? "This case does not exist or you do not have access to it." : caseError.message);
    else setCaseRecord(caseData as CaseRecord);
    if (documentError) setError(documentError.message);
    setDocuments((documentData as DocumentRecord[] | null) ?? []);
    setExtractedFields((fieldData as ExtractedField[] | null) ?? []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { void loadCase(); }, [loadCase]);

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
        category: "proof_of_purchase",
      }).select("id").single();
      if (documentError) {
        await supabase.storage.from("case-evidence").remove([objectPath]);
        throw documentError;
      }
      await supabase.from("case_events").insert({ case_id: caseRecord.id, user_id: user.id, event_type: "evidence_uploaded", title: "Evidence uploaded", details: { filename: file.name } });
      setSuccess("Evidence uploaded securely. Reading its details…");
      const { error: extractionError } = await supabase.functions.invoke("extract-evidence", { body: { document_id: savedDocument.id } });
      setSuccess(extractionError ? "Evidence uploaded. Automatic reading is not configured yet." : "Evidence uploaded and details extracted.");
      await loadCase();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We could not upload this file.");
    } finally { setUploading(false); }
  }

  async function extractDocument(documentId: string) {
    if (!supabase) return;
    setError(""); setSuccess(""); setUploading(true);
    const { error: extractionError } = await supabase.functions.invoke("extract-evidence", { body: { document_id: documentId } });
    if (extractionError) setError("Automatic reading is not available yet. Your uploaded file is safe.");
    else { setSuccess("Document details extracted."); await loadCase(); }
    setUploading(false);
  }

  async function downloadDocument(document: DocumentRecord) {
    if (!supabase) return;
    setError("");
    const { data, error: signedUrlError } = await supabase.storage.from("case-evidence").createSignedUrl(document.object_path, 60);
    if (signedUrlError) { setError(signedUrlError.message); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f4f8f6]"><p className="text-[#5c716a]">Opening your case…</p></main>;

  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>RefundRoute</a><a href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />Dashboard</a></div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      {!caseRecord ? <div className="rounded-2xl border bg-white p-8"><h1 className="text-2xl font-semibold">Case unavailable</h1><p className="mt-3 text-[#677873]">{error}</p></div> : <>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Recovery case</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{caseRecord.merchant_name || "Unidentified charge"}</h1><p className="mt-2 capitalize text-[#62736d]">{caseRecord.problem.replaceAll("_", " ")} · {caseRecord.status.replaceAll("_", " ")}</p></div><div className="rounded-2xl border bg-white px-5 py-3"><p className="text-xs text-[#71817c]">Amount disputed</p><p className="mt-1 text-xl font-semibold">{caseRecord.currency} {caseRecord.amount?.toFixed(2)}</p></div></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-semibold">Evidence</h2><p className="mt-1 text-sm leading-6 text-[#6c7c77]">Add a receipt, invoice, order confirmation or transaction screenshot.</p>
            <input ref={fileInput} type="file" accept={allowedTypes.join(",")} onChange={uploadEvidence} className="hidden" />
            <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="mt-6 grid w-full place-items-center rounded-2xl border-2 border-dashed border-[#b9cdc6] bg-[#f6faf8] px-5 py-10 text-center transition hover:border-[#72a18f] disabled:opacity-60"><span className="grid size-12 place-items-center rounded-2xl bg-[#e2f3ed] text-[#0b755a]"><UploadCloud className="size-6" /></span><span className="mt-4 font-semibold">{uploading ? "Uploading securely…" : "Choose evidence to upload"}</span><span className="mt-1 text-sm text-[#73837e]">JPG, PNG, WebP or PDF · maximum 10 MB</span></button>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{success}</p>}
            <div className="mt-7"><h3 className="font-semibold">Uploaded files</h3>{documents.length === 0 ? <p className="mt-3 rounded-xl bg-[#f7f9f8] px-4 py-5 text-sm text-[#71817c]">No evidence uploaded yet.</p> : <div className="mt-3 divide-y">{documents.map(document => <div key={document.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f2] text-[#0b755a]"><FileText className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{document.original_filename}</p><p className="mt-1 text-xs text-[#75857f]">{(document.size_bytes / 1024 / 1024).toFixed(2)} MB · <span className="capitalize">{document.processing_status}</span></p></div></div><div className="flex items-center"><Button variant="ghost" size="sm" disabled={uploading} onClick={() => extractDocument(document.id)}>{document.processing_status === "completed" ? "Read again" : "Read details"}</Button><Button variant="ghost" size="icon" onClick={() => downloadDocument(document)} aria-label={`Open ${document.original_filename}`}><Download className="size-4" /></Button></div></div>)}</div>}</div>
          </section>
          <aside className="space-y-5"><section className="rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><FileSearch className="size-4 text-[#0b755a]" />Details found</h2>{uploading && <p className="mt-4 flex items-center gap-2 text-sm text-[#667a73]"><LoaderCircle className="size-4 animate-spin" />Reading document…</p>}{extractedFields.length === 0 && !uploading ? <p className="mt-3 text-sm leading-6 text-[#71817c]">Upload evidence to automatically identify transaction details.</p> : <dl className="mt-4 divide-y">{extractedFields.filter(field => field.field_value).map(field => <div key={field.id} className="py-3"><dt className="text-xs capitalize text-[#788782]">{field.field_name.replaceAll("_", " ")}</dt><dd className="mt-1 flex items-center justify-between gap-3 text-sm font-semibold"><span>{field.field_value}</span>{field.confidence !== null && <span className="text-xs font-normal text-[#74857f]">{Math.round(field.confidence * 100)}%</span>}</dd></div>)}</dl>}</section><section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Case details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-[#788782]">Charge date</dt><dd className="mt-1 font-semibold">{caseRecord.charge_date ? new Date(`${caseRecord.charge_date}T00:00:00`).toLocaleDateString() : "Not provided"}</dd></div><div><dt className="text-[#788782]">Current stage</dt><dd className="mt-1 capitalize font-semibold">{caseRecord.status.replaceAll("_", " ")}</dd></div></dl></section><section className="rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5"><p className="flex items-center gap-2 font-semibold text-[#155c49]"><LockKeyhole className="size-4" />Private evidence</p><p className="mt-2 text-sm leading-6 text-[#547068]">Files are stored in a private bucket. Only your signed-in account can access this case folder.</p></section></aside>
        </div>
      </>}
    </div>
  </main>;
}
