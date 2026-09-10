INSERT INTO fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) VALUES
(
  'GBP', 'PLN', 5.03, 0, 'transfergo',
  'GB', 'PL', false,
  0.35,
  'transfergo.com/en/send-money-to-poland (pagina dedicada por pais destino, no la calculadora de la home que tiene un bug confirmado por el propio sitio), cotizador sin login. Corredor "insignia" de TransferGo (gran diaspora polaca en UK). Mid-market xe.com: 5.04741 PLN/GBP. Investigado 2-sep-2026 (research v9).',
  '2026-09-02', 'confirmado_activo'
),
(
  'EUR', 'UAH', 50.63, 0, 'transfergo',
  'DE', 'UA', false,
  1.84,
  'transfergo.com, cotizacion por defecto sin login (Alemania->Ucrania). Mid-market xe.com: 51.5812 UAH/EUR. Margen 5x mas alto que el corredor UK->Polonia (0.35%) medido el mismo dia -- confirma que TransferGo NO tiene un margen uniforme entre corredores (varia fuerte segun liquidez/volumen del corredor especifico, UAH ademas tiene controles de cambio). Cargado sin_confirmar por prudencia: es un dato real medido pero explicitamente no representativo de otros corredores de TransferGo -- ver research v9 addendum Seccion 8.2/9.1 para el detalle metodologico. NO extrapolar este ni el de GB-PL a corredores no medidos de TransferGo.',
  '2026-09-02', 'sin_confirmar'
),
(
  'GBP', 'INR', 127.828, 0, 'instarem',
  'GB', 'IN', false,
  0.31,
  'instarem.com, cotizador sin login, 1.000 GBP, tasa regular (NO la promocional de bienvenida -- InstaReM SI tiene mecanismo de tasa promocional de primera transferencia, confirmado esta ronda, pero esta fila es la tasa regular sin activar la promo). Mid-market xe.com: 128.2247 INR/GBP. Consistente con el 0.09% medido en Australia->Filipinas via World Bank RPW Q3 2025 (research v9 Seccion 6.1) -- InstaReM confirma perfil similar a Wise (fee bajo + margen minimo). Investigado 2-sep-2026 (research v9).',
  '2026-09-02', 'confirmado_activo'
);
