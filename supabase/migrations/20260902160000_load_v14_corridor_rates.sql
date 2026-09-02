-- Research v14 (2026-09-02, ADDENDUM #8): opens Mexico and Brazil as new
-- origin countries, closes the SBI Remit margin pendiente, adds Taptap
-- Send UK->Ghana via primary source, and reviews the UK->Nigeria triple
-- finding from Section 4.1 against rows already in fx_rates.
--
-- ===========================================================================
-- PART 1: Mexico, 4 corridors (research v14 Section 1) -- all clean data,
-- no promotional badge on any card. WU's cash-pickup figures are given in
-- the source alongside bank-transfer for Guatemala/El Salvador, but are
-- NOT loaded as separate rows here -- matching the project's established
-- single-row-per-provider-per-corridor convention (see e.g. the WU
-- IT->EC/IT->PE rows, migration for research v11, which load only the
-- delivery method actually used and note the alternate one in the comment,
-- never as a second row). Cash-pickup figures are recorded in the comments
-- below for reference only.
-- ===========================================================================

-- Mexico->Guatemala (Section 1.1). Send 2.000 MXN, mid-market 1 MXN = 0,4494
-- GTQ. Global66 reconfirms its near-mid-market pattern (0,01% margin FX,
-- already seen in Chile/Peru/Mexico->EEUU) -- 4th origin country for
-- Global66 in the project. WU cash pickup (rate 0,4308, fee 100 MXN, margin
-- 4,09%, total 8,94%) NOT loaded as a separate row (see note above) -- only
-- the cheaper bank-transfer option is loaded, consistent with project
-- convention. Zero prior rows for either provider in this exact corridor.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('MXN', 'GTQ', 0.4491, 60, 'global66', 'MX', 'GT', false, 0.01,
   'Monito.com (tarjeta de Global66), corredor Mexico->Guatemala, envio de 2.000 MXN, cuenta bancaria. Fee 60 MXN, tipo de cambio aplicado 0,4491 GTQ/MXN, margen FX 0,01% (dado explicitamente por la fuente, no recalculado -- mid-market mostrado 0,4494 es un valor redondeado a 4 decimales, insuficiente precision para recalcular el margen de forma confiable). Recipient gets 871,18 GTQ, costo total 3,07%. Cuarto pais de origen medido para Global66 (Chile, Colombia, Peru, Mexico), tercero de cuatro con margen bajo/nulo -- Colombia sigue siendo la excepcion (comision plana 3-4%, v11). Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.1).',
   '2026-09-02', 'sin_confirmar'),

  ('MXN', 'GTQ', 0.4442, 100, 'western-union', 'MX', 'GT', false, 1.09,
   'Monito.com (tarjeta de Western Union), corredor Mexico->Guatemala, envio de 2.000 MXN, CUENTA BANCARIA (metodo cargado; ver nota de la migracion sobre por que no se carga cash pickup como fila separada). Fee 100 MXN, tipo de cambio aplicado 0,4442 GTQ/MXN, margen FX 1,09% (dado explicitamente). Recipient gets 844,03 GTQ, costo total 6,09%. Metodo alternativo NO cargado: cash pickup, tasa 0,4308, mismo fee 100 MXN, margen 4,09%, costo total 8,94% -- WU cobra sistematicamente mas caro en cash pickup que en cuenta bancaria dentro del mismo corredor, patron ya visto varias veces en el proyecto. Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.1).',
   '2026-09-02', 'sin_confirmar');

-- Mexico->Honduras (Section 1.2). Send 1.000 MXN, mid-market 1 MXN = 1,58
-- HNL. Solo 2 proveedores comparables en este corredor (cobertura mas
-- delgada que Guatemala). Paysend confirmado por URL (go.monito.com/
-- paysend?...&po=bank...) como el proveedor mas barato, resolviendo la duda
-- que habia quedado abierta en la primera ronda del research. Zero prior
-- rows para este corredor.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('MXN', 'HNL', 1.5660, 100, 'western-union', 'MX', 'HN', false, 0.86,
   'Monito.com (tarjeta de Western Union), corredor Mexico->Honduras, envio de 1.000 MXN, cuenta bancaria. Fee 100 MXN (10% del monto, fee plano alto dominando el costo -- patron ya visto en otros corredores de WU esta sesion), tipo de cambio aplicado 1,5660 HNL/MXN, margen FX 0,86% (dado explicitamente). Recipient gets 1.409 HNL, costo total 10,80%. Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.2).',
   '2026-09-02', 'sin_confirmar'),

  ('MXN', 'HNL', 1.5376, 20, 'paysend', 'MX', 'HN', false, 2.66,
   'Monito.com (tarjeta de Paysend), corredor Mexico->Honduras, envio de 1.000 MXN, entrega a card. Proveedor confirmado por URL directa (link "Go to Paysend", go.monito.com/paysend?...&po=bank..., leido del arbol de accesibilidad completo de la pagina, no por inferencia de posicion -- resuelve la duda "sin confirmar" de la primera ronda del research). Fee 20 MXN, tipo de cambio aplicado 1,5376 HNL/MXN, margen FX 2,66% (peor margen que WU, pero fee 5x mas bajo hace que el costo total termine siendo menos de la mitad). Recipient gets 1.507 HNL, costo total 4,62%. Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.2).',
   '2026-09-02', 'sin_confirmar');

-- Mexico->El Salvador (Section 1.3). Send 1.000 MXN, mid-market 1 MXN =
-- 0,058899 USD (El Salvador esta dolarizado, usa USD). Cobertura mas rica
-- de los tres corredores del Triangulo Norte (4 proveedores, 875
-- comparaciones/3 meses). WU cash pickup (rate 0,056466, fee 100 MXN,
-- margen 4,15%, total 13,72%) NOT loaded como fila separada, misma razon
-- que Guatemala. Zero prior rows para este corredor exacto (MX->SV).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('MXN', 'USD', 0.058231, 100, 'western-union', 'MX', 'SV', false, 1.15,
   'Monito.com (tarjeta de Western Union), corredor Mexico->El Salvador, envio de 1.000 MXN, CUENTA BANCARIA (metodo cargado). Fee 100 MXN, tipo de cambio aplicado 0,058231 USD/MXN, margen FX 1,15% (dado explicitamente). Recipient gets 52,41 USD, costo total 11,02%. Metodo alternativo NO cargado: cash pickup, tasa 0,056466, mismo fee 100 MXN, margen 4,15%, costo total 13,72% -- mismo patron de WU cash pickup mas caro que cuenta bancaria visto en Guatemala. Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.3).',
   '2026-09-02', 'sin_confirmar'),

  ('MXN', 'USD', 0.057061, 20, 'paysend', 'MX', 'SV', false, 3.14,
   'Monito.com (tarjeta de Paysend), corredor Mexico->El Salvador, envio de 1.000 MXN, entrega a card. Desglose completo obtenido leyendo el arbol de accesibilidad completo de la pagina (los tres paneles -- cuenta bancaria, cash pickup, card -- estan presentes simultaneamente en el HTML, solo uno se muestra a la vez), sin depender de que el click cambie la pestaña visible. Fee 20 MXN, tipo de cambio aplicado 0,057061 USD/MXN, margen FX 3,14% (dado explicitamente). Recipient gets 55,92 USD, costo total 5,06% (cifra final mas precisa que el 4,92% redondeado de la ronda anterior del research). Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.3).',
   '2026-09-02', 'sin_confirmar');

-- Mexico->EEUU (Section 1.4), corredor inverso. Send 1.000 MXN, mid-market
-- 1 MXN = 0,058898 USD. Mayor volumen de todo el proyecto en Monito
-- (15.587 comparaciones/3 meses). Global66 reconfirma el mismo margen FX
-- casi nulo (0,01%) que en Guatemala -- mismo margen en sus dos corredores
-- probados desde Mexico. WU cash pickup NO cargado como fila separada (solo
-- monto final dado, 51 USD/13,41%, sin desglose de fee/tasa en la fuente
-- para esta variante -- otro motivo mas para no forzarlo en una fila
-- propia). Zero prior rows para este corredor (MX->US).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('MXN', 'USD', 0.058872, 60, 'global66', 'MX', 'US', false, 0.01,
   'Monito.com (tarjeta de Global66), corredor Mexico->EEUU, envio de 1.000 MXN, cuenta bancaria. Fee 60 MXN, tipo de cambio aplicado 0,058872 USD/MXN, margen FX 0,01% (dado explicitamente, identico al margen encontrado en Mexico->Guatemala -- Global66 ya tiene el mismo margen FX en sus dos corredores probados desde Mexico). Recipient gets 55,34 USD, costo total 6,04%. Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.4).',
   '2026-09-02', 'sin_confirmar'),

  ('MXN', 'USD', 0.058384, 100, 'western-union', 'MX', 'US', false, 0.84,
   'Monito.com (tarjeta de Western Union), corredor Mexico->EEUU, envio de 1.000 MXN, CUENTA BANCARIA (metodo cargado). Fee 100 MXN, tipo de cambio aplicado 0,058384 USD/MXN, margen FX 0,84% (dado explicitamente). Recipient gets 52,55 USD, costo total 10,78%. Cross-validacion interna: el monto de cash pickup (51 USD, NO cargado como fila propia -- ver nota de la migracion) es practicamente identico al de Mexico->El Salvador (50,82 USD, misma fila WU cuenta bancaria de esa migracion), coherente con que El Salvador esta dolarizado (mismo par de divisas MXN->USD bajo dos "paises destino" distintos de Monito). Dato limpio, sin insignia promocional. Investigado 2-sep-2026 (research v14 Seccion 1.4).',
   '2026-09-02', 'sin_confirmar');

-- ===========================================================================
-- PART 2: Brazil, 4 corridors, 7 rows total (Bolivia 1, Paraguay 2, Peru 2,
-- Argentina 2 -- research v14 Section 3).
-- MoneyGram shows the promotional-rate pattern (v11 Seccion 31 methodology)
-- in Paraguay/Peru/Argentina -- loaded with the CORRECTED real amount, never
-- the promotional one. Bolivia is the one clean MoneyGram corridor (no
-- badge). public_spread_percent is computed here as the pure FX margin
-- (mid-market vs. applied rate, the same formula already used by e.g. the
-- WU IT->EC/IT->PE rows: (mid-applied)/mid), NOT the total-cost figure the
-- source tables show -- those tables give fee + applied rate + total cost,
-- but no separate "Margen FX" column (unlike Mexico's tables in Section 1,
-- which do give one explicitly and are copied as-is instead). For the
-- MoneyGram-corrected rows the applied real rate is not printed directly
-- either -- it is derived arithmetically from the source's own "recipient
-- gets (real)" amount divided by the amount sent, same technique already
-- used in this project for other promotional corrections (research v11
-- Seccion 31, NZ->PH MoneyGram row). Where fee=0 (all four MoneyGram-
-- corrected rows), margin computed this way matches the source's stated
-- total cost exactly, as expected.
-- ===========================================================================

-- Brasil->Bolivia (Section 3.1). Send 1.500 BRL, mid-market 1 BRL = 2,3813
-- BOB. Dato limpio (sin insignia promocional). La pagina del corredor
-- muestra ademas un promedio agregado "-21,3%" en su FAQ que NO coincide
-- con este dato de tarjeta en vivo -- por diseño del proyecto, esos
-- promedios de Monito nunca se cargan, solo se usa el dato de tarjeta.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BRL', 'BOB', 2.2935, 20, 'moneygram', 'BR', 'BO', false, 3.69,
   'Monito.com (tarjeta de MoneyGram), corredor Brasil->Bolivia, envio de 1.500 BRL, cash pickup. Fee 20 BRL, tipo de cambio aplicado 2,2935 BOB/BRL, mid-market 2,3813 BOB/BRL -- margen FX = (2,3813-2,2935)/2,3813 = 3,69% (no dado explicitamente por la fuente, que solo da fee+tasa+costo total sin columna de margen separada; recalculado con la formula ya usada en el proyecto, ej. filas WU IT->EC/IT->PE). Recipient gets 3.394 BOB, costo total 4,98% (dado por la fuente). Dato limpio, sin insignia promocional -- primer pais de origen de Brasil en el proyecto. NOTA METODOLOGICA: la pagina de este corredor muestra un promedio agregado de Monito ("costo total mas bajo (promedio): -21,3%") que NO coincide con ningun dato de tarjeta en vivo -- se ignora por completo, consistente con la metodologia del proyecto de nunca usar esos promedios. Investigado 2-sep-2026 (research v14 Seccion 3.1).',
   '2026-09-02', 'sin_confirmar');

