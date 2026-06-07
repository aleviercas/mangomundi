import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { InlineChat } from "@/components/InlineChat";
import { ComparatorSection } from "@/sections/ComparatorSection";
import { StatsSection } from "@/sections/StatsSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { DualAudienceSection } from "@/sections/DualAudienceSection";
import { FeaturesSection } from "@/sections/FeaturesSection";
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

function FlowLabel({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs font-bold tracking-widest text-primary">{step}</span>
          <span className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{body}</p>
      </div>
    </div>
  );
}

function Index() {
  return (
    <>
      <HeroSection />
      <FlowLabel
        step="01"
        title="Consult via FX Copilot"
        body="Describe your currency scenario conversationally to isolate optimal variables. Neutral by design — the agent surfaces the math, you decide."
      />
      <InlineChat />
      <FlowLabel
        step="02"
        title="Audit the Market"
        body="Manually test specific routes and execution paths with raw mathematical data for absolute transparency. Validate the Copilot's reasoning against the live indexed market."
      />
      <ComparatorSection />
      <StatsSection />
      <HowItWorksSection />
      <DualAudienceSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
