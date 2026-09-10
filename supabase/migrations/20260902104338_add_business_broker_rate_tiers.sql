-- research v8 addendum Section 13.1: business brokers (Airwallex, CAB
-- Payments, Moneycorp, OFX, Payoneer, Convera/western-union-business) quote
-- differently by currency pair and volume, which the flat
-- providers.spread_percent (and even providers.fee_tiers, which only tiers
-- by amount, not currency pair) cannot represent. This table adds the
-- missing dimension: currency-pair + amount-range tiers, looked up in
-- compareProviders BEFORE falling back to the existing resolveTier() logic.
-- Left EMPTY here -- no real tiered rate data has been researched yet for
-- any of these brokers (that research is still open, per v8 addendum) --
-- so this migration only adds the schema/lookup, changing no pricing until
-- real rows are loaded.
create table if not exists public.business_broker_rate_tiers (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null,
  from_currency text not null,
  to_currency text not null,
  min_amount numeric,
  max_amount numeric,
  spread_percent numeric not null,
  fee_percent numeric not null default 0,
  fee_fixed numeric not null default 0,
  data_source text,
  data_collected_at date,
  created_at timestamptz not null default now()
);

create index if not exists business_broker_rate_tiers_lookup_idx
  on public.business_broker_rate_tiers (provider_slug, from_currency, to_currency);

alter table public.business_broker_rate_tiers enable row level security;

create policy "business_broker_rate_tiers are publicly readable"
  on public.business_broker_rate_tiers for select
  using (true);
