// Global ISO-3166-1 alpha-2 country dataset.
// Sourced dynamically from `country-to-currency` (251 territories) plus
// `Intl.DisplayNames` for localized names and Unicode regional-indicator
// flag emoji. No hardcoded short-lists — the comparator and selectors
// support every ISO country by default.
import countryToCurrencyMap from "country-to-currency";

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

const RAW: Record<string, string> =
  (countryToCurrencyMap as unknown as { default?: Record<string, string> }).default ??
  (countryToCurrencyMap as unknown as Record<string, string>);

function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + (code.charCodeAt(0) - 65), A + (code.charCodeAt(1) - 65));
}

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  displayNames = null;
}

function nameOf(code: string): string {
  try {
    return displayNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

// No permanent civilian population and no banking/remittance infrastructure
// — `country-to-currency`'s raw 251-territory list includes these, but no
// real transfer corridor originates or ends there. Curated exclusion, not a
// guess: each one checked individually (Antarctica, Bouvet Island, the
// British Indian Ocean Territory, French Southern Territories, Heard &
// McDonald Islands, Pitcairn, South Georgia & the South Sandwich Islands).
const UNINHABITED_TERRITORIES = new Set(["AQ", "BV", "GS", "HM", "IO", "PN", "TF"]);

export const COUNTRIES: CountryInfo[] = Object.keys(RAW)
  .filter((code) => /^[A-Z]{2}$/.test(code) && !UNINHABITED_TERRITORIES.has(code))
  .map((code) => ({
    code,
    name: nameOf(code),
    flag: flagOf(code),
    currency: RAW[code],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRY_BY_CODE: Record<string, CountryInfo> = Object.fromEntries(
  COUNTRIES.map((country) => [country.code, country]),
);

export function localCurrency(countryCode: string): string {
  return COUNTRY_BY_CODE[countryCode]?.currency ?? "USD";
}

// Curated representative country for currencies that span many countries. The
// `country-to-currency` data has no notion of a "primary" country, so a naive
// reverse lookup would return whichever country sorts first by name (e.g.
// USD → American Samoa). This pins the dominant-economy country for the common
// multi-country currencies; extend as needed.
const CURRENCY_PRIMARY_COUNTRY: Record<string, string> = {
  EUR: "DE",
  USD: "US",
  GBP: "GB",
  CHF: "CH",
  AUD: "AU",
  NZD: "NZ",
  XOF: "SN",
  XAF: "CM",
  XCD: "AG",
  XPF: "PF",
  DKK: "DK",
  NOK: "NO",
  INR: "IN",
  ZAR: "ZA",
  ILS: "IL",
  MAD: "MA",
};

// Reverse index (currency → first country by name that uses it), built once as
// the fallback for currencies not in the curated map above. Most currencies are
// 1:1 with a country (JPY→JP, ARS→AR), so the fallback is exact for them.
const FIRST_COUNTRY_BY_CURRENCY: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const c of COUNTRIES) if (!(c.currency in idx)) idx[c.currency] = c.code;
  return idx;
})();

/**
 * Representative country code for a currency, or `undefined` if no country
 * uses it. Used to keep the country selects consistent when a currency changes
 * (e.g. the agent's "Compare EUR → JPY" flow).
 */
export function primaryCountryForCurrency(currency: string): string | undefined {
  const cur = currency.toUpperCase();
  return CURRENCY_PRIMARY_COUNTRY[cur] ?? FIRST_COUNTRY_BY_CURRENCY[cur];
}

/**
 * A "TO" default guaranteed to differ from the given "FROM" currency — used
 * wherever the comparator picks initial currencies (home page, embed widget)
 * so a visitor whose geo-detected currency is USD doesn't land on a
 * same-currency warning before touching anything.
 */
export function defaultCounterCurrency(from: string): string {
  return from.toUpperCase() === "USD" ? "EUR" : "USD";
}

/**
 * Resolve a code from the agent's `[[SUGGEST_COMPARE:FROM-TO]]` tag into a
 * currency (+ explicit country when the user named one). A 2-letter ISO-3166
 * country code (e.g. "PT") → that country and its local currency; a 3-letter
 * code → a currency, leaving the country for the caller to infer.
 */
export function resolveRouteCode(code: string): { currency: string; country?: string } {
  const c = code.toUpperCase();
  if (c.length === 2 && COUNTRY_BY_CODE[c]) {
    return { currency: COUNTRY_BY_CODE[c].currency, country: c };
  }
  return { currency: c };
}

// design/AJUSTES-3.md §A — currency pills: "las monedas que se ofrecen son
// las plausibles del país elegido, no una lista fija". Curated, not derived
// — country-to-currency only knows a country's own legal-tender currency,
// not which others genuinely circulate or get requested there. Hand-picked
// for real reasons (a widely-held reserve currency, a heavily dollarized
// economy, a currency board/peg, or a major real remittance corridor this
// app already prices) rather than guessed; a country absent here just gets
// its local currency plus the full "All" picker, never a fabricated list.
// Local currency is always implied first — entries here are the ADDITIONAL
// currencies only, deduped against local in plausibleCurrencies() below.
const COMMON_ALT_CURRENCIES: Record<string, string[]> = {
  // Reserve currencies widely held/quoted alongside the local one.
  GB: ["EUR", "USD"],
  US: ["EUR", "GBP"],
  CA: ["USD"],
  CH: ["EUR", "USD"],
  // Eurozone — USD and GBP are the currencies most often asked for.
  DE: ["USD", "GBP"],
  FR: ["USD", "GBP"],
  ES: ["USD", "GBP"],
  IT: ["USD", "GBP"],
  PT: ["USD", "GBP"],
  NL: ["USD", "GBP"],
  IE: ["USD", "GBP"],
  // Heavily dollarized economies / major USD remittance corridors.
  MX: ["USD"],
  AR: ["USD"],
  CO: ["USD"],
  PE: ["USD"],
  PH: ["USD"],
  IN: ["USD"],
  NG: ["USD"],
  KE: ["USD"],
  GH: ["USD"],
  PK: ["USD"],
  BD: ["USD"],
  VN: ["USD"],
  KH: ["USD"],
  // Currency-board / hard-pegged to USD.
  HK: ["USD"],
  AE: ["USD"],
  SG: ["USD"],
  PA: ["USD"],
};

/** Local currency first, then the curated plausible alternates for that
 *  country (deduped) — the ordered list the currency pill row renders,
 *  before the always-present "All {n}" pill that opens the full picker. */
export function plausibleCurrencies(countryCode: string): string[] {
  const local = localCurrency(countryCode);
  const alt = COMMON_ALT_CURRENCIES[countryCode] ?? [];
  return [local, ...alt.filter((c) => c !== local)];
}
