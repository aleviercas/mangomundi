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
      { title: "mangomundi — Intelligent currency exchange decisions" },
      {
        name: "description",
        content:
          "A neutral decision engine that compares cross-border routes and local currency exchange operators in real time — without bias or hidden margins.",
      },
      { property: "og:title", content: "mangomundi — Intelligent currency exchange decisions" },
      {
        property: "og:description",
        content:
          "Compare 50+ FX providers in real time. Transparent rates, fees, and delivery speed for every corridor.",
      },
      { property: "og:url", content: "https://mangomundi.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mangomundi.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Mangomundi",
          url: "https://mangomundi.lovable.app/",
          logo: "https://mangomundi.lovable.app/og-image.png",
          sameAs: [],
          description:
            "Neutral AI decision engine for cross-border payments and currency exchange.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Mangomundi",
          url: "https://mangomundi.lovable.app/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://mangomundi.lovable.app/compare?from={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
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
