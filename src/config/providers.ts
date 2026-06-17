/**
 * Provider monetization metadata (static).
 *
 * Hybrid architecture:
 *   - The `providers` table in the database is the source of truth for
 *     rates, spreads, fees, availability, trust scores — anything that may
 *     change without a deploy.
 *   - This file holds ONLY the technical/operational metadata that does not
 *     belong in the live-rates table: how we monetise each provider
 *     (network vs direct, commission model).
 *
 * Code that needs the full picture should merge a DB row with `getProviderMeta(slug)`.
 */

export type IntegrationType = "network" | "direct";
export type CommissionType = "CPA" | "revenue_share" | "hybrid" | "none";
export type ProviderSegment = "retail" | "corporate";

export interface ProviderMeta {
  /** Must match providers.slug in the database */
  slug: string;
  /** Display name (kept for reference; DB.name is authoritative) */
  name: string;
  segment: ProviderSegment;
  integrationType: IntegrationType;
  /** Affiliate network name when integrationType === 'network' */
  networkName?: "Impact" | "AWIN" | "Partnerize" | "Commission Junction" | "Direct";
  commissionType: CommissionType;
  /** CPA → flat USD/EUR per converted click. revenue_share → 0..1 decimal. */
  commissionValue: number;
  /**
   * Optional affiliate URL template. {click_id} is substituted at runtime by
   * the tracker. If absent, the DB providers.affiliate_url is used as-is.
   */
  affiliateUrlTemplate?: string;
}

/**
 * Static metadata keyed by slug. Slugs that exist in the DB but are NOT
 * listed here fall back to "direct / unknown commission" via getProviderMeta.
 */
export const PROVIDER_META: Record<string, ProviderMeta> = {
  // ---------- RETAIL ----------
  worldremit: {
    slug: "worldremit",
    name: "WorldRemit",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 30,
  },
  wise: {
    slug: "wise",
    name: "Wise",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 15,
    affiliateUrlTemplate: "https://wise.com/?ref=mangomundi&click_id={click_id}",
  },
  remitly: {
    slug: "remitly",
    name: "Remitly",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 25,
  },
  xoom: {
    slug: "xoom",
    name: "Xoom (PayPal)",
    segment: "retail",
    integrationType: "network",
    networkName: "Partnerize",
    commissionType: "CPA",
    commissionValue: 20,
  },
  "western-union": {
    slug: "western-union",
    name: "Western Union",
    segment: "retail",
    integrationType: "network",
    networkName: "AWIN",
    commissionType: "CPA",
    commissionValue: 18,
  },
  moneygram: {
    slug: "moneygram",
    name: "MoneyGram",
    segment: "retail",
    integrationType: "network",
    networkName: "AWIN",
    commissionType: "CPA",
    commissionValue: 15,
  },
  ria: {
    slug: "ria",
    name: "Ria Money Transfer",
    segment: "retail",
    integrationType: "network",
    networkName: "AWIN",
    commissionType: "CPA",
    commissionValue: 12,
  },
  paysend: {
    slug: "paysend",
    name: "Paysend",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 10,
  },
  transfergo: {
    slug: "transfergo",
    name: "TransferGo",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 10,
  },
  azimo: {
    slug: "azimo",
    name: "Azimo (Papaya)",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 15,
  },
  skrill: {
    slug: "skrill",
    name: "Skrill",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 22,
  },
  "atlantic-money": {
    slug: "atlantic-money",
    name: "Atlantic Money",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 8,
  },
  "small-world": {
    slug: "small-world",
    name: "Small World FS",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 10,
  },
  sendwave: {
    slug: "sendwave",
    name: "Sendwave",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 12,
  },
  lemfi: {
    slug: "lemfi",
    name: "LemFi",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 14,
  },
  nala: {
    slug: "nala",
    name: "NALA",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 12,
  },
  "taptap-send": {
    slug: "taptap-send",
    name: "TapTap Send",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 10,
  },
  zing: {
    slug: "zing",
    name: "Zing (HSBC)",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 0,
  },
  revolut: {
    slug: "revolut",
    name: "Revolut",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 35,
  },
  xe: {
    slug: "xe",
    name: "XE Money Transfer",
    segment: "retail",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "CPA",
    commissionValue: 20,
  },
  currencyfair: {
    slug: "currencyfair",
    name: "CurrencyFair",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 15,
  },
  instarem: {
    slug: "instarem",
    name: "Instarem",
    segment: "retail",
    integrationType: "direct",
    commissionType: "CPA",
    commissionValue: 12,
  },

  // ---------- CORPORATE / BUSINESS ----------
  airwallex: {
    slug: "airwallex",
    name: "Airwallex",
    segment: "corporate",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "revenue_share",
    commissionValue: 0.15,
  },
  "currencies-direct": {
    slug: "currencies-direct",
    name: "Currencies Direct",
    segment: "corporate",
    integrationType: "direct",
    commissionType: "revenue_share",
    commissionValue: 0.10,
  },
  moneycorp: {
    slug: "moneycorp",
    name: "Moneycorp",
    segment: "corporate",
    integrationType: "direct",
    commissionType: "revenue_share",
    commissionValue: 0.10,
  },
  ofx: {
    slug: "ofx",
    name: "OFX",
    segment: "corporate",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "revenue_share",
    commissionValue: 0.12,
  },
  torfx: {
    slug: "torfx",
    name: "TorFX",
    segment: "corporate",
    integrationType: "direct",
    commissionType: "revenue_share",
    commissionValue: 0.10,
  },
  "cab-payments": {
    slug: "cab-payments",
    name: "Crown Agents Bank",
    segment: "corporate",
    integrationType: "direct",
    commissionType: "revenue_share",
    commissionValue: 0.08,
  },
  payoneer: {
    slug: "payoneer",
    name: "Payoneer",
    segment: "corporate",
    integrationType: "network",
    networkName: "Impact",
    commissionType: "hybrid",
    commissionValue: 25,
  },
  "western-union-business": {
    slug: "western-union-business",
    name: "WU Business Solutions",
    segment: "corporate",
    integrationType: "direct",
    commissionType: "revenue_share",
    commissionValue: 0.08,
  },
};

/**
 * Look up monetization metadata for a provider slug. Returns a safe
 * fallback if the slug isn't registered — useful when the DB has new
 * providers that haven't been classified yet.
 */
export function getProviderMeta(slug: string): ProviderMeta {
  return (
    PROVIDER_META[slug] ?? {
      slug,
      name: slug,
      segment: "retail",
      integrationType: "direct",
      commissionType: "none",
      commissionValue: 0,
    }
  );
}

/**
 * Build the final affiliate URL for a click. Substitutes {click_id} when
 * the template uses it; otherwise returns the base URL unchanged. The
 * click_id is fire-and-forget tracked on the caller side.
 */
export function buildAffiliateUrl(slug: string, baseUrl: string, clickId: string): string {
  const meta = getProviderMeta(slug);
  if (meta.affiliateUrlTemplate?.includes("{click_id}")) {
    return meta.affiliateUrlTemplate.replace("{click_id}", encodeURIComponent(clickId));
  }
  if (baseUrl.includes("{click_id}")) {
    return baseUrl.replace("{click_id}", encodeURIComponent(clickId));
  }
  return baseUrl;
}

/**
 * Threshold above which a Retail user gets nudged to the Corporate / B2B desk.
 * Centralised so the UI, the chat upsell, and any future server-side rule
 * stay aligned.
 */
export const B2B_UPSELL_MIN_AMOUNT = 10_000;

/** Baseline spread the savings calculation compares against (3.5%). */
export const MARKET_BASELINE_SPREAD = 0.035;
