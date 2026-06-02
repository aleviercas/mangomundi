import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";

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
            <div className="absolute -inset-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">Live comparison</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">1,000 GBP → ARS</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Wise", emoji: "💸", received: "1,242,180", delta: "Best rate", best: true },
                  { name: "Revolut", emoji: "🪙", received: "1,238,940", delta: "-0.26%", best: false },
                  { name: "Western Union", emoji: "🏦", received: "1,219,500", delta: "-1.83%", best: false },
                  { name: "PayPal Xoom", emoji: "💳", received: "1,201,330", delta: "-3.28%", best: false },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                      p.best ? "border-primary/40 bg-primary/[0.06]" : "border-border bg-background/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{p.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        <div className={`text-[10px] ${p.best ? "text-primary font-semibold" : "text-muted-foreground"}`}>{p.delta}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-foreground">{p.received}</div>
                      <div className="text-[10px] text-muted-foreground">ARS</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/compare"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                Run a live comparison <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
