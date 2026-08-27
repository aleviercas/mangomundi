
## 4. Estado de los datos (última auditoría: sprint ago 2026)

- **`providers`:** 62 filas (43 Tipo A / 19 Tipo B), todas con `trust_score`
  poblado salvo CAB Payments (a propósito — es infraestructura B2B sin
  reviews de consumidor, ver `docs/multi-criteria-ranking/scoring-data-findings.md`)
  y los 3 bancos locales agregados en las últimas dos rondas (`bdo-remit`,
  `money2india`, `ubl-tezraftaar` — trust_score todavía sin investigar, no es
  urgente porque el motor de scoring los trata como neutral mientras tanto).
- **`fx_rates`:** 821 filas, 248 corredores distintos. 100% de las 650
  combinaciones (proveedor, corredor) del catálogo maestro original
  (`docs/handoff/catalogo_mundial_final.csv`, 684 filas / World Bank RPW
  Q3 2025) están cargadas. Cero proveedor Tipo A activo sin datos.
  `verified_status`: 749 `confirmado_activo` / 72 `sin_confirmar` (tras la
  auditoría de fees sospechosos del 27-ago, sesión Cowork — ver
  `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md`: 16 filas de LemFi
  y Remitly bajadas por el mismo patrón de contaminación promocional
  detectado en Western Union GB→AR — fee=0 cargado con fuente genérica que
  en realidad correspondía a la tasa de primera transferencia, no a la
  regular). Sigue pendiente re-verificar esas 16 filas (y un duplicado sin
  resolver en LemFi GB-NG) con navegador real — no disponible en esa sesión.
- **`transparency_score`:** null en absolutamente todos los proveedores, a
  propósito — se sacó del motor de scoring (`most_transparent` profile
  eliminado) por no existir ninguna fuente documentada para ese número en
  todo el repo. No es un hueco a rellenar salvo que aparezca una fuente real.
- **Corredores documentados como excluidos** (`corridor_notes`): Alemania→Rusia
  y Alemania→Siria (sanciones — los proveedores grandes no operan ahí de
  forma confiable), Suecia/Noruega→Somalia (dominado por especialistas hawala
  fuera del catálogo — hace falta sumar un proveedor nuevo, no solo cargar
  tarifas).
