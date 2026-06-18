import { HomeSearch } from "@/components/HomeSearch";
import { useI18n } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden pt-8 pb-10 sm:pt-24 sm:pb-28">
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-3xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem]">
              {t("home.hero.titlePre")}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #000000 0%, #ff6b5b 100%)" }}
              >
                {t("home.hero.titleAccent")}
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-snug text-slate-500 sm:mt-6 sm:text-lg sm:leading-relaxed lg:mx-0">
              {t("home.hero.subtitle")}
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <HomeSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
