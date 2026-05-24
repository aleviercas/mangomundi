import { Link } from "@tanstack/react-router";
import { ArrowRight, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_oklch(0.70_0.175_55)_0%,_transparent_60%)] opacity-10" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
          Find the best route.{" "}
          <span className="text-primary">In one click.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Free, neutral, instant. Compare 30+ providers across 100+ currencies — and let Mango's AI explain the trade-offs.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/fx-tool"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
          >
            {t("cta.tryTool")}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-surface-elevated"
          >
            <Mail className="h-5 w-5" />
            {t("cta.talkSales")}
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No signup required for the comparator. Pro plans for businesses below.
        </p>
      </div>
    </section>
  );
}
