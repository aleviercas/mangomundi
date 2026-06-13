export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "ES", name: "España / Spain", flag: "🇪🇸", currency: "EUR" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS" },
  { code: "MX", name: "México", flag: "🇲🇽", currency: "MXN" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currency: "BRL" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP" },
  { code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP" },
  { code: "PE", name: "Perú", flag: "🇵🇪", currency: "PEN" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currency: "UYU" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", currency: "EUR" },
  { code: "IT", name: "Italia", flag: "🇮🇹", currency: "EUR" },
  { code: "NL", name: "Nederland", flag: "🇳🇱", currency: "EUR" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR" },
  { code: "CH", name: "Schweiz", flag: "🇨🇭", currency: "CHF" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD" },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP" },
];

export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((country) => [country.code, country]));

export function localCurrency(countryCode: string): string {
  return COUNTRY_BY_CODE[countryCode]?.currency ?? "USD";
}