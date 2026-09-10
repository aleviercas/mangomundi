INSERT INTO fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) VALUES (
  'EUR', 'ARS', 1779.13, 2.49, 'moneygram',
  'ES', 'AR', false,
  -1.56,
  'moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/, cotizador publico sin login, tasa "regular" (excluye promocional de 1a transferencia online: 1858.02 ARS, fee 0). Mid-market xe.com al momento de la medicion: 1751.7589 ARS/EUR -- la tasa regular de MoneyGram queda 1.56% POR ENCIMA del mid-market (spread negativo), a diferencia del patron usual, porque el ARS cotiza con banda cambiaria/multiples referencias desde abr-2025; no es una senal de tarifa promocional (ver research v8 addendum Seccion 1 para el detalle metodologico). Investigado 2-sep-2026.',
  '2026-09-02',
  'confirmado_activo'
);
