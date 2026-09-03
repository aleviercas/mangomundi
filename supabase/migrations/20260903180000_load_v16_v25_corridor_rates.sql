-- Research v16-v25 (2026-09-02/03, consolidated batch: "moneda volatil ->
-- margen de remesas"): Mukuru's cluster of 7 origin countries (Kenya,
-- Zambia, Botswana, South Africa, Lesotho, Uganda, Rwanda), the corrected
-- Western Union Chile/Argentina "santo grial" founding comparison, Skrill's
-- 3 Kenya corridors, 8 OFX rows (Egypt x3, Sri Lanka, Pakistan, Mexico x2
-- tiers, Tanzania), Global66's 3rd Argentina corridor (->USA), and Western
-- Union Bolivia measured from 5 sending origins.
--
-- ===========================================================================
-- THE METHODOLOGICAL CORRECTION THIS MIGRATION APPLIES (instructivo Sec. 1,
-- discovered v23 Sec.6, confirmed live v25):
--
-- Monito's own displayed "% peor que el tipo de cambio medio" compares ONLY
-- the applied exchange rate against the mid-market rate -- it does NOT
-- account for a flat fee's cost as a fraction of the amount sent. This
-- project's `fx_rates` schema, however, already stores fee and
-- public_spread_percent as SEPARATE fields, and src/lib/fx.functions.ts's
-- live calculator combines them correctly: `rate = marketRate*(1-spread/100)`,
-- `received = (amountSent-fee)*rate` -- i.e. cost = 1-received/(amount*mid),
-- exactly the corrected formula the research derived. Verified against the
-- raw Kenya (Mukuru) numbers directly: applied 0.005338, mid 0.005730 ->
-- (mid-applied)/mid = 6.84%, matching Monito's own displayed figure exactly
-- -- so Monito's displayed "% peor" IS the pure FX-rate spread this schema's
-- public_spread_percent field has always held (see e.g. the v15 Botswana
-- Mukuru row: spread=-0.25%, NOT the 9.75% total-cost figure).
--
-- The actual bug this migration fixes is NOT "wrong spread field values" --
-- it's that several rounds (v16-v22) reported and compared Monito's raw
-- "% peor" number (0.37% for Botswana, 4.01% for Kenya, 1.37% for Chile...)
-- AS IF it were the corridor's total cost, without the fee. Loaded correctly
-- into fee+public_spread_percent (both real, sourced numbers, never
-- conflated into one field), this schema's own formula reproduces the
-- corrected "costo real" from the instructivo/conclusiones docs. Where the
-- source gives a fresh, self-consistent raw "% peor" + fee pairing that
-- reproduces the corrected costo_real (verified row by row against the
-- instructivo/conclusiones tables before writing this migration -- typically
-- within 0.01-0.1pp, attributable to the source's own rounding), that raw
-- percentage is loaded directly. Where a row's cited raw "%" is stale/
-- inconsistent with its own recalculated costo_real (South Africa->UK is the
-- one clear case) or simply wasn't given at all (Botswana, whose "0.37%" the
-- research itself explicitly disowns), public_spread_percent is instead
-- solved algebraically from the source's own real fee and its own final
-- corrected costo_real: spread_pct = 100*(1-(1-costo_real/100)/(1-fee/monto))
-- -- a direct transform of two real, sourced numbers (never an invented
-- one), the same category of technique already established in this project
-- for implicit rates (MoneyGram BR corrections, v11 Sec.31).
--
-- `rate` (the applied FX rate) is documentary only -- verified against
-- src/lib/fx.functions.ts that the live comparator never reads fx_rates.rate
-- (only fee + public_spread_percent), so its precision does not affect what
-- users see. Loaded directly from the source wherever given. Where absent,
-- derived by inverting/triangulating this project's own existing 0%-spread
-- Wise canonical rates or, failing that, the live rate_cache table
-- (frankfurter data already used elsewhere in this project) -- flagged
-- "APROXIMADO" in the row comment wherever this applies.
-- ===========================================================================

