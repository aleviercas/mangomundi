/**
 * MasterRateStore — consolidated rate cache (the "MasterRateMap") and
 * "MissingCorridorsLog" for currency pairs we couldn't price.
 *
 * Persists to `localStorage` when available (browser) and falls back to an
 * in-memory store on the server (SSR / worker). This is additive on top of the
 * round-robin provider rotation in ProviderFactory: every successful refresh
 * UPSERTS into the master map; rates not seen in the current fetch are
 * RETAINED (last-known-good) instead of being pruned.
 */

const RATES_KEY = "mm.fx.masterRates.v1";
const MISSING_KEY = "mm.fx.missingCorridors.v1";

export interface MasterRateEntry {
  /** Rate relative to `base` (default USD). */
  rate: number;
  /** ms epoch when this pair was last seen live. */
  updatedAt: number;
  /** Provider key that produced the rate. */
  source: string;
}

export interface MasterRateMap {
  base: string;
  rates: Record<string, MasterRateEntry>;
}

export interface MissingCorridorEntry {
  from: string;
  to: string;
  count: number;
  lastAt: number;
  acknowledged?: boolean;
}

type Listener = () => void;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — ignore */
  }
}

// In-memory mirror (always present; localStorage hydrates into this).
let memMaster: MasterRateMap = readJSON<MasterRateMap>(RATES_KEY, { base: "USD", rates: {} });
let memMissing: MissingCorridorEntry[] = readJSON<MissingCorridorEntry[]>(MISSING_KEY, []);
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

export const MasterRateStore = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  getMaster(): MasterRateMap {
    return memMaster;
  },

  getMissing(): MissingCorridorEntry[] {
    return memMissing;
  },

  /**
   * UPSERT new rates into the master map. Pairs absent from `incoming` are
   * NOT pruned — last-known prices are retained, which is what the
   * comparator falls back to when a provider goes dark.
   */
  upsertRates(payload: {
    base: string;
    rates: Record<string, number>;
    source: string;
    fetchedAt?: string;
  }): MasterRateMap {
    const ts = payload.fetchedAt ? Date.parse(payload.fetchedAt) || Date.now() : Date.now();
    const next: MasterRateMap = {
      base: payload.base || memMaster.base || "USD",
      rates: { ...memMaster.rates },
    };
    for (const [code, rate] of Object.entries(payload.rates)) {
      if (!Number.isFinite(rate) || rate <= 0) continue;
      next.rates[code.toUpperCase()] = {
        rate,
        updatedAt: ts,
        source: payload.source,
      };
    }
    memMaster = next;
    writeJSON(RATES_KEY, memMaster);
    emit();
    return memMaster;
  },

  /**
   * Hydrate the store from a server payload (used by the client after a
   * server fn returns the worker-side master map). Merges, never replaces.
   */
  hydrate(remote: MasterRateMap | null | undefined): void {
    if (!remote || !remote.rates) return;
    const merged: MasterRateMap = {
      base: remote.base || memMaster.base || "USD",
      rates: { ...memMaster.rates },
    };
    for (const [code, entry] of Object.entries(remote.rates)) {
      const existing = merged.rates[code];
      if (!existing || existing.updatedAt < entry.updatedAt) merged.rates[code] = entry;
    }
    memMaster = merged;
    writeJSON(RATES_KEY, memMaster);
    emit();
  },

  /**
   * Look up a rate for a currency code from the master cache.
   * Returns `null` when the pair has never been observed.
   */
  getRate(code: string): MasterRateEntry | null {
    return memMaster.rates[code.toUpperCase()] ?? null;
  },

  /** Log a missing currency pair for crowdsourced corridor discovery. */
  logMissing(from: string, to: string): MissingCorridorEntry {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    const idx = memMissing.findIndex((m) => m.from === f && m.to === t);
    if (idx >= 0) {
      const entry = { ...memMissing[idx], count: memMissing[idx].count + 1, lastAt: Date.now() };
      memMissing = [...memMissing.slice(0, idx), entry, ...memMissing.slice(idx + 1)];
    } else {
      memMissing = [...memMissing, { from: f, to: t, count: 1, lastAt: Date.now() }];
    }
    writeJSON(MISSING_KEY, memMissing);
    emit();
    return memMissing.find((m) => m.from === f && m.to === t)!;
  },

  acknowledgeMissing(from: string, to: string): void {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    memMissing = memMissing.map((m) =>
      m.from === f && m.to === t ? { ...m, acknowledged: true } : m,
    );
    writeJSON(MISSING_KEY, memMissing);
    emit();
  },
};
