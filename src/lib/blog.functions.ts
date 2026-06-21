import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const LocaleSchema = z.enum(["en", "es", "pt"]).default("en");

export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { locale?: string } | undefined) =>
    z.object({ locale: LocaleSchema }).parse({ locale: d?.locale ?? "en" }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, cover_url, audience, vertical, published_at, locale")
      .eq("published", true)
      .eq("locale", data.locale)
      .order("published_at", { ascending: false });
    if (error) { console.error("[server-fn]", error); throw new Error("An unexpected error occurred. Please try again."); }
    return (rows ?? []) as BlogListItem[];
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
    if (e1) { console.error("[server-fn]", e1); throw new Error("An unexpected error occurred. Please try again."); }
    if (localized) return localized as BlogPost;

    const { data: fallback, error: e2 } = await supabaseAdmin
      .from("blog_posts")
      .select(
        "slug, title, excerpt, cover_url, audience, vertical, published_at, locale, content_md",
      )
      .eq("slug", data.slug)
      .eq("published", true)
      .limit(1)
      .maybeSingle();
    if (e2) { console.error("[server-fn]", e2); throw new Error("An unexpected error occurred. Please try again."); }
    return fallback as BlogPost | null;
  });
