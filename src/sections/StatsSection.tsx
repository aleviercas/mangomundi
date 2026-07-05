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
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.4)] sm:p-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">{t("home.stats.eyebrow")}</p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {t("home.stats.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {t("home.stats.subtitle")}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs font-medium leading-snug text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
