import { useState } from "react";
import { ArrowRight, Sparkle } from "lucide-react";
import { ComparatorSection, type ComparatorQuery } from "@/sections/ComparatorSection";
import type { ComparisonResult } from "@/lib/fx.functions";
import type { ExclusiveCorridor } from "@/lib/fx.functions";
import { Wordmark } from "@/components/Wordmark";
import { defaultCounterCurrency, primaryCountryForCurrency } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";
import {
  useWidgetExclusiveCorridors,
  useWidgetBusinessTodaysRoutes,
} from "@/hooks/use-exclusive-corridors";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { SITE_URL } from "@/config/site";

/** 2026-09-01 feedback (first round) — "antes de seleccionar pueden aparecer
 *  ejemplos de todays rates para que no aparezca vacío": the compressed
 *  2-line form (see ComparatorSection's own `embedded` branch comment)
 *  frees real vertical room in the fixed 360×540 frame — this fills it
 *  with real examples instead of leaving that space blank pre-search.
 *  Reuses the exact same data TodaysRoutesSection shows on the home page
 *  (getExclusiveCorridors — real has_exclusive_deal winners, never
 *  invented), labeled "Example rates" rather than reusing todaysRoutes
 *  .title's copy, so it never reads as this widget's own live result
 *  before a real search has run. Hidden once a result exists — same gate
 *  as everything else pre-search here.
 *
 *  2026-09-01 feedback (second round) — "que se pueda hacer click": each
 *  row is clickable. `onSelect` (wired below to EmbedComparator's own
 *  `exampleQuery` state) mirrors TodaysRoutesSection's own click-to-run
 *  behavior on the home page (design/AJUSTES §, "al hacer click debería
 *  mandarte a ese resultado") — but that one does a real page navigation
 *  to `/send/$corridor`, which would break out of an embedded iframe on a
 *  third-party site. This stays inside the widget's own React tree
 *  instead: clicking loads the example's real corridor into the search
 *  row and runs it immediately, same as picking it by hand.
 *
 *  2026-09-02 feedback — "queda mucho espacio en blanco... tienen que
 *  aparecer varias monedas como ejemplos no solo una": was `corridors[0]`
 *  only, a single card. Now shows up to 3 real corridors (still real
 *  getExclusiveCorridors data, never invented) as compact rows in one
 *  bordered list instead of one large card, using the same vertical
 *  budget more efficiently.
 *
 *  2026-09-02 feedback (second round) — "el widget ahora quedo mejor pero
 *  quedo espacio en blanco": 5 rows (at this list's own row height) still
 *  left real gap under the fixed 540px frame's search form + examples —
 *  raised the cap toward getExclusiveCorridors' actual candidate pool
 *  (11 corridors, see fx.functions.ts's own EXCLUSIVE_CORRIDOR_CANDIDATES)
 *  instead of inventing filler content; the outer frame's existing
 *  `overflow-hidden` still clips gracefully on any route where fewer
 *  corridors qualify.
 *
 *  2026-09-03 feedback — "sacar la palabra example rates, poner today's
 *  routes already priced como se pone en el home": explicit override of
 *  this block's own original "Example rates" reasoning above (never reuse
 *  todaysRoutes.title's copy here) — now reuses that exact copy, same as
 *  TodaysRoutesSection itself. The underlying data was already identical
 *  either way (real getExclusiveCorridors results); only the label changes. */
const MAX_WIDGET_EXAMPLES = 8;

