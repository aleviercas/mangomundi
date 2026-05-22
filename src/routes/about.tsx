import { createFileRoute } from "@tanstack/react-router";
import { Globe, Target, Heart, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MangoGlobal" },
      { name: "description", content: "Learn about MangoGlobal's mission to build a neutral, intelligent platform for global FX payments." },
      { property: "og:title", content: "About — MangoGlobal" },
      { property: "og:description", content: "Learn about MangoGlobal's mission to build a neutral, intelligent platform for global FX payments." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Globe, title: "Borderless", description: "We believe money should move as freely as information." },
  { icon: Target, title: "Neutral", description: "No provider bias. No hidden margins. Pure optimization." },
  { icon: Heart, title: "Human", description: "Technology serves people, not the other way around." },
  { icon: Zap, title: "Fast", description: "Speed without compromise on security or compliance." },
];

function AboutPage() {
  return (
    <div className="bg-background">
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Built for a <span className="text-primary">Borderless</span> World
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            MangoGlobal was founded on a simple belief: cross-border payments should be intelligent, transparent, and accessible to everyone — from individuals sending remittances to corporations managing global treasury.
          </p>
        </div>
      </section>

      <section className="py-16 border-y border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-foreground">Our Mission</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            To democratise access to the best foreign exchange decisions through neutral, AI-powered intelligence — eliminating information asymmetry and hidden costs from global payments.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-center text-2xl font-bold text-foreground mb-12">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="font-heading text-3xl font-bold text-primary">2021</div>
              <div className="mt-1 text-sm text-muted-foreground">Founded</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-primary">150+</div>
              <div className="mt-1 text-sm text-muted-foreground">Countries</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-primary">200+</div>
              <div className="mt-1 text-sm text-muted-foreground">Team Members</div>
            </div>
            <div>
              <div className="font-heading text-3xl font-bold text-primary">$2B+</div>
              <div className="mt-1 text-sm text-muted-foreground">Volume Processed</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
