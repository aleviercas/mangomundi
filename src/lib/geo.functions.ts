import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequest } from "@tanstack/react-start/server";
import { SUPPORTED_LANGS, type Lang } from "@/lib/i18n";
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
// 2026-09-10 — antes esta función decidía el idioma de la URL LIMPIA (sin
// prefijo) por geo-IP/Accept-Language, sirviendo contenido distinto en la
// MISMA URL según quién la pidiera — el antipatrón que la documentación de
// Google nombra explícitamente (ver
// docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md §2). Con la
// migración a URLs con prefijo de idioma (/es/..., /fr/...), el idioma real
// de cada página ahora vive en el path — cada ruta bajo `{-$lang}` ya lo
// lee de `params.lang` directamente, sin llamar a esta función.
//
// Esta función queda sólo para el caso transicional: alguien que todavía
// tenga un link viejo con `?lang=xx` (compartido antes de esta migración,
// o un bookmark), para que la redirección 301 hacia la URL con prefijo
// (ver el `beforeLoad` de la ruta `{-$lang}`) sepa a qué idioma redirigir.
// Ya NO autodetecta por geo-IP ni por Accept-Language — la URL sin prefijo
// es determinísticamente inglés, tanto para Google como para un visitante
// real, sin importar de dónde venga.
export const getInitialLang = createServerFn({ method: "GET" }).handler(async (): Promise<Lang> => {
  try {
    const url = getRequest()?.url;
    if (url) {
      const q = new URL(url).searchParams.get("lang")?.toLowerCase();
      if (q && (SUPPORTED_LANGS as string[]).includes(q)) return q as Lang;
    }
  } catch {
    // fall through
  }
  return "en";
});

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
