import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { HREFLANG_LANGS } from "@/config/site";

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  audience: string;
  vertical: string | null;
  published_at: string | null;
  locale: string;
}

export interface BlogPost extends BlogListItem {
  content_md: string | null;
}

// Blog locale now covers the same 20 languages as the rest of the site
// (HREFLANG_LANGS), not just en/es/pt. Previously this schema hard-capped the
// blog at 3 locales even though the editorial plan and the site's own i18n
// cover 20 — that mismatch is what caused "only 3 languages" confusion.
const LocaleSchema = z.enum(HREFLANG_LANGS).default("en");

/** Blog content today may not exist in every one of the 20 site languages for
 *  every post (articles are written natively, one language at a time — see
 *  the mangomundi skill's editorial plan). `getBlogPost` already falls back
 *  to the English row when a locale-specific one doesn't exist, so passing
 *  through any of the 20 codes here is safe — it's never rejected, and worst
 *  case falls back to English rather than erroring. */
export const toBlogLocale = (lang: string): (typeof HREFLANG_LANGS)[number] =>
  (HREFLANG_LANGS as readonly string[]).includes(lang)
    ? (lang as (typeof HREFLANG_LANGS)[number])
    : "en";

export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { locale?: string } | undefined) =>
    z.object({ locale: LocaleSchema }).parse({ locale: d?.locale ?? "en" }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Every published post across every locale, not just an exact match on
    // `data.locale` — a post only written in EN/ES/PT/IT/DE/FR so far should
    // still show up for a visitor browsing in, say, Japanese (as its English
    // version) instead of silently disappearing from the listing. This
    // mirrors the fallback getBlogPost already does for the detail page —
    // previously the listing was stricter than the detail page, which meant
    // a post could be reachable by direct link but invisible in the grid.
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, cover_url, audience, vertical, published_at, locale")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    // One card per slug: prefer the visitor's locale, else English, else
    // whatever locale happens to exist first (still better than hiding it).
    const bySlug = new Map<string, BlogListItem>();
    for (const row of (rows ?? []) as BlogListItem[]) {
      const existing = bySlug.get(row.slug);
      if (!existing) {
        bySlug.set(row.slug, row);
        continue;
      }
      const existingScore = existing.locale === data.locale ? 2 : existing.locale === "en" ? 1 : 0;
      const rowScore = row.locale === data.locale ? 2 : row.locale === "en" ? 1 : 0;
      if (rowScore > existingScore) bySlug.set(row.slug, row);
    }
    return Array.from(bySlug.values()).sort(
      (a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
    );
  });

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; locale?: string }) =>
    z.object({ slug: z.string().min(1).max(200), locale: LocaleSchema }).parse({
      slug: d.slug,
      locale: d.locale ?? "en",
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Try locale-specific first, then fall back to any published version of the slug.
    const base = supabaseAdmin
      .from("blog_posts")
      .select(
        "slug, title, excerpt, cover_url, audience, vertical, published_at, locale, content_md",
      )
      .eq("slug", data.slug)
      .eq("published", true);

    const { data: localized, error: e1 } = await base.eq("locale", data.locale).maybeSingle();
    if (e1) {
      console.error("[server-fn]", e1);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    if (localized) return localized as BlogPost;

    // Explicit English fallback (site-wide fallback language) rather than
    // "whichever locale happens to exist".
    if (data.locale === "en") return null;
    const { data: fallback, error: e2 } = await supabaseAdmin
      .from("blog_posts")
      .select(
        "slug, title, excerpt, cover_url, audience, vertical, published_at, locale, content_md",
      )
      .eq("slug", data.slug)
      .eq("published", true)
      .eq("locale", "en")
      .maybeSingle();
    if (e2) {
      console.error("[server-fn]", e2);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    return fallback as BlogPost | null;
  });
