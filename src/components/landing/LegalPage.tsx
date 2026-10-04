import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
export function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line"><div className="page-x flex h-16 items-center"><Logo /></div></header>
      <main className="page-x max-w-3xl py-12">
        <p className="rounded-control border border-gap-line bg-gap-tint px-4 py-3 text-[0.92rem] text-gap">Placeholder. Final legal copy must be written and approved by Ditto’s legal and compliance teams before launch.</p>
        <h1 className="mt-8 font-display text-display-md text-ink">{title}</h1>
        <div className="mt-8 space-y-8">
          {sections.map(([h, b]) => (<section key={h}><h2 className="font-semibold text-ink">{h}</h2><p className="mt-2 leading-relaxed text-body">{b}</p></section>))}
        </div>
        <Link href="/" className="mt-12 inline-block font-semibold text-action-ink">Back to home</Link>
      </main>
    </div>
  );
}
