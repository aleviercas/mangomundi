import { Users, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const audiences = [
  {
    icon: Users,
    title: "For Individuals",
    subtitle: "Retail Remittances",
    description: "Send money home, pay for travel, shop globally. Get competitive rates with zero hidden fees and instant tracking.",
    features: ["150+ currencies", "Zero hidden fees", "Real-time tracking", "Mobile-first"],
    cta: "Start Sending",
    ctaTo: "/contact",
    gradient: "from-primary/20 to-transparent",
  },
  {
    icon: Briefcase,
    title: "For Business",
    subtitle: "Corporate Treasury",
    description: "Manage FX exposure, execute bulk payments, and hedge currency risk with enterprise-grade APIs and reporting.",
    features: ["FX hedging", "Bulk payments", "REST API access", "Dedicated support"],
    cta: "Talk to Sales",
    ctaTo: "/contact",
    gradient: "from-mango-glow/20 to-transparent",
  },
];

export function DualAudienceSection() {
  return (
    <section className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Built for Every Scale
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From personal remittances to corporate treasury operations
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="relative overflow-hidden rounded-2xl border border-border bg-background p-8 lg:p-10"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${audience.gradient} opacity-50`} />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <audience.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-primary mb-1">{audience.subtitle}</div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {audience.description}
                </p>
                <ul className="space-y-2 mb-8">
                  {audience.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={audience.ctaTo}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {audience.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
