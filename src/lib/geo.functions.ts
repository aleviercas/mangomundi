import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequest } from "@tanstack/react-start/server";
import { COUNTRY_TO_LANG, SUPPORTED_LANGS, type Lang } from "@/lib/i18n";
import { COUNTRY_BY_CODE, localCurrency } from "@/lib/countries";

/**
 * Reads the visitor's country from whichever geo header is present.
 * Vercel's Edge Network sets "x-vercel-ip-country" natively (no Cloudflare
 * needed). "cf-ipcountry" is only present if Cloudflare sits in front of
 * the app. We check both, Vercel header first since that's our actual setup.
 */
function detectCountryFromHeaders(): string {
  const vercelCountry = (getRequestHeader("x-vercel-ip-country") || "").toUpperCase();
  if (vercelCountry && COUNTRY_BY_CODE[vercelCountry]) return vercelCountry;

  const cfCountry = (getRequestHeader("cf-ipcountry") || "").toUpperCase();
  if (cfCountry && COUNTRY_BY_CODE[cfCountry]) return cfCountry;

  return "";
}

/**
 * Server-side initial language detection.
 * Priority: geo country -> Accept-Language -> "en".
 */
export const getInitialLang = createServerFn({ method: "GET" }).handler(async (): Promise<Lang> => {
  try {
    // An explicit ?lang= wins — this is what the hreflang alternates point to
    // (/?lang=de, /?lang=es …), so crawlers hitting an alternate must get that
    // language's SSR <title>/<meta>, not the geo-IP default.
    const url = getRequest()?.url;
    if (url) {
      const q = new URL(url).searchParams.get("lang")?.toLowerCase();
      if (q && (SUPPORTED_LANGS as string[]).includes(q)) return q as Lang;
    }
    const country = detectCountryFromHeaders();
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
});

/**
 * Raw ?lang= query param, if present and valid — independent of the geo/
 * Accept-Language fallback cascade in getInitialLang(). Used to build
 * self-referencing canonical URLs: only a request that explicitly asked for
 * ?lang=xx should canonicalize to a ?lang=xx URL. The clean x-default URL
 * (no ?lang= at all) must canonicalize to itself, never to whatever
 * language geo-IP or Accept-Language happened to resolve for this
 * particular visitor — that resolution isn't part of the URL and isn't
 * what a crawler hitting the bare URL actually requested.
 */
export const getExplicitLangParam = createServerFn({ method: "GET" }).handler(
  async (): Promise<Lang | null> => {
    try {
      const url = getRequest()?.url;
      if (url) {
        const q = new URL(url).searchParams.get("lang")?.toLowerCase();
        if (q && (SUPPORTED_LANGS as string[]).includes(q)) return q as Lang;
      }
    } catch {
      // fall through
    }
    return null;
  },
);

export const getVisitorCountry = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const country = detectCountryFromHeaders();
    if (country) return country;
  } catch {
    // geo headers unavailable in local preview
  }
  return "US";
});

/** Returns { country, currency } for the visitor based on IP geolocation. */
export const getVisitorGeo = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    country: string;
    currency: string;
  }> => {
    try {
      const country = detectCountryFromHeaders();
      if (country) {
        return { country, currency: localCurrency(country) };
      }
    } catch {
      // fall through
    }
    return { country: "GB", currency: "GBP" };
  },
);
