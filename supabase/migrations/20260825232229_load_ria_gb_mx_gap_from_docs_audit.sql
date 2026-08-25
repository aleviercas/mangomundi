-- Carga del corredor Ria GB->MX, detectado como faltante durante la auditoria
-- de documentacion vs. Supabase del 25-ago-2026 (handoff). El dato ya estaba
-- investigado en claude/investigacion-tarifas-ria-xoom-2026-08-24.md pero
-- nunca se habia cargado a fx_rates (a diferencia de Ria US->MX y Xoom
-- GB->MX, que ya estaban cargados con valores mas recientes de otra ronda).
--
-- Fuente: riamoneytransfer.com/en-gb/send-money-to-mexico/, 23-ago-2026,
-- monto por defecto de carga (100 GBP), metodo Credit card -> Bank. Fee
-- estandar 2.90 GBP confirmado (se descarto explicitamente el fee promo 0
-- de "1a transferencia" con codigo HELLORIA). Tasa 23.04 GBP/MXN. Mid-market
-- xe.com 23.08009729 (23-ago-2026 16:52 UTC).
--
-- Nota: dato con 2 dias de antiguedad relativa a las cargas de tandas 1-5
-- (25-ago); se marca sin_confirmar por prudencia dado que no se reverifico
-- en vivo el mismo dia que el resto de esta ronda.
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','MXN',23.04,2.90,'ria','GB','MX',false,0.17,0.01,null,'riamoneytransfer.com/en-gb/send-money-to-mexico/, 100 GBP (monto por defecto de carga), metodo Credit card -> Bank. Fee estandar 2.90 GBP confirmado (se descarto el fee promo 0 de 1a transferencia con codigo HELLORIA). Mid-market xe.com 23.08009729 (23-ago-2026 16:52 UTC). Dato de investigacion previa (23/24-ago), no reverificado en vivo el 25-ago junto con el resto de la ronda -- se marca sin_confirmar por prudencia.','2026-08-24','sin_confirmar')
on conflict (provider_slug, sending_country, receiving_country, coalesce(min_amount, 0)) do nothing;
