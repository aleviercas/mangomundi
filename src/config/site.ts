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

// Language is expressed as a ?lang= search param (no path-based locales), so
// alternates point at the same path with the param; x-default is the clean URL
// (which auto-detects by geo). Mirrors SUPPORTED_LANGS in src/lib/i18n.tsx —
// kept as a literal here to avoid importing the (heavy) i18n module into
// route head() evaluation.
export const HREFLANG_LANGS = [
  "en", "es", "pt", "ru", "tr", "bn", "ur", "zh", "pl", "hi",
  "tl", "vi", "ar", "de", "fr", "it", "ja", "ko", "id", "th",
] as const;

/**
 * Canonical URL for a route: self-references the ?lang= variant when one
 * was explicitly present in the request, or the clean URL otherwise (the
 * x-default entry). Every hreflang alternate must be canonical to itself —
 * pointing all of them at one shared URL is what made technicalseo.com's
 * checker flag every ?lang= alternate as "not indexable".
 */
export function selfCanonical(path: string, explicitLang?: string | null): string {
  return explicitLang ? `${SITE_URL}${path}?lang=${explicitLang}` : `${SITE_URL}${path}`;
}

/**
 * rel=alternate hreflang link descriptors for a route path (e.g. "/pricing").
 * Pass a subset of langs for content that only exists in some locales (blog).
 */
export function hreflangLinks(
  path: string,
  langs: readonly string[] = HREFLANG_LANGS,
): Array<{ rel: string; hreflang: string; href: string }> {
  const base = `${SITE_URL}${path}`;
  const sep = path.includes("?") ? "&" : "?";
  // NOTE: lowercase `hreflang` on purpose — TanStack's head serializer emits
  // attribute names literally (no React camelCase→DOM normalization), and the
  // HTML attribute crawlers look for is lowercase.
  return [
    ...langs.map((lang) => ({
      rel: "alternate",
      hreflang: lang,
      href: `${base}${sep}lang=${lang}`,
    })),
    { rel: "alternate", hreflang: "x-default", href: base },
  ];
}
