-- Carga research "otras regiones" (25 ago 2026), tanda 2: Western Union
-- (FR->CI, FR->BJ, IT->EC, IT->PE), MoneyGram (DE->PL), Remitly (US->NG,
-- CA->NG, CA->GH), Ria (ES->PH, IT->PH), Paysend (US->PH, US->IN, GB->IN,
-- GB->PK), Xoom (US->PH). Corredores confirmados reales por fuente primaria
-- en docs/data-sources/2026-08-25b-auditoria-cobertura-otras-regiones.md,
-- cotizados en vivo con navegador secuencial.
--
-- Misma regla que rondas anteriores: solo precio regular, nunca promocional.
-- Se probo explicitamente WorldRemit AU->IN y AU->PK con multiples montos
-- (1000/2000/9990 AUD) y multiples metodos de entrega (Bank Transfer, Cash
-- Pickup, Mobile Money) y en TODOS los casos persistio el banner "First
-- Transfer Rate" sin forma de ver una tasa regular -- se EXCLUYEN de esta
-- carga, no se insertan filas para esos dos corredores.
--
-- Convencion de signo de public_spread_percent (igual a tandas anteriores):
-- spread = (mid_rate - tasa_ofrecida) / mid_rate * 100. Positivo = cliente
-- recibe MENOS que mid-market (costo). Negativo = recibe MAS (premium,
-- tipico en NGN por brecha oficial/paralelo).
-- Mid-market de referencia: xe.com, 25-ago-2026.

-- Western Union
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('EUR','XOF',655.9570,5.99,'western-union','FR','CI',false,0.00,0.01,null,'westernunion.com/fr/en/web/send-money/start, 500 EUR, precio regular confirmado (enlace "Apply promo" no aplicado por defecto). XOF esta fijado a EUR bajo el sistema del franco CFA, de ahi el spread ~0. Mid-market xe.com 655.95700002 (11:29 UTC)','2026-08-25','confirmado_activo'),
('EUR','XOF',655.9570,6.99,'western-union','FR','BJ',false,0.00,0.01,null,'westernunion.com/fr/fr/web/send-money/start, 500 EUR, precio regular confirmado, mismo patron que FR->CI. Mid-market xe.com 655.95700002 (11:29 UTC)','2026-08-25','confirmado_activo'),
('EUR','USD',1.1562,4.99,'western-union','IT','EC',false,0.93,0.01,null,'westernunion.com/it/en/web/send-money/start, 500 EUR, entrega cash pickup. El sitio muestra 100% OFF por defecto (fee 0) con el fee regular 4.99 tachado al lado -- se carga el valor regular tachado, no el promocional. Alternativa con entrega a cuenta bancaria: tasa 1.1842, fee regular tachado 1.99 (no cargada, se prioriza cash pickup). Mid-market xe.com 1.16710076 (09:35 UTC)','2026-08-25','confirmado_activo'),
('EUR','PEN',3.9575,3.99,'western-union','IT','PE',false,-1.04,0.01,null,'westernunion.com/it/en/web/send-money/start, 500 EUR, entrega cash pickup. Mismo patron: fee regular 3.99 tachado junto al promocional (0). Mid-market xe.com 3.91688629 (09:47 UTC)','2026-08-25','confirmado_activo');

-- MoneyGram
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('EUR','PLN',4.22,3.99,'moneygram','DE','PL',false,2.04,0.01,null,'moneygram.com/de/en/corridor/poland, widget de home, 500 EUR. Banner explicito "Special rate on your first transfer! 1 EUR = 4.30 PLN" y "No fees for new customers" (fee tachado 3.99->0.00) -- se carga el valor regular tachado (4.22 PLN / 3.99 EUR), no el promocional. Checkout completo requiere crear cuenta, no se pudo confirmar en flujo completo. Mid-market xe.com 4.30786601 (06:53 UTC)','2026-08-25','confirmado_activo');

