import { useI18n } from "@/lib/i18n";

export function AboutManifestoSection() {
  const { t } = useI18n();
  const pillars = [
    { label: t("home.about.mission.label"), body: t("home.about.mission.body") },
    { label: t("home.about.vision.label"), body: t("home.about.vision.body") },
    { label: t("home.about.problem.label"), body: t("home.about.problem.body") },
  ];
  return (
    <section id="about" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_50px_-22px_rgba(15,23,42,0.14)] sm:p-14">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">{t("home.about.eyebrow")}</p>
            <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {t("home.about.title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              {t("home.about.subtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.label} className="rounded-[1.5rem] bg-slate-50 p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{p.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
