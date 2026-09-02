-- Research v12 (2026-09-02, ADDENDUM #6): 9 new fx_rates rows across
-- Nueva Zelanda->Filipinas (4), Hong Kong->Filipinas (2) and
-- Japon->Filipinas/Brasil/Vietnam (3, InstaReM only). All 9 are in
-- provider+corridor pairs that had ZERO prior fx_rates rows (same
-- deliberately conservative rule v11 applied for its own 11 rows -- see
-- 20260902140000_load_v11_corridor_rates.sql).
--
-- IMPORTANT METHODOLOGICAL NOTE ON SIGN: the source document's own tables
-- in Section 2 (Nueva Zelanda) and Section 4 (Hong Kong) show these
-- margins with a MINUS sign (e.g. "MoneyGram ... -3.04%"), but the
-- document's own prose contradicts that sign explicitly -- Section 2's
-- own summary says "todos los proveedores muestran un costo real
-- POSITIVO (0,9%-3,0%)", and Section 4's prose describes the MoneyGram/
-- Western Union numbers as "en linea con lo esperable para una remesa
-- normal" (normal cost language, not "better than mid-market"). Recomputing
-- directly from the raw amounts the document itself gives (recipient-gets
-- vs. the mid-market total the document also gives) confirms the prose,
-- not the table's sign: every one of these rows is a real cost (positive
-- public_spread_percent), matching this project's established convention
-- (negative = favorable/better than mid-market, used correctly and
-- consistently in this same document's Section 8, Japon). This looks like
-- a (real - mid-market)/mid-market vs. (mid-market - real)/mid-market sign
-- flip specific to how Sections 2 and 4 were drafted. This migration loads
-- the POSITIVE (cost) sign, recomputed independently from the raw amounts,
-- not transcribed from the table. Flagged prominently in the v12 addendum
-- doc's "Nota de estado" for the user to double check against the original
-- source if there is any doubt.
--
-- Nueva Zelanda->Filipinas (research v12 Section 2): brand-new corridor
-- for the project (NZ only had FJ/ID/TO/VU/WS rows before). Via Monito,
-- with the corrected methodology (v11 Section 31.4: use the LOW/real
-- "recipient gets" amount, not the promotional one Monito's own badge is
-- based on) applied throughout. Mid-market used: 1 NZD = 36.4783 PHP (500
-- NZD -> 18,239.15 PHP at mid-market). Loaded sin_confirmar for all 4
-- (Monito-derived approximation, not a direct measurement or clean RPW
-- figure -- same rule applied to every Monito-sourced insert in v11).
-- MoneyGram/Western Union/Remitly all carry an unresolved "first transfer"
-- promotional badge (the low amount used here is the real/recurring one,
-- per the corrected methodology); XE Money Transfer shows a single clean
-- amount with an explicit 7 NZD fee, no promotional badge.
--
-- Hong Kong->Filipinas (research v12 Section 4): brand-new corridor.
-- InstaReM had ZERO prior rows for this corridor (MoneyGram too);
-- Western Union, Remitly and Wise already carry existing confirmado_activo
-- rows for HK->PH from an earlier generic bulk load, so this migration
-- does NOT touch Western Union for this corridor -- see the addendum
-- doc's "Nota de estado" for the flagged discrepancy (existing 2.7% vs.
-- this round's 1.55%). InstaReM here shows a NEW variant of the
-- promotional pattern found for the first time in this project: the
-- promo is "zero commission on your first transfer" (fee-based), not a
-- different FX rate -- the exchange rate is identical in both the promo
-- and real amounts, only the small recurring commission differs. The
-- real/post-promo amount is used, consistent with the corrected
-- methodology. Both rows loaded sin_confirmar.
--
-- Japon->Filipinas / Japon->Brasil / Japon->Vietnam, InstaReM only
-- (research v12 Section 8): Japon opens as a new origin country with rich
-- Monito coverage (5-7 providers per corridor). InstaReM had ZERO prior
-- rows in all three corridors and is the only provider loaded here --
-- Western Union is clean in all three (no promotional badge) but its new
-- figures (5.05%/3.98%/4.81%) conflict with EXISTING confirmado_activo
-- Western Union rows for these same three corridors from an earlier
-- generic bulk load (3%/3.3%/3.2%) -- per house rule, documented as a
-- discrepancy in the addendum doc's "Nota de estado", not overwritten,
-- not loaded as a second row. InstaReM->Brasil is notable as a clean
-- (no promotional badge, single amount) NEGATIVE/favorable margin
-- (-0.43%), the third such clean negative-margin case found in the
-- project (after Xoom USD->MXN and Remitly AU->PH, both v11 Section
-- 31.3/31.2) and the first for InstaReM specifically, despite InstaReM's
-- established pattern of low-but-positive margin in its other 8 corridors.
-- All three loaded sin_confirmar (Monito-derived approximation).
--
-- NOT loaded from v12 (see "Nota de estado" in
-- docs/data-sources/2026-09-02-research-corredores-addendum-v12.md for
-- full reasoning): Corea del Sur->Filipinas (OFX, Section 6.2) -- the
-- research explicitly flags Monito's coverage for Corea del Sur as too
-- thin to trust confidently ("tratar este dato con cautela") and, unlike
-- the other rows in this migration, the number comes only from Monito's
-- own badge percentage, not from an independently verifiable raw
-- recipient-gets amount plus a stated mid-market total -- so it is held
-- back rather than loaded on weaker evidence than everything else this
-- round. CurrencyFair GB->IN (Section 6.1) -- confirms the fee-based
-- promotional-variant pattern but the underlying transfer amount (and
-- therefore its exact fee) is inferred, not explicitly stated in the
-- source, so it is documented only, not loaded. Mukuru ZA->ZW retroactive
-- audit (Section 1.1, confirms the existing v11-documented Monito
-- cross-validation is clean -- no fx_rates action, nothing changed).
-- TransferGo GB->IN / PL->UA retroactive audit (Section 1.2, confirms
-- single-amount cards but flags an UNRESOLVED promotional-badge risk --
-- still not loaded, same as v11's own decision, now with an explicit
-- caveat that the risk could not be ruled out either).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('NZD', 'PHP', 36.4783, 0, 'moneygram', 'NZ', 'PH', false, 3.04,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado (metodologia corregida de v11 Seccion 31.4, no el monto promocional de "tasa preferencial primera transferencia" que Monito usa para su badge): 17.684 PHP. Costo real recalculado directamente desde los montos crudos del documento: (18.239,15-17.684)/18.239,15 = 3,04%. NOTA: la tabla original del research v12 Seccion 2 mostraba esta cifra con signo negativo ("-3,04%"), pero la propia prosa de esa misma seccion dice explicitamente "costo real POSITIVO" -- se carga el signo positivo, recalculado de forma independiente a partir de los montos crudos, no transcripto de la tabla. Ver Nota de estado del documento para el detalle completo. Fee no desglosado por separado en la fuente (se pliega en el spread total, igual que el resto de esta corrida). Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'western-union', 'NZ', 'PH', false, 0.93,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado: 18.070 PHP. Costo real recalculado: (18.239,15-18.070)/18.239,15 = 0,93%. Mismo ajuste de signo que la fila de MoneyGram de este mismo corredor (ver ese comentario) -- la tabla original mostraba "-0,93%", corregido a positivo per la prosa de la Seccion 2. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'remitly', 'NZ', 'PH', false, 1.49,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado: 17.968 PHP. Costo real recalculado: (18.239,15-17.968)/18.239,15 = 1,49%. Mismo ajuste de signo que las filas de MoneyGram/Western Union de este corredor -- tabla original mostraba "-1,49%", corregido a positivo per la prosa de la Seccion 2. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'xe', 'NZ', 'PH', false, 0.91,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). XE Money Transfer: unico monto (sin insignia promocional), fee explicito 7 NZD, recibido 18.074 PHP. Costo real recalculado: (18.239,15-18.074)/18.239,15 = 0,91%. Mismo ajuste de signo que el resto de las filas de este corredor (tabla original "-0,91%", corregido a positivo per la prosa de la Seccion 2 que dice "costo real positivo" para las 4 filas de esta tabla). Fee conocido (7 NZD) mantenido en el comentario, pero no desglosado en la columna fee -- se pliega en el spread total para que las 4 filas de este corredor sean directamente comparables entre si, igual criterio usado para Global66 Colombia en v11. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('HKD', 'PHP', 7.9664, 0, 'instarem', 'HK', 'PH', false, 0.93,
   'Monito.com, corredor Hong Kong->Filipinas, transferencia de 1.000 HKD, mid-market 1 HKD = 7,9664 PHP (research v12 Seccion 4). InstaReM: variante NUEVA del patron promocional encontrada por primera vez en el proyecto -- la promocion es "cero comision en tu primera transferencia" (comision, no tipo de cambio distinto; el tipo de cambio 7,9452 es identico en ambos montos). Monto real/post-promo usado: 7.892 PHP (vs. 7.945 PHP promocional). Costo real: (7.966,4-7.892)/7.966,4 = 0,93%. Zero filas previas de InstaReM en este corredor. Sexto corredor de InstaReM en el proyecto con margen bajo, reconfirmando el patron. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('HKD', 'PHP', 7.9664, 0, 'moneygram', 'HK', 'PH', false, 2.28,
   'Monito.com, corredor Hong Kong->Filipinas, transferencia de 1.000 HKD, mid-market 1 HKD = 7,9664 PHP (research v12 Seccion 4). MoneyGram: sin insignia promocional visible en este corredor puntual, un solo monto (7.785 PHP) -- dato limpio. Costo real: (7.966,4-7.785)/7.966,4 = 2,28%. Zero filas previas de MoneyGram en este corredor. NOTA: Western Union tambien aparece en esta misma tabla de la Seccion 4 (7.843 PHP, ~1,55%) pero NO se carga aqui -- ya existe una fila confirmado_activo de western-union/HK/PH (2,7%) de una carga generica anterior, y la nueva cifra no coincide -- se documenta la discrepancia, no se sobrescribe (ver Nota de estado). Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'PHP', 0.3938, 0, 'instarem', 'JP', 'PH', false, 1.30,
   'Monito.com, corredor Japon->Filipinas, transferencia de 10.000 JPY, mid-market 1 JPY = 0,3938 PHP (research v12 Seccion 8.1). InstaReM: variante de comision promocional (mismo patron que Hong Kong, Seccion 4), gap chico entre monto promo (3.891 PHP) y real (3.887 PHP). Costo real usado: (3.938-3.887)/3.938 = 1,30% (cifra dada directamente por el research, verificada). Zero filas previas de InstaReM en este corredor. Western Union tambien medido en este corredor (5,05%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3%) de una carga generica anterior, documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'BRL', 0.032161, 0, 'instarem', 'JP', 'BR', false, -0.43,
   'Monito.com, corredor Japon->Brasil, transferencia de 50.000 JPY, mid-market 1 JPY = 0,032161 BRL (research v12 Seccion 8.1/8.2). InstaReM: SIN insignia promocional en este corredor puntual, un solo monto (1.615 BRL) -- dato limpio. Margen real: (1.615-50.000*0,032161)/(50.000*0,032161) = -0,43% (favorable, mejor que mid-market) -- tercer caso limpio de margen negativo documentado en el proyecto (junto a Xoom USD->MXN y Remitly AU->PH, ambos v11 Seccion 31), y el primero para InstaReM especificamente pese a su patron establecido de margen bajo-pero-positivo en sus otros 8 corredores. Zero filas previas de InstaReM en este corredor. Western Union tambien medido (3,98%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3,3%), documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'VND', 164.2717, 0, 'instarem', 'JP', 'VN', false, 0.82,
   'Monito.com, corredor Japon->Vietnam, transferencia de 11.000 JPY, mid-market 1 JPY = 164,2717 VND (research v12 Seccion 8.1/8.2). InstaReM: variante de comision promocional (mismo patron que Hong Kong y Japon->Filipinas), gap chico entre monto promo (1.794.003 VND) y real (1.792.205 VND). Costo real: (11.000*164,2717-1.792.205)/(11.000*164,2717) = 0,82% (cifra dada directamente por el research, verificada). Zero filas previas de InstaReM en este corredor. Western Union tambien medido (4,81%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3,2%), documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar');
