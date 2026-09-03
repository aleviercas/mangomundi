import type { FxProvider, FxRatesPayload } from "./types";
import { FX_PROVIDERS } from "@/config/providers.config";

const cfg = (key: string) => {
  const found = FX_PROVIDERS.find((p) => p.key === key);
  if (!found) throw new Error(`FX provider config missing: ${key}`);
  return found;
};

/**
 * Re-base an EUR-quoted rate map to USD so every provider returns a uniform
 * USD-based payload. The comparator works off relative pairs, so the base just
 * has to be consistent across cached snapshots.
 */
function rebaseToUsd(
  ratesEurBased: Record<string, number>,
  originalBase: string,
): { rates: Record<string, number>; base: string } {
  const eurToUsd = ratesEurBased.USD;
  if (!eurToUsd || eurToUsd <= 0) {
    // Can't re-base safely — return as-is so the factory still has something.
    return { rates: { ...ratesEurBased, [originalBase]: 1 }, base: originalBase };
  }
  const rebased: Record<string, number> = {};
  for (const [code, eurRate] of Object.entries(ratesEurBased)) {
    rebased[code] = eurRate / eurToUsd;
  }
  rebased[originalBase] = 1 / eurToUsd; // EUR expressed in USD-base
  rebased.USD = 1;
  return { rates: rebased, base: "USD" };
}

// ---------- Frankfurter v2 (free, open-source, no key) ----------
const frankfurterConfig = cfg("frankfurter");

/**
 * Base URL for the Frankfurter v2 API. Defaults to the public endpoint but
 * can be overridden (e.g. to a self-hosted Docker instance) via the
 * `VITE_FRANKFURTER_URL` env var — read in a Worker-safe way.
 */
const FRANKFURTER_BASE: string =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_FRANKFURTER_URL) ||
  process.env.VITE_FRANKFURTER_URL ||
  "https://api.frankfurter.dev/v2";

export const frankfurterProvider: FxProvider = {
  key: frankfurterConfig.key,
  label: frankfurterConfig.label,
  priority: frankfurterConfig.priority,
  refreshIntervalMs: frankfurterConfig.refreshIntervalMs,
  isAvailable: () => true,
  async fetchRates(): Promise<FxRatesPayload> {
    // v2/rates with USD base — returns a full quote map.
    const url = `${FRANKFURTER_BASE}/rates?base=USD`;
    console.log("[fx-provider] frankfurter v2 GET", url);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[fx-provider] frankfurter v2 failed", res.status, res.statusText);
      throw new Error(`frankfurter ${res.status}`);
    }
    const json = (await res.json()) as {
      base?: string;
      date?: string;
      rates: Record<string, number>;
    };
    const base = json.base ?? "USD";
    return {
      rates: { ...json.rates, [base]: 1 },
      base,
      fetchedAt: json.date
        ? new Date(`${json.date}T00:00:00Z`).toISOString()
        : new Date().toISOString(),
      source: frankfurterConfig.key,
    };
  },
};

/**
 * Fetch the canonical list of currency codes supported by Frankfurter v2.
 * Used to validate user input before triggering a comparison call.
 */
export async function fetchFrankfurterCurrencies(): Promise<string[]> {
  const url = `${FRANKFURTER_BASE}/currencies`;
  console.log("[fx-provider] frankfurter v2 currencies", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frankfurter currencies ${res.status}`);
  const json = (await res.json()) as Record<string, string>;
  return Object.keys(json).map((c) => c.toUpperCase());
}

/**
 * Fetch a single conversion using `/v2/rate/{base}/{quote}`. Useful for
 * one-off lookups outside the bulk comparator flow.
 */
export async function fetchFrankfurterRate(
  base: string,
  quote: string,
): Promise<{ rate: number; date?: string } | null> {
  const url = `${FRANKFURTER_BASE}/rate/${base.toUpperCase()}/${quote.toUpperCase()}`;
  console.log("[fx-provider] frankfurter v2 rate", url);
  const res = await fetch(url);
  if (res.status === 404) {
    console.warn("[fx-provider] frankfurter v2 rate missing", base, quote);
    return null;
  }
  if (!res.ok) throw new Error(`frankfurter rate ${res.status}`);
  const json = (await res.json()) as { rate?: number; date?: string };
  if (typeof json.rate !== "number") return null;
  return { rate: json.rate, date: json.date };
}

// ---------- exchangeratesapi.io (free tier: EUR base, HTTP) ----------
const erApiIoConfig = cfg("exchangeratesapi-io");

export const exchangeRatesApiIoProvider: FxProvider = {
  key: erApiIoConfig.key,
  label: erApiIoConfig.label,
  priority: erApiIoConfig.priority,
  refreshIntervalMs: erApiIoConfig.refreshIntervalMs,
  isAvailable: () => Boolean(process.env.EXCHANGERATESAPI_IO_KEY),
  async fetchRates(): Promise<FxRatesPayload> {
    const key = process.env.EXCHANGERATESAPI_IO_KEY;
    if (!key) throw new Error("EXCHANGERATESAPI_IO_KEY not configured");
    const res = await fetch(`http://api.exchangeratesapi.io/v1/latest?access_key=${key}`);
    if (!res.ok) throw new Error(`exchangeratesapi.io ${res.status}`);
    const json = (await res.json()) as {
      success?: boolean;
      base: string;
      date: string;
      timestamp?: number;
      rates: Record<string, number>;
      error?: { info?: string };
    };
    if (json.success === false) {
      throw new Error(`exchangeratesapi.io error: ${json.error?.info ?? "unknown"}`);
    }
    const { rates, base } = rebaseToUsd(json.rates, json.base);
    return {
      rates,
      base,
      fetchedAt: json.timestamp
        ? new Date(json.timestamp * 1000).toISOString()
        : new Date(`${json.date}T00:00:00Z`).toISOString(),
      source: erApiIoConfig.key,
    };
  },
};

