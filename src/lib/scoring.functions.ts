/**
 * Multi-criteria scoring engine for the comparator.
 *
 * Problem this solves: sorting only by `received` (best rate) means the
 * cheapest provider wins ~90% of clicks — bad for affiliate diversification,
 * and it hides real differences (speed, trust, cash pickup, business fit)
 * that matter to different users depending on their situation.
 *
 * This engine computes a composite score per "profile" (a named set of
 * weights), so different user priorities surface different providers —
 * without ever hiding data or silently reordering sponsored providers.
 * `sponsored_rank` stays a separate, explicitly-labeled signal in the UI;
 * it is NOT baked into these weights, on purpose (see mangomundi principle:
 * never move sponsored providers up without disclosing it).
 *
 * All inputs are normalized min-max across the *current result set* (not a
 * global constant), so this works regardless of currency pair or amount.
 * Missing data points score as neutral (0.5), never as a penalty — a
 * provider we simply haven't researched yet shouldn't rank artificially low.
 */

export type ScoreProfileKey =
  | "overall"
  | "lowest_cost"
  | "fastest"
  | "most_trusted"
  | "best_business"
  | "best_cash_pickup";

export interface ScoreWeights {
  rate: number;
  speed: number;
  trust: number;
  business: number;
  cashPickup: number;
  coverage: number;
}

// Weights per profile must sum to 1.0 — enforced by the test in
// scoring.functions.test.ts, not just by convention here.
export const SCORE_PROFILES: Record<ScoreProfileKey, ScoreWeights> = {
  overall: { rate: 0.3, speed: 0.2, trust: 0.25, business: 0.05, cashPickup: 0.1, coverage: 0.1 },
  lowest_cost: { rate: 0.7, speed: 0.1, trust: 0.1, business: 0.0, cashPickup: 0.05, coverage: 0.05 },
  fastest: { rate: 0.15, speed: 0.6, trust: 0.15, business: 0.0, cashPickup: 0.05, coverage: 0.05 },
  most_trusted: { rate: 0.15, speed: 0.1, trust: 0.6, business: 0.05, cashPickup: 0.05, coverage: 0.05 },
  best_business: { rate: 0.2, speed: 0.15, trust: 0.2, business: 0.35, cashPickup: 0.0, coverage: 0.1 },
  best_cash_pickup: { rate: 0.2, speed: 0.15, trust: 0.15, business: 0.0, cashPickup: 0.45, coverage: 0.05 },
};

export const SCORE_PROFILE_KEYS = Object.keys(SCORE_PROFILES) as ScoreProfileKey[];

/** Minimum shape a row must have to be scored. `ComparisonRow` satisfies this. */
export interface ScorableRow {
  slug: string;
  received: number;
  fee_total: number;
  speed_hours: number;
  trust_score: number | null;
  business_focus_score?: number | null;
  cash_pickup_available?: boolean | null;
  countries_covered?: number | null;
}

/**
 * Builds a normalizer over a set of values: min-max scaled to 0..1.
 * - If there's no usable data at all, every value normalizes to neutral (0.5)
 *   so the criterion effectively drops out rather than distorting the score.
 * - If all values are equal, everyone gets neutral (0.5) too — no reason to
 *   reward/penalize when a criterion doesn't differentiate anyone.
 * - A single missing (null/undefined) value within an otherwise-valid set
 *   also normalizes to neutral, rather than 0 — no data ≠ worst possible.
 */
function buildNormalizer(
  values: Array<number | null | undefined>,
  higherIsBetter: boolean,
): (v: number | null | undefined) => number {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) return () => 0.5;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return () => 0.5;
  return (v) => {
    if (v == null || !Number.isFinite(v)) return 0.5;
    const norm = (v - min) / (max - min);
    return higherIsBetter ? norm : 1 - norm;
  };
}

