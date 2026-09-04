import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useExclusiveCorridors } from "@/hooks/use-exclusive-corridors";
import { useBusinessTodaysRoutes } from "@/hooks/use-business-todays-routes";
import { primaryCountryForCurrency } from "@/lib/countries";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { BrandLogo } from "@/components/BrandLogo";
import type { ExclusiveCorridor } from "@/lib/fx.functions";

type DisplayCorridor = ExclusiveCorridor & {
  fromCountry: string | undefined;
  toCountry: string | undefined;
};

// The "rotating on every visit" (§E) selection itself now happens server-side
// (see computeExclusiveCorridors in fx.functions.ts) — corridors here already
// arrives pre-rotated and sliced to at most 4. Doing the Math.random() pick
// here on the client used to cause a real hydration mismatch: SSR and the
// client hydration pass each rolled a different offset for the same render,
// so React discarded and rebuilt the whole section on load. This hook now
// only adds the (deterministic, SSR-safe) country lookup for the flag icons.
function useDisplayCorridors(corridors: ExclusiveCorridor[] | undefined): DisplayCorridor[] {
  return useMemo(() => {
    if (!corridors) return [];
    return corridors.map((c) => ({
      ...c,
      fromCountry: primaryCountryForCurrency(c.from),
      toCountry: primaryCountryForCurrency(c.to),
    }));
  }, [corridors]);
}

// Card content shared by the retail and business variants — each wraps this
// in its own <Link> (different destination: a corridor page for retail, the
// /business search itself for business), so only the inner markup is common.
function RouteCardBody({ c }: { c: DisplayCorridor }) {
  const { t } = useI18n();
  return (
    <>
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
        {c.fromCountry && <FlagIcon country={c.fromCountry} />}
        {c.from}
        <span className="text-muted-foreground">→</span>
        {c.toCountry && <FlagIcon country={c.toCountry} />}
        {c.to}
      </div>
      <div
        className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: "#FDE9E4", color: "#C2410C" }}
      >
        <Sparkle className="h-2.5 w-2.5" />
        {t("todaysRoutes.exclusiveRate")}
      </div>
      <div className="mt-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#6B5F55]">
        {t("todaysRoutes.bestOf")
          .replace("{n}", String(c.providerCount))
          .replace("{amount}", c.amount.toLocaleString())
          .replace("{from}", c.from)}
      </div>
      <div className="mt-0.5 whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
        {Math.round(c.bestReceived).toLocaleString()}{" "}
        <span className="text-xs font-semibold text-muted-foreground">{c.to}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <BrandLogo
          name={c.winnerName}
          url={null}
          slug={c.winnerSlug}
          size={18}
          rounded={false}
          className="shrink-0 rounded-sm"
        />
        <span
          className="whitespace-nowrap text-[11.5px] font-bold tabular-nums"
          style={{ color: "#1F7A5A" }}
        >
          {t("todaysRoutes.gain").replace("{amount}", Math.round(c.gain).toLocaleString())}
        </span>
      </div>
    </>
  );
}

const cardClassName =
  "block rounded-2xl border border-border bg-card p-3.5 transition hover:border-foreground/20 hover:shadow-[0_10px_24px_-16px_rgba(36,28,22,.35)]";

/**
 * "Today's routes, already priced" (design/AJUSTES-1.md §E) — the one
 * genuinely new section in this round of adjustments. Shown below the
 * comparator only while no search has run yet (same `hasResult` gate
 * HomePageBody uses), so the home page has indexable, priced content
 * without anyone typing anything.
 *
 * Real data only: useExclusiveCorridors reuses compareProviders itself
 * (see fx.functions.ts's getExclusiveCorridors) over a short candidate
 * list of currency pairs, keeping only the ones where a real
 * has_exclusive_deal provider is genuinely the best price today. If none
 * currently qualify, the section renders nothing rather than a hardcoded
 * fallback — there's no honest generic version of "here's an exclusive
 * rate" when there isn't one.
 */
