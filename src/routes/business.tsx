import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Code,
  ShieldCheck,
  Wallet,
  BarChart3,
  Headphones,
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  TrendingUp,
  Briefcase,
  Star,
  Shield,
} from "lucide-react";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business & Enterprise FX — MangoGlobal" },
      {
        name: "description",
        content:
          "Cross-border payments, treasury, and FX routing for businesses and financial institutions. API access, dedicated desks, and bespoke provider mix.",
      },
      { property: "og:title", content: "Business & Enterprise FX — MangoGlobal" },
      {
        property: "og:description",
        content:
          "Cut FX cost across payroll, suppliers, and treasury. API to the decision engine, dedicated support, custom provider routing.",
      },
    ],
  }),
  component: BusinessPage,
});

const useCases = [
  {
    icon: Globe,
    title: "Global payroll & contractor payouts",
    body: "Pay teams in 100+ currencies with optimised routing per corridor. Eliminate hidden FX margins on every cycle.",
  },
  {
    icon: Wallet,
    title: "Supplier & invoice payments",
    body: "Batch international AP runs through the cheapest reliable rail per beneficiary, with audit-ready records.",
  },
  {
    icon: TrendingUp,
    title: "Treasury & FX hedging",
    body: "Live mid-market visibility, forward contracts, and rules-based routing so treasury never overpays on conversions.",
  },
  {
    icon: Code,
    title: "Embedded FX (fintech & platforms)",
    body: "Plug the decision engine into your product via REST API. Offer your users best-route transfers without building it yourself.",
  },
];

const features = [
  { icon: Code, title: "REST API & webhooks", body: "Quote, route, and execute payments programmatically with SDKs and full docs." },
  { icon: ShieldCheck, title: "Compliance automation", body: "KYC, AML screening, and regulatory reporting across supported jurisdictions." },
  { icon: BarChart3, title: "Advanced reporting", body: "FX exposure, cost savings, and payment performance — exportable and API-accessible." },
  { icon: Headphones, title: "Dedicated support", body: "Account manager, SLA, and direct lines to our London, Singapore, NY, and Lagos desks." },
];

const plans = [
  {
    name: "Pro",
    price: "$49",
    cadence: "/ month",
    description: "For SMBs and finance teams running regular cross-border flows.",
    features: [
      "Rate alerts on your corridors",
      "Saved beneficiaries & history",
      "CSV export & monthly reports",
      "Priority AI reasoning",
      "Email support",
    ],
    cta: "Start Pro",
    ctaTo: "/contact" as const,
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "Treasury teams, fintechs, and financial institutions.",
    features: [
      "REST API to the decision engine",
      "Custom provider mix & routing rules",
      "Webhook events & batch routing",
      "Dedicated account manager",
      "SSO, audit logs, SLA",
    ],
    cta: "Talk to Sales",
    ctaTo: "/contact" as const,
    highlighted: false,
  },
];

const largeTicketDesk = [
  {
    name: "Airwallex",
    emoji: "🌐",
    regulator: "FCA · ASIC · MAS",
    trust: 9.4,
    spread: "0.4%",
    speciality: "Global accounts, batch payouts, treasury API",
  },
  {
    name: "OFX",
    emoji: "🏦",
    regulator: "ASIC · FCA · FinCEN",
    trust: 9.1,
    spread: "0.5%",
    speciality: "Forwards & limit orders for treasury teams",
  },
  {
    name: "Convera",
    emoji: "💼",
    regulator: "FinCEN · FCA",
    trust: 8.9,
    spread: "0.6%",
    speciality: "Enterprise FX, education & higher-ed payouts",
  },
  {
    name: "Currencies Direct",
    emoji: "💷",
    regulator: "FCA",
    trust: 9.2,
    spread: "0.5%",
    speciality: "Property & high-value private client transfers",
  },
];

function BusinessPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.70_0.175_55)_0%,_transparent_50%)] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <Building2 className="h-3 w-3 text-primary" /> For businesses & financial institutions
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            International payments,{" "}
            <span className="text-primary">intelligently routed.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Cut FX cost across payroll, suppliers, and treasury. Plug our decision engine into your
            product via API, or use the dashboard for high-value transfers with dedicated support.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Talk to Sales <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated"
            >
              See pricing
            </a>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Built for every cross-border flow
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you're moving payroll to 30 countries or running a fintech on top of our API.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {useCases.map((u) => (
              <div key={u.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <u.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{u.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Enterprise-grade platform
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything finance, treasury, and engineering teams need to move money internationally.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-4">
              <Sparkles className="h-3 w-3 text-primary" /> Retail use stays free. Business pays for automation.
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Business <span className="text-primary">pricing</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              The public comparator is free for individuals. These plans exist for teams that need
              continuous optimisation, an API, and dedicated support.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <h3 className="font-heading text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.cadence && <span className="text-muted-foreground">{plan.cadence}</span>}
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Moving more than $50k a month?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our business desk gets you better rates, batch routing, and a dedicated point of contact.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Talk to Sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
