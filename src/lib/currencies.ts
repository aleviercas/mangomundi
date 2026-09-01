// Comprehensive currency list — all OpenExchangeRates supported currencies (ISO 4217).
// Used in the FX comparator so users can pick any corridor (e.g. GBP→ARS).
export interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "ARS", name: "Argentine Peso", flag: "🇦🇷" },
  { code: "CLP", name: "Chilean Peso", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", flag: "🇨🇴" },
  { code: "PEN", name: "Peruvian Sol", flag: "🇵🇪" },
  { code: "UYU", name: "Uruguayan Peso", flag: "🇺🇾" },
  { code: "VES", name: "Venezuelan Bolívar", flag: "🇻🇪" },
  { code: "BOB", name: "Bolivian Boliviano", flag: "🇧🇴" },
  { code: "PYG", name: "Paraguayan Guaraní", flag: "🇵🇾" },
  { code: "DOP", name: "Dominican Peso", flag: "🇩🇴" },
  { code: "GTQ", name: "Guatemalan Quetzal", flag: "🇬🇹" },
  { code: "HNL", name: "Honduran Lempira", flag: "🇭🇳" },
  { code: "NIO", name: "Nicaraguan Córdoba", flag: "🇳🇮" },
  { code: "CRC", name: "Costa Rican Colón", flag: "🇨🇷" },
  { code: "PAB", name: "Panamanian Balboa", flag: "🇵🇦" },
  { code: "CUP", name: "Cuban Peso", flag: "🇨🇺" },
  { code: "JMD", name: "Jamaican Dollar", flag: "🇯🇲" },
  { code: "TTD", name: "Trinidad Dollar", flag: "🇹🇹" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "EGP", name: "Egyptian Pound", flag: "🇪🇬" },
  { code: "MAD", name: "Moroccan Dirham", flag: "🇲🇦" },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭" },
  { code: "UGX", name: "Ugandan Shilling", flag: "🇺🇬" },
  { code: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿" },
  { code: "RWF", name: "Rwandan Franc", flag: "🇷🇼" },
  { code: "ETB", name: "Ethiopian Birr", flag: "🇪🇹" },
  { code: "XOF", name: "West African CFA Franc", flag: "🌍" },
  { code: "XAF", name: "Central African CFA Franc", flag: "🌍" },
  { code: "ZMW", name: "Zambian Kwacha", flag: "🇿🇲" },
  { code: "AOA", name: "Angolan Kwanza", flag: "🇦🇴" },
  { code: "MZN", name: "Mozambican Metical", flag: "🇲🇿" },
  { code: "BWP", name: "Botswana Pula", flag: "🇧🇼" },
  { code: "NAD", name: "Namibian Dollar", flag: "🇳🇦" },
  { code: "MUR", name: "Mauritian Rupee", flag: "🇲🇺" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "QAR", name: "Qatari Riyal", flag: "🇶🇦" },
  { code: "KWD", name: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "BHD", name: "Bahraini Dinar", flag: "🇧🇭" },
  { code: "OMR", name: "Omani Rial", flag: "🇴🇲" },
  { code: "JOD", name: "Jordanian Dinar", flag: "🇯🇴" },
  { code: "LBP", name: "Lebanese Pound", flag: "🇱🇧" },
  { code: "ILS", name: "Israeli Shekel", flag: "🇮🇱" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "IRR", name: "Iranian Rial", flag: "🇮🇷" },
  { code: "IQD", name: "Iraqi Dinar", flag: "🇮🇶" },
  { code: "PKR", name: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", flag: "🇧🇩" },
  { code: "LKR", name: "Sri Lankan Rupee", flag: "🇱🇰" },
  { code: "NPR", name: "Nepalese Rupee", flag: "🇳🇵" },
  { code: "AFN", name: "Afghan Afghani", flag: "🇦🇫" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷" },
  { code: "TWD", name: "Taiwan Dollar", flag: "🇹🇼" },
  { code: "MMK", name: "Myanmar Kyat", flag: "🇲🇲" },
  { code: "KHR", name: "Cambodian Riel", flag: "🇰🇭" },
  { code: "LAK", name: "Lao Kip", flag: "🇱🇦" },
  { code: "MNT", name: "Mongolian Tugrik", flag: "🇲🇳" },
  { code: "KZT", name: "Kazakhstani Tenge", flag: "🇰🇿" },
  { code: "UZS", name: "Uzbekistani Som", flag: "🇺🇿" },
  { code: "GEL", name: "Georgian Lari", flag: "🇬🇪" },
  { code: "AMD", name: "Armenian Dram", flag: "🇦🇲" },
  { code: "AZN", name: "Azerbaijani Manat", flag: "🇦🇿" },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺" },
  { code: "UAH", name: "Ukrainian Hryvnia", flag: "🇺🇦" },
  { code: "BYN", name: "Belarusian Ruble", flag: "🇧🇾" },
  { code: "PLN", name: "Polish Złoty", flag: "🇵🇱" },
  { code: "CZK", name: "Czech Koruna", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", flag: "🇭🇺" },
  { code: "RON", name: "Romanian Leu", flag: "🇷🇴" },
  { code: "BGN", name: "Bulgarian Lev", flag: "🇧🇬" },
  { code: "HRK", name: "Croatian Kuna", flag: "🇭🇷" },
  { code: "RSD", name: "Serbian Dinar", flag: "🇷🇸" },
  { code: "MKD", name: "Macedonian Denar", flag: "🇲🇰" },
  { code: "ALL", name: "Albanian Lek", flag: "🇦🇱" },
  { code: "BAM", name: "Bosnia Convertible Mark", flag: "🇧🇦" },
  { code: "MDL", name: "Moldovan Leu", flag: "🇲🇩" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", flag: "🇩🇰" },
  { code: "ISK", name: "Icelandic Króna", flag: "🇮🇸" },
  { code: "XCD", name: "East Caribbean Dollar", flag: "🌴" },
  { code: "BSD", name: "Bahamian Dollar", flag: "🇧🇸" },
  { code: "BBD", name: "Barbadian Dollar", flag: "🇧🇧" },
  { code: "BZD", name: "Belize Dollar", flag: "🇧🇿" },
  { code: "BMD", name: "Bermudian Dollar", flag: "🇧🇲" },
  { code: "KYD", name: "Cayman Dollar", flag: "🇰🇾" },
  { code: "FJD", name: "Fijian Dollar", flag: "🇫🇯" },
  { code: "PGK", name: "Papua New Guinea Kina", flag: "🇵🇬" },
  { code: "WST", name: "Samoan Tala", flag: "🇼🇸" },
  { code: "TOP", name: "Tongan Paʻanga", flag: "🇹🇴" },
  { code: "SBD", name: "Solomon Islands Dollar", flag: "🇸🇧" },
  { code: "VUV", name: "Vanuatu Vatu", flag: "🇻🇺" },
  { code: "XPF", name: "CFP Franc", flag: "🇵🇫" },
];

export const CURRENCY_BY_CODE: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

/** 2026-09-01 feedback — the widget's compact currency picker should show
 *  "solo el símbolo de la moneda" (£, $, €) when closed, not the 3-letter
 *  ISO code it showed before. No hand-typed symbol table here — for ~170
 *  currencies that risks getting an obscure one wrong (someone's real
 *  currency shown with the wrong glyph, or a fabricated one for a code
 *  that doesn't have a common single-character symbol). `Intl.NumberFormat`
 *  with `currencyDisplay: "narrowSymbol"` pulls the actual glyph from the
 *  browser/runtime's own CLDR data instead — the same standard source
 *  every OS and spreadsheet app uses, not something invented here. Falls
 *  back to the code itself only if a code isn't recognized (defensive,
 *  never fabricates a symbol). Memoized since CURRENCIES is static. */
const symbolCache = new Map<string, string>();
export function currencySymbol(code: string): string {
  const cached = symbolCache.get(code);
  if (cached) return cached;
  let symbol = code;
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    symbol = parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    symbol = code;
  }
  symbolCache.set(code, symbol);
  return symbol;
}