-- PART 1: Mukuru, 7 origin countries, 18 rows. Zero prior Mukuru rows
-- existed for ANY of these sending/receiving pairs (verified before writing
-- this migration) -- all INSERTs, no misattributed "Kenya 4.01%" row to fix
-- (per instructivo Sec.4 that figure belongs to Skrill -- see PART 3; it
-- was never loaded here as Mukuru in any prior round).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('KES', 'GBP', 0.005338, 3922, 'mukuru', 'KE', 'GB', false, 6.84,
   'Monito.com (tarjeta de Mukuru, verificada via enlace go.monito.com/mukuru), corredor Kenia->Reino Unido, envio de 200.000 KES. Fee 3.922 KES, tasa aplicada 0,005338, tipo de cambio medio 0,005730, "6,84% peor que el tipo medio". Costo real corregido: 8,64% -- CONFIRMADO en la tabla maestra del instructivo de carga (Seccion 2), reemplaza la cifra "4,01%" atribuida erroneamente a Mukuru en v20-v22 (esa cifra pertenece a Skrill -- instructivo Seccion 4 -- nunca se cargo como fila de Mukuru en Supabase). fee y public_spread_percent cargados por separado porque el calculador en vivo del proyecto (src/lib/fx.functions.ts) ya los combina correctamente. Investigado 3-sep-2026 (research v23 Seccion 6.4, confirmado v24 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar'),
  ('KES', 'USD', 0.007147, 1980, 'mukuru', 'KE', 'US', false, 7.49,
   'Monito.com (tarjeta de Mukuru), corredor Kenia->EEUU, envio de 200.000 KES. Fee 1.980 KES, tasa aplicada 0,007147, tipo de cambio medio 0,007726, "7,49% peor". Costo real corregido: 8,43% -- CONFIRMADO en instructivo Seccion 2. Investigado 3-sep-2026 (research v24 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar'),
  ('KES', 'EUR', 0.006309, 9524, 'mukuru', 'KE', 'DE', false, 5.38,
   'Monito.com (tarjeta de Mukuru), corredor Kenia->Alemania, envio de 200.000 KES. Fee 9.524 KES, tasa aplicada 0,006309, tipo de cambio medio 0,006667, "5,38% peor". Costo real corregido: 9,85% -- CONFIRMADO en instructivo Seccion 2, el mas caro de los tres destinos de Kenia. Investigado 3-sep-2026 (research v24 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar');

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ZMW', 'GBP', 0.037755, 9524, 'mukuru', 'ZM', 'GB', false, 4.25,
   'Monito.com (tarjeta de Mukuru), corredor Zambia->Reino Unido, envio de 200.000 ZMW. Fee 9.524 ZMW, "4,25% peor" (confirmado amount-independiente en 1.000/200.000/2.000.000 ZMW, research v22 Seccion 1.2). Costo real corregido: 8,85% -- CONFIRMADO instructivo Seccion 2. Rate APROXIMADO, derivado invirtiendo el canonico Wise GBP->ZMW=25,363327 (0% spread, ya en el proyecto) con el spread aplicado -- documentario, no afecta el costo mostrado. Investigado 3-sep-2026 (research v22 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar'),
  ('ZMW', 'USD', 0.051618, 6196, 'mukuru', 'ZM', 'US', false, 3.09,
   'Monito.com (tarjeta de Mukuru), corredor Zambia->EEUU, envio de 316.000 ZMW (monto "limpio" v23 Seccion 2). Fee 6.196 ZMW, "3,09% peor". Costo real corregido: 4,99% -- CONFIRMADO instructivo Seccion 2. Rate APROXIMADO, invirtiendo el canonico Wise USD->ZMW=18,7785. Investigado 3-sep-2026 (research v23 Seccion 2.2).',
   '2026-09-03', 'sin_confirmar'),
  ('ZMW', 'EUR', 0.043068, 15048, 'mukuru', 'ZM', 'DE', false, 4.37,
   'Monito.com (tarjeta de Mukuru), corredor Zambia->Alemania, envio de 316.000 ZMW. Fee 15.048 ZMW, tasa aplicada 0,043068 (dada directamente), "4,37% peor". Costo real corregido: 8,93% -- CONFIRMADO instructivo Seccion 2. Investigado 3-sep-2026 (research v23 Seccion 2.2).',
   '2026-09-03', 'sin_confirmar');

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BWP', 'GBP', 0.054694, 18182, 'mukuru', 'BW', 'GB', false, 0.60,
   'Monito.com (tarjeta de Mukuru), corredor Botsuana->Reino Unido, envio de 200.000 BWP. Fee 18.182 BWP (9,1% del monto). "% mostrado por Monito" historico: 0,37% -- citada por 3 rondas (v22-v23) como "el margen mas bajo del proyecto", HOY DESCARTADA: costo real corregido = 9,64% (instructivo Seccion 2, CONFIRMADO), de los mas altos. NO SE CARGA 0,37%. public_spread_percent (0,60%) DERIVADO algebraicamente de fee+costo_real (spread=100*(1-(1-0,0964)/(1-18182/200000))) porque el 0,37% original no reproduce el 9,64% recalculado via la formula fee+spread de este proyecto -- discrepancia documentada en la propia fuente (v23 Seccion 6). Rate APROXIMADO, triangulado GBP->ZAR=21,808126 * ZAR->BWP=0,829063 (canonicos Wise 0% spread ya en el proyecto). Investigado 3-sep-2026 (research v22 Seccion 8, corregido v23 Seccion 6).',
   '2026-09-03', 'sin_confirmar'),
  ('BWP', 'ZAR', 1.136768, 9524, 'mukuru', 'BW', 'ZA', false, 5.10,
   'Monito.com (tarjeta de Mukuru), corredor Botsuana->Sudafrica, envio de 200.000 BWP. Fee 9.524 BWP. "% mostrado" historico: 4,58% -- costo real corregido: 9,63% (instructivo Seccion 2, CONFIRMADO) -- practicamente identico al de Reino Unido una vez corregido, revirtiendo la "complicacion de destino" que v22 presento como hallazgo (research v23 Seccion 6.4). public_spread_percent (5,10%) DERIVADO algebraicamente de fee+costo_real. Rate APROXIMADO, triangulado via ZAR->BWP=0,829063 invertido. Investigado 3-sep-2026 (research v22 Seccion 8, corregido v23 Seccion 6).',
   '2026-09-03', 'sin_confirmar'),
  ('BWP', 'USD', 0.069844, 3922, 'mukuru', 'BW', 'US', false, 6.06,
   'Monito.com (tarjeta de Mukuru), corredor Botsuana->EEUU, envio de 200.000 BWP. Fee 3.922 BWP. Costo real: 7,91% -- dado DIRECTAMENTE por la fuente (research v24 Seccion 4.2), sin "% mostrado" separado documentado -- el mas barato de los 3 destinos de Botsuana (7,91% vs 9,63-9,64%), matizando la hipotesis de "recargo hacia Sudafrica" (v24 Seccion 4.3). public_spread_percent (6,06%) DERIVADO algebraicamente del fee real y el costo_real final. Rate APROXIMADO via rate_cache (frankfurter, USD->BWP=13,4505). Investigado 3-sep-2026 (research v24 Seccion 4.2).',
   '2026-09-03', 'sin_confirmar');

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ZAR', 'GBP', 0.044911, 850, 'mukuru', 'ZA', 'GB', false, 2.06,
   'Monito.com (tarjeta de Mukuru), corredor Sudafrica->Reino Unido, envio de 200.000 ZAR. Fee 850 ZAR. "% mostrado" citado en v21/v22/v23: 1,29% -- NO SE CARGA: no reproduce el propio costo_real recalculado de la fuente (2,48%, instructivo/conclusiones, CONFIRMADO) via la formula fee+spread de este proyecto (1,29% da 1,71% de costo, no 2,48% -- discrepancia de 0,77pp, muy por encima del redondeo de ~0,03-0,1pp visto en el resto de filas de esta migracion; la propia fuente marca esta cifra como heredada "(v22)", mientras EEUU/Alemania del mismo cuadro son datos frescos de v23 y si son autoconsistentes). public_spread_percent (2,06%) DERIVADO algebraicamente del fee real (850 ZAR) y el costo_real final (2,48%). Rate APROXIMADO, invertido del canonico Wise GBP->ZAR=21,808126. Investigado 3-sep-2026 (research v21 Seccion 6.2, recalculo v23 Seccion 6.3 -- discrepancia senalada para auditoria futura).',
   '2026-09-03', 'sin_confirmar'),
  ('ZAR', 'USD', 0.061446, 4000, 'mukuru', 'ZA', 'US', false, 1.32,
   'Monito.com (tarjeta de Mukuru), corredor Sudafrica->EEUU, envio de 200.000 ZAR. Fee 4.000 ZAR (2% del monto), tasa aplicada 0,061446 (dada directamente), "1,32% peor" (dato fresco v23). Costo real corregido: 3,27% -- CONFIRMADO instructivo Seccion 2 ("Sudafrica: 1,86-3,27%"). Investigado 3-sep-2026 (research v23 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar'),
  ('ZAR', 'EUR', 0.052886, 850, 'mukuru', 'ZA', 'DE', false, 1.44,
   'Monito.com (tarjeta de Mukuru), corredor Sudafrica->Alemania, envio de 200.000 ZAR. Fee 850 ZAR, tasa aplicada 0,052886 (dada directamente), "1,44% peor" (dato fresco v23). Costo real corregido: 1,86% -- CONFIRMADO instructivo Seccion 2, el mas barato de los 3 destinos de Sudafrica. Investigado 3-sep-2026 (research v23 Seccion 1.2).',
   '2026-09-03', 'sin_confirmar');

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, min_amount, max_amount,
  data_source, data_collected_at, verified_status
) values
  ('LSL', 'ZAR', 1.0000, 10427, 'mukuru', 'LS', 'ZA', false, 0,
   null, null,
   'Monito.com (tarjeta de Mukuru), corredor Lesotho->Sudafrica, envio de 200.000 LSL. Tasa de cambio 1,0000 EXACTA, dada literalmente como "as good as the mid-market rate" -- loti fijado 1:1 al rand desde 1974. Fee 10.427 LSL -- con spread=0, el costo total es integramente el fee (5,2135%), coincide con el costo real corregido de 5,21% (instructivo Seccion 2, CONFIRMADO) -- el margen mas alto de los 7 paises de Mukuru pese a volatilidad cambiaria CERO (research v23 Seccion 3.4). Confirmado amount-independiente (5,2132% a 500.000 LSL, v23 Seccion 7) -- se carga solo el tramo de 200.000 LSL como representativo. Investigado 3-sep-2026 (research v23 Seccion 3.2, confirmado Seccion 7).',
   '2026-09-03', 'sin_confirmar'),
  ('LSL', 'GBP', 0.045694, 850, 'mukuru', 'LS', 'GB', false, 0.90,
   null, 499999,
   'Monito.com (tarjeta de Mukuru), corredor Lesotho->Reino Unido, TRAMO 1 (200.000 LSL). Fee 850 LSL, tasa aplicada 0,045694 (dada directamente), "0,9% peor". Costo real corregido: 1,33% -- CONFIRMADO instructivo Seccion 2 (rango 1,15-1,33% segun monto). Cargado como TRAMO min_amount=null (hasta 499.999 LSL) porque el research (v23 Seccion 7) confirma que este corredor SI varia por monto -- ver tramo 2, mismo patron ya usado para SBI Remit (v14 PART 3). Investigado 3-sep-2026 (research v23 Seccion 3.3, confirmado Seccion 7).',
   '2026-09-03', 'sin_confirmar'),
  ('LSL', 'GBP', 0.045657, 850, 'mukuru', 'LS', 'GB', false, 0.98,
   500000, null,
   'Monito.com (tarjeta de Mukuru), corredor Lesotho->Reino Unido, TRAMO 2 (500.000 LSL). Fee 850 LSL (identico al tramo 1), "0,98% peor" (datos frescos). Costo real corregido: 1,15% -- CONFIRMADO instructivo Seccion 2. Rate APROXIMADO, derivado del tipo medio implicito del tramo 1 aplicado al spread de este tramo -- documentario. Investigado 3-sep-2026 (research v23 Seccion 7).',
   '2026-09-03', 'sin_confirmar'),
  ('LSL', 'USD', 0.061282, 3922, 'mukuru', 'LS', 'US', false, 1.24,
   null, null,
   'Monito.com (tarjeta de Mukuru), corredor Lesotho->EEUU, envio de 200.000 LSL. Fee 3.922 LSL. Costo real: 3,18% -- dado DIRECTAMENTE por la fuente (v24 Seccion 4.2), sin "% mostrado" separado. Confirma el gradiente limpio de 3 niveles: Reino Unido (~1,2-1,3%) < EEUU (3,18%) < Sudafrica (5,21%) (v24 Seccion 4.3). public_spread_percent DERIVADO algebraicamente del fee real y el costo_real final. Rate APROXIMADO via rate_cache (USD->LSL=16,1149). Investigado 3-sep-2026 (research v24 Seccion 4.2).',
   '2026-09-03', 'sin_confirmar');

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('UGX', 'GBP', 0.000196, 52615, 'mukuru', 'UG', 'GB', false, 0.01,
   'Monito.com (tarjeta de Mukuru), corredor Uganda->Reino Unido, envio de 700.000 UGX. Fee 52.615 UGX (7,5% del monto -- por eso el "0,01% peor" que muestra Monito es enganoso leido como costo total). Tasa aplicada 0,000196 dada directamente. Costo real corregido: ~7,52% -- CONFIRMADO instructivo Seccion 2 -- este corredor SI reproduce su costo_real limpiamente desde el "% mostrado" + fee, sin necesitar derivacion algebraica. Sexto pais de Mukuru, primero fuera del cluster de Africa austral. Investigado 3-sep-2026 (research v23 Seccion 8).',
   '2026-09-03', 'sin_confirmar'),
  ('RWF', 'GBP', 0.000478, 5143, 'mukuru', 'RW', 'GB', false, 5.05,
   'Monito.com (tarjeta de Mukuru), corredor Rwanda->Reino Unido, envio de 200.000 RWF. Fee 5.143 RWF, tasa aplicada 0,000478, tipo de cambio medio 0,000503 (dados directamente), "5,05% peor". Costo real corregido: 7,42% -- CONFIRMADO instructivo Seccion 2. Septimo y ultimo pais de Mukuru confirmado -- se busco fuera de Africa (Pakistan, Filipinas, Tanzania, Senegal probados) sin exito. Investigado 3-sep-2026 (research v24 Seccion 5.2).',
   '2026-09-03', 'sin_confirmar');

