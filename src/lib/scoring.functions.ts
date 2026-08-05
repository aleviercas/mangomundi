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
  | "recipient_gets_most"
  | "lowest_cost"
  | "best_exchange_rate"
  | "fastest"
  | "most_trusted"
  | "best_business"
  | "best_cash_pickup"
  | "most_transparent"
  | "best_large_transfers"
  | "best_deal";

export interface ScoreWeights {
  /** Net amount received (already fee+rate combined) — used for "recipient
   *  gets the most" and as a baseline signal in every other profile. */
  rate: number;
  /** Raw fee_total, lower is better — deliberately SEPARATE from `rate`,
   *  since a $0-fee provider can still hide its real cost in a bad exchange
   *  rate margin. Splitting these two is the whole point of this update. */
  fee: number;
  /** rate_vs_market_pct, closer to 0 (or positive) is better — how close to
   *  the real mid-market rate the provider's exchange rate actually is. */
  exchangeRate: number;
  speed: number;
  trust: number;
  business: number;
  cashPickup: number;
  coverage: number;
  transparency: number;
  largeTransfers: number;
  exclusiveDeal: number;
}

// Weights per profile must sum to 1.0 — enforced by the test in
// scoring.functions.test.ts, not just by convention here.
export const SCORE_PROFILES: Record<ScoreProfileKey, ScoreWeights> = {
  overall: { rate: 0.15, fee: 0.12, exchangeRate: 0.1, speed: 0.15, trust: 0.18, business: 0.04, cashPickup: 0.06, coverage: 0.06, transparency: 0.08, largeTransfers: 0.04, exclusiveDeal: 0.02 },
  // "Recipient gets the most": the bottom-line net amount, fee+rate already
  // combined. This used to be the ONLY sort option (pre multi-criteria) —
  // now it's one explicit choice among several, not the default.
  recipient_gets_most: { rate: 0.7, fee: 0.05, exchangeRate: 0.05, speed: 0.05, trust: 0.05, business: 0.0, cashPickup: 0.02, coverage: 0.02, transparency: 0.03, largeTransfers: 0.02, exclusiveDeal: 0.01 },
  // "Lowest fee": the EXPLICIT commission only, independent of exchange
  // rate — so a provider can't hide a bad rate behind a "$0 fee" headline.
  lowest_cost: { rate: 0.05, fee: 0.7, exchangeRate: 0.05, speed: 0.05, trust: 0.05, business: 0.0, cashPickup: 0.02, coverage: 0.02, transparency: 0.03, largeTransfers: 0.02, exclusiveDeal: 0.01 },
  // "Best exchange rate": closest to real mid-market, independent of the
  // flat fee — the other half of the "where's my money actually going"
  // question that lowest_cost alone can't answer.
  best_exchange_rate: { rate: 0.05, fee: 0.05, exchangeRate: 0.7, speed: 0.05, trust: 0.05, business: 0.0, cashPickup: 0.02, coverage: 0.02, transparency: 0.03, largeTransfers: 0.02, exclusiveDeal: 0.01 },
  fastest: { rate: 0.1, fee: 0.05, exchangeRate: 0.03, speed: 0.55, trust: 0.13, business: 0.0, cashPickup: 0.04, coverage: 0.04, transparency: 0.06, largeTransfers: 0.0, exclusiveDeal: 0.0 },
  most_trusted: { rate: 0.08, fee: 0.05, exchangeRate: 0.05, speed: 0.08, trust: 0.55, business: 0.04, cashPickup: 0.04, coverage: 0.04, transparency: 0.05, largeTransfers: 0.02, exclusiveDeal: 0.0 },
  best_business: { rate: 0.12, fee: 0.08, exchangeRate: 0.05, speed: 0.12, trust: 0.15, business: 0.3, cashPickup: 0.0, coverage: 0.08, transparency: 0.06, largeTransfers: 0.04, exclusiveDeal: 0.0 },
  best_cash_pickup: { rate: 0.12, fee: 0.08, exchangeRate: 0.05, speed: 0.12, trust: 0.12, business: 0.0, cashPickup: 0.4, coverage: 0.04, transparency: 0.05, largeTransfers: 0.02, exclusiveDeal: 0.0 },
  most_transparent: { rate: 0.08, fee: 0.06, exchangeRate: 0.06, speed: 0.08, trust: 0.1, business: 0.0, cashPickup: 0.05, coverage: 0.03, transparency: 0.5, largeTransfers: 0.04, exclusiveDeal: 0.0 },
  best_large_transfers: { rate: 0.1, fee: 0.05, exchangeRate: 0.05, speed: 0.08, trust: 0.15, business: 0.1, cashPickup: 0.0, coverage: 0.05, transparency: 0.07, largeTransfers: 0.35, exclusiveDeal: 0.0 },
  // "best_deal" is deliberately narrow: mostly weighted on the disclosed
  // exclusive-offer flag itself, not a claim of overall quality. Kept as
  // its own profile so a promo NEVER quietly inflates "overall" or other
  // scores — same disclosure principle already used for sponsored_rank.
  best_deal: { rate: 0.1, fee: 0.05, exchangeRate: 0.05, speed: 0.05, trust: 0.08, business: 0.0, cashPickup: 0.0, coverage: 0.0, transparency: 0.02, largeTransfers: 0.0, exclusiveDeal: 0.65 },
};

