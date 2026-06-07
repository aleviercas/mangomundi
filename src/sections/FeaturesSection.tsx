import { ShieldCheck, Landmark, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FeaturesSection() {
  const { t } = useI18n();

  const pillars = [
    {
      icon: ShieldCheck,
      title: t("home.infra.routing.title"),
      body: t("home.infra.routing.body"),
    },
    {
      icon: Landmark,
      title: t("home.infra.desks.title"),
      body: t("home.infra.desks.body"),
    },
    {
      icon: Headphones,
      title: t("home.infra.advisory.title"),
      body: t("home.infra.advisory.body"),
    },
  ];

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {t("home.infra.title")}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