-- Remitly
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','NGN',1374.67,0.00,'remitly','US','NG',false,-1.98,0.01,null,'remitly.com/us/en/money-transfer/send-money-to-nigeria, probado a 1000 y 2000 USD (identico en ambos). Disclaimer explicito: "Standard rate 1 USD = 1374.67 NGN applies to the rest of the transfer" tras los primeros 500 USD a welcome rate. Mid-market xe.com 1347.9485 (12:08 UTC)','2026-08-25','confirmado_activo'),
('CAD','NGN',993.74,0.00,'remitly','CA','NG',false,-2.13,0.01,null,'remitly.com/ca/en/money-transfer/send-money-to-nigeria, 1000 CAD. Disclaimer explicito "Standard rate 1 CAD = 993.74 NGN applies to the rest of the transfer" tras los primeros 500 CAD a welcome rate. Mid-market xe.com 973.01430445 (23:18 UTC 24-ago)','2026-08-25','confirmado_activo'),
('CAD','GHS',7.9851,0.00,'remitly','CA','GH',false,1.19,0.01,null,'remitly.com/ca/en/money-transfer/send-money-to-ghana, 1000 CAD, tasa etiquetada explicitamente "Everyday rate" (no promocional). Nota: existe una promo separada de -10 CAD de descuento en el total para primera transferencia, no afecta la tasa/fee reportados. Mid-market xe.com 8.08114019 (18:45 UTC)','2026-08-25','confirmado_activo');

-- Ria Money Transfer
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('EUR','PHP',71.60,3.00,'ria','ES','PH',false,0.48,0.01,null,'riamoneytransfer.com/en-es/send-money-to-philippines, 500 EUR, tasa y fee regulares (71.60 / 3.00) mostrados tachados junto a la promo de primera transferencia (73.2885 / 0.00). Mid-market xe.com 71.9432 (11:21 UTC)','2026-08-25','confirmado_activo'),
('EUR','PHP',71.15,1.00,'ria','IT','PH',false,1.10,0.01,null,'riamoneytransfer.com/en-it/send-money-to-philippines, 500 EUR, tasa y fee regulares (71.15 / 1.00) tachados junto a la promo. Mid-market xe.com 71.9432 (11:21 UTC)','2026-08-25','confirmado_activo');

-- Paysend
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','PHP',61.7076,2.66,'paysend','US','PH',false,-0.07,0.01,null,'paysend.com/en-us/send-money/from-the-united-states-of-america-to-philippines, 500 USD, sin banner promocional. Mid-market xe.com 61.6647 (10:07 UTC)','2026-08-25','confirmado_activo'),
('USD','INR',95.3984,2.66,'paysend','US','IN',false,0.02,0.01,null,'paysend.com/en-us/send-money/from-the-united-states-of-america-to-india, 500 USD, sin banner promocional. Mid-market xe.com 95.41823825 (10:06 UTC)','2026-08-25','confirmado_activo'),
('GBP','INR',130.1438,0.00,'paysend','GB','IN',false,-0.14,0.01,null,'paysend.com/en/send-money/from-united-kingdom-to-india, 500 GBP, fee 0 constante entre 100/500/1000 GBP (condicion estandar del corredor, no oferta de bienvenida). Mid-market xe.com 129.96281621 (15:54 UTC)','2026-08-25','confirmado_activo'),
('GBP','PKR',377.8061,0.00,'paysend','GB','PK',false,0.13,0.01,null,'paysend.com/en-uk/send-money/from-united-kingdom-to-pakistan, 500 GBP, fee 0 constante entre 500/1000 GBP. Mid-market xe.com 378.30463693 (11:35 UTC)','2026-08-25','confirmado_activo');

-- Xoom (PayPal)
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','PHP',59.7465,0.00,'xoom','US','PH',false,3.11,0.01,null,'xoom.com/philippines/send-money, 500 USD, opcion de entrega "Bank Deposit" pagando con cuenta bancaria/saldo PayPal (fee 0), sin etiqueta "First Time Rate" (esa etiqueta solo aplica a deposito con tarjeta de debito segun T&C de xoom.com/legal/xoom-new-user-promo). Otras opciones de entrega a este monto sin promo: Mobile Wallet 59.4739, Cash Pickup 58.7835, Door to Door 58.7835. Mid-market xe.com 61.6647 (10:07 UTC)','2026-08-25','confirmado_activo');
