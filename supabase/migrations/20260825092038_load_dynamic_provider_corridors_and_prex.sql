-- Carga de research 24-25 ago 2026: cierre de brechas de corredores para
-- proveedores dinamicos (fee_tiers no aplica -- ver docs/data-sources/
-- 2026-08-25-research-corredores-dinamicos-y-argentina.md seccion 3 para el porque).
--
-- Regla aplicada (pedido explicito del usuario 25-ago-2026): NO se cargan
-- tasas/fees promocionales o de "primera transferencia". Solo precio regular
-- ("everyday"/"tasa normal"/tramo post-promocion). Fuente primaria unica:
-- cotizador oficial de cada proveedor, sin login, 25 ago 2026.
--
-- Convencion de signo de public_spread_percent en este archivo:
-- positivo = el cliente recibe MENOS que el tipo de cambio mid-market
--            (margen a favor del proveedor, como en el resto del catalogo)
-- negativo = el cliente recibe MAS que el mid-market (tasa "premium",
--            frecuente en NGN por la brecha oficial/paralelo)
-- Formula: spread = (mid_rate - tasa_ofrecida) / mid_rate * 100
-- Se recalculo con esta formula para TODOS los valores de esta migracion,
-- independientemente de que signo haya usado el documento de research
-- original (dos documentos de research usaron convenciones de signo
-- distintas entre si -- se normalizo todo a esta unica convencion, la
-- misma que ya usan Wise, BDO Remit y Money2India en la base).

