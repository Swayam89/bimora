"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { services } from "@/services";
import { track } from "@/lib/analytics";
import type { AdvisorEscalation } from "@/lib/types";
import { cx } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ErrorNotice } from "@/components/ui/Bits";

const SLOTS = ["Today, 6–8 pm", "Tomorrow, 10 am–12 pm", "Tomorrow, 6–8 pm"];

export function AdvisorDialog({ open, onClose, reason = "I’d like help from a person", source = "landing" }: { open: boolean; onClose: () => void; reason?: string; source?: string }) {
  const [slot, setSlot] = useState(SLOTS[0]);
  const [channel, setChannel] = useState<"call" | "whatsapp">("call");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<AdvisorEscalation | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (open) { setDone(null); setBusy(false); } }, [open]);

  async function submit() {
    setBusy(true); setFailed(false);
    const r = await services.advisor.request({ reason, context: "Shared with the advisor: conversation summary, household and policies", preferredSlot: `${slot} · ${channel}` });
    setBusy(false);
    if (r.ok) { setDone(r.data); track("advisor_escalation", { source }); } else setFailed(true);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Talk to a Ditto advisor">
      {!done ? (
        <div className="space-y-5">
          <p className="leading-relaxed text-body">An advisor picks up with everything you’ve shared with Bimora, so you won’t have to repeat yourself.</p>
          <div className="rounded-control bg-paper p-3 text-[0.92rem]"><span className="text-soft">Reason: </span><span className="text-ink">{reason}</span></div>
          <fieldset>
            <legend className="font-semibold text-ink">When suits you?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLOTS.map((s) => <button key={s} type="button" aria-pressed={slot === s} onClick={() => setSlot(s)} className="chip">{s}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-semibold text-ink">How?</legend>
            <div className="mt-2 flex gap-2">
              {(["call", "whatsapp"] as const).map((c) => <button key={c} type="button" aria-pressed={channel === c} onClick={() => setChannel(c)} className="chip">{c === "call" ? "Phone call" : "WhatsApp"}</button>)}
            </div>
          </fieldset>
          {failed && <ErrorNotice code="network" onRetry={submit} />}
          <Button size="lg" className="w-full" onClick={submit} disabled={busy}>{busy ? <><Loader2 size={18} className="animate-spin" aria-hidden />Sending...</> : "Request an advisor"}</Button>
          <p className="text-center text-[0.82rem] text-soft">Demo: no request reaches Ditto from this page.</p>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <CheckCircle2 size={44} className="mx-auto text-ok" aria-hidden />
          <p className="font-display text-[1.6rem] font-semibold text-ink">Request noted</p>
          <p className="leading-relaxed text-body">In the live product, a Ditto advisor would reach you by {channel === "call" ? "phone" : "WhatsApp"} ({slot}) with your full context.</p>
          <p className={cx("inline-block rounded-md bg-paper px-2.5 py-1 text-[0.82rem] text-soft")}>Reference {done.reference} · demo, no advisor will contact you</p>
          <Button size="lg" className="w-full" onClick={onClose}>Close</Button>
        </div>
      )}
    </Dialog>
  );
}
