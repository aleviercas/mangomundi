import { describe, expect, it } from "vitest";
import {
  SCORE_PROFILES,
  computeCompositeScores,
  sortByScore,
  deriveBadges,
  auditProviderChances,
  pickFeaturedAmongTies,
  getTrustTrend,
  flagDecliningProviders,
  type ScorableRow,
  type BadgeKey,
} from "./scoring.functions";

describe("SCORE_PROFILES", () => {
  it("every profile's weights sum to 1.0", () => {
    for (const [key, weights] of Object.entries(SCORE_PROFILES)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum, `profile "${key}" weights should sum to 1.0`).toBeCloseTo(1.0, 5);
    }
  });
});

const rows: ScorableRow[] = [
  {
    slug: "cheapest",
    received: 1000,
    rate_vs_market_pct: -0.5,
    fee_total: 1,
    speed_hours: 48,
    trust_score: 3.5,
    transparency_score: 6,
    supports_large_tickets: false,
    business_focus_score: null,
    cash_pickup_available: false,
    countries_covered: 20,
    has_exclusive_deal: false,
  },
  {
    slug: "fastest",
    received: 990,
    rate_vs_market_pct: -0.3,
    fee_total: 5,
    speed_hours: 1,
    trust_score: 4.0,
    transparency_score: 5,
    supports_large_tickets: false,
    business_focus_score: null,
    cash_pickup_available: false,
    countries_covered: 30,
    has_exclusive_deal: false,
  },
  {
    slug: "most_trusted",
    received: 985,
    rate_vs_market_pct: -0.1,
    fee_total: 6,
    speed_hours: 24,
    trust_score: 4.8,
    transparency_score: 7,
    supports_large_tickets: false,
    business_focus_score: 8,
    cash_pickup_available: true,
    countries_covered: 50,
    has_exclusive_deal: false,
  },
  {
    slug: "most_transparent",
    received: 980,
    rate_vs_market_pct: 0.05,
    fee_total: 7,
    speed_hours: 30,
    trust_score: 4.1,
    transparency_score: 10,
    supports_large_tickets: true,
    business_focus_score: 4,
    cash_pickup_available: false,
    countries_covered: 25,
    has_exclusive_deal: false,
  },
  {
    slug: "deal_provider",
    received: 970,
    rate_vs_market_pct: -0.8,
    fee_total: 8,
    speed_hours: 36,
    trust_score: 3.9,
    transparency_score: 4,
    supports_large_tickets: false,
    business_focus_score: null,
    cash_pickup_available: false,
    countries_covered: 15,
    has_exclusive_deal: true,
  },
];

describe("computeCompositeScores / sortByScore", () => {
  it("recipient_gets_most profile ranks the highest received amount first", () => {
    expect(sortByScore(rows, "recipient_gets_most")[0].slug).toBe("cheapest");
  });

  it("lowest_cost profile ranks the lowest fee_total first (not the highest received)", () => {
    expect(sortByScore(rows, "lowest_cost")[0].slug).toBe("cheapest");
  });

  it("best_exchange_rate profile ranks the closest-to-mid-market rate first, independent of fee", () => {
    // most_transparent has the best rate_vs_market_pct (0.05) but is NOT the
    // cheapest by fee_total — proves fee and exchange rate are genuinely
    // separate dimensions now, not the same thing wearing two labels.
    expect(sortByScore(rows, "best_exchange_rate")[0].slug).toBe("most_transparent");
  });

  it("fastest profile ranks the fastest provider first", () => {
    expect(sortByScore(rows, "fastest")[0].slug).toBe("fastest");
  });

  it("most_trusted profile ranks the highest trust_score first", () => {
    expect(sortByScore(rows, "most_trusted")[0].slug).toBe("most_trusted");
  });

  it("most_transparent profile ranks the highest transparency_score first", () => {
    expect(sortByScore(rows, "most_transparent")[0].slug).toBe("most_transparent");
  });

  it("best_large_transfers profile favors the provider that supports large tickets", () => {
    expect(sortByScore(rows, "best_large_transfers")[0].slug).toBe("most_transparent");
  });

  it("best_deal profile ranks the provider with has_exclusive_deal first", () => {
    expect(sortByScore(rows, "best_deal")[0].slug).toBe("deal_provider");
  });

  it("best_deal never wins on providers without an exclusive deal, and never leaks into overall", () => {
    const overallSorted = sortByScore(rows, "overall");
    expect(overallSorted[0].slug).not.toBe("deal_provider");
  });

  it("different profiles can surface different #1 providers for the same data", () => {
    const winners = new Set(
      (
        [
          "lowest_cost",
          "best_exchange_rate",
          "fastest",
          "most_trusted",
          "most_transparent",
          "best_deal",
        ] as const
      ).map((p) => sortByScore(rows, p)[0].slug),
    );
    expect(winners.size).toBeGreaterThan(1);
  });

  it("a missing data point normalizes as neutral, not as a penalty", () => {
    const withMissing: ScorableRow[] = [
      {
        slug: "a",
        received: 100,
        fee_total: 1,
        speed_hours: 10,
        trust_score: null,
        countries_covered: 5,
      },
      {
        slug: "b",
        received: 100,
        fee_total: 1,
        speed_hours: 10,
        trust_score: 4.5,
        countries_covered: 5,
      },
    ];
    const scores = computeCompositeScores(withMissing, "overall");
    expect(Math.abs(scores.get("a")! - scores.get("b")!)).toBeLessThan(0.2);
  });
});

