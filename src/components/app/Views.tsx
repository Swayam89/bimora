"use client";
import { useState } from "react";
import { AlertCircle, Baby, CalendarClock, Check, CircleDashed, FileText, HeartPulse, MessageCircle, Scale, Upload, User } from "lucide-react";
import { useApp } from "./store";
import { buildGaps } from "@/lib/agent/analysis";
import { MEMBER_LABEL } from "@/lib/agent/profile";
import { progress } from "@/lib/agent/questions";
import { DEMO_PLANS, DEMO_POLICIES } from "@/lib/mock/data";
import type { Action, IssuanceStatus, Policy } from "@/lib/types";
import { cx, daysUntil, inr, shortDate } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { DemoTag, Pill } from "@/components/ui/Bits";
import { PolicySummary } from "@/components/shared/PolicySummary";
import { RecommendationSet } from "@/components/shared/RecommendationSet";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

const ISS: Record<IssuanceStatus, { tone: "ok" | "pending" | "danger" | "neutral"; label: string }> = {
  issued: { tone: "ok", label: "Issued" }, processing: { tone: "pending", label: "Issuance processing" }, requires_action: { tone: "pending", label: "Needs action" },
  rejected: { tone: "danger", label: "Not issued" }, unknown: { tone: "neutral", label: "Issuance not verified" },
};

function ViewHead({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-[2rem] font-medium leading-tight text-ink">{title}</h1>{body && <p className="mt-1.5 max-w-xl text-body">{body}</p>}</div>
      {children}
    </div>
  );
}
const Wrap = ({ children }: { children: React.ReactNode }) => <div className="h-full overflow-y-auto"><div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">{children}</div></div>;

const memberIcon = (m: string) => (m === "children" ? Baby : m === "parents" ? HeartPulse : User);

export function HouseholdStrip() {
  const { profile, isDemoProfile } = useApp();
  const DEMO_COVER: Record<string, string> = { me: "Employer + personal", spouse: "Employer + personal", children: "Employer", parents: "Not covered" };
  const covered = (m: string) => isDemoProfile ? DEMO_COVER[m] : profile.hasInsurance === "no" ? "Not covered" : profile.hasInsurance === "yes" ? "Cover not confirmed yet" : "Not known yet";
  const ok = (c: string) => c !== "Not covered";
  if (!profile.members.length) return <p className="text-[0.92rem] text-soft">Bimora hasn’t learned who you want to cover yet.</p>;
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {profile.members.map((m) => { const I = memberIcon(m); const c = covered(m); return (
        <li key={m} className={cx("rounded-card border p-3.5", ok(c) ? "border-line" : "border-gap-line bg-gap-tint/40")}>
          <I size={19} className={ok(c) ? "text-ink" : "text-gap"} aria-hidden />
          <p className="mt-2.5 font-semibold text-ink">{MEMBER_LABEL[m]}</p>
          <p className={cx("text-[0.8rem]", ok(c) ? "text-soft" : "text-gap")}>{c}</p>
        </li>
      ); })}
    </ul>
  );
}

