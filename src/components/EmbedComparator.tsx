import { useEffect, useState } from "react";
import { Sparkle } from "lucide-react";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import type { ComparisonResult } from "@/lib/fx.functions";
import type { ExclusiveCorridor } from "@/lib/fx.functions";
import { Wordmark } from "@/components/Wordmark";
import { defaultCounterCurrency, primaryCountryForCurrency } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import { useExclusiveCorridors } from "@/hooks/use-exclusive-corridors";
import { FlagIcon } from "@/components/ui/FlagIcon";

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

/** 2026-09-01 feedback (first round) — "antes de seleccionar pueden aparecer
 *  ejemplos de todays rates para que no aparezca vacío": the compressed
 *  2-line form (see ComparatorSection's own `embedded` branch comment)
 *  frees real vertical room in the fixed 360×540 frame — this fills it
 *  with a real example instead of leaving that space blank pre-search.
 *  Reuses the exact same data TodaysRoutesSection shows on the home page
 *  (getExclusiveCorridors — a real has_exclusive_deal winner, never
 *  invented), just one card instead of four, and labeled "Example rate"
 *  rather than reusing todaysRoutes.title's copy, so it never reads as
 *  this widget's own live result before a real search has run. Hidden
 *  once a result exists — same gate as everything else pre-search here.
 *
 *  2026-09-01 feedback (second round) — "que se pueda hacer click": this
 *  used to be a static, unclickable card. `onSelect` (wired below to
 *  EmbedComparator's own `exampleQuery` state) mirrors TodaysRoutesSection's
 *  own click-to-run behavior on the home page (design/AJUSTES §, "al hacer
 *  click debería mandarte a ese resultado") — but that one does a real page
 *  navigation to `/send/$corridor`, which would break out of an embedded
 *  iframe on a third-party site. This stays inside the widget's own React
 *  tree instead: clicking loads the example's real corridor into the
 *  search row and runs it immediately, same as picking it by hand. */
function WidgetExample({ onSelect }: { onSelect: (example: ExclusiveCorridor) => void }) {
  const { t } = useI18n();
  const { data: corridors } = useExclusiveCorridors();
  const example = corridors?.[0];
  if (!example) return null;
  const fromCountry = primaryCountryForCurrency(example.from);
  const toCountry = primaryCountryForCurrency(example.to);
  return (
    <button
      type="button"
      onClick={() => onSelect(example)}
      className="mt-2.5 w-full rounded-[14px] border border-border bg-card p-3 text-left transition hover:border-foreground/25 hover:shadow-[0_10px_24px_-18px_rgba(36,28,22,.4)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
          {fromCountry && <FlagIcon country={fromCountry} />}
          {example.from}
          <span className="text-muted-foreground">→</span>
          {toCountry && <FlagIcon country={toCountry} />}
          {example.to}
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: "#FDE9E4", color: "#C2410C" }}
        >
          <Sparkle className="h-2.5 w-2.5" />
          {t("widget.examples.exclusiveRate")}
        </div>
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {t("widget.examples.title")}
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
          {t("widget.examples.bestOf")
            .replace("{n}", String(example.providerCount))
            .replace("{amount}", example.amount.toLocaleString())
            .replace("{from}", example.from)}
        </span>
        <span className="font-heading text-[18px] font-extrabold tabular-nums text-foreground">
          {Math.round(example.bestReceived).toLocaleString()}{" "}
          <span className="text-[10px] font-semibold text-muted-foreground">{example.to}</span>
        </span>
      </div>
    </button>
  );
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
  const defaultQuery: ComparatorQuery = {
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

  // 2026-09-01 feedback (second round) — WidgetExample's card needs to be
  // clickable and actually run that corridor, not just decorate the empty
  // state. ComparatorSection only reads `initialQuery` once, via useState
  // initializers (see its own origin/from/to/segment state) — there's no
  // effect syncing it on prop change — so swapping the query object alone
  // wouldn't do anything after first mount. `remountKey` forces a real
  // remount, which is what actually picks up the new values and (via
  // `autoRun: true`) fires the comparison immediately, same as clicking
  // "Compare" by hand would.
  const [exampleQuery, setExampleQuery] = useState<ComparatorQuery | null>(null);
  const [remountKey, setRemountKey] = useState(0);
  const handleSelectExample = (example: ExclusiveCorridor) => {
    setExampleQuery({
      origin: primaryCountryForCurrency(example.from) ?? geoCountry,
      destination: primaryCountryForCurrency(example.to) ?? "",
      segment: "retail",
      from: example.from,
      to: example.to,
      amount: example.amount,
      autoRun: true,
    });
    setRemountKey((k) => k + 1);
  };

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
        <ComparatorSection
          key={remountKey}
          embedded
          initialQuery={exampleQuery ?? defaultQuery}
          onResult={setResult}
        />
        {!result && <WidgetExample onSelect={handleSelectExample} />}
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
