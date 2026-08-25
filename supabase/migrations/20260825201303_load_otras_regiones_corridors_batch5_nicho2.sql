-- Carga research "otras regiones" (25 ago 2026), tanda 5: pares prioritarios
-- adicionales de nicho -- LemFi (GB->PK, GB->PH), Sendwave (GB->IN), NALA
-- (GB->IN, GB->PK, GB->PH), TapTap Send (FR->SN, GB->UG).
--
-- NOTA: este archivo reemplaza a un mirror anterior mal numerado
-- (20260825100300_...) que usaba un timestamp inventado que no coincidia
-- con el version real aplicado en Supabase (causaba el error de CI "Remote
-- migration versions not found in local migrations directory"). Este
-- archivo usa el version real: 20260825201303.
--
-- Convencion de signo: spread = (mid_rate - tasa_ofrecida) / mid_rate * 100.
-- Mid-market de referencia: xe.com, 25-ago-2026.

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','PKR',378.41,0.00,'lemfi','GB','PK',false,-0.03,0.01,null,'lemfi.com/en-gb, calculadora de home sin login, 500 GBP. Fee 0.99 GBP a 100 GBP pero 0.00 GBP a 500 GBP, sin etiqueta que aclare si es tramo de fee estandar o promo "envia mas, paga menos" -- se marca sin_confirmar por prudencia. Mid-market xe.com 378.30463693 (11:35 UTC)','2026-08-25','sin_confirmar'),
('GBP','PHP',83.8,1.00,'lemfi','GB','PH',false,0.43,0.01,null,'lemfi.com/en-gb, calculadora de home sin login, 500 GBP, sin banner promocional. Mid-market xe.com 84.15952569 (03:15 UTC)','2026-08-25','confirmado_activo'),
('GBP','INR',129.655,0.99,'sendwave','GB','IN',false,0.24,0.01,null,'sendwave.com/en-gb, calculadora de home sin login, 500 GBP. Se verifico explicitamente que el rotulo "Intro Rate Discount" (presente en el corredor GB->PH de Sendwave) esta ausente para India. Mid-market xe.com 129.96281621 (15:54 UTC)','2026-08-25','confirmado_activo'),
('GBP','INR',129.90028,0.00,'nala','GB','IN',false,0.05,0.01,null,'nala.com, "Rates calculator" en home sin login, 500 GBP, sin fee explicito (costo via spread, diseno consistente del sitio en todos los corredores). Sin banner promocional. Mid-market xe.com 129.96281621 (15:54 UTC)','2026-08-25','confirmado_activo'),
('GBP','PKR',377.80908,0.00,'nala','GB','PK',false,0.13,0.01,null,'nala.com, calculadora de home sin login, 500 GBP, sin fee explicito, sin banner promocional. Mid-market xe.com 378.30463693 (11:35 UTC)','2026-08-25','confirmado_activo'),
('GBP','PHP',83.48242,0.00,'nala','GB','PH',false,0.80,0.01,null,'nala.com, calculadora de home sin login, 500 GBP, sin fee explicito, sin banner promocional. Mid-market xe.com 84.15952569 (03:15 UTC)','2026-08-25','confirmado_activo'),
('EUR','XOF',655.957,0.00,'taptap-send','FR','SN',false,0.00,0.01,null,'taptapsend.com/en-gb, calculadora de home sin login, 500 EUR, etiqueta "No transfer fees" (modelo estandar del proveedor, sin promo). XOF fijado a EUR bajo el sistema del franco CFA, de ahi el spread ~0. Mid-market xe.com 655.95700002 (11:29 UTC)','2026-08-25','confirmado_activo'),
('GBP','UGX',5030.000,0.00,'taptap-send','GB','UG',false,1.11,0.01,null,'taptapsend.com/en-gb, calculadora de home sin login, 500 GBP, etiqueta "No transfer fees", sin banner promocional. Mid-market xe.com 5086.2417 (15:00 UTC)','2026-08-25','confirmado_activo');