export const SCORE_PROFILE_KEYS = Object.keys(SCORE_PROFILES) as ScoreProfileKey[];

/** Minimum shape a row must have to be scored. `ComparisonRow` satisfies this. */
export interface ScorableRow {
  slug: string;
  received: number;
  fee_total: number;
  speed_hours: number;
  trust_score: number | null;
  /** Percent vs. mid-market rate — 0 = exact mid-market, negative = worse.
   *  Independent of fee_total on purpose (see best_exchange_rate profile). */
  rate_vs_market_pct?: number | null;
  transparency_score?: number | null;
  supports_large_tickets?: boolean | null;
  business_focus_score?: number | null;
  cash_pickup_available?: boolean | null;
  countries_covered?: number | null;
  /** Disclosed exclusive mangomundi offer — never folded silently into other scores. */
  has_exclusive_deal?: boolean | null;
  /**
   * Trustpilot score from the last time this row was checked before the
   * current one (snapshot, not live). Used only by `getTrustTrend` below —
   * never fed into the composite score itself, since "used to be worse/
   * better" isn't a live quality signal, it's a red/green flag for humans.
   */
  trust_score_previous?: number | null;
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
  const scoreFee = buildNormalizer(rows.map((r) => r.fee_total), false);
  const scoreExchangeRate = buildNormalizer(rows.map((r) => r.rate_vs_market_pct), true);
  const scoreSpeed = buildNormalizer(rows.map((r) => r.speed_hours), false);
  const scoreTrust = buildNormalizer(rows.map((r) => r.trust_score), true);
  const scoreBusiness = buildNormalizer(rows.map((r) => r.business_focus_score), true);
  const scoreCoverage = buildNormalizer(rows.map((r) => r.countries_covered), true);
  const scoreTransparency = buildNormalizer(rows.map((r) => r.transparency_score), true);

