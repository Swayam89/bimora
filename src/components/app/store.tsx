"use client";
/**
 * Client-side app state for the Bimora product experience.
 * In production this is backed by an API (conversations, households, policies,
 * actions). Here it is held in memory and seeded from onboarding + the demo dataset.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Action, DocumentRecord, IssuanceStatus, Message, PaymentStatus, PlanOption, Policy, Recommendation, ServiceErrorCode } from "@/lib/types";
import { services } from "@/services";
import type { DocumentAnalysisResult } from "@/services/contracts";
import { respond, userMsg, botMsg, type AgentInput, type AgentState } from "@/lib/agent/engine";
import { DEMO_PROFILE, EMPTY_PROFILE, type Profile } from "@/lib/agent/profile";
import { buildGaps } from "@/lib/agent/analysis";
import { DEMO_ACTIONS, DEMO_DOCUMENTS, DEMO_POLICIES, DEMO_RECOMMENDATION, daysFromNow } from "@/lib/mock/data";
import { loadProfile, saveProfile } from "@/lib/session";
import { scenarios } from "@/services/scenarios";
import { track } from "@/lib/analytics";
import { daysUntil } from "@/lib/format";

export type View = "chat" | "coverage" | "policies" | "recommendations" | "tasks" | "renewals";

export interface Purchase { plan: PlanOption; paymentStatus: PaymentStatus; issuanceStatus: IssuanceStatus; at: string }

interface Ctx {
  view: View; setView: (v: View) => void;
  profile: Profile; isDemoProfile: boolean;
  agent: AgentState;
  messages: Message[];
  typing: boolean;
  send: (text: string) => void;
  choose: (msgId: string, questionId: string, values: string[], labels: string[]) => void;
  event: (name: Extract<AgentInput, { type: "event" }>["name"], detail?: Record<string, string>) => void;
  retryLast: () => void;
  attach: (file: { name: string; size: number; type: string }) => void;
  onPolicyAnalyzed: (r: DocumentAnalysisResult) => void;
  analyses: Record<string, DocumentAnalysisResult>;
  policies: Policy[]; documents: DocumentRecord[]; actions: Action[];
  setActionStatus: (id: string, status: Action["status"], detail?: string) => void;
  recheckIssuance: () => Promise<void>;
  approvalKey: number;
  recommendation: Recommendation;
  hasLiveRecommendation: boolean;
  purchase: Purchase | null;
  completePurchase: (p: Omit<Purchase, "at">) => void;
  approvalPlan: PlanOption | null; openApproval: (p: PlanOption) => void; closeApproval: () => void;
  advisor: { open: boolean; reason: string }; openAdvisor: (reason?: string) => void; closeAdvisor: () => void;
  voiceOpen: boolean; setVoiceOpen: (b: boolean) => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(AppCtx); if (!c) throw new Error("useApp outside provider"); return c; };

const DECLARATION_ACTION: Action = { id: "act_declaration", kind: "clarification", title: "Confirm your health declaration", detail: "The insurer may ask you to confirm the health details you shared. Answer honestly; it protects future claims.", status: "pending", dueDate: daysFromNow(7), owner: "you", source: "mock", isMock: true };
const ISSUANCE_ACTION: Action = { id: "act_issuance", kind: "insurer_follow_up", title: "Waiting for the insurer to issue your policy", detail: "Payment is done. Bimora checks issuance with the insurer and will tell you once it’s confirmed.", status: "in_progress", owner: "insurer", source: "mock", isMock: true };

export function AppProvider({ children, startWithVoice }: { children: ReactNode; startWithVoice?: boolean }) {
  const [view, setViewState] = useState<View>("chat");
  const [ready, setReady] = useState(false);
  const [isDemoProfile, setIsDemo] = useState(false);
  const [agent, setAgent] = useState<AgentState>({ profile: EMPTY_PROFILE, flow: null, gaps: [] });
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [analyses, setAnalyses] = useState<Record<string, DocumentAnalysisResult>>({});
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [approvalPlan, setApprovalPlan] = useState<PlanOption | null>(null);
  const [approvalKey, setApprovalKey] = useState(0);
  const typingRef = useRef(false);
  const [advisor, setAdvisor] = useState({ open: false, reason: "" });
  const [voiceOpen, setVoiceOpen] = useState(!!startWithVoice);
  const agentRef = useRef(agent); agentRef.current = agent;
  const lastInput = useRef<AgentInput | null>(null);
  const demoRef = useRef(false);

  // Seed from onboarding (or the demo household) and greet once.
  useEffect(() => {
    const saved = loadProfile();
    const profile = saved?.completedOnboarding ? saved : startWithVoice ? { ...EMPTY_PROFILE, ...(saved ?? {}) } : DEMO_PROFILE;
    const demo = !saved?.completedOnboarding && !startWithVoice;
    setIsDemo(demo); demoRef.current = demo;
    // Demo records only for the demo household. A real user starts with nothing we haven't learned from them.
    if (demo) { setPolicies(DEMO_POLICIES); setDocuments(DEMO_DOCUMENTS); setActions(DEMO_ACTIONS); }
    const init: AgentState = { profile, flow: null, gaps: buildGaps(profile) };
    const r = respond(init, { type: "event", name: "start", detail: demo ? { demo: "1" } : undefined });
    setAgent(r.state); setMessages(r.messages); setReady(true);
    track("conversation_started", { intent: profile.intent ?? (startWithVoice ? "talk" : "demo") });
    const h = window.location.hash.replace("#", "") as View;
    if (["coverage", "policies", "recommendations", "tasks", "renewals"].includes(h)) setViewState(h);
  }, [startWithVoice]);

  // Keep the agent aware of the next renewal so "renew" requests point at a real stored policy.
  useEffect(() => {
    const next = policies.filter((x) => x.renewalDate && x.issuanceStatus === "issued").sort((a, b) => a.renewalDate!.localeCompare(b.renewalDate!))[0];
    setAgent((a) => ({ ...a, renewal: next ? { policyId: next.id, name: next.name, days: daysUntil(next.renewalDate!) } : undefined }));
  }, [policies]);

  const setView = useCallback((v: View) => {
    setViewState(v);
    history.replaceState(null, "", v === "chat" ? window.location.pathname + window.location.search : `#${v}`);
    if (v === "renewals") track("renewal_opened", { source: "nav" });
  }, []);

  const run = useCallback((input: AgentInput, echo?: string) => {
    if (typingRef.current && input.type !== "event") return; // one turn at a time
    lastInput.current = input;
    if (echo) setMessages((m) => [...(input.type === "text" ? m.map((x) => ({ ...x, answered: true })) : m), userMsg(echo)]);
    setTyping(true); typingRef.current = true;
    const delay = 450 + Math.random() * 450;
    setTimeout(() => {
      setTyping(false); typingRef.current = false;
      if (scenarios.is("ai_unavailable") && input.type !== "event") {
        setMessages((m) => [...m, botMsg([{ kind: "error", code: "ai_unavailable", retry: "last" }])]);
        return;
      }
      const r = respond(agentRef.current, input);
      setAgent(r.state);
      if (!demoRef.current) saveProfile(r.state.profile);
      setMessages((m) => [...m, ...r.messages]);
      if (r.messages.some((x) => x.blocks.some((b) => b.kind === "recommendation"))) track("recommendation_generated", { source: "chat" });
    }, delay);
  }, []);

  const send = useCallback((text: string) => { if (text.trim()) run({ type: "text", text }, text); }, [run]);
  const choose = useCallback((msgId: string, questionId: string, values: string[], labels: string[]) => {
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, answered: true } : x)));
    run({ type: "choice", questionId, values, labels }, labels.join(", "));
  }, [run]);
  const event = useCallback((name: Extract<AgentInput, { type: "event" }>["name"], detail?: Record<string, string>) => run({ type: "event", name, detail }), [run]);
  const retryLast = useCallback(() => { if (lastInput.current) run(lastInput.current); }, [run]);

  const attach = useCallback((file: { name: string; size: number; type: string }) => {
    setView("chat");
    setMessages((m) => [...m, userMsg(`Uploaded ${file.name}`), botMsg([{ kind: "upload_prompt", file }])]);
  }, [setView]);

  const onPolicyAnalyzed = useCallback((r: DocumentAnalysisResult) => {
    setAnalyses((a) => ({ ...a, [r.document.id]: r }));
    setDocuments((d) => [r.document, ...d]);
    // Track the analysed policy (sample data in this demo) so renewals and coverage can use it.
    setPolicies((list) => list.some((x) => x.documentId === r.document.id) ? list : [{
      id: `pol_${r.document.id}`, householdId: "hh", name: r.policy.name, type: "health", policySource: r.policy.policySource,
      coveredMemberIds: [], coverage: r.policy.coverage, renewalDate: daysFromNow(42), documentId: r.document.id, issuanceStatus: "issued", source: "document", isMock: true,
    }, ...list.filter((x) => !x.id.startsWith("pol_") || x.documentId !== r.document.id)]);
    setActions((a) => a.some((x) => x.id === "act_stored") ? a : [...a, { ...DEMO_ACTIONS.find((x) => x.id === "act_stored")!, detail: `${r.document.fileName} saved and summarised (sample analysis).` }]);
    run({ type: "event", name: "policy_analyzed" });
  }, [run]);

  const setActionStatus = useCallback((id: string, status: Action["status"], detail?: string) => setActions((a) => a.map((x) => (x.id === id ? { ...x, status, detail: detail ?? x.detail } : x))), []);

  /** Re-checks a pending issuance with the insurer (simulated). Payment status is never touched here. */
  const recheckIssuance = useCallback(async () => {
    const v = await services.issuance.verify("recheck");
    if (!v.ok || v.data.status !== "issued") {
      setMessages((m) => [...m, botMsg([v.ok ? { kind: "text", text: "I checked again. The insurer still hasn’t confirmed issuance, so you’re not covered yet. I’ll keep it on your task list." } : { kind: "error", code: v.error.code as ServiceErrorCode }])]);
      return;
    }
    setPolicies((list) => list.map((x) => (x.id === "pol_new" ? { ...x, issuanceStatus: "issued", renewalDate: daysFromNow(365) } : x)));
    setActions((a) => a.map((x) => (x.id === "act_issuance" ? { ...x, status: "done", title: "Policy issued by the insurer", detail: "Confirmed on re-check (simulated)." } : x)));
    setPurchase((pp) => (pp ? { ...pp, issuanceStatus: "issued" } : pp));
    setMessages((m) => [...m, botMsg([{ kind: "text", text: "Good news: the insurer has now confirmed your policy is issued. (Simulated in this demo.)" }])]);
    track("policy_issuance_verified", { status: "issued", source: "recheck" });
  }, []);

  const completePurchase = useCallback((p: Omit<Purchase, "at">) => {
    setPurchase({ ...p, at: new Date().toISOString() });
    if (p.paymentStatus !== "successful") return;
    const issued = p.issuanceStatus === "issued";
    setPolicies((list) => [{
      id: "pol_new", householdId: "hh", name: `${p.plan.label} · Family floater`, insurerName: "Demo Insurer", type: "health", policySource: "personal",
      coveredMemberIds: [], coverage: { waitingPeriods: [], exclusions: [], importantConditions: [], coveredItems: p.plan.gettingWhat },
      startDate: undefined, renewalDate: issued ? daysFromNow(365) : undefined, issuanceStatus: p.issuanceStatus, source: "mock", isMock: true,
    }, ...list.filter((x) => x.id !== "pol_new")]);
    const hasParents = agentRef.current.profile.members.includes("parents");
    const ids = [...(issued ? [] : ["act_issuance"]), ...(hasParents ? ["act_medical"] : ["act_declaration"]), ...(issued ? ["act_stored", "act_renewal"] : [])];
    setActions((a) => {
      const keep = a.filter((x) => x.id !== "act_issuance");
      const need = ids.filter((id) => id !== "act_issuance" && !keep.some((x) => x.id === id));
      const added = need.map((id) => {
        if (id === "act_declaration") return DECLARATION_ACTION;
        const t = DEMO_ACTIONS.find((x) => x.id === id)!;
        return id === "act_stored" ? { ...t, detail: `${p.plan.label} policy document saved.` } : id === "act_renewal" ? { ...t, detail: `${p.plan.label} renews in a year. Bimora will check in before then.`, dueDate: daysFromNow(330) } : t;
      });
      return [...(issued ? [] : [ISSUANCE_ACTION]), ...keep, ...added];
    });
    run({ type: "event", name: "purchase_complete", detail: { issuance: p.issuanceStatus, actions: ids.join(",") } });
  }, [run]);

  const value = useMemo<Ctx>(() => ({
    view, setView, profile: agent.profile, isDemoProfile, agent, messages, typing, send, choose, event, retryLast, attach, onPolicyAnalyzed, analyses,
    policies, documents, actions, setActionStatus, recheckIssuance, approvalKey,
    recommendation: agent.recommendation ?? DEMO_RECOMMENDATION, hasLiveRecommendation: !!agent.recommendation,
    purchase, completePurchase,
    approvalPlan, openApproval: (p) => { setApprovalKey((k) => k + 1); setApprovalPlan(p); }, closeApproval: () => setApprovalPlan(null),
    advisor, openAdvisor: (reason = "I’d like help from a person") => setAdvisor({ open: true, reason }), closeAdvisor: () => setAdvisor((a) => ({ ...a, open: false })),
    voiceOpen, setVoiceOpen,
  }), [view, setView, agent, isDemoProfile, messages, typing, send, choose, event, retryLast, attach, onPolicyAnalyzed, analyses, policies, documents, actions, setActionStatus, purchase, completePurchase, approvalPlan, approvalKey, recheckIssuance, advisor, voiceOpen]);

  if (!ready) return <div className="min-h-dvh bg-canvas" aria-busy="true" />;
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
