-- AG6 discrepancy resolution (2026-09-02): reconcile 24 confirmed Group A
-- fx_rates overwrites (research v9-v13 vs. existing data), the Wise
-- systematic spread=0 fix, the Skrill provider-level correction + 2 new
-- corridor rows, and Group B duplicate-row cleanup. Full audit trail in
-- docs/data-sources/2026-09-02-ag6-discrepancy-resolution.md.
--
-- Items 1 (Xoom UK-MX), 2 (Remitly UK-AR) and 19 (Western Union IT-EC) are
-- explicitly confirmed "no tocar" (different payment methods / methodology)
-- and are NOT touched by this migration.

-- =====================================================================
-- PART 1 -- Group A overwrites (24 rows)
-- =====================================================================

-- 3. Ria, EEUU->Mexico: 1.8% -> 1.24% (research v9 Seccion 11.1, World Bank
-- RPW Q3 2025, misma tabla/corredor especifico, no una fila distinta del
-- mismo panel).
update public.fx_rates set
  public_spread_percent = 1.24,
  data_source = data_source || ' -- corregido 2026-09-02: research v9 Seccion 11.1 (World Bank RPW Q3 2025, fila especifica de este corredor) mide 1.24% de margen, reemplaza el 1.8% previo. Discrepancia documentada y resuelta segun recomendacion confirmada por el usuario.',
  data_collected_at = '2026-09-02'
where id = 'e91851da-7396-41d0-9044-392c503c85e5';

-- 4. Ria, Espana->Colombia: 0% -> 1.44% (research v9 Seccion 11.1, World Bank RPW).
update public.fx_rates set
  public_spread_percent = 1.44,
  data_source = data_source || ' -- corregido 2026-09-02: research v9 Seccion 11.1 (World Bank RPW Q3 2025) mide 1.44% de margen, reemplaza el 0% previo. Discrepancia documentada y resuelta segun recomendacion confirmada por el usuario.',
  data_collected_at = '2026-09-02'
where id = '42092890-f6f9-498e-8377-2687ee964640';

-- 5. Sendwave, EEUU->Kenia: 1.5% -> 1.07% (research v11 Seccion 5.1, medicion
-- en vivo sendwave.com/en-us/countries/kenya, no Monito).
update public.fx_rates set
  public_spread_percent = 1.07,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 5.1, medicion en vivo (sendwave.com/en-us/countries/kenya, no Monito) da margen regular 1.07% (tasa regular 1 USD=128.010 KES vs. mid-market Wise 129.400). Reemplaza el 1.5% previo.',
  data_collected_at = '2026-09-02'
where id = '3d5cd4eb-c2b1-4b2d-a210-b44ddb447b55';

-- 6. MoneyGram, EEUU->India: granularidad preferida -- fee 0.99% x USD 200
-- (monto de referencia RPW) = fee fijo 1.98, spread (margen FX) 0.26%.
-- Fuente: research v10 Seccion 2.1, World Bank RPW Q3 2025, envio USD 200.
update public.fx_rates set
  fee = 1.98,
  public_spread_percent = 0.26,
  data_source = data_source || ' -- corregido 2026-09-02: research v10 Seccion 2.1 (World Bank RPW Q3 2025, envio de USD 200) descompone fee 0.99% ($1.98 sobre el monto de referencia) + margen FX 0.26% = costo total 0.76%. Se cargo separado en fee/public_spread_percent en vez de un solo numero, siguiendo la granularidad del propio dato. Reemplaza fee=0/spread=1.45% previo.',
  data_collected_at = '2026-09-02'
where id = '19bab6c7-da96-4a5f-9941-fb99d17d70f9';

-- 7. Ria, EEUU->India: spread -> 0.77% (costo total). Fuente: research v10
-- Seccion 2.1, World Bank RPW Q3 2025.
update public.fx_rates set
  public_spread_percent = 0.77,
  data_source = data_source || ' -- corregido 2026-09-02: research v10 Seccion 2.1 (World Bank RPW Q3 2025, envio USD 200) da fee 0.99% + margen 0.27% = costo total 0.77%. Reemplaza el spread=0% previo (fee fijo $2.9 existente no tocado).',
  data_collected_at = '2026-09-02'
where id = 'f7e217ab-a741-49b2-9aef-49c84a8423c6';

