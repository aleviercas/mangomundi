import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Sparkles, ArrowRight, Construction } from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance Comparison (Coming Soon) — mangoglobal" },
      {
        name: "description",
        content:
          "mangoglobal is bringing its neutral AI decision engine to insurance: compare policies across providers with transparent pricing and coverage.",
      },
      { property: "og:title", content: "Insurance Comparison — mangoglobal" },
      {
        property: "og:description",
        content:
          "The same engine that compares FX providers, applied to insurance. Coming soon.",
      },
    ],
  }),
  component: InsurancePage,
});

function InsurancePage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Construction className="h-3 w-3" /> Vertical #2 · Coming soon
        </div>

        <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Insurance, decided <span className="text-primary">intelligently</span>.
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          The same neutral AI engine that powers mangoglobal's FX comparison is being
          extended to insurance. Compare policies across providers with transparent
          pricing, coverage scoring, and a recommendation tuned to your situation.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Coverage scoring", body: "Normalised coverage matrix across providers — no fine-print surprises." },
            { icon: Sparkles, title: "Neutral AI advice", body: "Same multi-model engine. Recommends what fits you, not what pays us most." },
            { icon: ArrowRight, title: "One decision flow", body: "Quote, compare, and bind in one place — across health, travel, auto and home." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-heading font-bold text-foreground">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-xl font-bold text-foreground">Why this matters</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            mangoglobal is built as a multi-vertical decision platform. FX is the first
            live vertical. Insurance is next, then SaaS, lending, and brokers — all on
            the same provider schema, sponsored-vs-organic ranking, and AI recommendation
            layer. See the{" "}
            <Link to="/platform" className="text-primary underline-offset-4 hover:underline">
              platform vision
            </Link>{" "}
            for the full roadmap.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            data-coming-soon="insurance-launch-partner"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Be a launch partner · Enterprise Beta <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
          >
            Try the FX engine
          </Link>
        </div>
      </div>
    </div>
  );
}
