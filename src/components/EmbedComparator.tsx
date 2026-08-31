import { useEffect, useState } from "react";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import type { ComparisonResult } from "@/lib/fx.functions";
import { Wordmark } from "@/components/Wordmark";
import { defaultCounterCurrency } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";

/** design/Mangomundi 4 - Final.dc.html (line 727-729) — "rates 2 min ago" in
 *  the widget's own header bar. Computed from the ONE comparison this
 *  widget actually ran (ComparisonResult.fetched_at via ComparatorSection's
 *  onResult), not a page-wide claim across several corridors — that's the
 *  case design/AJUSTES-1.md §E deliberately dropped as unhonest (see
 *  todaysRoutes.title's comment in i18n.tsx). A single widget query has a
 *  single real fetch time, so this one is real. Hidden until a result
 *  exists — nothing to be fresh about before that. */
function useRatesFreshness(fetchedAt: string | null): string | null {
  const { t } = useI18n();
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!fetchedAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [fetchedAt]);
  if (!fetchedAt) return null;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60_000));
  return minutes < 1
    ? t("widget.header.ratesJustNow")
    : t("widget.header.ratesMinAgo").replace("{n}", String(minutes));
}

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
  /** design/AJUSTES-1.md §H — set ONLY by /widget's own live preview
   *  (routes/widget.tsx), never by the real /embed route: a real embedder
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

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const freshness = useRatesFreshness(result?.fetched_at ?? null);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfcfc]">
      {/* design/Mangomundi 4 - Final.dc.html (line 726-729) — the widget's
          own header bar, distinct from ComparatorSection's chrome (which
          `embedded` strips entirely): wordmark + a real freshness stamp,
          shown only once a comparison has actually run. */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3.5 py-2.5">
        <Wordmark className="text-base" />
        {freshness && (
          <span className="text-[10.5px] font-semibold text-muted-foreground">{freshness}</span>
        )}
      </div>

      {/* 2026-08-31 feedback — "el widget sacarle el scroll, dijimos que iba
          sin scroll" (design/Mangomundi 4 - Final.dc.html line 728 labels
          the widget mockup itself "Widget · sin scroll"): no overflow-y-auto
          here anymore, and no scroll-hint chevron — this content is meant
          to fit the fixed 360×540 frame outright (smaller type throughout
          the embedded search row and CompactResultsList, see their own
          comments), not scroll to reveal what doesn't fit. */}
      <div className="min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-4">
        <ComparatorSection embedded initialQuery={initialQuery} onResult={setResult} />
      </div>

      {/* Attribution — required on the free embed; links back to the site. */}
      <a
        href="https://mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-card py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        powered by <Wordmark className="text-xs" compact icon={false} />
      </a>
    </div>
  );
}
