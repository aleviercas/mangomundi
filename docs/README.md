# Documentación de mangomundi

Índice de toda la documentación del proyecto — todo vive bajo `docs/` para que no haya que buscar en varios lados.

## Historial / contexto del proyecto

- [`ale.md`](./ale.md) — changelog de todo lo que se rediseñó/arregló en el sitio, sección por sección (qué está LIVE en producción).
- [`MIGRATION.md`](./MIGRATION.md) — historial completo de la migración de Lovable a GitHub + Vercel + Supabase propio (por fases, con todo lo verificado en cada una).

## Research de datos y arquitectura

- [`data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`](./data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md) — diagnóstico de por qué desaparecen proveedores en ciertos corredores (caso Western Union UK→Argentina), mapeo de fuentes de datos de clase mundial (World Bank RPW, Wise Comparison API, Airwallex, FX local), y arquitectura propuesta para cobertura completa con transparencia sobre el origen de cada dato. Documento vivo — se actualiza in-place a medida que avanza el research.

## Research de scoring / ranking multi-criterio

- [`multi-criteria-ranking/scoring-data-findings.md`](./multi-criteria-ranking/scoring-data-findings.md) — research de trust_score, review_count, cash_pickup_available, business_focus_score por proveedor, con fuente citada por dato.
- [`multi-criteria-ranking/delivery-methods-findings.md`](./multi-criteria-ranking/delivery-methods-findings.md) — research de métodos de entrega (card payout, cash pickup) por proveedor.

## Operación

- [`blog-translation-runbook.md`](./blog-translation-runbook.md) — cómo continuar la traducción del blog a los 20 idiomas soportados.

---

**Convención:** cada research nuevo se documenta acá (no en el chat de una sesión puntual) para que cualquier sesión de Claude con acceso al repo pueda retomarlo sin repetir trabajo. Nunca se corre nada contra la base de producción (Supabase) sin aprobación explícita de Alejandro — ver la nota en cada doc de research.
