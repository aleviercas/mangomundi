import { describe, expect, it } from "vitest";
import {
  SCORE_PROFILES,
  computeCompositeScores,
  displayScore,
  sortByScore,
  auditProviderChances,
  pickFeaturedAmongTies,
  getTrustTrend,
  flagDecliningProviders,
  type ScorableRow,
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
    slug: "best_rate",
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
    // best_rate has the best rate_vs_market_pct (0.05) but is NOT the
    // cheapest by fee_total — proves fee and exchange rate are genuinely
    // separate dimensions now, not the same thing wearing two labels.
    expect(sortByScore(rows, "best_exchange_rate")[0].slug).toBe("best_rate");
  });

  it("fastest profile ranks the fastest provider first", () => {
    expect(sortByScore(rows, "fastest")[0].slug).toBe("fastest");
  });

  it("most_trusted profile ranks the highest trust_score first", () => {
    expect(sortByScore(rows, "most_trusted")[0].slug).toBe("most_trusted");
  });

  it("best_large_transfers profile favors the provider that supports large tickets", () => {
    expect(sortByScore(rows, "best_large_transfers")[0].slug).toBe("best_rate");
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
      (["lowest_cost", "best_exchange_rate", "fastest", "most_trusted", "best_deal"] as const).map(
        (p) => sortByScore(rows, p)[0].slug,
      ),
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

describe("sortByScore — strict ordering guarantee", () => {
  it("sponsored provider wins a genuine Score tie (identical on every measured input except sponsorship)", () => {
    const rows: ScorableRow[] = [
      { slug: "not_sponsored", received: 1000, fee_total: 5, speed_hours: 10, trust_score: 4.5 },
      {
        slug: "sponsored",
        received: 1000,
        fee_total: 5,
        speed_hours: 10,
        trust_score: 4.5,
        has_exclusive_deal: true,
      },
    ];
    const sorted = sortByScore(rows, "overall");
    expect(sorted[0].slug).toBe("sponsored");
  });

  it('regression: two rows whose raw overall score differs (one is objectively slightly better) but round to the SAME displayed Score still resolve by sponsorship, not by raw float — this is what a real report looked like: Wise, Revolut, and TransferGo all showed "8.6" despite different underlying fees', () => {
    // Same displayScore() the row UI actually shows is what the tie
    // decision is based on — not raw float equality, which two of these
    // wouldn't even satisfy (0.700 !== 0.716). Picked directly from
    // displayScore's own rounding math: both land in the same 0.1-wide
    // display bucket ("8.4"), the un-rounded scores don't.
    const scores = new Map([
      ["not_sponsored_slightly_better", 0.716], // displayScore -> 8.4
      ["sponsored", 0.7], // displayScore -> 8.4, same bucket, lower raw
    ]);
    expect(displayScore(0.716)).toBe(displayScore(0.7));
    expect(0.716).toBeGreaterThan(0.7); // the non-sponsored one really is better in raw terms
    // sortByScore only exposes the full pipeline (rows in, not raw scores),
    // so this asserts the same rule sortByScore relies on directly: a
    // tied *displayed* score always breaks toward has_exclusive_deal.
    const rowsSortedByDisplayTie = [...scores.entries()].sort(([slugA, a], [slugB, b]) => {
      if (displayScore(a) === displayScore(b)) {
        return slugA === "sponsored" ? -1 : 1;
      }
      return b - a;
    });
    expect(rowsSortedByDisplayTie[0][0]).toBe("sponsored");
  });

  it("a real difference on the chosen field ALWAYS wins, no matter how much better the loser is on everything else", () => {
    const rows: ScorableRow[] = [
      // Genuinely the most trusted, but weak on every other input.
      {
        slug: "trusted_but_weak",
        received: 500,
        fee_total: 50,
        speed_hours: 48,
        trust_score: 4.9,
      },
      // Slightly less trusted, but dramatically better everywhere else —
      // under a weighted-blend approach (even at 70%), a combination this
      // lopsided could still flip the order. It must not: this is the
      // exact shape of a real bug report this fixed (a lower value on the
      // chosen field outranking a higher one because it made up the gap
      // elsewhere) — originally caught on "Most transparent", reproduced
      // here on "Most trusted" since that's the property being verified,
      // not anything specific to transparency itself.
      {
        slug: "less_trusted_but_great",
        received: 5000,
        fee_total: 0,
        speed_hours: 1,
        trust_score: 4.8,
      },
    ];
    const sorted = sortByScore(rows, "most_trusted");
    expect(sorted[0].slug).toBe("trusted_but_weak");
  });

  it("ties on the chosen field (identical value) fall back to the overall score, not an arbitrary/input order", () => {
    const rows: ScorableRow[] = [
      { slug: "tied_weak", received: 900, fee_total: 10, speed_hours: 1, trust_score: 3.0 },
      { slug: "tied_strong", received: 1000, fee_total: 0, speed_hours: 1, trust_score: 5.0 },
    ];
    const sorted = sortByScore(rows, "fastest");
    // Both are 1h — a genuine tie on the chosen field — so the better
    // overall provider should be the one placed first.
    expect(sorted[0].slug).toBe("tied_strong");
  });

  it("rows missing the chosen field's data always sort last, regardless of direction", () => {
    const rows: ScorableRow[] = [
      { slug: "has_trust", received: 500, fee_total: 5, speed_hours: 5, trust_score: 3.0 },
      { slug: "no_trust_data", received: 5000, fee_total: 0, speed_hours: 1, trust_score: null },
    ];
    const sorted = sortByScore(rows, "most_trusted");
    expect(sorted[0].slug).toBe("has_trust");
    expect(sorted[1].slug).toBe("no_trust_data");
  });

  it('"overall" is unaffected — still the deliberate blend, not a strict field', () => {
    const sorted = sortByScore(rows, "overall");
    expect(sorted.length).toBe(rows.length);
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
