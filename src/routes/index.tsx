import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { AboutManifestoSection } from "@/sections/AboutManifestoSection";
import { StatsSection } from "@/sections/StatsSection";
import { ContactSection } from "@/sections/ContactSection";
import { BlogSection } from "@/sections/BlogSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mangoglobal — Intelligent currency exchange decisions" },
      {
        name: "description",
        content:
          "A neutral decision engine that compares cross-border routes and local currency exchange operators in real time — without bias or hidden margins.",
      },
      { property: "og:title", content: "mangoglobal — Intelligent currency exchange decisions" },
      {
        property: "og:description",
        content:
          "Compare 50+ FX providers in real time. Transparent rates, fees, and delivery speed for every corridor.",
      },
      { property: "og:url", content: "https://mangoglobal.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AboutManifestoSection />
      <StatsSection />
      <ContactSection />
      <BlogSection />
    </>
  );
}