describe("auditProviderChances", () => {
  it("a provider that is worse than another on every criterion never wins", () => {
    const dominated: ScorableRow[] = [
      ...rows,
      {
        slug: "strictly_worse_than_most_trusted",
        received: 900,
        fee_total: 10,
        speed_hours: 30,
        trust_score: 4.0,
        rate_vs_market_pct: -0.9,
        transparency_score: 6,
        supports_large_tickets: false,
        business_focus_score: 5,
        cash_pickup_available: false,
        countries_covered: 40,
        has_exclusive_deal: false,
      },
    ];
    const audit = auditProviderChances(dominated, 3000);
    expect(audit.get("strictly_worse_than_most_trusted")?.wins).toBe(0);
  });

  it("non-dominated providers each win at least sometimes across random weights", () => {
    const audit = auditProviderChances(rows, 4000);
    for (const r of rows) {
      expect(audit.get(r.slug)?.wins ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("deriveBadges", () => {
  it("awards lowest_fee to the cheapest provider", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("cheapest")).toContain("lowest_fee");
  });

  it("awards fastest_delivery to the fastest provider", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("fastest")).toContain("fastest_delivery");
  });

  it("awards best_exchange_rate to whoever is closest to mid-market, independent of who's cheapest", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_transparent")).toContain("best_exchange_rate");
    expect(badges.get("cheapest")).not.toContain("best_exchange_rate");
  });

  it("awards most_trusted to the highest trust_score", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_trusted")).toContain("most_trusted");
  });

  it("never awards a cash_pickup badge — moved to DELIVERY_METHOD_PREDICATES in ComparatorSection.tsx", () => {
    // Even with cash_pickup_available: true present (would have won the old
    // badge), deriveBadges must never produce a "cash_pickup" entry anymore
    // — it's no longer a valid BadgeKey at all. Kept as its own test so a
    // future re-add of this string to BadgeKey doesn't silently reintroduce
    // the duplicate-source-of-truth bug this removal fixed.
    const badges = deriveBadges(rows);
    const allBadges = Array.from(badges.values()).flat();
    expect(allBadges).not.toContain("cash_pickup" as unknown as BadgeKey);
  });

  it("awards most_transparent to the highest transparency_score", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_transparent")).toContain("most_transparent");
  });

  it("awards large_transfers only to providers with supports_large_tickets", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_transparent")).toContain("large_transfers");
    expect(badges.get("cheapest")).not.toContain("large_transfers");
  });

  it("awards exclusive_deal only to providers with has_exclusive_deal, never elsewhere", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("deal_provider")).toContain("exclusive_deal");
    expect(badges.get("cheapest")).not.toContain("exclusive_deal");
    expect(badges.get("most_trusted")).not.toContain("exclusive_deal");
  });

  it("never awards a best_business badge — removed in favor of the Personal/Empresa segment toggle", () => {
    // Even with business_focus_score data present (would have won the old
    // badge outright pre-removal), deriveBadges must never produce one
    // anymore. Checked by absence from the full flattened badge list, since
    // "best_business" is no longer a valid BadgeKey at all — there's no
    // per-badge check left to write.
    const badges = deriveBadges(rows);
    const allBadges = Array.from(badges.values()).flat();
    expect(allBadges).not.toContain("best_business" as unknown as BadgeKey);
  });
});

