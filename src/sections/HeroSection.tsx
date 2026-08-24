import { useI18n } from "@/lib/i18n";

/** Horizontal hero: centered headline + subtitle, full width. The unified
 *  comparator box (ComparatorSection) sits directly below. */
export function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden pt-8 pb-8 sm:pt-14 sm:pb-10">
      <div className="relative mx-auto w-full max-w-7xl px-5 text-center sm:px-8">
        <h1 className="font-heading text-[26px] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t("home.hero.titlePre")}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, var(--accent) 0%, #ff4d3d 100%)" }}
          >
            {t("home.hero.titleAccent")}
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-5xl text-base leading-relaxed text-muted-foreground sm:mt-5">
          {t("home.hero.tagline")}
        </p>
        {/* Trust bar — same 3 numbers as StatsSection's card further down
            the page (value strings + home.stats.* labels, no new copy),
            just surfaced here too: a Skyscanner/Kayak-style search page
            shows a credibility signal right next to the search box, not
            several scrolls away. Plain text like StatsSection itself (no
            icons there either), so the two read as the same voice. */}
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
    </section>
  );
}
