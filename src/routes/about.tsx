import { createFileRoute, Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { ContactSection } from "@/sections/ContactSection";
import { BrandMark } from "@/components/Wordmark";

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

      {/* 2026-09-01 feedback — "en lugar de misión/visión/problema con
          subtítulos, escribirlo como storytelling fluido, con negritas,
          como marcas modernas": tres bloques con eyebrow label arriba
          (Mission/Vision/Problem) reemplazados por tres párrafos conectados,
          sin etiqueta, `**bold**` vía ReactMarkdown (mismo tratamiento que
          comparator.rankingExplainer) para que las negritas floten
          correctamente en los 20 idiomas en vez de fijar la posición de la
          palabra en inglés. */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 sm:px-8">
        {/* 2026-09-02 feedback — "el about us quedó muy comprimido": the
            three ideas (mission/vision/problem) read as one dense block.
            `space-y-*` (margin-top on children) silently loses to `[&_p]:m-0`
            below — ReactMarkdown renders each block as a bare `<p>` with no
            wrapper, so that reset zeroes the exact margin space-y depends
            on (confirmed: 0px measured gap with space-y-9 in place). `gap-9`
            on a flex column doesn't touch margin at all, so it isn't caught
            by that reset. */}
        <div className="flex flex-col gap-9 text-base leading-relaxed text-foreground [&_p]:m-0 [&_strong]:font-bold [&_strong]:text-foreground">
          <ReactMarkdown>{t("home.about.mission.body")}</ReactMarkdown>
          <ReactMarkdown>{t("home.about.vision.body")}</ReactMarkdown>
          <ReactMarkdown>{t("home.about.problem.body")}</ReactMarkdown>
        </div>
      </section>

      {/* 2026-09-02 feedback — "mejorar aun mas la parte de about us": the page
          ended right after the mission/vision/problem paragraphs with nothing
          for the reader to actually do next, unlike every other content page
          on the site (a blog post ends with a "go to compare" card, see
          blog_.$slug.tsx). Reuses that exact card treatment and its already-
          translated blog.cta.* copy — same real destination (the comparator),
          not a new claim, so no new i18n keys/translations needed. */}
      <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("blog.cta.prompt")}</p>
          {/* 2026-09-03 feedback — "ponerle el icono como en el botón de go to
              compare del blog y mantener la paleta": blog_.$slug.tsx's own
              CTA carries the mangomundi "m" mark (BrandMark) next to its
              label; this one didn't. Added the mark with `tone="light"`
              (white ink), keeping this button's own btn-cta mango — verified
              legible in a screenshot at the time.
              2026-09-03 feedback (second round) — "ponelo igual que en el
              blog, en negro, si lo pones en naranja el logo no se ve":
              matches blog_.$slug.tsx's CTA exactly now, same classes
              (bg-primary, rounded-xl, py-2.5) — not just the same color. */}
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <BrandMark tone="light" />
            {t("blog.cta.button")}
          </Link>
        </div>
      </section>

      <ContactSection />
    </main>
  );
}
