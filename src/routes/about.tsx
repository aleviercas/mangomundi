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
      {/* 2026-09-01 feedback — "mejor estilo, agregar alguna imagen de
          fondo... más grande": this page was plain white/text with no
          imagery anywhere, unlike every other institutional section on the
          site. Reuses the same photo AboutManifestoSection's dark band
          already uses (not a new asset) — `center` instead of that band's
          `right center` and no side content competing for room, so more of
          the coin/globe art is visible here as a real hero rather than a
          cropped sliver. */}
      <section className="relative overflow-hidden bg-[#120E0B] px-5 pb-16 pt-28 sm:px-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/about-coins-globe.jpg)",
            backgroundPosition: "center",
            backgroundSize: "cover",
            opacity: 0.6,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(18,14,11,.35) 0%, rgba(18,14,11,.75) 65%, #120E0B 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-eyebrow font-bold uppercase text-[#FF8A6B]">
            {t("home.about.eyebrow")}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-h1">
            {t("home.about.title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
            {t("home.about.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 sm:px-8">
        <div className="space-y-10">
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