-- Brasil->Paraguay (Section 3.2). Send 1.500 BRL, mid-market 1 BRL = 1.159
-- PYG. MoneyGram muestra la variante de tasa cambiaria del patron
-- promocional (badge "cero comision y/o tasa de cambio preferencial en tu
-- primera transferencia") -- se carga el monto CORREGIDO (real), nunca el
-- promocional (1108 de tasa, 1.661.894 PYG). Corregido, MoneyGram termina
-- mas caro que Western Union limpio.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BRL', 'PYG', 1092.76, 0, 'moneygram', 'BR', 'PY', false, 5.72,
   'Monito.com (tarjeta de MoneyGram), corredor Brasil->Paraguay, envio de 1.500 BRL, cash pickup. CIFRA CORREGIDA (metodologia v11 Seccion 31): la tarjeta mostro insignia promocional ("cero comision y/o tasa de cambio preferencial en tu primera transferencia") con dos montos -- promocional (tasa 1108, 1.661.894 PYG) y real (1.639.140 PYG, identificado por URL go.monito.com/moneygram confirmando que ambos montos son del mismo proveedor). Se carga SOLO el monto real: tipo de cambio aplicado implicito = 1.639.140/1.500 = 1.092,76 PYG/BRL (no dado directamente por la fuente para la variante real, derivado del monto/envio, misma tecnica ya usada en el proyecto para otras correcciones de MoneyGram -- research v11 Seccion 31.4). Fee "Free" (0). Mid-market 1.159 PYG/BRL -- margen FX = (1.159-1.092,76)/1.159 = 5,72% (coincide con el costo total real dado por la fuente, 5,71%, ya que fee=0). Corregido, MoneyGram (5,71%) resulta MAS CARO que Western Union limpio en este mismo corredor (3,49%, fila separada) -- la corrección invierte cual proveedor parece mas barato, coherente con v11 Seccion 31.2 (Canada/Australia). Investigado 2-sep-2026 (research v14 Seccion 3.2).',
   '2026-09-02', 'sin_confirmar'),

  ('BRL', 'PYG', 1134, 20, 'western-union', 'BR', 'PY', false, 2.16,
   'Monito.com (tarjeta de Western Union), corredor Brasil->Paraguay, envio de 1.500 BRL, cash pickup. Dato limpio, sin insignia promocional, un solo monto. Fee 20 BRL, tipo de cambio aplicado 1.134 PYG/BRL, mid-market 1.159 PYG/BRL -- margen FX = (1.159-1.134)/1.159 = 2,16% (no dado explicitamente, recalculado con la formula estandar del proyecto; coincide con el costo total dado por la fuente, 3,49%, al sumar fee en porcentaje 20/1.500=1,33% + margen 2,16% = 3,49%). Recipient gets 1.677.810 PYG, costo total 3,49%. Termina MAS BARATO que MoneyGram corregido (5,71%, fila separada) en este corredor. Investigado 2-sep-2026 (research v14 Seccion 3.2).',
   '2026-09-02', 'sin_confirmar');