export function CoverageView() {
  const { profile, policies, agent, setView, isDemoProfile } = useApp();
  const gaps = agent.gaps.length ? agent.gaps : buildGaps(profile);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Wrap>
      <ViewHead title="My coverage" body="Your household, what already protects it and where it may fall short.">{isDemoProfile && <DemoTag>Demo household</DemoTag>}</ViewHead>
      <section className="card p-5" aria-labelledby="hh"><h2 id="hh" className="font-semibold text-ink">Your household</h2><div className="mt-4"><HouseholdStrip /></div></section>
      <section className="card p-5" aria-labelledby="cp">
        <h2 id="cp" className="font-semibold text-ink">Current protection</h2>
        {!policies.length && <p className="mt-2 text-[0.94rem] text-body">Bimora doesn’t have your policy details yet. Upload a policy in <button type="button" onClick={() => setView("policies")} className="font-semibold text-action-ink underline-offset-4 hover:underline">My policies</button> and it’ll appear here.</p>}
        <ul className="mt-3 divide-y divide-line">
          {policies.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="flex items-center gap-2 text-ink"><Check size={17} className="text-ok" aria-hidden />{p.name}</span>
              <span className="flex items-center gap-2 text-[0.88rem] text-soft">{p.coverage.sumInsured ? inr(p.coverage.sumInsured) : ""}{p.issuanceStatus !== "issued" && <Pill tone={ISS[p.issuanceStatus].tone}>{ISS[p.issuanceStatus].label}</Pill>}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="gp">
        <h2 id="gp" className="font-semibold text-ink">Potential gaps</h2>
        <p className="mt-1 text-[0.92rem] text-body">Bimora doesn’t automatically tell you to buy more. It first helps you understand whether a gap matters.</p>
        <ul className="mt-3 space-y-2.5">
          {gaps.map((g) => (
            <li key={g.id} className="card p-4">
              <div className="flex gap-3"><AlertCircle size={19} className="mt-0.5 shrink-0 text-gap" aria-hidden />
                <div className="flex-1"><p className="font-semibold text-ink">{g.title}</p><p className="mt-1 text-[0.93rem] text-body">{g.explanation}</p>
                  <button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="mt-2 text-[0.88rem] font-semibold text-action-ink">Does this matter for me?</button>
                  {open === g.id && <p className="mt-1.5 text-[0.92rem] leading-relaxed text-body">{g.doesItMatter}</p>}
                </div>
              </div>
            </li>
          ))}
          {!gaps.length && <li className="card p-4 text-body">No gaps identified yet. Tell Bimora a bit more and it will check.</li>}
        </ul>
        <Button className="mt-4" variant="secondary" onClick={() => setView("chat")}><MessageCircle size={17} aria-hidden />Talk it through with Bimora</Button>
      </section>
    </Wrap>
  );
}

export function PoliciesView() {
  const { documents, analyses, attach } = useApp();
  const [view, setViewDoc] = useState<string | null>(null);
  const doc = documents.find((d) => d.id === view);
  const analysis = doc ? analyses[doc.id] : undefined;
  const coverage = analysis?.policy.coverage ?? DEMO_POLICIES.find((p) => p.id === doc?.summaryPolicyId)?.coverage;
  return (
    <Wrap>
      <ViewHead title="My policies" body="Documents you’ve shared and what Bimora understood from them.">
        <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-control bg-action px-5 font-semibold text-white hover:bg-action-hover">
          <Upload size={18} aria-hidden />Upload My Policy
          <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) attach({ name: f.name, size: f.size, type: f.type }); e.target.value = ""; }} />
        </label>
      </ViewHead>
      {!documents.length && <div className="card p-6"><p className="font-semibold text-ink">No documents yet</p><p className="mt-1.5 text-body">Upload a policy and Bimora will explain what it covers, what it doesn’t and which conditions matter.</p></div>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {documents.map((d) => (
          <li key={d.id} className="card flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-paper text-ink"><FileText size={20} aria-hidden /></span>
              <div className="min-w-0"><p className="truncate font-semibold text-ink">{d.fileName}</p><p className="text-[0.86rem] text-soft">Policy document · Uploaded {shortDate(d.uploadedAt)}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill tone={d.status === "analyzed" ? "ok" : d.status === "failed" ? "danger" : "pending"}>{d.status === "analyzed" ? "Analyzed" : d.status}</Pill>
              {d.isMock && <span className="demo-tag">{analyses[d.id]?.isSampleAnalysis ? "Sample analysis" : "Demo document"}</span>}
            </div>
            <p className="mt-3 text-[0.92rem] text-body">Coverage summary available</p>
            <Button variant="secondary" className="mt-4 self-start" onClick={() => setViewDoc(d.id)}>View summary</Button>
          </li>
        ))}
      </ul>
      <Dialog open={!!doc} onClose={() => setViewDoc(null)} title={doc?.fileName ?? "Summary"} wide>
        {coverage && <PolicySummary coverage={coverage} name={analysis?.policy.name ?? "Family Health Policy"} isSample={analysis?.isSampleAnalysis ?? true} />}
      </Dialog>
    </Wrap>
  );
}

