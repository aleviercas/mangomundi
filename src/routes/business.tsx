import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RfqTerminal } from "@/components/RfqTerminal";
import { useI18n } from "@/lib/i18n";
import {
  Building2,
  Code,
  ShieldCheck,
  Wallet,
  BarChart3,
  Headphones,
  ArrowRight,
  Globe,
  TrendingUp,
  Shield,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business & Enterprise FX — mangoglobal" },
      {
        name: "description",
        content:
          "Cross-border payments, treasury, and FX routing for businesses and financial institutions. API access, dedicated desks, and bespoke provider mix.",
      },
      { property: "og:title", content: "Business & Enterprise FX — mangoglobal" },
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


function BusinessPage() {
  const { t } = useI18n();
  const [rfqOpen, setRfqOpen] = useState(false);


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

      {/* Institutional neutrality statement */}
      <section className="py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-4">
            <Shield className="h-3 w-3 text-primary" /> Neutrality by design
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            mangoglobal operates as an independent decision engine. We do not own balance sheets,
            do not hold client funds, and route every quotation through a neutral comparator across
            regulated counterparties. Provider selection is driven exclusively by transparent
            criteria — effective rate, regulatory standing, settlement time and corridor coverage —
            never by commercial bias.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setRfqOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              {t("biz.rfqRoute")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>



      {/* Final CTA — RFQ */}
      <section className="py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Moving more than $50k a month?
          </h2>
          <p className="mt-3 text-muted-foreground">
            We do not charge subscription fees. Our model monetises exclusively through optimised
            spread on transacted volume — request a private RFQ quotation.
          </p>
          <button
            onClick={() => setRfqOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Terminal className="h-4 w-4" /> {t("biz.rfqCta")}
          </button>
        </div>
      </section>
      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} />
    </div>
  );
}