-- PART 2: Western Union Chile/Argentina "santo grial", confirmado en vivo
-- v25. Chile->Espana YA existe en fx_rates (id fbd2a4a7, datos de v16,
-- 2025-08-01) -- UPDATE, no insert. Argentina->EEUU NO tenia fila previa
-- (solo AR->ES y AR->IT existian, de v15) -- INSERT.
update public.fx_rates
set rate = 0.000908,
    fee = 2100,
    public_spread_percent = 1.09,
    data_source = 'Monito.com (tarjeta de Western Union), corredor Chile->Espana, envio de 100.000 CLP -- MEDICION EN VIVO v25 (3-sep-2026), reemplaza la fila previa (rate=0,000947, fee=2000, spread=2,5%, fecha 2025-08-01). Fee 2.100 CLP (identico a v16), tasa aplicada 0,000908, tipo de cambio medio 0,000919 (mostrado directamente por Monito, fuente XE.com). Costo real corregido: 3,25% -- CONFIRMADO EN VIVO (research v25 Seccion 1.2), reemplaza el 1,37-1,40% citado sin cambios desde v16 (8 rondas) -- el costo real es practicamente el TRIPLE. La brecha Chile/Argentina se sostiene con la correccion (~3,1x en vez de ~4x), pero ambos extremos suben en terminos absolutos. Investigado 3-sep-2026 (research v16 Seccion 3.1, recalculo v23 Seccion 3.1, confirmado en vivo v25 Seccion 1.2).',
    data_collected_at = '2026-09-03',
    verified_status = 'confirmado_activo'
