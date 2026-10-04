"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, ChevronDown, CircleHelp, Headset, Lightbulb, ListChecks, Mic, Paperclip } from "lucide-react";
import type { Message, MessageBlock } from "@/lib/types";
import { cx, shortDate } from "@/lib/format";
import { useApp } from "./store";
import { PolicyUpload } from "@/components/shared/PolicyUpload";
import { PolicySummary } from "@/components/shared/PolicySummary";
import { RecommendationSet } from "@/components/shared/RecommendationSet";
import { ErrorNotice, Pill } from "@/components/ui/Bits";
import { RenewalCard } from "./Views";

function Choices({ msg, block }: { msg: Message; block: Extract<MessageBlock, { kind: "choices" }> }) {
  const { choose } = useApp();
  const [sel, setSel] = useState<string[]>([]);
  const disabled = !!msg.answered;
  const labelsFor = (ids: string[]) => ids.map((id) => block.choices.find((c) => c.id === id)?.label ?? id);
  if (disabled) return null;
  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-2" role="group" aria-label={block.multi ? "Choose all that apply" : "Choose one"}>
        {block.choices.map((c) => (
          <button key={c.id} type="button" className="chip text-left"
            aria-pressed={block.multi ? sel.includes(c.id) : undefined}
            onClick={() => (block.multi ? setSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : block.max && s.length >= block.max ? [...s.slice(1), c.id] : [...s, c.id])) : choose(msg.id, block.questionId, [c.id], [c.label]))}>
            {c.label}
          </button>
        ))}
      </div>
      {block.multi && (
        <button type="button" disabled={!sel.length} onClick={() => choose(msg.id, block.questionId, sel, labelsFor(sel))} className="mt-3 inline-flex min-h-[44px] items-center rounded-control bg-ink px-4 font-semibold text-white disabled:opacity-40">
          {block.submitLabel ?? "Continue"}
        </button>
      )}
    </div>
  );
}

