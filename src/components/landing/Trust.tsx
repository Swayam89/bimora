"use client";
import { useState } from "react";
import { ArrowRight, CalendarClock, Check, FileCheck2, FileText, Headset, MessageSquareWarning, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { GUARDRAIL_COPY } from "@/config/bimora-agent";
import { AdvisorDialog } from "@/components/shared/AdvisorDialog";
import { SectionHead } from "@/components/ui/Bits";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { Logo } from "@/components/ui/Logo";

export function FollowUp() {
  const status = [
    { icon: CalendarClock, big: "42 days", label: "until renewal", tone: "text-action" },
    { icon: FileText, big: "1", label: "medical document pending", tone: "text-gap" },
    { icon: MessageSquareWarning, big: "1", label: "insurer clarification required", tone: "text-gap" },
    { icon: FileCheck2, big: "Stored", label: "policy document", tone: "text-ok" },
  ];
  const timeline = [
    { when: "Today", what: "Policy purchased", done: true },
    { when: "Next week", what: "Medical document", done: false },
    { when: "In 42 days", what: "Renewal reminder", done: false },
  ];
  return (
    <section aria-labelledby="follow-title" className="bg-paper py-20 sm:py-28">
      <div className="page-x">
        <SectionHead id="follow-title" eyebrow="After you buy" title="Insurance doesn’t end when you buy the policy." body="Bimora keeps track of what’s pending and what’s coming, and reminds you on WhatsApp, SMS or a call." />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <ul className="grid grid-cols-2 gap-3">
            {status.map((s) => (
              <li key={s.label} className="rounded-card border border-line bg-canvas p-5">
                <s.icon size={20} className={s.tone} aria-hidden />
                <p className="mt-4 font-display text-[2rem] font-semibold leading-none text-ink">{s.big}</p>
                <p className="mt-1.5 text-[0.92rem] text-body">{s.label}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-card border border-line bg-canvas p-6">
            <p className="font-semibold text-ink">What happens next</p>
            <ol className="relative mt-6 space-y-7 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-line">
              {timeline.map((t) => (
                <li key={t.what} className="relative flex gap-4 pl-0">
                  <span className={t.done ? "z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok text-white" : "z-10 h-6 w-6 shrink-0 rounded-full border-[3px] border-action bg-canvas"}>{t.done && <Check size={14} aria-hidden />}</span>
                  <div><p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-soft">{t.when}</p><p className="mt-0.5 font-medium text-ink">{t.done ? "" : "→ "}{t.what}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Advisor() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="advisor-title" className="py-20 sm:py-28">
      <div className="page-x">
        <div className="grid items-center gap-10 rounded-sheet border border-line p-6 sm:p-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <Headset size={28} className="text-action" aria-hidden />
            <h2 id="advisor-title" className="mt-5 font-display text-display-md text-ink text-balance">And when things get complicated, a human steps in.</h2>
            <p className="mt-4 max-w-2xl text-[1.06rem] leading-relaxed text-body">Bimora handles the structured work. Ditto advisors step in when a situation needs judgment, clarification or human help, like an unclear medical history or a claim that went wrong.</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Button size="lg" variant="dark" onClick={() => setOpen(true)}>Talk to a Ditto advisor</Button>
            <p className="text-[0.85rem] text-soft lg:text-right">Advisors get your full context, so you don’t repeat yourself.</p>
          </div>
        </div>
      </div>
      <AdvisorDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

export function Guardrails() {
  return (
    <section aria-labelledby="guard-title" className="bg-night py-20 sm:py-28">
      <div className="page-x">
        <SectionHead dark id="guard-title" eyebrow="Guardrails" title="Built to be careful with your insurance." />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-sheet bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {GUARDRAIL_COPY.map((g, i) => (
            <li key={g.title} className={i === 0 ? "bg-night p-6 sm:p-8 lg:row-span-1" : "bg-night p-6 sm:p-8"}>
              <p className="font-display text-[0.95rem] text-[#8FC3F0]">0{i + 1}</p>
              <h3 className="mt-3 text-[1.2rem] font-semibold text-white">{g.title}</h3>
              <p className="mt-2 leading-relaxed text-[#B7C5D3]">{g.body}</p>
            </li>
          ))}
          <li className="flex flex-col justify-end bg-[#16293A] p-6 sm:p-8">
            <p className="text-[0.95rem] leading-relaxed text-[#D9E2EA]">In this build, approval before payment and a separate issuance check are enforced in code, not just written in a prompt.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

const FAQS = [
  ["What is Bimora?", "Bimora is Ditto’s AI insurance agent that helps you understand your insurance needs before recommending policies."],
  ["Does Bimora only recommend the cheapest policy?", "No. Bimora considers the factors that matter to your situation, not just premium. If a cheaper plan exists, it tells you what that plan leaves out."],
  ["Can Bimora read my existing policy?", "Where supported, yes. Upload a policy and Bimora can help explain the information available in it. In this demo, document reading is simulated and labelled as a sample."],
  ["Does Bimora replace Ditto advisors?", "No. Complex cases can be escalated to a human advisor, who picks up with your full context."],
  ["Will Bimora buy insurance automatically?", "No. Major actions require your explicit approval. You see the exact plan and amount before anything is paid."],
  ["Is payment the same as policy issuance?", "No. Policy issuance is verified separately with the insurer. Bimora tells you you’re covered only once the insurer confirms it."],
];

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-20 sm:py-28">
      <div className="page-x grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <SectionHead id="faq-title" eyebrow="FAQ" title="Questions people ask first." />
        <div className="border-t border-line">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.1rem] font-semibold text-ink hover:text-action [&::-webkit-details-marker]:hidden">
                {q}<Plus size={20} className="shrink-0 text-soft transition-transform group-open:rotate-45" aria-hidden />
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-body">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section aria-labelledby="final-title" className="px-4 pb-20 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-page rounded-sheet bg-action-tint px-6 py-14 text-center sm:px-10 sm:py-20">
        <h2 id="final-title" className="mx-auto max-w-3xl font-display text-display-lg text-ink text-balance">Your insurance should make sense before you buy it.</h2>
        <p className="mx-auto mt-5 max-w-xl text-[1.1rem] leading-relaxed text-body">Tell Bimora what you’re trying to protect. We’ll start there.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/start?intent=cover" size="lg" onClick={() => track("hero_cta_clicked", { cta: "find_coverage", location: "final" })}>Find My Best Coverage<ArrowRight size={18} aria-hidden /></ButtonLink>
          <a href="#policy" className={buttonClass("secondary", "lg")}><Upload size={18} aria-hidden />Upload My Policy</a>
        </div>
        <p className="mt-5 text-[0.92rem] text-soft">Free to get started.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-12">
      <div className="page-x grid gap-8 md:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <Logo />
          <p className="mt-4 text-[0.88rem] leading-relaxed text-soft">
            Bimora is a product concept proposed for Ditto. It is not a live Ditto product and is not affiliated with or endorsed by Ditto. All plans, prices and policy details shown are illustrative demo data, not offers or quotes from any insurer.
          </p>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-soft">
            Recommendations depend on the information available and are not a substitute for reading the policy wording. Insurance is subject to the insurer’s terms and underwriting. [Regulatory disclosures, intermediary registration details and grievance contacts: to be supplied by Ditto’s compliance team.]
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.92rem] md:flex-col">
          <Link href="/privacy" className="py-1 font-medium text-ink hover:text-action">Privacy</Link>
          <Link href="/terms" className="py-1 font-medium text-ink hover:text-action">Terms</Link>
          <a href="#faq" className="py-1 font-medium text-ink hover:text-action">FAQ</a>
          <Link href="/start?intent=cover" className="py-1 font-medium text-ink hover:text-action">Get started</Link>
        </nav>
      </div>
    </footer>
  );
}
