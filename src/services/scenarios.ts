/**
 * Demo scenario switches. Lets a presenter trigger failure states on purpose
 * (insurer down, payment failure, issuance pending...). Mock providers read these.
 * Not used by real providers.
 */
export type ScenarioKey =
  | "upload_failed" | "ai_unavailable" | "quote_unavailable" | "insurer_unavailable" | "payment_failed" | "issuance_pending";

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  upload_failed: "Policy upload fails",
  ai_unavailable: "Bimora can’t respond",
  quote_unavailable: "Quote unavailable",
  insurer_unavailable: "Insurer unavailable",
  payment_failed: "Payment fails",
  issuance_pending: "Issuance still processing",
};

type State = Record<ScenarioKey, boolean>;
let state: State = {
  upload_failed: false, ai_unavailable: false, quote_unavailable: false,
  insurer_unavailable: false, payment_failed: false, issuance_pending: false,
};
const listeners = new Set<() => void>();

export const scenarios = {
  get: () => state,
  is: (k: ScenarioKey) => state[k],
  set(k: ScenarioKey, v: boolean) { state = { ...state, [k]: v }; listeners.forEach((l) => l()); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};
