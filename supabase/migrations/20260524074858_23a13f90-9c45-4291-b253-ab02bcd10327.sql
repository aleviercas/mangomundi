
-- Add fee_tiers (variable fees by amount) and last_updated to providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS fee_tiers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supported_corridors text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rates_last_updated timestamptz DEFAULT now();

-- Seed/expand providers (idempotent via upsert by slug)
INSERT INTO public.providers (slug, name, logo_emoji, segment, fee_percent, fee_fixed, spread_percent, speed_hours, affiliate_url, featured, notes, fee_tiers)
VALUES
  ('wise', 'Wise', '🟢', 'both', 0.43, 0.5, 0.0, 4, 'https://wise.com/?utm_source=mangoglobal', true, 'Mid-market rate, transparent fees', '[{"max":1000,"fee_percent":0.65,"fee_fixed":0.5},{"max":10000,"fee_percent":0.43,"fee_fixed":0.5},{"max":1000000,"fee_percent":0.35,"fee_fixed":0.5}]'::jsonb),
  ('revolut', 'Revolut', '⚫', 'both', 0.0, 0.0, 0.5, 1, 'https://revolut.com/?utm_source=mangoglobal', true, 'Free on weekdays up to plan limit', '[{"max":1000,"fee_percent":0,"fee_fixed":0,"spread_percent":0.4},{"max":1000000,"fee_percent":0.5,"fee_fixed":0,"spread_percent":0.6}]'::jsonb),
  ('remitly', 'Remitly', '🔵', 'retail', 0.0, 3.99, 1.2, 24, 'https://remitly.com/?utm_source=mangoglobal', false, 'Cash pickup & bank deposit', '[]'::jsonb),
  ('western-union', 'Western Union', '🟡', 'retail', 0.0, 5.0, 2.5, 1, 'https://westernunion.com/?utm_source=mangoglobal', false, 'Largest global cash network', '[]'::jsonb),
  ('moneygram', 'MoneyGram', '🔴', 'retail', 0.0, 4.99, 2.2, 1, 'https://moneygram.com/?utm_source=mangoglobal', false, 'Cash pickup worldwide', '[]'::jsonb),
  ('ofx', 'OFX', '🔷', 'business', 0.0, 0.0, 0.6, 48, 'https://ofx.com/?utm_source=mangoglobal', false, 'No fees, business-friendly', '[{"max":10000,"fee_percent":0,"fee_fixed":15,"spread_percent":1.0},{"max":1000000,"fee_percent":0,"fee_fixed":0,"spread_percent":0.5}]'::jsonb),
  ('xe', 'XE Money Transfer', '🌐', 'both', 0.0, 3.0, 1.5, 24, 'https://xe.com/?utm_source=mangoglobal', false, '60+ currencies', '[]'::jsonb),
  ('worldremit', 'WorldRemit', '🟣', 'retail', 0.0, 2.99, 1.8, 24, 'https://worldremit.com/?utm_source=mangoglobal', false, 'Mobile money & bank', '[]'::jsonb),
  ('instarem', 'Instarem', '🟠', 'both', 0.25, 0.0, 0.7, 24, 'https://instarem.com/?utm_source=mangoglobal', false, 'Asia-Pacific specialist', '[]'::jsonb),
  ('ria', 'Ria Money Transfer', '🟢', 'retail', 0.0, 3.99, 2.0, 4, 'https://riamoneytransfer.com/?utm_source=mangoglobal', false, 'LATAM specialist, cash pickup', '[]'::jsonb),
  ('xoom', 'Xoom (PayPal)', '🔵', 'retail', 0.0, 4.99, 1.9, 1, 'https://xoom.com/?utm_source=mangoglobal', false, 'Backed by PayPal', '[]'::jsonb),
  ('currencies-direct', 'Currencies Direct', '🟤', 'business', 0.0, 0.0, 0.8, 24, 'https://currenciesdirect.com/?utm_source=mangoglobal', false, 'UK FX broker, no fees', '[]'::jsonb),
  ('torfx', 'TorFX', '⚪', 'business', 0.0, 0.0, 0.7, 24, 'https://torfx.com/?utm_source=mangoglobal', false, 'Personal broker, no fees', '[]'::jsonb),
  ('skrill', 'Skrill', '🟪', 'retail', 1.45, 0.0, 3.0, 1, 'https://skrill.com/?utm_source=mangoglobal', false, 'Digital wallet', '[]'::jsonb),
  ('paysend', 'Paysend', '🟦', 'retail', 0.0, 1.99, 1.5, 1, 'https://paysend.com/?utm_source=mangoglobal', false, 'Card-to-card, flat fee', '[]'::jsonb),
  ('atlantic-money', 'Atlantic Money', '🌊', 'retail', 0.0, 3.0, 0.0, 24, 'https://atlanticmoney.com/?utm_source=mangoglobal', false, 'Flat £3 fee, mid-market rate', '[]'::jsonb),
  ('moneycorp', 'Moneycorp', '🏛️', 'business', 0.0, 0.0, 0.9, 24, 'https://moneycorp.com/?utm_source=mangoglobal', false, 'Corporate treasury', '[]'::jsonb),
  ('cab-payments', 'Crown Agents Bank', '👑', 'business', 0.0, 25.0, 0.6, 24, 'https://cab.global/?utm_source=mangoglobal', false, 'Emerging markets specialist', '[]'::jsonb),
  ('airwallex', 'Airwallex', '✈️', 'business', 0.0, 0.0, 0.6, 4, 'https://airwallex.com/?utm_source=mangoglobal', false, 'Multi-currency business accounts', '[]'::jsonb),
  ('payoneer', 'Payoneer', '🟠', 'business', 2.0, 0.0, 0.5, 24, 'https://payoneer.com/?utm_source=mangoglobal', false, 'Freelancer & marketplace payouts', '[]'::jsonb),
  ('western-union-business', 'WU Business Solutions', '🟡', 'business', 0.0, 15.0, 1.0, 24, 'https://business.westernunion.com/?utm_source=mangoglobal', false, 'Mass payouts', '[]'::jsonb),
  ('currencyfair', 'CurrencyFair', '🍀', 'both', 0.0, 3.0, 0.45, 24, 'https://currencyfair.com/?utm_source=mangoglobal', false, 'Peer-to-peer marketplace', '[]'::jsonb),
  ('transfergo', 'TransferGo', '🚀', 'retail', 0.0, 0.99, 0.9, 1, 'https://transfergo.com/?utm_source=mangoglobal', false, 'EU & emerging markets', '[]'::jsonb),
  ('azimo', 'Azimo (Papaya)', '🥭', 'retail', 0.0, 2.99, 1.7, 24, 'https://azimo.com/?utm_source=mangoglobal', false, 'Acquired by Papaya', '[]'::jsonb),
  ('small-world', 'Small World FS', '🌍', 'retail', 0.0, 3.5, 2.0, 4, 'https://smallworldfs.com/?utm_source=mangoglobal', false, 'Africa & LATAM focus', '[]'::jsonb),
  ('lemfi', 'LemFi', '🦁', 'retail', 0.0, 0.0, 1.2, 1, 'https://lemfi.com/?utm_source=mangoglobal', false, 'Africa specialist, low cost', '[]'::jsonb),
  ('sendwave', 'Sendwave', '🌊', 'retail', 0.0, 0.0, 2.5, 1, 'https://sendwave.com/?utm_source=mangoglobal', false, 'Africa, no fee', '[]'::jsonb),
  ('taptap-send', 'TapTap Send', '👏', 'retail', 0.0, 0.0, 2.0, 1, 'https://taptapsend.com/?utm_source=mangoglobal', false, 'Africa & Asia, no fee', '[]'::jsonb),
  ('nala', 'NALA', '🌟', 'retail', 0.0, 0.0, 1.5, 1, 'https://nala.com/?utm_source=mangoglobal', false, 'East Africa specialist', '[]'::jsonb),
  ('zing', 'Zing (HSBC)', '🏦', 'retail', 0.0, 0.0, 0.6, 4, 'https://zing.me/?utm_source=mangoglobal', false, 'HSBC-backed multi-currency', '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_emoji = EXCLUDED.logo_emoji,
  segment = EXCLUDED.segment,
  fee_percent = EXCLUDED.fee_percent,
  fee_fixed = EXCLUDED.fee_fixed,
  spread_percent = EXCLUDED.spread_percent,
  speed_hours = EXCLUDED.speed_hours,
  affiliate_url = EXCLUDED.affiliate_url,
  featured = EXCLUDED.featured,
  notes = EXCLUDED.notes,
  fee_tiers = EXCLUDED.fee_tiers,
  updated_at = now();