/** Computes a composite score (0..1, higher is better) per provider slug. */
export function computeCompositeScores<T extends ScorableRow>(
  rows: T[],
  profile: ScoreProfileKey,
): Map<string, number> {
  const weights = SCORE_PROFILES[profile];
  const scoreRate = buildNormalizer(rows.map((r) => r.received), true);
  const scoreSpeed = buildNormalizer(rows.map((r) => r.speed_hours), false);
  const scoreTrust = buildNormalizer(rows.map((r) => r.trust_score), true);
  const scoreBusiness = buildNormalizer(rows.map((r) => r.business_focus_score), true);
  const scoreCoverage = buildNormalizer(rows.map((r) => r.countries_covered), true);

  const result = new Map<string, number>();
  for (const r of rows) {
    const cashScore =
      r.cash_pickup_available === true ? 1 : r.cash_pickup_available === false ? 0 : 0.5;
    const total =
      weights.rate * scoreRate(r.received) +
      weights.speed * scoreSpeed(r.speed_hours) +
      weights.trust * scoreTrust(r.trust_score) +
      weights.business * scoreBusiness(r.business_focus_score) +
      weights.cashPickup * cashScore +
      weights.coverage * scoreCoverage(r.countries_covered);
    result.set(r.slug, total);
  }
  return result;
}

/** Sorts a copy of `rows` by composite score (descending) for a given profile. */
export function sortByScore<T extends ScorableRow>(rows: T[], profile: ScoreProfileKey): T[] {
  const scores = computeCompositeScores(rows, profile);
  return [...rows].sort((a, b) => (scores.get(b.slug) ?? 0) - (scores.get(a.slug) ?? 0));
}

export type BadgeKey =
  | "lowest_fee"
  | "fastest_delivery"
  | "most_trusted"
  | "best_business"
  | "cash_pickup"
  | "wide_coverage";

/**
 * Derives per-provider badges by finding the category winner(s) in the
 * current result set. Never invents a winner when there's no data for that
 * category (e.g. no row has trust_score → nobody gets "most_trusted").
 * `cash_pickup` is a capability flag, not a "best of" — every provider that
 * supports it gets the badge, not just one.
 */
export function deriveBadges<T extends ScorableRow>(rows: T[]): Map<string, BadgeKey[]> {
  const badges = new Map<string, BadgeKey[]>();
  rows.forEach((r) => badges.set(r.slug, []));
  if (rows.length === 0) return badges;

  const add = (slug: string, badge: BadgeKey) => badges.get(slug)?.push(badge);

  const cheapest = [...rows].sort((a, b) => a.fee_total - b.fee_total)[0];
  add(cheapest.slug, "lowest_fee");

  const fastest = [...rows].sort((a, b) => a.speed_hours - b.speed_hours)[0];
  add(fastest.slug, "fastest_delivery");

  const trustedCandidates = rows.filter((r) => r.trust_score != null);
  if (trustedCandidates.length > 0) {
    const trusted = [...trustedCandidates].sort((a, b) => b.trust_score! - a.trust_score!)[0];
    add(trusted.slug, "most_trusted");
  }

  const businessCandidates = rows.filter((r) => r.business_focus_score != null);
  if (businessCandidates.length > 0) {
    const business = [...businessCandidates].sort(
      (a, b) => b.business_focus_score! - a.business_focus_score!,
    )[0];
    add(business.slug, "best_business");
  }

  rows.filter((r) => r.cash_pickup_available === true).forEach((r) => add(r.slug, "cash_pickup"));

  const coverageCandidates = rows.filter((r) => r.countries_covered != null);
  if (coverageCandidates.length > 0) {
    const coverage = [...coverageCandidates].sort(
      (a, b) => b.countries_covered! - a.countries_covered!,
    )[0];
    add(coverage.slug, "wide_coverage");
  }

  return badges;
}

/**
 * Human-readable "recommended because" reasons for the #1 provider under a
 * given profile — used by the UI card and available to the AI copilot so it
 * can explain the ranking factually instead of using marketing language.
 * Only returns reasons actually backed by data present on the row.
 */
