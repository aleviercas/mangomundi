import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Shield, Zap, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

export function HeroSection() {
  const { t } = useI18n();

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [submittingAlert, setSubmittingAlert] = useState(false);

  const handleProviderClick = async (providerName: string, providerSlug: string) => {
    if (loadingProvider) return;
    setLoadingProvider(providerName);

    const affiliateLinks: Record<string, string> = {
      "Wise": "https://wise.evyy.net/c/PLACEHOLDER/123456/8003",
      "Revolut": "https://revolut.pxf.io/c/PLACEHOLDER/111222/8004",
      "Western Union": "https://westernunion.pxf.io/c/PLACEHOLDER/333444/8005",
      "PayPal Xoom": "https://xoom.pxf.io/c/PLACEHOLDER/555666/8006",
    };
    const targetUrl = affiliateLinks[providerName] || "https://wise.com";

    let trackingCompleted = false;
    const fallbackTimeout = setTimeout(() => {
      if (!trackingCompleted) {
        trackingCompleted = true;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    }, 1200);

    try {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .insert({
          provider_slug: providerSlug,
          from_currency: "GBP",
          to_currency: "ARS",
          amount: 1000,
          segment: "retail",
          referrer: typeof window !== "undefined" ? window.location.href : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (!trackingCompleted) {
        clearTimeout(fallbackTimeout);
        trackingCompleted = true;
        window.open(`${targetUrl}?subId1=${data.id}`, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    } catch (err) {
      console.error("tracking error", err);
      if (!trackingCompleted) {
        clearTimeout(fallbackTimeout);
        trackingCompleted = true;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    }
  };

  const handleRateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submittingAlert) return;
    setSubmittingAlert(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: email.split("@")[0] || "alert",
        email,
        source: "rate-alert-gbp-ars",
        message: "Rate alert subscription: GBP → ARS",
      });
      if (error) throw error;
      setAlertSubmitted(true);
      setEmail("");
    } catch (err) {
      console.error("rate alert error", err);
    } finally {
      setSubmittingAlert(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-24 lg:pt-28 lg:pb-32">
      {/* Minimal geometric grid background — light mode */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.21 0.034 264 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.21 0.034 264 / 0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("hero.badge")}
            </div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              {t("hero.title.1")}{" "}
              <span className="text-primary">{t("hero.title.2")}</span> {t("hero.title.3")}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b]"
              >
                {t("cta.compare")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300"
              >
                {t("cta.talkSales")}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { Icon: TrendingUp, label: t("hero.trust.1") },
                { Icon: Shield, label: t("hero.trust.2") },
                { Icon: Zap, label: t("hero.trust.3") },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: comparison widget */}
          <div className="relative">
            <div className="relative rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm shadow-slate-100">
              <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    {t("hero.mini.live")}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  1,000 GBP → ARS
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { name: "Wise", slug: "wise", domain: "wise.com", received: "1,242,180", delta: t("hero.mini.best"), best: true },
                  { name: "Revolut", slug: "revolut", domain: "revolut.com", received: "1,238,940", delta: "-0.26%", best: false },
                  { name: "Western Union", slug: "western-union", domain: "westernunion.com", received: "1,219,500", delta: "-1.83%", best: false },
                  { name: "PayPal Xoom", slug: "xoom", domain: "xoom.com", received: "1,201,330", delta: "-3.28%", best: false },
                ].map((p) => {
                  const isThisLoading = loadingProvider === p.name;
                  return (
                    <button
                      key={p.name}
                      disabled={loadingProvider !== null}
                      onClick={() => handleProviderClick(p.name, p.slug)}
                      className={`group w-full text-left flex items-center justify-between rounded-md border px-3 py-2.5 transition-colors outline-none ${
                        isThisLoading
                          ? "border-amber-500 bg-amber-50"
                          : p.best
                            ? "border-amber-300 bg-amber-50/60 hover:border-amber-400"
                            : "border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BrandLogo name={p.name} domain={p.domain} size={24} />
                        <div>
                          <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {p.name}
                            {isThisLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          </div>
                          <div className={`text-[10px] tabular-nums ${p.best ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                            {p.delta}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums text-foreground">{p.received}</div>
                        <div className="text-[10px] text-muted-foreground tracking-wider">ARS</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Link
                to="/compare"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#0F172A] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1e293b]"
              >
                {t("hero.mini.cta")} <ArrowRight className="h-3 w-3" />
              </Link>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {t("hero.alerts.title")}
                  </span>
                </div>
              </div>

              {/* Lead capture */}
              <div className="rounded-md border border-slate-200/60 bg-slate-50/60 p-3">
                {alertSubmitted ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 py-1">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t("hero.alerts.success")}</span>
                  </div>
                ) : (
                  <form onSubmit={handleRateAlertSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("hero.alerts.placeholder")}
                        className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingAlert}
                      className="rounded-md bg-[#0F172A] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#1e293b] disabled:opacity-50 whitespace-nowrap"
                    >
                      {submittingAlert ? t("hero.alerts.saving") : t("hero.alerts.button")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