-- Brasil->Peru (Section 3.3). Send 1.000 BRL, mid-market 1 BRL = 0,6600
-- PEN. Mismo patron promocional de MoneyGram que Paraguay -- corregido,
-- MoneyGram (7,85%) es otra vez mas caro que Western Union limpio (2,84%).
-- Ya son 2 de 3 corredores de Brasil donde WU le gana a MoneyGram corregido.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BRL', 'PEN', 0.6082, 0, 'moneygram', 'BR', 'PE', false, 7.85,
   'Monito.com (tarjeta de MoneyGram), corredor Brasil->Peru, envio de 1.000 BRL, cash pickup. CIFRA CORREGIDA (metodologia v11 Seccion 31): insignia promocional presente, dos montos -- promocional (tasa 0,6326, 632,60 PEN) y real (608,20 PEN, confirmado por URL go.monito.com/moneygram). Se carga SOLO el real: tipo de cambio aplicado implicito = 608,20/1.000 = 0,6082 PEN/BRL. Fee "Free" (0). Mid-market 0,6600 PEN/BRL -- margen FX = (0,66-0,6082)/0,66 = 7,85% (coincide con el costo total real dado por la fuente, ya que fee=0). Corregido, MoneyGram (7,85%) resulta mas caro que Western Union limpio (2,84%, fila separada) -- ya son 2 de 3 corredores de Brasil donde WU le gana a MoneyGram despues de la correccion (Bolivia fue el unico limpio, sin insignia). Investigado 2-sep-2026 (research v14 Seccion 3.3).',
   '2026-09-02', 'sin_confirmar'),

  ('BRL', 'PEN', 0.6510, 15, 'western-union', 'BR', 'PE', false, 1.36,
   'Monito.com (tarjeta de Western Union), corredor Brasil->Peru, envio de 1.000 BRL, cuenta bancaria. Dato limpio, sin insignia promocional. Fee 15 BRL, tipo de cambio aplicado 0,6510 PEN/BRL, mid-market 0,6600 PEN/BRL -- margen FX = (0,66-0,651)/0,66 = 1,36% (recalculado con la formula estandar; coincide con el costo total dado, 2,84%, al sumar fee 15/1.000=1,5% + margen 1,36% = 2,84%). Recipient gets 641,28 PEN, costo total 2,84%. Investigado 2-sep-2026 (research v14 Seccion 3.3).',
   '2026-09-02', 'sin_confirmar');