-- 8. Western Union, EEUU->India: spread -> 1.18% (costo total). Fuente:
-- research v10 Seccion 2.1, World Bank RPW Q3 2025.
update public.fx_rates set
  public_spread_percent = 1.18,
  data_source = data_source || ' -- corregido 2026-09-02: research v10 Seccion 2.1 (World Bank RPW Q3 2025, envio USD 200) da fee 0.99% + margen 0.68% = costo total 1.18%. Reemplaza el spread=3% previo (fee fijo $1.99 existente no tocado).',
  data_collected_at = '2026-09-02'
where id = 'c6a3c455-928b-4276-9c8d-34e64d17070b';

-- 9. Wise, Reino Unido->India: spread -> 0% (margen). Fuente: research v11
-- Seccion 2.2, World Bank RPW Q3 2025 (costo total 1.09%, todo via fee,
-- margen FX 0% -- confirma el patron Wise). Se incluye tambien en el fix
-- sistematico de Wise mas abajo (Parte 2), aca queda documentado
-- individualmente por ser uno de los 24 casos Grupo A.
update public.fx_rates set
  public_spread_percent = 0,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 2.2 (World Bank RPW Q3 2025) confirma margen FX 0% (costo total 1.09% va integro en el fee declarado), consistente con el patron de Wise en todo el proyecto. Reemplaza el spread=0.5% previo. Ver tambien el fix sistematico de Wise (Parte 2 de esta migracion).',
  data_collected_at = '2026-09-02'
where id = '6a02c5fe-e19f-42f0-a77c-022d3dbfaba9';

-- 10. Paysend, Reino Unido->India: spread -> 0.37% (margen FX especifico,
-- no el costo total 1.20%, para que sea consistente con la convencion ya
-- establecida de Wise). Fuente: research v11 Seccion 2.2, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 0.37,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 2.2 (World Bank RPW Q3 2025) mide margen FX 0.37% (costo total 1.20%, fee no separado en el panel). Se usa la cifra de margen (no el costo total) para que el campo public_spread_percent siga la misma convencion ya usada para Wise en este corredor. Reemplaza el spread=-0.14% previo.',
  data_collected_at = '2026-09-02'
where id = 'c50b451d-78b3-4c40-9b33-faf357cc6ccf';

-- 11. MoneyGram, Arabia Saudita->India: spread -> 1.27% (margen FX). Fuente:
-- research v11 Seccion 2.1, World Bank RPW Q3 2025.
update public.fx_rates set
  public_spread_percent = 1.27,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 2.1 (World Bank RPW Q3 2025) mide margen FX 1.27% (costo total 3.57%, fee ya cargado en $10 fijo no tocado). Reemplaza el spread=0.8% previo.',
  data_collected_at = '2026-09-02'
where id = 'c896bb52-183c-4ed1-86a6-12d4a9422b82';

-- 12. Mukuru, Sudafrica->Zimbabue: spread -> 9.66% (costo total, punto
-- Monito cross-validado). Fuente: research v11 Seccion 13.1 (World Bank
-- RPW, 10.3%-10.7% costo total en vivo) + v12 Seccion 1.1 (Monito
-- re-auditado, confirmado limpio de contaminacion promocional: un solo
-- monto, sin insignia de "primera transferencia"). Doble fuente
-- independiente que coincide -- uno de los casos de mayor confianza de
-- todo este lote. verified_status sube de sin_confirmar a confirmado_activo.
update public.fx_rates set
  public_spread_percent = 9.66,
  verified_status = 'confirmado_activo',
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 13.1 (World Bank RPW, 10.3%-10.7% costo total en vivo, el mas caro de los no-bancarios en este corredor) + v12 Seccion 1.1 (Monito.com re-auditado retroactivamente: costo total ~9.66%, tarjeta confirmada limpia -- un solo monto, sin insignia de "primera transferencia preferencial", mismo patron que Xoom EEUU-Mexico). Doble fuente independiente coincidente (RPW + Monito). Reemplaza el spread=2.5% previo (sin_confirmar); sube a confirmado_activo por la cross-validacion.',
  data_collected_at = '2026-09-02'
where id = '5f21f5b4-b527-4ce1-8871-f3091d9695c0';

