-- Research v13 (2026-09-02, ADDENDUM #7): 2 new fx_rates rows, both for
-- China as a new origin country for the project (China had zero prior
-- rows anywhere as a SENDING country -- it only appeared before as a
-- receiving country in CA->CN, JP->CN, KR->CN, US->CN rows from an
-- earlier generic bulk load). Both providers had ZERO prior rows for
-- these exact corridors, and both give explicit rate + fee figures
-- (not just a Monito badge percentage), unlike the Corea del Sur data
-- withheld in v12.
--
-- China->Filipinas (Wise, research v13 Section 1.1/1.3): fee 27,38 CNY,
-- applied FX rate 9,3178 CNY/PHP -- verified arithmetically in the
-- research itself ((1.000-27,38)*9,3178 = 9.061,98 PHP, matching the
-- 9.063 PHP shown, difference is rounding only). Confirms, in a new
-- country, Wise's already well-established pattern in this project of
-- applying the true mid-market rate with only its declared fee as cost
-- (public_spread_percent = 0, same convention as every other Wise row).
-- Loaded sin_confirmar (Monito-card-sourced, not a direct wise.com
-- measurement, consistent with the project's rule of sin_confirmar for
-- Monito-derived inserts even when the underlying data is clean).
--
-- China->Pakistan (OFX, research v13 Section 1.1): no fee, applied rate
-- 39,3105 CNY/PKR vs. mid-market 41,2656 (both given explicitly in the
-- source; 20.000 CNY x 39,3105 = 786.210 PKR matches exactly). Margin
-- 4,74%. Loaded sin_confirmar, WITH the source's own caveat carried into
-- the comment: Monito shows only "5 comparisons in the last 3 months"
-- for this corridor, the lowest usage volume of any corridor in the
-- project so far -- the number itself is concrete (explicit rate/fee,
-- not a badge percentage), but should be treated as thin evidence for a
-- niche corridor, not a well-established figure.
--
-- NOT loaded from v13: Corea del Sur->Filipinas retroactive
-- cross-reference is not part of this file (see v12 migration/doc) --
-- v13 itself only opens China. The SAFE (Administracion Estatal de
-- Divisas) USD 50.000/year capital-control finding that explains China's
-- thin Monito coverage (research v13 Section 1.2) is a regulatory/
-- methodological finding, not an fx_rates data point -- documented in
-- the addendum doc's "Nota de estado" only.
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
