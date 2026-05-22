import { Brain, Scale, Eye, Lock } from "lucide-react";

const principles = [
  { icon: Scale, title: "No Provider Bias", description: "We don't own payment rails. Our AI routes purely on merit." },
  { icon: Eye, title: "Full Transparency", description: "See exactly why a route was chosen. Every decision is explainable." },
  { icon: Lock, title: "Privacy First", description: "Your data trains no third-party models. It stays encrypted and yours." },
];

export function AISection() {
  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.70_0.175_55)_0%,_transparent_70%)] opacity-5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Brain className="h-4 w-4" />
              Neutral by Design
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              AI Without{" "}
              <span className="text-primary">Agenda</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Most platforms route payments to whoever pays them the highest margin. We built MangoGlobal differently. Our AI has no allegiance to any provider. It finds the true best route for every payment — every single time.
            </p>
            <div className="mt-10 space-y-6">
              {principles.map((principle) => (
                <div key={principle.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <principle.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{principle.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">A</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Provider A</div>
                      <div className="text-xs text-muted-foreground">Rate: 1.2450</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">$12.40 fee</div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-card p-4 border-2 border-primary">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">B</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Provider B</div>
                      <div className="text-xs text-muted-foreground">Rate: 1.2475</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary">$8.20 fee — Selected</div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">C</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Provider C</div>
                      <div className="text-xs text-muted-foreground">Rate: 1.2440</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">$15.00 fee</div>
                </div>
                <div className="rounded-xl bg-primary/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Brain className="h-4 w-4" />
                    <span className="font-semibold">AI Decision:</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Provider B selected due to optimal total cost (rate + fee) and 99.8% reliability score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