export function RecommendationsView() {
  const { recommendation, hasLiveRecommendation, openApproval, setView, purchase } = useApp();
  return (
    <Wrap>
      <ViewHead title="Recommendations" body={hasLiveRecommendation ? "Built from your conversation with Bimora." : "Example recommendation. Answer Bimora’s questions to get one built for you."} />
      {purchase && <div className="card flex flex-wrap items-center justify-between gap-3 p-4"><span className="text-ink">You chose <strong>{purchase.plan.label}</strong></span><span className="flex gap-2"><Pill tone={purchase.paymentStatus === "successful" ? "ok" : "danger"}>Payment {purchase.paymentStatus}</Pill><Pill tone={ISS[purchase.issuanceStatus].tone}>{ISS[purchase.issuanceStatus].label}</Pill></span></div>}
      {!hasLiveRecommendation && <Button variant="secondary" onClick={() => setView("chat")}><MessageCircle size={17} aria-hidden />Answer a few questions</Button>}
      <RecommendationSet rec={recommendation} onChoose={openApproval} />
    </Wrap>
  );
}

const STATUS: Record<Action["status"], { tone: "ok" | "info" | "pending" | "danger"; label: string }> = {
  done: { tone: "ok", label: "Done" }, in_progress: { tone: "info", label: "In progress" }, pending: { tone: "pending", label: "Pending" }, blocked: { tone: "danger", label: "Blocked" },
};
const OWNER: Record<Action["owner"], string> = { you: "You", bimora: "Bimora", insurer: "Insurer", advisor: "Ditto advisor" };

export function TasksView() {
  const { actions, setActionStatus, openAdvisor, recheckIssuance } = useApp();
  const [checking, setChecking] = useState(false);
  const open = actions.filter((a) => a.status !== "done");
  const done = actions.filter((a) => a.status === "done");
  const row = (a: Action) => (
    <li key={a.id} className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          {a.status === "done" ? <Check size={20} className="mt-0.5 shrink-0 text-ok" aria-hidden /> : <CircleDashed size={20} className="mt-0.5 shrink-0 text-gap" aria-hidden />}
          <div><p className="font-semibold text-ink">{a.title}</p><p className="mt-1 text-[0.93rem] text-body">{a.detail}</p>
            <p className="mt-2 text-[0.82rem] text-soft">Owner: {OWNER[a.owner]}{a.dueDate ? ` · Due ${shortDate(a.dueDate)}` : ""}</p></div>
        </div>
        <Pill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Pill>
      </div>
      {a.status !== "done" && (
        <div className="mt-4 flex flex-wrap gap-2 pl-8">
          {a.kind === "medical_report" && (
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-control bg-action px-4 font-semibold text-white hover:bg-action-hover"><Upload size={16} aria-hidden />Upload report
              <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setActionStatus(a.id, "done", `${f.name} attached (demo: not sent anywhere).`); e.target.value = ""; }} />
            </label>
          )}
          {a.owner === "you" && a.kind !== "medical_report" && <Button size="sm" variant="secondary" onClick={() => setActionStatus(a.id, "done")}>Mark as done</Button>}
          {a.id === "act_issuance" && <Button size="sm" variant="secondary" disabled={checking} onClick={async () => { setChecking(true); await recheckIssuance(); setChecking(false); }}>{checking ? "Checking with the insurer..." : "Check again"}</Button>}
          {a.owner !== "you" && <Button size="sm" variant="ghost" onClick={() => openAdvisor(`Help with: ${a.title}`)}>Ask an advisor</Button>}
        </div>
      )}
    </li>
  );
  return (
    <Wrap>
      <ViewHead title="Tasks" body="What’s pending, who’s doing it, and by when." />
      <section aria-labelledby="t-open"><h2 id="t-open" className="mb-3 font-semibold text-ink">Open ({open.length})</h2><ul className="space-y-3">{open.map(row)}</ul>{!open.length && <p className="text-body">Nothing pending.</p>}</section>
      <section aria-labelledby="t-done"><h2 id="t-done" className="mb-3 font-semibold text-ink">Done</h2><ul className="space-y-3">{done.map(row)}</ul></section>
    </Wrap>
  );
}

