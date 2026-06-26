import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Sparkles, ArrowRight, Construction } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";
import { SITE_URL } from "@/config/site";

export const Route = createFileRoute("/insurance")({
  head: () => {
    const seo = getRouteSeo("en", "/insurance");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: `${SITE_URL}/insurance` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/insurance` }],
    };
  },
  component: InsurancePage,
});

function InsurancePage() {
  const { t } = useI18n();

  const cards = [
    { icon: Shield, title: t("ins.c1.t"), body: t("ins.c1.b") },
    { icon: Sparkles, title: t("ins.c2.t"), body: t("ins.c2.b") },
    { icon: ArrowRight, title: t("ins.c3.t"), body: t("ins.c3.b") },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Construction className="h-3 w-3" /> {t("ins.badge")}
        </div>

        <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("ins.title.a")} <span className="text-primary">{t("ins.title.b")}</span>.
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("ins.subtitle")}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-heading font-bold text-foreground">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-foreground">{t("ins.why.t")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ins.why.b1")}{" "}
            <Link to="/platform" className="text-primary underline-offset-4 hover:underline">
              {t("ins.why.link")}
            </Link>{" "}
            {t("ins.why.b2")}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            data-coming-soon="insurance-launch-partner"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t("ins.cta1")} <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
          >
            {t("ins.cta2")}
          </Link>
        </div>
      </div>
    </div>
  );
}