export function explainTopPick(row: ScorableRow, profile: ScoreProfileKey): string[] {
  const reasons: string[] = [];
  const weights = SCORE_PROFILES[profile];
  if (weights.rate >= 0.3) reasons.push("competitive rate for this amount");
  if (weights.speed >= 0.3) reasons.push(`delivery in ~${row.speed_hours}h`);
  if (weights.trust >= 0.3 && row.trust_score != null) reasons.push(`trust score ${row.trust_score}`);
  if (weights.business >= 0.3 && row.business_focus_score != null) reasons.push("strong business/corporate fit");
  if (weights.cashPickup >= 0.3 && row.cash_pickup_available) reasons.push("cash pickup available");
  return reasons;
}

/**
 * Fairness audit — NOT used at request time, this is a diagnostic tool for
 * data/product review (run it whenever Phase 1 data changes meaningfully).
 *
 * Samples `iterations` random weight vectors (Dirichlet-like: 6 non-negative
 * numbers summing to 1) and counts how often each provider would rank #1
 * under *some* legitimate weighting — not just the 6 fixed profiles above.
 *
 * A provider with 0 wins across many thousand random weight vectors is
 * mathematically Pareto-dominated by at least one other provider: it is
 * worse on every single criterion than something else in the set, so no
 * honest weighted score can ever put it first. That is not a bug to patch
 * by rigging the algorithm — surfacing it honestly is the point. If that
 * happens, the fix is either (a) get that provider real data on a criterion
 * where it might actually be competitive (it may just be missing data,
 * which normalizes as neutral and silently caps its ceiling), or (b) accept
 * that on true merit it doesn't lead any comparison today, and let it
 * appear lower but never hidden (see `sortByScore` — it never filters).
 */
export function auditProviderChances<T extends ScorableRow>(
  rows: T[],
  iterations = 5000,
): Map<string, { wins: number; winRate: number }> {
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.slug, 0));
  if (rows.length === 0) return new Map();

  for (let i = 0; i < iterations; i++) {
    // Dirichlet-ish: 6 random non-negative draws, normalized to sum to 1.
    const raw = Array.from({ length: 6 }, () => -Math.log(Math.random()));
    const sum = raw.reduce((a, b) => a + b, 0);
    const [rate, speed, trust, business, cashPickup, coverage] = raw.map((v) => v / sum);
    const weights: ScoreWeights = { rate, speed, trust, business, cashPickup, coverage };

    const scoreRate = buildNormalizer(rows.map((r) => r.received), true);
    const scoreSpeed = buildNormalizer(rows.map((r) => r.speed_hours), false);
    const scoreTrust = buildNormalizer(rows.map((r) => r.trust_score), true);
    const scoreBusiness = buildNormalizer(rows.map((r) => r.business_focus_score), true);
    const scoreCoverage = buildNormalizer(rows.map((r) => r.countries_covered), true);

    let bestSlug = rows[0].slug;
    let bestScore = -Infinity;
    for (const r of rows) {
      const cashScore =
        r.cash_pickup_available === true ? 1 : r.cash_pickup_available === false ? 0 : 0.5;
      const total =
        weights.rate * scoreRate(r.received) +
        weights.speed * scoreSpeed(r.speed_hours) +
        weights.trust * scoreTrust(r.trust_score) +
        weights.business * scoreBusiness(r.business_focus_score) +
        weights.cashPickup * cashScore +
        weights.coverage * scoreCoverage(r.countries_covered);
      if (total > bestScore) {
        bestScore = total;
        bestSlug = r.slug;
      }
    }
    counts.set(bestSlug, (counts.get(bestSlug) ?? 0) + 1);
  }

  const result = new Map<string, { wins: number; winRate: number }>();
  for (const [slug, wins] of counts) {
    result.set(slug, { wins, winRate: wins / iterations });
  }
  return result;
}
