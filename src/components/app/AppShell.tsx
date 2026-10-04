"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarClock, FlaskConical, Headset, House, LayoutGrid, ListChecks, LogOut, MessageCircle, MoreHorizontal, PanelRight, Scale, ShieldCheck, FolderOpen } from "lucide-react";
import { useApp, type View } from "./store";
import { ChatView } from "./Chat";
import { CoverageView, InsightPanel, PoliciesView, RecommendationsView, RenewalsView, TasksView } from "./Views";
import { ApprovalFlow } from "@/components/shared/ApprovalFlow";
import { AdvisorDialog } from "@/components/shared/AdvisorDialog";
import { VoicePanel } from "@/components/shared/VoicePanel";
import { Dialog } from "@/components/ui/Dialog";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { scenarios, SCENARIO_LABELS, type ScenarioKey } from "@/services/scenarios";
import { clearProfile } from "@/lib/session";
import { cx } from "@/lib/format";

const NAV: { id: View; label: string; icon: typeof House }[] = [
  { id: "chat", label: "Bimora", icon: MessageCircle },
  { id: "coverage", label: "My coverage", icon: ShieldCheck },
  { id: "policies", label: "My policies", icon: FolderOpen },
  { id: "recommendations", label: "Recommendations", icon: Scale },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "renewals", label: "Renewals", icon: CalendarClock },
];
const MOBILE: View[] = ["chat", "coverage", "policies", "tasks"];

