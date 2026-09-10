import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Route } from "lucide-react";
import { getRefundGuide, refundGuides } from "@/lib/refund-guides";

export function generateStaticParams() {
  return refundGuides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getRefundGuide((await params).slug);
  if (!guide) return {};
  return {
    title: `${guide.title} | MyResolveCenter`,
    description: guide.description,
    alternates: { canonical: `/refunds/${guide.slug}` },
  };
}

export default async function RefundGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getRefundGuide((await params).slug);
  if (!guide) notFound();

  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/#supported" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />All companies</a></div></header>
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">{guide.name} refund guide</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{guide.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5b6d67]">{guide.description}</p>
      <div className="mt-8 rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5 text-[#245b4c]"><p className="font-semibold">Start with the correct payment route</p><p className="mt-2 leading-7">{guide.routeNote}</p></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <section className="rounded-2xl border bg-white p-6 sm:p-8"><h2 className="text-2xl font-semibold">What to do</h2><ol className="mt-6 space-y-5">{guide.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0b6b53] text-sm font-bold text-white">{index + 1}</span><p className="pt-1 leading-7 text-[#4f635d]">{step}</p></li>)}</ol><a href={guide.actionUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b6b53] px-5 font-semibold text-white hover:bg-[#095d49]">{guide.actionLabel}<ExternalLink className="size-4" /></a></section>
        <aside className="space-y-5"><section className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><FileCheck2 className="size-5 text-[#0b755a]" />What to prepare</h2><ul className="mt-5 space-y-3">{guide.prepare.map((item) => <li key={item} className="flex gap-3 text-[#536760]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0b8062]" />{item}</li>)}</ul></section><section className="rounded-2xl bg-[#102d25] p-6 text-white"><h2 className="text-xl font-semibold">Build your case</h2><p className="mt-3 leading-7 text-[#bfd4cd]">Check your evidence and generate a request using your own transaction details.</p><a href="/#top" className="mt-5 inline-flex items-center gap-2 font-semibold text-[#8de0c6]">Start free assessment<ArrowRight className="size-4" /></a></section></aside>
      </div>
      <div className="mt-8 border-t pt-6 text-sm leading-6 text-[#677873]"><p>Guidance checked against the company source on 10 September 2026. Policies and eligibility can vary by purchase, location and payment route.</p><a href={guide.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0b6b53]">{guide.sourceLabel}<ExternalLink className="size-3.5" /></a></div>
    </div>
  </main>;
}
