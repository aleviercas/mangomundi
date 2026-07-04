import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

  // A submit from the hero widget remounts the comparator (key=nonce) with
  // autoRun — reusing the exact initialQuery machinery /compare used, without
  // sharing mutable state across the two components. The nonce (not a
  // serialized query) guarantees a remount even for identical params, since
  // the comparator's one-shot autoRun guard blocks re-runs within a mount.
  const [query, setQuery] = useState<(ComparatorQuery & { nonce: number }) | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Bumped on every "Advanced options" click so repeat clicks re-scroll even
  // when the card is already open (the effect below runs after the card
  // renders, so the scroll target exists).
  const [advancedScrollTick, setAdvancedScrollTick] = useState(0);
  const nonceRef = useRef(0);

  useEffect(() => {
    if (advancedScrollTick === 0) return;
    document.getElementById("comparator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [advancedScrollTick]);

  const geoDefaults: ComparatorQuery = {
    origin: geoCountry,
    destination: "US",
    segment: "retail",
    from: geoCurrency,
    to: "USD",
    amount: 1000,
  };

  return (
    <>
      <HeroSection
        onSubmit={(q) => setQuery({ ...q, nonce: ++nonceRef.current })}
        onToggleAdvanced={() => {
          setAdvancedOpen(true);
          setAdvancedScrollTick((n) => n + 1);
        }}
      />
      <ComparatorSection
        key={query?.nonce ?? 0}
        initialQuery={query ?? geoDefaults}
        showAdvancedCard={advancedOpen || !!query}
      />
      <HowItWorksSection />
      <AboutManifestoSection />
      <StatsSection />
      <EmbedWidgetSection />
      <BusinessSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}
