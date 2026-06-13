ALTER TABLE public.enterprise_leads
  ADD COLUMN IF NOT EXISTS monthly_volume NUMERIC,
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT;

CREATE INDEX IF NOT EXISTS idx_enterprise_leads_segment_status_created_at
  ON public.enterprise_leads (segment, status, created_at DESC);