import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import { Wordmark } from "@/components/Wordmark";
import { defaultCounterCurrency } from "@/lib/countries";

/**
 * Self-contained comparator for the embeddable widget — the SAME unified box
 * as the home page (basic row + fold-out advanced options + inline results),
 * packed into a fixed-height container that scrolls internally.
 *
 * Used by both the `/embed` iframe route and the home Widget section's live
 * preview, so "what you see is what you embed".
 */
export function EmbedComparator({
  initialCurrency,
  initialAmount,
  geoCountry = "GB",
  geoCurrency = "GBP",
  previewDestination,
}: {
  initialCurrency?: string;
  initialAmount?: number;
  /** Visitor's geo-detected country/currency (see geo.functions.ts). Callers
   *  that don't have it (e.g. a static preview) can omit it — the GB/GBP
   *  fallback below matches getVisitorGeo()'s own fallback. */
  geoCountry?: string;
  geoCurrency?: string;
  /** design/AJUSTES-1.md §H — set ONLY by the home page's widget preview
   *  (EmbedWidgetSection), never by the real /embed route: a real embedder
   *  who didn't configure a destination should still land on the empty
   *  "pick a currency" state, not a comparison they never asked for. The
   *  preview is different — it exists to show off a real result, so it
   *  supplies one and auto-runs it (a genuine compareProviders call, not
   *  mocked data). */
  previewDestination?: { country: string; currency: string };
}) {
  // Presets from the embed's data-*/query params, falling back to the
  // visitor's real geo instead of a hardcoded "US"/"USD" — destination
  // currency is picked so it never starts equal to the origin one (that
  // used to trigger the same-currency warning immediately on load).
  const from = initialCurrency ?? geoCurrency;
  const initialQuery: ComparatorQuery = {
    origin: geoCountry,
    destination: previewDestination?.country ?? "",
    segment: "retail",
    from,
    to: previewDestination?.currency ?? defaultCounterCurrency(from),
    amount: initialAmount ?? 1000,
    autoRun: previewDestination != null,
  };

  // Down-chevron scroll affordance: shown while there's more content below the
  // fold of the internal scroll region (e.g. a long results list).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const updateHint = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollHint(el.scrollHeight - el.scrollTop - el.clientHeight > 24);
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(updateHint);
    // Content grows/shrinks inside ComparatorSection (results landing, the
    // advanced fold-out) without this component re-rendering — watch the DOM.
    const mo = new MutationObserver(() => requestAnimationFrame(updateHint));
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(id);
      mo.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfcfc]">
      <div
        ref={scrollRef}
        onScroll={updateHint}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
      >
        <ComparatorSection embedded initialQuery={initialQuery} />
      </div>

      {showScrollHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-9 flex justify-center">
          <span className="animate-bounce rounded-full bg-foreground/70 p-1 text-background shadow-md">
            <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      )}

      {/* Attribution — required on the free embed; links back to the site. */}
      <a
        href="https://mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-card py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        powered by <Wordmark className="text-xs" compact />
      </a>
    </div>
  );
}
