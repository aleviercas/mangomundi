import { CircleCheck, Eye, ShieldCheck } from "lucide-react";
import { HomeSearch, type HomeSearchSubmit } from "@/components/HomeSearch";
import { useI18n } from "@/lib/i18n";

export function HeroSection({
  onSubmit,
  onToggleAdvanced,
}: {
  onSubmit: (q: HomeSearchSubmit) => void;
  onToggleAdvanced: () => void;
}) {
  const { t } = useI18n();
  const badges = [
    { label: t("home.feat.liveRates"), icon: CircleCheck },
    { label: t("home.feat.zeroFees"), icon: Eye },
    { label: t("home.feat.noSignup"), icon: ShieldCheck },
  ];
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
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:mt-6 lg:mx-0">
              {t("home.hero.subtitle")}
            </p>
            {/* Trust badges — moved up from below the search card. */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-start">
              {badges.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 sm:px-3.5 sm:py-1.5 sm:text-xs"
                >
                  <Icon className="h-3 w-3 shrink-0 text-[#ff6b5b] sm:h-3.5 sm:w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 lg:mt-0">
            <HomeSearch onSubmit={onSubmit} onToggleAdvanced={onToggleAdvanced} />
          </div>
        </div>
      </div>
    </section>
  );
}
