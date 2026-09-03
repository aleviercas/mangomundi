-- Research v15 (2026-09-02, ADDENDUM #9): Brasil->Colombia (5th Brazil
-- corridor, confirms MoneyGram promo pattern holds outside MERCOSUR),
-- Mukuru's first precisely-measured corridors (Botswana new, Malawi
-- updated -- 2 others explicitly NOT touched, see PART 2 notes), Xoom
-- (US->Thailand) and Lulu Money (new provider, Kuwait->Egypt) -- closing
-- out the five "amplio" providers catalogued since v11 -- and Argentina's
-- first OUTBOUND corridors (Global66 + Western Union, ->Spain/->Italy).
--
-- Source: docs/data-sources/2026-09-02-research-corredores-addendum-v15.md
--
-- ===========================================================================
-- PART 1: Brasil->Colombia (research v15 Section 1), 5th corridor of
-- Brazil, first outside MERCOSUR/immediate neighbours. Send 1.500 BRL,
-- mid-market 1 BRL = 615,9086 COP. Zero prior rows for this exact
-- corridor (verified against fx_rates before writing this migration).
-- Same MoneyGram promotional-badge pattern already handled for Paraguay/
-- Peru/Argentina (v14 Section 3, v11 Section 31 methodology) -- loads the
-- CORRECTED real figure (3,85%), never the promotional one (908,2151
-- rate / 912.323 COP recipient-gets, NOT loaded). Western Union clean
-- (single amount, no badge), and once again cheaper than MoneyGram
-- corrected -- 4th of 4 comparable Brazil corridors where this holds
-- (Paraguay, Peru, Argentina, Colombia; Bolivia has no WU figure to
-- compare against).
-- ===========================================================================

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('BRL', 'COP', 592.1773, 0, 'moneygram', 'BR', 'CO', false, 3.85,
   'Monito.com (tarjeta de MoneyGram), corredor Brasil->Colombia, envio de 1.500 BRL, cuenta bancaria. CIFRA CORREGIDA (metodologia v11 Seccion 31): insignia promocional presente ("cero comision y/o tasa de cambio preferencial en tu primera transferencia"), dos montos -- promocional (tasa 608,2151, 912.323 COP) y real (888.266 COP, identificado por URL go.monito.com/moneygram). Se carga SOLO el real: tipo de cambio aplicado implicito = 888.266/1.500 = 592,1773 COP/BRL (no dado directamente por la fuente para la variante real, derivado del monto/envio, misma tecnica ya usada en el proyecto -- v11 Seccion 31, v14 Seccion 3.2/3.3/3.4). Fee "Free" (0). Mid-market 615,9086 COP/BRL -- margen FX = (615,9086-592,1773)/615,9086 = 3,85% (coincide con el costo total real dado por la fuente, ya que fee=0). Corregido, MoneyGram (3,85%) resulta mas caro que Western Union limpio (2,61%, fila separada) -- 4to de 4 corredores de Brasil con comparacion directa donde Western Union corregido le gana a MoneyGram (Paraguay, Peru, Argentina, Colombia -- v14 Seccion 3, v15 Seccion 1.1); Bolivia es el unico limpio sin punto de comparacion. Investigado 2-sep-2026 (research v15 Seccion 1).',
   '2026-09-02', 'sin_confirmar'),

  ('BRL', 'COP', 605.9146, 15, 'western-union', 'BR', 'CO', false, 1.62,
   'Monito.com (tarjeta de Western Union), corredor Brasil->Colombia, envio de 1.500 BRL, cuenta bancaria. Dato limpio, sin insignia promocional, un solo monto (identificado por el texto distintivo "Over 10 million online customers" y confirmado por URL go.monito.com/western-union). Fee 15 BRL, tipo de cambio aplicado 605,9146 COP/BRL (dado explicitamente por la fuente). Mid-market 615,9086 COP/BRL -- margen FX = (615,9086-605,9146)/615,9086 = 1,62% (no dado explicitamente como columna separada; recalculado con la formula estandar del proyecto -- coincide con el costo total dado, 2,61%, al sumar fee en porcentaje 15/1.500=1% + margen 1,62%=2,62%, redondeo de 0,01pp frente al 2,61% de la fuente). Recipient gets 899.783 COP (cross-validado: 605,9146*(1.500-15)=899.783,2, coincide). Corredor con cobertura razonable (4 proveedores, 2.515 comparaciones/3 meses, el segundo mas consultado de los 5 corredores de Brasil despues de Bolivia). Primero de los 5 corredores de Brasil fuera de MERCOSUR/vecinos inmediatos -- que el mismo patron (MoneyGram promocional, WU gana corregido) se repita aca sugiere un comportamiento general de MoneyGram en corredores con origen Brasil, no especifico de la relacion bilateral MERCOSUR. Investigado 2-sep-2026 (research v15 Seccion 1).',
   '2026-09-02', 'sin_confirmar');

