import type { ServiceErrorCode } from "@/lib/types";

/** Human copy for every failure. Technical details never reach the screen. */
export const ERROR_COPY: Record<ServiceErrorCode | "network", { title: string; body: string }> = {
  upload_failed: { title: "That upload didn’t go through", body: "Your file wasn’t saved. Check your connection and try again, or send it to a Ditto advisor instead." },
  unsupported_document: { title: "We can’t read this type of file yet", body: "Please upload the policy as a PDF or a clear photo (JPG or PNG) under 15 MB." },
  ai_unavailable: { title: "Bimora can’t respond right now", body: "Nothing you’ve shared is lost. You can try again in a moment or ask a Ditto advisor to help." },
  quote_unavailable: { title: "We couldn’t get a price right now", body: "The insurer didn’t return a quote. We won’t show you a guessed number. Try again shortly or ask a Ditto advisor." },
  insurer_unavailable: { title: "We couldn’t verify that information right now", body: "The insurer’s system isn’t responding. You can try again or ask a Ditto advisor to help." },
  payment_failed: { title: "Your payment didn’t go through", body: "No policy has been bought. If money left your account, it is usually returned automatically. You can try again or choose another method." },
  issuance_pending: { title: "Your policy is still being issued", body: "Your payment went through, but the insurer hasn’t confirmed the policy yet. You’re not covered until they do. You can check again any time from Tasks." },
  missing_information: { title: "A few details are still missing", body: "Bimora needs a little more before it can go further. Nothing is assumed in the meantime." },
  escalation_required: { title: "This needs a person", body: "Your situation needs judgment that Bimora shouldn’t make alone. A Ditto advisor can take it from here." },
  network: { title: "You seem to be offline", body: "Check your connection and try again." },
};