export function TodaysRoutesSection({
  initialData,
}: {
  /** See useExclusiveCorridors' own comment — pass the route loader's
   *  already-fetched array through here so SSR and the client's first
   *  render see the exact same data (no queryClient dehydration exists in
   *  this app, so anything else here diverges from the server on hydration). */
  initialData?: ExclusiveCorridor[];
} = {}) {
  const { t } = useI18n();
  const { data: corridors } = useExclusiveCorridors(initialData);
  const shown = useDisplayCorridors(corridors);

  if (shown.length === 0) return null;

  return (
    // 2026-09-03 feedback — "achicar un poco la banda... para que no quede
    // tan alta, pero que siga teniendo aire": py-7/py-9 (28px/36px) trimmed
    // to py-6/py-7 (24px/28px) — real but modest, not stripping the section
    // down to nothing.
    <section className="border-t border-border py-6 sm:py-7">
      {/* 2026-09-04 feedback (ronda 6, cont.) — ver AboutManifestoSection:
          tope de ancho subido a 1340px, medido en vivo contra kayak.com. */}
      <div className="mx-auto max-w-[1340px] px-5 sm:px-8">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-[22px]">
            {t("todaysRoutes.title")}
          </h2>
          {/* 2026-08-31 feedback — was wrapping onto 2 lines for no reason:
              max-w-2xl (672px) is narrower than the full sentence needs at
              this size, now that this header row no longer shares space
              with the agent trigger portal (removed this round). */}
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted-foreground lg:whitespace-nowrap">
            {t("todaysRoutes.subtitle")}
          </p>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 2026-09-01 feedback — "al hacer click debería mandarte a ese
              resultado del comparador": these cards were plain <div>s with
              no navigation at all. /send/$corridor already exists exactly
              for this (a currency-currency or country-country slug that
              auto-runs compareProviders on load, see its own route
              comment) — every candidate corridor here comes from the same
              1,000-unit amount that route defaults to, so no new query
              params are needed, just the right slug. */}
          {shown.map((c) => (
            <Link
              key={`${c.from}-${c.to}`}
              to="/send/$corridor"
              params={{ corridor: `${c.from.toLowerCase()}-${c.to.toLowerCase()}` }}
              className={cardClassName}
            >
              <RouteCardBody c={c} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 2026-09-03 feedback — "podemos tambien en el business dejar el todays
 * routes already priced pero para business providers?": business-segment
 * sibling of TodaysRoutesSection above — same real mechanism
 * (useBusinessTodaysRoutes reuses compareProviders with segment:"business"
 * at a real business-scale amount, see fx.functions.ts's
 * getBusinessTodaysRoutes), same card, same title/subtitle copy (still an
 * honest description of what's shown).
 *
 * 2026-09-04 feedback — the "Need a larger volume or a recurring transfer?
 * Ask for a special quote" line added the same round (2026-09-03) is
 * dropped again: BusinessExtrasSection right below this section (see its
 * own comment) already carries that same invitation — a dedicated
 * "Institutional & Partnership Inquiries" panel with its own business-desk
 * email CTA — so this line was a second, weaker copy of something the page
 * already says properly one band down.
 *
 * Rendered by HomePageBody only when `businessExtras` is set (i.e. on
 * /business) and gated on the same !hasResult condition as every other
 * marketing section there.
 */
export function BusinessTodaysRoutesSection({
  initialData,
}: {
  /** See TodaysRoutesSection's own `initialData` comment above. */
  initialData?: ExclusiveCorridor[];
} = {}) {
  const { t } = useI18n();
  const { data: corridors } = useBusinessTodaysRoutes(initialData);
  const shown = useDisplayCorridors(corridors);

  if (shown.length === 0) return null;

  return (
    <section className="border-t border-border py-6 sm:py-7">
      {/* 2026-09-04 feedback (ronda 6, cont.) — ver AboutManifestoSection:
          tope de ancho subido a 1340px, medido en vivo contra kayak.com. */}
      <div className="mx-auto max-w-[1340px] px-5 sm:px-8">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-[22px]">
            {t("todaysRoutes.title")}
          </h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted-foreground lg:whitespace-nowrap">
            {t("todaysRoutes.subtitle")}
          </p>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((c) => (
            <Link
              key={`${c.from}-${c.to}`}
              to="/business"
              search={{
                from: c.from,
                to: c.to,
                origin: c.fromCountry ?? undefined,
                destination: c.toCountry ?? undefined,
                amount: c.amount,
                autoRun: true,
              }}
              className={cardClassName}
            >
              <RouteCardBody c={c} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
