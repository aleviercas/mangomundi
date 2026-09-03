import type { FxProvider, FxRatesPayload } from "./types";
import { ALL_FX_PROVIDERS } from "./fxProviders";
import { MasterRateStore } from "./MasterRateStore";

/**
 * ProviderFactory — coordinated round-robin + transparent fallback for FX
 * providers.
 *
 * Each call to `refreshRates()` advances a rotating cursor so the next refresh
 * starts on a different provider. This spreads quota consumption evenly across
 * upstreams (Frankfurter → exchangeratesapi.io → fixer.io → ...) instead of
 * exhausting a single one. If the chosen provider fails or is unavailable, the
 * factory falls through to the next provider in priority order and so on.
 *
 * Caching lives one layer up in `fx.functions.ts`, so the factory only runs on
 * an actual cache miss / TTL expiry — keeping per-provider request volume low.
 */
export class ProviderFactory {
  private providers: FxProvider[];
  private cursor = 0;
  /** Per-provider last-success timestamp, to honor `refreshIntervalMs`. */
  private lastSuccess = new Map<string, number>();

  constructor(providers: FxProvider[] = ALL_FX_PROVIDERS) {
    this.providers = [...providers].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Refresh rates. Starts on the next provider in the rotation and walks the
   * full list if needed. Honors each provider's `refreshIntervalMs` so we
   * skip a provider that was just hit successfully.
   */
  async refreshRates(): Promise<FxRatesPayload> {
    if (this.providers.length === 0) throw new Error("No FX providers configured");
    const errors: string[] = [];
    const now = Date.now();
    const start = this.cursor % this.providers.length;
    // Advance cursor for the next call BEFORE attempting, so even on success
    // the next refresh visits a different provider first.
    this.cursor = (this.cursor + 1) % this.providers.length;

    // Two passes: first respect refreshIntervalMs (skip cooling-down providers);
    // second pass ignores cooldown if every provider is cooling but we still
    // need fresh data. Within each pass we walk the full list once.
    for (const respectCooldown of [true, false]) {
      for (let i = 0; i < this.providers.length; i++) {
        const provider = this.providers[(start + i) % this.providers.length];
        if (!provider.isAvailable()) {
          if (respectCooldown) errors.push(`${provider.key}: unavailable (missing env)`);
          continue;
        }
        if (respectCooldown) {
          const last = this.lastSuccess.get(provider.key) ?? 0;
          if (last !== 0 && now - last < provider.refreshIntervalMs) {
            continue; // recently refreshed — give another provider a turn
          }
        }
        try {
          const payload = await provider.fetchRates();
          if (!payload.rates || Object.keys(payload.rates).length === 0) {
            throw new Error("empty rates payload");
          }
          this.lastSuccess.set(provider.key, Date.now());
          // UPSERT into the consolidated MasterRateMap. Additive — does not
          // alter rotation, re-basing, or fallback above. Pairs missing from
          // this payload are retained from previous fetches.
          MasterRateStore.upsertRates({
            base: payload.base,
            rates: payload.rates,
            source: payload.source,
            fetchedAt: payload.fetchedAt,
          });
          return payload;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[fx-provider] ${provider.key} failed:`, msg);
          errors.push(`${provider.key}: ${msg}`);
        }
      }
    }

    throw new Error(`All FX providers failed: ${errors.join(" | ")}`);
  }

  listProviders(): Array<Pick<FxProvider, "key" | "label" | "priority">> {
    return this.providers.map(({ key, label, priority }) => ({ key, label, priority }));
  }

  /**
   * Refresh and return rates merged with the MasterRateMap. Pairs absent
   * from the live fetch are filled in with last-known prices from the master
   * cache and flagged as `reference` so the UI can label them as non-live.
   *
   * If the live fetch fails entirely, falls back to the master snapshot.
   */
  async refreshAndMerge(): Promise<{
    rates: Record<string, number>;
    referenceCodes: Set<string>;
    base: string;
    fetchedAt: string;
    source: string;
  }> {
    let payload: FxRatesPayload | null = null;
    try {
      payload = await this.refreshRates();
    } catch (err) {
      const master = MasterRateStore.getMaster();
      if (Object.keys(master.rates).length === 0) throw err;
      const rates: Record<string, number> = {};
      const refs = new Set<string>();
      for (const [code, e] of Object.entries(master.rates)) {
        rates[code] = e.rate;
        refs.add(code);
      }
      const newest = Object.values(master.rates).reduce((m, e) => Math.max(m, e.updatedAt), 0);
      return {
        rates,
        referenceCodes: refs,
        base: master.base,
        fetchedAt: new Date(newest || Date.now()).toISOString(),
        source: "master-cache",
      };
    }

    const live = new Set(Object.keys(payload.rates).map((c) => c.toUpperCase()));
    const merged: Record<string, number> = { ...payload.rates };
    const refs = new Set<string>();
    for (const [code, entry] of Object.entries(MasterRateStore.getMaster().rates)) {
      if (!live.has(code)) {
        merged[code] = entry.rate;
        refs.add(code);
      }
    }
    return {
      rates: merged,
      referenceCodes: refs,
      base: payload.base,
      fetchedAt: payload.fetchedAt,
      source: payload.source,
    };
  }
}

// Singleton — reused across server-function invocations within a worker so the
// round-robin cursor and per-provider cooldown state persist between calls.
export const fxProviderFactory = new ProviderFactory();