export function RenewalCard({ policy, compact }: { policy: Policy; compact?: boolean }) {
  const { setView, event, openAdvisor } = useApp();
  const days = daysUntil(policy.renewalDate!);
  const [summary, setSummary] = useState(false);
  const [compare, setCompare] = useState(false);
  const c = policy.coverage;
  const ped = c.waitingPeriods.find((w) => /pre-existing/i.test(w.label))?.detail ?? "Check the policy wording";
  return (
    <div className={cx("card", compact ? "p-4" : "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-semibold text-ink">{policy.name}</p><p className="text-[0.88rem] text-soft">{c.sumInsured ? inr(c.sumInsured) : "Cover amount not recorded"}{policy.isMock && " · demo data"}</p></div>
        <span className="flex items-center gap-2 rounded-full bg-action-tint px-3 py-1.5 text-[0.88rem] font-semibold text-action-ink"><CalendarClock size={15} aria-hidden />Renewal: {days} days away</span>
      </div>
      {!compact && <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-body">Renewing usually keeps the waiting-period credit you’ve built up. Before you renew, it’s worth checking the cover still fits your household.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { setSummary(true); track("renewal_opened", { source: "review" }); }}>Review coverage</Button>
        <Button size="sm" variant="secondary" onClick={() => { setCompare(true); track("renewal_opened", { source: "compare" }); }}><Scale size={15} aria-hidden />Compare alternatives</Button>
        {!compact && <Button size="sm" onClick={() => { setView("chat"); event("renewal", { policyId: policy.id, name: policy.name, days: String(days) }); }}><MessageCircle size={15} aria-hidden />Talk to Bimora</Button>}
        <Button size="sm" variant="ghost" onClick={() => openAdvisor("Help deciding about my renewal")}>Talk to a Ditto advisor</Button>
      </div>
      <Dialog open={summary} onClose={() => setSummary(false)} title="Review coverage" wide><PolicySummary coverage={c} name={policy.name} isSample={policy.isMock} /></Dialog>
      <Dialog open={compare} onClose={() => setCompare(false)} title="Compare alternatives" wide>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-body">Your current policy against two illustrative options.</p><DemoTag>Illustrative, not quotes</DemoTag></div>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[520px] text-left text-[0.9rem]">
              <thead className="bg-paper text-ink"><tr><th scope="col" className="p-3 font-semibold"><span className="sr-only">Feature</span></th><th scope="col" className="p-3 font-semibold">Current</th><th scope="col" className="p-3 font-semibold">{DEMO_PLANS[0].label}</th><th scope="col" className="p-3 font-semibold">{DEMO_PLANS[1].label}</th></tr></thead>
              <tbody className="divide-y divide-line text-body">
                {[
                  ["Cover", c.sumInsured ? inr(c.sumInsured) : "Not recorded", DEMO_PLANS[0].attributes[0].value, DEMO_PLANS[1].attributes[0].value],
                  ["Co-pay", c.coPay ?? "Not stated", "None", "20% on every claim"],
                  ["Room", c.roomRent ?? "Not stated", "No cap", "1% of cover/day"],
                  ["Pre-existing wait", ped, "2 years on new cover; porting credit may apply", "3 years on new cover; porting credit may apply"],
                  ["Premium", "Renewal price comes from the insurer", `${inr(DEMO_PLANS[0].illustrativeAnnualPremium)} (illustrative)`, `${inr(DEMO_PLANS[1].illustrativeAnnualPremium)} (illustrative)`],
                ].map((r) => <tr key={r[0]}><th scope="row" className="p-3 font-medium text-ink">{r[0]}</th>{r.slice(1).map((v, i) => <td key={i} className="p-3">{v}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="text-[0.9rem] leading-relaxed text-body">If you port, waiting-period credit usually carries over up to your current cover; any extra cover starts its own wait. Bimora would confirm this with the insurer before suggesting a move.</p>
        </div>
      </Dialog>
    </div>
  );
}

export function RenewalsView() {
  const { policies, attach, isDemoProfile } = useApp();
  const due = policies.filter((p) => p.renewalDate && p.policySource !== "employer" && p.issuanceStatus === "issued");
  return (
    <Wrap>
      <ViewHead title="Renewals" body="Renewal is a chance to check your cover still fits, not another sales pitch." />
      {due.map((p) => <RenewalCard key={p.id} policy={p} />)}
      {!due.length && (
        <div className="card p-6">
          <p className="font-semibold text-ink">No renewals to track yet</p>
          <p className="mt-1.5 max-w-lg text-body">Upload a policy you already have and Bimora will remember its renewal date and check in before it’s due.</p>
          <label className="mt-4 inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-control bg-action px-5 font-semibold text-white hover:bg-action-hover"><Upload size={18} aria-hidden />Upload My Policy
            <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) attach({ name: f.name, size: f.size, type: f.type }); e.target.value = ""; }} />
          </label>
        </div>
      )}
      {isDemoProfile && <div className="card p-5"><p className="font-semibold text-ink">Group health cover (employer)</p><p className="mt-1 text-[0.92rem] text-body">Renewed by your employer. Bimora will check in if you tell it you’re changing jobs.</p></div>}
    </Wrap>
  );
}

export function InsightPanel() {
  const { profile, policies, agent, actions, setView, isDemoProfile } = useApp();
  const gaps = agent.gaps.length ? agent.gaps : buildGaps(profile);
  const pr = progress(profile);
  const pending = actions.filter((a) => a.status !== "done");
  return (
    <aside aria-label="Your insurance picture" className="h-full overflow-y-auto border-l border-line bg-paper/60 p-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-ink">Your insurance picture</h2>{isDemoProfile && <span className="demo-tag">Demo</span>}</div>
      <div className="mt-4">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-soft">Bimora understands</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pr.done} aria-valuemin={0} aria-valuemax={pr.total} aria-label="Questions answered"><div className="h-full bg-action" style={{ width: `${(pr.done / Math.max(pr.total, 1)) * 100}%` }} /></div>
        <p className="mt-1.5 text-[0.82rem] text-soft">{pr.done} of {pr.total} things that matter</p>
      </div>
      <section className="mt-6"><p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-soft">Household</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">{profile.members.map((m) => <li key={m} className="rounded-full bg-canvas px-3 py-1 text-[0.85rem] text-ink ring-1 ring-line">{MEMBER_LABEL[m]}</li>)}{!profile.members.length && <li className="text-[0.88rem] text-soft">Not shared yet</li>}</ul>
        {profile.city && <p className="mt-2 text-[0.85rem] text-soft">{profile.city}</p>}
      </section>
      <section className="mt-6"><p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-soft">Existing policies</p>
        <ul className="mt-2 space-y-1.5">{!policies.length && <li className="text-[0.88rem] text-soft">None shared yet</li>}{policies.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 text-[0.88rem] text-ink"><span className="truncate">{p.name}</span>{p.issuanceStatus !== "issued" ? <Pill tone="pending">Pending</Pill> : <Check size={15} className="shrink-0 text-ok" aria-label="Active" />}</li>)}</ul>
      </section>
      <section className="mt-6"><p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-soft">Coverage gaps</p>
        <ul className="mt-2 space-y-1.5">{gaps.map((g) => <li key={g.id} className="flex gap-2 text-[0.88rem] leading-snug text-ink"><AlertCircle size={15} className="mt-0.5 shrink-0 text-gap" aria-hidden />{g.title}</li>)}{!gaps.length && <li className="text-[0.88rem] text-soft">None identified yet</li>}</ul>
        <button type="button" onClick={() => setView("coverage")} className="mt-2 text-[0.85rem] font-semibold text-action-ink">See coverage</button>
      </section>
      <section className="mt-6"><p className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-soft">Pending actions</p>
        <ul className="mt-2 space-y-1.5">{!pending.length && <li className="text-[0.88rem] text-soft">Nothing pending</li>}{pending.map((a) => <li key={a.id} className="flex items-start gap-2 text-[0.88rem] leading-snug text-ink"><CircleDashed size={15} className="mt-0.5 shrink-0 text-gap" aria-hidden />{a.title}</li>)}</ul>
        <button type="button" onClick={() => setView("tasks")} className="mt-2 text-[0.85rem] font-semibold text-action-ink">Open tasks</button>
      </section>
    </aside>
  );
}
