import type { CoverageGap, Recommendation } from "@/lib/types";
import { DEMO_PLANS, daysFromNow } from "@/lib/mock/data";
import { coverLabel, describeMembers, PRIORITY_LABEL, type Profile } from "./profile";

/** Derives potential gaps from what the user has told us. Unknowns are labelled, never assumed away. */
export function buildGaps(p: Profile): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const employer = p.insuranceSource === "employer" || p.insuranceSource === "both";
  const personal = p.insuranceSource === "personal" || p.insuranceSource === "both";

  if (employer) {
    gaps.push({
      id: "gap_employer",
      title: "Employer cover may not be enough on its own",
      explanation: `Your employer gives you ${coverLabel(p.employerCover)}, shared by everyone on it, and it usually ends when you leave the job.`,
      doesItMatter: personal
        ? "Your own policy already backs this up, so the gap may be smaller than it looks. It matters most if a single hospital stay could exceed both."
        : "It matters if you might change jobs in the next few years, or if one hospital stay could cost more than this cover.",
      severity: personal ? "worth_reviewing" : "important",
      relatedMemberIds: [], basedOn: p.employerCover === "unknown" ? "assumed" : "known", source: "user",
    });
  }
  if (p.members.includes("parents")) {
    const cond = p.parentsCondition;
    gaps.push({
      id: "gap_parents",
      title: "Parent coverage needs separate consideration",
      explanation:
        cond === "yes"
          ? "Your parents have an ongoing condition. Plans for them often include co-pay and a wait before that condition is covered."
          : cond === "no"
            ? "Employer and family plans rarely include parents well. Their age affects price and co-pay."
            : "Their health history isn’t known yet. I’ve kept it open rather than assume either way.",
      doesItMatter: "Whether it’s worth buying depends on their health and how much you could pay yourself. I won’t push a plan for them until that’s clear.",
      severity: "important", relatedMemberIds: [], basedOn: cond === "unknown" || !cond ? "unknown" : "known", source: "user",
    });
  }
  if (personal) {
    gaps.push({
      id: "gap_waiting",
      title: "Existing policy may have a waiting period worth reviewing",
      explanation: "Policies can make you wait up to 3 years before pre-existing conditions are covered. Porting usually keeps that credit up to your current cover, but extra cover starts its own wait.",
      doesItMatter: "If your policy is still inside its waiting period, upgrading it may be wiser than replacing it. Uploading it lets me check.",
      severity: "worth_reviewing", relatedMemberIds: [], basedOn: "assumed", source: "user",
    });
  }
  if (p.hasInsurance === "no") {
    gaps.push({
      id: "gap_none",
      title: "No health cover in place yet",
      explanation: "Without cover, a hospital stay is paid entirely from savings or loans.",
      doesItMatter: p.cushion === "all" ? "You could absorb one large bill, but repeated or long stays would still hurt." : "With your savings cushion, one hospital stay could mean borrowing.",
      severity: "important", relatedMemberIds: [], basedOn: "known", source: "user",
    });
  }
  if (p.hasInsurance === "unsure") {
    gaps.push({
      id: "gap_unsure",
      title: "We don’t know yet what you already have",
      explanation: "You might have cover through work or an old policy you’ve forgotten.",
      doesItMatter: "It’s worth checking before buying anything, so you don’t pay twice.",
      severity: "info", relatedMemberIds: [], basedOn: "unknown", source: "user",
    });
  }
  if (p.cushion === "under_1l" && p.hasInsurance !== "no") {
    gaps.push({
      id: "gap_cushion",
      title: "Out-of-pocket costs could hurt",
      explanation: "With a small savings cushion, co-pays and room-rent caps hit harder.",
      doesItMatter: "It means plans with no co-pay deserve more weight, even at a higher premium.",
      severity: "worth_reviewing", relatedMemberIds: [], basedOn: "known", source: "user",
    });
  }
  return gaps;
}

export function buildUnderstanding(p: Profile) {
  const facts: string[] = [];
  const assumptions: string[] = [];
  const unknowns: string[] = [];
  if (p.members.length) facts.push(`You want to cover ${describeMembers(p)}.`);
  if (p.city) facts.push(`You live in ${p.city}.`);
  if (p.hasInsurance === "yes") facts.push(`You have existing cover${p.insuranceSource && p.insuranceSource !== "unsure" ? ` (${p.insuranceSource === "both" ? "employer and personal" : p.insuranceSource})` : ""}.`);
  if (p.hasInsurance === "no") facts.push("You don’t have health insurance yet.");
  if (p.employerCover && p.employerCover !== "unknown") facts.push(`Your employer cover is about ${coverLabel(p.employerCover)}.`);
  if (p.priorities.length) facts.push(`What matters most: ${p.priorities.map((x) => PRIORITY_LABEL[x].toLowerCase()).join(" and ")}.`);

  if (p.insuranceSource === "employer" || p.insuranceSource === "both") assumptions.push("Your employer cover ends if you change jobs (true for most group plans).");
  if (p.members.includes("parents")) assumptions.push("Your parents would need their own plan rather than joining yours.");

  if (p.parentsCondition === "unknown") unknowns.push("Your parents' health history");
  if (p.employerCover === "unknown") unknowns.push("The exact amount of your employer cover");
  if (p.hasInsurance === "unsure") unknowns.push("Whether you already have cover");
  if (p.cushion === "skip") unknowns.push("How large a bill you could pay yourself");
  if (p.insuranceSource === "personal" || p.insuranceSource === "both") unknowns.push("Your current policy’s exact terms (upload it and I’ll read them)");
  return { facts, assumptions, unknowns };
}

