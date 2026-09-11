import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Route } from "lucide-react";
import { getProblemGuide, problemGuides } from "@/lib/problem-guides";

export function generateStaticParams() {
  return problemGuides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getProblemGuide((await params).slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${guide.slug}` }, openGraph: { type: "article", title: guide.title, description: guide.description, url: `/guides/${guide.slug}` } };
}

export default async function ProblemGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getProblemGuide((await params).slug);
  if (!guide) notFound();
  const url = `https://myresolvecenter.com/guides/${guide.slug}`;
  const structuredData = [{ "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, dateModified: guide.updatedAt, mainEntityOfPage: url, publisher: { "@type": "Organization", name: "MyResolveCenter", url: "https://myresolvecenter.com" } }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: guide.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }];

  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/guides" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />All guides</a></div></header>
    <article className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">{guide.eyebrow} guide</p><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{guide.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#5b6d67]">{guide.description}</p>
      <div className="mt-8 rounded-2xl border border-[#cce0d8] bg-[#eef8f4] p-5 leading-7 text-[#245b4c]">{guide.summary}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]"><section className="rounded-2xl border bg-white p-6 sm:p-8"><h2 className="text-2xl font-semibold">Steps to take</h2><ol className="mt-6 space-y-5">{guide.steps.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0b6b53] text-sm font-bold text-white">{index + 1}</span><p className="pt-1 leading-7 text-[#4f635d]">{step}</p></li>)}</ol></section><aside className="space-y-5"><section className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><FileCheck2 className="size-5 text-[#0b755a]" />Evidence to collect</h2><ul className="mt-5 space-y-3">{guide.evidence.map((item) => <li key={item} className="flex gap-3 text-[#536760]"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#0b8062]" />{item}</li>)}</ul></section><section className="rounded-2xl border border-[#eadcbc] bg-[#fffaf0] p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><AlertTriangle className="size-5 text-[#a36a13]" />Mistakes to avoid</h2><ul className="mt-5 space-y-3">{guide.avoid.map((item) => <li key={item} className="text-[#665d4c]">{item}</li>)}</ul></section></aside></div>
      <section className="mt-8 rounded-2xl border bg-white p-6 sm:p-8"><h2 className="text-2xl font-semibold">Common questions</h2><div className="mt-5 divide-y">{guide.faqs.map((faq) => <details key={faq.question} className="py-4"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 max-w-3xl leading-7 text-[#5b6d67]">{faq.answer}</p></details>)}</div></section>
      <section className="mt-8 rounded-2xl bg-[#102d25] p-6 text-white sm:p-8"><h2 className="text-2xl font-semibold">Check your own case</h2><p className="mt-3 max-w-2xl leading-7 text-[#bfd4cd]">Enter your charge details and organize your evidence without connecting your bank account.</p><a href="/#assessment" className="mt-5 inline-flex items-center gap-2 font-semibold text-[#8de0c6]">Start free assessment <ArrowRight className="size-4" /></a></section>
      <p className="mt-8 border-t pt-6 text-sm leading-6 text-[#677873]">Last reviewed {new Date(`${guide.updatedAt}T00:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. General information only; refund eligibility and deadlines depend on the seller, payment route and location.</p>
    </article>
  </main>;
}
