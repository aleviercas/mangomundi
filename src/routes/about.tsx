import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Sparkles, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — mangoglobal" },
      { name: "description", content: "mangoglobal is a neutral FX decision engine connecting retail and corporate flows to the best cross-border route." },
      { property: "og:title", content: "About — mangoglobal" },
      { property: "og:description", content: "Neutral FX decision engine for borderless payments." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  const values = [
    { icon: Globe2, title: t("about.v1.title"), body: t("about.v1.body") },
    { icon: Sparkles, title: t("about.v2.title"), body: t("about.v2.body") },
    { icon: Scale, title: t("about.v3.title"), body: t("about.v3.body") },
  ];

  return (
    <div className="bg-background">
      <section className="pt-20 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            {t("about.badge")}
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            {t("about.heroTitle1")} <span className="text-primary">{t("about.heroTitleAccent")}</span> {t("about.heroTitle2")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("about.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="py-12 border-y border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">{t("about.missionTitle")}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{t("about.missionBody")}</p>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">{t("about.visionTitle")}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{t("about.visionBody")}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-center text-2xl font-bold text-foreground mb-12">
            {t("about.valuesTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground text-lg">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factual metrics */}
      <section className="py-16 border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="font-heading text-4xl font-bold text-primary tabular-nums">
                  {t(`about.metric${i}.value`)}
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {t(`about.metric${i}.label`)}
                </div>
                {i > 1 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t(`about.metric${i}.note`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
