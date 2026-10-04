/**
 * Service contracts. UI and agent code depend only on these interfaces.
 * Each has a mock provider today; swap in a real client in services/index.ts.
 *
 * Planned providers (not integrated): Gnani (voice), Delhivery (location),
 * Pine Labs (payments). Insurer, messaging and document AI vendors are TBD.
 */
import type {
  AdvisorEscalation, Coverage, DocumentRecord, IssuanceStatus, Payment, PlanOption, Policy, PolicyIssuance, Quote,
} from "@/lib/types";

export type Result<T> = { ok: true; data: T } | { ok: false; error: ServiceError };

export interface ServiceError {
  code:
    | "upload_failed" | "unsupported_document" | "ai_unavailable" | "quote_unavailable" | "insurer_unavailable"
    | "payment_failed" | "issuance_pending" | "missing_information" | "escalation_required" | "network";
  /** internal detail for logs only. Never render this to users. */
  internal?: string;
}

/* Voice — planned provider: Gnani */
export type VoiceState = "idle" | "listening" | "thinking" | "speaking";
export interface VoiceTurn { transcript: string; reply: string }
export interface VoiceService {
  readonly provider: string;
  readonly isSimulated: boolean;
  /** Streams a simulated or real turn. onPartial receives growing transcript/reply text. */
  runTurn(opts: {
    prompt?: string;
    onState: (s: VoiceState) => void;
    onTranscript: (text: string) => void;
    onReply: (text: string) => void;
    signal: AbortSignal;
  }): Promise<Result<VoiceTurn>>;
}

/* Location — planned provider: Delhivery */
export interface LocationService {
  readonly provider: string;
  suggestCities(query: string): Promise<Result<{ city: string; state: string; pincodePrefix?: string }[]>>;
}

/* Payments — planned provider: Pine Labs */
export interface PaymentService {
  readonly provider: string;
  /** Must only be called after the user has explicitly approved the exact plan and amount. */
  createPayment(input: { quote: Quote; approvedAt: string; method: Payment["method"] }): Promise<Result<Payment>>;
  confirmPayment(paymentId: string): Promise<Result<Payment>>;
}

/* Messaging */
export interface WhatsAppService { sendTemplate(input: { to: string; template: string; vars: Record<string, string> }): Promise<Result<{ id: string }>> }
export interface SMSService { send(input: { to: string; body: string }): Promise<Result<{ id: string }>> }
export interface CallService { scheduleCallback(input: { to: string; slot: string; reason: string }): Promise<Result<{ id: string }>> }

/* Insurance */
export interface QuoteService { getQuote(plan: PlanOption): Promise<Result<Quote>> }
export interface UnderwritingService {
  requirements(input: { planId: string; memberAgeBands: string[]; conditionsFlag: "yes" | "no" | "unknown" }): Promise<Result<{ medicalTestsLikely: boolean; notes: string[] }>>;
}
export interface PolicyIssuanceService {
  /** Checks issuance with the insurer. Independent of payment status by design. */
  verify(paymentId: string): Promise<Result<PolicyIssuance>>;
  latestStatus(paymentId: string): IssuanceStatus | undefined;
}

/* Documents */
export interface DocumentAnalysisResult {
  document: DocumentRecord;
  policy: Pick<Policy, "id" | "name" | "type" | "policySource"> & { coverage: Coverage };
  /** true when the analysis is a demo sample and the uploaded file was NOT actually read */
  isSampleAnalysis: boolean;
}
export interface DocumentAnalysisService {
  readonly acceptedTypes: string[];
  readonly maxBytes: number;
  analyze(file: { name: string; size: number; type: string }, onStage: (s: "uploading" | "reading") => void): Promise<Result<DocumentAnalysisResult>>;
}

/* Human support */
export interface AdvisorEscalationService {
  request(input: { reason: string; context: string; preferredSlot?: string }): Promise<Result<AdvisorEscalation>>;
}

export interface Services {
  voice: VoiceService;
  location: LocationService;
  payment: PaymentService;
  whatsapp: WhatsAppService;
  sms: SMSService;
  call: CallService;
  quote: QuoteService;
  underwriting: UnderwritingService;
  issuance: PolicyIssuanceService;
  documents: DocumentAnalysisService;
  advisor: AdvisorEscalationService;
}
