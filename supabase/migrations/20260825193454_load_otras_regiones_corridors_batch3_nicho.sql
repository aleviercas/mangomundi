-- Carga research "otras regiones" (25 ago 2026), tanda 3: pares prioritarios
-- de proveedores de nicho -- TapTap Send (GB->PK, GB->PH), Sendwave
-- (CA->IN, FR->IN), NALA (GB->GH).
--
-- NOTA: este archivo reemplaza a un mirror anterior mal numerado
-- (20260825100100_...) que usaba un timestamp inventado que no coincidia
-- con el version real aplicado en Supabase (causaba el error de CI "Remote
-- migration versions not found in local migrations directory"). Este
-- archivo usa el version real: 20260825193454.
--
-- Convencion de signo: spread = (mid_rate - tasa_ofrecida) / mid_rate * 100.
-- Mid-market de referencia: xe.com, 25-ago-2026.

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','PKR',378.200,0.00,'taptap-send','GB','PK',false,0.03,0.01,null,'taptapsend.com/en-gb, calculadora de home sin login, 500 GBP, sin banner de bienvenida/first transfer (solo un testimonio historico de bono referido, no aplicado al calculo). Mid-market xe.com 378.30463693 (11:35 UTC)','2026-08-25','confirmado_activo'),
('GBP','PHP',83.800,0.00,'taptap-send','GB','PH',false,0.43,0.01,null,'taptapsend.com/en-gb, calculadora de home sin login, 500 GBP, fee mostrado como "from £0.00*" (variable segun metodo de entrega en el checkout real, no promocional). Mid-market xe.com 84.15952569 (03:15 UTC)','2026-08-25','confirmado_activo'),
('CAD','INR',68.640,1.99,'sendwave','CA','IN',false,0.66,0.01,null,'sendwave.com/en-gb, calculadora de home sin login, 500 CAD. Sin rotulo "Intro Rate Discount" (que Sendwave si muestra tachado cuando hay promo, verificado en corredor GB->PH de referencia). Mid-market xe.com 69.09831536 (18:07 UTC 24-ago)','2026-08-25','confirmado_activo'),
('EUR','INR',110.925,0.99,'sendwave','FR','IN',false,0.31,0.01,null,'sendwave.com/en-gb, calculadora de home sin login, 500 EUR. Sin rotulo de intro/descuento. Mid-market xe.com 111.26707161 (12:04 UTC)','2026-08-25','confirmado_activo'),
('GBP','GHS',15.26,0.00,'nala','GB','GH',false,-0.38,0.01,null,'nala.com, "Rates calculator" en home sin login, 500 GBP, sin fee explicito (costo via spread). Confirmado por la propia pestaña "Compare rates" del widget, que compara en tiempo real contra Remitly y Western Union con timestamp -- consistente con tasa de mercado corriente, no oferta aislada de bienvenida. Mid-market xe.com 15.20297229 (14:30 UTC)','2026-08-25','confirmado_activo');