-- Brasil->Argentina (Section 3.4), cuarto corredor de Brasil. Send 1.000
-- BRL, mid-market 1 BRL = 293,4800 ARS. Corredor hipercompetitivo: MoneyGram
-- muestra el patron promocional en AMBOS metodos de entrega (cash pickup y
-- cuenta bancaria), pero a diferencia de Paraguay/Peru la correccion NO
-- invierte el resultado -- MoneyGram corregido sigue siendo barato, solo
-- que WU (limpio, tambien en ambos metodos) es todavia mas barato, con
-- costos reales NEGATIVOS (favorables) en los dos metodos. IMPORTANTE: se
-- carga UNA sola fila por proveedor (cash pickup), NO las 4 combinaciones
-- (2 proveedores x 2 metodos) -- fx_rates tiene una restriccion UNIQUE
-- sobre (provider_slug, sending_country, receiving_country,
-- COALESCE(min_amount,0)) que impide dos filas del mismo proveedor+corredor
-- sin una diferencia real de tramo de monto (confirmado en esta sesion al
-- intentar cargar las 4 filas: violacion de fx_rates_provider_corridor_tier
-- en el segundo intento de MoneyGram/BR-AR). Se prioriza cash pickup por
-- consistencia con el resto de Brasil (Bolivia, Paraguay y Peru tambien
-- usan cash pickup como metodo principal de MoneyGram); las cifras de
-- cuenta bancaria (MoneyGram corregido -0,58%, WU -3,95%, ambas todavia mas
-- favorables que cash pickup) quedan documentadas en el comentario de cada
-- fila, no cargadas aparte -- mismo patron de "un metodo cargado, el otro
-- solo documentado" ya usado en Mexico (Seccion 1) para WU.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BRL', 'ARS', 292.745, 0, 'moneygram', 'BR', 'AR', false, 0.25,
   'Monito.com (tarjeta de MoneyGram), corredor Brasil->Argentina, envio de 1.000 BRL, CASH PICKUP (metodo cargado; ver nota de la migracion sobre la restriccion UNIQUE que impide cargar tambien cuenta bancaria como fila separada). CIFRA CORREGIDA (metodologia v11 Seccion 31): insignia promocional presente (confirmada por URL go.monito.com/moneygram), dos montos -- promocional (tasa 299,0497, 299.050 ARS) y real (292.745 ARS). Se carga SOLO el real: tipo de cambio aplicado implicito = 292.745/1.000 = 292,745 ARS/BRL. Fee "Free" (0). Mid-market 293,48 ARS/BRL -- margen FX = (293,48-292,745)/293,48 = 0,25% (coincide con el costo total real dado, ya que fee=0). A diferencia de Paraguay/Peru, aca la correccion NO invierte el resultado: MoneyGram corregido sigue siendo barato (0,25%), solo que WU (fila separada) es todavia mas barato, con costo real negativo. Metodo alternativo NO cargado: cuenta bancaria, tambien corregida (promocional 305,7871/305.787 ARS vs. real 295.191 ARS, tipo de cambio implicito 295,191, margen -0,58% favorable) -- mas favorable que cash pickup, pero no cargado por la restriccion de unicidad ya explicada. Investigado 2-sep-2026 (research v14 Seccion 3.4).',
   '2026-09-02', 'sin_confirmar'),

  ('BRL', 'ARS', 309.7225, 20, 'western-union', 'BR', 'AR', false, -5.53,
   'Monito.com (tarjeta de Western Union), corredor Brasil->Argentina, envio de 1.000 BRL, CASH PICKUP (metodo cargado; ver nota de la migracion sobre la restriccion UNIQUE). Dato limpio, sin insignia promocional. Fee 20 BRL, tipo de cambio aplicado 309,7225 ARS/BRL, mid-market 293,48 ARS/BRL -- margen FX = (293,48-309,7225)/293,48 = -5,53% (recalculado con la formula estandar del proyecto; costo total dado por la fuente, -3,42% favorable, incluye el fee de 20/1.000=2% restando del margen favorable). Recipient gets 303.528 ARS, costo total -3,42% (favorable). Coherente con el propio promedio agregado de Monito para este corredor ("Cheapest provider (on average): Western Union", "-4,6%") -- a diferencia de Bolivia (Seccion 3.1), aca el agregado si queda cerca de lo medido de forma independiente; no cambia la metodologia del proyecto (seguir usando siempre datos de tarjeta, nunca el agregado). Metodo alternativo NO cargado: cuenta bancaria, misma tasa aplicada (309,7225), fee 15 BRL en vez de 20, costo total -3,95% (favorable, el mas barato del corredor) -- no cargado por la restriccion de unicidad ya explicada. Investigado 2-sep-2026 (research v14 Seccion 3.4).',
   '2026-09-02', 'sin_confirmar');

