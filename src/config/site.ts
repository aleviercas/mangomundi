/**
 * Canonical production origin used for SEO / social (og) / sitemap URLs.
 * No trailing slash. Change this one value if the production domain changes.
 */
export const SITE_URL = "https://mangomundi.com";

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
