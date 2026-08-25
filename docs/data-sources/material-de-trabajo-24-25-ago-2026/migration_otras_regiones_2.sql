-- Carga research "otras regiones" (25 ago 2026), tanda 2: WU (FR->CI, FR->BJ,
-- IT->EC, IT->PE), MoneyGram (DE->PL), Remitly (US->NG, CA->NG, CA->GH),
-- Ria (ES->PH, IT->PH), Paysend (US->PH, US->IN, GB->IN, GB->PK), Xoom (US->PH).
--
-- Regla: solo precio regular, nunca promocional.
--
-- Convencion de signo: spread = (mid_rate - tasa_ofrecida) / mid_rate * 100.
-- Mid-market de referencia: xe.com, 25-ago-2026.

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('EUR','XOF',655.9570,5.99,'western-union','FR','CI',false,0.00,0.01,null,'westernunion.com/fr/en, cotizador sin login, 500 EUR. XOF fijado a EUR (peg del franco CFA). Mid-market xe.com 655.95700002','2026-08-25','confirmado_activo'),
('EUR','XOF',655.9570,6.99,'western-union','FR','BJ',false,0.00,0.01,null,'westernunion.com/fr/fr, cotizador sin login, 500 EUR. Mismo peg que CI. Mid-market xe.com 655.95700002','2026-08-25','confirmado_activo'),
('EUR','USD',1.1562,4.99,'western-union','IT','EC',false,0.93,0.01,null,'westernunion.com/it/en, cotizador sin login, 500 EUR, cash pickup, fee regular tachado junto al promo (100% OFF). Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('EUR','PEN',3.9575,3.99,'western-union','IT','PE',false,-1.04,0.01,null,'westernunion.com/it/en, cotizador sin login, 500 EUR, cash pickup, mismo patron de tachado. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('EUR','PLN',4.22,3.99,'moneygram','DE','PL',false,2.04,0.01,null,'moneygram.com/de/en, calculadora de home, 500 EUR. Banner explicito "first transfer"; se cargo el valor regular tachado. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('USD','NGN',1374.67,0.00,'remitly','US','NG',false,-1.98,0.01,null,'remitly.com/us/en, cotizador sin login, "Standard rate" explicito, probado a 1000 y 2000 USD. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('CAD','NGN',993.74,0.00,'remitly','CA','NG',false,-2.13,0.01,null,'remitly.com/ca/en, cotizador sin login, "Standard rate" explicito a 1000 CAD. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('CAD','GHS',7.9851,0.00,'remitly','CA','GH',false,1.19,0.01,null,'remitly.com/ca/en, cotizador sin login, etiquetado "Everyday rate". Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('EUR','PHP',71.60,3.00,'ria','ES','PH',false,0.48,0.01,null,'riamoneytransfer.com/en-es, calculadora sin login, 500 EUR, tasa/fee regulares tachados junto a la promo. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('EUR','PHP',71.15,1.00,'ria','IT','PH',false,1.10,0.01,null,'riamoneytransfer.com/en-it, calculadora sin login, 500 EUR, idem. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('USD','PHP',61.7076,2.66,'paysend','US','PH',false,-0.07,0.01,null,'paysend.com, cotizador sin login, 500 USD, sin banner promocional. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('USD','INR',95.3984,2.66,'paysend','US','IN',false,0.02,0.01,null,'paysend.com, cotizador sin login, 500 USD, sin banner promocional. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('GBP','INR',130.1438,0.00,'paysend','GB','IN',false,-0.14,0.01,null,'paysend.com, cotizador sin login, 500 GBP, fee 0 constante entre montos (no es promo). Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('GBP','PKR',377.8061,0.00,'paysend','GB','PK',false,0.13,0.01,null,'paysend.com, cotizador sin login, 500 GBP, idem. Mid-market xe.com referencia dia','2026-08-25','confirmado_activo'),
('USD','PHP',59.7465,0.00,'xoom','US','PH',false,3.11,0.01,null,'xoom.com/philippines/send-money, 500 USD, entrega "Bank Deposit" sin etiqueta "First Time Rate". Mid-market xe.com referencia dia','2026-08-25','confirmado_activo');

-- No cargados en esta tanda -- probados multiples montos/metodos y persistio
-- el banner promocional en todos:
-- WorldRemit AU->IN: probado a 1000/2000/9990 AUD, siempre "First Transfer Rate".
-- WorldRemit AU->PK: mismo resultado, probado ademas con Cash Pickup y Mobile Money.
