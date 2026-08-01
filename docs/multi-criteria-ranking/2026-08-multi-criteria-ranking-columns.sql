-- ⚠️ DRAFT — NO EJECUTADO. Revisar y correr manualmente en el editor SQL de
-- Supabase cuando Alejandro lo apruebe. Este archivo vive en la rama
-- feature/multi-criteria-ranking como documentación, pero Supabase no está
-- versionado por rama — correr esto afecta la base de producción al toque.
--
-- Agrega las columnas nuevas que necesita el motor de score compuesto
-- (src/lib/scoring.functions.ts). Todas NULLABLE, así que no rompe nada
-- existente ni bloquea el deploy actual de main.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS cash_pickup_available boolean,
  ADD COLUMN IF NOT EXISTS business_focus_score numeric, -- escala 0-10
  ADD COLUMN IF NOT EXISTS countries_covered integer,
  ADD COLUMN IF NOT EXISTS mobile_app_rating numeric, -- escala 0-5, App Store/Play Store
  ADD COLUMN IF NOT EXISTS has_exclusive_deal boolean DEFAULT false;

COMMENT ON COLUMN providers.has_exclusive_deal IS
  'Oferta/código exclusivo negociado por mangomundi. SIEMPRE debe renderizarse con label explícito "Oferta exclusiva mangomundi" en el frontend — nunca se mezcla invisible en el score general (ver best_deal profile en scoring.functions.ts).';

COMMENT ON COLUMN providers.cash_pickup_available IS
  'Si el proveedor ofrece retiro en efectivo como método de entrega, no solo transferencia bancaria.';
COMMENT ON COLUMN providers.business_focus_score IS
  '0-10, criterio editorial: qué tan orientado a empresas está el producto (cuentas multi-moneda, tarjetas corporativas, gestión de gastos) vs. remesas P2P puras.';
COMMENT ON COLUMN providers.countries_covered IS
  'Cantidad de países/corredores soportados, según lo publica el proveedor.';
COMMENT ON COLUMN providers.mobile_app_rating IS
  'Rating promedio App Store / Play Store, cuando esté disponible.';

-- Ejemplo de carga (reemplazar con datos reales verificados, ver
-- scoring-data-findings.md para las fuentes de cada valor):
--
-- UPDATE providers SET trust_score = 4.3, review_count = 294000 WHERE slug = 'wise';
-- UPDATE providers SET trust_score = 4.6, review_count = 116000, cash_pickup_available = true WHERE slug = 'remitly';
-- UPDATE providers SET trust_score = 4.7, review_count = 429000 WHERE slug = 'revolut';
-- UPDATE providers SET trust_score = 4.3, review_count = 165000, cash_pickup_available = true WHERE slug = 'western-union';
-- UPDATE providers SET trust_score = 4.0, review_count = 95000, cash_pickup_available = true WHERE slug = 'worldremit';
-- UPDATE providers SET trust_score = 4.0, review_count = 47000, cash_pickup_available = true WHERE slug = 'moneygram';
-- UPDATE providers SET trust_score = 3.5, review_count = 2300, business_focus_score = 8.5 WHERE slug = 'airwallex';
