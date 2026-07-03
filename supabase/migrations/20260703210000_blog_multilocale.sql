-- Blog goes multilingual (en/es/pt): the same post (slug) is stored as one row
-- per locale. The original schema made slug UNIQUE globally, which blocks a
-- second locale for the same slug — replace it with UNIQUE (slug, locale).
-- The table is empty in production at the time of this migration, so there is
-- no data risk.

ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_slug_locale_key UNIQUE (slug, locale);

-- Locale is now part of every read path (list + detail + sitemap grouping).
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON public.blog_posts (locale);