/** Re-frames the illustrative plans for who is actually being covered. Figures stay illustrative. */
function adaptPlans(p: Profile) {
  const nonParents = p.members.filter((m) => m !== "parents");
  const parentsOnly = nonParents.length === 0 && p.members.includes("parents");
  const single = nonParents.length === 1 && nonParents[0] === "me";
  const shape = parentsOnly ? "for your parents" : single ? "individual plan" : "family floater";
  return DEMO_PLANS.map((plan) => ({
    ...plan,
    summary: parentsOnly ? plan.summary.replace("Family floater", "Plan for your parents") : single ? plan.summary.replace("Family floater", "Individual plan") : plan.summary,
    whyItFits: plan.whyItFits.map((w) => w === "Broader relevant coverage for the whole family" && (single || parentsOnly) ? "Broader relevant coverage for who you want to protect" : w === "Waiting periods that work with what you already have" && p.hasInsurance !== "yes" ? "Shorter waiting periods than the cheaper option" : w),
    givingUp: plan.givingUp.filter((g) => !(g.startsWith("Does not cover your parents") && (!p.members.includes("parents") || parentsOnly))),
    attributes: plan.attributes.map((a) => (a.label === "Cover" ? { ...a, value: a.value.replace("family floater", shape) } : a)),
  }));
}

export function buildRecommendation(p: Profile): Recommendation {
  const priorities = p.priorities.length ? p.priorities : (["family_wide", "low_out_of_pocket"] as Recommendation["priorities"]);
  const plural = p.members.filter((m) => m !== "parents").length > 1;
  const parentsOnly = p.members.length > 0 && p.members.every((m) => m === "parents");
  const because = [
    parentsOnly ? "It matches your household: a plan built for your parents rather than added onto yours." : plural ? `It matches your household: one floater for ${describeMembers({ ...p, members: p.members.filter((m) => m !== "parents") })}.` : "It matches your household: cover built around you.",
    p.insuranceSource === "employer" || p.insuranceSource === "both"
      ? "It addresses the most important gap: cover that doesn’t end if you change jobs."
      : p.hasInsurance === "no"
        ? "It addresses the most important gap: you have no cover today."
        : "It addresses the most important gap: enough cover for one large hospital stay.",
    priorities.includes("affordability") && !priorities.includes("low_out_of_pocket")
      ? "Its trade-offs fit your priorities: a moderate premium without pushing large costs onto you at the hospital."
      : "Its trade-offs fit your priorities: you pay a little more each year instead of a large share at the hospital.",
  ];
  const facts = buildUnderstanding(p).facts;
  const assumptions = ["Plans shown are illustrative. Real prices come from insurers after they review your details."];
  if (p.members.includes("parents") && p.members.some((m) => m !== "parents")) assumptions.push("Your parents are considered separately once their health details are clearer.");
  if (p.members.length === 1 && p.members[0] === "parents") assumptions.push("Plans for people over 60 often carry a co-pay. The figures here are placeholders until insurers quote.");
  return {
    id: "rec_live",
    needId: "need_health",
    createdAt: daysFromNow(0),
    priorities,
    recommendedBecause: because,
    options: adaptPlans(p),
    basedOnFacts: facts,
    assumptions,
    source: "mock",
    isMock: true,
  };
}

/** Plain-language answers for open questions. Returns null when Bimora shouldn’t guess. */
export function answerFreeform(text: string, p: Profile): string | null {
  const t = text.toLowerCase().replace(/[’‘]/g, "'");
  if (/(diagnos|symptom|what medicine|should i take|is it cancer|treatment for)/.test(t))
    return "I can’t give medical advice or a diagnosis. What I can do is explain how a health condition affects insurance: which plans accept it and how long the wait is. A doctor is the right person for the medical side.";
  if (/(employer|company|office|work).*(lakh|cover|insurance)|(five|5) lakh/.test(t))
    return (/(five|5) lakh/.test(t) ? "Five lakh from your employer" : "Cover from your employer") + " is a good start, but two things matter. It’s usually shared by everyone on the plan, and it typically ends when you leave the job. Whether you need more depends on who it covers and how big a bill you could pay yourself. Let me ask a couple of quick questions before I say more.";
  if (/cheap|cheapest|lowest premium/.test(t))
    return "The cheapest plan often saves money by passing costs back to you at the hospital, through co-pay or room-rent caps. I’ll show you the cheaper options, but I’ll also tell you what they leave out.";
  if (/waiting period/.test(t))
    return "A waiting period is the time before something is covered. For conditions you already have, insurers can make you wait up to 3 years. If you switch insurers, porting usually keeps your credit up to your current cover, and any extra cover starts a fresh wait. Worth checking before you move.";
  if (/co-?pay/.test(t))
    return "A co-pay is the share of every claim you pay yourself. A 20% co-pay on a ₹4 lakh bill means ₹80,000 from your pocket. It lowers the premium, but the cost shows up when you’re in hospital.";
  if (/room rent|room limit|room cap/.test(t))
    return "A room-rent cap limits how much the policy pays for your hospital room each day. If you pick a pricier room, many other charges are cut in the same proportion, not just the room.";
  if (/deductible/.test(t))
    return "A deductible is the amount you pay before the policy starts paying. Plans with a deductible are often used as a top-up on top of another policy.";
  if (/sum insured|how much cover/.test(t))
    return "Sum insured is the most the policy will pay in a year. There isn’t one right number. It depends on who’s covered, your city’s hospital costs and what you already have. That’s why I ask about your family first.";
  if (/(payment|paid).*(insured|covered|policy)|issued/.test(t))
    return "Paying isn’t the same as being insured. After payment, the insurer still has to issue the policy. I check that separately and tell you only once it’s confirmed.";
  return null;
}
