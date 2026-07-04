import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL, HREFLANG_LANGS } from "@/config/site";

const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  /** Locales this URL exists in (defaults to all UI languages). */
  langs?: readonly string[];
}

// xhtml:link alternates — language is a ?lang= param; x-default is the clean
// URL (geo-detected). Same policy as the hreflangLinks() route helper.
function alternates(path: string, langs: readonly string[] = HREFLANG_LANGS): string {
  const base = `${BASE_URL}${path}`;
  const lines = langs.map(
    (lang) =>
      `    <xhtml:link rel="alternate" hreflang="${lang}" href="${base}?lang=${lang}"/>`,
  );
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${base}"/>`);
  return lines.join("\n");
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
          // One sitemap entry per slug (locales are ?lang= alternates of the
          // same URL); newest updated_at wins for lastmod.
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
            langs: ["en", "es", "pt"],
          }));
        } catch {
          // Sitemap should still render even if DB is unavailable
        }

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/features", changefreq: "monthly", priority: "0.8" },
          { path: "/pricing", changefreq: "monthly", priority: "0.8" },
          { path: "/platform", changefreq: "monthly", priority: "0.8" },
          { path: "/insurance", changefreq: "monthly", priority: "0.6" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          ...blogEntries,
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
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
