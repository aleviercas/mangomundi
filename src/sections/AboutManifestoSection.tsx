import { useI18n } from "@/lib/i18n";

/** Full-bleed dark band (design/HANDOFF.md §6): about-coins-globe.jpg behind
 *  the manifesto copy, with market-coverage numbers folded in on the right
 *  instead of living in their own StatsSection further down the page — one
 *  credibility beat instead of two near-identical light sections back to
 *  back. Copy (eyebrow/title/subtitle, stat values/labels) is unchanged from
 *  before the merge — same i18n keys, already translated into 20 languages —
 *  only the layout and colour scheme change. */
export function AboutManifestoSection() {
  const { t } = useI18n();
  const stats = [
    { value: "2026", label: t("home.stats.founded") },
    { value: "150+", label: t("home.stats.countries") },
    { value: "100+", label: t("home.stats.currencies") },
    { value: "50+", label: t("home.stats.providers") },
  ];
  return (
    <section id="about" className="scroll-mt-24 relative overflow-hidden bg-[#120E0B] py-14 sm:py-20">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/about-coins-globe.jpg)",
          backgroundPosition: "right center",
          backgroundSize: "cover",
          opacity: 0.55,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, #120E0B 12%, rgba(18,14,11,.82) 46%, rgba(18,14,11,.25) 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="max-w-2xl">
            <p className="text-eyebrow font-bold uppercase text-[#FF8A6B]">{t("home.about.eyebrow")}</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-h2">
              {t("home.about.title")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("home.about.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-medium leading-snug text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
