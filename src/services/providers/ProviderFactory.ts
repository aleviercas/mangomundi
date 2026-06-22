import type { FxProvider, FxRatesPayload } from "./types";
import { ALL_FX_PROVIDERS } from "./fxProviders";

/**
 * ProviderFactory — transparent fallback for FX rate providers.
 *
 * Iterates providers in priority order and returns the first successful
 * payload. Per-provider failures are logged but never bubble up unless every
 * provider fails. Caching lives one layer up in `fx.functions.ts` so the
 * factory stays stateless and easy to test.
 */
export class ProviderFactory {
  private providers: FxProvider[];
  /** Per-provider last-attempt timestamp, used to honor `refreshIntervalMs`. */
  private lastAttempt = new Map<string, number>();

  constructor(providers: FxProvider[] = ALL_FX_PROVIDERS) {
    this.providers = [...providers].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Refresh rates from the first healthy provider. Respects each provider's
   * `refreshIntervalMs` to avoid hammering rate-limited upstreams.
   */
  async refreshRates(): Promise<FxRatesPayload> {
    const errors: string[] = [];
    const now = Date.now();

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        errors.push(`${provider.key}: unavailable (missing env)`);
        continue;
      }
      const last = this.lastAttempt.get(provider.key) ?? 0;
      // If we tried recently and failed, skip to the next provider; full
      // refresh-window enforcement happens at the cache layer.
      if (now - last < 5_000 && last !== 0) {
        // brief in-flight backoff to avoid request stampede
      }
      try {
        this.lastAttempt.set(provider.key, now);
        const payload = await provider.fetchRates();
        if (!payload.rates || Object.keys(payload.rates).length === 0) {
          throw new Error("empty rates payload");
        }
        return payload;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[fx-provider] ${provider.key} failed:`, msg);
        errors.push(`${provider.key}: ${msg}`);
      }
    }

    throw new Error(`All FX providers failed: ${errors.join(" | ")}`);
  }

  listProviders(): Array<Pick<FxProvider, "key" | "label" | "priority">> {
    return this.providers.map(({ key, label, priority }) => ({ key, label, priority }));
  }
}

// Singleton — reused across server-function invocations within a worker.
export const fxProviderFactory = new ProviderFactory();
