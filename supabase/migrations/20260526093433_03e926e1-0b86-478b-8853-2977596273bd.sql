-- Multi-vertical foundation: providers can belong to FX, insurance, SaaS, brokers, etc.
CREATE TYPE public.provider_vertical AS ENUM ('fx', 'insurance', 'saas', 'brokers', 'shipping', 'lending', 'cloud', 'payments_infra', 'legal', 'recruitment', 'energy');

ALTER TABLE public.providers
  ADD COLUMN vertical public.provider_vertical NOT NULL DEFAULT 'fx',
  ADD COLUMN sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN sponsored_rank integer,
  ADD COLUMN trust_score numeric(3,1),                -- 0.0 - 10.0
  ADD COLUMN transparency_score numeric(3,1),         -- 0.0 - 10.0 (how transparent fee disclosure is)
  ADD COLUMN delivery_minutes integer,                -- typical delivery time in minutes
  ADD COLUMN min_amount numeric,
  ADD COLUMN max_amount numeric,
  ADD COLUMN supports_large_tickets boolean NOT NULL DEFAULT false,
  ADD COLUMN audience text NOT NULL DEFAULT 'retail', -- retail | business | both
  ADD COLUMN regulator text,                          -- FCA, FinCEN, etc.
  ADD COLUMN website_url text,
  ADD COLUMN review_count integer DEFAULT 0,
  ADD COLUMN promo_text text;                         -- short featured offer/promo

CREATE INDEX idx_providers_vertical ON public.providers(vertical) WHERE active = true;
CREATE INDEX idx_providers_sponsored ON public.providers(sponsored, sponsored_rank) WHERE active = true AND sponsored = true;

-- Blog (referenced by /blog route)
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_md text,
  cover_url text,
  audience text NOT NULL DEFAULT 'both',  -- retail | business | both
  vertical public.provider_vertical,       -- nullable: cross-vertical posts allowed
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE published = true;