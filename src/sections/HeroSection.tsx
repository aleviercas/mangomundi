import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, Shield, Zap, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client"; // Cliente auto-configurado

export function HeroSection() {
  const { t } = useI18n();

  // Estados locales para la UX del simulador y formulario
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [submittingAlert, setSubmittingAlert] = useState(false);

  // 1. Manejador de clics y tracking de afiliados
  const handleProviderClick = async (providerName: string) => {
    if (loadingProvider) return; // Evitar doble clic
    setLoadingProvider(providerName);

    const sourceCurrency = "GBP";
    const targetCurrency = "ARS";
    const amount = 1000;

    // Diccionario de tus enlaces comerciales de afiliación (Placeholders reales)
    const affiliateLinks: Record<string, string> = {
      "Wise": "https://wise.evyy.net/c/PLACEHOLDER/123456/8003",
      "Revolut": "https://revolut.pxf.io/c/PLACEHOLDER/111222/8004",
      "Western Union": "https://westernunion.pxf.io/c/PLACEHOLDER/333444/8005",
      "PayPal Xoom": "https://xoom.pxf.io/c/PLACEHOLDER/555666/8006",
    };

    const targetUrl = affiliateLinks[providerName] || "https://wise.com";

    // Mecanismo de Carrera (Race Condition / Timeout Fallback)
    // Si Supabase tarda más de 1.2 segundos, el fallback abre el enlace directo para no arruinar la UX
    let trackingCompleted = false;

    const fallbackTimeout = setTimeout(() => {
      if (!trackingCompleted) {
        trackingCompleted = true;
        console.warn("Supabase timeout: Redirigiendo por fallback de velocidad.");
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    }, 1200);

    try {
      // Registrar el evento en la tabla clicks_tracking
      const { data, error } = await supabase
        .from("clicks_tracking")
        .insert([
          {
            provider: providerName,
            source_currency: sourceCurrency,
            target_currency: targetCurrency,
            amount: amount,
            status: "pending",
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      // Si todo sale bien, cancelamos el timeout de emergencia e inyectamos el subId1
      if (!trackingCompleted) {
        clearTimeout(fallbackTimeout);
        trackingCompleted = true;
        
        const trackingUrl = `${targetUrl}?subId1=${data.id}`;
        window.open(trackingUrl, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    } catch (err) {
      console.error("Error guardando el tracking de clic:", err);
      if (!trackingCompleted) {
        clearTimeout(fallbackTimeout);
        trackingCompleted = true;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setLoadingProvider(null);
      }
    }
  };

  // 2. Manejador del Formulario de Alertas de Tasas (Leads)
  const handleRateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submittingAlert) return;

    setSubmittingAlert(true);
    try {
      const { error } = await supabase
        .from("rate_alerts")
        .insert([
          {
            email: email,
            source_currency: "GBP",
            target_currency: "ARS",
          },
        ]);

      if (error) throw error;
      setAlertSubmitted(true);
      setEmail("");
    } catch (err) {
      console.error("Error guardando alerta de tasa:", err);
    } finally {
      setSubmittingAlert(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24 lg:pt-24 lg:pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.70_0.175_55)_0%,_transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.88_0.13_85)_0%,_transparent_50%)] opacity-5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* Bloque Izquierdo: Textos principales */}
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

          {/* Bloque Derecho: Widget Interactivo */}
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{t("hero.mini.live")}</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">1,000 GBP → ARS</span>
              </div>

              {/* Lista Dinámica e Interactiva de Brokers */}
              <div className="space-y-2">
                {[
                  { name: "Wise", domain: "wise.com", received: "1,242,180", delta: t("hero.mini.best"), best: true },
                  { name: "Revolut", domain: "revolut.com", received: "1,238,940", delta: "-0.26%", best: false },
                  { name: "Western Union", domain: "westernunion.com", received: "1,219,500", delta: "-1.83%", best: false },
                  { name: "PayPal Xoom", domain: "xoom.com", received: "1,201,330", delta: "-3.28%", best: false },
                ].map((p) => {
                  const isThisLoading = loadingProvider === p.name;
                  return (
                    <button
                      key={p.name}
                      disabled={loadingProvider !== null}
                      onClick={() => handleProviderClick(p.name)}
                      className={`w-full text-left flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all outline-none ${
                        isThisLoading 
                          ? "border-primary bg-primary/10 scale-[0.99] opacity-80" 
                          : p.best 
                            ? "border-primary/40 bg-primary/[0.06] hover:bg-primary/[0.1] hover:scale-[1.01]" 
                            : "border-border bg-background/50 hover:bg-background hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BrandLogo name={p.name} domain={p.domain} size={24} />
                        <div>
                          <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {p.name}
                            {isThisLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          </div>
                          <div className={`text-[10px] ${p.best ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                            {isThisLoading ? "Congelando tasa óptima..." : p.delta}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tabular-nums text-foreground">{p.received}</div>
                        <div className="text-[10px] text-muted-foreground">ARS</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Link
                to="/compare"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-foreground py-2.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                {t("hero.mini.cta")} <ArrowRight className="h-3 w-3" />
              </Link>

              {/* Divisor Visual Minimalista */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground tracking-wider font-medium">Alertas Inteligentes</span>
                </div>
              </div>

              {/* Formulario de Captura de Leads (Emails) */}
              <div className="rounded-xl bg-background/40 border border-border/40 p-3">
                {alertSubmitted ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium py-1">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>¡Alerta activada! Te avisaremos cuando suba el tipo de cambio.</span>
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
                        placeholder="Tu email (ej: gbp a ars)"
                        className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingAlert}
                      className="rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                    >
                      {submittingAlert ? "Guardando..." : "Alertarme"}
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