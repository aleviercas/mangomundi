import { useI18n } from "@/lib/i18n";

/** Horizontal hero: centered headline + subtitle, full width. The unified
 *  comparator box (ComparatorSection) sits directly below. */
export function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden pt-8 pb-8 sm:pt-16 sm:pb-10">
      <div className="relative mx-auto w-full max-w-7xl px-5 text-center sm:px-8">
        <h1 className="font-heading text-[26px] font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {t("home.hero.titlePre")}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #ff6b5b 0%, #ff4d3d 100%)" }}
          >
            {t("home.hero.titleAccent")}
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-5xl text-base leading-relaxed text-slate-600 sm:mt-5">
          {t("home.hero.tagline")}
        </p>
      </div>
    </section>
  );
}
