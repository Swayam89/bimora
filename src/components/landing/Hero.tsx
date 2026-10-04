"use client";
import { ArrowRight, Mic, Upload } from "lucide-react";
import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { HeroDemo } from "./HeroDemo";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="page-x grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow">Understand first. Recommend second.</p>
          <h1 id="hero-title" className="mt-5 font-display text-display-xl font-medium text-ink text-balance">
            Don’t start with a policy. <span className="text-action-ink">Start with what your family actually needs.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-body text-pretty sm:text-[1.22rem]">
            Bimora understands your family, your existing coverage and your needs before recommending insurance.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink href="/start?intent=cover" size="lg" onClick={() => track("hero_cta_clicked", { cta: "find_coverage", location: "hero" })}>
              Find My Best Coverage<ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <a href="#policy" className={buttonClass("secondary", "lg")} onClick={() => track("hero_cta_clicked", { cta: "upload_policy", location: "hero" })}>
              <Upload size={18} aria-hidden />Upload My Policy
            </a>
            <Link href="/bimora?talk=1" className="inline-flex min-h-[56px] items-center gap-2.5 rounded-control px-2 font-semibold text-ink hover:text-action" onClick={() => track("hero_cta_clicked", { cta: "talk", location: "hero" })}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-action-tint text-action"><Mic size={18} aria-hidden /></span>Talk to Bimora
            </Link>
          </div>
          <p className="mt-6 text-[0.92rem] text-soft">Free to get started. Nothing is bought without your approval.</p>
        </div>
        <div id="demo" className="scroll-mt-24">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
