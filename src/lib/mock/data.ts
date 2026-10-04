/**
 * DEMO DATASET — every record here is mock data (isMock: true).
 * Plans are labelled "Plan A/B/C" with illustrative figures. They are not
 * insurer quotes and must never be presented as one.
 */
import type {
  Action, CoverageGap, DocumentRecord, Household, Policy, PlanOption, Recommendation, Reminder, User,
} from "@/lib/types";

const day = 24 * 60 * 60 * 1000;
export const daysFromNow = (n: number) => new Date(Date.now() + n * day).toISOString();

export const DEMO_USER: User = { id: "u_demo", firstName: "Aarav", city: "Pune", createdAt: daysFromNow(-3) };

export const DEMO_HOUSEHOLD: Household = {
  id: "hh_demo",
  userId: DEMO_USER.id,
  city: "Pune",
  members: [
    { id: "m_self", relationship: "self", label: "You", ageBand: "18-35", hasOngoingCondition: "no", toCover: true },
    { id: "m_spouse", relationship: "spouse", label: "Spouse", ageBand: "18-35", hasOngoingCondition: "no", toCover: true },
    { id: "m_child", relationship: "child", label: "Child", ageBand: "0-17", hasOngoingCondition: "no", toCover: true },
    { id: "m_father", relationship: "parent", label: "Father", ageBand: "60-70", hasOngoingCondition: "unknown", toCover: true },
    { id: "m_mother", relationship: "parent", label: "Mother", ageBand: "46-59", hasOngoingCondition: "unknown", toCover: true },
  ],
  monthlyIncomeBand: "1l_2l",
  hasLoans: "yes",
  emergencyCushion: "1l_3l",
  priorities: ["family_wide", "low_out_of_pocket"],
};

export const DEMO_POLICIES: Policy[] = [
  {
    id: "pol_employer",
    householdId: DEMO_HOUSEHOLD.id,
    name: "Group health cover (employer)",
    insurerName: "Demo Insurer",
    type: "health",
    policySource: "employer",
    coveredMemberIds: ["m_self", "m_spouse", "m_child"],
    coverage: {
      sumInsured: 500000,
      roomRent: "Up to 1% of sum insured per day",
      coPay: "None",
      waitingPeriods: [{ label: "Pre-existing conditions", detail: "Covered from day one under this group plan" }],
      exclusions: ["Outpatient consultations", "Cosmetic procedures"],
      importantConditions: ["Cover is tied to your employment and usually ends when you leave the job"],
      coveredItems: ["Hospitalisation", "Day-care procedures", "Maternity (sub-limit)"],
    },
    renewalDate: daysFromNow(180),
    issuanceStatus: "issued",
    source: "mock",
    isMock: true,
  },
  {
    id: "pol_personal",
    householdId: DEMO_HOUSEHOLD.id,
    name: "Family Health Policy",
    insurerName: "Demo Insurer",
    type: "health",
    policySource: "personal",
    coveredMemberIds: ["m_self", "m_spouse"],
    coverage: {
      sumInsured: 500000,
      roomRent: "Single private room",
      coPay: "None",
      deductible: "None",
      waitingPeriods: [
        { label: "Initial waiting period", detail: "30 days from start (completed)" },
        { label: "Pre-existing conditions", detail: "3 years from start; about 20 months remain" },
        { label: "Specific illnesses", detail: "2 years for listed procedures; about 8 months remain" },
      ],
      exclusions: ["Treatment outside India", "Self-inflicted injury", "Experimental treatment"],
      importantConditions: ["Disclose health conditions honestly at renewal", "Pre-authorisation needed for planned admissions"],
      coveredItems: ["Hospitalisation", "Pre and post hospitalisation (60/90 days)", "Day-care procedures", "Ambulance"],
    },
    startDate: daysFromNow(-470),
    renewalDate: daysFromNow(42),
    documentId: "doc_policy",
    issuanceStatus: "issued",
    source: "mock",
    isMock: true,
  },
];

export const DEMO_GAPS: CoverageGap[] = [
  {
    id: "gap_employer",
    title: "Employer cover may not be enough on its own",
    explanation: "₹5 lakh is shared by three people and ends if you change jobs.",
    doesItMatter: "It matters if you might switch jobs in the next few years or a single hospital stay could exceed ₹5 lakh. If your personal policy already backs it up, the gap may be smaller than it looks.",
    severity: "important",
    relatedMemberIds: ["m_self", "m_spouse", "m_child"],
    basedOn: "known",
    source: "mock",
    isMock: true,
  },
  {
    id: "gap_parents",
    title: "Parent coverage needs separate consideration",
    explanation: "Neither policy covers your parents. Their health history isn’t known yet.",
    doesItMatter: "Cover for people over 60 often comes with co-pay and longer waits. Whether it’s worth it depends on their health and how much you could pay out of pocket. We’ll look at that before suggesting anything.",
    severity: "important",
    relatedMemberIds: ["m_father", "m_mother"],
    basedOn: "unknown",
    source: "mock",
    isMock: true,
  },
  {
    id: "gap_waiting",
    title: "Existing policy has a waiting period worth reviewing",
    explanation: "About 20 months remain on the pre-existing condition wait in your personal policy.",
    doesItMatter: "If you move, porting usually keeps your waiting credit up to your current cover, but any extra cover starts its own wait. Worth comparing carefully rather than replacing quickly.",
    severity: "worth_reviewing",
    relatedMemberIds: ["m_self", "m_spouse"],
    basedOn: "known",
    source: "mock",
    isMock: true,
  },
];

