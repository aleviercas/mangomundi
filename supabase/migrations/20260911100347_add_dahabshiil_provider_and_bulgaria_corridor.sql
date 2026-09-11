-- 2026-09-10 research: fills a confirmed gap (zero BGN rows existed).
-- Dahabshiil is a new provider for this project -- added with the same
-- minimal pattern already used for SBI Remit and Lulu Money (v14/v15).
-- Source: monito.com/send-money/germany/bulgaria/eur/bgn, live card,
-- envio de 100 EUR. Shows both promo and regular lines explicitly:
--   Promo (1st transfer): fee 0, rate 1.9409, recipient gets 194.09 BGN
--   REGULAR: fee 1.99 EUR, rate 1.9409 (same rate, only fee differs here
--     -- unlike Remitly's VES promo, this provider's promo is fee-only,
--     not a better exchange rate too), recipient gets 190.23 BGN
-- Only the REGULAR line is loaded (same policy as the Remitly VES fix
-- earlier today -- never load a first-transfer promo as the standing
-- price).
-- NOTE ON METHODOLOGY: unlike ARS/VES, BGN does NOT need the
-- paralelo/oficial correction -- the Bulgarian lev has been under a hard
-- currency-board peg to the euro since 1997 (1 EUR = 1.95583 BGN,
-- statutory, cannot legally float) and Monito's XE-sourced mid-market
-- here (1.9558) matches that peg almost exactly, confirming there is no
-- official-vs-parallel divergence to correct for -- XE's mid-market is
-- the correct reference for this specific currency, unlike VES/ARS.
-- Also note: BGN's hard peg means it does NOT fit this project's core
-- "moneda volatil -> margen alto" thesis (see
-- docs/data-sources/2026-09-03-research-v16-v25-margen-moneda-volatil.md)
-- -- loaded for coverage completeness (it was an explicitly flagged gap),
-- not as evidence for or against the volatility hypothesis.
insert into public.providers (
  slug, name, segment, fee_percent, fee_fixed, spread_percent, active,
  is_corridor_specific, notes, website_url, audience, affiliate_url, fee_tiers
) values (
  'dahabshiil',
  'Dahabshiil',
  'retail',
  0,
  1.99,
  0.76,
  true,
  true,
  'Proveedor de remesas con fuerte presencia historica en el Cuerno de Africa (Somalia, etc.) y diaspora europea. Corredor cargado: Alemania->Bulgaria (unico corredor investigado hasta ahora). Fee EUR 1.99 en la tarifa regular (promo de EUR 0 en la primera transferencia, NO cargada -- misma politica que el resto del proyecto). Margen cambiario 0.76% -- bajo, pero BGN esta bajo caja de conversion fija al euro desde 1997 (1 EUR=1.95583 BGN estatutario), asi que el margen de referencia disponible para cualquier proveedor en este par es estructuralmente chico, no necesariamente indicador de una politica de precios agresiva. Sin afiliado confirmado. Investigado 10-sep-2026.',
  '',
  'retail',
  '',
  '[]'::jsonb
);

insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values (
  'EUR', 'BGN', 1.9409, 1.99, 'dahabshiil',
  'DE', 'BG', false, 0.76,
  'Monito.com (tarjeta de Dahabshiil), corredor Alemania->Bulgaria, envio de 100 EUR, tarjeta (card). LINEA REGULAR (no la promocional de primera transferencia, fee 0 -- NO cargada, misma politica que Remitly VES esta misma sesion). Fee EUR 1.99, tasa aplicada 1.9409, mid-market XE 1.9558 (coincide casi exacto con la paridad fija estatutaria del lev bulgaro, 1.95583 -- BGN no necesita la correccion oficial/paralelo aplicada a ARS/VES, ver nota completa en providers.notes de dahabshiil). Margen FX 0.76% (dado explicitamente por la fuente, verificado: 1-(1-costo_real)/(1-fee/monto) con costo_real=2.73% da 0.755%, redondea a 0.76%). Recipient gets 190.23 BGN. Llena un vacio confirmado (cero filas BGN previas en el proyecto, item explicitamente marcado pendiente). Proveedor nuevo para el proyecto (agregado con el mismo patron minimo ya usado para SBI Remit/Lulu Money). Investigado 10-sep-2026.',
  '2026-09-10', 'sin_confirmar'
);
