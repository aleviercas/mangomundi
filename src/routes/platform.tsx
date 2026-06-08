import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Layers, Network, Bot, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/platform")({
  head: () => {
    const seo = getRouteSeo("en", "/platform");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: "https://mangoglobal.lovable.app/platform" },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/platform" }],
    };
  },
  component: PlatformPage,
});

function PlatformPage() {
  const { t } = useI18n();

  const verticals = [
    { key: "v1", label: t("platform.vert.v1"), status: t("platform.status.live"), tone: "live", icon: "💱" },
    { key: "v2", label: t("platform.vert.v2"), status: t("platform.status.building"), tone: "building", icon: "📈" },
    { key: "v3", label: t("platform.vert.v3"), status: t("platform.status.planned"), tone: "planned", icon: "🛡️" },
    { key: "v4", label: t("platform.vert.v4"), status: t("platform.status.planned"), tone: "planned", icon: "🧰" },
    { key: "v5", label: t("platform.vert.v5"), status: t("platform.status.planned"), tone: "planned", icon: "☁️" },
    { key: "v6", label: t("platform.vert.v6"), status: t("platform.status.planned"), tone: "planned", icon: "🔌" },
    { key: "v7", label: t("platform.vert.v7"), status: t("platform.status.planned"), tone: "planned", icon: "🏦" },
    { key: "v8", label: t("platform.vert.v8"), status: t("platform.status.planned"), tone: "planned", icon: "🚢" },
  ];

  const layers = [
    { icon: Bot, title: t("platform.core.l1.t"), desc: t("platform.core.l1.d") },
    { icon: Network, title: t("platform.core.l2.t"), desc: t("platform.core.l2.d") },
    { icon: Layers, title: t("platform.core.l3.t"), desc: t("platform.core.l3.d") },
    { icon: ShieldCheck, title: t("platform.core.l4.t"), desc: t("platform.core.l4.d") },
  ];

  const stages = [
    { n: "01", title: t("platform.road.s1.t"), sub: t("platform.road.s1.s") },
    { n: "02", title: t("platform.road.s2.t"), sub: t("platform.road.s2.s") },
    { n: "03", title: t("platform.road.s3.t"), sub: t("platform.road.s3.s") },
    { n: "04", title: t("platform.road.s4.t"), sub: t("platform.road.s4.s") },
    { n: "05", title: t("platform.road.s5.t"), sub: t("platform.road.s5.s") },
    { n: "06", title: t("platform.road.s6.t"), sub: t("platform.road.s6.s") },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> {t("platform.eyebrow")}
          </div>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("platform.title.a")}{" "}
            <span className="text-primary">{t("platform.title.b")}</span>
          </h1>
          <p className="mx-auto mt-4 text-base text-muted-foreground sm:text-lg">
            {t("platform.subtitle")}
          </p>
        </div>

        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">{t("platform.core.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("platform.core.sub")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {layers.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-heading text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">{t("platform.vert.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("platform.vert.sub")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {verticals.map((v) => (
              <div
                key={v.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{v.icon}</span>
                  <span className="text-sm font-medium text-foreground">{v.label}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    v.tone === "live"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : v.tone === "building"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">{t("platform.road.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("platform.road.sub")}</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((st) => (
              <li key={st.n} className="rounded-xl border border-border bg-card p-4">
                <div className="font-mono text-xs text-primary">{st.n}</div>
                <div className="mt-1 font-semibold text-foreground">{st.title}</div>
                <div className="text-xs text-muted-foreground">{st.sub}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Building2 className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="font-heading text-xl font-bold text-foreground">
                {t("platform.ent.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("platform.ent.body")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  {t("platform.ent.cta1")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
                >
                  {t("platform.ent.cta2")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