  const result = new Map<string, number>();
  for (const r of rows) {
    const cashScore =
      r.cash_pickup_available === true ? 1 : r.cash_pickup_available === false ? 0 : 0.5;
    const largeTicketScore =
      r.supports_large_tickets === true ? 1 : r.supports_large_tickets === false ? 0 : 0.5;
    const exclusiveDealScore = r.has_exclusive_deal === true ? 1 : 0;
    const total =
      weights.rate * scoreRate(r.received) +
      weights.fee * scoreFee(r.fee_total) +
      weights.exchangeRate * scoreExchangeRate(r.rate_vs_market_pct) +
      weights.speed * scoreSpeed(r.speed_hours) +
      weights.trust * scoreTrust(r.trust_score) +
      weights.business * scoreBusiness(r.business_focus_score) +
      weights.cashPickup * cashScore +
      weights.coverage * scoreCoverage(r.countries_covered) +
      weights.transparency * scoreTransparency(r.transparency_score) +
      weights.largeTransfers * largeTicketScore +
      weights.exclusiveDeal * exclusiveDealScore;
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
  | "best_exchange_rate"
  | "fastest_delivery"
  | "most_trusted"
  | "best_business"
  | "cash_pickup"
  | "wide_coverage"
  | "most_transparent"
  | "large_transfers"
  | "exclusive_deal";

/**
 * Derives per-provider badges by finding the category winner(s) in the
 * current result set. Never invents a winner when there's no data for that
 * category (e.g. no row has trust_score → nobody gets "most_trusted").
 * `cash_pickup`, `large_transfers`, and `exclusive_deal` are capability/offer
 * flags, not a "best of" — every provider that has them gets the badge.
 */
export function deriveBadges<T extends ScorableRow>(rows: T[]): Map<string, BadgeKey[]> {
  const badges = new Map<string, BadgeKey[]>();
  rows.forEach((r) => badges.set(r.slug, []));
  if (rows.length === 0) return badges;

  const add = (slug: string, badge: BadgeKey) => badges.get(slug)?.push(badge);

  const cheapest = [...rows].sort((a, b) => a.fee_total - b.fee_total)[0];
  add(cheapest.slug, "lowest_fee");

  const rateCandidates = rows.filter((r) => r.rate_vs_market_pct != null);
  if (rateCandidates.length > 0) {
    const bestRate = [...rateCandidates].sort(
      (a, b) => b.rate_vs_market_pct! - a.rate_vs_market_pct!,
    )[0];
    add(bestRate.slug, "best_exchange_rate");
  }

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
  rows.filter((r) => r.supports_large_tickets === true).forEach((r) => add(r.slug, "large_transfers"));
  rows.filter((r) => r.has_exclusive_deal === true).forEach((r) => add(r.slug, "exclusive_deal"));

  const coverageCandidates = rows.filter((r) => r.countries_covered != null);
  if (coverageCandidates.length > 0) {
    const coverage = [...coverageCandidates].sort(
      (a, b) => b.countries_covered! - a.countries_covered!,
    )[0];
    add(coverage.slug, "wide_coverage");
  }

  const transparencyCandidates = rows.filter((r) => r.transparency_score != null);
  if (transparencyCandidates.length > 0) {
    const transparent = [...transparencyCandidates].sort(
      (a, b) => b.transparency_score! - a.transparency_score!,
    )[0];
    add(transparent.slug, "most_transparent");
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
  if (weights.rate >= 0.3) reasons.push("recipient gets the most for this amount");
  if (weights.fee >= 0.3) reasons.push("lowest explicit fee");
  if (weights.exchangeRate >= 0.3 && row.rate_vs_market_pct != null)
    reasons.push("closest to the real mid-market exchange rate");
  if (weights.speed >= 0.3) reasons.push(`delivery in ~${row.speed_hours}h`);
  if (weights.trust >= 0.3 && row.trust_score != null) reasons.push(`trust score ${row.trust_score}`);
  if (weights.business >= 0.3 && row.business_focus_score != null) reasons.push("strong business/corporate fit");
  if (weights.cashPickup >= 0.3 && row.cash_pickup_available) reasons.push("cash pickup available");
  if (weights.transparency >= 0.3 && row.transparency_score != null) reasons.push("high fee transparency");
  if (weights.largeTransfers >= 0.3 && row.supports_large_tickets) reasons.push("supports large transfers");
  if (weights.exclusiveDeal >= 0.3 && row.has_exclusive_deal) reasons.push("exclusive mangomundi offer");
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

  const scoreRate = buildNormalizer(rows.map((r) => r.received), true);
  const scoreFee = buildNormalizer(rows.map((r) => r.fee_total), false);
  const scoreExchangeRate = buildNormalizer(rows.map((r) => r.rate_vs_market_pct), true);
  const scoreSpeed = buildNormalizer(rows.map((r) => r.speed_hours), false);
  const scoreTrust = buildNormalizer(rows.map((r) => r.trust_score), true);
  const scoreBusiness = buildNormalizer(rows.map((r) => r.business_focus_score), true);
  const scoreCoverage = buildNormalizer(rows.map((r) => r.countries_covered), true);
  const scoreTransparency = buildNormalizer(rows.map((r) => r.transparency_score), true);

  for (let i = 0; i < iterations; i++) {
    // Dirichlet-ish: 11 random non-negative draws, normalized to sum to 1.
    // exclusiveDeal is included so a provider with a disclosed deal isn't
    // artificially excluded from the audit, but note it only ever helps
    // providers that actually have has_exclusive_deal === true.
    const raw = Array.from({ length: 11 }, () => -Math.log(Math.random()));
    const sum = raw.reduce((a, b) => a + b, 0);
    const [
      rate,
      fee,
      exchangeRate,
      speed,
      trust,
      business,
      cashPickup,
      coverage,
      transparency,
      largeTransfers,
      exclusiveDeal,
    ] = raw.map((v) => v / sum);
    const weights: ScoreWeights = {
      rate,
      fee,
      exchangeRate,
      speed,
      trust,
      business,
      cashPickup,
      coverage,
      transparency,
      largeTransfers,
      exclusiveDeal,
    };

    let bestSlug = rows[0].slug;
    let bestScore = -Infinity;
    for (const r of rows) {
      const cashScore =
        r.cash_pickup_available === true ? 1 : r.cash_pickup_available === false ? 0 : 0.5;
      const largeTicketScore =
        r.supports_large_tickets === true ? 1 : r.supports_large_tickets === false ? 0 : 0.5;
      const exclusiveDealScore = r.has_exclusive_deal === true ? 1 : 0;
      const total =
        weights.rate * scoreRate(r.received) +
        weights.fee * scoreFee(r.fee_total) +
        weights.exchangeRate * scoreExchangeRate(r.rate_vs_market_pct) +
        weights.speed * scoreSpeed(r.speed_hours) +
        weights.trust * scoreTrust(r.trust_score) +
        weights.business * scoreBusiness(r.business_focus_score) +
        weights.cashPickup * cashScore +
        weights.coverage * scoreCoverage(r.countries_covered) +
        weights.transparency * scoreTransparency(r.transparency_score) +
        weights.largeTransfers * largeTicketScore +
        weights.exclusiveDeal * exclusiveDealScore;
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

/**
 * Statistically-honest near-tie rotation.
 *
 * IMPORTANT DESIGN NOTE: this deliberately does NOT compare composite
 * scores to detect ties. Min-max normalization scales to whatever range
 * exists in the current result set, so a trivial $0.50 difference in
 * `received` on a $1,000 transfer can get stretched to 0..1 and look like
 * a huge score gap even though no real person would call that a
 * meaningful difference. Instead, "tie" is defined on the real-world
 * quantity a user actually perceives: the relative difference in amount
 * received. This is profile-independent by design — a $0.40 difference is
 * noise no matter which criteria the user says matter to them.
 *
 * When the top N providers are within `thresholdPct` of each other's
 * `received` amount, the gap is noise, not a real signal — an arbitrary
 * tiebreak (e.g. "whoever loads first in the array") would silently and
 * permanently favor the same provider every time. Instead, pick which of
 * the tied providers gets featured using a seed, so it's deterministic per
 * seed (e.g. per session or per day) but rotates across seeds — spreading
 * the "featured" slot fairly among genuine near-equals without ever
 * claiming a false distinction between them.
 *
 * This never changes who's "correct" to feature — it only decides, among
 * providers that are honestly tied on real money, who gets the spotlight
 * this time. `sortedRows` should already be sorted by `sortByScore` for the
 * chosen profile; this only re-picks among the top cluster if they're
 * within noise of each other on `received`.
 */
export function pickFeaturedAmongTies<T extends ScorableRow>(
  sortedRows: T[],
  profile: ScoreProfileKey,
  seed: number,
  thresholdPct = 0.005,
): T | null {
  if (sortedRows.length === 0) return null;
  const top = sortedRows[0];
  const tied = sortedRows.filter((r) => {
    if (top.received === 0) return r.slug === top.slug;
    return Math.abs(top.received - r.received) / Math.abs(top.received) <= thresholdPct;
  });
  if (tied.length <= 1) return top;

  // Simple deterministic hash of the seed → stable index into `tied`.
  const index = Math.abs(Math.sin(seed) * 10000) % tied.length;
  return tied[Math.floor(index)];
}

export type TrustTrend = "rising" | "stable" | "declining";

/**
 * Compares a provider's current `trust_score` against its last recorded
 * snapshot (`trust_score_previous`). This is how the Atlantic Money
 * situation gets caught automatically next time, instead of a human
 * happening to re-search it: any provider whose Trustpilot score has
 * genuinely dropped surfaces a warning, without a person having to notice.
 *
 * Threshold is 0.3 stars — smaller moves are normal noise (Trustpilot
 * scores wobble slightly review to review), a real "something changed"
 * signal tends to be bigger, as in Atlantic Money's ~1.5-star drop.
 *
 * This never feeds into the composite score — a provider mid-decline still
 * gets scored on its *current* trust_score like everyone else. The trend is
 * a separate, purely informational signal for the team (and optionally the
 * UI) to flag for manual review, exactly like this conversation did for
 * Atlantic Money.
 */
export function getTrustTrend(
  row: Pick<ScorableRow, "trust_score" | "trust_score_previous">,
  threshold = 0.3,
): TrustTrend | null {
  if (row.trust_score == null || row.trust_score_previous == null) return null;
  const delta = row.trust_score - row.trust_score_previous;
  if (delta <= -threshold) return "declining";
  if (delta >= threshold) return "rising";
  return "stable";
}

/**
 * Providers whose trust trend is "declining" — meant for an internal
 * dashboard/alert, not necessarily user-facing. Run this whenever Phase 1
 * data gets refreshed (re-checking Trustpilot periodically) to catch
 * situations like Atlantic Money's drop automatically.
 */
export function flagDecliningProviders<T extends ScorableRow>(
  rows: T[],
  threshold = 0.3,
): Array<{ slug: string; from: number; to: number; delta: number }> {
  const flagged: Array<{ slug: string; from: number; to: number; delta: number }> = [];
  for (const r of rows) {
    const trend = getTrustTrend(r, threshold);
    if (trend === "declining" && r.trust_score != null && r.trust_score_previous != null) {
      flagged.push({
        slug: r.slug,
        from: r.trust_score_previous,
        to: r.trust_score,
        delta: r.trust_score - r.trust_score_previous,
      });
    }
  }
  return flagged.sort((a, b) => a.delta - b.delta); // biggest drop first
}
