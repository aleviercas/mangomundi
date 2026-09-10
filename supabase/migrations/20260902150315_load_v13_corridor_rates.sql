insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('CNY', 'PHP', 9.3178, 27.38, 'wise', 'CN', 'PH', false, 0.00,
   'Monito.com (tarjeta de Wise), corredor China->Filipinas, envio de 1.000 CNY. Fee explicito 27,38 CNY, tipo de cambio aplicado 9,3178 CNY/PHP -- verificado aritmeticamente en el research: (1.000-27,38)*9,3178 = 9.061,98 PHP, contra los 9.063 PHP mostrados (diferencia solo de redondeo). Sin margen oculto en el tipo de cambio, coherente con el patron ya establecido de Wise en el resto del proyecto (spread=0, todo el costo va en el fee declarado). Primera fila del proyecto con China como pais de ORIGEN (antes solo aparecia como destino). Zero filas previas para este corredor. Investigado 2-sep-2026 (research v13 Seccion 1.1/1.3).',
   '2026-09-02', 'sin_confirmar'),

  ('CNY', 'PKR', 39.3105, 0, 'ofx', 'CN', 'PK', false, 4.74,
   'Monito.com (tarjeta de OFX), corredor China->Pakistan, envio de 20.000 CNY. Sin fee, tipo de cambio aplicado 39,3105 CNY/PKR vs. mid-market 41,2656 (ambos dados explicitamente en la fuente; 20.000*39,3105=786.210 PKR, coincide exacto con el monto mostrado). Margen 4,74%. ADVERTENCIA de la propia fuente: Monito muestra solo "5 comparaciones en los ultimos 3 meses" para este corredor -- el volumen de uso mas bajo de cualquier corredor del proyecto hasta ahora. El numero en si es concreto (tasa y fee explicitos, no un badge de porcentaje de Monito como el caso de Corea del Sur en v12 Seccion 6.2, que por eso no se cargo), pero debe tratarse como evidencia delgada de un corredor de nicho, no como una cifra bien establecida. Zero filas previas para este corredor. Investigado 2-sep-2026 (research v13 Seccion 1.1).',
   '2026-09-02', 'sin_confirmar');
