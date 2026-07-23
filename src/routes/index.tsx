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
import { SITE_URL, hreflangLinks, selfCanonical } from "@/config/site";
import { defaultCounterCurrency } from "@/lib/countries";

export const Route = createFileRoute("/")({
  // Title/description/OG come from the root head, which is per-language
  // (SEO_META). The home just adds its own canonical, og:url, hreflang and
  // JSON-LD so it doesn't re-pin an English-only title over the localized one.
  head: ({ matches }) => {
    const root = matches.find((m) => m.routeId === "__root__");
    const explicitLang = (root?.loaderData as { explicitLang?: string | null } | undefined)
      ?.explicitLang;
    const canonical = selfCanonical("/", explicitLang);
    return {
      meta: [{ property: "og:url", content: canonical }],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/")],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "mangomundi",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/og-image.png`,
            sameAs: [
              "https://www.linkedin.com/company/mangomundi",
              "https://x.com/mangomundi",
              "https://www.facebook.com/people/Mangomundi/61591687365990/",
              "https://www.instagram.com/mangomundi/",
            ],
            description:
              "AI-powered currency exchange comparator — compare exchange rates, fees, routes and delivery speeds across 50+ providers in real time.",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "mangomundi",
            url: `${SITE_URL}/`,
          }),
        },
      ],
    };
  },
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
    to: defaultCounterCurrency(geoCurrency),
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
