import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_oklch(0.70_0.175_55)_0%,_transparent_60%)] opacity-10" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
          Ready to Make Smarter{" "}
          <span className="text-primary">FX Decisions</span>?
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Join thousands of individuals and businesses who trust MangoGlobal to optimise their cross-border payments.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="mailto:hello@mangoglobal.com"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-surface-elevated"
          >
            <Mail className="h-5 w-5" />
            Talk to Sales
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. Start sending in minutes.
        </p>
      </div>
    </section>
  );
}
