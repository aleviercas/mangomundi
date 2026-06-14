import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { COUNTRY_TO_LANG, SUPPORTED_LANGS, type Lang } from "@/lib/i18n";
import { COUNTRY_BY_CODE } from "@/lib/countries";

/**
 * Server-side initial language detection.
 * Priority: Cloudflare CF-IPCountry → Accept-Language → "en".
 * Maps ISO country codes to one of the 20 supported languages.
 */
export const getInitialLang = createServerFn({ method: "GET" }).handler(
  async (): Promise<Lang> => {
    try {
      const country = (getRequestHeader("cf-ipcountry") || "").toUpperCase();
      if (country && country in COUNTRY_TO_LANG) {
        return COUNTRY_TO_LANG[country];
      }
      const accept = (getRequestHeader("accept-language") || "").toLowerCase();
      const primary = accept.split(",")[0]?.split("-")[0]?.trim();
      if (primary && (SUPPORTED_LANGS as string[]).includes(primary)) {
        return primary as Lang;
      }
    } catch {
      // fall through
    }
    return "en";
  },
);

export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const country = (getRequestHeader("cf-ipcountry") || "").toUpperCase();
    if (country && COUNTRY_BY_CODE[country]) return country;
  } catch {
    // Use a stable fallback when geo headers are unavailable in local preview.
  }
  return "US";
});
