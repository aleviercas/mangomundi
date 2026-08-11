-- Blog goes multilingual (en/es/pt): the same post (slug) is stored as one row
-- per locale. The original schema made slug UNIQUE globally, which blocks a
-- second locale for the same slug — replace it with UNIQUE (slug, locale).
-- The table is empty in production at the time of this migration, so there is
-- no data risk.

ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;

-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS" — this DO block is the
-- standard idiom for the same effect. Needed because this migration's SQL
-- was already run directly against production once, out-of-band (before it
-- existed as a tracked file here), so the constraint can already be present
-- when this file gets replayed — a bare ADD CONSTRAINT fails with
-- "already exists" (42P07) in that case, which is exactly the error this
-- fixes. Safe either way: adds the constraint if missing, no-ops if present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_locale_key'
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_slug_locale_key UNIQUE (slug, locale);
  END IF;
END $$;

-- Locale is now part of every read path (list + detail + sitemap grouping).
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON public.blog_posts (locale);
