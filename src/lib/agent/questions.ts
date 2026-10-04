import type { Choice, Priority } from "@/lib/types";
import type { Profile } from "./profile";

/**
 * Question bank. The planner asks the first question whose `relevant()` is
 * true and `answered()` is false — so every question asked changes the next decision.
 */
export interface Question {
  id: string;
  text: (p: Profile) => string;
  why: string;
  choices: (p: Profile) => Choice[];
  multi?: boolean;
  max?: number;
  relevant: (p: Profile) => boolean;
  answered: (p: Profile) => boolean;
  apply: (p: Profile, values: string[]) => Profile;
}

const hasParents = (p: Profile) => p.members.includes("parents");

export const QUESTIONS: Question[] = [
  {
    id: "who",
    text: () => "Who would you like to cover?",
    why: "Who’s covered decides whether one shared plan works or some people need their own.",
    choices: () => [
      { id: "me", label: "Me" }, { id: "spouse", label: "My spouse" },
      { id: "children", label: "My children" }, { id: "parents", label: "My parents" },
    ],
    multi: true,
    relevant: () => true,
    answered: (p) => p.members.length > 0,
    apply: (p, v) => ({ ...p, members: v as Profile["members"] }),
  },
  {
    id: "eldest",
    text: (p) => (hasParents(p) ? "How old is the eldest person you’d like to cover?" : "Roughly how old is the eldest person in this plan?"),
    why: "Age changes which plans accept someone and whether a co-pay applies.",
    choices: (p) => [
      { id: "under_35", label: "Under 35" }, { id: "35_45", label: "35–45" }, { id: "46_59", label: "46–59" },
      ...(hasParents(p) || p.members.includes("me") ? [{ id: "60_plus", label: "60 or older" }] : []),
    ],
    relevant: () => true,
    answered: (p) => !!p.eldestBand,
    apply: (p, v) => ({ ...p, eldestBand: v[0] as Profile["eldestBand"] }),
  },
  {
    id: "parents_condition",
    text: () => "Do either of your parents have an ongoing condition, like diabetes or high BP?",
    why: "It affects which insurers will cover them and how long they’d wait for that condition. “Not sure” is fine; I’ll keep it open rather than assume.",
    choices: () => [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }, { id: "unknown", label: "Not sure" }],
    relevant: hasParents,
    answered: (p) => !!p.parentsCondition,
    apply: (p, v) => ({ ...p, parentsCondition: v[0] as Profile["parentsCondition"] }),
  },
  {
    id: "has_insurance",
    text: () => "Do you already have health insurance?",
    why: "What you already have decides whether you need something new, a top-up, or nothing at all.",
    choices: () => [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }, { id: "unsure", label: "I’m not sure" }],
    relevant: () => true,
    answered: (p) => !!p.hasInsurance,
    apply: (p, v) => ({ ...p, hasInsurance: v[0] as Profile["hasInsurance"] }),
  },
  {
    id: "insurance_source",
    text: () => "Where is that cover from?",
    why: "Employer cover usually ends when you leave the job. A policy you bought stays with you.",
    choices: () => [
      { id: "employer", label: "My employer" }, { id: "personal", label: "I bought it" },
      { id: "both", label: "Both" }, { id: "unsure", label: "Not sure" },
    ],
    relevant: (p) => p.hasInsurance === "yes",
    answered: (p) => !!p.insuranceSource,
    apply: (p, v) => ({ ...p, insuranceSource: v[0] as Profile["insuranceSource"] }),
  },
  {
    id: "employer_cover",
    text: () => "Roughly how much cover does your employer give you?",
    why: "This tells me how big a hospital bill is already handled before anything else kicks in.",
    choices: () => [
      { id: "3l", label: "About ₹3 lakh" }, { id: "5l", label: "About ₹5 lakh" },
      { id: "10l", label: "₹10 lakh or more" }, { id: "unknown", label: "Not sure" },
    ],
    relevant: (p) => p.insuranceSource === "employer" || p.insuranceSource === "both",
    answered: (p) => !!p.employerCover,
    apply: (p, v) => ({ ...p, employerCover: v[0] as Profile["employerCover"] }),
  },
  {
    id: "cushion",
    text: () => "If a ₹3 lakh hospital bill came tomorrow, how much could you pay from savings without borrowing?",
    why: "This decides whether a co-pay or a lower cover amount is a reasonable trade-off for you, or a risk.",
    choices: () => [
      { id: "under_1l", label: "Less than ₹1 lakh" }, { id: "1l_3l", label: "₹1–3 lakh" },
      { id: "all", label: "All of it, comfortably" }, { id: "skip", label: "I’d rather not say" },
    ],
    relevant: () => true,
    answered: (p) => !!p.cushion,
    apply: (p, v) => ({ ...p, cushion: v[0] as Profile["cushion"] }),
  },
  {
    id: "priorities",
    text: () => "Which of these matter most to you? Pick up to two.",
    why: "Every plan trades one thing for another. Your priorities decide which trade-offs are acceptable.",
    choices: (p) => [
      { id: "low_out_of_pocket", label: "Low out-of-pocket costs" },
      { id: "hospital_choice", label: "Good hospital coverage" },
      { id: "affordability", label: "A manageable yearly premium" },
      ...(hasParents(p) ? [{ id: "parents_cover", label: "Cover for my parents" }] : [{ id: "family_wide", label: "One plan for everyone" }]),
    ],
    multi: true,
    max: 2,
    relevant: () => true,
    answered: (p) => p.priorities.length > 0,
    apply: (p, v) => ({ ...p, priorities: v.slice(0, 2) as Priority[] }),
  },
];

export const findQuestion = (id: string) => QUESTIONS.find((q) => q.id === id);

export function nextQuestion(p: Profile): Question | undefined {
  return QUESTIONS.find((q) => q.relevant(p) && !q.answered(p));
}

/** Progress for the "your picture" panel */
export function progress(p: Profile) {
  const relevant = QUESTIONS.filter((q) => q.relevant(p));
  const done = relevant.filter((q) => q.answered(p)).length;
  return { done, total: relevant.length };
}