// ---------- Fixer.io (free tier: EUR base, HTTP) ----------
const fixerConfig = cfg("fixer-io");

export const fixerIoProvider: FxProvider = {
  key: fixerConfig.key,
  label: fixerConfig.label,
  priority: fixerConfig.priority,
  refreshIntervalMs: fixerConfig.refreshIntervalMs,
  isAvailable: () => Boolean(process.env.FIXER_IO_KEY),
  async fetchRates(): Promise<FxRatesPayload> {
    const key = process.env.FIXER_IO_KEY;
    if (!key) throw new Error("FIXER_IO_KEY not configured");
    const res = await fetch(`http://data.fixer.io/api/latest?access_key=${key}`);
    if (!res.ok) throw new Error(`fixer.io ${res.status}`);
    const json = (await res.json()) as {
      success?: boolean;
      base: string;
      date: string;
      timestamp?: number;
      rates: Record<string, number>;
      error?: { info?: string };
    };
    if (json.success === false) {
      throw new Error(`fixer.io error: ${json.error?.info ?? "unknown"}`);
    }
    const { rates, base } = rebaseToUsd(json.rates, json.base);
    return {
      rates,
      base,
      fetchedAt: json.timestamp
        ? new Date(json.timestamp * 1000).toISOString()
        : new Date(`${json.date}T00:00:00Z`).toISOString(),
      source: fixerConfig.key,
    };
  },
};

// ---------- Open Exchange Rates ----------
const openExchangeConfig = cfg("openexchangerates");

export const openExchangeProvider: FxProvider = {
  key: openExchangeConfig.key,
  label: openExchangeConfig.label,
  priority: openExchangeConfig.priority,
  refreshIntervalMs: openExchangeConfig.refreshIntervalMs,
  isAvailable: () => Boolean(process.env.OPENEXCHANGE_APP_ID),
  async fetchRates(): Promise<FxRatesPayload> {
    const appId = process.env.OPENEXCHANGE_APP_ID;
    if (!appId) throw new Error("OPENEXCHANGE_APP_ID not configured");
    const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${appId}`);
    if (!res.ok) throw new Error(`openexchangerates ${res.status}`);
    const json = (await res.json()) as {
      base: string;
      rates: Record<string, number>;
      timestamp?: number;
    };
    return {
      rates: json.rates,
      base: json.base,
      fetchedAt: json.timestamp
        ? new Date(json.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      source: openExchangeConfig.key,
    };
  },
};

// ---------- ExchangeRate-API (open endpoint, no key) ----------
const erApiConfig = cfg("exchangerate-api");

export const exchangeRateApiProvider: FxProvider = {
  key: erApiConfig.key,
  label: erApiConfig.label,
  priority: erApiConfig.priority,
  refreshIntervalMs: erApiConfig.refreshIntervalMs,
  isAvailable: () => true,
  async fetchRates(): Promise<FxRatesPayload> {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error(`exchangerate-api ${res.status}`);
    const json = (await res.json()) as {
      result: string;
      base_code: string;
      rates: Record<string, number>;
      time_last_update_unix?: number;
    };
    if (json.result !== "success") throw new Error("exchangerate-api non-success");
    return {
      rates: json.rates,
      base: json.base_code,
      fetchedAt: json.time_last_update_unix
        ? new Date(json.time_last_update_unix * 1000).toISOString()
        : new Date().toISOString(),
      source: erApiConfig.key,
    };
  },
};

export const ALL_FX_PROVIDERS: FxProvider[] = [
  frankfurterProvider,
  exchangeRatesApiIoProvider,
  fixerIoProvider,
  openExchangeProvider,
  exchangeRateApiProvider,
].sort((a, b) => a.priority - b.priority);
