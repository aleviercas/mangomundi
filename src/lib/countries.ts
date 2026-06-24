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