function WidgetExamples({
  examples,
  onSelect,
}: {
  examples: ExclusiveCorridor[];
  onSelect: (example: ExclusiveCorridor) => void;
}) {
  const { t } = useI18n();
  if (!examples.length) return null;
  return (
    <div className="mt-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <Sparkle className="h-2.5 w-2.5 text-brand-cta" />
        {t("todaysRoutes.title")}
      </div>
      <div className="divide-y divide-border">
        {examples.map((example) => {
          const fromCountry = primaryCountryForCurrency(example.from);
          const toCountry = primaryCountryForCurrency(example.to);
          return (
            <button
              key={`${example.from}-${example.to}`}
              type="button"
              onClick={() => onSelect(example)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-muted/50"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                {fromCountry && <FlagIcon country={fromCountry} />}
                {example.from}
                <span className="text-muted-foreground">→</span>
                {toCountry && <FlagIcon country={toCountry} />}
                {example.to}
              </span>
              <span className="font-heading text-[13.5px] font-extrabold tabular-nums text-foreground">
                {Math.round(example.bestReceived).toLocaleString()}
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                  {example.to}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {/* 2026-09-04 feedback — "sacar esa frase en naranja de see more
          routes en mangomundi y volver a dejar los resultados de todays
          routes": the routes list above is the point of this block; this
          second, separate invite (added 2026-09-03) turned out to be
          redundant next to it, not additive — dropped. The required
          attribution link at the very bottom of the widget (EmbedComparator
          's own "powered by mangomundi") already covers "how do I get to
          the real site" without a second, competing CTA here. */}
    </div>
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
}: {
  initialCurrency?: string;
  initialAmount?: number;
  /** Visitor's geo-detected country/currency (see geo.functions.ts). Callers
   *  that don't have it (e.g. a static preview) can omit it — the GB/GBP
   *  fallback below matches getVisitorGeo()'s own fallback. */
  geoCountry?: string;
  geoCurrency?: string;
}) {
  // Presets from the embed's data-*/query params, falling back to the
  // visitor's real geo instead of a hardcoded "US"/"USD" — destination
  // currency is picked so it never starts equal to the origin one (that
  // used to trigger the same-currency warning immediately on load).
  const from = initialCurrency ?? geoCurrency;

  const { t } = useI18n();
  const [result, setResult] = useState<ComparisonResult | null>(null);
  // 2026-09-04 feedback — "evaluar si conviene hacer un widget para
  // business, o en el mismo widget agregar la función business con un
  // botoncito al lado de compare rates": a toggle in this one widget,
  // decided over a separate business embed — reuses all of AD5-AD7's work
  // (fixed-size fields, sort pills, pinned "see more" bar) instead of a
  // second script/route to maintain, and whoever embeds this picks the
  // segment without installing two different widgets.
  const [segment, setSegment] = useState<ComparatorQuery["segment"]>("retail");
  const defaultQuery: ComparatorQuery = {
    origin: geoCountry,
    destination: "",
    segment,
    from,
    to: defaultCounterCurrency(from),
    amount: initialAmount ?? 1000,
    autoRun: false,
  };
  const { data: exampleCorridors } = useWidgetExclusiveCorridors();
  const { data: businessCorridors } = useWidgetBusinessTodaysRoutes();
  const examples =
    (segment === "business" ? businessCorridors : exampleCorridors)?.slice(
      0,
      MAX_WIDGET_EXAMPLES,
    ) ?? [];

  // 2026-09-01 feedback (second round) — WidgetExamples' rows need to be
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
      segment,
      from: example.from,
      to: example.to,
      amount: example.amount,
      autoRun: true,
    });
    setRemountKey((k) => k + 1);
  };
  // Same remount trick as handleSelectExample — carries over whatever the
  // visitor already typed (amount/currencies) instead of resetting the
  // form, same as the full comparator's own segment toggle carrying state
  // across its route change (see ComparatorSection's handleSegmentChange).
  const handleToggleSegment = (next: ComparatorQuery["segment"]) => {
    if (next === segment) return;
    setSegment(next);
    setResult(null);
    setExampleQuery({ ...(exampleQuery ?? defaultQuery), segment: next, autoRun: false });
    setRemountKey((k) => k + 1);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fcfcfc]">
      {/* design/Mangomundi 4 - Final.dc.html (line 726-729) — the widget's
          own header bar, distinct from ComparatorSection's chrome (which
          `embedded` strips entirely).
          2026-09-03 feedback — "sacale el logo de arriba porque ya aparece
          abajo": was the full Wordmark here, redundant with the "powered by
          mangomundi" attribution already at the bottom of this same widget
          — replaced with a short action-oriented title instead ("tiene que
          tener algún título que invite a comparar").
          2026-09-04 feedback — "la frase rates just now ponela en your
          results": the freshness stamp used to live here, on the right of
          this bar. Moved into CompactResultsList's own "Your results"
          header row instead (see its comment) — it's about the results
          below, not the search form, so it reads better attached to them. */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <span className="font-heading text-[13.5px] font-extrabold text-foreground">
          {t("widget.header.title")}
        </span>
        {/* 2026-09-04 feedback — "evaluar widget business... con un
            botoncito al lado de compare rates": same tablist markup/
            copy as the full comparator's own Individual/Business toggle
            (comparator.segment.*), just without the route-navigation part
            of handleSegmentChange — this widget has no routes of its own,
            so toggling only ever needs to remount with the new segment
            (see handleToggleSegment above). */}
        <div
          role="tablist"
          aria-label={t("search.segment")}
          className="flex h-5 shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5"
        >
          {(["retail", "business"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={segment === s}
              onClick={() => handleToggleSegment(s)}
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize leading-none transition ${
                segment === s
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`comparator.segment.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 2026-08-31 feedback — "el widget sacarle el scroll, dijimos que iba
          sin scroll" (design/Mangomundi 4 - Final.dc.html line 728 labels
          the widget mockup itself "Widget · sin scroll"): the search row +
          examples/results below are still sized to fit the fixed 360×540
          frame without scrolling in the common case (smaller type
          throughout, see their own comments).
          2026-09-04 feedback — "mostrar mas rutas/opciones para que no
          quede espacio en blanco": both the pre-search examples list
          (useWidgetExclusiveCorridors, up to 8) and the post-search
          results list (CompactResultsList's own `rest`, no longer capped)
          can now genuinely have more real content than the old hard caps
          allowed — `overflow-y-auto` (was `overflow-hidden`) is the safety
          net for whenever that content is taller than 540px leaves room
          for, instead of silently clipping it. The "see more"/attribution
          bars below are OUTSIDE this scrolling area (their own shrink-0
          siblings), so they stay pinned at the bottom of the frame either
          way — never scrolled out of view.
          2026-09-03 feedback — "aprovechar todo el ancho, remover los
          margenes que separan los costados de ambos lados": this wrapper's
          own px-3 sm:px-4 (12-16px each side) sat on top of the search
          card's own border, so the card and the examples list both floated
          with a visible gutter to the frame's edges instead of using the
          widget's full width — real, measured empty bands on a 500px-wide
          screenshot of /embed, not a guess. Only the header/attribution/
          see-more bars (plain text or full-bleed, no card) still carry
          their own small horizontal padding; this content area (which
          holds the bordered card) no longer does. */}
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <ComparatorSection
          key={remountKey}
          embedded
          initialQuery={exampleQuery ?? defaultQuery}
          onResult={setResult}
        />
        {!result && <WidgetExamples examples={examples} onSelect={handleSelectExample} />}
      </div>

      {/* 2026-09-04 feedback — "el boton de see more on mangomundi tiene
          que quedar abajo en el widget, y también ponerlo antes de
          comparar abajo": used to live only inside CompactResultsList
          (post-search only, and it scrolled away with the results list).
          One persistent bar instead, shown in both the pre-search examples
          state and the post-search results state, pinned above the
          required attribution bar at the very bottom of the frame — never
          part of the scrolling content above. */}
      <a
        href={SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1 border-t border-border bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
      >
        {t("comparator.widget.seeMore")}
        <ArrowRight className="h-3.5 w-3.5" />
      </a>

      {/* Attribution — required on the free embed; links back to the site. */}
      <a
        href="https://mangomundi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-card py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {/* 2026-09-02 feedback — "poner powered by mangomundi con el
            icono y el logo en colores, ahora esta en blanco y negro": two
            changes from before — `icon` (now default true) brings back
            the small bicolor "m" mark, and dropping `compact` stops
            flattening "mundi" to a single ink colour. `compact` was a
            deliberate call for this 12px lockup ("genuinely too small for
            the two-tone split to read cleanly", see Wordmark's own doc
            comment) but the feedback says otherwise. */}
        {t("embed.poweredBy")} <Wordmark className="text-xs" />
      </a>
    </div>
  );
}
