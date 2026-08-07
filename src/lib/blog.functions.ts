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
    // Strict per-locale listing: a visitor browsing in Spanish sees only
    // Spanish posts, English only English, etc. — never a mix of languages
    // in the same grid. A post only shows up here once it has a real,
    // natively-written row for that exact locale (see the mangomundi skill's
    // editorial plan: one topic, one language, one market — not mechanical
    // translation). The detail page (blog_.$slug.tsx) separately falls back
    // to English only when someone follows a direct link to a slug that
    // doesn't exist in their language yet — that's a deliberate exception
    // for direct links, not the listing.
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, cover_url, audience, vertical, published_at, locale")
      .eq("published", true)
      .eq("locale", data.locale)
      .order("published_at", { ascending: false });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }
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

export interface SponsoredProvider {
  slug: string;
  name: string;
  website_url: string | null;
  affiliate_url: string;
}

/** Powers the "Send money with X" block at the end of every blog post (see
 *  blog_.$slug.tsx). Deliberately the SAME has_exclusive_deal flag that
 *  drives the "Sponsored offer" corner tab in the comparator — one place to
 *  update when a sponsorship starts or ends, and the two surfaces (blog,
 *  comparator) can never drift out of sync with each other.
 *
 *  Filtered by providers.audience against the post's own audience
 *  ("business" | "retail") — NOT by providers.segment, which is a
 *  different field driving the comparator's Personal/Empresa toggle.
 *  A provider can legitimately want "both" for segment (show as a
 *  comparable option in either view) while still being "business"-only
 *  for audience (don't feature it in retail-focused blog content) — e.g.
 *  Airwallex is a B2B cross-border payments platform, comparable for
 *  business users but not a fit to promote on a personal-transfer guide.
 *  Posts with no matching sponsored provider just render nothing (see
 *  SponsoredProvidersSection's early return) — this list is expected to be
 *  empty for some (audience, locale) combinations. */
export const listSponsoredProviders = createServerFn({ method: "GET" })
  .inputValidator((d: { audience?: string } | undefined) =>
    z
      .object({ audience: z.enum(["business", "retail", "both"]).default("both") })
      .parse({ audience: d?.audience }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const matchingAudiences =
      data.audience === "both" ? ["business", "retail", "both"] : [data.audience, "both"];
    const { data: rows, error } = await supabaseAdmin
      .from("providers")
      .select("slug, name, website_url, affiliate_url")
      .eq("has_exclusive_deal", true)
      .eq("active", true)
      .in("audience", matchingAudiences)
      .order("name", { ascending: true });
    if (error) {
      console.error("[server-fn]", error);
      throw new Error("An unexpected error occurred. Please try again.");
    }
    return (rows ?? []) as SponsoredProvider[];
  });
