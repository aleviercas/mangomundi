import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Brain, Wallet, Code, ShieldCheck, Headphones, Clock, FileText } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — mangoglobal" },
      { name: "description", content: "Explore mangoglobal's platform features for intelligent cross-border payments." },
      { property: "og:title", content: "Features — mangoglobal" },
      { property: "og:description", content: "Explore mangoglobal's platform features for intelligent cross-border payments." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Rate Comparison",
    description: "Access live exchange rates from 150+ providers. Our engine updates every 30 seconds to ensure you always see the most current market data.",
  },
  {
    icon: Brain,
    title: "AI-Powered Smart Routing",
    description: "Our neutral AI analyses speed, cost, reliability, and compliance to build the optimal payment path for every transaction.",
  },
  {
    icon: Wallet,
    title: "Multi-Currency Wallets",
    description: "Hold balances in 150+ currencies. Convert between currencies at market-leading rates with a single click.",
  },
  {
    icon: Code,
    title: "Enterprise API",
    description: "RESTful APIs with comprehensive documentation, webhooks, and SDKs for Python, Node.js, Java, and Go.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Automation",
    description: "Automated KYC, AML screening, and regulatory reporting across all supported jurisdictions.",
  },
  {
    icon: Headphones,
    title: "24/7 Global Support",
    description: "Expert support teams across London, Singapore, New York, and Lagos. Available via chat, email, and phone.",
  },
  {
    icon: Clock,
    title: "Scheduled Payments",
    description: "Set up recurring transfers, forward contracts, and automated hedging strategies.",
  },
  {
    icon: FileText,
    title: "Advanced Reporting",
    description: "Detailed analytics on FX exposure, cost savings, and payment performance. Export to Excel, PDF, or via API.",
  },
];

function FeaturesPage() {
  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Everything You Need for{" "}
            <span className="text-primary">Global Payments</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A complete platform for comparing, optimising, and executing cross-border payments at any scale.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
