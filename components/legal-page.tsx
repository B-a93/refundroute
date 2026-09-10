import { ArrowLeft, Route } from "lucide-react";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f4f8f6] text-[#13231f]">
    <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-5xl items-center justify-between px-5 sm:px-8"><a href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#0b6b53] text-white"><Route className="size-5" /></span>MyResolveCenter</a><a href="/" className="flex items-center gap-2 text-sm font-semibold text-[#587069] hover:text-[#0b6b53]"><ArrowLeft className="size-4" />Home</a></div></header>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[.13em] text-[#0b8062]">Last updated 10 September 2026</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-[#566a63]">{intro}</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-[#435850] [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-.025em] [&_h2]:text-[#13231f] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </article>
  </main>;
}
