import { useState } from "react";
import { HeroSection } from "@/sections/HeroSection";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { TodaysRoutesSection } from "@/sections/TodaysRoutesSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { AboutManifestoSection } from "@/sections/AboutManifestoSection";
import { EmbedWidgetSection } from "@/sections/EmbedWidgetSection";
import { BusinessSection } from "@/sections/BusinessSection";
import { ContactSection } from "@/sections/ContactSection";
import { BlogSection } from "@/sections/BlogSection";

export interface ComparatorQueryChange {
  from: string;
  to: string;
  amount: number;
  segment: ComparatorQuery["segment"];
  sendingCountry: string;
  receivingCountry: string;
}

/**
 * The full home page — Hero + comparator + every institutional section below
 * it. Shared by every route that renders "the home page, just with the
 * comparator pre-seeded differently" (design/HANDOFF.md §2, Fase B): "/",
 * "/send/$corridor" and "/business". Each route owns its own URL state
 * (search schema, path params) and just hands this component the resulting
 * `initialQuery`/`onQueryChange` — same prop contract ComparatorSection
 * itself already uses, one level up.
 */
export function HomePageBody({
  initialQuery,
  onQueryChange,
}: {
  initialQuery: ComparatorQuery;
  onQueryChange?: (q: ComparatorQueryChange) => void;
}) {
  // Drives the Kayak/Skyscanner-style "search mode" swap: once a comparison
  // has a result, the hero collapses and the comparator card (see its own
  // `result && !embedded` check) sticks under the header — same content,
  // just no longer competing with the results list for the first screenful.
  const [hasResult, setHasResult] = useState(false);

  return (
    <>
      <HeroSection compact={hasResult} />
      <ComparatorSection
        initialQuery={initialQuery}
        onHasResultChange={setHasResult}
        onQueryChange={onQueryChange}
      />
      {/* design/AJUSTES-1.md §E — below the comparator only while no search
          has run yet, same gate HeroSection's compact mode uses. */}
      {!hasResult && <TodaysRoutesSection />}
      {/* design/AJUSTES-2.md §2 — with a result, the page is header + search
          bar + rail/results + footer, nothing else: someone comparing 52
          prices isn't reading the manifesto. Header/Footer are root-layout
          chrome (__root.tsx), not part of this list, so they're unaffected;
          the Business-upsell line stays too, but it lives inside
          ComparatorSection's own results output, not in this list. */}
      {!hasResult && (
        <>
          <HowItWorksSection />
          <AboutManifestoSection />
          <EmbedWidgetSection />
          <BusinessSection />
          <ContactSection />
          <BlogSection />
        </>
      )}
    </>
  );
}