-- 13. Mukuru, Sudafrica->Mozambique: spread -> -4.85% (margen negativo/
-- favorable). Fuente: research v11 Seccion 13.1, World Bank RPW (rango
-- medido -5.08% a -4.58%). NO cross-validada independientemente contra el
-- problema de doble-monto promocional de Monito (ese chequeo especifico de
-- v12 solo cubrio Mukuru ZA-ZW, no ZA-MZ) -- se deja verified_status en
-- sin_confirmar, mejor-fuente-disponible pero no auditada por completo.
update public.fx_rates set
  public_spread_percent = -4.85,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 13.1 (World Bank RPW, corredor Sudafrica->Mozambique) mide margen FX -5.08% a -4.58% (Mukuru domina el corredor con margen favorable) -- se carga el punto medio, -4.85%. Vuelco completo frente al 2.8% previo (mismo proveedor, corredor vecino ZA-ZW paso de "el mas caro" a "domina con margen negativo"). ADVERTENCIA: a diferencia de ZA-ZW, este corredor NO fue re-auditado en v12 contra el problema de doble-monto promocional de Monito -- queda como mejor fuente disponible (RPW directo), no como dato completamente auditado. verified_status se mantiene en sin_confirmar a proposito.',
  data_collected_at = '2026-09-02'
where id = '4c15edd9-6762-47ac-be85-45bc824ce546';

-- 14-17. Western Union, 4 corredores Hong Kong/Japon (research v12,
-- Secciones 4 y 8, todas mediciones limpias -- sin insignia promocional,
-- un solo monto -- via Monito.com).
update public.fx_rates set
  public_spread_percent = 1.55,
  data_source = data_source || ' -- corregido 2026-09-02: research v12 Seccion 4 (Monito.com, medicion limpia: sin insignia promocional, un solo monto) da costo total 1.55%. Reemplaza el spread=2.7% previo (carga generica anterior).',
  data_collected_at = '2026-09-02'
where id = '7b1105d2-534f-4edd-859a-8e9b90a1f51b'; -- WU Hong Kong->Filipinas

update public.fx_rates set
  public_spread_percent = 5.05,
  data_source = data_source || ' -- corregido 2026-09-02: research v12 Seccion 8.1/8.3 (Monito.com, medicion limpia: sin insignia promocional, un solo monto) da costo total 5.05%. Reemplaza el spread=3% previo (carga generica anterior).',
  data_collected_at = '2026-09-02'
where id = 'd0f58a7a-cc8b-468b-87c2-272bf0ed602b'; -- WU Japon->Filipinas

update public.fx_rates set
  public_spread_percent = 3.98,
  data_source = data_source || ' -- corregido 2026-09-02: research v12 Seccion 8.1/8.3 (Monito.com, medicion limpia: sin insignia promocional, un solo monto) da costo total 3.98%. Reemplaza el spread=3.3% previo (carga generica anterior).',
  data_collected_at = '2026-09-02'
where id = 'ff9524da-ef08-404e-ae8b-6c871057de6a'; -- WU Japon->Brasil

update public.fx_rates set
  public_spread_percent = 4.81,
  data_source = data_source || ' -- corregido 2026-09-02: research v12 Seccion 8.1/8.3 (Monito.com, medicion limpia: sin insignia promocional, un solo monto) da costo total 4.81%. Reemplaza el spread=3.2% previo (carga generica anterior).',
  data_collected_at = '2026-09-02'
where id = '1df8bed3-e59e-4007-a0c5-ec2e9535923e'; -- WU Japon->Vietnam

-- 18. Ria, Espana->Bolivia: spread -> 3.76%. Fuente: research v11 Seccion
-- 5.2, World Bank RPW (Ria es la opcion mas barata de un corredor caro en
-- general).
update public.fx_rates set
  public_spread_percent = 3.76,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 5.2 (World Bank RPW) da costo total 3.76% (tarjeta debito/credito) -- Ria es la opcion mas barata de un corredor caro en general (promedio ~15.8%). Reemplaza el spread=0% previo.',
  data_collected_at = '2026-09-02'
where id = 'ecf8a76a-25f1-4c31-85ab-fec165f2967d';

-- 20. Ria, Espana->Peru: spread -> 5.02%. Fuente: research v11 Seccion 7.2,
-- World Bank RPW.
update public.fx_rates set
  public_spread_percent = 5.02,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 7.2 (World Bank RPW) da costo total 5.02%. Reemplaza el spread=0.8% previo.',
  data_collected_at = '2026-09-02'
