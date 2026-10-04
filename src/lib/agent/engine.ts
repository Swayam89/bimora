/**
 * Bimora agent engine (deterministic, rule-based).
 *
 * Implements the agent loop from config/bimora-agent.ts without an LLM:
 * understand intent → find the missing decision-relevant fact → ask one
 * question → build context → find gaps → recommend → hand off to approval.
 *
 * When a real LLM is connected, keep this planner as the source of truth for
 * *what* to ask next and let the model handle phrasing and open questions.
 */
import type { Choice, CoverageGap, Message, MessageBlock, Recommendation } from "@/lib/types";
import { AGENT_GUARDRAILS } from "@/config/bimora-agent";
import { answerFreeform, buildGaps, buildRecommendation, buildUnderstanding } from "./analysis";
import { describeMembers, type Profile } from "./profile";
import { findQuestion, nextQuestion } from "./questions";

export type Flow = "cover" | "policy" | "renewal" | "adequacy" | null;

export interface AgentState {
  profile: Profile;
  flow: Flow;
  pendingQuestionId?: string;
  gaps: CoverageGap[];
  recommendation?: Recommendation;
  uploadedPolicy?: boolean;
  /** The next policy due for renewal, supplied by the app from stored policies */
  renewal?: { policyId: string; name: string; days: number };
}

export type AgentInput =
  | { type: "text"; text: string }
  | { type: "choice"; questionId: string; values: string[]; labels: string[] }
  | { type: "event"; name: "start" | "policy_analyzed" | "upload_skipped" | "purchase_complete" | "show_options" | "escalate" | "renewal"; detail?: Record<string, string> };

let counter = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
export const botMsg = (blocks: MessageBlock[]): Message => ({ id: uid("m"), role: "bimora", blocks, createdAt: new Date().toISOString() });
export const userMsg = (text: string): Message => ({ id: uid("m"), role: "user", blocks: [{ kind: "text", text }], createdAt: new Date().toISOString() });

export const SUGGESTED: Choice[] = [
  { id: "s_family", label: "I want health insurance for my family" },
  { id: "s_policy", label: "Help me understand my existing policy" },
  { id: "s_adequate", label: "Am I adequately covered?" },
  { id: "s_compare", label: "Compare my current policy" },
  { id: "s_renew", label: "I need to renew my policy" },
];

function askBlocks(qid: string, p: Profile): MessageBlock[] {
  const q = findQuestion(qid)!;
  return [
    { kind: "text", text: q.text(p) },
    { kind: "why", text: q.why },
    { kind: "choices", questionId: q.id, choices: q.choices(p), multi: q.multi, max: q.max, submitLabel: q.multi ? "Continue" : undefined },
  ];
}

/** Asks the next missing question, or moves to gap analysis when nothing decision-relevant is missing. */
function advance(s: AgentState, lead?: string): { state: AgentState; messages: Message[] } {
  const q = nextQuestion(s.profile);
  if (q) {
    const blocks = askBlocks(q.id, s.profile);
    if (lead) blocks.unshift({ kind: "text", text: lead });
    return { state: { ...s, pendingQuestionId: q.id }, messages: [botMsg(blocks)] };
  }
  const gaps = buildGaps(s.profile);
  const u = buildUnderstanding(s.profile);
  const msgs: Message[] = [];
  msgs.push(botMsg([
    ...(lead ? [{ kind: "text", text: lead } as MessageBlock] : []),
    { kind: "text", text: "I have enough to start understanding your situation. Here’s what I’m working with, so you can correct anything." },
    { kind: "understanding", facts: u.facts, assumptions: u.assumptions, unknowns: u.unknowns },
  ]));
  msgs.push(botMsg(
    gaps.length
      ? [
          { kind: "text", text: "Based on that, these are the potential gaps. Not all of them need fixing. I’ve noted when each one actually matters." },
          { kind: "gaps", gapIds: gaps.map((g) => g.id) },
          { kind: "choices", questionId: "after_gaps", choices: [
            { id: "show_options", label: "Show me options" },
            { id: "upload_first", label: "Check my current policy first" },
            { id: "advisor", label: "Talk to a Ditto advisor" },
          ] },
        ]
      : [
          { kind: "text", text: "I don’t see an obvious gap from what you’ve told me. You may not need to buy anything right now." },
          { kind: "choices", questionId: "after_gaps", choices: [{ id: "show_options", label: "Show me options anyway" }, { id: "upload_first", label: "Check my current policy" }] },
        ],
  ));
  return { state: { ...s, gaps, pendingQuestionId: "after_gaps", flow: "cover" }, messages: msgs };
}

function recommend(s: AgentState): { state: AgentState; messages: Message[] } {
  const rec = buildRecommendation(s.profile);
  const max = AGENT_GUARDRAILS.maxRecommendedOptions;
  rec.options = rec.options.slice(0, max);
  return {
    state: { ...s, recommendation: rec, pendingQuestionId: undefined },
    messages: [botMsg([
      { kind: "text", text: "Based on what you’ve told me, here are three options. I’d lean towards Plan A, and I’ve written down why, along with what each one gives up." },
      { kind: "recommendation", recommendationId: rec.id },
    ])],
  };
}

