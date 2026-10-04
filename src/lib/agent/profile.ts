import type { Priority } from "@/lib/types";

/** What Bimora has learned about the person so far. Built progressively. */
export interface Profile {
  firstName?: string;
  protect?: "myself" | "family" | "parents" | "existing" | "unsure";
  members: ("me" | "spouse" | "children" | "parents")[];
  hasInsurance?: "yes" | "no" | "unsure";
  insuranceSource?: "employer" | "personal" | "both" | "unsure";
  employerCover?: "3l" | "5l" | "10l" | "unknown";
  city?: string;
  eldestBand?: "under_35" | "35_45" | "46_59" | "60_plus";
  parentsCondition?: "yes" | "no" | "unknown";
  cushion?: "under_1l" | "1l_3l" | "all" | "skip";
  priorities: Priority[];
  /** set by onboarding: what the user came to do */
  intent?: "cover" | "policy" | "talk";
  completedOnboarding?: boolean;
}

export const EMPTY_PROFILE: Profile = { members: [], priorities: [] };

/** Profile equivalent of the bundled demo household (used when no onboarding data exists). */
export const DEMO_PROFILE: Profile = {
  firstName: "Aarav",
  protect: "family",
  members: ["me", "spouse", "children", "parents"],
  hasInsurance: "yes",
  insuranceSource: "both",
  employerCover: "5l",
  city: "Pune",
  priorities: [],
  intent: "cover",
  completedOnboarding: true,
};

export const MEMBER_LABEL: Record<Profile["members"][number], string> = {
  me: "You", spouse: "Spouse", children: "Children", parents: "Parents",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low_out_of_pocket: "Avoid high out-of-pocket costs",
  family_wide: "Family-wide protection",
  hospital_choice: "Good hospital coverage",
  affordability: "Reasonable long-term affordability",
  parents_cover: "Cover for parents",
  maternity: "Maternity cover",
};

export function describeMembers(p: Profile): string {
  if (!p.members.length) return "no one yet";
  const names = p.members.map((m) => (m === "me" ? "you" : m === "spouse" ? "your spouse" : m === "children" ? "your children" : "your parents"));
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export const coverLabel = (c?: Profile["employerCover"]) =>
  c === "3l" ? "₹3 lakh" : c === "5l" ? "₹5 lakh" : c === "10l" ? "₹10 lakh or more" : "an amount you’re not sure of";
