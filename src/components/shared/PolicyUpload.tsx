"use client";
import { useEffect, useRef, useState } from "react";
import { Check, FileText, Loader2, Upload } from "lucide-react";
import { services } from "@/services";
import type { DocumentAnalysisResult } from "@/services/contracts";
import type { ServiceErrorCode } from "@/lib/types";
import { track } from "@/lib/analytics";
import { cx } from "@/lib/format";
import { ErrorNotice } from "@/components/ui/Bits";
import { PolicySummary } from "./PolicySummary";

type Phase = "idle" | "uploading" | "reading" | "done" | "error";

export function PolicyUpload({ onComplete, onAdvisor, showSummary = true, location = "landing", autoFile, onSkip }: {
  onComplete?: (r: DocumentAnalysisResult) => void; onAdvisor?: () => void; showSummary?: boolean; location?: string;
  autoFile?: { name: string; size: number; type: string }; onSkip?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<ServiceErrorCode | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [over, setOver] = useState(false);
  const last = useRef<{ name: string; size: number; type: string } | null>(null);

  const started = useRef(false);
  useEffect(() => { if (autoFile && !started.current) { started.current = true; run(autoFile); } }, [autoFile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(file: { name: string; size: number; type: string }) {
    last.current = file;
    setFileName(file.name); setError(null); setResult(null);
    track("policy_upload_started", { location });
    const r = await services.documents.analyze(file, (s) => setPhase(s));
    if (!r.ok) { setPhase("error"); setError(r.error.code as ServiceErrorCode); return; }
    setPhase("done"); setResult(r.data);
    track("policy_upload_completed", { location, result: "sample" });
    onComplete?.(r.data);
  }

  const steps: { key: Phase; label: string }[] = [
    { key: "uploading", label: "Uploading policy..." },
    { key: "reading", label: "Reading your policy..." },
    { key: "done", label: "Policy understood" },
  ];
  const order = ["uploading", "reading", "done"];

  return (
    <div className="space-y-4">
      {(phase === "idle" || phase === "error") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) run(f); }}
          className={cx("rounded-card border-2 border-dashed px-5 py-8 text-center transition-colors", over ? "border-action bg-action-tint" : "border-line-strong bg-paper")}
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-canvas text-action shadow-card"><Upload size={22} aria-hidden /></div>
          <p className="mt-4 font-semibold text-ink">Drop your policy here</p>
          <p className="mt-1 text-[0.92rem] text-soft">PDF or a clear photo, up to 15 MB</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-[48px] items-center gap-2 rounded-control bg-action px-5 font-semibold text-white hover:bg-action-hover">
              <FileText size={18} aria-hidden />Upload My Policy
            </button>
            <button type="button" onClick={() => run({ name: "Sample_Health_Policy.pdf", size: 240_000, type: "application/pdf" })} className="inline-flex min-h-[48px] items-center rounded-control px-4 font-semibold text-action-ink hover:bg-canvas">
              Try a sample policy
            </button>
            {onSkip && <button type="button" onClick={onSkip} className="inline-flex min-h-[48px] items-center rounded-control px-4 font-medium text-soft hover:text-ink">Continue without uploading</button>}
          </div>
          <input ref={input} type="file" className="sr-only" accept=".pdf,image/*" aria-label="Choose a policy file" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); e.target.value = ""; }} />
        </div>
      )}

      {error && <ErrorNotice code={error} onRetry={error === "upload_failed" && last.current ? () => run(last.current!) : undefined} onAdvisor={onAdvisor} />}

      {(phase === "uploading" || phase === "reading" || phase === "done") && (
        <div className="rounded-card border border-line bg-canvas p-4 sm:p-5" aria-live="polite">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-paper text-ink"><FileText size={19} aria-hidden /></div>
            <p className="min-w-0 truncate font-medium text-ink">{fileName}</p>
          </div>
          <p className="mt-2 text-[0.82rem] text-soft">Demo: your file isn’t read or uploaded anywhere. You’ll see a sample summary.</p>
          <ol className="mt-4 space-y-2.5">
            {steps.map((s) => {
              const idx = order.indexOf(s.key), cur = order.indexOf(phase);
              const state = idx < cur || phase === "done" ? "done" : idx === cur ? "active" : "todo";
              return (
                <li key={s.key} className={cx("flex items-center gap-3 text-[0.95rem]", state === "todo" ? "text-soft" : "text-ink")}>
                  <span className={cx("grid h-6 w-6 place-items-center rounded-full", state === "done" ? "bg-ok text-white" : state === "active" ? "bg-action-tint text-action" : "bg-paper")}>
                    {state === "done" ? <Check size={14} aria-hidden /> : state === "active" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                  </span>
                  {s.label}
                </li>
              );
            })}
          </ol>
          {phase === "done" && (
            <button type="button" onClick={() => { setPhase("idle"); setResult(null); }} className="mt-4 text-[0.9rem] font-semibold text-action-ink underline-offset-4 hover:underline">Upload a different policy</button>
          )}
        </div>
      )}

      {showSummary && result && <PolicySummary coverage={result.policy.coverage} name={result.policy.name} isSample={result.isSampleAnalysis} />}
    </div>
  );
}