where id = '7819a5f9-60a2-4339-b5cb-ddf6c2bd6072';

-- 21. Western Union, Espana->Peru: spread -> 4.51%. Fuente: research v11
-- Seccion 7.2, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 4.51,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 7.2 (World Bank RPW) da costo total 4.51%. Reemplaza el spread=1.8% previo.',
  data_collected_at = '2026-09-02'
where id = '70546c46-2b0e-4c6e-8431-ddafd0f59624';

-- 22. Remitly, Espana->Rep. Dominicana: spread -> 5.91%. Fuente: research
-- v11 Seccion 7.2, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 5.91,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 7.2 (World Bank RPW) da costo total 5.91%. Reemplaza el spread=1.6% previo.',
  data_collected_at = '2026-09-02'
where id = 'e2212bca-28b4-40b8-b6d3-03f87d63f1e2';

-- 23. Ria, Espana->Rep. Dominicana: spread -> 4.64%. Fuente: research v11
-- Seccion 7.2, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 4.64,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 7.2 (World Bank RPW) da costo total 4.64%. Reemplaza el spread=0% previo.',
  data_collected_at = '2026-09-02'
where id = '3140befc-f1d0-40da-9f03-bb115ec89f97';

-- 24. Western Union, Espana->Rep. Dominicana: spread -> 4.64%. Fuente:
-- research v11 Seccion 7.2, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 4.64,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 7.2 (World Bank RPW) da costo total 4.64%. Reemplaza el spread=1.8% previo.',
  data_collected_at = '2026-09-02'
where id = '6041c2b6-f643-46a7-900d-3284b2e0371e';

-- 25. Remitly, Espana->Ecuador: spread -> 4.12%. Fuente: research v11
-- Seccion 9.1, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 4.12,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 9.1 (World Bank RPW) da costo total 4.12% (margen FX 2.70%). Reemplaza el spread=1.6% previo.',
  data_collected_at = '2026-09-02'
where id = 'ff0b0176-8857-4ac6-a5ab-7a28de0d11cd';

-- 26. Ria, Espana->Ecuador: spread -> 3.31%. Fuente: research v11 Seccion
-- 9.1, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 3.31,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 9.1 (World Bank RPW) da costo total 3.31% (margen FX 1.17%). Reemplaza el spread=0% previo.',
  data_collected_at = '2026-09-02'
where id = 'b2345959-9dd8-40d6-bae2-6b3ab032c72f';

-- 27. Western Union, Espana->Ecuador: spread -> 4.51%. Fuente: research v11
-- Seccion 9.1, World Bank RPW.
update public.fx_rates set
  public_spread_percent = 4.51,
  data_source = data_source || ' -- corregido 2026-09-02: research v11 Seccion 9.1 (World Bank RPW) da costo total 4.51% (margen FX 0.95%). Reemplaza el spread=1.8% previo.',
  data_collected_at = '2026-09-02'
where id = 'bd967cd3-1250-4e16-8345-dde285e27509';

-- =====================================================================
-- PART 2 -- Wise systematic fix (user-confirmed): normalize ALL
-- RPW-sourced non-zero Wise rows to public_spread_percent = 0.
-- =====================================================================
--
-- Live query before this fix showed the split described in the task was
-- an undercount: not ~15 non-zero RPW rows but 91 (0.35%-1.20%, spanning
-- far more corridors than the illustrative UK-India/Gulf/HK/SG/KR/TW/
-- BN/IL list given -- South Africa outbound corridors (ZA->BW/LS/MZ/NA/
-- SZ/ZW at 1.0%-1.2%) included). The user's confirmed instruction was to
-- normalize ALL Wise rows to 0, not just the illustrative subset, so all
-- 91 RPW-sourced non-zero rows are corrected here. Wise rows sourced from
-- "Direct research" (third-party FX comparison sites, not RPW) are left
-- untouched -- those are separate live/estimated measurements, out of
-- scope for this specific fix.
update public.fx_rates set
  public_spread_percent = 0,
  data_source = data_source || ' -- spread corrected to 0% 2026-09-02: Wise''s documented pattern (verified arithmetically in v13 Seccion 1.1/1.3 for China->Philippines) is mid-market rate with all cost in the explicit fee, no hidden margin; this RPW-sourced row previously carried a spread that doesn''t match that pattern.',
  data_collected_at = '2026-09-02'
