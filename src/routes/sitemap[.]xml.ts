import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL, HREFLANG_LANGS, hreflangLinks } from "@/config/site";

const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  /** Locales this URL exists in (defaults to all UI languages). */
  langs?: readonly string[];
}

// Reuses the route-level hreflangLinks() helper (config/site.ts) instead of
// keeping a second, parallel implementation — this file used to build its
// own alternates independently, hardcoding `?lang=${lang}` for every locale
// including "en". That directly contradicted each page's own <head> tags
// once those were fixed to point "en" at the clean URL (see selfCanonical's
// comment on why: en is the fallback language, so a same-content English
// alternate always pointing anywhere but the clean URL was exactly what
// Search Console flagged as "Duplicate, Google chose different canonical
// than user"). A sitemap that disagreed with the pages it lists is its own
// source of confusion for Google, on top of the original bug — one shared
// function means the two can't drift apart again.
//
// 2026-09-10 — selfCanonical/hreflangLinks migrated from ?lang= query
// params to path-prefixed URLs (/es/..., see
// docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md) — this file
// needed zero changes for that, since it never builds URLs itself, only
// calls these two shared functions.
function alternates(path: string, langs: readonly string[] = HREFLANG_LANGS): string {
  return hreflangLinks(path, langs)
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${l.href}"/>`)
    .join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Fetch published blog posts for dynamic entries
        let blogEntries: SitemapEntry[] = [];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("blog_posts")
            .select("slug, updated_at")
            .eq("published", true);
          // One sitemap entry per slug (locales are hreflang alternates of
          // the same URL, path-prefixed since 2026-09-10 — see the comment
          // above); newest updated_at wins for lastmod.
          const bySlug = new Map<string, string | null>();
          for (const p of data ?? []) {
            const prev = bySlug.get(p.slug);
            if (prev === undefined || (p.updated_at && (!prev || p.updated_at > prev))) {
              bySlug.set(p.slug, p.updated_at ?? null);
            }
          }
          blogEntries = [...bySlug.entries()].map(([slug, updatedAt]) => ({
            path: `/blog/${slug}`,
            lastmod: updatedAt ? new Date(updatedAt).toISOString() : undefined,
            changefreq: "monthly",
            priority: "0.7",
            // No `langs` override — defaults to all HREFLANG_LANGS below,
            // matching the per-post head() in blog_.$slug.tsx exactly.
            // getBlogPost() always resolves to real content (native
            // translation or EN fallback), so advertising all 20 is safe.
            // This used to be hardcoded to ["en","es","pt"], which disagreed
            // with what each post page itself declared — the kind of
            // mismatch GSC's hreflang report flags.
          }));
        } catch {
          // Sitemap should still render even if DB is unavailable
        }

        // 2026-09-10 — corredores reales de /send/:corridor (§1 y §14 de
        // docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md). El
        // selector de país del comparador arma ~59.000 combinaciones
        // posibles, pero sólo las que tienen fila propia en `fx_rates`
        // muestran contenido realmente distinto entre sí — el resto cae al
        // mismo fallback genérico de providers sin importar el país (ver
        // §14 del mismo documento, confirmado con datos reales). Sumar acá
        // TODO el espacio combinatorio generaría miles de páginas "doorway"
        // casi idénticas; este query es exactamente el filtro que las
        // separa. Mismo slug (país-país en minúsculas) que
        // send.$corridor.tsx ya usa como única forma canónica.
        let corridorEntries: SitemapEntry[] = [];
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("fx_rates")
            .select("sending_country, receiving_country");
          const slugs = new Set<string>();
          for (const r of data ?? []) {
            if (!r.sending_country || !r.receiving_country) continue;
            slugs.add(`${r.sending_country.toLowerCase()}-${r.receiving_country.toLowerCase()}`);
          }
          corridorEntries = [...slugs].map((slug) => ({
            path: `/send/${slug}`,
            changefreq: "daily",
            priority: "0.6",
          }));
        } catch {
          // Sitemap should still render even if DB is unavailable
        }

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/business", changefreq: "weekly", priority: "0.7" },
          { path: "/widget", changefreq: "monthly", priority: "0.4" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          ...blogEntries,
          ...corridorEntries,
          { path: "/legal", changefreq: "monthly", priority: "0.4" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            alternates(e.path, e.langs),
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
