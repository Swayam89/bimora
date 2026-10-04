"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, CreditCard, Landmark, Loader2, Lock, Smartphone } from "lucide-react";
import type { IssuanceStatus, Payment, PaymentStatus, PlanOption, Quote, ServiceErrorCode } from "@/lib/types";
import { services } from "@/services";
import { track } from "@/lib/analytics";
import { cx, inr } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorNotice, Pill } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";

type Step = "review" | "quote" | "pay" | "processing" | "verifying" | "result";
export interface PurchaseOutcome { plan: PlanOption; paymentStatus: PaymentStatus; issuanceStatus: IssuanceStatus }

const METHODS: { id: NonNullable<Payment["method"]>; label: string; icon: typeof CreditCard }[] = [
  { id: "upi", label: "UPI", icon: Smartphone }, { id: "card", label: "Debit or credit card", icon: CreditCard }, { id: "netbanking", label: "Net banking", icon: Landmark },
];

const ISSUANCE_COPY: Record<IssuanceStatus, { tone: "ok" | "pending" | "danger" | "neutral"; label: string }> = {
  issued: { tone: "ok", label: "Issued" }, processing: { tone: "pending", label: "Still processing" }, requires_action: { tone: "pending", label: "Needs action" },
  rejected: { tone: "danger", label: "Not issued" }, unknown: { tone: "neutral", label: "Not verified yet" },
};

