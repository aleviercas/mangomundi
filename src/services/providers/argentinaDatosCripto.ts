/**
 * ARS "dólar cripto" reference rate — for the crypto-bridge comparator
 * feature only (Delivery method: "crypto"). NOT part of the general
 * FX_PROVIDERS fallback chain in providers.config.ts / fxProviders.ts:
 * those providers each return a FULL multi-currency rate map and are
 * swapped in wholesale on failure (see FxProvider.fetchRates in
 * ./types.ts) — api.argentinadatos.com only knows ARS, so plugging it
 * into that chain would silently break every non-ARS corridor if it ever
 * became the active provider. This is a narrow, single-purpose lookup
 * used only to compute the informational "≈ X ARS al tipo de hoy" line
 * for crypto-bridge rows, never for the general comparator's mid-market
 * math.
 *
 * Source: docs/data-sources/2026-09-11-arquitectura-fuentes-tasas-cripto.md
 * (found api.argentinadatos.com has a "cripto" casa as a standard,
 * publicly-documented category — fresher and more reliable than
 * dolarapi.com, which was found stale by ~6 days on 2026-09-11) and
 * docs/data-sources/2026-09-15-plan-implementacion-badge-ars-cripto.md
 * §2.2 (do not conflate "cripto" with "oficial"/"blue"/other casas — each
 * serves a different purpose).
 */

const ARGENTINADATOS_BASE = "https://api.argentinadatos.com/v1/cotizaciones/dolares";

interface ArgentinaDatosCotizacion {
  casa: string;
  compra: number;
  venta: number;
  fecha: string;
}

export interface CriptoArsRate {
  /** ARS per 1 USD-equivalent, "compra" side (what a seller of crypto gets). */
  compra: number;
  /** ARS per 1 USD-equivalent, "venta" side (what a buyer of crypto pays). */
  venta: number;
  /** ISO date string as reported by the source (not a full timestamp — the
   *  API reports daily granularity). */
  fecha: string;
}

/**
 * Fetches today's "dólar cripto" reference from api.argentinadatos.com.
 * Throws on any failure — callers must catch and fall back to *not*
 * showing the estimated-ARS line rather than showing a stale or wrong
 * number (same principle applied throughout this project's research:
 * never present an estimate with more confidence than it has).
 */
export async function fetchCriptoArsRate(): Promise<CriptoArsRate> {
  const url = `${ARGENTINADATOS_BASE}/cripto`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`argentinadatos cripto ${res.status}`);
  }
  const json = (await res.json()) as ArgentinaDatosCotizacion[];
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("argentinadatos cripto: empty response");
  }
  // The endpoint returns the full historical series, oldest first — the
  // last entry is the most recent.
  const latest = json[json.length - 1];
  if (!latest || typeof latest.venta !== "number" || typeof latest.compra !== "number") {
    throw new Error("argentinadatos cripto: malformed latest entry");
  }
  return { compra: latest.compra, venta: latest.venta, fecha: latest.fecha };
}
