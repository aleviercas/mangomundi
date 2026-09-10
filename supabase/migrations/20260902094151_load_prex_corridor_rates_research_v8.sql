-- Research: docs/data-sources/2026-09-02-research-corredores-addendum-v8.md §2.
-- Real per-corridor Prex spreads/fees, measured live via prexcard.com.ar's
-- own calculator ($100.000 ARS reference), vs xe.com mid-market at the same
-- moment. Prex previously had ZERO fx_rates rows for any of its 15
-- supported_corridors (the comparator was falling back to the provider-level
-- spread_percent=1.0, a flat placeholder the providers.notes column itself
-- already flags as "ESTIMACION PROVISORIA"). fee is a flat amount in ARS
-- (the sending currency), matching this schema's existing flat-fee model for
-- every other provider — Prex's PE/UY/CL fee (1663.20 ARS) is proportional
-- in reality (~1.66% at this reference amount) but the schema has no
-- percentage-fee column, same simplification already applied to every other
-- provider here. Venezuela loaded as sin_confirmar per the research's own
-- caution (its spread, ~3.86%, breaks the 7.86-11.81% pattern every other
-- corridor clusters in — needs a second measurement before treating as firm).
-- Italy/Portugal are the research's own high-confidence currency-shared
-- inference from Germany/France (identical EUR quote), not separately
-- measured — loaded as confirmado_activo per the research's own recommendation
-- to accept that inference.
insert into fx_rates
  (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country,
   is_local_fx, public_spread_percent, data_source, data_collected_at, verified_status,
   speed_hours_approx, speed_display)
values
  ('ARS','MXN',0.00991,0,'prex','AR','MX',false,11.77,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','BRL',0.00301,0,'prex','AR','BR',false,11.69,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','COP',1.86086,0,'prex','AR','CO',false,10.90,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','BOB',0.00701,0,'prex','AR','BO',false,11.07,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','PYG',3.44614,0,'prex','AR','PY',false,11.81,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','VES',0.50846,0,'prex','AR','VE',false,3.86,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market. CAUTION: spread breaks the 7.86-11.81% pattern every other Prex corridor clusters in; VES mid-market reference itself may be unstable (multiple FX rates, high inflation, redenominations) — loaded sin_confirmar pending a second measurement, per the research''s own recommendation.','2026-09-02','sin_confirmar',24,'24 h'),
  ('ARS','PEN',0.00205,1663.20,'prex','AR','PE',false,7.86,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market. Fee is FX-only spread (7.86%); all-in cost including the flat ARS fee is ~9.42% at this reference amount.','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','UYU',0.0242,1663.20,'prex','AR','UY',false,9.23,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market. Fee is FX-only spread (9.23%); all-in cost including the flat ARS fee is ~10.75% at this reference amount.','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','CLP',0.56548,1663.20,'prex','AR','CL',false,8.65,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market. Fee is FX-only spread (8.65%); all-in cost including the flat ARS fee is ~10.17% at this reference amount.','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','EUR',0.00051,0,'prex','AR','DE',false,10.67,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','EUR',0.00051,0,'prex','AR','FR',false,10.67,'Browser research, Sept 2026 (v8 addendum) — prexcard.com.ar per-corridor calculator, ARS 100,000 reference, vs xe.com mid-market (identical quote to AR-DE, verified directly — Prex prices by currency, not by country)','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','EUR',0.00051,0,'prex','AR','IT',false,10.67,'Research inference, Sept 2026 (v8 addendum) — not separately measured; inferred from AR-DE/AR-FR (identical EUR quote, same currency), high-confidence per the research''s own recommendation to accept this inference','2026-09-02','confirmado_activo',24,'24 h'),
  ('ARS','EUR',0.00051,0,'prex','AR','PT',false,10.67,'Research inference, Sept 2026 (v8 addendum) — not separately measured; inferred from AR-DE/AR-FR (identical EUR quote, same currency), high-confidence per the research''s own recommendation to accept this inference','2026-09-02','confirmado_activo',24,'24 h');
