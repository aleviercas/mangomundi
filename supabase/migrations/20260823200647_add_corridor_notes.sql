create table if not exists public.corridor_notes (
  id uuid primary key default gen_random_uuid(),
  sending_country text not null,
  receiving_country text not null,
  reason text not null,
  note text not null,
  created_at timestamptz not null default now(),
  unique (sending_country, receiving_country)
);

alter table public.corridor_notes enable row level security;

create policy "corridor_notes are publicly readable"
  on public.corridor_notes for select
  using (true);

insert into public.corridor_notes (sending_country, receiving_country, reason, note) values
  ('DE','RU','sanctions','Alemania → Rusia: Wise, Western Union y MoneyGram tienen operaciones suspendidas o muy restringidas por las sanciones de la UE/EEUU desde 2022. No se cargan tarifas porque ningún proveedor de la plataforma opera activamente este corredor de forma confiable.'),
  ('DE','SY','sanctions','Alemania → Siria: cobertura muy limitada por sanciones históricas; la situación post-2024 está en evolución pero no hay datos verificables de que Wise/WU/MoneyGram operen el corredor de forma estándar. Pendiente de re-investigar si la normalización avanza.'),
  ('SE','SO','missing_provider','Suecia → Somalia: corredor real y de alto volumen (diáspora somalí), pero dominado por especialistas tipo hawala (Dahabshiil, Taaj, Amal) que no están en nuestro catálogo de proveedores. Wise/WU no operan de forma confiable este corredor. Hace falta agregar un proveedor especialista, no solo cargar tarifas.'),
  ('NO','SO','missing_provider','Noruega → Somalia: mismo caso que Suecia → Somalia — corredor real dominado por especialistas hawala fuera de nuestro catálogo actual de proveedores.')
on conflict (sending_country, receiving_country) do nothing;
