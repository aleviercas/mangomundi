import { BarChart3, Brain, Wallet, Code, ShieldCheck, Headphones } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Rate Comparison",
    description: "Monitor live exchange rates across 150+ providers. Never miss the best deal.",
  },
  {
    icon: Brain,
    title: "AI-Powered Smart Routing",
    description: "Our neutral AI finds the optimal path for every payment based on speed, cost, and reliability.",
  },
  {
    icon: Wallet,
    title: "Multi-Currency Wallets",
    description: "Hold, convert, and manage balances in 150+ currencies from a single dashboard.",
  },
  {
    icon: Code,
    title: "Enterprise API Access",
    description: "RESTful APIs with comprehensive documentation. Integrate in hours, not weeks.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & KYC",
    description: "Automated identity verification and regulatory compliance across all jurisdictions.",
  },
  {
    icon: Headphones,
    title: "24/7 Global Support",
    description: "Expert support teams across time zones. Chat, email, or phone — we're always here.",
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
            Everything you need to move money intelligently across borders
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