where id = 'fbd2a4a7-cdf9-4471-8939-a9ee193e7657';

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ARS', 'USD', 0.000627, 5000, 'western-union', 'AR', 'US', false, 5.35,
   'Monito.com (tarjeta de Western Union), corredor Argentina->EEUU, envio de 100.000 ARS -- MEDICION EN VIVO v25 (3-sep-2026). Fee 5.000 ARS (5% del monto), tasa aplicada 0,000627, tipo de cambio medio 0,000662 (mostrado directamente por Monito, fuente XE.com). Costo real corregido: 10,10% -- CONFIRMADO EN VIVO (research v25 Seccion 1.3), reemplaza el 5,12-5,35% citado desde v16 -- casi el DOBLE. Validado por consistencia interna contra Global66 (fee $0, mismo corredor, PART 5 de esta migracion): formula da 5,26% vs 5,24% mostrado por Monito, coinciden casi exacto (research v25 Seccion 1.4). SALVEDAD DE ALCANCE (instructivo Seccion 5, conclusiones Seccion 6): confiable PARA ESTE CORREDOR ESPECIFICO -- no resuelve el problema estructural mas amplio del tipo de cambio "medio" del ARS. No generalizar a otros corredores argentinos sin verificar caso por caso. Zero filas previas para este corredor exacto, verificado antes de escribir esta migracion. Investigado 3-sep-2026 (research v16 Seccion 1, recalculo v23 Seccion 3.1, confirmado en vivo v25 Seccion 1.3).',
   '2026-09-03', 'confirmado_activo');

