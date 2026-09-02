-- W11 (2026-09-02 feedback): "los proveedores que no tienen valores completar
-- con el estimado aclarar que es estimado" -- track which of the three
-- business-terms fields hold a real, sourced value vs. a logical estimate
-- (median of same provider_type peers with real data), so the UI can label
-- estimated ones with "Est." instead of presenting them as verified facts.
alter table public.providers
  add column if not exists min_amount_estimated boolean not null default false,
  add column if not exists settlement_terms_estimated boolean not null default false,
  add column if not exists contract_type_estimated boolean not null default false;

comment on column public.providers.min_amount_estimated is
  'true = min_amount is a logical estimate (no public source found), not a sourced figure. UI must show "Est." when true.';
comment on column public.providers.settlement_terms_estimated is
  'true = settlement_terms is a logical estimate (no public source found), not a sourced figure. UI must show "Est." when true.';
comment on column public.providers.contract_type_estimated is
  'true = contract_type is a logical estimate (no public source found), not a sourced figure. UI must show "Est." when true.';