describe("pickFeaturedAmongTies", () => {
  it("returns the outright #1 when there is no real tie", () => {
    const sorted = sortByScore(rows, "most_trusted");
    const featured = pickFeaturedAmongTies(sorted, "most_trusted", 42);
    expect(featured?.slug).toBe(sorted[0].slug);
  });

  it("rotates the featured pick among genuinely tied providers across different seeds", () => {
    // Identical on every scored dimension except slug — this is what an
    // actual near-tie in composite-score terms looks like. Varying even one
    // input slightly (as an earlier version of this fixture did) lets
    // min-max normalization stretch that tiny gap to a large relative
    // score difference within a small comparison set, which the (correct)
    // score-based tie check then rightly refuses to call a tie.
    const nearTies: ScorableRow[] = [
      { slug: "tie_a", received: 1000, fee_total: 5, speed_hours: 10, trust_score: 4.5 },
      { slug: "tie_b", received: 1000, fee_total: 5, speed_hours: 10, trust_score: 4.5 },
      { slug: "tie_c", received: 1000, fee_total: 5, speed_hours: 10, trust_score: 4.5 },
    ];
    const sorted = sortByScore(nearTies, "overall");
    const picks = new Set(
      Array.from({ length: 20 }, (_, seed) => pickFeaturedAmongTies(sorted, "overall", seed)?.slug),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("never features a provider that is not among the tied set", () => {
    const sorted = sortByScore(rows, "overall");
    for (let seed = 0; seed < 10; seed++) {
      const featured = pickFeaturedAmongTies(sorted, "overall", seed);
      expect(sorted.map((r) => r.slug)).toContain(featured?.slug);
    }
  });

  it("regression: never features a provider whose `received` is close but whose actual profile score isn't — this was the real bug (sorting by Fastest surfaced a 4h provider over ones shown at 1h)", () => {
    const rows2: ScorableRow[] = [
      // Genuinely fastest, and the real #1 once sorted by "fastest".
      { slug: "quick", received: 1000, fee_total: 5, speed_hours: 1, trust_score: 4.5 },
      // Similar `received` to "quick", but much slower — under the old
      // received-based tie check this got featured anyway; it must not
      // anymore, since its "fastest"-profile score is well below quick's.
      {
        slug: "slow_but_similar_amount",
        received: 1000.5,
        fee_total: 5,
        speed_hours: 4,
        trust_score: 4.5,
      },
      // A real, deliberate near-tie WITH quick on speed itself — this one
      // legitimately should be eligible to be featured.
      { slug: "also_quick", received: 950, fee_total: 5, speed_hours: 1, trust_score: 4.4 },
    ];
    const sorted = sortByScore(rows2, "fastest");
    expect(sorted[0].slug).toBe("quick");
    for (let seed = 0; seed < 20; seed++) {
      const featured = pickFeaturedAmongTies(sorted, "fastest", seed);
      expect(featured?.slug).not.toBe("slow_but_similar_amount");
    }
  });
});

describe("getTrustTrend / flagDecliningProviders", () => {
  it("flags a real-world case: Atlantic Money's Trustpilot drop (4.1 -> 2.5)", () => {
    expect(getTrustTrend({ trust_score: 2.5, trust_score_previous: 4.1 })).toBe("declining");
  });

  it("returns stable for a small, normal wobble", () => {
    expect(getTrustTrend({ trust_score: 4.3, trust_score_previous: 4.4 })).toBe("stable");
  });

  it("returns rising when a provider genuinely improves", () => {
    expect(getTrustTrend({ trust_score: 4.2, trust_score_previous: 3.5 })).toBe("rising");
  });

  it("returns null when there's no previous snapshot to compare against", () => {
    expect(getTrustTrend({ trust_score: 4.3, trust_score_previous: null })).toBeNull();
  });

  it("flagDecliningProviders sorts the biggest drop first and ignores stable/rising providers", () => {
    const snapshot: ScorableRow[] = [
      {
        slug: "atlantic-money",
        received: 0,
        fee_total: 0,
        speed_hours: 0,
        trust_score: 2.5,
        trust_score_previous: 4.1,
      },
      {
        slug: "wise",
        received: 0,
        fee_total: 0,
        speed_hours: 0,
        trust_score: 4.3,
        trust_score_previous: 4.3,
      },
      {
        slug: "small_dip",
        received: 0,
        fee_total: 0,
        speed_hours: 0,
        trust_score: 4.0,
        trust_score_previous: 4.5,
      },
      {
        slug: "improving_provider",
        received: 0,
        fee_total: 0,
        speed_hours: 0,
        trust_score: 4.5,
        trust_score_previous: 3.8,
      },
    ];
    const flagged = flagDecliningProviders(snapshot);
    expect(flagged.map((f) => f.slug)).toEqual(["atlantic-money", "small_dip"]);
    expect(flagged[0].delta).toBeLessThan(flagged[1].delta); // atlantic-money's drop is bigger (more negative)
  });
});
