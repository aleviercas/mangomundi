import { useI18n } from "@/lib/i18n";

/** Horizontal hero: centered headline + subtitle, full width. The unified
 *  comparator box (ComparatorSection) sits directly below.
 *
 *  `compact` collapses this away once a comparison has a result — same
 *  headline/tagline/trust-bar content, just not shown, so the sticky
 *  search bar and the results below it don't have to fight the hero for
 *  the first screenful (the Kayak/Skyscanner "search collapses, results
 *  take the screen" pattern applied to this single page rather than a
 *  second results route). Height (not just opacity) is what animates —
 *  a `grid-rows` 0fr/1fr transition, so the space actually closes instead
 *  of leaving a blank gap. */
export function HeroSection({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <section
      className={`relative grid overflow-hidden transition-[grid-template-rows,padding] duration-300 ease-out ${
        compact ? "grid-rows-[0fr] py-0" : "grid-rows-[1fr] pt-8 pb-8 sm:pt-14 sm:pb-10"
      }`}
      aria-hidden={compact}
    >
      <div className="overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-5 text-center sm:px-8">
          {/* design/AJUSTES-1.md §B — literal 44px/800/-0.035em h1, no
              gradient accent (the mockup's h2 is plain text). Smaller on
              mobile since the doc only specifies one reference size. */}
          <h1 className="font-heading text-[28px] font-extrabold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[44px]">
            {t("home.hero.headline")}
          </h1>
          <p
            className="mx-auto mt-3 max-w-5xl text-[15px] leading-relaxed sm:text-[17px]"
            style={{ color: "#6B5F55" }}
          >
            {t("home.hero.tagline")}
          </p>
          {/* Trust bar — same 3 numbers as the stat tiles inside the dark
              "about" band further down the page (value strings +
              home.stats.* labels, no new copy), just surfaced here too: a
              Skyscanner/Kayak-style search page shows a credibility signal
              right next to the search box, not several scrolls away. Plain
              text, no icons, so the two read as the same voice. */}
          <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground sm:mt-6">
            {[
              { value: "150+", label: t("home.stats.countries") },
              { value: "100+", label: t("home.stats.currencies") },
              { value: "50+", label: t("home.stats.providers") },
            ].map((s, i, arr) => (
              <span key={s.label} className="inline-flex items-center gap-2">
                <span>
                  <span className="font-bold text-foreground">{s.value}</span> {s.label}
                </span>
                {i < arr.length - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
