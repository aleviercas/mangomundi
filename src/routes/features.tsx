import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Brain, Wallet, Code, ShieldCheck, Headphones, Clock, FileText } from "lucide-react";
import { getRouteSeo, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/features")({
  head: () => {
    const seo = getRouteSeo("en", "/features");
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: "https://mangoglobal.lovable.app/features" },
      ],
      links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/features" }],
    };
  },
  component: FeaturesPage,
});

function FeaturesPage() {
  const { t } = useI18n();

  const features = [
    { icon: BarChart3, title: t("feat.f1.t"), description: t("feat.f1.d") },
    { icon: Brain, title: t("feat.f2.t"), description: t("feat.f2.d") },
    { icon: Wallet, title: t("feat.f3.t"), description: t("feat.f3.d") },
    { icon: Code, title: t("feat.f4.t"), description: t("feat.f4.d") },
    { icon: ShieldCheck, title: t("feat.f5.t"), description: t("feat.f5.d") },
    { icon: Headphones, title: t("feat.f6.t"), description: t("feat.f6.d") },
    { icon: Clock, title: t("feat.f7.t"), description: t("feat.f7.d") },
    { icon: FileText, title: t("feat.f8.t"), description: t("feat.f8.d") },
  ];

  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            {t("feat.title.a")}{" "}
            <span className="text-primary">{t("feat.title.b")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("feat.subtitle")}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
