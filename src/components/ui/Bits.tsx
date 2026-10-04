import { AlertCircle, CheckCircle2, Clock, HelpCircle, Info, LifeBuoy, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { ERROR_COPY } from "@/services/errors";
import type { ServiceErrorCode } from "@/lib/types";

export function DemoTag({ children = "Illustrative demo" }: { children?: ReactNode }) {
  return <span className="demo-tag"><Info size={12} aria-hidden />{children}</span>;
}

type Tone = "ok" | "gap" | "danger" | "info" | "neutral" | "pending";
const tones: Record<Tone, string> = {
  ok: "bg-ok-tint text-ok", gap: "bg-gap-tint text-gap", danger: "bg-danger-tint text-danger",
  info: "bg-action-tint text-action-ink", neutral: "bg-paper text-soft", pending: "bg-gap-tint text-gap",
};
const toneIcon: Record<Tone, typeof Info> = { ok: CheckCircle2, gap: AlertCircle, danger: AlertCircle, info: Info, neutral: HelpCircle, pending: Clock };

export function Pill({ tone = "neutral", children, icon = true }: { tone?: Tone; children: ReactNode; icon?: boolean }) {
  const I = toneIcon[tone];
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.78rem] font-semibold", tones[tone])}>
      {icon && <I size={13} aria-hidden />}{children}
    </span>
  );
}

export function ErrorNotice({ code, onRetry, onAdvisor, compact }: { code: ServiceErrorCode | "network"; onRetry?: () => void; onAdvisor?: () => void; compact?: boolean }) {
  const c = ERROR_COPY[code];
  const isPending = code === "issuance_pending";
  return (
    <div role="alert" className={cx("rounded-card border p-4", isPending ? "border-gap-line bg-gap-tint" : "border-danger/20 bg-danger-tint/60")}>
      <div className="flex gap-3">
        {isPending ? <Clock className="mt-0.5 shrink-0 text-gap" size={20} aria-hidden /> : <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} aria-hidden />}
        <div className="min-w-0">
          <p className="font-semibold text-ink">{c.title}</p>
          {!compact && <p className="mt-1 text-[0.94rem] leading-relaxed text-body">{c.body}</p>}
          {(onRetry || onAdvisor) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && <button type="button" onClick={onRetry} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-control bg-canvas px-3.5 text-[0.9rem] font-semibold text-ink ring-1 ring-ink/10 hover:ring-ink/30"><RotateCw size={15} aria-hidden />Try again</button>}
              {onAdvisor && <button type="button" onClick={onAdvisor} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-control px-3.5 text-[0.9rem] font-semibold text-action-ink hover:bg-canvas/60"><LifeBuoy size={15} aria-hidden />Ask a Ditto advisor</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionHead({ eyebrow, title, body, center, id, dark }: { eyebrow?: string; title: ReactNode; body?: ReactNode; center?: boolean; id?: string; dark?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className={cx("eyebrow", dark && "text-[#8FC3F0]")}>{eyebrow}</p>}
      <h2 id={id} className={cx("mt-3 font-display text-display-lg text-balance", dark ? "text-white" : "text-ink")}>{title}</h2>
      {body && <p className={cx("mt-5 text-[1.08rem] leading-relaxed text-pretty", dark ? "text-[#B7C5D3]" : "text-body")}>{body}</p>}
    </div>
  );
}