function detectIntent(t: string): Flow | "escalate" | "compare" | "help" | null {
  const x = t.toLowerCase();
  if (/(advisor|human|real person|talk to someone|call me|speak to)/.test(x)) return "escalate";
  if (/renew/.test(x)) return "renewal";
  if (/compare/.test(x)) return "compare";
  if (/(upload|my policy|existing policy|understand my|read my|document|pdf)/.test(x)) return "policy";
  if (/(adequate|enough|am i covered|covered enough|do i need more)/.test(x)) return "adequacy";
  if (/(health insurance|insurance for|family|parents|cover|insure|protect|policy)/.test(x)) return "cover";
  return null;
}

export function respond(s: AgentState, input: AgentInput): { state: AgentState; messages: Message[] } {
  /* ---------- events ---------- */
  if (input.type === "event") {
    switch (input.name) {
      case "start": {
        const p = s.profile;
        const greet: MessageBlock[] = [
          { kind: "text", text: "Hi, I’m Bimora." },
          { kind: "text", text: "I’ll help you understand what protection makes sense before we look at policies." },
        ];
        if (p.completedOnboarding && p.intent === "policy") {
          return { state: { ...s, flow: "policy" }, messages: [botMsg([...greet, { kind: "text", text: "You said you’d like to start with the insurance you already have. Upload the policy and I’ll explain what it covers, what it doesn’t and which conditions matter." }, { kind: "upload_prompt", allowSkip: true }])] };
        }
        if (p.completedOnboarding && p.members.length) {
          const recap = input.detail?.demo === "1"
            ? `This is a demo household: you, your spouse, your child and your parents in ${p.city ?? "Pune"}. You can answer as if it were yours.`
            : `From what you’ve told me so far, you’d like to cover ${describeMembers(p)}${p.city ? ` in ${p.city}` : ""}.`;
          const r = advance({ ...s, flow: "cover" }, recap);
          return { state: r.state, messages: [botMsg(greet), ...r.messages] };
        }
        return { state: s, messages: [botMsg([...greet, { kind: "text", text: "What would you like help with?" }, { kind: "choices", questionId: "suggested", choices: SUGGESTED }])] };
      }
      case "show_options":
        return recommend(s);
      case "policy_analyzed": {
        const next = { ...s, uploadedPolicy: true };
        const lead = "Above is a sample summary. In this demo your file isn’t read, but in a real one, the waiting period is the part worth watching before you change anything.";
        if (s.flow === "cover" || s.profile.members.length) return advance({ ...next, profile: { ...next.profile, hasInsurance: next.profile.hasInsurance ?? "yes", insuranceSource: next.profile.insuranceSource ?? "personal" } }, lead);
        return { state: next, messages: [botMsg([{ kind: "text", text: lead }, { kind: "text", text: "Would you like me to check whether this policy is enough for your family?" }, { kind: "choices", questionId: "post_policy", choices: [{ id: "check_enough", label: "Yes, check if it’s enough" }, { id: "advisor", label: "Talk to a Ditto advisor" }] }])] };
      }
      case "upload_skipped":
        return advance({ ...s, flow: "cover" }, "No problem. We can work from what you tell me, and I’ll mark anything I can’t confirm as unknown.");
      case "purchase_complete": {
        const issued = input.detail?.issuance === "issued";
        return {
          state: { ...s, pendingQuestionId: undefined },
          messages: [botMsg([
            { kind: "text", text: issued
              ? "Your payment went through and the insurer has confirmed the policy is issued. I’ve saved it and set up what comes next."
              : "Your payment went through, but the insurer hasn’t confirmed the policy yet. You’re not covered until they do. You can check again from Tasks, and I’ll tell you when it’s confirmed." },
            { kind: "text", text: "(This was a simulated purchase. No money moved and no real policy was created.)" },
            { kind: "action", actionIds: (input.detail?.actions ?? "").split(",").filter(Boolean) },
          ])],
        };
      }
      case "escalate":
        return { state: s, messages: [botMsg([{ kind: "escalation", reason: input.detail?.reason ?? "You asked to speak to a person" }])] };
      case "renewal": {
        const d = input.detail?.policyId ? input.detail : s.renewal ? { policyId: s.renewal.policyId, name: s.renewal.name, days: String(s.renewal.days) } : undefined;
        if (!d?.policyId) return { state: { ...s, flow: "policy" }, messages: [botMsg([
          { kind: "text", text: "I don’t have a policy with a renewal date yet. Upload your current policy and I’ll track its renewal and check it still fits before you renew." },
          { kind: "upload_prompt", allowSkip: false },
        ])] };
        return { state: { ...s, flow: "renewal" }, messages: [botMsg([
          { kind: "text", text: `${d.name} renews in ${d.days} days. Before you renew on autopilot, it’s worth checking whether it still fits.` },
          { kind: "renewal", policyId: d.policyId },
        ])] };
      }
    }
  }

  /* ---------- quick-reply answers ---------- */
  if (input.type === "choice") {
    const { questionId, values } = input;
    const q = findQuestion(questionId);
    if (q) return advance({ ...s, profile: q.apply(s.profile, values) });

    const v = values[0];
    if (questionId === "suggested") {
      const map: Record<string, string> = { s_family: "cover", s_policy: "policy", s_adequate: "adequacy", s_compare: "compare", s_renew: "renewal" };
      return routeIntent(s, map[v] as ReturnType<typeof detectIntent>);
    }
    if (v === "show_options") return recommend(s);
    if (v === "upload_first" || v === "upload") return { state: { ...s, flow: "policy" }, messages: [botMsg([{ kind: "text", text: "Good idea. Starting with what you have avoids paying twice." }, { kind: "upload_prompt", allowSkip: true }])] };
    if (v === "advisor") return respond(s, { type: "event", name: "escalate", detail: { reason: "You asked to speak to a person" } });
    if (v === "check_enough") return advance({ ...s, flow: "adequacy" }, "Sure. A couple of quick questions first.");
  }

  /* ---------- free text ---------- */
  if (input.type === "text") {
    const text = input.text.trim();
    // Try to treat text as an answer to the pending question
    if (s.pendingQuestionId) {
      const q = findQuestion(s.pendingQuestionId);
      if (q) {
        const norm = (x: string) => x.toLowerCase().replace(/[’‘]/g, "'");
        const lower = norm(text);
        const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const choices = q.choices(s.profile);
        // Unknown first, so "I don't know" can never be read as "no".
        const unsureId = choices.find((c) => ["unsure", "unknown", "skip"].includes(c.id))?.id ?? null;
        const unsure = /not sure|don'?t know|dunno|unsure|no idea|rather not|pata nahi/.test(lower) ? unsureId : null;
        const yesNo = unsure ?? (/^(yes|yeah|yep|haan|ha)\b/.test(lower) ? "yes" : /^(no|nope|nahi)\b/.test(lower) ? "no" : null);
        const hits = unsure ? [] : choices.filter((c) => { const l = norm(c.label).replace(/^(my|about) /, ""); return l.length >= 2 && new RegExp(`\\b${esc(l)}\\b`).test(lower); });
        const ids = yesNo && choices.some((c) => c.id === yesNo) ? [yesNo] : hits.map((h) => h.id);
        if (ids.length) return advance({ ...s, profile: q.apply(s.profile, q.multi ? ids : [ids[0]]) });
      }
    }
    const answer = answerFreeform(text, s.profile);
    const intent = detectIntent(text);
    if (answer && !intent) {
      const r = s.pendingQuestionId && findQuestion(s.pendingQuestionId) ? { state: s, messages: [botMsg(askBlocks(s.pendingQuestionId, s.profile))] } : advance(s);
      return { state: r.state, messages: [botMsg([{ kind: "text", text: answer }]), ...r.messages] };
    }
    if (intent) {
      const r = routeIntent(s, intent);
      if (answer) r.messages.unshift(botMsg([{ kind: "text", text: answer }]));
      return r;
    }
    return { state: s, messages: [botMsg([
      { kind: "text", text: "I want to make sure I help with the right thing. Which of these is closest?" },
      { kind: "choices", questionId: "suggested", choices: SUGGESTED },
    ])] };
  }
  return { state: s, messages: [] };
}

