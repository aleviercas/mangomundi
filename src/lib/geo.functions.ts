import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequest } from "@tanstack/react-start/server";
import { SUPPORTED_LANGS, COUNTRY_TO_LANG, type Lang } from "@/lib/i18n";
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

// 2026-09-13 — encontrado al revisar la migración: /embed (el widget para
// terceros, widget.js) se configura por defecto con `data-lang="auto"` en
// su propia documentación — sin `?lang=` explícito, `getInitialLang()` de
// arriba ahora siempre devuelve "en", así que todo widget "auto" (el modo
// default, no uno con idioma fijo) quedaba en inglés sin importar el
// visitante real. Antes de la migración, `getInitialLang()` hacía esta
// misma detección para TODAS las rutas — se sacó de ahí a propósito, era
// el antipatrón de servir contenido distinto en la misma URL indexable
// (ver docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md §2). Ese
// antipatrón no aplica acá: `/embed` ya es `noindex, nofollow` (nunca lo
// indexa Google), y "auto-detectar el idioma de una calculadora embebida"
// es exactamente el caso de uso legítimo que ese antipatrón NO cubre —
// es personalización de una herramienta, no una página de contenido
// buscable. Restaurada la detección acá, con un nombre y un comentario
// que dejan claro que es la excepción, no la regla.
export const detectEmbedLang = createServerFn({ method: "GET" }).handler(async (): Promise<Lang> => {
  try {
    const country = detectCountryFromHeaders();
    if (country && country in COUNTRY_TO_LANG) return COUNTRY_TO_LANG[country];
    const accept = (getRequestHeader("accept-language") || "").toLowerCase();
    const primary = accept.split(",")[0]?.split("-")[0]?.trim();
    if (primary && (SUPPORTED_LANGS as string[]).includes(primary)) return primary as Lang;
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
