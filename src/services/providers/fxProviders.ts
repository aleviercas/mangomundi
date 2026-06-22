import type { FxProvider, FxRatesPayload } from "./types";
import { FX_PROVIDERS } from "@/config/providers.config";

// ---------- Open Exchange Rates ----------
const openExchangeConfig = FX_PROVIDERS.find((p) => p.key === "openexchangerates")!;

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

// ---------- Frankfurter (free, ECB-backed) ----------
const frankfurterConfig = FX_PROVIDERS.find((p) => p.key === "frankfurter")!;

export const frankfurterProvider: FxProvider = {
  key: frankfurterConfig.key,
  label: frankfurterConfig.label,
  priority: frankfurterConfig.priority,
  refreshIntervalMs: frankfurterConfig.refreshIntervalMs,
  isAvailable: () => true,
  async fetchRates(): Promise<FxRatesPayload> {
    // Frankfurter is EUR-based; we re-base to USD for consistency with other
    // providers. If USD isn't returned, we fall back to EUR base.
    const res = await fetch("https://api.frankfurter.app/latest?from=USD");
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

// ---------- ExchangeRate-API (open endpoint, no key) ----------
const erApiConfig = FX_PROVIDERS.find((p) => p.key === "exchangerate-api")!;

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
  openExchangeProvider,
  frankfurterProvider,
  exchangeRateApiProvider,
].sort((a, b) => a.priority - b.priority);
