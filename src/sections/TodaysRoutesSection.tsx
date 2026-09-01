import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useExclusiveCorridors } from "@/hooks/use-exclusive-corridors";
import { primaryCountryForCurrency } from "@/lib/countries";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * "Today's routes, already priced" (design/AJUSTES-1.md §E) — the one
 * genuinely new section in this round of adjustments. Shown below the
 * comparator only while no search has run yet (same `hasResult` gate
 * HeroSection's compact mode already uses in HomePageBody), so the home
 * page has indexable, priced content without anyone typing anything.
 *
 * Real data only: useExclusiveCorridors reuses compareProviders itself
 * (see fx.functions.ts's getExclusiveCorridors) over a short candidate
 * list of currency pairs, keeping only the ones where a real
 * has_exclusive_deal provider is genuinely the best price today. If none
 * currently qualify, the section renders nothing rather than a hardcoded
 * fallback — there's no honest generic version of "here's an exclusive
 * rate" when there isn't one.
 */
export function TodaysRoutesSection() {
  const { t } = useI18n();
  const { data: corridors } = useExclusiveCorridors();

  // "Rotating on every visit" (§E) — a random starting offset into the
  // real qualifying list, re-rolled whenever the query data changes (i.e.
  // once per page load). Never repeats a corridor to pad out the count;
  // shows however many genuinely qualify, up to 4. Was raised to 6
  // (2026-08-30 feedback, third round: "tienen que aparecer varias más
  // para poder cubrir todo el ancho de la página"); brought back down here
  // (2026-08-30 feedback, sixth round) to leave the header row room for the
  // AI agent trigger without it feeling squeezed against the title.
  const shown = useMemo(() => {
    if (!corridors || corridors.length === 0) return [];
    const offset = Math.floor(Math.random() * corridors.length);
    return Array.from({ length: Math.min(4, corridors.length) }, (_, i) => {
      const c = corridors[(i + offset) % corridors.length];
      return {
        ...c,
        fromCountry: primaryCountryForCurrency(c.from),
        toCountry: primaryCountryForCurrency(c.to),
      };
    });
  }, [corridors]);

  if (shown.length === 0) return null;

  return (
    <section className="border-t border-border py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              className="block rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20 hover:shadow-[0_10px_24px_-16px_rgba(36,28,22,.35)]"
            >
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
                {c.fromCountry && <FlagIcon country={c.fromCountry} />}
                {c.from}
                <span className="text-muted-foreground">→</span>
                {c.toCountry && <FlagIcon country={c.toCountry} />}
                {c.to}
              </div>
              <div
                className="mt-2.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: "#FDE9E4", color: "#C2410C" }}
              >
                <Sparkle className="h-2.5 w-2.5" />
                {t("todaysRoutes.exclusiveRate")}
              </div>
              <div className="mt-2 text-[10.5px] font-bold uppercase tracking-wide text-[#6B5F55]">
                {t("todaysRoutes.bestOf")
                  .replace("{n}", String(c.providerCount))
                  .replace("{amount}", c.amount.toLocaleString())
                  .replace("{from}", c.from)}
              </div>
              <div className="mt-0.5 whitespace-nowrap font-heading text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
                {Math.round(c.bestReceived).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-muted-foreground">{c.to}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