-- ===========================================================================
-- PART 2: Mukuru (research v15 Secciones 2, 2.1, 5.1) -- 4 corridors from
-- South Africa named in the source's own "recordatorio" as ready to load
-- (Botswana, Zimbabwe, Zambia, Malawi). Verified against fx_rates BEFORE
-- writing this migration -- only 2 of the 4 are actually new/updatable:
--
-- - Botswana (ZA->BW): ZERO prior Mukuru row for this corridor -- clean
--   INSERT below.
-- - Malawi (ZA->MW): existing row (id 02eb77a8-cae2-455e-8580-598982f4345c,
--   spread 2%, sin_confirmar, source "Direct research Aug 2025
--   (mukuru.com)" -- a weak generic citation) is superseded by a far
--   stronger primary source (World Bank RPW) with an explicit, unusually
--   important caveat -- UPDATE below.
-- - Zimbabwe (ZA->ZW): NOT touched. Existing row (id
--   5f21f5b4-b527-4ce1-8871-f3091d9695c0) already carries spread=9,66%,
--   verified_status=confirmado_activo, cross-validated from TWO
--   independent sources in the same session (RPW Q3 2025 + Monito v12
--   live re-audit, both cited in that row's data_source). v15's own
--   Section 5.1 explicitly flags this exact corridor as having two
--   different measurements (v11: 10,28%-10,68% costo/0,35%-0,75% margen;
--   v15: 9,81% costo/0,32% margen) and says outright: "no se investigo
--   cual de las dos fechas es mas reciente" -- an acknowledged, unresolved
--   discrepancy, not a correction. Per the project's own house rule
--   (never overwrite with an uncertain figure), the existing
--   cross-validated confirmado_activo row is kept as-is; the v15 figure
--   is documented here and in the addendum doc's "Lo que se cargo" section
--   instead of silently replacing stronger data with weaker data.
-- - Zambia (ZA->ZM): NOT loaded as an fx_rates row. v15 gives fee (137
--   ZAR/10,0%), margin FX (1,48%) and total cost (11,48%) but, unlike
--   Botswana (explicit "Tipo de cambio: 0,76") and Malawi (explicit
--   226,40/248,10 ZAR/MWK pair, Seccion 2.1), NO absolute exchange rate
--   is given anywhere in the source for ZAR->ZMW, and the project has no
--   previously-established canonical ZAR->ZMW rate anywhere in fx_rates
--   to reuse (checked: zero rows with to_currency='ZMW' from any
--   ZAR-sending provider). fx_rates.rate is NOT NULL and is never
--   fabricated in this project without a real anchor (see the Xoom
--   US->MX precedent, v11/v14, which explicitly reuses an
--   already-established canonical rate rather than inventing one) -- with
--   no rate to derive or reuse, the row is skipped rather than writing a
--   made-up number. The fee/margin/total-cost figures are recorded in
--   Mukuru's providers.notes below for reference, not as a priced row.
-- ===========================================================================

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ZAR', 'BWP', 0.76, 137, 'mukuru', 'ZA', 'BW', false, -0.25,
   'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico Mukuru Sudafrica->Botsuana, dato periodo jul-oct 2025. Envio de 1.370 ZAR, transferencia a cuenta bancaria via call center / pickup en efectivo, entrega el mismo dia, cobertura "alta" segun RPW. Fee 137,00 ZAR (10,0% del monto -- fee plano alto, domina el costo total). Tipo de cambio aplicado dado explicitamente por la fuente: 0,76 BWP/ZAR. Margen de tipo de cambio dado explicitamente: -0,25% (levemente favorable, practicamente nulo). Costo total 9,75% (dado por la fuente; existe tambien un tramo de 3.410 ZAR con fee 307 ZAR/9,0% y costo total 8,75%, mismo margen -0,25%, NO cargado como fila de tramo separada -- mismo margen, solo cambia el fee relativo, no una tarifa por escalon real). PRIMER corredor de Mukuru en el proyecto con desglose numerico preciso -- aclara que el "margen fuertemente variable" atribuido a Mukuru desde v11 se referia al FEE (9-10% plano), no al tipo de cambio (practicamente nulo aca). NOTA: este tipo de cambio (0,76) difiere del ZAR/BWP ya establecido en el proyecto para otros proveedores en este mismo corredor (Western Union/Wise, ambos 0,829063, World Bank RPW Q3 2025, sesion anterior) -- ambas cifras vienen de snapshots RPW de fechas distintas y no se fuerza su reconciliacion aca, igual que la discrepancia ya documentada para Mukuru Sudafrica->Zimbabue (v11 vs v15, ver PART 2 mas arriba en esta migracion). Investigado 2-sep-2026 (research v15 Seccion 2).',
   '2026-09-02', 'confirmado_activo');

update public.fx_rates
set rate = 248.10,
    fee = 137,
    public_spread_percent = -9.58,
    data_source = 'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico Mukuru Sudafrica->Malaui, dato periodo jul-oct 2025. ACTUALIZA la fila previa (spread=2%, sin_confirmar, fuente generica "Direct research Aug 2025 (mukuru.com)") con una fuente primaria mas solida. Envio de 1.370 ZAR, fee 137,00 ZAR (10,0%, mismo patron de fee plano alto que el resto de los corredores de Mukuru esta ronda). Tipo de cambio: RPW reporta un tipo de cambio inter-bancario de referencia de 226,40 MWK/ZAR contra un tipo de cambio EFECTIVO de Mukuru de 248,10 MWK/ZAR -- Mukuru da casi 10% mas MWK por ZAR que la referencia. Margen FX = (226,40-248,10)/226,40 = -9,58% (verificado, coincide exacto con la cifra dada por la fuente). Costo total 0,42% (el margen negativo casi cancela el fee del 10%). *** ADVERTENCIA EXPLICITA, NO LEER A VALOR NOMINAL (research v15 Seccion 2.1): este margen favorable probablemente NO es una ganga real de Mukuru, sino un artefacto de que Malaui tiene una brecha enorme entre su tipo de cambio oficial y el de mercado paralelo -- confirmado con fuente independiente (Wikipedia, datos de noviembre 2025): tipo de cambio oficial 1.734 MWK/USD vs. tasa de mercado negro ~4.300 MWK/USD, una brecha de casi 148%, la mayor distorsion cambiaria documentada en todo el proyecto (mas severa que los controles de capital de China o Corea del Sur, v13/v14). Si Mukuru aplica una tasa mas cercana a la realidad del mercado que la que RPW usa como referencia "inter-bancaria", el margen calculado sale artificialmente favorable sin que el usuario reciba necesariamente una tasa mejor que la disponible en la calle. NO usar como "el mejor caso de Mukuru" sin este contexto -- ver tambien nota equivalente en providers.notes de Mukuru. Investigado 2-sep-2026 (research v15 Secciones 2, 2.1).',
    data_collected_at = '2026-09-02',
    verified_status = 'confirmado_activo'
where id = '02eb77a8-cae2-455e-8580-598982f4345c';

-- Mukuru providers.notes: refreshed running summary of all corridors
-- actually in fx_rates today (Botswana new, Malawi updated with caveat,
-- Zimbabwe/Mozambique unchanged this round) plus the Zambia figures that
-- were NOT loaded as a priced row (see PART 2 note above) -- kept here so
-- the data isn't lost even though it has no fx_rates row.
update public.providers
set notes = 'Sudafrica -> Botsuana/Zimbabue/Mozambique/Malaui, fee plano ~9-10% del monto enviado domina el costo en los 4 (patron confirmado, no es el tipo de cambio el que varia mucho, es el fee). Corredores cargados en fx_rates: ZA->BW (margen -0,25%, costo 9,75%, RPW jul-oct 2025), ZA->ZW (margen 9,66%, costo total no separado por fee -- ver fila, cross-validado RPW+Monito v12), ZA->MZ (margen -4,85%, RPW v11 13.1), ZA->MW (margen -9,58%, costo 0,42% -- CIFRA REAL PERO NO ES UNA GANGA: refleja una brecha de ~148% entre el tipo de cambio oficial y el paralelo de Malaui, no un buen trato genuino de Mukuru; ver nota completa en la fila de fx_rates). Zambia (ZA->ZM) investigado -- fee 137 ZAR (10,0%), margen 1,48%, costo total 11,48% (RPW, research v15 Seccion 2) -- NO cargado como fila de fx_rates: la fuente no da un tipo de cambio absoluto para este par (solo fee/margen/costo) y el proyecto no tiene un ZAR->ZMW canonico ya establecido para reusar; se documenta aca en vez de inventar una tasa. Discrepancia sin resolver: Sudafrica->Zimbabue tiene dos mediciones RPW distintas en el proyecto (v11: costo 10,28%-10,68%; v15 vigente hoy: costo 9,81%) -- se mantiene la version ya cargada (cross-validada con Monito v12), la de v15 queda documentada sin cargar. Afiliado: sin confirmar. Fuentes: World Bank RPW (Q3 2025 y jul-oct 2025) + investigacion directa ago 2025 (mukuru.com) + research v15 (2-sep-2026).'
where slug = 'mukuru';

-- ===========================================================================
-- PART 3: Xoom, EEUU->Tailandia (research v15 Seccion 3). Provider ya
-- existe (multiples corredores desde v11/auditorias previas) -- fila
-- nueva para este corredor exacto, verificado cero filas previas
-- US->TH para xoom. Fuente: World Bank RPW, dato 20-ago-2025. Margen de
-- tipo de cambio constante (4,71%) en ambos montos de ejemplo de la
-- fuente (USD 200 y USD 500) -- solo cambia el fee relativo (2,50% vs.
-- 1,00% de un mismo fee flat de USD 4,99), no un escalon de tarifa real.
-- Se carga UNA sola fila representativa a USD 200 (mismo monto de
-- referencia ya usado para Xoom EEUU->Mexico en este proyecto, research
-- v11 Seccion 19.2/25.1), consistente con el patron ya establecido de
-- fila unica cuando el margen no varia por tramo (ver Xoom US->MX, US->PH,
-- US->IN, US->VN, todas sin min_amount/max_amount) -- a diferencia de Xoom
-- GB->IN, donde SI hay 3 filas con min_amount porque ahi el margen mismo
-- cambia por tramo. El tramo USD 500 (fee 1,00%, costo total 5,71%) NO se
-- carga como fila aparte; queda documentado aca.
-- ===========================================================================

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('USD', 'THB', 31.02, 4.99, 'xoom', 'US', 'TH', false, 4.71,
   'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico Xoom EEUU->Tailandia, dato con fecha 20-ago-2025. Envio de USD 200 (monto representativo cargado; ver nota de la migracion sobre el segundo monto de ejemplo, USD 500, no cargado como fila aparte). Fee USD 4,99 (2,50% de 200 USD). Tipo de cambio aplicado dado explicitamente por la fuente: 31,02 THB/USD. Margen de tipo de cambio dado explicitamente: 4,71% -- el mas alto medido hasta ahora entre los proveedores "de referencia" del proyecto (por encima de InstaReM -0,43% a 1,30%, Global66 0,01% en 3 de 4 paises, SBI Remit 0,09%, y la mayoria de los corredores de Mukuru). Costo total para USD 200: 7,21% (fee 2,50% + margen 4,71%, dado por la fuente). Para USD 500 el mismo margen de 4,71% da un costo total de 5,71% (fee baja a 1,00% relativo, mismo fee flat de USD 4,99 -- NO cargado como fila de tramo separada, ver nota de la migracion). Xoom combina margen de tipo de cambio alto con fee bajo -- patron de "costo escondido en el tipo de cambio, no en el fee visible", distinto al de Mukuru (margen bajo, fee alto). Confirma con datos concretos la reputacion de Xoom (propiedad de PayPal) de ser mas caro que la competencia fintech pura. Investigado 2-sep-2026 (research v15 Seccion 3).',
   '2026-09-02', 'confirmado_activo');

-- ===========================================================================
-- PART 4: Lulu Money -- proveedor NUEVO (sin fila previa en `providers` ni
-- en `fx_rates`, verificado antes de escribir esta migracion). Ultimo de
-- los cinco proveedores "amplios" catalogados en v11 (Mukuru, Xoom, Lulu
-- Money, TransferGo, SBI Remit) en quedar sin ningun corredor numerico --
-- research v15 Seccion 4. Mismo patron que la incorporacion de SBI Remit
-- en v14 Parte 3: se agrega primero a `providers`, despues la fila de
-- fx_rates. Fuente: World Bank RPW, corredor Kuwait->Egipto, dato periodo
-- jul-sep 2025.
--
-- Nota sobre `rate`: la fuente da fee/margen/costo total pero NO una tasa
-- de cambio absoluta para este corredor (a diferencia de Xoom/Botsuana/
-- Malaui en esta misma migracion, que si la dan). El proyecto ya tiene un
-- tipo de cambio KWD->EGP canonico establecido (163,321743, de la fila de
-- Wise para este mismo par de divisas, spread 0% -- mid-market real). Se
-- reusa ese valor y se le aplica el margen de 1,08% dado por la fuente
-- para derivar la tasa aplicada de Lulu Money (161,5579) -- misma tecnica
-- ya usada en el proyecto para Xoom EEUU->Mexico (v11 Seccion 25.1/31.3,
-- "tasa reusada del valor canonico ya establecido... ya que RPW no
-- publica esa cifra"), no una tasa inventada.
-- ===========================================================================

insert into public.providers (
  slug, name, segment, fee_percent, fee_fixed, spread_percent, active,
  is_corridor_specific, notes, website_url, audience, affiliate_url, fee_tiers
) values (
  'lulu-money',
  'Lulu Money',
  'retail',
  0,
  1.50,
  1.08,
  true,
  true,
  'Parte de Lulu Financial Holdings (grupo de remesas de Medio Oriente/Asia). Corredor cargado: Kuwait->Egipto. Margen cambiario 1,08% confirmado via World Bank RPW (fuente primaria, dato periodo jul-sep 2025) -- moderado, mismo rango que InstaReM/SBI Remit, ni el extremo bajo de Global66 ni el alto de Xoom. Fee KWD 1,50 (2,31% de un envio de KWD 65 / USD 200). Disponible tanto para cuenta bancaria como retiro en efectivo, mismo costo total en ambos (3,39%). Ultimo de los cinco proveedores "amplios" catalogados en v11 (junto con Mukuru, Xoom, TransferGo, SBI Remit) en quedar con al menos un corredor numerico documentado. Sin afiliado confirmado. Sin sitio web verificado en la fuente (no cargado para no inventar una URL). Investigado 2-sep-2026 (research v15 Seccion 4).',
  '',
  'retail',
  '',
  '[]'::jsonb
);

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('KWD', 'EGP', 161.5579, 1.50, 'lulu-money', 'KW', 'EG', false, 1.08,
   'World Bank Remittance Prices Worldwide (remittanceprices.worldbank.org), nodo especifico Lulu Money Kuwait->Egipto, dato periodo jul-sep 2025. Envio de KWD 65 (equivalente USD 200). Fee KWD 1,50 (2,31% -- equivalente USD 4,62 dado por la fuente). Margen de tipo de cambio dado explicitamente: 1,08%. Costo total 3,39% (fee 2,31% + margen 1,08%, dado por la fuente). Disponible tanto para transferencia a cuenta bancaria como para retiro en efectivo, mismo costo total en ambos casos segun la fuente. Tipo de cambio aplicado (161,5579) NO dado directamente por la fuente -- derivado reusando el tipo de cambio KWD->EGP canonico ya establecido en el proyecto (163,321743, fila de Wise para este par, spread 0%) aplicandole el margen de 1,08% dado por RPW: 163,321743*(1-0,0108)=161,5579 -- misma tecnica ya usada en el proyecto para Xoom EEUU->Mexico (v11) cuando RPW da el margen pero no una tasa absoluta. Cierra la linea de investigacion de los cinco proveedores "amplios" catalogados en v11 -- todos con al menos un corredor numerico documentado. Investigado 2-sep-2026 (research v15 Seccion 4).',
   '2026-09-02', 'confirmado_activo');

-- ===========================================================================
-- PART 5: Argentina, primeros corredores de SALIDA (research v15 Seccion
-- 6, 6.2) -- Argentina->Espana y Argentina->Italia. Nota importante
-- verificada antes de escribir esta migracion: Argentina como
-- sending_country YA existe en el proyecto desde v8 (Prex, 10 corredores
-- de salida) y ya hay filas AR->ES (Wise, Western Union) y AR->IT (Ria,
-- Wise) de sesiones previas -- lo genuinamente nuevo de v15 es (a)
-- Global66 en ambos corredores (proveedor ya existe pero SIN fila previa
-- para AR->ES/AR->IT -- su unico dato de Argentina hasta ahora era
-- EUR->ARS de ENTRADA, direccion opuesta) y (b) Western Union AR->IT
-- (proveedor ya existe pero SIN fila previa en este corredor exacto).
-- Western Union AR->ES SI tiene una fila previa (id
-- 38be8667-78af-42ac-9585-0af54a2c1e2b, fee 500 ARS flat/spread 3%,
-- fuente generica "Direct research Aug 2025 (westernunion.com)", sin
-- monto de referencia ni metodo de entrega especificado) -- se actualiza
-- con el dato especifico de Monito (fee 5% sobre 100.000 ARS = 5.000 ARS,
-- cash pickup, corredor con monto y metodo explicitos), tratado como
-- correccion genuina por la misma razon que Taptap Send UK->Ghana en v14
-- Parte 4 (fuente mas especifica reemplaza una generica).
--
-- Envio de referencia: 100.000 ARS, mid-market 1 ARS = 0,000571 EUR
-- (57,10 EUR de referencia). Ambos corredores dan resultados casi
-- identicos para Global66 (5,28% en los dos, mismo tipo de cambio
-- aplicado 0,000541 sin importar el destino) pese a que Italia tiene
-- bastante menos cobertura que Espana (646 vs. 1.659 comparaciones) --
-- el research (Seccion 6.2) concluye que esto favorece la explicacion de
-- riesgo cambiario genuino del peso argentino por sobre cobertura
-- delgada/competencia. La hipotesis de controles de capital (patron
-- Malaui) fue investigada y descartada en gran parte: las restricciones
-- para individuos en Argentina fueron levantadas en abril de 2025 (fuente
-- independiente, Infobae 11-mar-2026 citando al presidente del BCRA).
-- ===========================================================================

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ARS', 'EUR', 0.000541, 0, 'global66', 'AR', 'ES', false, 5.28,
   'Monito.com (tarjeta de Global66), corredor Argentina->Espana, envio de 100.000 ARS, cuenta bancaria. Dato limpio, sin insignia promocional. Fee "Free" (0). Tipo de cambio aplicado dado explicitamente por la fuente: 0,000541 EUR/ARS. Mid-market 0,000571 EUR/ARS (57,10 EUR de referencia para 100.000 ARS). Recipient gets 54,05 EUR. Margen FX ~5,3% en la Seccion 6 original, re-confirmado como 5,28% en la Seccion 6.2 (comparando contra el segundo corredor argentino) -- se carga la cifra mas precisa (5,28%). PRIMERA fila de Global66 para un corredor de SALIDA de Argentina (el unico dato previo de Argentina para este proveedor era EUR->ARS de entrada, direccion opuesta) -- muy por encima del patron habitual de Global66 de margen casi nulo (0,01%) en Chile/Peru/Mexico. Investigado, no explicado por controles de capital (levantados abril 2025, fuente Infobae 11-mar-2026) -- probablemente riesgo cambiario genuino del peso argentino y/o cobertura delgada del corredor (solo 2 proveedores, 1.659 comparaciones/3 meses). Investigado 2-sep-2026 (research v15 Seccion 6).',
   '2026-09-02', 'sin_confirmar'),

  ('ARS', 'EUR', 0.000541, 0, 'global66', 'AR', 'IT', false, 5.28,
   'Monito.com (tarjeta de Global66), corredor Argentina->Italia, envio de 100.000 ARS, cuenta bancaria. Dato limpio, sin insignia promocional. Fee "Free" (0). Tipo de cambio aplicado: 0,000541 EUR/ARS -- IDENTICO al de Argentina->Espana (misma fila arriba), pese a que Italia tiene bastante menos cobertura en Monito (646 comparaciones/3 meses vs. 1.659 de Espana). Recipient gets 54,10 EUR (vs. 54,05 EUR en Espana -- montos casi iguales). Margen FX 5,28% (identico a Espana). Segundo corredor argentino, elegido para distinguir entre dos hipotesis para el margen alto de Global66: riesgo cambiario del peso (predice margen constante entre destinos) vs. cobertura delgada/poca competencia (predice peor margen en el corredor con menos actividad, Italia). El resultado (margen identico pese a cobertura muy distinta) favorece con bastante confianza la hipotesis de riesgo cambiario del peso: el margen parece fijarse por el par de origen (ARS->EUR), no por la competencia especifica de cada destino. Investigado 2-sep-2026 (research v15 Seccion 6.2).',
   '2026-09-02', 'sin_confirmar'),

  ('ARS', 'EUR', 0.000541, 5000, 'western-union', 'AR', 'IT', false, 5.27,
   'Monito.com (tarjeta de Western Union), corredor Argentina->Italia, envio de 100.000 ARS, cash pickup. Dato limpio, sin insignia promocional. Fee 5.000 ARS (5% del monto -- fee plano alto, patron ya visto en otros corredores de WU esta sesion). Tipo de cambio aplicado 0,000541 EUR/ARS (derivado: recipient gets 51,40 EUR / (100.000-5.000) ARS = 51,40/95.000 = 0,0005411, redondeado a la misma precision que el resto de las filas de este corredor). Margen FX (sin el fee) ~5,27%, dado explicitamente por la fuente como cifra separada del costo total. Costo total ~9,9% (fee 5% + margen 5,27%, dado por la fuente). SIN fila previa para este corredor exacto (western-union + AR->IT) -- verificado antes de escribir esta migracion. Investigado 2-sep-2026 (research v15 Seccion 6.2).',
   '2026-09-02', 'sin_confirmar');

-- Western Union Argentina->Espana: UPDATE, no insert. Fila previa (id
-- 38be8667-78af-42ac-9585-0af54a2c1e2b) tenia fee=500 ARS flat, spread=3%,
-- fuente generica "Direct research Aug 2025 (westernunion.com)" sin monto
-- de referencia ni metodo de entrega. El research v15 (Seccion 6) da un
-- dato especifico de Monito (envio de 100.000 ARS, cash pickup, insignia
-- ausente) con un fee muy distinto (5% = 5.000 ARS, no 500 ARS flat) --
-- se trata como correccion genuina, misma logica que Taptap Send
-- UK->Ghana en v14 Parte 4 (fuente mas especifica reemplaza una
-- generica). CAVEAT: la fila previa no especificaba metodo de entrega;
-- el dato nuevo es explicitamente cash pickup -- mismo tipo de caveat ya
-- documentado en v14 Parte 5 para Reino Unido->Nigeria.
update public.fx_rates
set rate = 0.000541,
    fee = 5000,
    public_spread_percent = 5.12,
    data_source = 'Monito.com (tarjeta de Western Union), corredor Argentina->Espana, envio de 100.000 ARS, cash pickup. Dato limpio, sin insignia promocional. ACTUALIZA la fila previa (fee=500 ARS flat, spread=3%, fuente generica "Direct research Aug 2025 (westernunion.com)", sin monto de referencia ni metodo de entrega especificado) con un dato especifico y mas reciente. Fee 5.000 ARS (5% del monto). Tipo de cambio aplicado 0,000541 EUR/ARS (derivado: recipient gets 51,43 EUR / (100.000-5.000) ARS = 51,43/95.000 = 0,0005414, redondeado). Margen FX (sin el fee) ~5,12%, dado explicitamente por la fuente como cifra separada del costo total. Costo total ~9,9% (fee 5% + margen 5,12%, dado por la fuente). CAVEAT: la fila anterior no especificaba metodo de entrega; el dato nuevo es explicitamente cash pickup -- mismo tipo de caveat ya documentado en v14 Parte 5 para Reino Unido->Nigeria (fuente mas especifica reemplazando una generica, no necesariamente la misma medicion exacta). Investigado 2-sep-2026 (research v15 Seccion 6).',
    data_collected_at = '2026-09-02',
    verified_status = 'sin_confirmar'
where id = '38be8667-78af-42ac-9585-0af54a2c1e2b';

-- Global66 providers.notes: se agrega la nota de los corredores de SALIDA
-- de Argentina (AR->ES, AR->IT) sin tocar la nota existente sobre el
-- corredor de ENTRADA (EUR->ARS, aun pendiente de fee/spread) ni los
-- demas corredores ya documentados (ES->CO, CL->PE, AR->CO, MX->CO).
update public.providers
set notes = notes || ' ACTUALIZACION 2-sep-2026 (research v15 Secciones 6, 6.2): dos corredores nuevos de SALIDA desde Argentina, Argentina(ARS)->Espana(EUR) y Argentina(ARS)->Italia(EUR) -- direccion opuesta al corredor EUR->ARS de entrada mencionado arriba. Margen de tipo de cambio ~5,28% en ambos (identico entre destinos pese a cobertura muy distinta -- 1.659 vs. 646 comparaciones), muy por encima del patron habitual de Global66 (margen casi nulo en Chile/Peru/Mexico). Investigado y descartado en gran parte como caso de controles de capital (levantados para individuos en abril de 2025, fuente Infobae 11-mar-2026) -- probablemente riesgo cambiario genuino del peso argentino. Datos limpios de Monito, sin insignia promocional.'
where slug = 'global66';
