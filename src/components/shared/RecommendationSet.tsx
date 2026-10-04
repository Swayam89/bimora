"use client";
import { useState } from "react";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import type { PlanOption, Recommendation } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/agent/profile";
import { cx, inr } from "@/lib/format";
import { track } from "@/lib/analytics";
import { DemoTag } from "@/components/ui/Bits";

const TIER: Record<PlanOption["tier"], string> = { recommended: "Recommended", alternative: "Alternative", another_option: "Another option" };

export function RecommendationSet({ rec, onChoose, compact, chooseLabel = "Continue with" }: { rec: Recommendation; onChoose?: (p: PlanOption) => void; compact?: boolean; chooseLabel?: string }) {
  const [open, setOpen] = useState(!compact);
  const [detail, setDetail] = useState<string | null>(rec.options[0]?.id ?? null);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-soft">Based on what you’ve told me</p>
          <p className="mt-2 text-[0.9rem] font-semibold text-ink">Your priorities</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {rec.priorities.map((p) => <li key={p} className="rounded-full bg-action-tint px-3 py-1 text-[0.82rem] font-medium text-action-ink">{PRIORITY_LABEL[p]}</li>)}
          </ul>
        </div>
        <DemoTag>Illustrative plans, not insurer quotes</DemoTag>
      </div>

      <div className="rounded-card border border-line bg-paper p-4 sm:p-5">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="font-semibold text-ink">Why Bimora recommends Plan A</span>
          <ChevronDown size={18} className={cx("shrink-0 text-soft transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <div className="mt-3 space-y-4 text-[0.94rem] leading-relaxed">
            <div>
              <p className="font-medium text-ink">Recommended because</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-body">{rec.recommendedBecause.map((r) => <li key={r}>{r}</li>)}</ol>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="font-medium text-ink">Facts I used</p><ul className="mt-1 space-y-1 text-body">{rec.basedOnFacts.map((f) => <li key={f}>· {f}</li>)}</ul></div>
              <div><p className="font-medium text-ink">Assumptions</p><ul className="mt-1 space-y-1 text-body">{rec.assumptions.map((f) => <li key={f}>· {f}</li>)}</ul></div>
            </div>
          </div>
        )}
      </div>

      <div className={cx("grid gap-3", !compact && "lg:grid-cols-3")}>
        {rec.options.map((p) => {
          const isRec = p.tier === "recommended";
          const expanded = detail === p.id;
          return (
            <article key={p.id} className={cx("flex flex-col rounded-card border bg-canvas p-4 sm:p-5", isRec ? "border-action ring-1 ring-action" : "border-line")}>
              <div className="flex items-center justify-between gap-2">
                <span className={cx("rounded-full px-2.5 py-1 text-[0.75rem] font-semibold", isRec ? "bg-action text-white" : "bg-paper text-soft")}>{TIER[p.tier]}</span>
                <span className="text-[0.82rem] text-soft">{p.premiumNote}</span>
              </div>
              <h3 className="mt-3 font-display text-[1.6rem] font-semibold leading-none text-ink">{p.label}</h3>
              <p className="mt-2 text-[0.94rem] leading-snug text-body">{p.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3 text-[0.86rem]">
                {p.attributes.map((a) => (<div key={a.label}><dt className="text-soft">{a.label}</dt><dd className="font-medium text-ink">{a.value}</dd></div>))}
                <div className="col-span-2"><dt className="text-soft">Illustrative premium</dt><dd className="font-medium text-ink">{inr(p.illustrativeAnnualPremium)} / year <span className="font-normal text-soft">(not a quote)</span></dd></div>
              </dl>
              <button type="button" onClick={() => { setDetail(expanded ? null : p.id); if (!expanded) track("recommendation_viewed", { plan_tier: p.tier }); }} aria-expanded={expanded} className="mt-4 inline-flex items-center gap-1.5 self-start text-[0.9rem] font-semibold text-action-ink">
                {expanded ? "Hide trade-offs" : "See trade-offs"}<ChevronDown size={16} className={cx("transition-transform", expanded && "rotate-180")} aria-hidden />
              </button>
              {expanded && (
                <div className="mt-3 space-y-3 text-[0.9rem]">
                  {isRec && (
                    <div><p className="font-semibold text-ink">Why it fits</p><ul className="mt-1 space-y-1">{p.whyItFits.map((w) => <li key={w} className="flex gap-2 text-body"><Check size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden />{w}</li>)}</ul></div>
                  )}
                  <div><p className="font-semibold text-ink">What you’re getting</p><ul className="mt-1 space-y-1">{p.gettingWhat.map((w) => <li key={w} className="flex gap-2 text-body"><Plus size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden />{w}</li>)}</ul></div>
                  <div><p className="font-semibold text-ink">What you’re giving up</p><ul className="mt-1 space-y-1">{p.givingUp.map((w) => <li key={w} className="flex gap-2 text-body"><Minus size={15} className="mt-0.5 shrink-0 text-gap" aria-hidden />{w}</li>)}</ul></div>
                </div>
              )}
              {onChoose && (
                <button type="button" onClick={() => onChoose(p)} className={cx("mt-5 min-h-[48px] w-full rounded-control font-semibold transition-colors", isRec ? "bg-action text-white hover:bg-action-hover" : "border border-ink/15 text-ink hover:border-ink/40")}>
                  {chooseLabel} {p.label}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
