import { HomeSearch } from "@/components/HomeSearch";
import { useI18n } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useI18n();
  const bullets = [t("home.hero.b1"), t("home.hero.b2"), t("home.hero.b3")];
  return (
    <section className="relative overflow-hidden pt-4 pb-6 sm:pt-20 sm:pb-24">
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-[26px] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem]">
              {t("home.hero.titlePre")}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #000000 0%, #ff6b5b 100%)" }}
              >
                {t("home.hero.titleAccent")}
              </span>
            </h1>
            <ul className="mx-auto mt-3 max-w-2xl space-y-2 text-left text-base leading-relaxed text-slate-600 sm:mt-6 lg:mx-0">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b5b]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 lg:mt-0">
            <HomeSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