function DemoControls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSyncExternalStore(scenarios.subscribe, scenarios.get, scenarios.get);
  return (
    <Dialog open={open} onClose={onClose} title="Demo controls">
      <p className="text-[0.94rem] leading-relaxed text-body">Turn on a failure to see how Bimora handles it. These only affect the simulated services in this demo.</p>
      <ul className="mt-4 divide-y divide-line rounded-card border border-line">
        {(Object.keys(SCENARIO_LABELS) as ScenarioKey[]).map((k) => (
          <li key={k}>
            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 px-4">
              <span className="text-ink">{SCENARIO_LABELS[k]}</span>
              <input type="checkbox" role="switch" checked={s[k]} onChange={(e) => scenarios.set(k, e.target.checked)} className="h-5 w-5 accent-[#0B6CC0]" />
            </label>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-5 w-full" onClick={() => { clearProfile(); window.location.href = window.location.pathname; }}>Reset demo and start over</Button>
    </Dialog>
  );
}

export function AppShell() {
  const app = useApp();
  const { view, setView, actions } = app;
  const [more, setMore] = useState(false);
  const [panel, setPanel] = useState(false);
  const [demo, setDemo] = useState(false);
  const pendingCount = actions.filter((a) => a.status !== "done").length;

  const body = { chat: <ChatView />, coverage: <CoverageView />, policies: <PoliciesView />, recommendations: <RecommendationsView />, tasks: <TasksView />, renewals: <RenewalsView /> }[view];

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3 lg:hidden">
        <span className="flex items-center gap-2"><Logo href="/" compact /><span className="demo-tag">Concept</span></span>
        <button type="button" onClick={() => setPanel(true)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-control px-3 text-[0.88rem] font-semibold text-ink hover:bg-paper"><PanelRight size={18} aria-hidden />Your picture</button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* desktop sidebar */}
        <nav aria-label="Bimora" className="hidden w-64 shrink-0 flex-col border-r border-line px-3 py-5 lg:flex">
          <div className="flex items-center gap-2 px-3"><Logo href="/" compact /><span className="demo-tag">Concept demo</span></div>
          <ul className="mt-8 space-y-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => setView(n.id)} aria-current={view === n.id ? "page" : undefined}
                  className={cx("flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-[0.96rem] font-medium transition-colors", view === n.id ? "bg-paper text-ink" : "text-body hover:bg-paper/70 hover:text-ink")}>
                  <n.icon size={19} className={view === n.id ? "text-action" : "text-soft"} aria-hidden />{n.label}
                  {n.id === "tasks" && pendingCount > 0 && <span className="ml-auto rounded-full bg-gap-tint px-2 text-[0.78rem] font-semibold text-gap">{pendingCount}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-1 border-t border-line pt-4">
            <button type="button" onClick={() => app.openAdvisor()} className="flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-[0.94rem] font-medium text-body hover:bg-paper hover:text-ink"><Headset size={18} className="text-soft" aria-hidden />Talk to a Ditto advisor</button>
            <button type="button" onClick={() => setDemo(true)} className="flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-[0.94rem] font-medium text-body hover:bg-paper hover:text-ink"><FlaskConical size={18} className="text-soft" aria-hidden />Demo controls</button>
            <Link href="/" className="flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-[0.94rem] font-medium text-body hover:bg-paper hover:text-ink"><LogOut size={18} className="text-soft" aria-hidden />Back to home</Link>
          </div>
        </nav>

        <main id="main" className="min-h-0 min-w-0 flex-1">{body}</main>

        <div className="hidden w-80 shrink-0 xl:block"><InsightPanel /></div>
      </div>

      {/* mobile bottom nav */}
      <nav aria-label="Bimora" className="grid shrink-0 grid-cols-5 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] lg:hidden">
        {MOBILE.map((id) => { const n = NAV.find((x) => x.id === id)!; const active = view === id; return (
          <button key={id} type="button" onClick={() => setView(id)} aria-current={active ? "page" : undefined} className={cx("relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[0.72rem] font-medium", active ? "text-action-ink" : "text-soft")}>
            <n.icon size={21} aria-hidden />{({ chat: "Bimora", coverage: "Coverage", policies: "Policies", tasks: "Tasks" } as Record<string, string>)[id]}
            {id === "tasks" && pendingCount > 0 && <span className="absolute right-[22%] top-2 h-2 w-2 rounded-full bg-gap" aria-label={`${pendingCount} pending`} />}
          </button>
        ); })}
        <button type="button" onClick={() => setMore(true)} className={cx("flex min-h-[60px] flex-col items-center justify-center gap-1 text-[0.72rem] font-medium", view === "recommendations" || view === "renewals" ? "text-action-ink" : "text-soft")}><MoreHorizontal size={21} aria-hidden />More</button>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More">
        <ul className="space-y-1">
          {[{ id: "recommendations" as View, label: "Recommendations", icon: Scale }, { id: "renewals" as View, label: "Renewals", icon: CalendarClock }].map((n) => (
            <li key={n.id}><button type="button" onClick={() => { setView(n.id); setMore(false); }} className="flex min-h-[52px] w-full items-center gap-3 rounded-control px-3 text-left font-medium text-ink hover:bg-paper"><n.icon size={19} className="text-soft" aria-hidden />{n.label}</button></li>
          ))}
          <li><button type="button" onClick={() => { setMore(false); app.openAdvisor(); }} className="flex min-h-[52px] w-full items-center gap-3 rounded-control px-3 text-left font-medium text-ink hover:bg-paper"><Headset size={19} className="text-soft" aria-hidden />Talk to a Ditto advisor</button></li>
          <li><button type="button" onClick={() => { setMore(false); setDemo(true); }} className="flex min-h-[52px] w-full items-center gap-3 rounded-control px-3 text-left font-medium text-ink hover:bg-paper"><FlaskConical size={19} className="text-soft" aria-hidden />Demo controls</button></li>
          <li><Link href="/" className="flex min-h-[52px] w-full items-center gap-3 rounded-control px-3 font-medium text-ink hover:bg-paper"><LayoutGrid size={19} className="text-soft" aria-hidden />Back to home</Link></li>
        </ul>
      </Dialog>

      <Dialog open={panel} onClose={() => setPanel(false)} title="Your insurance picture"><div className="-m-5 sm:-m-6"><InsightPanel /></div></Dialog>

      <Dialog open={app.voiceOpen} onClose={() => app.setVoiceOpen(false)} title="Talk to Bimora">
        <VoicePanel onTurn={(t) => app.send(t.transcript)} />
        <p className="mt-3 text-center text-[0.84rem] text-soft">What you say is added to your conversation.</p>
      </Dialog>

      <ApprovalFlow key={app.approvalKey} plan={app.approvalPlan} open={!!app.approvalPlan} onClose={app.closeApproval} onFinished={app.completePurchase} onAdvisor={() => app.openAdvisor("Help completing my purchase")} />
      <AdvisorDialog open={app.advisor.open} onClose={app.closeAdvisor} reason={app.advisor.reason} source="app" />
      <DemoControls open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}
