import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — mangoglobal" },
      {
        name: "description",
        content:
          "Free for retail users — paid for businesses that need optimised routing, API access, and white-label tools. Transparent, no hidden fees.",
      },
      { property: "og:title", content: "Pricing — mangoglobal" },
      {
        property: "og:description",
        content:
          "Free comparator for everyone. Pro and Enterprise plans for businesses needing automated routing and API access.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useI18n();

  const plans = [
    {
      name: t("pricing.free.name"),
      price: t("pricing.free.price"),
      cadence: t("pricing.free.cadence"),
      description: t("pricing.free.desc"),
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f2"),
        t("pricing.free.f3"),
        t("pricing.free.f4"),
        t("pricing.free.f5"),
      ],
      cta: t("pricing.free.cta"),
      ctaTo: "/fx-tool" as const,
      highlighted: false,
      badge: undefined as string | undefined,
    },
    {
      name: t("pricing.pro.name"),
      price: t("pricing.pro.price"),
      cadence: t("pricing.pro.cadence"),
      description: t("pricing.pro.desc"),
      features: [
        t("pricing.pro.f1"),
        t("pricing.pro.f2"),
        t("pricing.pro.f3"),
        t("pricing.pro.f4"),
        t("pricing.pro.f5"),
        t("pricing.pro.f6"),
      ],
      cta: t("pricing.pro.cta"),
      ctaTo: "/contact" as const,
      highlighted: true,
      badge: t("pricing.pro.badge"),
    },
    {
      name: t("pricing.ent.name"),
      price: t("pricing.ent.price"),
      cadence: "",
      description: t("pricing.ent.desc"),
      features: [
        t("pricing.ent.f1"),
        t("pricing.ent.f2"),
        t("pricing.ent.f3"),
        t("pricing.ent.f4"),
        t("pricing.ent.f5"),
        t("pricing.ent.f6"),
      ],
      cta: t("pricing.ent.cta"),
      ctaTo: "/contact" as const,
      highlighted: false,
      badge: undefined as string | undefined,
    },
  ];

  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
            <Sparkles className="h-3 w-3 text-primary" /> {t("pricing.eyebrow")}
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            {t("pricing.title.a")} <span className="text-primary">{t("pricing.title.b")}</span> {t("pricing.title.c")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    {plan.badge ?? t("pricing.popular")}
                  </div>
                )}
                <h3 className="font-heading text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.cadence && (
                    <span className="text-muted-foreground">{plan.cadence}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaTo}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              {t("pricing.faq.title")}
            </h2>
            <p className="leading-relaxed">{t("pricing.faq.body")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
