/**
 * Bimora domain model.
 * Shapes mirror what a backend would persist. Payment and policy issuance are
 * deliberately separate: a successful payment never implies an issued policy.
 */

export type ID = string;
export type ISODate = string;

/** Marks records created from the demo dataset so they are never mistaken for real data. */
export interface Provenance {
  source: "user" | "document" | "insurer" | "advisor" | "mock";
  /** true for anything that came from the bundled demo dataset or a mock provider */
  isMock?: boolean;
}

export type Relationship = "self" | "spouse" | "child" | "parent" | "parent_in_law" | "other";

export interface User {
  id: ID;
  firstName?: string;
  phone?: string;
  city?: string;
  createdAt: ISODate;
}

/** A fact Bimora knows, an assumption it is making, or something still unknown. */
export type Certainty = "known" | "assumed" | "unknown";

export interface HouseholdMember {
  id: ID;
  relationship: Relationship;
  label: string;
  ageBand?: "0-17" | "18-35" | "36-45" | "46-59" | "60-70" | "70+";
  /** Only a yes/no/unknown flag is kept here. Details stay in the conversation, never in analytics. */
  hasOngoingCondition?: "yes" | "no" | "unknown";
  toCover: boolean;
}

export interface Household {
  id: ID;
  userId: ID;
  city?: string;
  members: HouseholdMember[];
  monthlyIncomeBand?: "under_50k" | "50k_1l" | "1l_2l" | "over_2l" | "unknown";
  hasLoans?: "yes" | "no" | "unknown";
  /** How large a hospital bill the family could absorb from savings */
  emergencyCushion?: "under_1l" | "1l_3l" | "3l_10l" | "over_10l" | "unknown";
  priorities: Priority[];
}

export type Priority = "low_out_of_pocket" | "family_wide" | "hospital_choice" | "affordability" | "parents_cover" | "maternity";

export type PolicyType = "health" | "term_life" | "personal_accident" | "critical_illness";
export type PolicySource = "employer" | "personal" | "unknown";

export interface Coverage {
  sumInsured?: number;
  roomRent?: string;
  coPay?: string;
  deductible?: string;
  waitingPeriods: { label: string; detail: string }[];
  exclusions: string[];
  importantConditions: string[];
  coveredItems: string[];
}

export type IssuanceStatus = "unknown" | "processing" | "issued" | "rejected" | "requires_action";
export type PaymentStatus = "not_started" | "pending" | "successful" | "failed";

export interface Policy extends Provenance {
  id: ID;
  householdId: ID;
  name: string;
  insurerName?: string;
  type: PolicyType;
  policySource: PolicySource;
  coveredMemberIds: ID[];
  coverage: Coverage;
  startDate?: ISODate;
  renewalDate?: ISODate;
  documentId?: ID;
  issuanceStatus: IssuanceStatus;
}

export type GapSeverity = "worth_reviewing" | "important" | "info";

export interface CoverageGap extends Provenance {
  id: ID;
  title: string;
  explanation: string;
  /** Bimora’s view on whether the gap actually matters for this household */
  doesItMatter: string;
  severity: GapSeverity;
  relatedMemberIds: ID[];
  basedOn: Certainty;
}

export interface InsuranceNeed {
  id: ID;
  householdId: ID;
  type: PolicyType;
  reason: string;
  addressesGapIds: ID[];
}

export interface PlanOption extends Provenance {
  id: ID;
  label: string;
  tier: "recommended" | "alternative" | "another_option";
  summary: string;
  premiumNote: string;
  illustrativeAnnualPremium: number;
  whyItFits: string[];
  gettingWhat: string[];
  givingUp: string[];
  attributes: { label: string; value: string }[];
}

export interface Recommendation extends Provenance {
  id: ID;
  needId: ID;
  createdAt: ISODate;
  priorities: Priority[];
  recommendedBecause: string[];
  options: PlanOption[];
  basedOnFacts: string[];
  assumptions: string[];
}

export interface Quote extends Provenance {
  id: ID;
  planOptionId: ID;
  annualPremium: number;
  isIllustrative: boolean;
  validUntil?: ISODate;
}

export type ActionKind = "document" | "medical_report" | "clarification" | "insurer_follow_up" | "renewal_review" | "payment";
export type ActionStatus = "pending" | "in_progress" | "done" | "blocked";

export interface Action extends Provenance {
  id: ID;
  kind: ActionKind;
  title: string;
  detail: string;
  status: ActionStatus;
  dueDate?: ISODate;
  owner: "you" | "bimora" | "insurer" | "advisor";
}

export interface Reminder extends Provenance {
  id: ID;
  title: string;
  date: ISODate;
  channel: "whatsapp" | "sms" | "call" | "in_app";
  relatedPolicyId?: ID;
}

export type DocumentStatus = "uploading" | "reading" | "analyzed" | "failed" | "unsupported";

export interface DocumentRecord extends Provenance {
  id: ID;
  fileName: string;
  docType: "policy" | "medical_report" | "id_proof" | "other";
  uploadedAt: ISODate;
  status: DocumentStatus;
  summaryPolicyId?: ID;
}

export interface AdvisorEscalation {
  id: ID;
  reason: string;
  context: string;
  status: "requested" | "scheduled" | "resolved";
  preferredSlot?: string;
  reference: string;
  isMock: boolean;
}

export interface Payment {
  id: ID;
  quoteId: ID;
  amount: number;
  status: PaymentStatus;
  method?: "upi" | "card" | "netbanking";
  approvedByUserAt?: ISODate;
  reference?: string;
  isMock: boolean;
}

export interface PolicyIssuance {
  id: ID;
  paymentId: ID;
  status: IssuanceStatus;
  policyNumber?: string;
  checkedAt: ISODate;
  note?: string;
  isMock: boolean;
}

/* ---------- Conversation ---------- */

export type Choice = { id: string; label: string };

export type MessageBlock =
  | { kind: "text"; text: string }
  | { kind: "why"; text: string }
  | { kind: "choices"; questionId: string; choices: Choice[]; multi?: boolean; max?: number; submitLabel?: string }
  | { kind: "upload_prompt"; allowSkip?: boolean; file?: { name: string; size: number; type: string } }
  | { kind: "document_summary"; policyId: ID }
  | { kind: "understanding"; facts: string[]; assumptions: string[]; unknowns: string[] }
  | { kind: "gaps"; gapIds: ID[] }
  | { kind: "recommendation"; recommendationId: ID }
  | { kind: "action"; actionIds: ID[] }
  | { kind: "escalation"; reason: string }
  | { kind: "error"; code: ServiceErrorCode; retry?: string }
  | { kind: "renewal"; policyId: ID };

export interface Message {
  id: ID;
  role: "bimora" | "user" | "system";
  blocks: MessageBlock[];
  createdAt: ISODate;
  /** quick replies already answered become read-only */
  answered?: boolean;
}

export interface Conversation {
  id: ID;
  userId: ID;
  messages: Message[];
  stage: AgentStage;
}

export type AgentStage =
  | "intent"
  | "household"
  | "existing_cover"
  | "finances"
  | "priorities"
  | "gaps"
  | "recommend"
  | "approval"
  | "payment"
  | "verify"
  | "monitor"
  | "policy_review"
  | "renewal";

export type ServiceErrorCode =
  | "upload_failed"
  | "unsupported_document"
  | "ai_unavailable"
  | "quote_unavailable"
  | "insurer_unavailable"
  | "payment_failed"
  | "issuance_pending"
  | "missing_information"
  | "escalation_required";
