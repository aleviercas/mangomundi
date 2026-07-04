import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { AboutManifestoSection } from "@/sections/AboutManifestoSection";
import { StatsSection } from "@/sections/StatsSection";
import { EmbedWidgetSection } from "@/sections/EmbedWidgetSection";
import { BusinessSection } from "@/sections/BusinessSection";
import { ContactSection } from "@/sections/ContactSection";
import { BlogSection } from "@/sections/BlogSection";
import { SITE_URL, hreflangLinks } from "@/config/site";

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
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }, ...hreflangLinks("/")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Mangomundi",
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/og-image.png`,
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
          url: `${SITE_URL}/`,
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  // Geo defaults for the embedded comparator (same derivation /compare used).
  const rootData = useLoaderData({ from: "__root__" }) as {
    geoCountry?: string;
    geoCurrency?: string;
  };
  const geoCountry = rootData?.geoCountry ?? "GB";
  const geoCurrency = rootData?.geoCurrency ?? "GBP";

  // The comparator is THE single box now (basic row + fold-out advanced
  // options live inside it) — no hero widget to bridge, no remount machinery.
  // Destination starts empty so the user picks it (the CTA validates).
  const geoDefaults: ComparatorQuery = {
    origin: geoCountry,
    destination: "",
    segment: "retail",
    from: geoCurrency,
    to: "USD",
    amount: 1000,
  };

  return (
    <>
      <HeroSection />
      <ComparatorSection initialQuery={geoDefaults} />
      <HowItWorksSection />
      <AboutManifestoSection />
      <StatsSection />
      <EmbedWidgetSection />
      <BusinessSection />
      <ContactSection />
      <BlogSection />
    </>
  );
}