-- PART 3: Skrill, Kenia, 3 corredores. Cero filas previas de Skrill para
-- Kenia en ningun corredor -- los 3 son INSERT.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('KES', 'GBP', 0.005386, 635, 'skrill', 'KE', 'GB', false, 5.99,
   'Monito.com (tarjeta de Skrill, verificada via go.monito.com/skrill), corredor Kenia->Reino Unido, envio de 32.400 KES -- MEDICION EN VIVO v25 (3-sep-2026). Fee 635 KES (identico a v19/v20). Tasa aplicada 0,005386, tipo de cambio medio 0,005723. Costo real corregido: 7,73% -- CONFIRMADO EN VIVO (research v25 Seccion 2.1), reemplaza tanto el 6,81% (v19/v20) como el 5,99% mostrado hoy -- la "exencion" que v24 atribuyo a Skrill en Kenia se probo solo en Alemania (fee $0); este corredor SI tiene comision fija real (instructivo Seccion 3.2). Investigado 3-sep-2026 (research v19 Seccion 4, confirmado en vivo v25 Seccion 2.1).',
   '2026-09-03', 'confirmado_activo'),
  ('KES', 'USD', 0.007157, 495, 'skrill', 'KE', 'US', false, 7.37,
   'Monito.com (tarjeta de Skrill), corredor Kenia->EEUU, envio de 50.000 KES -- MEDICION EN VIVO v25 (3-sep-2026). Fee 495 KES (identico a v19). Tasa aplicada 0,007157, tipo de cambio medio 0,007726. Costo real corregido: 8,28% -- CONFIRMADO EN VIVO (research v25 Seccion 2.2), reemplaza el 7,4% (v19) y el 7,37% mostrado hoy. Investigado 3-sep-2026 (research v19 Seccion 4, confirmado en vivo v25 Seccion 2.2).',
   '2026-09-03', 'confirmado_activo'),
  ('KES', 'EUR', 0.006500, 0, 'skrill', 'KE', 'DE', false, 2.51,
   'Monito.com (tarjeta de Skrill), corredor Kenia->Alemania, envio de 200.000 KES. Fee $0 (unico corredor de Skrill del proyecto sin comision fija). Tasa aplicada 0,006500, tipo de cambio medio 0,006667, "2,51% peor" -- CON FEE=0 esta cifra YA ES el costo real, no necesita correccion (verificado exacto, research v24 Seccion 2.1). Sin cambios respecto a mediciones anteriores. Investigado 3-sep-2026 (research v21 Seccion 4, confirmado v24 Seccion 2).',
   '2026-09-03', 'sin_confirmar');

