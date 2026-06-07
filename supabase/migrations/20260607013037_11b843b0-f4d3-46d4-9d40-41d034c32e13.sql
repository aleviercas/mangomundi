
-- Tighten legacy `leads` INSERT (PII): require basic non-empty name + email
DROP POLICY IF EXISTS "Anyone submit lead" ON public.leads;
CREATE POLICY "Anyone submit lead with required fields"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(email)) > 3
    AND position('@' in email) > 1
  );

-- Tighten `affiliate_clicks` INSERT: require a non-empty provider_slug
DROP POLICY IF EXISTS "Anyone can log click" ON public.affiliate_clicks;
CREATE POLICY "Anyone can log click with provider"
  ON public.affiliate_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(btrim(provider_slug)) > 0);
