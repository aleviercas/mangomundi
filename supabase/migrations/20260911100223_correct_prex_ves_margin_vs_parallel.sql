-- 2026-09-10 research: this row's original spread (3.86%) was computed
-- against xe.com's ARS/VES mid-market, which -- exactly like the Remitly
-- VES row fixed earlier today (migration
-- load_remitly_ves_regular_rate_via_dolarapi_paralelo) -- tracks the
-- OFFICIAL/BCV-anchored rate for VES, not the parallel rate real senders
-- actually reference. That's why this corridor originally looked like
-- Prex's CHEAPEST (3.86%, breaking the 7.86%-11.81% pattern every other
-- Prex corridor clusters in, flagged sin_confirmar for exactly this
-- reason at load time).
--
-- Recalculated using the correct cross-reference (ARS "blue" and VES
-- "paralelo", both from dolarapi.com, the source this project already
-- established as the right benchmark for volatile/dual-rate currencies):
--   cross_correcto = ves_paralelo / ars_blue = 945.976898 / 1540 = 0.614271 VES/ARS
--   margen = (0.614271 - 0.50846) / 0.614271 = 17.23%
-- The applied rate itself (0.50846 VES/ARS) is unchanged -- it's a real
-- measurement from Prex's own corridor calculator (2026-09-02), not
-- re-measured live today. Only the reference/benchmark used to compute
-- the margin is corrected. CAVEAT: the applied rate is 8 days old and
-- both ARS and VES are actively moving currencies -- kept as
-- sin_confirmar (not upgraded to confirmado_activo) pending a fresh live
-- re-check of Prex's own calculator, unlike the same-day Remitly fix.
-- Once corrected, this flips from Prex's apparent CHEAPEST corridor to
-- its MOST EXPENSIVE (17.23% vs. 7.86%-11.81% for the rest) -- consistent
-- with the general finding that official-rate benchmarks systematically
-- understate margins on ARS/VES corridors.
update public.fx_rates
set public_spread_percent = 17.23,
    data_source = data_source || ' -- CORREGIDO 2026-09-10: el margen original (3.86%) se calculo contra el mid-market de xe.com, que para VES sigue el tipo OFICIAL/BCV, no el paralelo -- mismo problema ya identificado y corregido para Remitly EEUU->Venezuela el mismo dia (ver migracion load_remitly_ves_regular_rate_via_dolarapi_paralelo). Recalculado contra el cross-rate correcto (ARS "blue" / VES "paralelo", ambos dolarapi.com): 945.976898/1540=0.614271 VES/ARS de referencia vs. 0.50846 VES/ARS aplicado por Prex = 17.23% de margen -- invierte la conclusion original: de "el corredor mas barato de Prex" (rompia el patron 7.86%-11.81%) a "el mas caro". La tasa aplicada (0.50846) no se remidio en vivo hoy -- sigue siendo la medicion de Prex del 2-sep-2026; se mantiene sin_confirmar (no se sube a confirmado_activo) hasta una re-medicion en vivo, a diferencia de la fila de Remitly VES que si tuvo medicion del mismo dia.',
    data_collected_at = '2026-09-10',
    verified_status = 'sin_confirmar'
where id = '075b11b2-98a9-4bdc-ba14-58f1559813fa';
