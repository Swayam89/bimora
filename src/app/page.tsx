import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Insight, HowItWorks } from "@/components/landing/Story";
import { UploadSection, GapSection, RecommendationSection, VoiceSection } from "@/components/landing/Product";
import { FollowUp, Advisor, Guardrails, FAQ, FinalCTA, Footer } from "@/components/landing/Trust";
import { ConceptBar } from "@/components/ui/ConceptBar";
import { PageView } from "@/components/ui/PageView";

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <ConceptBar />
      <Navbar />
      <main id="main">
        <Hero />
        <Insight />
        <HowItWorks />
        <div id="what" className="scroll-mt-20">
          <UploadSection />
          <GapSection />
          <RecommendationSection />
          <VoiceSection />
        </div>
        <FollowUp />
        <Advisor />
        <Guardrails />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <PageView event="landing_view" />
    </>
  );
}
