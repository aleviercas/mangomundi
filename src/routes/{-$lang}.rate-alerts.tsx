import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRouteSeo, useI18n, SUPPORTED_LANGS, coerceLang } from "@/lib/i18n";
import { hreflangLinks, selfCanonical } from "@/config/site";
import { localCurrency } from "@/lib/countries";
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { captureEnterpriseLead } from "@/lib/agent.functions";

const searchSchema = z.object({ lang: z.string().optional() }).catch({});

export const Route = createFileRoute("/{-$lang}/rate-alerts")({
  validateSearch: (search) => searchSchema.parse(search),
  // Mismo patrón que /favorites, /legal: ?lang=xx viejo → 301, params.lang
  // inválido → normaliza.
  beforeLoad: ({ params, search }) => {
    if (search.lang) {
      const q = search.lang.toLowerCase();
      const target = (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
      throw redirect({ to: "/{-$lang}/rate-alerts", params: { lang: target }, statusCode: 301 });
    }
    if (params.lang && !(SUPPORTED_LANGS as string[]).includes(params.lang)) {
      const q = params.lang.toLowerCase();
      const target = (SUPPORTED_LANGS as string[]).includes(q) && q !== "en" ? q : undefined;
      throw redirect({ to: "/{-$lang}/rate-alerts", params: { lang: target }, statusCode: 301 });
    }
  },
  head: ({ params }) => {
    const lang = coerceLang(params.lang ?? "en");
    const canonical = selfCanonical("/rate-alerts", lang);
    const seo = getRouteSeo(lang, "/rate-alerts");
    return {
      meta: [
        { title: seo.title },
        { name: "robots", content: "noindex, nofollow" },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }, ...hreflangLinks("/rate-alerts")],
    };
  },
  component: RateAlertsPage,
});

/** 2026-09-29 feedback — "arreglar lo de Rate alerts que el boton no me
 *  lleva a ninguna accion, hay que definir que deberia de hacer ese
 *  boton": el link del drawer apuntaba a "/" (home) porque la tarjeta de
 *  alerta real (RateAlertCard, en ComparatorSection.tsx) sólo aparece
 *  DESPUÉS de correr una comparación — aterrizar en home vacío no mostraba
 *  nada relacionado a alertas, exactamente el mismo link que "Individual".
 *  Esta página resuelve qué debería hacer el botón: da el corredor su
 *  propio mini-formulario (país origen/destino + monto, sin tener que
 *  comparar primero) y llama al mismo `captureEnterpriseLead` que ya usa
 *  RateAlertCard (featureSource "rate_alert") — mismo backend, mismo
 *  honestidad sobre qué hace hoy (guarda el interés, todavía no hay un
 *  monitor automático — ver el comment de RateAlertCard), nueva puerta de
 *  entrada que no depende de haber comparado antes. */
function RateAlertsPage() {
  const { t } = useI18n();
  const submit = useServerFn(captureEnterpriseLead);
  const [sendingCountry, setSendingCountry] = useState("");
  const [receivingCountry, setReceivingCountry] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const canSubmit = sendingCountry && receivingCountry && amount && email && !pending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(false);
    try {
      await submit({
        data: {
          email,
          featureSource: "rate_alert",
          consent: true,
          fromCurrency: localCurrency(sendingCountry),
          toCurrency: localCurrency(receivingCountry),
          sendingCountry,
          receivingCountry,
          amount: Number(amount),
        },
      });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 pt-[46px] pb-20 sm:px-8">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-h1">
        {t("footer.product.rateAlerts")}
      </h1>
      <p className="mt-4 text-base text-muted-foreground">{t("rateAlerts.subtitle")}</p>

      {done ? (
        <p className="mt-8 rounded-compact border border-border bg-card px-5 py-4 text-sm font-medium text-foreground">
          {t("comparator.rateAlert.success")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-badge font-semibold text-muted-foreground">
                {t("comparator.field.sourceCountry")}
              </label>
              <CountryCombobox value={sendingCountry} onChange={setSendingCountry} />
            </div>
            <div>
              <label className="mb-1 block text-badge font-semibold text-muted-foreground">
                {t("comparator.field.targetCountry")}
              </label>
              <CountryCombobox value={receivingCountry} onChange={setReceivingCountry} clearable />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-badge font-semibold text-muted-foreground">
              {t("comparator.field.amount")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-control border border-input bg-card px-3 py-2.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-badge font-semibold text-muted-foreground">
              {t("common.email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-control border border-input bg-card px-3 py-2.5 text-sm text-foreground"
            />
          </div>
          {error && <p className="text-badge text-destructive">{t("comparator.rateAlert.error")}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-cta-gradient w-full rounded-compact px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {t("comparator.rateAlert.cta")}
          </button>
        </form>
      )}
    </div>
  );
}