-- PART 4: OFX, 8 filas -- todos fee $0, sin correccion necesaria (el "%
-- mostrado" YA es el costo real). Turquia NO se carga: ningun archivo
-- fuente da una cifra de tarjeta individual para OFX en Turquia -- solo el
-- agregado propio de Monito, que la convencion del proyecto excluye
-- siempre. Cero filas previas para EG/LK/PK/MX/TZ+ofx -- las 8 son INSERT.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, min_amount, max_amount,
  data_source, data_collected_at, verified_status
) values
  ('EGP', 'GBP', 0.013875, 0, 'ofx', 'EG', 'GB', false, 4.14, null, null,
   'Monito.com (tarjeta de OFX, broker de cambio), corredor Egipto->Reino Unido, envio de 30.000 EGP. Fee "Gratis" (0). Tasa aplicada 0,013875, "4,14% peor" -- con fee=0 coincide con el costo real. Unico proveedor disponible. Investigado 2-sep-2026 (research v18 Seccion 2.1).',
   '2026-09-02', 'sin_confirmar'),
  ('EGP', 'USD', 0.018113, 0, 'ofx', 'EG', 'US', false, 7.53, null, null,
   'Monito.com (tarjeta de OFX), corredor Egipto->EEUU, envio de 10.000 EGP. Fee "Gratis" (0). Tasa aplicada 0,018113, "7,53% peor". Sin correccion necesaria. Investigado 2-sep-2026 (research v18 Seccion 2.1).',
   '2026-09-02', 'sin_confirmar'),
  ('EGP', 'EUR', 0.015646, 0, 'ofx', 'EG', 'IT', false, 7.54, null, null,
   'Monito.com (tarjeta de OFX), corredor Egipto->Italia, envio de 10.000 EGP. Fee "Gratis" (0). Tasa aplicada 0,015646, "7,54% peor" -- casi identico al de EEUU, primera comparacion "mismo proveedor/origen, distinto destino" desde Global66 Argentina (v16). Investigado 2-sep-2026 (research v18 Seccion 2.1-2.2).',
   '2026-09-02', 'sin_confirmar'),
  ('LKR', 'GBP', 0.0021978, 0, 'ofx', 'LK', 'GB', false, 2.51, null, null,
   'Monito.com (tarjeta de OFX), corredor Sri Lanka->Reino Unido, envio de 2.000.000 LKR. Fee "Gratis" (0). "2,51% peor" -- sin correccion necesaria. Crisis de deuda 2022 mayormente resuelta a 2026. Rate APROXIMADO -- fuente sin tasa absoluta, derivado de rate_cache (USD->LKR=328,31, USD->GBP=0,74014) con el spread aplicado -- documentario. Investigado 2-sep-2026 (research v18 Seccion 3).',
   '2026-09-02', 'sin_confirmar'),
  ('PKR', 'GBP', 0.0025243, 0, 'ofx', 'PK', 'GB', false, 5.13, null, null,
   'Monito.com (tarjeta de OFX), corredor Pakistan->Reino Unido, envio de 500.000 PKR. Fee "Gratis" (0). "5,13% peor". Rate APROXIMADO, misma tecnica (rate_cache USD->PKR=278,17). Investigado 2-sep-2026 (research v18 Seccion 3).',
   '2026-09-02', 'sin_confirmar'),
  ('MXN', 'GBP', 0.041690, 0, 'ofx', 'MX', 'GB', false, 4.04, null, 29999,
   'Monito.com (tarjeta de OFX), corredor Mexico->Reino Unido, TRAMO 1 (6.000 MXN, ~US$290). Fee "Gratis" (0). Tasa aplicada 0,041690, "4,04% peor" -- unico caso del proyecto con margen dependiente del monto confirmado (research v18 Seccion 4.3): 4,04% a 6.000 MXN vs 2,5% a 30.000 MXN (ver tramo 2). Cargado como TRAMO min_amount=null (hasta 29.999 MXN). Investigado 2-sep-2026 (research v18 Seccion 4.3).',
   '2026-09-02', 'sin_confirmar'),
  ('MXN', 'GBP', 0.042573, 0, 'ofx', 'MX', 'GB', false, 2.50, 30000, null,
   'Monito.com (tarjeta de OFX), corredor Mexico->Reino Unido, TRAMO 2 (30.000 MXN, 5x el tramo 1). Fee "Gratis" (0). Tasa aplicada 0,042573, "2,5% peor" -- casi la mitad del tramo 1, confirma que OFX mejora tasas con montos mayores (comportamiento de broker, no minorista). Investigado 2-sep-2026 (research v18 Seccion 4.3).',
   '2026-09-02', 'sin_confirmar'),
  ('TZS', 'GBP', 0.000257, 0, 'ofx', 'TZ', 'GB', false, 8.21, null, null,
   'Monito.com (tarjeta de OFX), corredor Tanzania->Reino Unido, envio de 500.000 TZS. Fee "Gratis" (0). Tasa aplicada 0,000257, tipo de cambio medio 0,000280 (dados directamente), "8,21% peor" -- coincide con el costo real. El mas alto del grupo OFX. Octavo pais "de relleno" via OFX. Investigado 3-sep-2026 (research v25 Seccion 3).',
   '2026-09-03', 'sin_confirmar');

