import { createFileRoute } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MangoGlobal" },
      { name: "description", content: "Transparent pricing for MangoGlobal's FX payment platform. No hidden fees." },
      { property: "og:title", content: "Pricing — MangoGlobal" },
      { property: "og:description", content: "Transparent pricing for MangoGlobal's FX payment platform." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Starter",
    price: "0.5%",
    description: "Per transaction. Perfect for individuals and small businesses.",
    features: ["Up to $50K/month volume", "150+ currencies", "Real-time rates", "Email support", "Basic reporting"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Business",
    price: "0.3%",
    description: "Per transaction. For growing businesses with higher volumes.",
    features: ["Up to $500K/month volume", "Everything in Starter", "API access", "Priority support", "Advanced reporting", "FX hedging tools"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for large-scale treasury operations.",
    features: ["Unlimited volume", "Everything in Business", "Dedicated account manager", "Custom integrations", "SLA guarantees", "On-premise deployment option"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

function PricingPage() {
  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Transparent <span className="text-primary">Pricing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            No hidden fees. No monthly minimums. Pay only for what you use.
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
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/tx</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
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
        </div>
      </section>
    </div>
  );
}
