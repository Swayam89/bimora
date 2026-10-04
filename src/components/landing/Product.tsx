"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Baby, Check, FileText, HeartPulse, MessageCircle, RefreshCw, User, Users } from "lucide-react";
import { PolicyUpload } from "@/components/shared/PolicyUpload";
import { RecommendationSet } from "@/components/shared/RecommendationSet";
import { VoicePanel } from "@/components/shared/VoicePanel";
import { AdvisorDialog } from "@/components/shared/AdvisorDialog";
import { DemoTag, SectionHead } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_RECOMMENDATION } from "@/lib/mock/data";
import { track } from "@/lib/analytics";
import { cx } from "@/lib/format";

export function UploadSection() {
  const [advisor, setAdvisor] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <section id="policy" aria-labelledby="upload-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="page-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:pt-4">
          <SectionHead id="upload-title" eyebrow="Start with what you have" title="Already have insurance? Start there." body="Upload your policy and let Bimora make sense of it: what’s covered, what isn’t, and which conditions matter before you change anything." />
          <ul className="mt-8 space-y-3 text-[0.98rem] text-ink">
            {["Coverage and sum insured", "Waiting periods still running", "Exclusions and room restrictions", "Co-payment and important conditions"].map((t) => (
              <li key={t} className="flex gap-3"><Check size={18} className="mt-0.5 shrink-0 text-ok" aria-hidden />{t}</li>
            ))}
          </ul>
          {done && <div className="mt-8"><ButtonLink href="/start?intent=policy" variant="dark">Continue with Bimora<ArrowRight size={17} aria-hidden /></ButtonLink></div>}
        </div>
        <div>
          <PolicyUpload onAdvisor={() => setAdvisor(true)} onComplete={() => setDone(true)} />
        </div>
      </div>
      <AdvisorDialog open={advisor} onClose={() => setAdvisor(false)} reason="Help reading my policy" />
    </section>
  );
}

const HOUSEHOLD = [
  { label: "You", icon: User, cover: ["Employer", "Personal"] },
  { label: "Spouse", icon: User, cover: ["Employer", "Personal"] },
  { label: "Child", icon: Baby, cover: ["Employer"] },
  { label: "Father", icon: HeartPulse, cover: [] },
  { label: "Mother", icon: HeartPulse, cover: [] },
];

export function GapSection() {
  return (
    <section aria-labelledby="gap-title" className="bg-paper py-20 sm:py-28">
      <div className="page-x">
        <SectionHead id="gap-title" eyebrow="Coverage gaps" title="Know what you’re missing before you buy more." />
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-sheet border border-line bg-canvas p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">Your household</p><DemoTag>Example household</DemoTag></div>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {HOUSEHOLD.map((m) => (
                <li key={m.label} className={cx("rounded-card border p-3.5", m.cover.length ? "border-line" : "border-gap-line bg-gap-tint/50")}>
                  <m.icon size={20} className={m.cover.length ? "text-ink" : "text-gap"} aria-hidden />
                  <p className="mt-3 font-semibold text-ink">{m.label}</p>
                  <p className={cx("mt-1 text-[0.8rem] leading-snug", m.cover.length ? "text-soft" : "text-gap")}>{m.cover.length ? m.cover.join(" + ") : "Not covered"}</p>
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.9rem] font-semibold text-ink">Current protection</p>
                <ul className="mt-2.5 space-y-2 text-[0.95rem] text-ink">
                  <li className="flex gap-2"><Check size={18} className="text-ok" aria-hidden />Employer insurance</li>
                  <li className="flex gap-2"><Check size={18} className="text-ok" aria-hidden />Personal health policy</li>
                </ul>
              </div>
              <div>
                <p className="text-[0.9rem] font-semibold text-ink">Potential issues</p>
                <ul className="mt-2.5 space-y-2 text-[0.95rem] text-ink">
                  <li className="flex gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-gap" aria-hidden />Employer cover may not continue after leaving the job</li>
                  <li className="flex gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-gap" aria-hidden />Parent coverage may need separate consideration</li>
                </ul>
              </div>
            </div>
          </div>
          <figure className="flex flex-col justify-between rounded-sheet bg-ink p-6 text-white sm:p-8">
            <figcaption className="text-[0.85rem] font-semibold uppercase tracking-[0.12em] text-[#8FC3F0]">Bimora’s role</figcaption>
            <blockquote className="mt-6 font-display text-[1.7rem] leading-snug sm:text-[2rem]">Bimora doesn’t automatically tell you to buy more. It first helps you understand whether the gap matters.</blockquote>
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[#B7C5D3]">A gap is only worth closing if it could actually hurt your family. Sometimes the answer is to change nothing.</p>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function RecommendationSection() {
  const router = useRouter();
  return (
    <section aria-labelledby="rec-title" className="py-20 sm:py-28">
      <div className="page-x">
        <SectionHead id="rec-title" eyebrow="Recommendations you can follow" title="Not “best policy: Plan A”. The reasons, and the trade-offs." body="Every recommendation says why it fits, what you get and what you give up, so you can disagree with it." />
        <div className="mt-12 rounded-sheet border border-line bg-canvas p-4 sm:p-7">
          <RecommendationSet rec={DEMO_RECOMMENDATION} chooseLabel="Get started with" onChoose={() => { track("hero_cta_clicked", { cta: "find_coverage", location: "recommendation" }); router.push("/start?intent=cover"); }} />
        </div>
      </div>
    </section>
  );
}

export function VoiceSection() {
  return (
    <section aria-labelledby="voice-title" className="bg-night py-20 sm:py-28">
      <div className="page-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead dark id="voice-title" eyebrow="Voice" title="Sometimes it’s easier to just talk." body="Ask questions, explain your situation or understand your policy naturally." />
          <ul className="mt-8 space-y-3 text-[0.98rem] text-[#D9E2EA]">
            {[["Explain your family in your own words", MessageCircle], ["Ask what a term in your policy means", FileText], ["Pick up where you left off in chat", RefreshCw]].map(([t, I]) => { const Icon = I as typeof Users; return <li key={t as string} className="flex gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-[#8FC3F0]" aria-hidden />{t as string}</li>; })}
          </ul>
        </div>
        <VoicePanel dark />
      </div>
    </section>
  );
}