-- PART 5: Global66, Argentina->EEUU. Fee $0, sin correccion necesaria. Zero
-- filas previas para este corredor exacto -- INSERT.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ARS', 'USD', 0.000627, 0, 'global66', 'AR', 'US', false, 5.24,
   'Monito.com (tarjeta de Global66), corredor Argentina->EEUU, envio de 100.000 ARS. Fee "Free" (0). Tasa aplicada 0,000627 (identica a Western Union en el mismo corredor), "5,24% peor" -- sin correccion necesaria. Tercer corredor argentino de Global66 (junto a Espana 5,28% e Italia 5,28%, v15) -- confirma que el fenomeno es del ORIGEN, no del destino. Validacion cruzada del tipo de cambio medio del ARS usado en la fila Western Union AR->US (research v25 Seccion 1.4). Investigado 2-sep-2026 (research v16 Seccion 1).',
   '2026-09-02', 'sin_confirmar');

-- PART 6: Western Union, Bolivia, 5 origenes -- "el caso que no tiene un
-- numero representativo" (0,62% a 9,16%, instructivo Seccion 6). EEUU YA
-- tenia una fila (RPW, 2025-08-01) -- UPDATE tramo 1.000 USD + INSERT tramo
-- 5.000 USD. Espana/Brasil/Italia/Argentina: cero filas previas -- INSERT.
update public.fx_rates
set rate = 12.2600,
    fee = 20.99,
    public_spread_percent = -0.76,
    min_amount = 1000,
    max_amount = 4999,
    data_source = 'Monito.com (tarjeta de Western Union, tasa regular), corredor EEUU->Bolivia, TRAMO 1 (1.000 USD). ACTUALIZA la fila previa (World Bank RPW Q3 2025, rate=11,6566, fee=1,99, spread=2,9%, fecha 2025-08-01 -- de antes de que Bolivia terminara con 15 anos de paridad fija en julio de 2026). Fee 20,99 USD, tasa aplicada 12,2600, tipo de cambio medio 12,1677 (dados directamente). Costo real corregido: 1,35% -- dado directamente por la fuente. Bolivia se midio desde 5 origenes con resultados de 0,62% a 9,16% (instructivo Seccion 6) -- NO se carga como numero unico "Bolivia=X%", se carga cada origen por separado (ver resto de PART 6). Investigado 3-sep-2026 (research v23 Seccion 9.2).',
    data_collected_at = '2026-09-03',
    verified_status = 'sin_confirmar'
