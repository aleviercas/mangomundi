import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";

export const Route = createFileRoute("/legal")({
  head: ({ matches }) => {
    const root = matches.find((m) => m.routeId === "__root__");
    const explicitLang = (root?.loaderData as { explicitLang?: string | null } | undefined)
      ?.explicitLang;
    const canonical = selfCanonical("/legal", explicitLang);
    return {
      meta: [
        { title: "Legal & Risk Disclosures — Mangomundi" },
        {
          name: "description",
          content:
            "Mangomundi Terms of Service, Risk Disclosures and Privacy Policy — how the neutral FX decision engine handles data, liability and user obligations.",
        },
        { property: "og:title", content: "Legal & Risk Disclosures — Mangomundi" },
        {
          property: "og:description",
          content:
            "Read Mangomundi's Terms of Service, Risk Disclosures and Privacy Policy.",
        },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/legal")],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { t } = useI18n();
  const sections = [
    {
      id: "terms",
      title: t("legal.terms.title"),
      intro: t("legal.terms.intro"),
      body: [
        { h: t("legal.terms.h1"), p: t("legal.terms.p1") },
        { h: t("legal.terms.h2"), p: t("legal.terms.p2") },
        { h: t("legal.terms.h3"), p: t("legal.terms.p3") },
        { h: t("legal.terms.h4"), p: t("legal.terms.p4") },
        { h: t("legal.terms.h5"), p: t("legal.terms.p5") },
      ],
    },
    {
      id: "risk",
      title: t("legal.risk.title"),
      intro: t("legal.risk.intro"),
      body: [
        { h: t("legal.risk.h1"), p: t("legal.risk.p1") },
        { h: t("legal.risk.h2"), p: t("legal.risk.p2") },
        { h: t("legal.risk.h3"), p: t("legal.risk.p3") },
        { h: t("legal.risk.h4"), p: t("legal.risk.p4") },
      ],
    },
    {
      id: "privacy",
      title: t("legal.privacy.title"),
      intro: t("legal.privacy.intro"),
      body: [
        { h: t("legal.privacy.h1"), p: t("legal.privacy.p1") },
        { h: t("legal.privacy.h2"), p: t("legal.privacy.p2") },
        { h: t("legal.privacy.h3"), p: t("legal.privacy.p3") },
        { h: t("legal.privacy.h4"), p: t("legal.privacy.p4") },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 pt-28 pb-20 sm:px-8">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        {t("legal.pageTitle")}
      </h1>
      <p className="mt-4 text-base text-slate-500">{t("legal.pageSubtitle")}</p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-black hover:text-white"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 rounded-[2rem] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-20px_rgba(15,23,42,0.12)] sm:p-12"
          >
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {s.title}
            </h2>
            <p className="mt-3 text-sm text-slate-500">{s.intro}</p>
            <div className="mt-8 space-y-6">
              {s.body.map((b) => (
                <div key={b.h}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff6b5b]">
                    {b.h}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{b.p}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
