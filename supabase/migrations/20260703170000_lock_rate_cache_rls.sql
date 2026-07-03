-- rate_cache: server-only FX rate snapshot (cross-worker cache). It is written
-- and read EXCLUSIVELY by the service-role client (supabaseAdmin) in
-- src/lib/fx.functions.ts. The table was originally created outside of
-- migrations and WITHOUT row-level security, so the public anon key had full
-- CRUD (READ/INSERT/UPDATE/DELETE) and could poison the FX rate cache.
--
-- This migration makes the table reproducible on fresh environments AND locks
-- it down. The service_role bypasses RLS, so the application is unaffected.

create table if not exists public.rate_cache (
  id text primary key,
  base text not null,
  rates jsonb not null,
  source text,
  fetched_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Enable RLS with NO policies on purpose: anon and authenticated get zero
-- access; service_role (supabaseAdmin) bypasses RLS entirely.
alter table public.rate_cache enable row level security;

-- Defense in depth: revoke the default PostgREST role grants so access is
-- denied at the privilege layer too, even if RLS were ever toggled off.
revoke all on table public.rate_cache from anon;
revoke all on table public.rate_cache from authenticated;