export function ApprovalFlow({ plan, open, onClose, onFinished, onAdvisor }: {
  plan: PlanOption | null; open: boolean; onClose: () => void; onFinished?: (o: PurchaseOutcome) => void; onAdvisor?: () => void;
}) {
  const [step, setStep] = useState<Step>("review");
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [method, setMethod] = useState<NonNullable<Payment["method"]>>("upi");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("not_started");
  const [issuance, setIssuance] = useState<IssuanceStatus>("unknown");
  const [error, setError] = useState<ServiceErrorCode | null>(null);

  useEffect(() => {
    if (open) { setStep("review"); setApprovedAt(null); setQuote(null); setPayment(null); setPaymentStatus("not_started"); setIssuance("unknown"); setError(null); }
  }, [open, plan?.id]);

  if (!plan) return null;

  async function approve() {
    const at = new Date().toISOString();
    setApprovedAt(at); setError(null); setStep("quote");
    track("recommendation_approved", { plan_tier: plan!.tier });
    const q = await services.quote.getQuote(plan!);
    if (!q.ok) { setError(q.error.code as ServiceErrorCode); setStep("review"); setApprovedAt(null); return; }
    setQuote(q.data); setStep("pay");
  }

  async function pay() {
    if (!approvedAt || !quote) return; // payment is impossible without explicit approval
    setError(null); setStep("processing"); setPaymentStatus("pending");
    track("payment_started", { plan_tier: plan!.tier });
    const c = await services.payment.createPayment({ quote, approvedAt, method });
    if (!c.ok) { setError(c.error.code as ServiceErrorCode); setStep("pay"); setPaymentStatus("failed"); return; }
    track("payment_approved", { plan_tier: plan!.tier });
    const r = await services.payment.confirmPayment(c.data.id);
    if (!r.ok) { setError("payment_failed"); setPaymentStatus("failed"); setStep("pay"); return; }
    setPayment(r.data); setPaymentStatus("successful");
    await verify(r.data.id);
  }

  async function verify(paymentId: string) {
    setError(null); setStep("verifying");
    const v = await services.issuance.verify(paymentId);
    if (!v.ok) { setIssuance("unknown"); setError(v.error.code as ServiceErrorCode); setStep("result"); return; }
    setIssuance(v.data.status); setStep("result");
    track("policy_issuance_verified", { status: v.data.status });
  }

  function finish() {
    onFinished?.({ plan: plan!, paymentStatus, issuanceStatus: issuance });
    onClose();
  }

  const closeGuarded = () => { if (step === "processing" || step === "verifying") return; if (step === "result") finish(); else onClose(); };

  return (
    <Dialog open={open} onClose={closeGuarded} title={step === "review" || step === "quote" ? "Before you continue" : step === "pay" ? "Confirm payment" : "Your purchase"}>
      {(step === "review" || step === "quote") && (
        <div className="space-y-5">
          <div className="rounded-card bg-paper p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-soft">Policy</p><p className="font-semibold text-ink">{plan.label}</p></div>
            <div className="mt-2 flex items-center justify-between gap-3"><p className="text-soft">Premium</p><p className="text-right font-semibold text-ink">{inr(plan.illustrativeAnnualPremium)} / year<span className="block text-[0.78rem] font-normal text-soft">Illustrative amount, not a quote</span></p></div>
          </div>
          <div>
            <p className="font-semibold text-ink">Important trade-offs</p>
            <ul className="mt-2 space-y-1.5 text-[0.94rem] text-body">{plan.givingUp.map((g) => <li key={g}>· {g}</li>)}</ul>
          </div>
          <div>
            <p className="font-semibold text-ink">What you’re getting</p>
            <ul className="mt-2 space-y-1.5 text-[0.94rem] text-body">{plan.gettingWhat.map((g) => <li key={g}>· {g}</li>)}</ul>
          </div>
          <p className="rounded-control border border-line p-3 text-[0.88rem] leading-relaxed text-body">The insurer may ask for medical details or tests before issuing the policy. Nothing is paid until you confirm on the next screen.</p>
          {error && <ErrorNotice code={error} onRetry={approve} onAdvisor={onAdvisor} />}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button size="lg" className="sm:flex-1" onClick={approve} disabled={step === "quote"}>
              {step === "quote" ? <><Loader2 size={18} className="animate-spin" aria-hidden />Getting the price...</> : "I understand and want to continue"}
            </Button>
            <Button size="lg" variant="ghost" onClick={onClose}>Not now</Button>
          </div>
        </div>
      )}

      {step === "pay" && quote && (
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-3 rounded-card bg-paper p-4">
            <div><p className="text-soft">{plan.label} · 1 year</p><p className="mt-1 font-display text-[2rem] font-semibold leading-none text-ink">{inr(quote.annualPremium)}</p></div>
            <Pill tone="info">Approved by you</Pill>
          </div>
          <fieldset>
            <legend className="font-semibold text-ink">Pay with</legend>
            <div className="mt-2 space-y-2">
              {METHODS.map((m) => (
                <label key={m.id} className={cx("flex min-h-[52px] cursor-pointer items-center gap-3 rounded-control border px-3.5", method === m.id ? "border-action bg-action-tint" : "border-line")}>
                  <input type="radio" name="pay-method" className="accent-[#0B6CC0]" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <m.icon size={18} className="text-soft" aria-hidden /><span className="font-medium text-ink">{m.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <ErrorNotice code={error} onRetry={pay} onAdvisor={onAdvisor} />}
          <Button size="lg" className="w-full" onClick={pay}><Lock size={17} aria-hidden />Pay {inr(quote.annualPremium)}</Button>
          <p className="text-center text-[0.82rem] text-soft">Simulated payment. No money moves in this demo.</p>
        </div>
      )}

      {(step === "processing" || step === "verifying" || step === "result") && (
        <div className="space-y-5" aria-live="polite">
          <ol className="space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-card border border-line p-4">
              <div className="flex items-center gap-3">
                {paymentStatus === "pending" ? <Loader2 size={20} className="animate-spin text-action" aria-hidden /> : <BadgeCheck size={20} className="text-ok" aria-hidden />}
                <div><p className="font-semibold text-ink">{paymentStatus === "pending" ? "Payment processing..." : "Payment successful"}</p>{payment?.reference && <p className="text-[0.8rem] text-soft">Ref {payment.reference}</p>}</div>
              </div>
              <Pill tone={paymentStatus === "successful" ? "ok" : "pending"}>{paymentStatus === "successful" ? "Paid" : "Pending"}</Pill>
            </li>
            <li className={cx("flex items-center justify-between gap-3 rounded-card border p-4", step === "processing" ? "border-dashed border-line text-soft" : "border-line")}>
              <div className="flex items-center gap-3">
                {step === "verifying" ? <Loader2 size={20} className="animate-spin text-action" aria-hidden /> : issuance === "issued" ? <BadgeCheck size={20} className="text-ok" aria-hidden /> : <Loader2 size={20} className={step === "processing" ? "text-line-strong" : "text-gap"} aria-hidden />}
                <div>
                  <p className={cx("font-semibold", step === "processing" ? "text-soft" : "text-ink")}>{step === "verifying" ? "Verifying policy issuance..." : step === "processing" ? "Policy issuance" : issuance === "issued" ? "Policy issued" : "Issuance not confirmed yet"}</p>
                  <p className="text-[0.8rem] text-soft">Checked separately with the insurer</p>
                </div>
              </div>
              {step === "result" && <Pill tone={ISSUANCE_COPY[issuance].tone}>{ISSUANCE_COPY[issuance].label}</Pill>}
            </li>
          </ol>

          {step === "result" && issuance === "issued" && <p className="text-[0.96rem] leading-relaxed text-body">The insurer has confirmed your policy. Your cover starts on the date shown in the policy document, which Bimora has saved for you.</p>}
          {step === "result" && issuance === "processing" && <ErrorNotice code="issuance_pending" />}
          {step === "result" && error && payment && <ErrorNotice code={error} onRetry={() => verify(payment.id)} onAdvisor={onAdvisor} />}
          {step === "result" && <p className="text-center text-[0.82rem] text-soft">Simulated in this demo: no money moved and no real policy was created.</p>}
          {step === "result" && <Button size="lg" className="w-full" onClick={finish}>Done</Button>}
        </div>
      )}
    </Dialog>
  );
}
