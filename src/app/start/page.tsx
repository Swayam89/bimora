"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { EMPTY_PROFILE, describeMembers, type Profile } from "@/lib/agent/profile";
import { QUESTIONS } from "@/lib/agent/questions";
import { loadProfile, saveProfile } from "@/lib/session";
import { services } from "@/services";
import { track } from "@/lib/analytics";
import { cx } from "@/lib/format";

type StepId = "protect" | "who" | "has_insurance" | "city" | `dyn:${string}` | "name" | "done";

const PROTECT = [
  { id: "myself", label: "Myself", hint: "Cover just for you" },
  { id: "family", label: "My family", hint: "You and the people you live with" },
  { id: "parents", label: "My parents", hint: "Cover for one or both parents" },
  { id: "existing", label: "I already have insurance", hint: "Start by understanding what you have" },
  { id: "unsure", label: "I’m not sure", hint: "We’ll work it out together" },
] as const;

const WHO = [{ id: "me", label: "Me" }, { id: "spouse", label: "My spouse" }, { id: "children", label: "My children" }, { id: "parents", label: "My parents" }] as const;
const POPULAR = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai"];
const DYNAMIC_IDS = ["eldest", "parents_condition", "insurance_source"]; // asked here; the rest happen in conversation
const MAX_DYNAMIC = 2;

function Option({ selected, onClick, label, hint, multi }: { selected: boolean; onClick: () => void; label: string; hint?: string; multi?: boolean }) {
  return (
    <button type="button" onClick={onClick} {...(multi ? { "aria-pressed": selected } : { role: "radio", "aria-checked": selected })}
      className={cx("flex min-h-[64px] w-full items-center justify-between gap-4 rounded-card border px-5 py-4 text-left transition-colors", selected ? "border-action bg-action-tint" : "border-line bg-canvas hover:border-line-strong")}>
      <span><span className="block text-[1.05rem] font-semibold text-ink">{label}</span>{hint && <span className="mt-0.5 block text-[0.9rem] text-soft">{hint}</span>}</span>
      <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-action bg-action text-white" : "border-line-strong")}>{selected && <Check size={14} aria-hidden />}</span>
    </button>
  );
}

