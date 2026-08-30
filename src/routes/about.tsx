import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { ContactSection } from "@/sections/ContactSection";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

/** design/AJUSTES-3.md §B + design/AJUSTES-4.md §1 — /about promoted from a
 *  redirect-to-home-anchor stub into a real page: the mission/vision/problem
 *  the home's dark band only summarizes, plus a real contact point.
 *  Deliberately NOT the market-coverage stats (150+ Countries etc.) —
 *  AJUSTES-4 §2 confirms those stay in the dark band only, "una página de
 *  misión que abre con números se lee como un pitch de inversores".
 *
 *  2026-08-30 feedback: this is now the *only* trust page — /how-we-make-
 *  money is gone (no real copy backed it) and its link along with it. Also
 *  restores "the problem" (home.about.problem), the third of the original
 *  three-part mission/vision/problem copy that sat unused in i18n.tsx even
 *  before /about existed as a page. Every paragraph reuses that existing
 *  copy — no new claims, just a page for it. */
export const Route = createFileRoute("/about")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => {
    const { getInitialLang } = await import("@/lib/geo.functions");
    const lang = await getInitialLang().catch(() => "en" as const);
    return { lang };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/about", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/about");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/about")],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <main>
      <section className="mx-auto max-w-3xl px-5 pt-28 pb-16 sm:px-8">
        <p className="text-eyebrow font-bold uppercase text-accent">{t("home.about.eyebrow")}</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
          {t("home.about.title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("home.about.subtitle")}
        </p>

        <div className="mt-12 space-y-10">
          <div>
            <h2 className="text-eyebrow font-bold uppercase text-brand-cta">
              {t("home.about.mission.label")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {t("home.about.mission.body")}
            </p>
          </div>
          <div>
            <h2 className="text-eyebrow font-bold uppercase text-brand-cta">
              {t("home.about.vision.label")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {t("home.about.vision.body")}
            </p>
          </div>
          <div>
            <h2 className="text-eyebrow font-bold uppercase text-brand-cta">
              {t("home.about.problem.label")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {t("home.about.problem.body")}
            </p>
          </div>
        </div>
      </section>
      <ContactSection />
    </main>
  );
}
