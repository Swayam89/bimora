/**
 * MOCK PROVIDERS. Simulate latency and outcomes so the product can be demoed
 * end to end. Every object they return is flagged isMock / isSampleAnalysis.
 */
import type {
  AdvisorEscalationService, CallService, DocumentAnalysisService, LocationService, PaymentService,
  PolicyIssuanceService, QuoteService, Result, Services, SMSService, UnderwritingService, VoiceService, WhatsAppService,
} from "./contracts";
import type { IssuanceStatus, Payment } from "@/lib/types";
import { DEMO_POLICIES } from "@/lib/mock/data";
import { answerFreeform } from "@/lib/agent/analysis";
import { EMPTY_PROFILE } from "@/lib/agent/profile";
import { scenarios } from "./scenarios";

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("aborted", "AbortError")); });
  });
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const ref = (p: string) => `${p}-DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

/* Voice: simulated; replace with a Gnani streaming client (ASR + TTS). */
const voice: VoiceService = {
  provider: "simulated (Gnani planned)",
  isSimulated: true,
  async runTurn({ prompt, onState, onTranscript, onReply, signal }) {
    const said = prompt ?? "My employer gives me five lakh rupees of cover. Do I need more?";
    try {
      onState("listening");
      const words = said.split(" ");
      for (let i = 1; i <= words.length; i++) { await wait(170, signal); onTranscript(words.slice(0, i).join(" ")); }
      onState("thinking");
      await wait(700, signal);
      if (scenarios.is("ai_unavailable")) { onState("idle"); return { ok: false, error: { code: "ai_unavailable" } }; }
      const reply = answerFreeform(said, EMPTY_PROFILE) ??
        "I can help with that. Tell me a little about who you’d like to cover, and I’ll ask only what matters for the next decision.";
      onState("speaking");
      const rw = reply.split(" ");
      for (let i = 1; i <= rw.length; i++) { await wait(60, signal); onReply(rw.slice(0, i).join(" ")); }
      onState("idle");
      return ok({ transcript: said, reply });
    } catch {
      onState("idle");
      return { ok: false, error: { code: "network", internal: "aborted" } };
    }
  },
};

/* Location: static list; replace with Delhivery pincode / locality API. */
const CITIES = [
  ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"], ["Delhi", "Delhi"], ["Gurugram", "Haryana"], ["Noida", "Uttar Pradesh"],
  ["Bengaluru", "Karnataka"], ["Hyderabad", "Telangana"], ["Chennai", "Tamil Nadu"], ["Kolkata", "West Bengal"], ["Ahmedabad", "Gujarat"],
  ["Surat", "Gujarat"], ["Jaipur", "Rajasthan"], ["Lucknow", "Uttar Pradesh"], ["Indore", "Madhya Pradesh"], ["Kochi", "Kerala"],
  ["Chandigarh", "Chandigarh"], ["Nagpur", "Maharashtra"], ["Bhopal", "Madhya Pradesh"], ["Coimbatore", "Tamil Nadu"], ["Vadodara", "Gujarat"],
];
const location: LocationService = {
  provider: "static list (Delhivery planned)",
  async suggestCities(q) {
    const s = q.trim().toLowerCase();
    return ok(CITIES.filter(([c]) => !s || c.toLowerCase().startsWith(s)).slice(0, 6).map(([city, state]) => ({ city, state })));
  },
};

/* Payment: simulated; replace with Pine Labs. Refuses to run without an approval timestamp. */
const payments = new Map<string, Payment>();
const payment: PaymentService = {
  provider: "simulated (Pine Labs planned)",
  async createPayment({ quote, approvedAt, method }) {
    if (!approvedAt) return { ok: false, error: { code: "missing_information", internal: "payment attempted without approval" } };
    const p: Payment = { id: ref("PAY"), quoteId: quote.id, amount: quote.annualPremium, status: "pending", method, approvedByUserAt: approvedAt, isMock: true };
    payments.set(p.id, p);
    return ok(p);
  },
  async confirmPayment(id) {
    await wait(1800);
    const p = payments.get(id);
    if (!p) return { ok: false, error: { code: "payment_failed", internal: "unknown payment" } };
    const next: Payment = scenarios.is("payment_failed") ? { ...p, status: "failed" } : { ...p, status: "successful", reference: ref("TXN") };
    payments.set(id, next);
    return next.status === "successful" ? ok(next) : { ok: false, error: { code: "payment_failed" } };
  },
};

const messaging = {
  whatsapp: { async sendTemplate() { await wait(200); return ok({ id: ref("WA") }); } } as WhatsAppService,
  sms: { async send() { await wait(200); return ok({ id: ref("SMS") }); } } as SMSService,
  call: { async scheduleCallback() { await wait(200); return ok({ id: ref("CALL") }); } } as CallService,
};

const quote: QuoteService = {
  async getQuote(plan) {
    await wait(700);
    if (scenarios.is("quote_unavailable")) return { ok: false, error: { code: "quote_unavailable" } };
    return ok({ id: ref("QT"), planOptionId: plan.id, annualPremium: plan.illustrativeAnnualPremium, isIllustrative: true, source: "mock", isMock: true });
  },
};

const underwriting: UnderwritingService = {
  async requirements({ memberAgeBands, conditionsFlag }) {
    await wait(400);
    const older = memberAgeBands.some((b) => b === "60-70" || b === "70+");
    return ok({ medicalTestsLikely: older || conditionsFlag !== "no", notes: older ? ["Insurers often ask for a health check for members over 60."] : [] });
  },
};

const issuanceStore = new Map<string, IssuanceStatus>();
const issuance: PolicyIssuanceService = {
  async verify(paymentId) {
    await wait(2200);
    if (scenarios.is("insurer_unavailable")) return { ok: false, error: { code: "insurer_unavailable" } };
    const status: IssuanceStatus = scenarios.is("issuance_pending") ? "processing" : "issued";
    issuanceStore.set(paymentId, status);
    return ok({ id: ref("ISS"), paymentId, status, policyNumber: status === "issued" ? ref("POL") : undefined, checkedAt: new Date().toISOString(), isMock: true,
      note: status === "processing" ? "Insurer has not confirmed issuance yet." : undefined });
  },
  latestStatus: (id) => issuanceStore.get(id),
};

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const documents: DocumentAnalysisService = {
  acceptedTypes: ACCEPTED,
  maxBytes: 15 * 1024 * 1024,
  async analyze(file, onStage) {
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const typeOk = ACCEPTED.includes(file.type) || ["pdf", "jpg", "jpeg", "png", "webp", "heic"].includes(ext);
    if (!typeOk) return { ok: false, error: { code: "unsupported_document", internal: file.type } };
    if (file.size > this.maxBytes) return { ok: false, error: { code: "unsupported_document", internal: "too large" } };
    onStage("uploading");
    await wait(1100);
    if (scenarios.is("upload_failed")) return { ok: false, error: { code: "upload_failed" } };
    onStage("reading");
    await wait(1700);
    const sample = DEMO_POLICIES[1];
    return ok({
      document: { id: ref("DOC"), fileName: file.name, docType: "policy", uploadedAt: new Date().toISOString(), status: "analyzed", summaryPolicyId: sample.id, source: "mock", isMock: true },
      policy: { id: sample.id, name: "Your policy (sample analysis)", type: "health", policySource: "personal", coverage: sample.coverage },
      isSampleAnalysis: true,
    });
  },
};

const advisor: AdvisorEscalationService = {
  async request({ reason, context, preferredSlot }) {
    await wait(900);
    return ok({ id: ref("ESC"), reason, context, preferredSlot, status: "requested", reference: ref("REQ"), isMock: true });
  },
};

export const mockServices: Services = { voice, location, payment, ...messaging, quote, underwriting, issuance, documents, advisor };
