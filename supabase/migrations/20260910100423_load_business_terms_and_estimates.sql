-- Idempotent re-application (2026-09-10): this exact content was applied to
-- production earlier via a raw execute_sql call (not apply_migration), so it
-- was never tracked in supabase_migrations.schema_migrations and had no real
-- version to reference from a committed migration file -- a git-history-only
-- version of this same problem was found and fixed 2026-09-10 (see
-- docs/data-sources/... reconciliation notes). Re-running it now (values are
-- identical, confirmed via SELECT before this call) gives it a real, honest
-- migration version instead of a fabricated timestamp.

update public.providers set
  min_amount = 10,
  settlement_terms = 'Typically 1-5 business days end-to-end (funding 1-2 days, same-day for GBP Faster Payments/CHAPS; conversion and payout add another 1-2 days)',
  contract_type = 'Spot only — no forward contracts'
where slug = 'currencyfair';

update public.providers set
  min_amount = 0,
  settlement_terms = 'Same day to 2 business days depending on currency and corridor',
  contract_type = 'Spot only — no forward contracts'
where slug = 'wise';

update public.providers set
  min_amount = 0,
  settlement_terms = 'Typically 1-5 business days for business transfers',
  contract_type = 'Spot, Forward (bookable up to 24 months; beyond 12 months needs credit-team approval)'
where slug = 'xe';

update public.providers set
  settlement_terms = 'Most business payments delivered within 1-2 business days; real-time-rail corridors settle same day (over 70% processed within an hour)'
where slug = 'instarem';

update public.providers set
  min_amount = 50,
  settlement_terms = 'Spot contract: payment within 2 working days (T+2)'
where slug = 'moneycorp';

update public.providers set
  min_amount = 50
where slug = 'payoneer';

update public.providers set
  settlement_terms = 'Spot exchange settles near-instantly (typically under 10 seconds); FX Forwards settle on the contract''s chosen fixed or flexible settlement date',
  contract_type = 'Spot, FX Forwards (fixed-date and flexible-date contracts; standard tenor up to 12 months, up to 24 months for qualifying businesses)'
where slug = 'revolut';

update public.providers set
  min_amount = 10, min_amount_estimated = true,
  settlement_terms = 'Typically 1-2 business days (varies by corridor)', settlement_terms_estimated = true,
  contract_type = 'Spot', contract_type_estimated = true
where slug = 'cab-payments';

update public.providers set
  min_amount = 10, min_amount_estimated = true
where slug = 'revolut';

update public.providers set
  min_amount = 10, min_amount_estimated = true,
  contract_type = 'Spot', contract_type_estimated = true
where slug = 'instarem';

update public.providers set
  min_amount = 75, min_amount_estimated = true
where slug = 'western-union-business';
