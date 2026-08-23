import { useI18n } from "@/lib/i18n";

export function StatsSection() {
  const { t } = useI18n();
  const stats = [
    { value: "2026", label: t("home.stats.founded") },
    { value: "150+", label: t("home.stats.countries") },
    { value: "100+", label: t("home.stats.currencies") },
    { value: "50+", label: t("home.stats.providers") },
  ];
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Deliberately dark (bg-slate-900/text-white/text-slate-300/400),
            NOT part of the light-mode token migration applied to the rest
            of this section's siblings — this card is an intentional dark
            contrast block on an otherwise light page, and the theme has no
            purpose-built "dark elevated surface" token to swap it for
            (--surface/--surface-elevated both alias to LIGHT tokens —
            card/muted — so using them here would be backwards). Only the
            accent color below got tokenized, since that one's unrelated to
            the light/dark surface question. */}
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-12">
          <div>
            <p className="text-eyebrow font-bold uppercase text-accent">
              {t("home.stats.eyebrow")}
            </p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-h2">
              {t("home.stats.title")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
              {t("home.stats.subtitle")}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs font-medium leading-snug text-slate-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
