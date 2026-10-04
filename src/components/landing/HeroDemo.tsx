"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cx } from "@/lib/format";
import { DemoTag } from "@/components/ui/Bits";
import { saveProfile, loadProfile } from "@/lib/session";
import { EMPTY_PROFILE, type Profile } from "@/lib/agent/profile";

type Line = { who: "bimora" | "user"; text: string };
type Stage = "start" | "who" | "existing" | "upload" | "reading" | "analysing" | "gaps";

const WHO = [
  { id: "me", label: "Me" }, { id: "spouse", label: "My spouse" }, { id: "children", label: "My children" }, { id: "parents", label: "My parents" },
] as const;

function Bubble({ l }: { l: Line }) {
  return (
    <div className={cx("flex animate-rise", l.who === "user" ? "justify-end" : "justify-start")}>
      <p className={cx("max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-snug", l.who === "user" ? "rounded-br-md bg-action text-white" : "rounded-bl-md bg-paper text-ink")}>{l.text}</p>
    </div>
  );
}

export function HeroDemo() {
  const [lines, setLines] = useState<Line[]>([{ who: "bimora", text: "Hi. What are you looking to protect?" }]);
  const [stage, setStageRaw] = useState<Stage>("start");
  const [who, setWho] = useState<string[]>(["me", "spouse", "children"]);
  const [existing, setExisting] = useState<"yes" | "no" | "unsure" | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage>("start");

  useEffect(() => { const b = box.current; if (b) b.scrollTo({ top: b.scrollHeight, behavior: "smooth" }); }, [lines, stage]);
  // Play the opening exchange once so the demo is alive on arrival; the visitor takes over from there.
  const autoplayed = useRef(false);
  useEffect(() => {
    if (autoplayed.current) return;
    autoplayed.current = true;
    const t = setTimeout(() => { if (stageRef.current === "start") begin(); }, 1100);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStage = (s: Stage) => { stageRef.current = s; setStageRaw(s); };
  const add = (...l: Line[]) => setLines((x) => [...x, ...l]);
  const later = (fn: () => void, ms = 650) => setTimeout(fn, ms);

  function begin() {
    add({ who: "user", text: "I want health insurance for my family." });
    later(() => { add({ who: "bimora", text: "Got it. I’ll first understand who’s covered, what you already have and where the gaps might be." }); later(() => setStage("who"), 400); });
    setStage("analysing");
  }
  function confirmWho() {
    const names = WHO.filter((w) => who.includes(w.id)).map((w) => w.label.replace("My ", "my "));
    add({ who: "user", text: names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] });
    setStage("analysing");
    later(() => setStage("existing"));
  }
  function answerExisting(v: "yes" | "no" | "unsure") {
    setExisting(v);
    add({ who: "user", text: v === "yes" ? "Yes" : v === "no" ? "No" : "I’m not sure" });
    if (v === "yes") { setStage("analysing"); later(() => { add({ who: "bimora", text: "Let’s understand what you already have before looking at anything new." }); setStage("upload"); }); }
    else analyse(false, v);
  }
  function analyse(withUpload = false, ex: typeof existing = existing) {
    setUploaded(withUpload);
    setStage("analysing");
    later(() => setStage("gaps"), 1700);
    const prev = loadProfile() ?? EMPTY_PROFILE;
    const next: Profile = { ...prev, members: who as Profile["members"], hasInsurance: ex ?? prev.hasInsurance, protect: "family" };
    saveProfile(next);
  }
  function reset() {
    setLines([{ who: "bimora", text: "Hi. What are you looking to protect?" }]); setStage("start"); setExisting(null); setUploaded(false); setWho(["me", "spouse", "children"]);
  }

  const gaps = [
    ...(existing === "yes" ? ["Employer cover, if part of what you have, may not be enough on its own"] : existing === "no" ? ["No cover in place yet: one hospital stay would be paid from savings"] : ["What you already have isn’t clear yet. Worth checking before buying"]),
    ...(who.includes("parents") ? ["Parent coverage needs separate consideration"] : []),
    ...(uploaded ? ["Existing policy has a waiting period worth reviewing"] : []),
  ];

  return (
    <div className="relative w-full rounded-sheet border border-line bg-canvas shadow-float">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-ink font-display text-[1.1rem] font-semibold text-white" aria-hidden>b</span>
          <div className="leading-tight"><p className="font-semibold text-ink">Bimora</p><p className="text-[0.8rem] text-soft">Insurance agent by Ditto</p></div>
        </div>
        <DemoTag />
      </div>

      <div ref={box} className="h-[420px] space-y-3 overflow-y-auto px-4 py-4 sm:h-[460px] sm:px-5" role="log" aria-live="polite" aria-label="Demo conversation">
        {lines.map((l, i) => <Bubble key={i} l={l} />)}

        {stage === "start" && (
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" className="chip" onClick={begin}>I want health insurance for my family</button>
          </div>
        )}

        {stage === "who" && (
          <div className="animate-rise rounded-card border border-line p-3.5">
            <p className="font-semibold text-ink">Who would you like to cover?</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Who to cover">
              {WHO.map((w) => (
                <button key={w.id} type="button" className="chip" aria-pressed={who.includes(w.id)} onClick={() => setWho((x) => (x.includes(w.id) ? x.filter((y) => y !== w.id) : [...x, w.id]))}>{w.label}</button>
              ))}
            </div>
            <button type="button" disabled={!who.length} onClick={confirmWho} className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-control bg-ink px-4 font-semibold text-white disabled:opacity-40">Continue<ArrowRight size={16} aria-hidden /></button>
          </div>
        )}

        {stage === "existing" && (
          <div className="animate-rise rounded-card border border-line p-3.5">
            <p className="font-semibold text-ink">Do you already have health insurance?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="chip" onClick={() => answerExisting("yes")}>Yes</button>
              <button type="button" className="chip" onClick={() => answerExisting("no")}>No</button>
              <button type="button" className="chip" onClick={() => answerExisting("unsure")}>I’m not sure</button>
            </div>
          </div>
        )}

        {stage === "upload" && (
          <div className="flex animate-rise flex-wrap justify-end gap-2">
            <button type="button" className="chip" onClick={() => { add({ who: "user", text: "Upload policy (sample)" }); setStage("reading"); later(() => analyse(true), 1500); }}>Upload policy</button>
            <button type="button" className="chip" onClick={() => { add({ who: "user", text: "Continue without uploading" }); analyse(false); }}>Continue without uploading</button>
          </div>
        )}

        {(stage === "analysing" || stage === "reading") && lines[lines.length - 1].who === "user" && (
          <div className="flex items-center gap-2 text-[0.92rem] text-soft">
            {stage === "reading" ? <><Loader2 size={16} className="animate-spin" aria-hidden />Reading a sample policy...</> : existing !== null && lines.length > 4 ? <><Loader2 size={16} className="animate-spin" aria-hidden />Understanding your coverage...</> : <span className="flex gap-1" aria-label="Bimora is typing"><span className="h-2 w-2 animate-dot rounded-full bg-soft" /><span className="h-2 w-2 animate-dot rounded-full bg-soft [animation-delay:.15s]" /><span className="h-2 w-2 animate-dot rounded-full bg-soft [animation-delay:.3s]" /></span>}
          </div>
        )}

        {stage === "gaps" && (
          <div className="animate-rise rounded-card border border-gap-line bg-gap-tint/50 p-4">
            <p className="font-semibold text-ink">Potential gaps identified</p>
            <ul className="mt-2.5 space-y-2">
              {gaps.map((g) => <li key={g} className="flex gap-2 text-[0.93rem] leading-snug text-ink"><AlertCircle size={17} className="mt-0.5 shrink-0 text-gap" aria-hidden />{g}</li>)}
            </ul>
            <p className="mt-3 text-[0.85rem] leading-snug text-body">Not every gap needs a new policy. Bimora checks whether each one matters for you first.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/start?intent=cover" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-control bg-action px-4 font-semibold text-white hover:bg-action-hover">Continue in Bimora<ArrowRight size={16} aria-hidden /></Link>
              <button type="button" onClick={reset} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-control px-3 font-semibold text-ink hover:bg-paper"><RotateCcw size={15} aria-hidden />Start over</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
