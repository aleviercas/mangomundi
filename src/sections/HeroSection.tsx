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
      // 2026-09-01 feedback — "el primer fondo del comparador es igual que
      // el de todays routes... deberían alternarse los colores": this
      // section had no background of its own, so it (and the comparator
      // card right below it) inherited the page's cream `--background`
      // token — the exact same shade Today's Routes also shows through
      // with (that section has no background either, by design). The
      // mockup's hero+comparator band is explicit white (design/Mangomundi
      // 4 - Final.dc.html line 68), one step lighter than the page cream —
      // giving it back here, plus on ComparatorSection's own wrapper (see
      // its own comment), creates the white → cream → white → dark rhythm
      // the mockup actually has instead of two adjacent bands reading as
      // one.
      className={`relative grid overflow-hidden bg-card transition-[grid-template-rows,padding] duration-300 ease-out ${
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
        </div>
      </div>
    </section>
  );
}