function Gaps({ ids }: { ids: string[] }) {
  const { agent } = useApp();
  const gaps = agent.gaps.filter((g) => ids.includes(g.id));
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="space-y-2">
      {gaps.map((g) => (
        <li key={g.id} className="rounded-card border border-gap-line bg-gap-tint/40 p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-gap" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{g.title}</p>
              <p className="mt-0.5 text-[0.92rem] leading-snug text-body">{g.explanation}</p>
              {g.basedOn !== "known" && <p className="mt-1.5"><Pill tone="neutral">{g.basedOn === "unknown" ? "Based on something still unknown" : "Based on an assumption"}</Pill></p>}
              <button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="mt-2 inline-flex items-center gap-1 text-[0.88rem] font-semibold text-action-ink">
                Does this matter for me?<ChevronDown size={15} className={cx("transition-transform", open === g.id && "rotate-180")} aria-hidden />
              </button>
              {open === g.id && <p className="mt-1.5 text-[0.9rem] leading-relaxed text-body">{g.doesItMatter}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Understanding({ b }: { b: Extract<MessageBlock, { kind: "understanding" }> }) {
  const col = (title: string, items: string[], tone: string) => items.length ? (
    <div><p className={cx("text-[0.8rem] font-semibold uppercase tracking-[0.1em]", tone)}>{title}</p><ul className="mt-1.5 space-y-1 text-[0.92rem] text-ink">{items.map((i) => <li key={i}>{i}</li>)}</ul></div>
  ) : null;
  return (
    <div className="space-y-3 rounded-card border border-line bg-canvas p-4">
      {col("Facts you gave me", b.facts, "text-ok")}
      {col("Assumptions", b.assumptions, "text-action-ink")}
      {col("Still unknown", b.unknowns, "text-gap")}
    </div>
  );
}

function Actions({ ids }: { ids: string[] }) {
  const { actions, setView } = useApp();
  const list = actions.filter((a) => ids.includes(a.id));
  return (
    <div className="rounded-card border border-line bg-canvas p-4">
      <p className="flex items-center gap-2 font-semibold text-ink"><ListChecks size={17} aria-hidden />Next steps</p>
      <ul className="mt-3 space-y-2">
        {list.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 text-[0.93rem]">
            <span className="text-ink">{a.title}</span>
            <Pill tone={a.status === "done" ? "ok" : a.status === "in_progress" ? "info" : "pending"}>{a.status === "done" ? "Done" : a.status === "in_progress" ? "In progress" : a.dueDate ? `By ${shortDate(a.dueDate)}` : "Pending"}</Pill>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setView("tasks")} className="mt-3 text-[0.9rem] font-semibold text-action-ink">Open tasks</button>
    </div>
  );
}

function Block({ msg, b }: { msg: Message; b: MessageBlock }) {
  const app = useApp();
  switch (b.kind) {
    case "text": return <p className="text-[0.98rem] leading-relaxed text-ink">{b.text}</p>;
    case "why": return <p className="flex gap-1.5 text-[0.86rem] leading-snug text-soft"><Lightbulb size={15} className="mt-0.5 shrink-0 text-action" aria-hidden /><span><span className="font-semibold text-body">Why I’m asking: </span>{b.text}</span></p>;
    case "choices": return <Choices msg={msg} block={b} />;
    case "upload_prompt": return (
      <PolicyUpload location="chat" autoFile={b.file} onComplete={app.onPolicyAnalyzed} onAdvisor={() => app.openAdvisor("Help reading my policy")}
        onSkip={b.allowSkip ? () => app.event("upload_skipped") : undefined} />
    );
    case "document_summary": {
      const r = Object.values(app.analyses).find((a) => a.policy.id === b.policyId);
      return r ? <PolicySummary coverage={r.policy.coverage} name={r.policy.name} isSample={r.isSampleAnalysis} /> : null;
    }
    case "understanding": return <Understanding b={b} />;
    case "gaps": return <Gaps ids={b.gapIds} />;
    case "recommendation": return app.agent.recommendation ? <RecommendationSet compact rec={app.agent.recommendation} onChoose={app.openApproval} /> : null;
    case "action": return <Actions ids={b.actionIds} />;
    case "escalation": return (
      <div className="rounded-card border border-line bg-canvas p-4">
        <p className="flex items-center gap-2 font-semibold text-ink"><Headset size={17} className="text-action" aria-hidden />A Ditto advisor can take this from here</p>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-body">They’ll see this conversation, your household and your policies, so you won’t need to repeat anything.</p>
        <button type="button" onClick={() => app.openAdvisor(b.reason)} className="mt-3 inline-flex min-h-[44px] items-center rounded-control bg-ink px-4 font-semibold text-white">Talk to a Ditto advisor</button>
      </div>
    );
    case "error": return <ErrorNotice code={b.code} onRetry={app.retryLast} onAdvisor={() => app.openAdvisor("Bimora couldn’t respond")} />;
    case "renewal": { const pol = app.policies.find((x) => x.id === b.policyId); return pol ? <RenewalCard compact policy={pol} /> : null; }
  }
}

function MessageRow({ m }: { m: Message }) {
  if (m.role === "user") {
    return <div className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-action px-4 py-2.5 text-[0.98rem] leading-snug text-white">{(m.blocks[0] as { text: string }).text}</p></div>;
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-ink font-display text-[1rem] font-semibold text-white" aria-hidden>b</span>
      <div className="min-w-0 flex-1 space-y-2.5">{m.blocks.map((b, i) => <Block key={i} msg={m} b={b} />)}</div>
    </div>
  );
}

export function ChatView() {
  const { messages, typing, send, attach, setVoiceOpen, isDemoProfile } = useApp();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const s = scroller.current; if (s) s.scrollTo({ top: s.scrollHeight, behavior: "smooth" }); }, [messages.length, typing]);
  useEffect(() => { const t = ta.current; if (t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; } }, [text]);

  const submit = () => { if (!text.trim()) return; send(text); setText(""); };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversation with Bimora">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
          {isDemoProfile && (
            <p className="flex items-start gap-2 rounded-control bg-paper px-3 py-2 text-[0.84rem] leading-snug text-soft"><CircleHelp size={15} className="mt-0.5 shrink-0" aria-hidden />You’re viewing a demo household. Start from “Find My Best Coverage” on the home page to use your own answers.</p>
          )}
          {messages.map((m) => <MessageRow key={m.id} m={m} />)}
          {typing && (
            <div className="flex gap-3" role="status" aria-label="Bimora is typing">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink font-display text-white" aria-hidden>b</span>
              <span className="flex items-center gap-1 rounded-2xl bg-paper px-4"><span className="h-2 w-2 animate-dot rounded-full bg-soft" /><span className="h-2 w-2 animate-dot rounded-full bg-soft [animation-delay:.15s]" /><span className="h-2 w-2 animate-dot rounded-full bg-soft [animation-delay:.3s]" /></span>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <div className="border-t border-line bg-canvas px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 sm:px-6">
        <form className="mx-auto flex max-w-2xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <button type="button" onClick={() => file.current?.click()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-soft hover:bg-paper hover:text-ink" aria-label="Attach a policy document"><Paperclip size={20} aria-hidden /></button>
          <input ref={file} type="file" accept=".pdf,image/*" className="sr-only" aria-label="Choose a document" onChange={(e) => { const f = e.target.files?.[0]; if (f) attach({ name: f.name, size: f.size, type: f.type }); e.target.value = ""; }} />
          <label htmlFor="composer" className="sr-only">Message Bimora</label>
          <textarea id="composer" ref={ta} rows={1} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask Bimora anything"
            className="max-h-[140px] min-h-[48px] flex-1 resize-none rounded-[24px] border border-line-strong bg-canvas px-4 py-3 text-[1rem] leading-snug text-ink outline-none placeholder:text-soft focus:border-action focus:ring-4 focus:ring-action/15" />
          {text.trim() ? (
            <button type="submit" disabled={typing} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-action text-white hover:bg-action-hover" aria-label="Send"><ArrowUp size={20} aria-hidden /></button>
          ) : (
            <button type="button" onClick={() => setVoiceOpen(true)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white" aria-label="Talk to Bimora"><Mic size={20} aria-hidden /></button>
          )}
        </form>
      </div>
    </div>
  );
}
