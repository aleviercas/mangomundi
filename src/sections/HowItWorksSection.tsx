import { Search, Route, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Compare",
    description: "Our engine scans 150+ providers in real-time to surface the best available rates and routes for your payment.",
  },
  {
    number: "02",
    icon: Route,
    title: "Optimise",
    description: "Neutral AI analyses speed, cost, and reliability to build the optimal payment path — with zero provider bias.",
  },
  {
    number: "03",
    icon: Send,
    title: "Execute",
    description: "Execute your transaction directly through the recommended provider or initiate our asynchronous RFQ protocol. Complete your operation with full transparency and market-backed justification.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to smarter cross-border payments
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:bg-surface-elevated"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="font-heading text-sm font-semibold text-primary mb-2">
                {step.number}
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
