"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { services } from "@/services";
import type { VoiceState } from "@/services/contracts";
import { cx } from "@/lib/format";
import { ErrorNotice } from "@/components/ui/Bits";

const SAMPLES = [
  "My employer gives me five lakh rupees of cover. Do I need more?",
  "What does a waiting period mean?",
  "Is the cheapest policy a bad idea?",
];

const STATE_LABEL: Record<VoiceState, string> = { idle: "Tap the mic to talk", listening: "Listening...", thinking: "Thinking...", speaking: "Bimora is speaking" };

function Wave({ active, tone }: { active: boolean; tone: "user" | "bimora" }) {
  const bars = [0.5, 0.9, 0.6, 1, 0.7, 0.95, 0.55, 0.85, 0.65, 1, 0.6, 0.8];
  return (
    <div className="flex h-12 items-center justify-center gap-[5px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className={cx("w-[5px] origin-center rounded-full", tone === "user" ? "bg-action" : "bg-ink", active ? "animate-wave" : "opacity-25")}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s`, transform: active ? undefined : "scaleY(.3)" }}
        />
      ))}
    </div>
  );
}

export function VoicePanel({ onTurn, dark }: { onTurn?: (t: { transcript: string; reply: string }) => void; dark?: boolean }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [prompt, setPrompt] = useState(SAMPLES[0]);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [failed, setFailed] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  async function start() {
    ctrl.current?.abort();
    const c = new AbortController(); ctrl.current = c;
    setTranscript(""); setReply(""); setFailed(false);
    const r = await services.voice.runTurn({ prompt, onState: setState, onTranscript: setTranscript, onReply: setReply, signal: c.signal });
    if (r.ok) onTurn?.(r.data);
    else if (r.error.code !== "network") setFailed(true);
  }
  function stop() { ctrl.current?.abort(); setState("idle"); }
  const busy = state !== "idle";

  return (
    <div className={cx("rounded-sheet border p-5 sm:p-6", dark ? "border-white/10 bg-white/[0.04]" : "border-line bg-canvas shadow-card")}>
      <div className="flex items-center justify-between gap-3">
        <p className={cx("text-[0.95rem] font-semibold", dark ? "text-white" : "text-ink")} aria-live="polite">{STATE_LABEL[state]}</p>
        <span className={cx("rounded-md px-2 py-0.5 text-[0.72rem] font-medium", dark ? "bg-white/10 text-[#C9D5E1]" : "bg-paper text-soft")}>Simulated voice</span>
      </div>

      <div className="mt-4"><Wave active={state === "listening" || state === "speaking"} tone={state === "speaking" ? "bimora" : "user"} /></div>

      <div className="mt-4 min-h-[112px] space-y-3">
        <p className="sr-only" role="status">{state === "idle" && reply ? `Bimora said: ${reply}` : ""}</p>
        {transcript && <p className={cx("text-[1.02rem] leading-relaxed", dark ? "text-white" : "text-ink")}>&ldquo;{transcript}&rdquo;</p>}
        {reply && <p className={cx("rounded-control p-3.5 text-[0.98rem] leading-relaxed", dark ? "bg-white/[0.06] text-[#D9E2EA]" : "bg-paper text-body")}><span className={cx("font-semibold", dark ? "text-white" : "text-ink")}>Bimora: </span>{reply}</p>}
        {!transcript && !reply && !failed && (
          <fieldset>
            <legend className={cx("mb-2 text-[0.85rem]", dark ? "text-[#B7C5D3]" : "text-soft")}>Choose what to say (speech recognition isn’t connected in this demo):</legend>
            <div className="flex flex-col gap-2">
              {SAMPLES.map((s) => (
                <label key={s} className={cx("flex cursor-pointer items-start gap-2.5 rounded-control border p-2.5 text-[0.92rem]", prompt === s ? (dark ? "border-[#5AA9EE] bg-white/[0.06] text-white" : "border-action bg-action-tint text-ink") : dark ? "border-white/10 text-[#C9D5E1]" : "border-line text-body")}>
                  <input type="radio" name="voice-sample" className="mt-1 accent-[#0B6CC0]" checked={prompt === s} onChange={() => setPrompt(s)} />{s}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {failed && <ErrorNotice code="ai_unavailable" onRetry={start} compact />}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {!busy ? (
          <button type="button" onClick={start} className="grid h-16 w-16 place-items-center rounded-full bg-action text-white shadow-float transition-transform hover:scale-[1.03]" aria-label="Start talking to Bimora">
            <Mic size={26} aria-hidden />
          </button>
        ) : (
          <button type="button" onClick={stop} className={cx("inline-flex h-14 items-center gap-2 rounded-full px-6 font-semibold", dark ? "bg-white text-ink" : "bg-ink text-white")} aria-label="Stop">
            <Square size={16} fill="currentColor" aria-hidden />Stop
          </button>
        )}
        {!busy && (transcript || reply) && (
          <button type="button" onClick={() => { setTranscript(""); setReply(""); }} className={cx("text-[0.9rem] font-semibold underline-offset-4 hover:underline", dark ? "text-[#C9D5E1]" : "text-action-ink")}>Ask something else</button>
        )}
      </div>
    </div>
  );
}
