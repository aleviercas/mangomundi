
-- FX rates: corridor + transparency
ALTER TABLE public.fx_rates
  ADD COLUMN IF NOT EXISTS sending_country text,
  ADD COLUMN IF NOT EXISTS receiving_country text,
  ADD COLUMN IF NOT EXISTS is_local_fx boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_spread_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_amount numeric,
  ADD COLUMN IF NOT EXISTS max_amount numeric,
  ADD COLUMN IF NOT EXISTS affiliate_url_template text;

-- Enterprise leads: RFQ + GDPR audit
ALTER TABLE public.enterprise_leads
  ADD COLUMN IF NOT EXISTS request_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS from_currency text,
  ADD COLUMN IF NOT EXISTS to_currency text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS sending_country text,
  ADD COLUMN IF NOT EXISTS receiving_country text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS privacy_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz;

-- Retail leads (preferred rate channel)
CREATE TABLE IF NOT EXISTS public.retail_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  amount numeric NOT NULL,
  sending_country text,
  receiving_country text,
  provider_slug text,
  affiliate_code text NOT NULL DEFAULT 'MANGOGLOBAL05',
  privacy_consent boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'preferred_rate_requested',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.retail_leads TO anon, authenticated;
GRANT ALL ON public.retail_leads TO service_role;

ALTER TABLE public.retail_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit retail lead"
  ON public.retail_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (privacy_consent = true);

CREATE POLICY "Admins read retail leads"
  ON public.retail_leads FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Blog posts: per-locale variants
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';
