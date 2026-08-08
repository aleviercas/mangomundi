import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { z } from "zod";
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

// Only used to read ?lang= for the self-referencing canonical below (see
// selfCanonical). Reading it via validateSearch — rather than reaching into
// the root route's async loaderData through `matches` — avoids a known
// TanStack Start ordering issue where head() can run before a parent
// route's loader has resolved (search validation happens synchronously
// during route matching, before any loader runs).
const searchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  // Title/description/OG come from the root head, which is per-language
  // (SEO_META). The home just adds its own canonical, og:url, hreflang and
  // JSON-LD so it doesn't re-pin an English-only title over the localized one.
  head: ({ match }) => {
    const canonical = selfCanonical("/", match.search.lang);
    return {
      meta: [
        { property: "og:url", content: canonical },
        // FlexOffers site-ownership verification (Option 1: meta tag) —
        // home page only, per their own instructions, not site-wide.
        { name: "fo-verify", content: "63daa6c1-d68c-4c7a-ae08-7ff9a05df2b3" },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/")],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "mangomundi",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/og-image.jpg`,
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
