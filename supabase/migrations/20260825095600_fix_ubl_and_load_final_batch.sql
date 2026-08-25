-- Fix: UBL Tezraftaar tenia fee_percent/fee_fixed/spread_percent en 0 Y
-- fee_tiers vacio -- el mismo bug que BDO Remit/Money2India tenian antes de
-- la migracion del 25-ago (mostraba "gratis" en cualquier comparacion real
-- pese a tener datos reales en fx_rates sin usar). Se espeja el dato ya
-- verificado de fx_rates (AE->PK, World Bank RPW) a los campos genericos,
-- ya que UBL Tezraftaar no encaja en fee_tiers (sus tramos varian por
-- moneda de origen, no por monto en una sola moneda).
update providers
set spread_percent = 0.54,
    notes = coalesce(notes, '') || ' Campos genericos poblados 25-ago-2026 desde el mismo dato ya verificado en fx_rates (AE->PK, World Bank RPW) -- antes quedaban en 0 (fee y spread), lo que hacia que el proveedor se mostrara como gratis en cualquier comparacion mientras ENABLE_CORRIDOR_FILTERING este apagado.'
where slug = 'ubl-tezraftaar';

-- Carga research "otras regiones" tanda final: NALA, TapTap Send, Sendwave,
-- LemFi. Corredores nuevos confirmados por fuente primaria (ver
-- docs/data-sources/2026-08-25b-auditoria-cobertura-otras-regiones.md),
-- cotizados en vivo (500 unidades de la moneda de origen). Ninguno de los 4
-- mostro distincion regular/promocional en su calculadora publica (una sola
-- tasa visible) -- se carga esa tasa unica, documentando la ausencia de
-- distincion explicitamente en cada nota.
insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','NGN',1885.05,0.00,'nala','GB','NG',false,-2.65,0.01,null,'nala.com, widget de home (la URL de corredor directo GB/NG devolvio 404), 500 GBP. Fee no desglosado por separado -- el sitio dice cobrar comision "en ciertas transacciones" pero no la mostro en este calculo; posible que el costo este dentro de la tasa. Sin distincion regular/promo en el calculador. Mid-market xe.com 1836.4618 (02:36 UTC)','2026-08-25','sin_confirmar');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','INR',130.000,0.99,'taptap-send','GB','IN',false,-0.03,0.01,null,'taptapsend.com/en/send-money-to/india, 500 GBP (selector de pais emisor cambiado de US a UK). Fee 0.99 GBP sin variar entre 100 y 500 GBP. Sin distincion regular/promo en el calculador. Mid-market xe.com 129.96281621 (15:54 UTC)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('USD','INR',95.412,3.99,'sendwave','US','IN',false,0.01,0.01,null,'sendwave.com/en-us/countries/india, 500 USD. Fee tiered: 1.99 USD a 100 USD, 3.99 USD a 500 USD (no plano) -- se carga el valor observado a 500 USD, no representativo de otros montos. Sin distincion regular/promo en el calculador. Mid-market xe.com 95.4182 (10:06 UTC)','2026-08-25','confirmado_activo');

insert into fx_rates (from_currency, to_currency, rate, fee, provider_slug, sending_country, receiving_country, is_local_fx, public_spread_percent, min_amount, max_amount, data_source, data_collected_at, verified_status) values
('GBP','INR',129.9,1.25,'lemfi','GB','IN',false,0.05,0.01,null,'lemfi.com/en-gb/international-money-transfer, 500 GBP (no existe URL directa GB->India, se navego por selector de moneda receptora). Fee 1.25 GBP flat, sin variar entre 100 y 500 GBP. Sin distincion regular/promo en el calculador. Mid-market xe.com 129.96281621 (15:54 UTC)','2026-08-25','confirmado_activo');