function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const intent = (params.get("intent") as Profile["intent"]) ?? "cover";
  const [p, setP] = useState<Profile>(EMPTY_PROFILE);
  const [history, setHistory] = useState<StepId[]>(["protect"]);
  const [dynCount, setDynCount] = useState(0);
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<{ city: string; state: string }[]>([]);
  const step = history[history.length - 1];

  useEffect(() => {
    const prev = loadProfile();
    const base: Profile = { ...EMPTY_PROFILE, ...(prev && !prev.completedOnboarding ? { members: prev.members, hasInsurance: prev.hasInsurance } : {}) };
    if (intent === "policy") { base.protect = "existing"; base.hasInsurance = "yes"; }
    setP(base);
    track("signup_started", { intent });
  }, [intent]);

  useEffect(() => {
    let live = true;
    services.location.suggestCities(cityQuery).then((r) => { if (live && r.ok) setCities(r.data); });
    return () => { live = false; };
  }, [cityQuery]);

  const nextDynamic = (prof: Profile) => QUESTIONS.find((q) => DYNAMIC_IDS.includes(q.id) && q.relevant(prof) && !q.answered(prof));
  const dynamicQ = useMemo(() => (step.startsWith("dyn:") ? QUESTIONS.find((q) => q.id === step.slice(4)) : undefined), [step]);
  const advancing = useRef(false);
  const go = (s: StepId) => setHistory((h) => (h[h.length - 1] === s ? h : [...h, s]));
  /** Auto-advance after a single-choice tap, ignoring double taps. */
  const goSoon = (s: StepId | (() => void)) => {
    if (advancing.current) return;
    advancing.current = true;
    setTimeout(() => { advancing.current = false; typeof s === "function" ? s() : go(s); }, 160);
  };
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const afterCity = (prof: Profile = p) => { const q = nextDynamic(prof); if (q && dynCount < MAX_DYNAMIC) go(`dyn:${q.id}`); else go("name"); };

  function chooseProtect(id: Profile["protect"]) {
    setP((x) => {
      const members: Profile["members"] = id === "myself" ? ["me"] : id === "family" ? ["me", "spouse", "children"] : id === "parents" ? ["parents"] : x.members.length ? x.members : ["me"];
      return { ...x, protect: id, members, hasInsurance: id === "existing" ? "yes" : x.hasInsurance };
    });
    goSoon("who");
  }

  function finish() {
    const final: Profile = { ...p, intent, completedOnboarding: true };
    saveProfile(final);
    track("signup_completed", { intent, members_count: final.members.length });
    router.push("/bimora");
  }

  const totalGuess = 6;
  const pct = Math.min(100, Math.round(((history.length - 1) / totalGuess) * 100));

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex items-center gap-2"><Logo /><span className="demo-tag">Concept</span></span>
          <Link href="/" className="rounded-control px-3 py-2 text-[0.92rem] font-medium text-soft hover:bg-paper hover:text-ink">Exit</Link>
        </div>
        <div className="h-1 bg-paper" role="progressbar" aria-label="Progress" aria-valuenow={step === "done" ? 100 : pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-action transition-[width] duration-300" style={{ width: `${step === "done" ? 100 : pct}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10 pt-8 sm:px-6 sm:pt-14">
        {history.length > 1 && step !== "done" && (
          <button type="button" onClick={back} className="mb-6 inline-flex items-center gap-1.5 self-start rounded-control py-2 pr-3 text-[0.92rem] font-medium text-soft hover:text-ink"><ArrowLeft size={16} aria-hidden />Back</button>
        )}

        <div key={step} className="animate-rise">
          {step === "protect" && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">What are you looking to protect?</h1>
              <p className="mt-3 text-body">No budget or sum insured needed. We start with you.</p>
              <div role="radiogroup" aria-labelledby="q" className="mt-8 space-y-3">
                {PROTECT.map((o) => <Option key={o.id} label={o.label} hint={o.hint} selected={p.protect === o.id} onClick={() => chooseProtect(o.id)} />)}
              </div>
            </section>
          )}

          {step === "who" && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">Who would you like to cover?</h1>
              <p className="mt-3 text-body">Pick everyone. It decides whether one shared plan works.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2" role="group" aria-labelledby="q">
                {WHO.map((o) => <Option key={o.id} multi label={o.label} selected={p.members.includes(o.id)} onClick={() => setP((x) => ({ ...x, members: x.members.includes(o.id) ? x.members.filter((m) => m !== o.id) : [...x.members, o.id] }))} />)}
              </div>
              <Button size="lg" className="mt-8 w-full sm:w-auto" disabled={!p.members.length} onClick={() => go("has_insurance")}>Continue<ArrowRight size={18} aria-hidden /></Button>
            </section>
          )}

          {step === "has_insurance" && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">Do you already have insurance?</h1>
              <p className="mt-3 text-body">Including cover from your employer.</p>
              <div role="radiogroup" aria-labelledby="q" className="mt-8 space-y-3">
                {[{ id: "yes", label: "Yes" }, { id: "no", label: "No" }, { id: "unsure", label: "I’m not sure" }].map((o) => (
                  <Option key={o.id} label={o.label} selected={p.hasInsurance === o.id} onClick={() => { setP((x) => ({ ...x, hasInsurance: o.id as Profile["hasInsurance"], insuranceSource: o.id === "yes" ? x.insuranceSource : undefined })); goSoon("city"); }} />
                ))}
              </div>
            </section>
          )}

          {step === "city" && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">Where do you live?</h1>
              <p className="mt-3 text-body">Hospital costs vary a lot between cities, which matters when deciding how much cover is enough.</p>
              <label htmlFor="city" className="mt-8 block text-[0.92rem] font-semibold text-ink">City</label>
              <div className="relative mt-2">
                <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-soft" aria-hidden />
                <input id="city" value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="Start typing your city" autoComplete="address-level2"
                  className="min-h-[56px] w-full rounded-control border border-line-strong bg-canvas pl-11 pr-4 text-[1.05rem] text-ink outline-none focus:border-action focus:ring-4 focus:ring-action/20" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Suggestions">
                {(cityQuery ? cities.map((c) => c.city) : POPULAR).map((c) => (
                  <button key={c} type="button" className="chip" aria-pressed={p.city === c} onClick={() => { setP((x) => ({ ...x, city: c })); setCityQuery(c); }}>{c}</button>
                ))}
                {cityQuery && !cities.length && <p className="text-[0.9rem] text-soft">No match in our list. You can continue with “{cityQuery}”.</p>}
              </div>
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" disabled={!cityQuery.trim()} onClick={() => { const next = { ...p, city: cityQuery.trim() }; setP(next); afterCity(next); }}>Continue<ArrowRight size={18} aria-hidden /></Button>
                <Button size="lg" variant="ghost" onClick={() => afterCity()}>Skip for now</Button>
              </div>
            </section>
          )}

          {dynamicQ && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">{dynamicQ.text(p)}</h1>
              <p className="mt-3 text-body">{dynamicQ.why}</p>
              <div role="radiogroup" aria-labelledby="q" className="mt-8 space-y-3">
                {dynamicQ.choices(p).map((c) => (
                  <Option key={c.id} label={c.label} selected={dynamicQ.answered(p) && JSON.stringify(dynamicQ.apply(p, [c.id])) === JSON.stringify(p)} onClick={() => {
                    const next = dynamicQ.apply(p, [c.id]); setP(next);
                    const more = nextDynamic(next);
                    const n = dynCount + 1; setDynCount(n);
                    goSoon(more && n < MAX_DYNAMIC ? (`dyn:${more.id}` as StepId) : "name");
                  }} />
                ))}
              </div>
            </section>
          )}

          {step === "name" && (
            <section aria-labelledby="q">
              <h1 id="q" className="font-display text-display-md text-ink">What should Bimora call you?</h1>
              <p className="mt-3 text-body">Optional. It stays on this device.</p>
              <label htmlFor="fname" className="mt-8 block text-[0.92rem] font-semibold text-ink">First name</label>
              <input id="fname" value={p.firstName ?? ""} onChange={(e) => setP((x) => ({ ...x, firstName: e.target.value.slice(0, 40) }))} autoComplete="given-name"
                className="mt-2 min-h-[56px] w-full rounded-control border border-line-strong bg-canvas px-4 text-[1.05rem] text-ink outline-none focus:border-action focus:ring-4 focus:ring-action/20" />
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" onClick={() => go("done")}>Continue<ArrowRight size={18} aria-hidden /></Button>
                <Button size="lg" variant="ghost" onClick={() => { setP((x) => ({ ...x, firstName: undefined })); go("done"); }}>Skip</Button>
              </div>
            </section>
          )}

          {step === "done" && (
            <section aria-labelledby="q">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ok-tint text-ok"><Check size={24} aria-hidden /></span>
              <h1 id="q" className="mt-6 font-display text-display-md text-ink">I have enough to start understanding your situation.</h1>
              <div className="mt-8 rounded-card border border-line p-5">
                <p className="text-[0.9rem] font-semibold text-soft">What I know so far</p>
                <ul className="mt-3 space-y-2 text-ink">
                  <li>· You’d like to cover {describeMembers(p)}.</li>
                  <li>· {p.hasInsurance === "yes" ? "You already have some insurance." : p.hasInsurance === "no" ? "You don’t have insurance yet." : "You’re not sure what cover you have. We’ll check."}</li>
                  {p.city && <li>· You live in {p.city}.</li>}
                </ul>
                <p className="mt-4 text-[0.9rem] text-soft">I’ll ask the rest as we go, one question at a time, and only if it changes what I’d suggest.</p>
              </div>
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" onClick={finish}>Meet Bimora<ArrowRight size={18} aria-hidden /></Button>
                <Button size="lg" variant="ghost" onClick={back}>Change an answer</Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StartPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-canvas" />}><Onboarding /></Suspense>;
}
