/** Shared types for the FX provider abstraction. */

export interface FxRatesPayload {
  /** Map of ISO currency code → rate relative to `base`. */
  rates: Record<string, number>;
  /** Base currency (typically "USD"). */
  base: string;
  /** ISO timestamp when the upstream produced these rates. */
  fetchedAt: string;
  /** Which provider key actually served this payload. */
  source: string;
}

export interface FxProvider {
  key: string;
  label: string;
  priority: number;
  refreshIntervalMs: number;
  /** Returns true if the provider can be called right now (env present, etc). */
  isAvailable(): boolean;
  /** Fetches a fresh rate snapshot. Must throw on failure so the factory falls back. */
  fetchRates(): Promise<FxRatesPayload>;
}