where provider_slug = 'wise'
  and public_spread_percent > 0
  and data_source ilike '%RPW%';

-- =====================================================================
-- PART 2 (cont.) -- Skrill provider-level fix + 2 new corridor rows.
-- =====================================================================

-- providers.skrill: 4.5% -> 0.55% (midpoint of the 2 confirmed
-- transfers.skrill.com corridors: DE->IN 0.69%, GB->IN 0.49%). The old
-- 4.5%/4.99% figure matches Skrill's wallet/card-deposit product
-- (skrill.com), not the transfers.skrill.com remittance product -- likely
-- mixed up at load time. Confirmed by 6+ independent sources across
-- research v8/v9/v11/v12 that consistently fail to distinguish the two
-- products except when navigating directly to transfers.skrill.com /
-- World Bank RPW.
update public.providers set
  spread_percent = 0.55,
  notes = coalesce(notes || ' ', '') || 'Corregido 2-sep-2026: spread_percent bajado de 4.5% a 0.55% (punto medio de las 2 mediciones reales confirmadas del producto de remesas real, transfers.skrill.com -- Alemania->India 0.69% y Reino Unido->India 0.49%, ambas World Bank RPW). El 4.5%/4.99% anterior corresponde al producto de billetera general de Skrill (pagos online, recargas de tarjeta), no al producto de transferencias de dinero -- confundidos al cargar. Ver research v9 Seccion 3.2 y v11 Seccion 2.2 (docs/data-sources/2026-09-02-research-corredores-addendum-v9.md, -v11.md) y las filas corridor-specific en fx_rates (GB->IN, DE->IN).'
where slug = 'skrill';

-- fx_rates Skrill GB->IN ya existe (cargada por research v11, migracion
-- 20260902140000_load_v11_corridor_rates.sql) con spread=0.49%, fee=0,
-- confirmado_activo -- valor verificado, coincide exacto con lo pedido.
-- No requiere ningun cambio.

-- fx_rates Skrill DE->IN: no existia ninguna fila previa para este
-- corredor exacto en toda la base (ni de ningun proveedor) -- se reusa la
-- tasa EUR/INR ya verificada de Sendwave FR->IN (110.925, misma moneda
-- EUR/INR, cargada 25-ago-2026) como tasa canonica del par de moneda, en
-- vez de inventar una, siguiendo el mismo criterio ya usado para Skrill
-- GB->IN (que reuso la tasa canonica GB-IN existente). Fee=0 y
-- spread=0.69% (margen), fuente research v9 Seccion 3.2: "Sin fee por
-- transferencia bancaria... World Bank mide 0.69% de margen, 1.35% de
-- costo total para Alemania->India" -- no hay una fuente que de un monto
-- de fee en moneda real, asi que se carga fee=0 (consistente con "sin fee
-- por transferencia bancaria" y con el patron ya establecido de la fila
-- GB->IN, donde costo total=margen porque fee=0).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values (
  'EUR', 'INR', 110.925, 0, 'skrill', 'DE', 'IN', false, 0.69,
  'World Bank Remittance Prices Worldwide (RPW), corredor Alemania->India, producto transfers.skrill.com (Skrill Money Transfer, no la billetera general). Margen FX 0.69%, costo total 1.35% segun World Bank -- "sin fee por transferencia bancaria" segun el propio sitio de Skrill, por lo que se carga fee=0 (no hay una fuente que de un monto de fee en moneda real; cargar un numero distinto de 0 fabricaria un dato). Tasa EUR/INR reusada de la fila ya verificada Sendwave FR->IN (110.925, 25-ago-2026) por ser el mismo par de moneda EUR/INR, en vez de inventar una tasa absoluta -- mismo criterio ya usado para la fila hermana Skrill GB->IN (reuso de tasa canonica GB-IN). Primer dato real de Skrill del proyecto (documentado desde research v8/v9, Seccion 3.2 de v9), segunda fila corridor-specific real del producto correcto tras GB->IN. Investigado 2-sep-2026 (research v9 Seccion 3.2).',
  '2026-09-02', 'confirmado_activo'
);

