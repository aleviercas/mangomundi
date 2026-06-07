import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
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
  Check,
  Globe,
  TrendingUp,
  Briefcase,
  Star,
  Shield,
  Sparkles,
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


const largeTicketDesk = [
  {
    name: "Airwallex",
    domain: "airwallex.com",
    regulator: "FCA · ASIC · MAS",
    trust: 9.4,
    spread: "0.4%",
    speciality: "Global accounts, batch payouts, treasury API",
  },
  {
    name: "OFX",
    domain: "ofx.com",
    regulator: "ASIC · FCA · FinCEN",
    trust: 9.1,
    spread: "0.5%",
    speciality: "Forwards & limit orders for treasury teams",
  },
  {
    name: "Convera",
    domain: "convera.com",
    regulator: "FinCEN · FCA",
    trust: 8.9,
    spread: "0.6%",
    speciality: "Enterprise FX, education & higher-ed payouts",
  },
  {
    name: "Currencies Direct",
    domain: "currenciesdirect.com",
    regulator: "FCA",
    trust: 9.2,
    spread: "0.5%",
    speciality: "Property & high-value private client transfers",
  },
];

function BusinessPage() {
  const [monthly, setMonthly] = useState<number>(250000);
  const savingsPct = 0.025; // conservative 2.5% blended saving
  const monthlySavings = Math.round(monthly * savingsPct);
  const annualSavings = monthlySavings * 12;

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

      {/* ROI calculator */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-transparent p-6 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <TrendingUp className="h-3 w-3" /> ROI estimate
                </div>
                <h2 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  How much could you save?
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Most business clients save 1–4% on every conversion vs their incumbent bank or PSP.
                  Drag the slider to see what that means for your flow.
                </p>
                <label className="mt-6 block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Monthly cross-border volume (USD)
                  </span>
                  <input
                    type="range"
                    min={25000}
                    max={5000000}
                    step={25000}
                    value={monthly}
                    onChange={(e) => setMonthly(Number(e.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>$25k</span>
                    <span className="font-semibold text-foreground">${monthly.toLocaleString()}</span>
                    <span>$5M</span>
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Estimated savings
                </div>
                <div className="mt-2 font-heading text-5xl font-bold text-foreground tabular-nums">
                  ${annualSavings.toLocaleString()}
                  <span className="ml-1 text-base font-normal text-muted-foreground">/ year</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  ≈ ${monthlySavings.toLocaleString()} per month · 2.5% blended saving
                </div>
                <div className="my-5 h-px bg-border" />
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> No card lock-in. Use your own provider accounts.</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Audit-ready logs and FX exposure reports.</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> API or dashboard — your team chooses.</li>
                </ul>
                <Link
                  to="/contact"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Get a tailored quote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Large-ticket desk */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-4">
              <Briefcase className="h-3 w-3 text-primary" /> For transfers &gt; $50k
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              The large-ticket desk
            </h2>
            <p className="mt-4 text-muted-foreground">
              Specialist providers we route to for high-value transfers — pre-vetted for
              regulation, transparent spreads, and treasury features.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {largeTicketDesk.map((p) => (
              <div key={p.name} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BrandLogo name={p.name} domain={p.domain} size={32} />
                    <div>
                      <div className="font-heading font-semibold text-foreground">{p.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" /> {p.regulator}</span>
                        <span className="inline-flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current" /> {p.trust}/10</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold tabular-nums text-primary">
                    ~{p.spread} spread
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.speciality}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              Get routed to the right desk for your corridor <ArrowRight className="h-4 w-4" />
            </Link>
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

