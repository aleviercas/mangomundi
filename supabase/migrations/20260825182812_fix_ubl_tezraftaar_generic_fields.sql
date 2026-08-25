-- Fix: UBL Tezraftaar tenia fee_percent/fee_fixed/spread_percent en 0 Y
-- fee_tiers vacio -- el mismo bug que BDO Remit/Money2India tenian antes de
-- la migracion del 25-ago (mostraba "gratis" en cualquier comparacion real
-- pese a tener datos reales en fx_rates sin usar). Se espeja el dato ya
-- verificado de fx_rates (AE->PK, World Bank RPW) a los campos genericos,
-- ya que UBL Tezraftaar no encaja en fee_tiers (sus tramos varian por
-- moneda de origen, no por monto en una sola moneda).
--
-- NOTA: este archivo reemplaza a un mirror anterior mal numerado
-- (20260825095600_fix_ubl_and_load_final_batch.sql) que combinaba este fix
-- con la carga de la tanda final bajo un timestamp inventado que no
-- coincidia con el version real aplicado en Supabase (causaba el error de
-- CI "Remote migration versions not found in local migrations directory").
-- Este archivo usa el version real: 20260825182812.
update providers
set spread_percent = 0.54,
    notes = coalesce(notes, '') || ' Campos genericos poblados 25-ago-2026 desde el mismo dato ya verificado en fx_rates (AE->PK, World Bank RPW) -- antes quedaban en 0 (fee y spread), lo que hacia que el proveedor se mostrara como gratis en cualquier comparacion mientras ENABLE_CORRIDOR_FILTERING este apagado.'
where slug = 'ubl-tezraftaar';
