import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { ComparatorSection } from "@/sections/ComparatorSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { CTASection } from "@/sections/CTASection";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <HeroSection />
      <ComparatorSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
