"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Bell, FileText, Users } from "lucide-react";
import { cx } from "@/lib/format";

export function Insight() {
  const oldWay = ["Budget", "Policy", "Fine print", "Confusion"];
  const newWay = ["Family", "Needs", "Gaps", "Options", "Decision"];
  return (
    <section id="why" aria-labelledby="insight-title" className="bg-paper py-20 sm:py-28">
      <div className="page-x">
        <p className="eyebrow">The core idea</p>
        <h2 id="insight-title" className="mt-4 max-w-4xl font-display text-display-lg text-ink text-balance">
          Insurance gets easier when you start with the person, not the policy.
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <figure className="rounded-card border border-line bg-canvas p-6 sm:p-8">
            <figcaption className="text-[0.9rem] font-semibold text-soft">Most people start with</figcaption>
            <blockquote className="mt-3 font-display text-[1.7rem] leading-snug text-soft sm:text-[2rem]">&ldquo;How much cover should I buy?&rdquo;</blockquote>
          </figure>
          <figure className="rounded-card border border-ink bg-canvas p-6 sm:p-8">
            <figcaption className="text-[0.9rem] font-semibold text-action-ink">Bimora starts with</figcaption>
            <blockquote className="mt-3 font-display text-[1.7rem] leading-snug text-ink sm:text-[2rem]">&ldquo;Who are we protecting, what do you already have and what could leave you exposed?&rdquo;</blockquote>
          </figure>
        </div>
        <div className="mt-14 space-y-8">
          <div>
            <p className="text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-soft">Old way</p>
            <ol className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              {oldWay.map((s, i) => (
                <li key={s} className="flex items-center gap-2 sm:gap-3">
                  <span className={cx("rounded-full border px-4 py-2 text-[0.95rem]", i === oldWay.length - 1 ? "border-danger/30 bg-danger-tint text-danger" : "border-line-strong text-soft")}>{s}</span>
                  {i < oldWay.length - 1 && <ArrowRight size={16} className="text-line-strong" aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-action-ink">Bimora</p>
            <ol className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              {newWay.map((s, i) => (
                <li key={s} className="flex items-center gap-2 sm:gap-3">
                  <span className={cx("rounded-full px-4 py-2 text-[0.95rem] font-semibold", i === newWay.length - 1 ? "bg-ink text-white" : "bg-canvas text-ink ring-1 ring-ink/15")}>{s}</span>
                  {i < newWay.length - 1 && <ArrowRight size={16} className="text-action" aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

const STAGES = [
  { n: "01", title: "Understand you", body: "Bimora learns about your family, existing insurance, relevant health information, financial responsibilities and preferences." },
  { n: "02", title: "Find the gaps", body: "Bimora identifies where your current protection may fall short." },
  { n: "03", title: "Read your policies", body: "Upload an existing policy and Bimora explains what it covers, what it doesn’t and which conditions matter." },
  { n: "04", title: "Compare what matters", body: "Coverage, exclusions, waiting periods, co-payments, deductibles, room restrictions, underwriting requirements and premium." },
  { n: "05", title: "Recommend", body: "Bimora recommends a small number of suitable options and explains the trade-offs." },
  { n: "06", title: "Get things done", body: "If something is missing, Bimora creates the next action: a document, a medical report, a clarification or an insurer follow-up." },
  { n: "07", title: "Stay protected", body: "Bimora remembers policies, renewal dates, pending actions and changes in the household." },
];

function StageVisual({ i }: { i: number }) {
  const row = "flex items-center gap-2.5 rounded-control border border-line bg-canvas px-3 py-2.5 text-[0.9rem] text-ink";
  switch (i) {
    case 0: return (
      <div className="flex flex-wrap gap-2">{["You · 34", "Spouse · 32", "Child · 5", "Father · 63", "Mother · 59"].map((m) => <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[0.9rem] text-ink ring-1 ring-line"><Users size={14} className="text-soft" aria-hidden />{m}</span>)}</div>
    );
    case 1: return (
      <div className="space-y-2">{["Employer cover ends with the job", "Parents not covered", "Waiting period still running"].map((g) => <div key={g} className={row}><AlertCircle size={16} className="text-gap" aria-hidden />{g}</div>)}</div>
    );
    case 2: return (
      <div className="rounded-control border border-line bg-canvas p-3.5"><div className="flex items-center gap-2 font-medium text-ink"><FileText size={16} aria-hidden />Health_Policy.pdf</div>
        <div className="mt-3 space-y-1.5 text-[0.86rem]">{[["Covered", "Hospitalisation, day care"], ["Waiting", "Pre-existing: ~20 months left"], ["Not covered", "Outpatient visits"]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><span className="text-soft">{k}</span><span className="text-right text-ink">{v}</span></div>)}</div></div>
    );
    case 3: return (
      <div className="overflow-hidden rounded-control border border-line bg-canvas text-[0.85rem]">
        {[["", "Plan A", "Plan B"], ["Co-pay", "None", "20%"], ["Room", "No cap", "1%/day"], ["Wait", "2 yrs", "3 yrs"]].map((r, ri) => (
          <div key={ri} className={cx("grid grid-cols-3 gap-2 px-3 py-2", ri === 0 ? "bg-paper font-semibold text-ink" : "border-t border-line text-body")}>{r.map((c, ci) => <span key={ci} className={ci === 0 ? "text-soft" : ""}>{c}</span>)}</div>
        ))}
      </div>
    );
    case 4: return (
      <div className="rounded-control border border-action bg-canvas p-3.5 ring-1 ring-action"><span className="rounded-full bg-action px-2.5 py-1 text-[0.75rem] font-semibold text-white">Recommended</span><p className="mt-2 font-display text-[1.4rem] font-semibold text-ink">Plan A</p><p className="text-[0.88rem] text-body">Fits your household. You give up: a higher premium than Plan B.</p></div>
    );
    case 5: return (
      <div className="space-y-2">{[["Medical report", "Waiting on you"], ["Insurer clarification", "Bimora is on it"]].map(([a, b]) => <div key={a} className={cx(row, "justify-between")}><span>{a}</span><span className="text-[0.8rem] text-soft">{b}</span></div>)}</div>
    );
    default: return (
      <div className={cx(row, "justify-between")}><span className="flex items-center gap-2"><Bell size={16} className="text-action" aria-hidden />Renewal</span><span className="font-semibold">42 days</span></div>
    );
  }
}

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <section id="how" aria-labelledby="how-title" className="py-20 sm:py-28">
      <div className="page-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">How Bimora works</p>
          <h2 id="how-title" className="mt-4 font-display text-display-lg text-ink text-balance">Seven steps, in the order a good advisor would take them.</h2>
          <div className="mt-10 hidden rounded-sheet bg-paper p-6 lg:block" aria-hidden>
            <p className="font-display text-[4.5rem] font-semibold leading-none text-ink/15">{STAGES[active].n}</p>
            <p className="mt-2 font-semibold text-ink">{STAGES[active].title}</p>
            <div key={active} className="mt-5 animate-rise"><StageVisual i={active} /></div>
          </div>
        </div>
        <ol className="relative space-y-3 lg:space-y-6">
          {STAGES.map((s, i) => (
            <li key={s.n} ref={(el) => { refs.current[i] = el; }} data-i={i}
              className={cx("rounded-card border p-5 transition-colors duration-300 sm:p-6 lg:min-h-[150px]", active === i ? "border-ink bg-canvas" : "border-line bg-canvas lg:border-transparent")}>
              <div className="flex items-baseline gap-4">
                <span className={cx("font-display text-[1.1rem] font-semibold", active === i ? "text-action" : "text-soft")}>{s.n}</span>
                <div>
                  <h3 className="font-display text-[1.6rem] font-medium leading-tight text-ink">{s.title}</h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-body">{s.body}</p>
                  {i === 3 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="What Bimora compares">
                      {["Coverage", "Exclusions", "Waiting periods", "Co-payments", "Deductibles", "Room restrictions", "Underwriting", "Premium"].map((t) => <li key={t} className="rounded-full border border-line px-2.5 py-1 text-[0.8rem] text-ink">{t}</li>)}
                    </ul>
                  )}
                  <div className="mt-4 lg:hidden"><StageVisual i={i} /></div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
