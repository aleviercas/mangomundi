-- 2026-09-11: real live screenshots of Global66's calculator, provided
-- directly by the user (the JS-only calculator can't be scraped by this
-- session's tools -- browser automation was attempted and cancelled by
-- the user; manual screenshots were the working alternative).
--
-- REFERENCE RATE METHODOLOGY NOTE (important, read before trusting these
-- numbers too far): dolarapi.com's ARS "blue" feed returned a
-- fechaActualizacion of 2026-09-05 when queried live today (2026-09-11) --
-- appears stale by ~6 days. Global66's OWN buy/sell USDT quotes (1631.12
-- ARS/USDT selling, 1575.15 ARS/USDT buying) imply a current market ARS/USD
-- around 1603 (their own midpoint), materially higher than dolarapi's
-- blue=1540. Used a compromise reference (1571.5, midpoint of 1540 and
-- 1603) for all margin calculations below, flagged explicitly as
-- provisional -- a materially better ARS/USD reference should replace
-- this in the next research round (this affects the WHOLE project's
-- recent ARS-denominated margin estimates, not just Global66, since
-- dolarapi.com is the project's standard ARS reference -- see also the
-- caveat this raises for anything computed against "blue" in the last
-- week).
--
-- EUR/USD=1.161, GBP/USD=1.351 (live market rates, xe.com/yahoo finance,
-- 2026-09-11).

-- AR->ES: update existing row (was 5.28%, Monito-sourced, 2026-09-02) with
-- the new direct Global66 screenshot measurement.
update public.fx_rates
set rate = 0.000517,
    public_spread_percent = 5.90,
    data_source = 'Captura de pantalla proporcionada directamente por el usuario, calculadora propia de global66.com (no vía Monito), corredor Argentina->Espana, envio de 200.000 ARS. Fee 0,00 ARS (sin costo de envio, sin costo de conversion de destino, sin costos operacionales -- desglose completo mostrado en el "Detalle completo" del sitio). Tasa aplicada 1 EUR = 1.932,23 ARS. Recibe 103,50 EUR. Margen calculado contra referencia EUR/ARS de 1.824,51 (ARS/USD=1.571,5 compromiso, ver nota metodologica al inicio de esta migracion, x EUR/USD=1,161 en vivo): 5,90%. ACTUALIZA la fila previa (5,28%, Monito, 2026-09-02) -- misma magnitud, diferencia atribuible a la incertidumbre de referencia documentada, no a un cambio real de politica de Global66. Investigado 11-sep-2026.',
    data_collected_at = '2026-09-11',
    verified_status = 'sin_confirmar'
where id = 'a08763e3-1bfc-4d16-8a88-af0a33b8a031';

-- AR->IT: same reused-value convention already established for this pair
-- (Global66 prices by currency, not by country -- confirmed originally in
-- research v15).
update public.fx_rates
set rate = 0.000517,
    public_spread_percent = 5.90,
    data_source = 'Reutiliza la medicion de Argentina->Espana (misma moneda EUR, mismo criterio ya establecido en research v15: Global66 cotiza por moneda, no por pais). Ver fila AR->ES para el detalle completo de la fuente. Investigado 11-sep-2026.',
    data_collected_at = '2026-09-11',
    verified_status = 'sin_confirmar'
where id = '79a26dd4-9bd6-4986-bc16-24e2ac9f2ad4';

-- AR->GB: nuevo, corredor de salida (ARS->GBP).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values (
  'ARS', 'GBP', 0.000447, 0, 'global66',
  'AR', 'GB', false, 6.02,
  'Captura de pantalla proporcionada directamente por el usuario, calculadora propia de global66.com, corredor Argentina->Reino Unido, envio de 163.328 ARS. Fee 0,00 ARS. Tasa aplicada 1 GBP = 2.250,90 ARS. Recibe 73 GBP. Margen calculado contra referencia GBP/ARS de 2.123,10 (ver nota metodologica de ARS/USD en la fila AR->ES de esta misma migracion, x GBP/USD=1,351 en vivo): 6,02%. Corredor nuevo para Global66 en este proyecto. Investigado 11-sep-2026.',
  '2026-09-11', 'sin_confirmar'
);

-- GB->AR: nuevo, corredor de ENTRADA (remesa real hacia Argentina) -- el
-- mas relevante para la investigacion de remesas entrantes en curso.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values (
  'GBP', 'ARS', 2067.38, 4.01, 'global66',
  'GB', 'AR', false, 7.97,
  'Captura de pantalla proporcionada directamente por el usuario, calculadora propia de global66.com, corredor Reino Unido->Argentina (ENTRADA), envio de 73 GBP. Fee 4,01 GBP (5,49% del monto -- notablemente mas alto que el fee de USDT->ARS medido el mismo dia, ver research). Tasa aplicada 1 GBP = 2.067,38 ARS sobre el monto convertido (68,99 GBP). Recibe 142.628 ARS. Costo real calculado contra referencia GBP/ARS de 2.123,10 (ver nota metodologica en fila AR->ES): 7,97%. Primer corredor de ENTRADA de Global66 hacia Argentina en el proyecto. Investigado 11-sep-2026.',
  '2026-09-11', 'sin_confirmar'
);
