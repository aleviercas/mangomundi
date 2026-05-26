import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Layers, Network, Bot, Building2, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "AI Decision Engine — MangoGlobal Platform" },
      {
        name: "description",
        content:
          "MangoGlobal is an AI-powered decision and sourcing infrastructure for complex markets. FX is the first vertical — insurance, brokers, SaaS, logistics and lending follow.",
      },
      { property: "og:title", content: "AI Decision Engine — MangoGlobal Platform" },
      {
        property: "og:description",
        content:
          "AI infrastructure for complex decisions, sourcing and procurement. One core engine, many verticals.",
      },
    ],
  }),
  component: PlatformPage,
});

const verticals = [
  { label: "FX & cross-border payments", status: "Live", icon: "💱" },
  { label: "Brokers & investing (TradeHunter)", status: "Building", icon: "📈" },
  { label: "Insurance carriers & brokers", status: "Planned", icon: "🛡️" },
  { label: "SaaS procurement", status: "Planned", icon: "🧰" },
  { label: "Cloud & infrastructure", status: "Planned", icon: "☁️" },
  { label: "Payments infrastructure (APIs)", status: "Planned", icon: "🔌" },
  { label: "Lending & treasury", status: "Planned", icon: "🏦" },
  { label: "Freight & trade finance", status: "Planned", icon: "🚢" },
];

const layers = [
  { icon: Bot, title: "AI recommendation engine", desc: "User profiling, context extraction, multi-criteria ranking." },
  { icon: Network, title: "Provider graph", desc: "Unified schema for every vertical: pricing, trust, coverage, performance." },
  { icon: Layers, title: "RFQ & matching engine", desc: "Generate quote requests, route to eligible providers, normalize offers." },
  { icon: ShieldCheck, title: "Trust & transparency", desc: "Regulator data, review aggregation, organic-vs-sponsored separation." },
];

const stages = [
  { n: "01", t: "Comparison platform", s: "Live for FX" },
  { n: "02", t: "AI recommendation engine", s: "Live for FX" },
  { n: "03", t: "Lead routing marketplace", s: "Q1 2026" },
  { n: "04", t: "RFQ + negotiation automation", s: "2026" },
  { n: "05", t: "AI procurement infrastructure", s: "2026–2027" },
  { n: "06", t: "Universal decision layer", s: "Vision" },
];

function PlatformPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> The platform behind MangoGlobal
          </div>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            AI infrastructure for{" "}
            <span className="text-primary">complex decisions</span>
          </h1>
          <p className="mx-auto mt-4 text-base text-muted-foreground sm:text-lg">
            We're not building another comparison site. We're building the decision, sourcing and
            execution layer for fragmented markets — starting with cross-border FX, extending to
            every category where pricing is opaque and choices are hard.
          </p>
        </div>

        {/* Core layers */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">One core engine</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared infrastructure across every vertical. Add a new market, not a new product.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {layers.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-heading text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verticals */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">Many verticals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every category that's fragmented, opaque and high-stakes is a candidate.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {verticals.map((v) => (
              <div
                key={v.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{v.icon}</span>
                  <span className="text-sm font-medium text-foreground">{v.label}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    v.status === "Live"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : v.status === "Building"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground">Roadmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From comparison to a universal decision layer.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((st) => (
              <li key={st.n} className="rounded-xl border border-border bg-card p-4">
                <div className="font-mono text-xs text-primary">{st.n}</div>
                <div className="mt-1 font-semibold text-foreground">{st.t}</div>
                <div className="text-xs text-muted-foreground">{st.s}</div>
              </li>
            ))}
          </ol>
        </section>

        {/* Enterprise CTA */}
        <section className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Building2 className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="font-heading text-xl font-bold text-foreground">
                Enterprise & private deployments
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Banks, treasury teams and large enterprises don't want a public marketplace for
                sensitive decisions. We offer hosted SaaS, private SaaS, and API-only deployments
                of the same decision engine — with your own provider network and compliance controls.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
                >
                  Business solutions
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
