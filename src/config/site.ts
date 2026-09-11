/**
 * Canonical production origin used for SEO / social (og) / sitemap URLs.
 * No trailing slash. Change this one value if the production domain changes.
 */
export const SITE_URL = "https://mangomundi.com";

/**
 * Google Analytics 4 measurement ID. Not a secret — it's visible in every
 * page's rendered HTML regardless, so a plain constant here (rather than an
 * env var) is fine and keeps it next to the other site-wide constants.
 */
export const GA4_MEASUREMENT_ID = "G-GGN9K3YTWF";

/**
 * Google Tag Manager container ID. Same visibility profile as the GA4 ID
 * above (rendered in every page's HTML), so a plain constant is fine here.
 */
export const GTM_CONTAINER_ID = "GTM-KQKZ9FDC";

// 2026-09-10 — migración de ?lang= a URLs con prefijo de idioma (Opción B
// de docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md). Idioma
// expresado como el primer segmento del path (/es/..., /fr/...), inglés
// sin prefijo (preserva el ranking ya acumulado en las URLs actuales).
// Mirrors SUPPORTED_LANGS in src/lib/i18n.tsx — kept as a literal here to
// avoid importing the (heavy) i18n module into route head() evaluation.
export const HREFLANG_LANGS = [
  "en",
  "es",
  "pt",
  "ru",
  "tr",
  "bn",
  "ur",
  "zh",
  "pl",
  "hi",
  "tl",
  "vi",
  "ar",
  "de",
  "fr",
  "it",
  "ja",
  "ko",
  "id",
  "th",
] as const;

/**
 * Canonical URL for a route: self-references the /:lang/ prefixed variant
 * when one was present in the request (via el `{-$lang}` param de la ruta),
 * o la URL limpia en caso contrario (la entrada x-default). Every hreflang
 * alternate must be canonical to itself — pointing all of them at one
 * shared URL is what made technicalseo.com's checker flag every language
 * variant as "not indexable" back cuando esto era `?lang=`.
 *
 * "en" sigue siendo la excepción: se autocanonicaliza a la URL LIMPIA, sin
 * prefijo `/en/`, igual que x-default. English is this site's fallback
 * language (see getInitialLang in geo.functions.ts) — same reasoning que
 * ya se documentaba acá cuando el esquema era ?lang=en: mantener "en" sin
 * prefijo evita declarar dos URLs "correctas" para el mismo contenido en
 * inglés.
 *
 * `path` es siempre el path SIN prefijo de idioma (ej. "/about", nunca
 * "/es/about") — esta función es la única responsable de anteponer el
 * prefijo.
 */
export function selfCanonical(path: string, explicitLang?: string | null): string {
  if (!explicitLang || explicitLang === "en") return `${SITE_URL}${path}`;
  return `${SITE_URL}/${explicitLang}${path}`;
}

/**
 * rel=alternate hreflang link descriptors for a route path (e.g. "/pricing").
 * Pass a subset of langs for content that only exists in some locales (blog).
 *
 * "en" apunta a la URL limpia, igual que x-default — mismo razonamiento que
 * selfCanonical de arriba.
 */
export function hreflangLinks(
  path: string,
  langs: readonly string[] = HREFLANG_LANGS,
): Array<{ rel: string; hreflang: string; href: string }> {
  const base = `${SITE_URL}${path}`;
  // NOTE: lowercase `hreflang` on purpose — TanStack's head serializer emits
  // attribute names literally (no React camelCase→DOM normalization), and the
  // HTML attribute crawlers look for is lowercase.
  return [
    ...langs.map((lang) => ({
      rel: "alternate",
      hreflang: lang,
      href: lang === "en" ? base : `${SITE_URL}/${lang}${path}`,
    })),
    { rel: "alternate", hreflang: "x-default", href: base },
  ];
}

/**
 * Construye la URL de destino para navegar a `path` en `lang` — mismo
 * criterio que selfCanonical (inglés sin prefijo), pero pensado para pasarle
 * un `path` a `Link`/`navigate` en vez de para un `<link rel="canonical">`.
 * Usado por LangSwitcher.tsx.
 */
export function localizedPath(path: string, lang?: string | null): string {
  if (!lang || lang === "en") return path;
  return `/${lang}${path}`;
}
