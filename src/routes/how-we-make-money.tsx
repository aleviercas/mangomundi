import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { z } from "zod";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

/** design/AJUSTES-3.md §B — the page the dark band's "Read our method" and
 *  the rail's/footer's "How we make money" all point to now (previously
 *  all three fell back to /legal#risk, "the closest existing content" —
 *  see the comment that used to sit on TrustpilotCard). Answers the doc's
 *  4 questions in order, each reusing copy that already existed elsewhere
 *  in the app rather than writing new claims:
 *  1. legal.terms.s3 (Compensation Disclosure) — orphaned copy, unused by
 *     any route until now (superseded by legal.tsx's own .h1-h5 set).
 *  2. home.test.c1 (Algorithmic Impartiality) — copy already live in
 *     TestimonialsSection.tsx, which isn't mounted on any page currently;
 *     reusing its text here doesn't require mounting that section.
 *  3. comparator.row.affiliateLink + fx.disclaimer — the exact label and
 *     disclaimer already shown on every row today.
 *  4. comparator.row.stampLive/stampEstimated + comparator.badge.notVerified
 *     — the real mechanism (fx.functions.ts ComparisonRow.has_corridor_data
 *     + corridor_verified_status), not a simplified retelling. */
export const Route = createFileRoute("/how-we-make-money")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => {
    const { getInitialLang } = await import("@/lib/geo.functions");
    const lang = await getInitialLang().catch(() => "en" as const);
    return { lang };
  },
  head: ({ match, loaderData }) => {
    const canonical = selfCanonical("/how-we-make-money", match.search.lang);
    const seo = getRouteSeo(loaderData?.lang ?? "en", "/how-we-make-money");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/how-we-make-money")],
    };
  },
  component: HowWeMakeMoneyPage,
});

function HowWeMakeMoneyPage() {
  const { t } = useI18n();
  const sections = [
    {
      n: "01",
      title: t("howWeMakeMoney.s1.title"),
      body: t("legal.terms.s3.body"),
    },
    {
      n: "02",
      title: t("howWeMakeMoney.s2.title"),
      body: t("home.test.c1.desc"),
    },
  ] as const;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-8">
      <p className="text-eyebrow font-bold uppercase text-accent">{t("howWeMakeMoney.eyebrow")}</p>
      <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
        {t("comparator.disclaimer.howWeMakeMoney")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
        {t("howWeMakeMoney.subtitle")}
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((s) => (
          <section key={s.n} className="surface-card p-8 sm:p-10">
            <div className="text-eyebrow font-bold text-muted-foreground">{s.n}</div>
            <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-foreground">
              {s.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">{s.body}</p>
          </section>
        ))}

        <section className="surface-card p-8 sm:p-10">
          <div className="text-eyebrow font-bold text-muted-foreground">03</div>
          <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {t("howWeMakeMoney.s3.title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground">{t("fx.disclaimer")}</p>
          <p className="mt-4 text-sm text-muted-foreground">{t("howWeMakeMoney.s3.example")}</p>
          <span className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {t("comparator.row.affiliateLink")}
          </span>
        </section>

        <section className="surface-card p-8 sm:p-10">
          <div className="text-eyebrow font-bold text-muted-foreground">04</div>
          <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {t("howWeMakeMoney.s4.title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground">
            {t("comparator.badge.notVerified")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("howWeMakeMoney.s4.body")}
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#1F7A5A" }}
            >
              <Clock className="h-3 w-3" /> {t("comparator.row.stampLive")}
            </span>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#6B5F55" }}
            >
              <Clock className="h-3 w-3" /> {t("comparator.row.stampEstimated")}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("howWeMakeMoney.s4.example")}</p>
        </section>
      </div>
    </main>
  );
}
