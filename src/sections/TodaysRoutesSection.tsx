import { useMemo } from "react";
import { Sparkle, Star } from "lucide-react";
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
  // shows however many genuinely qualify, up to 6 — raised from 4
  // (2026-08-30 feedback, third round: "tienen que aparecer varias más
  // para poder cubrir todo el ancho de la página") now that
  // EXCLUSIVE_CORRIDOR_CANDIDATES (fx.functions.ts) has enough verified
  // real winners to actually fill a 6-wide row on desktop.
  const shown = useMemo(() => {
    if (!corridors || corridors.length === 0) return [];
    const offset = Math.floor(Math.random() * corridors.length);
    return Array.from({ length: Math.min(6, corridors.length) }, (_, i) => {
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-[22px]">
              {t("todaysRoutes.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {t("todaysRoutes.subtitle")}
            </p>
          </div>
          {/* 2026-08-30 feedback — was a hardcoded "4.6", never a real
              Trustpilot number (see TrustpilotCard's own comment). Real
              link to the public page instead, no invented figure. */}
          <a
            href="https://www.trustpilot.com/review/mangomundi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold hover:underline"
            style={{ backgroundColor: "#E4F3EC", color: "#1F7A5A" }}
          >
            <Star className="h-3 w-3 fill-current" />
            {t("comparator.trustpilot.checkRating")}
          </a>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {shown.map((c) => (
            <div key={`${c.from}-${c.to}`} className="rounded-2xl border border-border bg-card p-4">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