function routeIntent(s: AgentState, intent: ReturnType<typeof detectIntent>): { state: AgentState; messages: Message[] } {
  switch (intent) {
    case "escalate":
      return respond(s, { type: "event", name: "escalate", detail: { reason: "You asked to speak to a person" } });
    case "renewal":
      return respond(s, { type: "event", name: "renewal" });
    case "policy":
      return { state: { ...s, flow: "policy" }, messages: [botMsg([
        { kind: "text", text: "Happy to. Upload the policy document and I’ll explain what it covers, what it doesn’t and which conditions matter, in plain words." },
        { kind: "upload_prompt", allowSkip: false },
      ])] };
    case "compare":
      if (s.recommendation) return { state: s, messages: [botMsg([{ kind: "text", text: "Here’s the comparison again, with your current priorities." }, { kind: "recommendation", recommendationId: s.recommendation.id }])] };
      return advance({ ...s, flow: "cover" }, "To compare fairly, I need to know what you’re comparing against and who it should cover.");
    case "adequacy":
      return advance({ ...s, flow: "adequacy" }, "Good question. “Enough” depends on who’s covered and what a hospital stay would cost you, so let me check a few things.");
    case "cover":
      return advance({ ...s, flow: "cover" }, "Got it. I’ll first understand who’s covered, what you already have and where the gaps might be.");
    default:
      return { state: s, messages: [botMsg([{ kind: "text", text: "What would you like help with?" }, { kind: "choices", questionId: "suggested", choices: SUGGESTED }])] };
  }
}
