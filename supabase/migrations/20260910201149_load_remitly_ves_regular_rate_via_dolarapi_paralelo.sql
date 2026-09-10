-- 2026-09-10 follow-up research: resolves the "needs re-measurement" flag
-- from the 2026-09-10 downgrade (migration downgrade_remitly_ves_suspect_promo_fee).
-- Monito's live comparison card for this corridor (monito.com/send-money/
-- united-states/venezuela/usd/ves) shows BOTH lines side by side for a
-- 100 USD transfer:
--   Promo (first transfer only): fee $0, rate 931.48 VES/USD, recipient
--     gets 93,148 VES -- this is what was previously loaded, and what the
--     earlier v26 research recalculation (-0.45%) was also built on.
--   REGULAR (recurring) rate: fee $1.99, rate 904.35 VES/USD, recipient
--     gets 88,635 VES -- this is a genuine non-promotional data point,
--     explicitly labeled as the rate for transfers after the first one.
-- Benchmarked against ve.dolarapi.com's live "paralelo" rate (945.976898
-- VES/USD, the correct reference per this project's established ARS/VES
-- methodology -- see docs/data-sources/2026-09-09-research-v26-*.md
-- Section on dolarapi.com), NOT against XE's "mid-market" (821.6859,
-- shown on the same Monito page) -- XE's VES mid-market tracks the
-- official/BCV-anchored rate, confirmed by matching ve.dolarapi.com's
-- "oficial" line (820.1018) almost exactly, which produces a nonsensical
-- negative margin (-7.87%) for the same data, the same failure mode
-- already documented for ARS in this project's conclusions doc Section 6.
-- costo_real = 1 - recibido/(monto*tipo_cambio_medio)
--            = 1 - 88635/(100*945.976898) = 6.30% (vs. paralelo, correct)
--            = 1 - 88635/(100*821.6859)   = -7.87% (vs. XE/oficial, misleading)
-- 6.30% is positive, in-range for a Remitly corridor, and internally
-- consistent (recipient-gets figure matches (100-1.99)*904.35 within
-- rounding) -- confident enough to restore to confirmado_activo.
update public.fx_rates
set fee = 1.99,
    rate = 904.35,
    public_spread_percent = 6.30,
    data_source = 'Monito.com (tarjeta de Remitly, LINEA REGULAR explicita, no la promocional), corredor EEUU->Venezuela, envio de 100 USD. Fee $1.99 (vs. $0 de la linea promocional "primera transferencia"), tasa aplicada 904.35 VES/USD, recibido 88.635 VES. Benchmark correcto: ve.dolarapi.com tasa "paralelo" en vivo (945.976898 VES/USD, 2026-09-10) -- NO el "mid-market" de XE que muestra la misma tarjeta de Monito (821.6859), que resulta ser practicamente identico al oficial de dolarapi.com (820.1018) y produce un margen negativo sin sentido (-7.87%) con los mismos datos -- mismo problema metodologico ya documentado para ARS en este proyecto. costo_real = 1-recibido/(monto*paralelo) = 6.30%, positivo y en rango con el resto de corredores de Remitly. RESUELVE la marca "needs re-measurement" dejada en la migracion de downgrade del 2026-09-10 -- ya no es la tasa promocional. Investigado 10-sep-2026.',
    data_collected_at = '2026-09-10',
    verified_status = 'confirmado_activo'
where id = 'dffc7167-7838-464d-a249-cc29ec23f2ce';
