-- Poblar providers.fee_tiers para BDO Remit y Money2India con el mismo dato
-- ya verificado que existe en fx_rates (US->PH y US->IN respectivamente).
-- Motivo: con ENABLE_CORRIDOR_FILTERING apagado (estado actual de produccion),
-- compareProviders() nunca consulta fx_rates -- usa resolveTier() sobre
-- providers.fee_tiers/fee_percent/fee_fixed/spread_percent para TODOS los
-- proveedores. Como fee_tiers estaba vacio, estos dos proveedores se
-- mostraban con fee=0 y spread=0 (gratis) en cualquier comparacion real,
-- pese a tener datos reales y verificados sentados sin usar en fx_rates.
-- Este fix no inventa ningun numero nuevo: es un espejo exacto de las filas
-- de fx_rates ya cargadas con fuente citada (PDF oficial BDO / World Bank RPW).

update providers
set fee_tiers = '[
  {"max": 699.99, "fee_fixed": 7, "spread_percent": 0.8},
  {"min": 700, "max": 1999.99, "fee_fixed": 8, "spread_percent": 0.8},
  {"min": 2000, "max": 4999.99, "fee_fixed": 10, "spread_percent": 0.8},
  {"min": 5000, "max": 7499.99, "fee_fixed": 15, "spread_percent": 0.8},
  {"min": 7500, "max": 9999.99, "fee_fixed": 20, "spread_percent": 0.8},
  {"min": 10000, "fee_fixed": 25, "spread_percent": 0.8}
]'::jsonb,
notes = coalesce(notes, '') || ' fee_tiers poblado 25 ago 2026 desde el mismo dato ya verificado en fx_rates (US->PH) -- antes quedaba en 0 cuando ENABLE_CORRIDOR_FILTERING esta apagado.'
where slug = 'bdo-remit';

update providers
set fee_tiers = '[
  {"max": 999.99, "fee_fixed": 4, "spread_percent": 0.74},
  {"min": 1000, "fee_fixed": 0, "spread_percent": 0.74}
]'::jsonb,
notes = coalesce(notes, '') || ' fee_tiers poblado 25 ago 2026 desde el mismo dato ya verificado en fx_rates (US->IN) -- antes quedaba en 0 cuando ENABLE_CORRIDOR_FILTERING esta apagado.'
where slug = 'money2india';
