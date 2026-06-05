import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Thin band right under the hero that introduces mangoglobal as a multi-vertical
 * decision-engine platform (not just FX). Keeps the home page FX-first while
 * funnelling curious visitors to /platform.
 */
export function PlatformBand() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            FX is the first vertical. <span className="text-foreground font-medium">mangoglobal Platform</span> is the AI decision engine behind it — insurance, brokers, SaaS, and more are next.
          </span>
        </div>
        <Link
          to="/platform"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
        >
          Learn more <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
