import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Sparkles } from "lucide-react";

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

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description:
      "The full comparator + AI chat for individuals and one-off transfers. We earn from affiliate commissions when you use a provider — you pay nothing extra.",
    features: [
      "30+ providers, 100+ currencies",
      "Live mid-market rates",
      "Mango AI recommendation + chat",
      "Affiliate-funded, no signup needed",
      "Public web access",
    ],
    cta: "Use the FX Tool",
    ctaTo: "/fx-tool" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/ month",
    description:
      "For frequent senders, freelancers, and SMBs. Automated best-route alerts, multi-corridor monitoring, and saved beneficiaries.",
    features: [
      "Everything in Free",
      "Rate alerts on your corridors",
      "Saved beneficiaries & history",
      "CSV export & monthly report",
      "Priority AI (advanced reasoning)",
      "Email support",
    ],
    cta: "Start Pro",
    ctaTo: "/contact" as const,
    highlighted: true,
    badge: "For SMBs & freelancers",
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description:
      "Treasury teams and fintechs. API access to the decision engine, custom provider mix, SSO, audit logs, and SLA.",
    features: [
      "Everything in Pro",
      "REST API to the decision engine",
      "Custom provider mix & rules",
      "Webhook events & batch routing",
      "Dedicated account manager",
      "SSO, audit logs, SLA",
    ],
    cta: "Talk to Sales",
    ctaTo: "/contact" as const,
    highlighted: false,
  },
];

function PricingPage() {
  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
            <Sparkles className="h-3 w-3 text-primary" /> Free for retail. Paid for businesses that need automation.
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            How we make <span className="text-primary">money</span> — and how you save it
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Retail use is free, funded by affiliate commissions from providers. Businesses pay for
            automation, API access, and the optimisation engine that runs in the background.
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
                    {plan.badge ?? "Most Popular"}
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
              How does this work with affiliate commissions?
            </h2>
            <p className="leading-relaxed">
              When you use the free comparator and choose a provider, we may earn a commission from
              that provider — at no extra cost to you. The recommendation is neutral and ordered by
              actual amount received. Pro and Enterprise plans exist for businesses that need more
              than a one-off comparison: continuous optimisation across corridors, an API to plug
              into payment flows, and rules-based routing. The subscription pays for the engine and
              automation — not for the comparison itself, which stays free.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
