import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { PlatformBand } from "@/sections/PlatformBand";
import { StatsSection } from "@/sections/StatsSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { DualAudienceSection } from "@/sections/DualAudienceSection";
import { FeaturesSection } from "@/sections/FeaturesSection";
import { AISection } from "@/sections/AISection";
import { TestimonialsSection } from "@/sections/TestimonialsSection";
import { CTASection } from "@/sections/CTASection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mangoglobal — The Global FX Decision Engine" },
      { name: "description", content: "Neutral AI platform that turns fragmented cross-border payments into one intelligent decision. Compare, optimise, and execute FX payments." },
      { property: "og:title", content: "mangoglobal — The Global FX Decision Engine" },
      { property: "og:description", content: "Neutral AI platform for smarter cross-border payments." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HeroSection />
      <PlatformBand />
      <StatsSection />
      <HowItWorksSection />
      <DualAudienceSection />
      <FeaturesSection />
      <AISection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
