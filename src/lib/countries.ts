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

const RAW: Record<string, string> = (countryToCurrencyMap as unknown as { default?: Record<string, string> }).default ?? (countryToCurrencyMap as unknown as Record<string, string>);

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

export const COUNTRIES: CountryInfo[] = Object.keys(RAW)
  .filter((code) => /^[A-Z]{2}$/.test(code))
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
