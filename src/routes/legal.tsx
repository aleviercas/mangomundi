import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/legal")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => {
    // SSR the title/description in the geo-detected language so crawlers and
    // first paint get it right; I18nProvider's client-side effect keeps it
    // in sync afterwards if the user switches language without reloading.
    const { getInitialLang } = await import("@/lib/geo.functions");
    const lang = await getInitialLang().catch(() => "en" as const);
    return { lang };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/legal", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/legal");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
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
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
        {t("legal.pageTitle")}
      </h1>
      <p className="mt-4 text-base text-muted-foreground">{t("legal.pageSubtitle")}</p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="surface-card scroll-mt-24 p-8 sm:p-12">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {s.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{s.intro}</p>
            <div className="mt-8 space-y-6">
              {s.body.map((b) => (
                <div key={b.h}>
                  <h3 className="text-eyebrow font-bold uppercase text-brand-cta">{b.h}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{b.p}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
