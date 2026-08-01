-- ⚠️ DRAFT — NO EJECUTADO. Revisar y correr manualmente en el editor SQL de
-- Supabase cuando Alejandro lo apruebe. Este archivo vive en la rama
-- feature/multi-criteria-ranking como documentación, pero Supabase no está
-- versionado por rama — correr esto afecta la base de producción al toque.
--
-- Agrega las columnas nuevas que necesita el motor de score compuesto
-- (src/lib/scoring.functions.ts). Todas NULLABLE, así que no rompe nada
-- existente ni bloquea el deploy actual de main.

-- ⚠️ IMPORTANTE: los `slug` usados abajo (ej. 'wise', 'ofx', 'xe-money-transfer')
-- son mi mejor estimación del patrón de slugs de la tabla, pero NO los verifiqué
-- contra el valor real en Supabase. Antes de correr cualquier UPDATE, confirmar
-- con `SELECT slug, name FROM providers ORDER BY name;` que coinciden exactamente
-- — si no, el UPDATE simplemente no afecta ninguna fila (no rompe nada, pero
-- tampoco carga el dato).

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

-- ============================================================================
-- UPDATEs con datos reales investigados (ver scoring-data-findings.md para
-- fuentes completas y notas). Faltan: Convera, Xoom, Skrill, TapTap Send
-- (cash pickup), Sendwave, LemFi, NALA, Atlantic Money (ver alerta en
-- scoring-data-findings.md antes de cargar su trust_score).
-- NADA de esto se ejecutó contra Supabase — es un draft para revisión.
-- ============================================================================

-- Tier 1
UPDATE providers SET trust_score = 4.3, review_count = 294000 WHERE slug = 'wise';
UPDATE providers SET trust_score = 4.6, review_count = 116000, cash_pickup_available = true WHERE slug = 'remitly';
UPDATE providers SET trust_score = 4.7, review_count = 429000 WHERE slug = 'revolut';
UPDATE providers SET trust_score = 4.3, review_count = 165000, cash_pickup_available = true WHERE slug = 'western-union';
UPDATE providers SET trust_score = 4.7, review_count = 36000 WHERE slug = 'taptap-send'; -- cash_pickup_available: pendiente
UPDATE providers SET trust_score = 4.3, review_count = 36000 WHERE slug = 'ria-money-transfer';
UPDATE providers SET trust_score = 4.0, review_count = 95000, cash_pickup_available = true WHERE slug = 'worldremit';
UPDATE providers SET trust_score = 4.0, review_count = 47000, cash_pickup_available = true WHERE slug = 'moneygram';
UPDATE providers SET trust_score = 3.5, review_count = 2300, business_focus_score = 8.5 WHERE slug = 'airwallex';
UPDATE providers SET trust_score = 4.3, review_count = 11200, cash_pickup_available = false, supports_large_tickets = true, countries_covered = 170, mobile_app_rating = 4.75 WHERE slug = 'ofx';

-- Tier 2
UPDATE providers SET trust_score = 4.2, review_count = 63000, cash_pickup_available = true, countries_covered = 195, business_focus_score = 3 WHERE slug = 'xe-money-transfer';
UPDATE providers SET trust_score = 4.85, review_count = 18500, business_focus_score = 4 WHERE slug = 'currencies-direct';
UPDATE providers SET trust_score = 4.85, review_count = 9000, supports_large_tickets = true, business_focus_score = 5 WHERE slug = 'torfx';
UPDATE providers SET trust_score = 3.6, business_focus_score = 9 WHERE slug = 'payoneer';
UPDATE providers SET trust_score = 4.7, review_count = 7000, supports_large_tickets = true, business_focus_score = 5 WHERE slug = 'moneycorp';
UPDATE providers SET trust_score = 4.4, review_count = 7000 WHERE slug = 'instarem';

-- Tier 3
UPDATE providers SET trust_score = 4.6, review_count = 38500 WHERE slug = 'transfergo';
UPDATE providers SET trust_score = 4.15, review_count = 41000 WHERE slug = 'paysend';
UPDATE providers SET trust_score = 4.6, review_count = 10000 WHERE slug = 'currencyfair'; -- ver nota de fuentes dispersas en findings.md

-- ⚠️ Atlantic Money: NO cargar sin que Alejandro confirme el tier tras leer
-- la alerta en scoring-data-findings.md (rating cayó de 4.1 a 2.3-2.7 reciente).
-- UPDATE providers SET trust_score = 2.5, review_count = 175 WHERE slug = 'atlantic-money';
