import { useState } from "react";
import { HeroSection } from "@/sections/HeroSection";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { TodaysRoutesSection } from "@/sections/TodaysRoutesSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { AboutManifestoSection } from "@/sections/AboutManifestoSection";
import { BusinessWidgetRow } from "@/sections/BusinessWidgetRow";
import { BlogSection } from "@/sections/BlogSection";
import { BusinessExtrasSection } from "@/sections/BusinessExtrasSection";

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
  hideMarketingSections = false,
  businessExtras = false,
}: {
  initialQuery: ComparatorQuery;
  onQueryChange?: (q: ComparatorQueryChange) => void;
  /** design/AJUSTES-4.md §3 — /business drops the retail marketing stack
   *  this component shows every other route while `!hasResult`. Default
   *  false keeps "/" and "/send/$corridor" exactly as before. */
  hideMarketingSections?: boolean;
  /** 2026-08-30 feedback (third round) — BusinessExtrasSection ("Institutional
   *  & Partnership Inquiries" + the two cards + photo) used to render
   *  unconditionally below this component (routes/business.tsx rendered it
   *  itself, outside HomePageBody, so it had no access to `hasResult`).
   *  Corrected to the same rule every other marketing section here already
   *  follows: visible before a search, hidden once a result lands — the
   *  vertical rail's own BusinessContactCard (photo + email CTA) covers the
   *  same "how to reach us" ground once there IS a result, so keeping both
   *  visible was double coverage, not addition. */
  businessExtras?: boolean;
}) {
  // Drives the Kayak/Skyscanner-style "search mode" swap: once a comparison
  // has a result, the hero collapses and the comparator card (see its own
  // `result && !embedded` check) sticks under the header — same content,
  // just no longer competing with the results list for the first screenful.
  const [hasResult, setHasResult] = useState(false);
  const showMarketing = !hasResult && !hideMarketingSections;

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
      {showMarketing && <TodaysRoutesSection />}
      {/* design/AJUSTES-2.md §2 — with a result, the page is header + search
          bar + rail/results + footer, nothing else: someone comparing 52
          prices isn't reading the manifesto. Header/Footer are root-layout
          chrome (__root.tsx), not part of this list, so they're unaffected;
          the Business-upsell line stays too, but it lives inside
          ComparatorSection's own results output, not in this list. */}
      {showMarketing && (
        <>
          <HowItWorksSection />
          <AboutManifestoSection />
          {/* design/Mangomundi 4 - Final.dc.html (line 191) — "For business"
              and the widget teaser share one row now (BusinessWidgetRow),
              not two stacked full-width sections. */}
          <BusinessWidgetRow />
          {/* 2026-08-30 feedback — ContactSection removed from the home
              stack: it's now /about's own closing section (the "Get in
              touch" content moved there when /about was rebuilt), so this
              was a duplicate of the same mailto CTA. */}
          <BlogSection />
        </>
      )}
      {/* Same !hasResult gate as the marketing stack above, but independent
          of hideMarketingSections — /business hides the retail stack
          unconditionally while still wanting its own content gated on
          whether a search has actually run (see businessExtras' own doc
          comment above). */}
      {!hasResult && businessExtras && <BusinessExtrasSection />}
    </>
  );
}
