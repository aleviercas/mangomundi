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

// ---------- Frankfurter (free, open-source, no key) ----------
const frankfurterConfig = cfg("frankfurter");

export const frankfurterProvider: FxProvider = {
  key: frankfurterConfig.key,
  label: frankfurterConfig.label,
  priority: frankfurterConfig.priority,
  refreshIntervalMs: frankfurterConfig.refreshIntervalMs,
  isAvailable: () => true,
  async fetchRates(): Promise<FxRatesPayload> {
    // frankfurter.dev is the open-source successor to frankfurter.app.
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD");
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const json = (await res.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };
    return {
      rates: { ...json.rates, [json.base]: 1 },
      base: json.base,
      fetchedAt: new Date(`${json.date}T00:00:00Z`).toISOString(),
      source: frankfurterConfig.key,
    };
  },
};

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
