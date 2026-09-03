-- Business broker table (design/Mangomundi 4 - Final.dc.html line 494-529):
-- Spread and Minimum already exist (providers.spread_percent, min_amount).
-- Settlement and Contract type do not exist anywhere yet -- added here as
-- nullable text so the UI can render them once real per-provider values are
-- filled in, without fabricating placeholder data in the meantime.
alter table public.providers
  add column if not exists settlement_terms text,
  add column if not exists contract_type text;

comment on column public.providers.settlement_terms is
  'Business/broker segment only: real settlement window (e.g. "T+2", "Same day"). Null until researched -- never fabricated.';
comment on column public.providers.contract_type is
  'Business/broker segment only: contract types this broker actually offers (e.g. "Spot, Forward"). Null until researched -- never fabricated.';

-- "Your request" panel (business quote flow) needs to capture which
-- brokers were added and the requested contract type/frequency -- these
-- didn't exist on enterprise_leads before (the prior flow only captured
-- corridor + amount + email).
alter table public.enterprise_leads
  add column if not exists contract_type text,
  add column if not exists frequency text,
  add column if not exists selected_provider_slugs text[];

comment on column public.enterprise_leads.contract_type is
  'Requested contract type from the business quote panel (e.g. "Spot", "Forward") -- lead-stated intent, not a fulfillment guarantee.';
comment on column public.enterprise_leads.frequency is
  'Requested transfer frequency from the business quote panel (e.g. "One-off", "Monthly") -- lead-stated intent.';
comment on column public.enterprise_leads.selected_provider_slugs is
  'providers.slug values the lead added to their request via "Add to request".';
