-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users see own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);

create policy "Admins manage roles" on public.user_roles
for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Providers
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_emoji text,
  segment text not null default 'retail' check (segment in ('retail','business','both')),
  fee_percent numeric(6,3) not null default 0,
  fee_fixed numeric(10,2) not null default 0,
  spread_percent numeric(6,3) not null default 0,
  speed_hours numeric(6,2) not null default 24,
  affiliate_url text not null,
  featured boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers enable row level security;

create policy "Anyone reads active providers" on public.providers
for select using (active = true);

create policy "Admins manage providers" on public.providers
for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Affiliate clicks
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null,
  amount numeric(14,2),
  from_currency text,
  to_currency text,
  segment text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.affiliate_clicks enable row level security;

create policy "Anyone can log click" on public.affiliate_clicks
for insert with check (true);

create policy "Admins read clicks" on public.affiliate_clicks
for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create index idx_affiliate_clicks_created on public.affiliate_clicks (created_at desc);
create index idx_affiliate_clicks_provider on public.affiliate_clicks (provider_slug);

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  monthly_volume text,
  message text,
  source text default 'fx-tool',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Anyone submit lead" on public.leads
for insert with check (true);

create policy "Admins read leads" on public.leads
for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger providers_updated before update on public.providers
for each row execute function public.tg_set_updated_at();