-- ===========================================================================
-- PART 3: SBI Remit, Japon->Filipinas -- resuelve el margen cambiario
-- pendiente desde la ronda anterior (research v14 Seccion 5.2). Proveedor
-- nuevo para el proyecto (sin fila previa en `providers` ni en `fx_rates`
-- para ningun corredor) -- se agrega primero a `providers`, siguiendo el
-- mismo patron ya usado para Prex/BDO Remit/Money2India (proveedor nuevo +
-- fee_tiers poblado con los mismos tramos que las filas de fx_rates).
-- Fuente primaria: World Bank Remittance Prices Worldwide (RPW), nodo
-- especifico SBI Remit Japon->Filipinas, dato con fecha 18-ago-2025 (valido
-- jul-oct 2025) -- reemplaza el dato de blog usado en la ronda anterior,
-- que tenia una tasa mid-market incompatible con el resto del proyecto para
-- este par de divisas (ya corregido, no se carga ninguna fila con esa
-- inconsistencia).
-- ===========================================================================

insert into public.providers (
  slug, name, segment, fee_percent, fee_fixed, spread_percent, active,
  is_corridor_specific, notes, website_url, audience, affiliate_url, fee_tiers
) values (
  'sbi-remit',
  'SBI Remit',
  'retail',
  0,
  720,
  0.09,
  true,
  true,
  'Proveedor de remesas japones (SBI Remit Co., Ltd, parte de SBI Holdings) -- no confundir con State Bank of India. Corredor cargado: Japon->Filipinas. Margen cambiario 0,09% confirmado via World Bank RPW (fuente primaria, dato 18-ago-2025, valido jul-oct 2025) -- se suma a InstaReM y Global66 como caso de margen bajo. Fee escalonado por tramo de monto enviado: ¥720 para tramo ¥10.001-¥20.000, ¥1.000 para tramo ¥30.001-¥50.000 (ambos confirmados cruzando la fuente RPW/blog contra la pagina oficial de fees, remit.co.jp/en/kaigaisoukin/exchangeratecommission/commission/ -- coinciden exactamente). Existe un tramo intermedio (¥20.001-¥30.000) NO documentado por ninguna fuente -- no se carga fila para ese rango, para no inventar un fee. Sin afiliado confirmado. fee_tiers refleja los mismos dos tramos cargados en fx_rates. Investigado 2-sep-2026 (research v14 Seccion 5.2).',
  'https://www.remit.co.jp',
  'retail',
  '',
  '[{"min":10001,"max":20000,"fee_fixed":720,"spread_percent":0.09},{"min":30001,"max":50000,"fee_fixed":1000,"spread_percent":0.09}]'::jsonb
);

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, min_amount, max_amount,
  data_source, data_collected_at, verified_status
) values
  ('JPY', 'PHP', 0.389649, 720, 'sbi-remit', 'JP', 'PH', false, 0.09,
   10001, 20000,
   'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico SBI Remit Japon->Filipinas, dato con fecha 18-ago-2025 (valido jul-oct 2025). Tipo de cambio inter-bancario (mid-market) dado por la fuente: 1 JPY = 0,39 PHP (consistente con el mid-market ya usado en el proyecto para este par, ~0,394, v12 Seccion 8 -- a diferencia del dato de un blog de Wise usado en la ronda anterior del research, que resulto desactualizado). Margen de tipo de cambio dado explicitamente por la fuente: 0,09%. Tipo de cambio aplicado = 0,39 * (1-0,0009) = 0,389649 (derivado aritmeticamente del mid-market y el margen, ambos dados por la fuente -- no hay una tasa aplicada impresa directamente). Fee ¥720 para el tramo ¥10.001-¥20.000 (confirmado cruzando RPW/blog contra la pagina oficial de fees de SBI Remit). Costo total para un envio de ¥17.000 (ejemplo dado por la fuente): 4,33%. Resuelve la inconsistencia de tasa que venia arrastrando el proyecto desde la ronda anterior del research para este proveedor. Investigado 2-sep-2026 (research v14 Seccion 5.2).',
   '2026-09-02', 'confirmado_activo'),

  ('JPY', 'PHP', 0.389649, 1000, 'sbi-remit', 'JP', 'PH', false, 0.09,
   30001, 50000,
   'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico SBI Remit Japon->Filipinas, mismo dato/fecha que el tramo anterior (18-ago-2025, valido jul-oct 2025) -- mismo tipo de cambio y margen, solo cambia el fee por tramo de monto. Fee ¥1.000 para el tramo ¥30.001-¥50.000 (confirmado cruzando RPW/blog contra la pagina oficial de fees de SBI Remit). Costo total para un envio de ¥42.000 (ejemplo dado por la fuente): 2,47%. Investigado 2-sep-2026 (research v14 Seccion 5.2).',
   '2026-09-02', 'confirmado_activo');

