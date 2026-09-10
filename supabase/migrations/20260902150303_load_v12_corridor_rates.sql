insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('NZD', 'PHP', 36.4783, 0, 'moneygram', 'NZ', 'PH', false, 3.04,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado (metodologia corregida de v11 Seccion 31.4, no el monto promocional de "tasa preferencial primera transferencia" que Monito usa para su badge): 17.684 PHP. Costo real recalculado directamente desde los montos crudos del documento: (18.239,15-17.684)/18.239,15 = 3,04%. NOTA: la tabla original del research v12 Seccion 2 mostraba esta cifra con signo negativo ("-3,04%"), pero la propia prosa de esa misma seccion dice explicitamente "costo real POSITIVO" -- se carga el signo positivo, recalculado de forma independiente a partir de los montos crudos, no transcripto de la tabla. Ver Nota de estado del documento para el detalle completo. Fee no desglosado por separado en la fuente (se pliega en el spread total, igual que el resto de esta corrida). Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'western-union', 'NZ', 'PH', false, 0.93,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado: 18.070 PHP. Costo real recalculado: (18.239,15-18.070)/18.239,15 = 0,93%. Mismo ajuste de signo que la fila de MoneyGram de este mismo corredor (ver ese comentario) -- la tabla original mostraba "-0,93%", corregido a positivo per la prosa de la Seccion 2. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'remitly', 'NZ', 'PH', false, 1.49,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). Monto real/recurrente usado: 17.968 PHP. Costo real recalculado: (18.239,15-17.968)/18.239,15 = 1,49%. Mismo ajuste de signo que las filas de MoneyGram/Western Union de este corredor -- tabla original mostraba "-1,49%", corregido a positivo per la prosa de la Seccion 2. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('NZD', 'PHP', 36.4783, 0, 'xe', 'NZ', 'PH', false, 0.91,
   'Monito.com, corredor Nueva Zelanda->Filipinas, envio de 500 NZD, mid-market 1 NZD = 36,4783 PHP (research v12 Seccion 2). XE Money Transfer: unico monto (sin insignia promocional), fee explicito 7 NZD, recibido 18.074 PHP. Costo real recalculado: (18.239,15-18.074)/18.239,15 = 0,91%. Mismo ajuste de signo que el resto de las filas de este corredor (tabla original "-0,91%", corregido a positivo per la prosa de la Seccion 2 que dice "costo real positivo" para las 4 filas de esta tabla). Fee conocido (7 NZD) mantenido en el comentario, pero no desglosado en la columna fee -- se pliega en el spread total para que las 4 filas de este corredor sean directamente comparables entre si, igual criterio usado para Global66 Colombia en v11. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('HKD', 'PHP', 7.9664, 0, 'instarem', 'HK', 'PH', false, 0.93,
   'Monito.com, corredor Hong Kong->Filipinas, transferencia de 1.000 HKD, mid-market 1 HKD = 7,9664 PHP (research v12 Seccion 4). InstaReM: variante NUEVA del patron promocional encontrada por primera vez en el proyecto -- la promocion es "cero comision en tu primera transferencia" (comision, no tipo de cambio distinto; el tipo de cambio 7,9452 es identico en ambos montos). Monto real/post-promo usado: 7.892 PHP (vs. 7.945 PHP promocional). Costo real: (7.966,4-7.892)/7.966,4 = 0,93%. Zero filas previas de InstaReM en este corredor. Sexto corredor de InstaReM en el proyecto con margen bajo, reconfirmando el patron. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('HKD', 'PHP', 7.9664, 0, 'moneygram', 'HK', 'PH', false, 2.28,
   'Monito.com, corredor Hong Kong->Filipinas, transferencia de 1.000 HKD, mid-market 1 HKD = 7,9664 PHP (research v12 Seccion 4). MoneyGram: sin insignia promocional visible en este corredor puntual, un solo monto (7.785 PHP) -- dato limpio. Costo real: (7.966,4-7.785)/7.966,4 = 2,28%. Zero filas previas de MoneyGram en este corredor. NOTA: Western Union tambien aparece en esta misma tabla de la Seccion 4 (7.843 PHP, ~1,55%) pero NO se carga aqui -- ya existe una fila confirmado_activo de western-union/HK/PH (2,7%) de una carga generica anterior, y la nueva cifra no coincide -- se documenta la discrepancia, no se sobrescribe (ver Nota de estado). Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'PHP', 0.3938, 0, 'instarem', 'JP', 'PH', false, 1.30,
   'Monito.com, corredor Japon->Filipinas, transferencia de 10.000 JPY, mid-market 1 JPY = 0,3938 PHP (research v12 Seccion 8.1). InstaReM: variante de comision promocional (mismo patron que Hong Kong, Seccion 4), gap chico entre monto promo (3.891 PHP) y real (3.887 PHP). Costo real usado: (3.938-3.887)/3.938 = 1,30% (cifra dada directamente por el research, verificada). Zero filas previas de InstaReM en este corredor. Western Union tambien medido en este corredor (5,05%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3%) de una carga generica anterior, documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'BRL', 0.032161, 0, 'instarem', 'JP', 'BR', false, -0.43,
   'Monito.com, corredor Japon->Brasil, transferencia de 50.000 JPY, mid-market 1 JPY = 0,032161 BRL (research v12 Seccion 8.1/8.2). InstaReM: SIN insignia promocional en este corredor puntual, un solo monto (1.615 BRL) -- dato limpio. Margen real: (1.615-50.000*0,032161)/(50.000*0,032161) = -0,43% (favorable, mejor que mid-market) -- tercer caso limpio de margen negativo documentado en el proyecto (junto a Xoom USD->MXN y Remitly AU->PH, ambos v11 Seccion 31), y el primero para InstaReM especificamente pese a su patron establecido de margen bajo-pero-positivo en sus otros 8 corredores. Zero filas previas de InstaReM en este corredor. Western Union tambien medido (3,98%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3,3%), documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar'),

  ('JPY', 'VND', 164.2717, 0, 'instarem', 'JP', 'VN', false, 0.82,
   'Monito.com, corredor Japon->Vietnam, transferencia de 11.000 JPY, mid-market 1 JPY = 164,2717 VND (research v12 Seccion 8.1/8.2). InstaReM: variante de comision promocional (mismo patron que Hong Kong y Japon->Filipinas), gap chico entre monto promo (1.794.003 VND) y real (1.792.205 VND). Costo real: (11.000*164,2717-1.792.205)/(11.000*164,2717) = 0,82% (cifra dada directamente por el research, verificada). Zero filas previas de InstaReM en este corredor. Western Union tambien medido (4,81%, limpio) pero NO se carga -- conflicto con fila confirmado_activo existente (3,2%), documentado como discrepancia. Investigado 2-sep-2026.',
   '2026-09-02', 'sin_confirmar');
