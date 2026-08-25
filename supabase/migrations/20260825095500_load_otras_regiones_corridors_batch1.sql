-- Carga research "otras regiones" (25 ago 2026), tanda 1: Western Union,
-- MoneyGram, WorldRemit, Ria, Paysend, Xoom. Corredores confirmados reales
-- por fuente primaria en docs/data-sources/2026-08-25b-auditoria-cobertura-otras-regiones.md,
-- cotizados en vivo con navegador (500 unidades de la moneda de origen).
--
-- Misma regla que el research de Argentina: solo precio regular, nunca
-- promocional. Se excluyeron explicitamente: MoneyGram GB->GH (solo se pudo
-- ver la tarifa promocional de primera transferencia, la regular no se
-- pudo confirmar sin login), Remitly US->NG (a 500 USD el monto entero cae
-- dentro de la ventana de "welcome rate", no hay tarifa regular verificable
-- a ese monto), Paysend ES->MX (0 EUR explicitamente marcado como oferta de
-- nuevo cliente), Xoom AU->PH y AU->IN (banner "First Time Rate" explicito).
--
-- Convencion de signo de public_spread_percent: positivo = el cliente
-- recibe MENOS que el mid-market (margen a favor del proveedor); negativo =
-- recibe MAS (tasa "premium", tipico en NGN por la brecha oficial/paralelo).
-- Formula: spread = (mid_rate - tasa_ofrecida) / mid_rate * 100.
-- Mid-market de referencia: xe.com, 25-ago-2026 (hora UTC exacta variable
-- por par, indicada en el data_source de cada fila).
--
-- NOTA: este archivo se comitea primero al repo (create_or_update_file
-- funciono durante una interrupcion del clasificador de seguridad que SI
-- bloqueo temporalmente mcp__Supabase__apply_migration); se aplica a la
-- base de Supabase en cuanto esa herramienta se recupera, con este mismo
-- SQL exacto, para no perder el trabajo si la sesion se corta.

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('EUR','MXN',19.3811,0.00,'western-union','ES','MX',false,2.03,0.01,null,'westernunion.com/es/en, cotizador en vivo sin login, 500 EUR. Mid-market xe.com 19.78127968 (18:09 UTC)','2026-08-25','confirmado_activo'),
('KWD','INR',308.5104,1.25,'western-union','KW','IN',false,0.59,0.01,null,'westernunion.com/kw/en, widget de home (checkout completo dio error tecnico repetido; tasa no vario entre 100/500/650 KWD probados). Mid-market xe.com 310.33212697 (18:06 UTC)','2026-08-25','sin_confirmar'),
('QAR','INR',26.1377,0.00,'western-union','QA','IN',false,0.57,0.01,null,'westernunion.com/qa/en, cotizador en vivo confirmado en flujo completo de checkout, 1800 QAR, sin banner promocional. Mid-market xe.com 26.28659605 (09:46 UTC 22-ago)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','NGN',1381.66,0.99,'moneygram','US','NG',false,-2.50,0.01,null,'moneygram.com/mgo/us/en, calculadora de home, 500 USD, tasa "regular" mostrada junto a la promocional tachada (excluye promo: 1417.80 NGN, fee 0). Mid-market xe.com 1347.9485 (12:08 UTC)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','INR',95.0866,0.99,'worldremit','US','IN',false,0.35,0.01,null,'worldremit.com/en-us/india, cotizador en vivo sin login, 500 USD, sin banner promocional. Mid-market xe.com 95.4182 (10:06 UTC)','2026-08-25','confirmado_activo'),
('GBP','PKR',370.86,0.00,'worldremit','GB','PK',false,1.92,0.01,null,'worldremit.com/en-gb/pakistan, 500 GBP, metodo Cash Pickup (Bank Transfer por defecto mostraba First Transfer Rate promocional ~2.4-2.7% mejor). Mid-market xe.com 378.12 (03:15 UTC)','2026-08-25','sin_confirmar');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','PHP',61.275,0.90,'ria','US','PH',false,0.63,0.01,null,'riamoneytransfer.com/en-us/send-money-to-philippines, 500 USD, tasa regular tachada junto a la promocional (excluye promo: 63.4049, fee 0). Mid-market xe.com 61.6647 (10:07 UTC)','2026-08-25','confirmado_activo'),
('GBP','PHP',84.030918,0.00,'ria','GB','PH',false,0.15,0.01,null,'riamoneytransfer.com/en-gb/send-money-to-philippines, 500 GBP. Tasa regular a este monto, pero el fee 0 podria seguir siendo exencion promocional de primera transferencia. Mid-market xe.com 84.1595 (03:15 UTC)','2026-08-25','sin_confirmar');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','MXN',16.7525,0.99,'paysend','US','MX',false,1.15,0.01,null,'paysend.com/hi-us/send-money/from-the-united-states-of-america-to-mexico, 500 USD, sin banner promocional. Mid-market xe.com 16.9469 (10:04 UTC)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','MXN',22.3822,2.99,'xoom','GB','MX',false,3.19,0.01,null,'xoom.com/mexico/send-money, 500 GBP, "Best Xoom Rate", banco/debito. Mid-market xe.com 23.12059293 (18:09 UTC)','2026-08-25','confirmado_activo'),
('GBP','PHP',81.9466,0.99,'xoom','GB','PH',false,2.63,0.01,null,'xoom.com/philippines/send-money, 500 GBP, "Best Xoom Rate", billetera movil. Mid-market xe.com 84.1595 (03:15 UTC)','2026-08-25','confirmado_activo'),
('CAD','PHP',43.5816,0.00,'xoom','CA','PH',false,2.27,0.01,null,'xoom.com/philippines/send-money, 500 CAD, rotulo regular/promo ambiguo para este par. Mid-market xe.com 44.59625768 (14:15 UTC)','2026-08-25','sin_confirmar'),
('CAD','INR',68.0114,0.00,'xoom','CA','IN',false,1.57,0.01,null,'xoom.com/india/send-money, 500 CAD, "Best Xoom Rate" confirmado, sin banner promocional. Mid-market xe.com 69.0983 (18:07 UTC)','2026-08-25','confirmado_activo');
