import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24 lg:pt-24 lg:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.70_0.175_55)_0%,_transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.88_0.13_85)_0%,_transparent_50%)] opacity-5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {t("hero.badge")}
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title.1")}{" "}
              <span className="text-primary">{t("hero.title.2")}</span> {t("hero.title.3")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                {t("cta.compare")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-surface-elevated"
              >
                {t("cta.talkSales")}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>{t("hero.trust.1")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t("hero.trust.2")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                <span>{t("hero.trust.3")}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-card p-2 shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-20 rounded-full bg-primary/10 blur-3xl" />
                  <div className="relative flex items-center justify-center">
                    <div className="h-40 w-40 rounded-full border-2 border-primary/30 flex items-center justify-center">
                      <div className="h-24 w-24 rounded-full border-2 border-mango-glow/40 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: "20s" }}>
                      <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                    </div>
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }}>
                      <div className="absolute -bottom-2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-mango-glow" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
