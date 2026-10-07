import type { Metadata } from "next";
import { ArrowRight, Route } from "lucide-react";
import { problemGuides } from "@/lib/problem-guides";
import { refundGuides } from "@/lib/refund-guides";

export const metadata: Metadata = {
  title: "Online Refund Help Guides",
  description: "Practical refund guides for subscriptions, undelivered orders, damaged items, duplicate charges, returns and missing online-purchase refunds.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const subscriptionGuides = problemGuides.filter((guide) => guide.category === "subscription");
  const purchaseGuides = problemGuides.filter((guide) => guide.category === "online_purchase");
  const guideCards = (guides: typeof problemGuides) => <div className="mt-7 grid gap-4 md:grid-cols-2">{guides.map((guide) => <a key={guide.slug} href={`/guides/${guide.slug}`} className="group rounded-2xl border border-[#dce6e2] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8db5a7] hover:shadow-md"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0b8062]">{guide.eyebrow}</p><h2 className="mt-2 text-xl font-semibold">{guide.title}</h2><p className="mt-3 leading-7 text-[#5b6d67]">{guide.description}</p><span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#0b6b53]">Read guide <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></a>)}</div>;
  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/#assessment" className="text-sm font-semibold text-[#0b6b53]">Check my charge</a></div></header>
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Refund help by problem</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Understand your next step before you submit a refund request.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5b6d67]">Choose what happened to see the evidence to collect, common mistakes to avoid and a clear recovery process.</p>
      <section className="mt-12"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Company guides</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Refund and cancellation routes by company</h2><p className="mt-4 max-w-2xl leading-7 text-[#5b6d67]">Choose the company that billed you to find its official support route, the steps to follow and the evidence to prepare.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{refundGuides.map((guide) => <a key={guide.slug} href={`/refunds/${guide.slug}`} className="group rounded-2xl border border-[#dce6e2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8db5a7] hover:shadow-md"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#0b8062]">{guide.name}</p><h3 className="mt-2 text-lg font-semibold">{guide.title}</h3><span className="mt-4 inline-flex items-center gap-2 font-semibold text-[#0b6b53]">View company guide <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></a>)}</div></section>
      <section className="mt-16"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Online subscriptions</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Subscription and renewal problems</h2>{guideCards(subscriptionGuides)}</section>
      <section className="mt-16"><p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Online purchases</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Orders, deliveries, returns and shopping refunds</h2>{guideCards(purchaseGuides)}</section>
    </div>
  </main>;
}