export const DEMO_PLANS: PlanOption[] = [
  {
    id: "plan_a",
    label: "Plan A",
    tier: "recommended",
    summary: "Family floater that stays with you if you change jobs, with low out-of-pocket costs.",
    premiumNote: "Mid-range premium",
    illustrativeAnnualPremium: 28400,
    whyItFits: ["Broader relevant coverage for the whole family", "No co-pay on claims", "Waiting periods that work with what you already have", "Fits your stated priorities"],
    gettingWhat: ["Cover that doesn’t depend on your job", "No share of the bill on each claim", "No room rent cap, so other charges aren’t cut in proportion"],
    givingUp: ["Costs more each year than Plan B", "Does not cover your parents; they need a separate decision"],
    attributes: [
      { label: "Cover", value: "₹15 lakh, family floater" },
      { label: "Co-pay", value: "None" },
      { label: "Room", value: "No cap" },
      { label: "Pre-existing wait", value: "2 years" },
    ],
    source: "mock",
    isMock: true,
  },
  {
    id: "plan_b",
    label: "Plan B",
    tier: "alternative",
    summary: "Lower premium, with more of each claim paid by you.",
    premiumNote: "Lower premium",
    illustrativeAnnualPremium: 19600,
    whyItFits: ["Keeps yearly cost down"],
    gettingWhat: ["Lowest yearly cost of the three"],
    givingUp: ["Higher co-pay on every claim", "Narrower coverage", "Longer waiting period"],
    attributes: [
      { label: "Cover", value: "₹10 lakh, family floater" },
      { label: "Co-pay", value: "20% on every claim" },
      { label: "Room", value: "Capped at 1% of cover/day" },
      { label: "Pre-existing wait", value: "3 years" },
    ],
    source: "mock",
    isMock: true,
  },
  {
    id: "plan_c",
    label: "Plan C",
    tier: "another_option",
    summary: "Higher premium for broader benefits and fewer restrictions.",
    premiumNote: "Higher premium",
    illustrativeAnnualPremium: 36900,
    whyItFits: ["Broadest benefits of the three"],
    gettingWhat: ["Broader benefits", "Fewer restrictions", "Restores cover if used up in a year"],
    givingUp: ["Highest yearly cost", "Some benefits you may never use"],
    attributes: [
      { label: "Cover", value: "₹25 lakh, family floater" },
      { label: "Co-pay", value: "None" },
      { label: "Room", value: "No cap" },
      { label: "Pre-existing wait", value: "1 year" },
    ],
    source: "mock",
    isMock: true,
  },
];

export const DEMO_RECOMMENDATION: Recommendation = {
  id: "rec_demo",
  needId: "need_family",
  createdAt: daysFromNow(0),
  priorities: ["family_wide", "low_out_of_pocket", "hospital_choice", "affordability"],
  recommendedBecause: [
    "It matches your household structure: one floater for you, your spouse and your child.",
    "It addresses the most important gap: cover that doesn’t end if you change jobs.",
    "Its trade-offs fit what you told me: you’d rather pay a bit more each year than a large share at the hospital.",
  ],
  options: DEMO_PLANS,
  basedOnFacts: ["3 people to cover under one plan", "Employer cover of ₹5 lakh", "Personal policy of ₹5 lakh for two people"],
  assumptions: ["You may change jobs in the next few years", "Your parents are considered separately"],
  source: "mock",
  isMock: true,
};

export const DEMO_ACTIONS: Action[] = [
  { id: "act_medical", kind: "medical_report", title: "Medical document pending", detail: "Your father’s latest blood sugar report would let insurers assess him properly.", status: "pending", dueDate: daysFromNow(7), owner: "you", source: "mock", isMock: true },
  { id: "act_clarify", kind: "insurer_follow_up", title: "Insurer clarification required", detail: "Confirm whether the personal policy’s waiting period carries over on an upgrade.", status: "in_progress", dueDate: daysFromNow(4), owner: "bimora", source: "mock", isMock: true },
  { id: "act_stored", kind: "document", title: "Policy document stored", detail: "Family Health Policy saved and summarised.", status: "done", owner: "bimora", source: "mock", isMock: true },
  { id: "act_renewal", kind: "renewal_review", title: "Review before renewal", detail: "Family Health Policy renews in 42 days. Worth a look at the sum insured.", status: "pending", dueDate: daysFromNow(35), owner: "you", source: "mock", isMock: true },
];

export const DEMO_REMINDERS: Reminder[] = [
  { id: "rem_medical", title: "Upload father’s medical report", date: daysFromNow(7), channel: "whatsapp", source: "mock", isMock: true },
  { id: "rem_renewal", title: "Family Health Policy renewal", date: daysFromNow(42), channel: "whatsapp", relatedPolicyId: "pol_personal", source: "mock", isMock: true },
];

export const DEMO_DOCUMENTS: DocumentRecord[] = [
  { id: "doc_policy", fileName: "Health_Policy.pdf", docType: "policy", uploadedAt: daysFromNow(-2), status: "analyzed", summaryPolicyId: "pol_personal", source: "mock", isMock: true },
];
