import { Link } from "@tanstack/react-router";
import { Terminal, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-card py-20 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_oklch(0.70_0.175_55)_0%,_transparent_60%)] opacity-10" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-background/60 p-8 font-mono text-left shadow-lg sm:p-10">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            {t("home.cta.badge")}
          </div>
          <p className="font-heading text-2xl font-bold leading-snug text-foreground sm:text-3xl">
            {t("home.cta.title")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("home.cta.subtitle")}
          </p>
          <div className="mt-8">
            <Link
              to="/business"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
            >
              <Terminal className="h-4 w-4" />
              {t("home.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