-- ===========================================================================
-- PART 4: Taptap Send, Reino Unido->Ghana -- UPDATE, no insert. Ya existia
-- una fila para este exacto corredor+proveedor (id b5f8a462-278a-45da-adf9-
-- 64b67fb0c66f), cargada 23-ago-2026 con spread=1.0% desde una fuente
-- generica ("Direct research Aug 2026, taptapsend.com, aggregator
-- reviews"). El research v14 (Seccion 5.3) encontro el mismo corredor en la
-- fuente primaria World Bank RPW, con margen 1,03% -- una confirmacion casi
-- exacta de la estimacion previa (diferencia de 0,03 puntos porcentuales),
-- pero desde una fuente mucho mas solida. Se actualiza el spread y la
-- fuente citada; NO se toca `rate` porque la fuente RPW da el margen
-- directamente pero no una tasa aplicada absoluta nueva (RPW no publica esa
-- cifra, igual que en el caso ya documentado de Xoom EEUU->Mexico, research
-- v11 Seccion 25.1) -- la tasa existente (15,212188 GHS/GBP) se conserva
-- sin cambios para no inventar un valor nuevo.
-- ===========================================================================

update public.fx_rates
set public_spread_percent = 1.03,
    data_source = 'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), corredor Reino Unido->Ghana, 120-300 GBP. Margen de tipo de cambio 1,03%, sin fee (coherente con el posicionamiento "no fees" de Taptap Send) -- dato de fuente primaria, sin ambiguedad de doble monto (problema que solo aplica a Monito). ACTUALIZA una fila previa cargada 23-ago-2026 con spread=1,0% desde una fuente generica ("Direct research Aug 2026, taptapsend.com, aggregator reviews") -- el nuevo dato de RPW confirma esa estimacion casi exactamente (diferencia de 0,03 puntos porcentuales) con una fuente mucho mas solida, asi que se actualiza el spread y la cita de fuente. La tasa (`rate`) NO se modifica: RPW da el margen pero no una tasa aplicada absoluta para este corredor, y no hay un valor nuevo con el que reemplazar el existente sin inventarlo. Investigado 2-sep-2026 (research v14 Seccion 5.3).',
    data_collected_at = '2026-09-02',
    verified_status = 'confirmado_activo'
where id = 'b5f8a462-278a-45da-adf9-64b67fb0c66f';

-- ===========================================================================
-- PART 5: Reino Unido->Nigeria (research v14 Seccion 4.1) -- revision de
-- las 3 filas ya existentes (Western Union, Remitly, MoneyGram, todas
-- cargadas desde World Bank RPW Q3 2025) contra los montos corregidos que
-- Monito mostro para el mismo corredor esta ronda (cash pickup, con badge
-- promocional en los 3 proveedores, corregidos con la metodologia v11
-- Seccion 31). Decision fila por fila:
--
-- - Western Union: fila existente ~3,17% de costo total efectivo (fee 0,99
--   GBP + margen 2,18%, fuente RPW) vs. 2,00% corregido de Monito -- mas de
--   1 punto porcentual de diferencia (~35% relativo). Se trata como
--   actualizacion genuina (ver UPDATE abajo).
-- - Remitly: fila existente margen 0,03%... 0,25% (RPW, practicamente a
--   mid-market) vs. -3,13% corregido de Monito (favorable) -- diferencia de
--   mas de 3 puntos porcentuales, incluyendo un cambio de signo (de costo
--   leve a favorable). Se trata como actualizacion genuina (ver UPDATE
--   abajo).
-- - MoneyGram: fila existente margen 0,03% (RPW) vs. 0,08% corregido de
--   Monito -- ambos son "practicamente a mid-market", diferencia de 0,05
--   puntos porcentuales, no meaningful. NO se actualiza esta fila.
--
-- CAVEAT importante documentado en ambos UPDATEs: la fuente RPW original
-- probablemente mide un metodo de entrega tipo cuenta bancaria/online,
-- mientras que el dato nuevo de Monito es explicitamente CASH PICKUP
-- ("en la pestaña de cash pickup de este mismo corredor") -- no es
-- estrictamente la misma medicion con dos fuentes, sino un metodo de
-- entrega distinto que puede tener condiciones distintas. Se actualiza de
-- todos modos porque (a) el proyecto ya no distingue metodo de entrega como
-- columna separada en este corredor (una sola fila por proveedor), (b) el
-- monto nuevo es mas reciente (2026-09-02 vs. RPW ago-2025) y viene de un
-- corredor identificado con alta confianza (Seccion 4.1, "actualizacion
-- ronda 4: identificacion confirmada por URL"), y (c) la diferencia es
-- demasiado grande para ignorar sin dejar constancia -- pero el caveat de
-- metodo de entrega queda documentado en el propio campo `data_source` para
-- cualquier auditoria futura.
-- ===========================================================================

update public.fx_rates
set rate = 1757.16,
    fee = 0,
    public_spread_percent = 2.00,
    data_source = 'Monito.com (tarjeta de Western Union), corredor Reino Unido->Nigeria, CASH PICKUP, envio de 100 GBP, insignia de tasa/comision preferencial en la primera transferencia -- CIFRA CORREGIDA (metodologia v11 Seccion 31): recipient gets real 175.716 NGN (mid-market de referencia 179.300 NGN para 100 GBP). Tipo de cambio aplicado implicito = 175.716/100 = 1.757,16 NGN/GBP (fuente no desglosa fee por separado en esta tabla, se pliega en el margen -- fee=0). Margen FX = (1.793-1.757,16)/1.793 = 2,00% (coincide exacto con el costo total dado por la fuente). ACTUALIZA la fila previa (World Bank RPW Q3 2025, fee 0,99 GBP + margen 2,18%, ~3,17% de costo total efectivo) -- diferencia de mas de 1 punto porcentual (~35% relativo), tratada como actualizacion genuina. CAVEAT: la fuente RPW original probablemente media cuenta bancaria/online, este dato de Monito es explicitamente cash pickup -- no es la misma medicion con dos fuentes, ver nota completa al inicio de esta seccion de la migracion. Identificacion del proveedor confirmada por URL (orden de los links "Go to X" coincidiendo con el orden de las tarjetas, research v14 Seccion 4.1, actualizacion ronda 4). Investigado 2-sep-2026 (research v14 Seccion 4.1).',
    data_collected_at = '2026-09-02',
    verified_status = 'sin_confirmar'
where id = '55764cc8-c895-4dfc-acd8-34b0a47653a5';

update public.fx_rates
set rate = 1849.16,
    fee = 0,
    public_spread_percent = -3.13,
    data_source = 'Monito.com (tarjeta de Remitly), corredor Reino Unido->Nigeria, CASH PICKUP, envio de 100 GBP, insignia de tasa/comision preferencial en la primera transferencia -- CIFRA CORREGIDA (metodologia v11 Seccion 31): recipient gets real 184.916 NGN (mid-market de referencia 179.300 NGN para 100 GBP). Tipo de cambio aplicado implicito = 184.916/100 = 1.849,16 NGN/GBP (fee=0, no desglosado por separado en la fuente). Margen FX = (1.793-1.849,16)/1.793 = -3,13% (favorable; coincide exacto con el costo total dado por la fuente). ACTUALIZA la fila previa (World Bank RPW Q3 2025, margen 0,25%, practicamente a mid-market) -- diferencia de mas de 3 puntos porcentuales, con cambio de signo (de costo leve a favorable), tratada como actualizacion genuina. CAVEAT: la fuente RPW original probablemente media cuenta bancaria/online, este dato de Monito es explicitamente cash pickup -- no es la misma medicion con dos fuentes, ver nota completa al inicio de esta seccion de la migracion. Identificacion del proveedor confirmada por URL (research v14 Seccion 4.1, actualizacion ronda 4; identificado ademas por el puntaje 9,1 coincidiendo con el badge "Best deal" de la pagina). Investigado 2-sep-2026 (research v14 Seccion 4.1).',
    data_collected_at = '2026-09-02',
    verified_status = 'sin_confirmar'
where id = '4884dd51-99d8-426e-a6b3-4868d78bfbda';

-- MoneyGram GB->NG: revisado, SIN cambios. Fila existente (World Bank RPW
-- Q3 2025, id no listado aca porque no se modifica): margen 0,03%. Dato
-- nuevo de Monito corregido (research v14 Seccion 4.1): 179.164 NGN
-- reales de 100 GBP, costo total 0,08% -- ambos "practicamente a
-- mid-market", diferencia de 0,05 puntos porcentuales, no meaningful. No se
-- ejecuta ningun UPDATE para esta fila.

-- ===========================================================================
-- NOT loaded from v14 -- ver tambien la seccion "Contaminacion estructural
-- confirmada" en la Nota de estado del documento addendum:
--
-- - TransferGo: v14 Seccion 4 confirma por escrito ("Total includes Central
--   Bank of Nigeria rate and receiver bonus from TransferGo", corredor
--   UK->Nigeria) que su tasa SIEMPRE incluye un bono no cuantificable. Las
--   filas ya existentes de TransferGo en fx_rates (GB->PL, DE->UA -- ver
--   consulta de verificacion de esta sesion; los valores de 0,15%/2,12% que
--   el propio texto del research v14 cita como "ya cargados" no coinciden
--   exactamente con lo que hoy esta en la base para esos corredores, una
--   discrepancia que queda señalada aca para una futura auditoria pero que
--   NO se resuelve en esta migracion) deben tratarse como PISOS OPTIMISTAS,
--   no como costo real recurrente. No se modifica ninguna fila de
--   TransferGo -- este documento no da una cifra limpia con la cual
--   reemplazarlas.
-- - SingX: v14 Seccion 5.1 confirma (via arbol de accesibilidad completo)
--   que nunca expone un segundo monto -- limite real de la interfaz de
--   Monito para este proveedor, no una limitacion de herramienta. SingX no
--   tiene ninguna fila en fx_rates ni en providers en este proyecto todavia
--   -- no se agrega ninguna, ya que no hay una cifra limpia que cargar.
-- - Corea del Sur (Seccion 2) y la auditoria retroactiva de promedios
--   agregados (Seccion 0, punto 16 del plan) son hallazgos de contexto/
--   metodologia, no datos de tarifa -- no aplican a fx_rates.
-- ===========================================================================
