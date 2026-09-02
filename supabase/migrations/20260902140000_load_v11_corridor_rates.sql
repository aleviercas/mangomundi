-- Research v11 (2026-09-02, ADDENDUM #5): 11 new fx_rates rows across
-- corridors and providers that (a) already exist in `providers`, (b) had
-- ZERO prior fx_rates rows for that exact provider+corridor pair (so no
-- dedup/ORDER BY ambiguity is created -- see the src/lib/fx.functions.ts
-- compareProviders bug documented in the v10 addendum), and (c) come from
-- a real live measurement or World Bank RPW figure that is NOT promotional.
--
-- Sendwave USD->NGN: live-verified regular rate (sendwave.com/en-us/
-- countries/nigeria), fee 0. Margin computed against Wise's own converter
-- (1,374.62 NGN/USD), not XE (1,332.03) -- XE is confirmed stale
-- specifically for NGN (research v10 + v11 Section 1, third independent
-- confirmation this round after LemFi/Taptap Send in v10). Loaded
-- confirmado_activo. NOTE: Sendwave USD->KES (research v11 Section 5.1)
-- was deliberately NOT loaded -- an existing confirmado_activo row already
-- covers sendwave/US/KE (spread 1.5%, close to the new 1.07% regular
-- margin) and rule of the house session is to never insert over/alongside
-- a conflicting confirmado_activo row without reconciling first. See the
-- v11 addendum doc "Nota de estado" for the full writeup, including the
-- promotional KES rate (0.57%) that must never be loaded as the standard
-- row.
--
-- Skrill GBP->INR: World Bank RPW (Reino Unido->India, research v11
-- Section 2.2), fee 0%, margin 0.49%. Second real Skrill data point after
-- the already-loaded-elsewhere DE->IN (0.69%), both well below the flat
-- providers.skrill default of 4.5% (not touched here). RPW gives no
-- absolute GBP/INR rate, so the rate column reuses this project's own
-- already-established canonical GBP/INR live rate (130.21, loaded
-- 25-ago-2026 across several other GB-IN rows) rather than inventing one.
--
-- Global66: 4 new corridors, all from live measurements on global66.com's
-- per-corridor pages (research v11 Sections 19.1, 21.2, 23.1). Chile->
-- España and Chile->EEUU (both confirmado_activo) confirm the low/negative
-- margin pattern. Peru->España (confirmado_activo) matches the same
-- pattern, resolving 2-of-3 origins tested as "low margin, no visible fee".
-- Colombia->España is the confirmed outlier: an explicit 3% flat
-- commission (independently corroborated by a separate Wise blog citing
-- ~4% for Colombia) combined with a favorable FX rate. Since this schema's
-- `fee` column is a flat currency amount (not a %) and a 3%-of-amount
-- commission cannot be represented as a fixed flat fee without picking an
-- arbitrary reference transaction size, the Colombia row instead loads
-- fee=0 and folds the full effective cost (commission + FX margin) into
-- public_spread_percent (1.80%, the "costo total efectivo" the research
-- itself computes) -- see the comment on that row for the exact math.
--
-- Xoom USD->MXN: World Bank RPW (EEUU->México, cuenta bancaria/internet,
-- research v11 Section 19.2), margin -0.24% (favorable to the customer).
-- Independently cross-validated via Monito.com in Section 25.1 (-1.16%,
-- same direction). Explicitly confirmed CLEAN of the promotional
-- "double recipient amount" methodological problem found elsewhere in
-- Monito data (Section 31.3: Xoom's card has no promo badge and shows a
-- single amount) -- this is the one Monito-adjacent negative-margin
-- finding in the whole v11 document the research stands behind without
-- caveat. Loaded confirmado_activo.
--
-- InstaReM: 4 new corridors.
--   - Singapur->Indonesia (World Bank RPW, research v11 Section 11.3):
--     margin -0.06%, no promotional-contamination risk (RPW, not Monito).
--     Loaded confirmado_activo. Rate reuses this project's own established
--     canonical SGD/IDR rate (13,937.475576, already used by remitly and
--     western-union rows for this same pair) since RPW gives no absolute
--     rate.
--   - Canadá->Filipinas, Canadá->India, Australia->Filipinas: sourced via
--     Monito.com (research v11 Sections 27.1, 29.1, 29.2), and explicitly
--     re-examined in Section 31 for the "two recipient amounts" promo
--     problem found elsewhere in Monito data that round. Section 31.3
--     concludes InstaReM "survives" the correction (small gap between the
--     two amounts in every corridor) but gives CORRECTED figures slightly
--     higher than the originally-cited ones (1.09%/0.46%/1.07% instead of
--     0.34%/0.17%/-0.08%) -- this migration loads the CORRECTED figures
--     only, and as sin_confirmar (not confirmado_activo) because they are
--     Monito-derived approximations ("~") rather than a direct live
--     measurement or clean RPW figure. Absolute rates (CAD/PHP 45.0433,
--     CAD/INR 68.1017, AUD/PHP 44.8103) are given directly in the research
--     as the Monito/XE mid-market reference for each corridor.
--
-- Everything else researched in v11 (Mukuru's dramatic ZA-ZW/ZA-MZ swing,
-- Arabia Saudita/Reino Unido->India tables, Qatar->Nepal, Kuwait->
-- Filipinas/India, España/Italia->Latam banks and money-changers,
-- TransferGo's Monito-sourced GB-IN/PL-UA figures, Walmart2World, Lulu
-- Money, Panda Remit, payroll platforms, tax findings for Argentina/India/
-- Brasil) is intentionally NOT loaded here -- see the "Nota de estado" in
-- docs/data-sources/2026-09-02-research-corredores-addendum-v11.md for the
-- row-by-row reasoning (candidate provider not in `providers`, existing
-- confirmado_activo conflict, existing 2+ row dedup risk, no absolute rate
-- available without fabricating one, or unresolved promotional-
-- contamination doubt per the research document's own Section 32 pendiente
-- list).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('USD', 'NGN', 1373.023, 0, 'sendwave', 'US', 'NG', false, 0.12,
   'sendwave.com/en-us/countries/nigeria, cotizador de la pagina de pais especifica (no el widget de portada, no interactivo). 1 USD = 1.373,023 NGN, fee USD 0. Margen calculado contra el conversor de Wise (1 USD = 1.374,62 NGN el 2-sep-2026, 10:20 UTC) en vez de XE (1.332,0332, ~3,2% mas bajo) -- XE esta confirmado desactualizado especificamente para NGN (research v10 Seccion 1 + v11 Seccion 1.2, tercera fuente independiente que coincide con Wise tras LemFi y Taptap Send en v10). Investigado 2-sep-2026 (research v11 Seccion 1.1).',
   '2026-09-02', 'confirmado_activo'),

  ('GBP', 'INR', 130.21, 0, 'skrill', 'GB', 'IN', false, 0.49,
   'World Bank Remittance Prices Worldwide (RPW), corredor Reino Unido->India, envio de 120 GBP / 200 USD. Costo total 0.49% = margen FX 0.49% (fee 0%). Segundo dato real de World Bank para el producto Skrill Money Transfer, junto al ya cargado de Alemania->India (0.69%) -- ambos corredores por debajo de 1%, refuerzan el rango 0.49%-0.69% (distinto del flat providers.skrill=4.5%, no modificado). RPW no publica una tasa absoluta GBP/INR: se reusa la tasa canonica ya establecida en este proyecto para el corredor GB-IN (130.21, cargada 25-ago-2026 en varias otras filas) en vez de inventar una. Investigado 2-sep-2026 (research v11 Seccion 2.2).',
   '2026-09-02', 'confirmado_activo'),

  ('CLP', 'EUR', 0.000922, 0, 'global66', 'CL', 'ES', false, 0.05,
   'global66.com, pagina de corredor especifico Chile->Espana (la calculadora de portada esta rota, mismo bug ya visto en TransferGo/Panda Remit). Global66: 1 EUR = 1.084,10 CLP. Mid-market XE: 1 EUR = 1.083,54 CLP. Margen ~0,05%, sin fee visible ("sin comisiones ocultas"). Investigado 2-sep-2026 (research v11 Seccion 19.1).',
   '2026-09-02', 'confirmado_activo'),

  ('CLP', 'USD', 0.001070, 0, 'global66', 'CL', 'US', false, -0.14,
   'global66.com, pagina de corredor especifico Chile->EEUU. Global66: 1 USD = 934,72 CLP. Mid-market XE: 1 USD = 936,03 CLP. Margen ~-0,14% (mejor que mercado), sin fee visible. Investigado 2-sep-2026 (research v11 Seccion 19.1).',
   '2026-09-02', 'confirmado_activo'),

  ('COP', 'EUR', 0.000276, 0, 'global66', 'CO', 'ES', false, 1.80,
   'global66.com, pagina de corredor especifico Colombia->Espana. Envio de prueba 1.300.000 COP: comision explicita 39.000 COP (3,00% plano) + tipo de cambio aplicado 1 EUR = 3.625,65 COP (mid-market XE 3.668,48, margen -1,17% favorable). Costo total efectivo ~1,80%. A diferencia de Chile/Peru (sin comision visible), Colombia tiene una comision plana confirmada real por una segunda fuente independiente (blog de Wise, ~4% para Colombia) -- no es artefacto de medicion. El esquema de esta tabla no tiene un campo de comision proporcional (solo fee=monto fijo en moneda de origen), asi que en vez de forzar un monto fijo no representativo se carga fee=0 y se usa public_spread_percent=1,80% como el costo total efectivo (comision 3% + margen FX -1,17%) tal como lo calcula el propio research. NO extrapolar este margen a otros origenes de Global66 (Chile/Peru dan ~0,05%/-0,14%/-0,30%, sin comision) -- Colombia es la excepcion confirmada, no la regla. Investigado 2-sep-2026 (research v11 Secciones 21.2 y 25.2).',
   '2026-09-02', 'confirmado_activo'),

  ('PEN', 'EUR', 0.256410, 0, 'global66', 'PE', 'ES', false, -0.30,
   'global66.com, pagina de corredor especifico Peru->Espana. Campo unico "monto a enviar" sin fee separado (958,00 PEN). Tipo de cambio aplicado 1 EUR = 3,90 PEN vs mid-market XE 1 EUR = 3,9117 PEN. Margen ~-0,30% (favorable). Confirma el mismo patron de Chile (2 de 3 origenes con margen bajo/negativo sin fee visible; Colombia sigue siendo el outlier con comision explicita, ver fila anterior). Investigado 2-sep-2026 (research v11 Seccion 23.1).',
   '2026-09-02', 'confirmado_activo'),

  ('USD', 'MXN', 17.0211, 0, 'xoom', 'US', 'MX', false, -0.24,
   'World Bank RPW, corredor EEUU->Mexico (cuenta bancaria, internet), envio de 200 USD, Q3 2025. Costo total = margen FX = -0,24% (mejor que mid-market) -- primer corredor del proyecto con costo total negativo para Xoom. Cross-validado independientemente via Monito.com (research v11 Seccion 25.1: -1,16%, misma direccion). Confirmado explicitamente LIMPIO del problema metodologico de "doble monto promocional" encontrado en otras tarjetas de Monito ese mismo dia (Seccion 31.3: la tarjeta de Xoom en este corredor no tiene insignia promocional y muestra un solo monto). Tasa USD/MXN reusada del valor canonico ya establecido en este proyecto (17.0211, usado por moneygram/remitly/ria/wise en el mismo corredor) ya que RPW no publica una tasa absoluta. Investigado 2-sep-2026 (research v11 Secciones 19.2, 25.1, 31.3).',
   '2026-09-02', 'confirmado_activo'),

  ('SGD', 'IDR', 13937.475576, 0, 'instarem', 'SG', 'ID', false, -0.06,
   'World Bank RPW, corredor Singapur->Indonesia, envio de 260 SGD, Q3 2025. Costo total 0,56%, margen FX -0,06% (mejor que mid-market). Fuente RPW (no Monito), sin riesgo de contaminacion promocional. Coherente con el dato ya conocido de UK->India (~0,31% cargado en research v9) -- InstaReM se perfila como proveedor de margen bajo y consistente. Tasa SGD/IDR reusada del valor canonico ya establecido en este proyecto para el mismo par (13.937,475576, usado por remitly/western-union en el mismo corredor). Investigado 2-sep-2026 (research v11 Seccion 11.3).',
   '2026-09-02', 'confirmado_activo'),

  ('CAD', 'PHP', 45.0433, 0, 'instarem', 'CA', 'PH', false, 1.09,
   'Monito.com, corredor Canada->Filipinas (transferencia de 100 CAD), mid-market XE 1 CAD = 45,0433 PHP (research v11 Seccion 27.1). Margen ORIGINALMENTE citado 0,34% -- CORREGIDO en la Seccion 31 tras descubrirse que varias tarjetas de Monito muestran dos montos de "el destinatario recibe" (uno alto/promocional de primera transferencia, uno bajo/real). Usando el monto bajo (real), el margen corregido de InstaReM en este corredor es ~1,09% (Seccion 31.2/31.3). Se carga la cifra CORREGIDA, no la original. sin_confirmar porque sigue siendo una cifra aproximada ("~") derivada de un agregador de terceros, no una medicion directa en el sitio del proveedor ni un dato RPW limpio. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('CAD', 'INR', 68.1017, 0, 'instarem', 'CA', 'IN', false, 0.46,
   'Monito.com, corredor Canada->India (transferencia de 100 CAD), mid-market XE 1 CAD = 68,1017 INR (research v11 Seccion 29.1). Margen ORIGINALMENTE citado 0,17% -- CORREGIDO en la Seccion 31 (mismo problema de doble monto que en Canada->Filipinas): usando el monto bajo/real, el margen corregido es ~0,46% (Seccion 31.2/31.3). Se carga la cifra CORREGIDA. sin_confirmar por la misma razon que la fila de Canada->Filipinas (aproximacion de agregador de terceros, no medicion directa). Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('AUD', 'PHP', 44.8103, 0, 'instarem', 'AU', 'PH', false, 1.07,
   'Monito.com, corredor Australia->Filipinas (transferencia de 100 AUD), mid-market XE 1 AUD = 44,8103 PHP (research v11 Seccion 29.2). Margen ORIGINALMENTE citado -0,08% (favorable) -- CORREGIDO en la Seccion 31: usando el monto bajo/real, el margen corregido es ~1,07% (Seccion 31.2/31.3), revirtiendo el signo. Se carga la cifra CORREGIDA. sin_confirmar por la misma razon que las otras dos filas de InstaReM via Monito. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar');
