insert into fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
(
  'TZS', 'USD', 0.000348, 0, 'ofx',
  'TZ', 'US', false,
  8.07,
  'Monito.com (tarjeta de OFX), corredor Tanzania->Estados Unidos, envio de 500.000 TZS. Fee "Gratis" (0). Tasa aplicada 0,000348, tipo de cambio medio 0,000379 (dados directamente), recibido 174.00 USD, "8,07% peor" -- coincide con el costo real (fee $0, no requiere correccion). Medido con TinyFish (browsing agent). Investigado 9-sep-2026 (research v26 Seccion 1.2).',
  '2026-09-09', 'sin_confirmar'
),
(
  'TZS', 'EUR', 0.000299, 0, 'ofx',
  'TZ', 'DE', false,
  8.14,
  'Monito.com (tarjeta de OFX), corredor Tanzania->Alemania, envio de 500.000 TZS. Fee "Gratis" (0). Tasa aplicada 0,000299, tipo de cambio medio 0,000326 (dados directamente), recibido 149.50 EUR, "8,14% peor" -- coincide con el costo real (fee $0, no requiere correccion). Medido con TinyFish (browsing agent). Investigado 9-sep-2026 (research v26 Seccion 1.2).',
  '2026-09-09', 'sin_confirmar'
);
