import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RfqTerminal } from "@/components/RfqTerminal";
import { useI18n, CORPORATE_LANGS, type Lang } from "@/lib/i18n";
import {
  Building2,
  Terminal,
  FlaskConical,
  Network,
  Lock,
} from "lucide-react";


export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Institutional Routing & Strategy Validation — mangoglobal" },
      {
        name: "description",
        content:
          "Architected for high-volume cross-border analysis and neutral flow optimization. Validate institutional routing mechanics before execution.",
      },
      {
        property: "og:title",
        content: "Institutional Routing & Strategy Validation — mangoglobal",
      },
      {
        property: "og:description",
        content:
          "High-volume cross-border analysis and neutral flow optimization. Eliminate hidden variance before execution.",
      },
    ],
  }),
  component: BusinessPage,
});

const pillars = [
  {
    icon: FlaskConical,
    title: "Strategy Validation Lab",
    body: "Validate multi-currency routing models and analyze performance metrics via simulated equity curves and detailed AI justification logs under strict neutrality.",
  },
  {
    icon: Network,
    title: "Flow Optimization Engine",
    body: "Cross-reference execution corridors to ensure capital reaches destination accounts via the mathematical optimum, minimizing friction and variable markups.",
  },
  {
    icon: Lock,
    title: "Corporate Discretion (RFQ)",
    body: "High-value operations are managed through a private, non-custodial RFQ protocol designed to protect institutional order flow from front-running.",
  },
];

function BusinessPage() {
  const [rfqOpen, setRfqOpen] = useState(false);
  const { lang, setLang } = useI18n();

  // Compliance gate: /business is restricted to the 5 verified corporate locales.
  useEffect(() => {
    if (!(CORPORATE_LANGS as readonly Lang[]).includes(lang)) {
      setLang("en");
    }
  }, [lang, setLang]);



  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.70_0.175_55)_0%,_transparent_50%)] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground mb-5">
            <Building2 className="h-3 w-3 text-primary" /> For institutions & corporate treasury
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Institutional Routing &{" "}
            <span className="text-primary">Strategy Validation.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Architected for high-volume cross-border analysis and neutral flow optimization.
            Eliminate hidden variance and validate institutional routing mechanics before
            execution.
          </p>
        </div>
      </section>

      {/* Real-infrastructure grid */}
      <section className="py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique RFQ conversion close */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-base text-muted-foreground leading-relaxed">
            We do not charge subscription fees. Our model focuses exclusively on absolute
            routing transparency. Access the institutional desk below.
          </p>
          <button
            onClick={() => setRfqOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Terminal className="h-4 w-4" /> Open the RFQ desk
          </button>
        </div>
      </section>

      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} />
    </div>
  );
}