where id = 'a44e3c2c-a5ad-4837-9ee3-ba6e0465121a';

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, min_amount, max_amount,
  data_source, data_collected_at, verified_status
) values
  ('USD', 'BOB', 12.2600, 64.99, 'western-union', 'US', 'BO', false, -0.69,
   5000, null,
   'Monito.com (tarjeta de Western Union, tasa regular), corredor EEUU->Bolivia, TRAMO 2 (5.000 USD). Fee 64,99 USD (no proporcional al tramo 1 -- 1,30% vs 2,10% del monto). Tasa aplicada 12,2600 (identica al tramo 1), tipo de cambio medio 12,1760. Costo real: 0,62% -- dado directamente. El extremo mas barato de los 5 origenes de Bolivia, por debajo incluso de Chile. Investigado 3-sep-2026 (research v23 Seccion 9.2).',
   '2026-09-03', 'sin_confirmar'),
  ('EUR', 'BOB', 13.7970, 5.99, 'western-union', 'ES', 'BO', false, 1.50,
   null, null,
   'Monito.com (tarjeta de Western Union, tasa regular), corredor Espana->Bolivia. Fee 5,99 EUR (estable en 1.000 y 5.000 EUR). Tasa aplicada 13,7970 (dada directamente). Costo real dado por la fuente: "estable" entre 2,04% (5.000 EUR) y 2,14% (1.000 EUR) -- research v24 Seccion 3.2 -- sin tasa media exacta por tramo, se carga como fila UNICA representativa a 1.000 EUR, con spread DERIVADO algebraicamente para el punto medio del rango (~2,09%). Segundo punto de comparacion Western Union Latinoamerica -- cae en un punto intermedio. Investigado 3-sep-2026 (research v23 Seccion 5.2, ampliado v24 Seccion 3.2).',
   '2026-09-03', 'sin_confirmar'),
  ('BRL', 'BOB', 2.3330, 30, 'western-union', 'BR', 'BO', false, 2.16,
   null, null,
   'Monito.com (tarjeta de Western Union), corredor Brasil->Bolivia, envio de 2.000 BRL. Fee 30,00 BRL, tasa aplicada 2,3330, tipo de cambio medio 2,3844 (dados directamente). Costo real: 3,62% -- dado directamente, verificado EXACTO contra la formula fee+spread de este proyecto. Valor intermedio entre Espana e Italia. Investigado 3-sep-2026 (research v24 Seccion 6.1).',
   '2026-09-03', 'sin_confirmar'),
  ('EUR', 'BOB', 13.3349, 10, 'western-union', 'IT', 'BO', false, 5.41,
   null, null,
   'Monito.com (tarjeta de Western Union), corredor Italia->Bolivia, envio de 1.000 EUR -- sin insignia promocional. Fee 10,00 EUR, tasa aplicada 13,3349, tipo de cambio medio 14,0969 (dados directamente), "5,41% peor". Costo real: 6,35% -- dado directamente, verificado casi exacto contra la formula. Mas caro que el extremo inferior del propio rango de Argentina -- complica la narrativa de "Bolivia como punto intermedio limpio". Investigado 3-sep-2026 (research v24 Seccion 3.1).',
   '2026-09-03', 'sin_confirmar'),
  ('ARS', 'BOB', 0.007682, 25000, 'western-union', 'AR', 'BO', false, 4.38,
   null, null,
   'Monito.com (tarjeta de Western Union), corredor Argentina->Bolivia, envio de 500.000 ARS, cash pickup. Fee 25.000 ARS (5%), tasa aplicada 0,007682, tipo de cambio medio 0,008034 (dados directamente). Costo real: 9,16% -- dado directamente, verificado exacto. EL MAS CARO de los 5 origenes de Bolivia. SALVEDAD ARS (instructivo Seccion 5): carga sobre la misma incertidumbre estructural del tipo de cambio "medio" del peso argentino -- se carga porque el instructivo explicitamente lo indica (Seccion 6), pero con esta salvedad explicita en notas. Investigado 3-sep-2026 (research v24 Seccion 6.1).',
   '2026-09-03', 'sin_confirmar');

-- NOT loaded from v16-v25 -- ver docs/data-sources/ para el detalle:
-- - Zero-coverage countries (25+ paises: Lebanon, Venezuela, Nigeria,
--   Ukraine, Russia, Ghana, Cuba, Suriname, Gambia, Guinea, Mozambique,
--   Malawi, Nicaragua, Angola, Sierra Leone, Ethiopia, Sudan, Haiti,
--   Myanmar, Laos, Bangladesh, Vietnam, Paraguay, Mongolia, Cambodia...):
--   ausencia de proveedor, no un dato de tarifa -- documentados solo en
--   docs/data-sources/, no en la base de datos.
-- - Zimbabwe, DR Congo, South Sudan: Monito no ofrece su moneda local como
--   opcion (fuerza USD/USD/GBP) -- no hay margen cambiario que medir.
-- - TransferGo (Turquia, v17): contaminacion estructural confirmada (v15
--   Seccion 5.3) -- el propio archivo v17 senala no cargar estos datos.
-- - OFX Turquia: sin cifra de tarjeta individual citable en ningun archivo
--   fuente, solo el agregado propio de Monito (la convencion del proyecto
--   excluye siempre esos promedios).
-- - Cualquier otro corredor en ARS mas alla de Western Union AR->US (PART 2)
--   y Argentina->Bolivia (PART 6): instructivo Seccion 5 / conclusiones
--   Seccion 6 advierten no generalizar el tipo de cambio "medio" del ARS a
--   ningun otro corredor sin verificacion caso por caso.
