import { Users, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { RfqTerminal } from "@/components/RfqTerminal";

export function DualAudienceSection() {
  const [rfqOpen, setRfqOpen] = useState(false);

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
          {/* Retail */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-8 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium text-primary mb-1">Retail Remittances</div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">For Individuals</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Send money home, pay for travel, shop globally. Get competitive rates with zero hidden fees and instant tracking.
              </p>
              <ul className="space-y-2 mb-8">
                {["100+ currencies", "Zero hidden fees", "Real-time tracking", "Mobile-first"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Start Sending <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Corporate */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-8 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-mango-glow/20 to-transparent opacity-50" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium text-primary mb-1">Corporate Treasury</div>
              <h3 className="font-heading text-2xl font-bold text-foreground mb-4">For Business</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Manage FX exposure, execute bulk payments, and hedge currency risk with our interactive RFQ Terminal and transparent data reporting.
              </p>
              <ul className="space-y-2 mb-8">
                {["FX hedging", "Bulk payments", "RFQ Terminal Access", "Dedicated support"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setRfqOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Open the RFQ Terminal <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <RfqTerminal open={rfqOpen} onOpenChange={setRfqOpen} />
    </section>
  );
}
