-- 2026-09-18: comparadolar.ar/remesas -- comparador neutral de terceros para
-- "recibir remesas del exterior en Argentina", construido sobre "Dolarito via
-- ArgentinaDatos" (la misma fuente que ya se recomendo el 11-sep como
-- referencia ARS del proyecto). Simulacion de referencia: USD 1.000 recibidos,
-- resultado final en "Te quedan" (ARS). Verificado matematicamente antes de
-- cargar (formula: (1000 * (1-fee%)) * vende_a, o (1000-fee_fijo)*vende_a
-- para ARQ) contra 6 de 9 filas -- coincide exacto o con redondeo menor en
-- todos los casos, alta confianza en la fuente.
--
-- DECISION DE ESQUEMA: se carga con to_currency='ARS' (no 'USDT'/'USDC'),
-- tratando el paso intermedio por stablecoin (cuando aplica, ej. Belo) como un
-- detalle de implementacion plegado en la tasa efectiva final -- esto SI
-- encaja en el esquema actual (mismo patron que cualquier corredor
-- sending_country=US, receiving_country=AR) y evita el problema de esquema
-- documentado el 16-sep (to_currency=stablecoin rompe la busqueda por
-- pais/moneda). Se pierde el detalle "esto pasa por USDT/USDC" para el
-- usuario -- ver docs/data-sources/2026-09-16-implementacion-estado-real.md
-- para la discusion completa de esa limitacion, todavia sin resolver del
-- todo.
--
-- Todas sin_confirmar: es una foto de un agregador en vivo de terceros, no
-- una medicion directa en el sitio de cada proveedor -- mismo criterio de
-- cautela que el resto del proyecto para fuentes de agregador.

