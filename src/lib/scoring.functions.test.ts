import { describe, expect, it } from "vitest";
import {
  SCORE_PROFILES,
  computeCompositeScores,
  sortByScore,
  deriveBadges,
  auditProviderChances,
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
    fee_total: 1,
    speed_hours: 48,
    trust_score: 3.5,
    business_focus_score: null,
    cash_pickup_available: false,
    countries_covered: 20,
  },
  {
    slug: "fastest",
    received: 990,
    fee_total: 5,
    speed_hours: 1,
    trust_score: 4.0,
    business_focus_score: null,
    cash_pickup_available: false,
    countries_covered: 30,
  },
  {
    slug: "most_trusted",
    received: 985,
    fee_total: 6,
    speed_hours: 24,
    trust_score: 4.8,
    business_focus_score: 8,
    cash_pickup_available: true,
    countries_covered: 50,
  },
];

describe("computeCompositeScores / sortByScore", () => {
  it("lowest_cost profile ranks the cheapest provider first", () => {
    const sorted = sortByScore(rows, "lowest_cost");
    expect(sorted[0].slug).toBe("cheapest");
  });

  it("fastest profile ranks the fastest provider first", () => {
    const sorted = sortByScore(rows, "fastest");
    expect(sorted[0].slug).toBe("fastest");
  });

  it("most_trusted profile ranks the highest trust_score first", () => {
    const sorted = sortByScore(rows, "most_trusted");
    expect(sorted[0].slug).toBe("most_trusted");
  });

  it("different profiles can surface different #1 providers for the same data", () => {
    const winners = new Set(
      (["lowest_cost", "fastest", "most_trusted"] as const).map((p) => sortByScore(rows, p)[0].slug),
    );
    // The whole point of this engine: not everyone converges on one winner.
    expect(winners.size).toBeGreaterThan(1);
  });

  it("a missing data point normalizes as neutral, not as a penalty", () => {
    const withMissing: ScorableRow[] = [
      { slug: "a", received: 100, fee_total: 1, speed_hours: 10, trust_score: null, countries_covered: 5 },
      { slug: "b", received: 100, fee_total: 1, speed_hours: 10, trust_score: 4.5, countries_covered: 5 },
    ];
    const scores = computeCompositeScores(withMissing, "overall");
    // Both score close to each other since only trust_score differs and "a" has none.
    expect(Math.abs(scores.get("a")! - scores.get("b")!)).toBeLessThan(0.2);
  });
});

describe("auditProviderChances", () => {
  it("a provider that is worse than another on every criterion never wins", () => {
    const dominated: ScorableRow[] = [
      ...rows,
      {
        slug: "strictly_worse_than_most_trusted",
        received: 900, // worse than most_trusted's 985
        fee_total: 10, // worse than most_trusted's 6
        speed_hours: 30, // worse than most_trusted's 24
        trust_score: 4.0, // worse than most_trusted's 4.8
        business_focus_score: 5, // worse than most_trusted's 8
        cash_pickup_available: false, // worse than most_trusted's true
        countries_covered: 40, // worse than most_trusted's 50
      },
    ];
    const audit = auditProviderChances(dominated, 3000);
    expect(audit.get("strictly_worse_than_most_trusted")?.wins).toBe(0);
  });

  it("non-dominated providers each win at least sometimes across random weights", () => {
    const audit = auditProviderChances(rows, 3000);
    for (const r of rows) {
      expect(audit.get(r.slug)?.wins ?? 0).toBeGreaterThan(0);
    }
  });
});
  it("awards lowest_fee to the cheapest provider", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("cheapest")).toContain("lowest_fee");
  });

  it("awards fastest_delivery to the fastest provider", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("fastest")).toContain("fastest_delivery");
  });

  it("awards most_trusted to the highest trust_score", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_trusted")).toContain("most_trusted");
  });

  it("awards cash_pickup only to providers that actually support it", () => {
    const badges = deriveBadges(rows);
    expect(badges.get("most_trusted")).toContain("cash_pickup");
    expect(badges.get("cheapest")).not.toContain("cash_pickup");
    expect(badges.get("fastest")).not.toContain("cash_pickup");
  });

  it("does not award best_business when no row has business_focus_score", () => {
    const noBusinessData = rows.map((r) => ({ ...r, business_focus_score: null }));
    const badges = deriveBadges(noBusinessData);
    for (const list of badges.values()) {
      expect(list).not.toContain("best_business");
    }
  });
});
