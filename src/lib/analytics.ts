/**
 * Analytics hooks. Only whitelisted, non-sensitive properties are sent.
 * Never pass names, phone numbers, health details, income or document contents.
 */
export type AnalyticsEvent =
  | "landing_view" | "hero_cta_clicked" | "signup_started" | "signup_completed" | "conversation_started"
  | "policy_upload_started" | "policy_upload_completed" | "recommendation_generated" | "recommendation_viewed"
  | "recommendation_approved" | "payment_started" | "payment_approved" | "policy_issuance_verified"
  | "advisor_escalation" | "renewal_opened";

const ALLOWED_KEYS = new Set(["cta", "location", "step", "intent", "plan_tier", "status", "source", "result", "view", "members_count"]);
type Props = Record<string, string | number | boolean | undefined>;

function sanitize(props: Props = {}): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) if (ALLOWED_KEYS.has(k) && v !== undefined) out[k] = typeof v === "string" ? v.slice(0, 48) : v;
  return out;
}

declare global { interface Window { dataLayer?: unknown[] } }

export function track(event: AnalyticsEvent, props?: Props) {
  if (typeof window === "undefined") return;
  const payload = { event, ...sanitize(props), ts: Date.now() };
  (window.dataLayer ??= []).push(payload);
  if (process.env.NODE_ENV !== "production") console.debug("[analytics]", payload);
}
