import { Search, Route, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { number: "01", icon: Search, title: t("home.how.s1.title"), description: t("home.how.s1.desc") },
    { number: "02", icon: Route, title: t("home.how.s2.title"), description: t("home.how.s2.desc") },
    { number: "03", icon: Send, title: t("home.how.s3.title"), description: t("home.how.s3.desc") },
  ];
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {t("home.how.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.how.subtitle")}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:bg-surface-elevated"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="font-heading text-sm font-semibold text-primary mb-2">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
