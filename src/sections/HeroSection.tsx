import { useI18n } from "@/lib/i18n";

/** Two-column hero on larger screens (headline + subtitle on the left, a
 *  supporting photo on the right — stacked on mobile, photo below the text).
 *  The unified comparator box (ComparatorSection) sits directly below. */
export function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden pt-8 pb-8 sm:pt-14 sm:pb-10">
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="text-center lg:text-left">
          <h1 className="font-heading text-[26px] font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t("home.hero.titlePre")}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #ff6b5b 0%, #ff4d3d 100%)" }}
            >
              {t("home.hero.titleAccent")}
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-5 lg:mx-0">
            {t("home.hero.tagline")}
          </p>
        </div>
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <img
            src="/images/hero-person-phone.jpg"
            alt=""
            width={1120}
            height={610}
            className="aspect-[16/9] w-full rounded-2xl object-cover shadow-[0_20px_60px_-25px_rgba(15,23,42,0.35)]"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
