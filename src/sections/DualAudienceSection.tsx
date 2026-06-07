import { Users, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function DualAudienceSection() {
  const { t } = useI18n();

  const flows = [
    {
      icon: Users,
      title: t("home.dual.retail.title"),
      body: t("home.dual.retail.body"),
    },
    {
      icon: Building2,
      title: t("home.dual.corporate.title"),
      body: t("home.dual.corporate.body"),
    },
  ];

  return (
    <section className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {t("home.dual.title")}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {flows.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-background p-8 transition-colors hover:border-primary/30"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
