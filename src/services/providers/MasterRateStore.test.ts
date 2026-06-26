/**
 * MasterRateStore unit tests.
 *
 * Verifies the two invariants the "Autonomous Intelligence" architecture
 * relies on:
 *   a) UPSERT — new rates merge into the master map with the v2 payload shape.
 *   b) RETENTION — pairs absent from a later fetch are NOT pruned (last-known
 *      price persists so the comparator can fall back to it).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MasterRateStore } from "./MasterRateStore";

function clearStore() {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("mm.fx.masterRates.v1");
      localStorage.removeItem("mm.fx.missingCorridors.v1");
    } catch {
      /* ignore */
    }
  }
  // Re-seed by writing an empty map so the in-memory mirror resets too.
  MasterRateStore.upsertRates({ base: "USD", rates: {}, source: "test:init" });
}

describe("MasterRateStore", () => {
  beforeEach(clearStore);
  afterEach(clearStore);

  it("upserts rates from a Frankfurter v2-shaped payload", () => {
    const map = MasterRateStore.upsertRates({
      base: "USD",
      rates: { EUR: 0.92, GBP: 0.78, ARS: 1010.5 },
      source: "frankfurter",
      fetchedAt: "2026-06-26T00:00:00Z",
    });
    expect(map.base).toBe("USD");
    expect(map.rates.EUR.rate).toBeCloseTo(0.92);
    expect(map.rates.GBP.rate).toBeCloseTo(0.78);
    expect(map.rates.ARS.rate).toBeCloseTo(1010.5);
    expect(map.rates.EUR.source).toBe("frankfurter");
    expect(map.rates.EUR.updatedAt).toBe(Date.parse("2026-06-26T00:00:00Z"));
  });

  it("retains prices for currencies missing from a later fetch", () => {
    MasterRateStore.upsertRates({
      base: "USD",
      rates: { EUR: 0.92, GBP: 0.78, ARS: 1010.5 },
      source: "frankfurter",
    });
    // Second fetch only returns EUR — GBP and ARS must be retained.
    MasterRateStore.upsertRates({
      base: "USD",
      rates: { EUR: 0.93 },
      source: "fixer-io",
    });
    const map = MasterRateStore.getMaster();
    expect(map.rates.EUR.rate).toBeCloseTo(0.93);
    expect(map.rates.EUR.source).toBe("fixer-io");
    expect(map.rates.GBP?.rate).toBeCloseTo(0.78);
    expect(map.rates.ARS?.rate).toBeCloseTo(1010.5);
  });

  it("logs and counts missing corridors", () => {
    MasterRateStore.logMissing("usd", "xof");
    MasterRateStore.logMissing("USD", "XOF");
    const all = MasterRateStore.getMissing();
    const entry = all.find((m) => m.from === "USD" && m.to === "XOF");
    expect(entry?.count).toBe(2);
  });

  it("ignores non-finite or non-positive rates", () => {
    MasterRateStore.upsertRates({
      base: "USD",
      rates: { EUR: 0.92, BAD: 0, WORSE: Number.NaN, NEG: -1 },
      source: "frankfurter",
    });
    const map = MasterRateStore.getMaster();
    expect(map.rates.EUR).toBeDefined();
    expect(map.rates.BAD).toBeUndefined();
    expect(map.rates.WORSE).toBeUndefined();
    expect(map.rates.NEG).toBeUndefined();
  });
});
