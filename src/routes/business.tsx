import { createFileRoute } from "@tanstack/react-router";
import { RfqInlinePanel } from "@/components/RfqTerminal";
import { useI18n } from "@/lib/i18n";
import { Building2, FlaskConical, Network, Lock } from "lucide-react";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Institutional Routing & Strategy Validation — mangoglobal" },
      {
        name: "description",
        content:
          "Architected for high-volume cross-border analysis and neutral flow optimization. Validate institutional routing mechanics before execution.",
      },
      {
        property: "og:title",
        content: "Institutional Routing & Strategy Validation — mangoglobal",
      },
      {
        property: "og:description",
        content:
          "High-volume cross-border analysis and neutral flow optimization. Eliminate hidden variance before execution.",
      },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  const { t } = useI18n();

  const pillars = [
    { icon: FlaskConical, titleKey: "business.pillar.lab.title", bodyKey: "business.pillar.lab.body" },
    { icon: Network, titleKey: "business.pillar.flow.title", bodyKey: "business.pillar.flow.body" },
    { icon: Lock, titleKey: "business.pillar.rfq.title", bodyKey: "business.pillar.rfq.body" },
  ] as const;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.70_0.175_55)_0%,_transparent_50%)] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <Building2 className="h-3 w-3 text-primary" /> {t("business.badge")}
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("business.hero.title.1")}{" "}
            <span className="text-primary">{t("business.hero.title.2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("business.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.titleKey} className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {t(p.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(p.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <p className="text-base text-muted-foreground leading-relaxed">{t("business.rfqNote")}</p>
          </div>
          <RfqInlinePanel />
        </div>
      </section>
    </div>
  );
}