insert into public.providers (slug, name, segment, fee_percent, fee_fixed, spread_percent, active, is_corridor_specific, notes, website_url, audience, affiliate_url, fee_tiers) values
('belo', 'Belo', 'retail', 0, 0, 0.5, true, true, 'Wallet cripto (Argentina). Recibe pagos del exterior via USDT, con retiro a ARS. Investigado 13-sep (blog propio, receiving_from_abroad) y confirmado con datos en vivo 18-sep via comparadolar.ar: fee "recibir pagos" 0.5% + un costo adicional no especificado en el retiro a ARS ("retiro ARS >0%", fuente no da el numero exacto). Corredor cargado: EEUU->Argentina.', 'https://www.belo.app', 'retail', '', '[]'::jsonb),
('lemon', 'Lemon', 'retail', 0, 0, 2.0, true, true, 'Wallet cripto (Argentina). Recibe pagos del exterior via USDC, con retiro a ARS. Investigado 13-sep (help.lemon.me: 1.5%+USD12 minimo USD100) y confirmado con datos en vivo 18-sep via comparadolar.ar: fee efectivo "recibir pagos" 2% sobre una simulacion de USD 1.000 -- cifra distinta a la de help.lemon.me, probablemente porque esta ya es el costo TOTAL efectivo (fee flat + spread) expresado como %, no solo el fee de deposito. Corredor cargado: EEUU->Argentina.', 'https://www.lemon.me', 'retail', '', '[]'::jsonb),
('arq', 'ARQ', 'retail', 0, 3, 0, true, true, 'Cuenta/tarjeta en dolares para recibir pagos del exterior (Argentina). Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas (agregador de terceros construido sobre ArgentinaDatos). Fee "recibir pagos" USD 3 flat (el unico de este grupo con fee fijo, no porcentual). Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb),
('cocos', 'Cocos', 'retail', 0, 0, 0.5, true, true, 'Broker/cuenta de inversion argentina con recepcion de pagos del exterior. Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas. Fee "recibir pagos" 0.5%. Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb),
('takenos', 'Takenos', 'retail', 0, 0, 0, true, true, 'Cuenta en dolares para freelancers/recibir pagos del exterior (Argentina). Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas. Fee "recibir pagos" 0% segun la fuente (costo, si existe, esta plegado en el spread de venta). Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb),
('wallbit', 'Wallbit', 'retail', 0, 0, 0, true, true, 'Exchange/broker argentino (dolar CCL/cripto). Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas. Fee "recibir pagos" 0% segun la fuente para el producto de remesas (el mismo proveedor tiene una variante "Wallbit Pro" con otro perfil de tasa, no cargada aqui). Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb),
('astropay', 'AstroPay', 'retail', 0, 0, 1.0, true, true, 'Billetera digital multi-pais con recepcion de pagos del exterior (Argentina). Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas. Fee "recibir pagos" 1%. Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb),
('ripio', 'Ripio', 'retail', 0, 0, 1.5, true, true, 'Exchange cripto argentino. Nuevo para el proyecto, investigado 18-sep via comparadolar.ar/remesas. Fee "recibir pagos" 1.5%. Corredor cargado: EEUU->Argentina.', '', 'retail', '', '[]'::jsonb);

insert into public.fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, data_source, data_collected_at, verified_status) values
('USD', 'ARS', 1585.86, 0, 'belo', 'US', 'AR', false, 0.5, 'comparadolar.ar/remesas (agregador de terceros, fuente "Dolarito via ArgentinaDatos"), simulacion de USD 1.000 recibidos. Fee "recibir pagos" 0.5% + costo adicional no especificado en "retiro ARS" (>0%, sin cifra exacta -- NO incluido en el fee cargado, solo documentado como caveat). Vende a $1.585,86/USD. Verificado matematicamente: 995*1585.86=1.577.931, coincide con "Te quedan $1.577.927" de la fuente (diferencia atribuible al costo no especificado de retiro). Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1539.04, 0, 'lemon', 'US', 'AR', false, 2.0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee efectivo "recibir pagos" 2%. Vende a $1.539,04/USD. Verificado matematicamente: 980*1539.04=1.508.259, coincide con "Te quedan $1.508.255" de la fuente (redondeo menor). Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1589.43, 3, 'arq', 'US', 'AR', false, 0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" USD 3 flat. Vende a $1.589,43/USD. Verificado matematicamente: (1000-3)*1589.43=1.584.661,71, coincide exacto con "Te quedan $1.584.661" de la fuente. Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1586.00, 0, 'cocos', 'US', 'AR', false, 0.5, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 0.5%. Vende a $1.586,00/USD. Verificado matematicamente: 995*1586=1.578.070, coincide exacto con "Te quedan $1.578.070" de la fuente. Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1570.53, 0, 'takenos', 'US', 'AR', false, 0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 0%. Vende a $1.570,53/USD. Verificado matematicamente: 1000*1570.53=1.570.530, coincide exacto con "Te quedan $1.570.530" de la fuente. Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1564.40, 0, 'wallbit', 'US', 'AR', false, 0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 0%. Vende a $1.564,40/USD. Verificado matematicamente: 1000*1564.40=1.564.400, coincide exacto con "Te quedan $1.564.400" de la fuente. Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1568.73, 0, 'astropay', 'US', 'AR', false, 1.0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 1%. Vende a $1.568,73/USD. Verificado matematicamente: 990*1568.73=1.553.043, coincide con "Te quedan $1.553.039" de la fuente (redondeo menor). Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1560.93, 0, 'ripio', 'US', 'AR', false, 1.5, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 1.5%. Vende a $1.560,93/USD. Verificado matematicamente: 985*1560.93=1.537.516, coincide con "Te quedan $1.537.512" de la fuente (redondeo menor). Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar'),
('USD', 'ARS', 1577.19, 0, 'global66', 'US', 'AR', false, 0, 'comparadolar.ar/remesas, simulacion de USD 1.000 recibidos. Fee "recibir pagos" 0%. Vende a $1.577,19/USD. Verificado matematicamente: 1000*1577.19=1.577.190, coincide con "Te quedan $1.577.186" de la fuente (redondeo menor). Cross-validacion: consistente en magnitud con las mediciones directas de Global66 del 11-sep (screenshots del usuario, rango 1574,97-1630,93 segun activo/direccion). Corredor nuevo (EEUU->Argentina) para Global66, que ya tenia AR->ES/IT/GB cargados. Investigado 18-sep-2026.', '2026-09-18', 'sin_confirmar');