-- =====================================================================
-- PART 4 -- Group B duplicate-row cleanup (re-verified against live data;
-- see docs/data-sources/2026-09-02-ag6-discrepancy-resolution.md for full
-- reasoning, including 3 corridors where the "default rule" from the
-- original list was NOT applied because min_amount/max_amount showed the
-- rows are legitimate amount-tiered pricing, not true duplicates).
-- =====================================================================

-- TapTap Send GB->NG: delete older row (2026-08-23, generic aggregator
-- source, min/max null). Keep newer (2026-08-25, live taptapsend.com
-- calculator, min_amount=0.01/max null -- effectively full range, so no
-- coverage gap from deleting the older one).
delete from public.fx_rates where id = '0dcd02da-0616-48b8-8bf6-f7dcebd026af';

-- Sendwave GB->NG: delete older row (2026-08-23, World Bank RPW, min/max
-- null). Keep newer (2026-08-25, live sendwave.com calculator, min_amount
-- =0.01/max null -- full range, no coverage gap).
delete from public.fx_rates where id = '98e9764d-b8ce-43e6-9709-b65c3a3f8519';

-- Remitly GB->IN: delete older row (2026-08-23, World Bank RPW, min/max
-- null). Keep newer (2026-08-25, live remitly.com "everyday" rate,
-- min_amount=0.01/max null -- full range, no coverage gap).
delete from public.fx_rates where id = '34b82a07-c807-45c0-abd0-80a708507c65';

-- NOT deleted, deviating from the original Group B default rule -- see
-- doc for full reasoning:
--
-- MoneyGram GB->IN: the two rows are NOT a plain duplicate. Older row
-- (9a726e01, World Bank RPW, min/max null) covers ALL amounts. Newer row
-- (edadfc6e, live moneygram.com quote, min_amount=5000/max null) covers
-- ONLY amounts >=5000 GBP. Deleting the older row would remove all
-- MoneyGram GB->IN coverage for amounts under 5000 GBP -- a real data-loss
-- regression, not a cleanup. Left both rows in place; the Part 3 ORDER BY
-- fix already makes the overlap (amounts >=5000, where both rows match)
-- deterministic -- the newer/more specific row wins.
--
-- Western Union GB->IN: same pattern as MoneyGram. Older row (65d7f19d,
-- RPW, min/max null, full range) vs. newer row (a4497787, live quote,
-- min_amount=1000/max null). Deleting the older row would remove coverage
-- under 1000 GBP. Left both; Part 3's ORDER BY fix resolves the overlap.
--
-- Xoom GB->IN (3 rows): NOT duplicates at all -- cleanly non-overlapping
-- amount tiers (a003ee86: 0.01-999.99, fee 1.99, spread 1.24%; 3af2bb5a:
-- 1000-4999.99, fee 0, spread 1.04%; e1430970: 5000+, fee 0, spread
-- 0.96%), all from the same live xoom.com session (identical updated_at
-- and data_source text -- 3 amounts quoted in one sitting, not repeat
-- measurements of the same amount). No overlap means no non-determinism
-- even before the Part 3 fix. Left all 3 rows untouched.
--
-- Money2India US->IN (2 rows): NOT duplicates -- amount-tiered (1de288e7:
-- 0.01-999.99, fee 4; d622096c: 1000+, fee 0), matching providers.
-- fee_tiers for money2india exactly ([{"max":999.99,"fee_fixed":4,...},
-- {"min":1000,"fee_fixed":0,...}]). The original Group B note ("differ
-- only in fee, one is a duplicate load error") did not check min_amount/
-- max_amount -- both rows are legitimate and correctly scoped. Left both
-- untouched.
--
-- LemFi GB->NG (2 rows): per explicit instruction, NOT deleted -- flagged
-- for the next research round instead (both rows fully overlap in amount
-- range: min/max null vs. min_amount=0.01/max null, so this pair DOES
-- still have the non-determinism problem, resolved for now by the Part 3
-- ORDER BY fix, but the underlying data conflict needs a live re-check).
-- Row 94363bfe (aggregator reviews, no login) explicitly self-flags
-- "RE-VERIFICAR (27-ago-2026): fuente generica sin distincion regular/
-- promo ... cerrar con navegador real antes de restaurar a
-- confirmado_activo". Row 5ecf0c9b (lemfi.com marketing calculator, no
-- login) is the other side of the discrepancy. Neither deleted.
