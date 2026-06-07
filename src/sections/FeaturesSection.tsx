import { Sparkles, Bell, ShieldCheck, Globe2 } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Smart Spread Optimisation (RFQ)",
    description:
      "Non-public asynchronous bidding protocol for volumes above 10,000 USD with our network of authorised money desks.",
  },
  {
    icon: Bell,
    title: "Multichannel Automated Alerts",
    description:
      "Configure FX threshold alerts and receive instant notifications through WhatsApp, Slack and Telegram.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by Design (GDPR)",
    description:
      "Complete anonymisation of financial data on external webhooks to protect the identity and strategy of corporate treasuries.",
  },
  {
    icon: Globe2,
    title: "Local & Cross-Border Coverage",
    description:
      "Integrated support for international transfers and domestic Local FX — optimising existing multi-currency accounts.",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Platform Features
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            The four operational pillars of our Agentic AI architecture.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:bg-surface-elevated"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