-- ---------------------------------------------------------------------
-- GB -> IN (GBP -> INR), mid-market referencia 25 ago 2026: 1 GBP = 130.505 INR (xe.com)
-- ---------------------------------------------------------------------

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status)
values ('GBP','INR',130.4310,0.00,'western-union','GB','IN',false,0.06,1000,null,'Cotizador oficial westernunion.com/gb/en, sin login, tramo >=1000 GBP (tramo <1000 GBP muestra tasa distinta, posible promocional, no cargado)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status)
values ('GBP','INR',130.3758,0.00,'moneygram','GB','IN',false,0.10,5000,null,'Calculadora moneygram.com/mgo/gb/en, sin login, tramo 5000-10000 GBP (tramo 100-1000 muestra "pricing effective for first online transfer only", no cargado)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','INR',130.21,1.50,'ria','GB','IN',false,0.23,0.01,999.99,'riamoneytransfer.com/en-gb, calculadora sin login, "fee/tasa normal" (excluye tasa promo 1a transferencia 132.21)','2026-08-25','confirmado_activo'),
('GBP','INR',130.21,2.00,'ria','GB','IN',false,0.23,1000,4999.99,'riamoneytransfer.com/en-gb, calculadora sin login, "fee/tasa normal"','2026-08-25','confirmado_activo'),
('GBP','INR',130.21,6.00,'ria','GB','IN',false,0.23,5000,7999.99,'riamoneytransfer.com/en-gb, calculadora sin login, "fee/tasa normal"','2026-08-25','confirmado_activo'),
('GBP','INR',130.21,10.00,'ria','GB','IN',false,0.23,8000,8000,'riamoneytransfer.com/en-gb, calculadora sin login, "fee/tasa normal". 8000 GBP = tope maximo del corredor (10000 fue rechazado por el sitio)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','INR',128.8888,1.99,'xoom','GB','IN',false,1.24,0.01,999.99,'xoom.com, cotizador sin login, pago con banco/tarjeta','2026-08-25','confirmado_activo'),
('GBP','INR',129.1473,0.00,'xoom','GB','IN',false,1.04,1000,4999.99,'xoom.com, cotizador sin login, pago con banco/tarjeta','2026-08-25','confirmado_activo'),
('GBP','INR',129.2507,0.00,'xoom','GB','IN',false,0.96,5000,null,'xoom.com, cotizador sin login, pago con banco/tarjeta','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status)
values ('GBP','INR',130.25,1.99,'remitly','GB','IN',false,0.21,0.01,null,'remitly.com/gb/en, cotizador sin login, tasa "everyday" (excluye "welcome rate" promocional de primera transferencia)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','INR',129.4864,1.99,'worldremit','GB','IN',false,0.79,0.01,999.99,'worldremit.com, cotizador sin login','2026-08-25','confirmado_activo'),
('GBP','INR',129.6822,0.00,'worldremit','GB','IN',false,0.64,1000,null,'worldremit.com, cotizador sin login','2026-08-25','confirmado_activo');

-- ---------------------------------------------------------------------
-- GB -> PH (GBP -> PHP), mid-market 25 ago 2026: 1 GBP = 84.1927 PHP
-- ---------------------------------------------------------------------
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status)
values ('GBP','PHP',84.1796,0.00,'paysend','GB','PH',false,0.02,0.01,null,'paysend.com, cotizador sin login. Spread inusualmente ajustado -- posible recargo oculto no visible sin login, pendiente re-verificacion','2026-08-25','sin_confirmar');

-- ---------------------------------------------------------------------
-- GB -> NG (GBP -> NGN), mid-market 25 ago 2026: 1 GBP = 1836.7546 NGN
-- ---------------------------------------------------------------------
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','NGN',1875.000,0.00,'taptap-send','GB','NG',false,-2.08,0.01,null,'taptapsend.com, calculadora sin login','2026-08-25','confirmado_activo'),
('GBP','NGN',1881.879,0.00,'sendwave','GB','NG',false,-2.46,0.01,null,'sendwave.com, calculadora sin login (se descarto una lectura anomala por pegado de monto vs. tipeo digito a digito, medicion repetida y consistente)','2026-08-25','confirmado_activo'),
('GBP','NGN',1895.000,0.00,'lemfi','GB','NG',false,-3.17,0.01,null,'lemfi.com, calculadora de marketing sin login. Nota: el documento de research original registro esta cifra como "+3.17%"; se corrigio el signo a -3.17 para ser consistente con la formula estandar (mid-tasa)/mid -- la tasa ofrecida (1895) es mejor que el mid-market (1836.75), por lo tanto el spread debe ser negativo, igual que TapTap Send y Sendwave en el mismo corredor.','2026-08-25','confirmado_activo');

-- ---------------------------------------------------------------------
-- GB -> AR (GBP -> ARS): brecha real detectada por auditoria de cobertura.
-- Western Union, Remitly, MoneyGram y Ria ya tenian corredores hacia
-- Argentina desde España/EEUU pero NINGUNO tenia Reino Unido->Argentina
-- cargado, pese a operarlo activamente hoy. Mid-market referencia
-- (xe.com, 25 ago 2026, 08:49 UTC): 1 GBP = 2058.8092 ARS.
-- ---------------------------------------------------------------------
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','ARS',2156.2769,0.00,'western-union','GB','AR',false,-4.73,0.01,null,'westernunion.com/gb/en, cotizador sin login, 500 GBP, cobro banco/billetera (PAGO FACIL). Cobro en efectivo tiene fee 17.50 GBP en vez de 0, misma tasa','2026-08-25','confirmado_activo'),
('GBP','ARS',2105.01,1.99,'remitly','GB','AR',false,-2.24,0.01,null,'remitly.com/gb/en/money-transfer/send-money-to-argentina, cotizador sin login, 500 GBP, tasa "estandar" (excluye "welcome rate" promocional de 1a transferencia que da 2229.21)','2026-08-25','confirmado_activo'),
('GBP','ARS',2098.7083,4.99,'moneygram','GB','AR',false,-1.94,0.01,null,'moneygram.com/mgo/gb/en, calculadora de home, 500 GBP, tasa estandar (excluye promo 1a transferencia online que da 2227.20). Fee fluctuo 2.49-4.99 GBP entre refrescos sin cambiar parametros -- se cargo el valor mas alto observado por prudencia','2026-08-25','sin_confirmar'),
('GBP','ARS',2058.66,8.53,'wise','GB','AR',false,0.01,0.01,null,'wise.com/gb/send-money, 500 GBP, metodo mas barato (transferencia bancaria/PISP/Swift; con tarjeta de debito el fee sube a 23.84 GBP)','2026-08-25','confirmado_activo'),
('GBP','ARS',2022.9064,8.00,'ria','GB','AR',false,1.74,0.01,null,'riamoneytransfer.com/en-gb, calculadora de home, 500 GBP, fee regular (excluye promo 1a transferencia que descuenta el fee a 0)','2026-08-25','confirmado_activo');

-- ---------------------------------------------------------------------
-- Global66: confirmacion de corredor EUR->ARS real
-- ---------------------------------------------------------------------
update providers
set notes = 'España/LatAm → LatAm (ES→CO 0.33%, CL→PE 0.5%, AR→CO 1%, MX→CO 0.8%, dato ago 2025 sin re-verificar). CONFIRMADO 25-ago-2026 (fuente primaria global66.com/ayuda.global66.com): opera Europa(EUR)->Argentina(ARS) como remesa real a un tercero (no solo transferencia entre cuentas propias) -- pagina dedicada global66.com/enviar-dinero/EUR/ARS/, destinatario externo soportado, Argentina sin restricciones y con "acceso completo". NO se encontro corredor EEUU(USD)->Argentina. Fee/spread del corredor EUR->ARS: no verificable hoy (cotizador 100% JS, contencion de navegador con otros agentes en simultaneo) -- pendiente muestreo en vivo sin contencion antes de reactivar (active=true).'
where slug = 'global66';

-- ---------------------------------------------------------------------
-- Prex: nuevo proveedor. Remesa P2P real de Argentina hacia ~12 paises
-- (no es wallet propia ni cripto). Fee plano USD 2.99 confirmado por 2
-- paginas de producto independientes. Spread/margen cambiario NO
-- publicado por Prex en ningun lado -- se deja como estimacion provisoria
-- conservadora (1.0%), explicitamente marcada como tal en las notas.
-- No se cargan filas en fx_rates porque no hay una "rate" verificable
-- con fuente primaria -- cargar un numero inventado ahi violaria la
-- regla de nunca inventar datos.
-- ---------------------------------------------------------------------
insert into providers (slug, name, segment, fee_percent, fee_fixed, spread_percent, active, is_corridor_specific, notes, website_url, audience, affiliate_url, fee_tiers)
values (
  'prex',
  'Prex',
  'retail',
  0,
  2.99,
  1.0,
  true,
  true,
  'Fintech argentina (tarjeta + wallet). Remesa P2P real Argentina -> USA, Alemania, España, Francia, Italia, Portugal, México, Brasil, Colombia, Bolivia, Paraguay, Venezuela. Fee: USD 2.99 flat por transferencia en USD a cuenta bancaria; GRATIS si se envia en ARS; USD 0.99 para "Prex a Prex" (solo Peru/Chile/Uruguay, instantaneo). Limites: transferencia bancaria max USD 500/operacion y USD 1.000/dia; Prex a Prex max USD 1.000/operacion y por dia. IMPORTANTE: spread_percent=1.0 es una ESTIMACION PROVISORIA -- Prex no publica su margen cambiario en ningun lado, solo se ve en la app al momento de cotizar. Hubo una promo de comision 0% del 1-ene al 31-jul-2026 (ya vencida a la fecha de esta carga). Fuente: prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-estados-unidos, .../enviar-dinero-desde-argentina-a-peru, y centro de ayuda (limites), todas verificadas 25-ago-2026. Re-verificar spread antes de considerar el dato completo.',
  'https://www.prexcard.com.ar',
  'retail',
  '',
  '[]'::jsonb
);
