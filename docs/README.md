# Documentación de mangomundi

Índice de toda la documentación del proyecto — todo vive bajo `docs/` para que no haya que buscar en varios lados.

## Historial / contexto del proyecto

- [`ale.md`](./ale.md) — changelog de todo lo que se rediseñó/arregló en el sitio, sección por sección (qué está LIVE en producción).
- [`MIGRATION.md`](./MIGRATION.md) — historial completo de la migración de Lovable a GitHub + Vercel + Supabase propio (por fases, con todo lo verificado en cada una).

## Research de datos y arquitectura

- [`data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`](./data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md) — diagnóstico de por qué desaparecen proveedores en ciertos corredores (caso Western Union UK→Argentina), mapeo de fuentes de datos de clase mundial (World Bank RPW, Wise Comparison API, Airwallex, FX local), y arquitectura propuesta para cobertura completa con transparencia sobre el origen de cada dato. Documento vivo — se actualiza in-place a medida que avanza el research. Sección 4.2 propone `dolarapi.com`/`esjs-dolar-api` para el problema de tipo de cambio dual (ARS/VES); ver el research v26 de abajo para la primera vez que esa fuente se usó y validó en la práctica.
- [`data-sources/2026-09-03-research-v16-v25-margen-moneda-volatil.md`](./data-sources/2026-09-03-research-v16-v25-margen-moneda-volatil.md) — hilo "moneda volátil → margen de remesas" (v16-v25): hipótesis de que el origen en moneda volátil/en crisis se asocia con un margen más alto, probada con "termómetros" controlados (Western Union Chile vs. Argentina, Skrill Kenia, OFX multi-origen, clúster Mukuru de 7 países africanos), más el hallazgo metodológico central (Monito subestima el costo real cuando hay comisión fija) y más de 25 países documentados con cobertura cero y su mecanismo asociado (sanciones, control cambiario, guerra, mercado informal).
- [`data-sources/2026-09-09-research-v26-tanzania-venezuela-asia-central.md`](./data-sources/2026-09-09-research-v26-tanzania-venezuela-asia-central.md) — continuación del hilo anterior: Tanzania→EEUU/Alemania medido en vivo (OFX, cargado a Supabase); Venezuela medido en vivo con el mismo problema de tipo de cambio dual que el ARS, resuelto encontrando `dolarapi.com` como fuente de referencia correcta (oficial vs. paralelo); Asia Central/Cáucaso identificado como región con disrupción activa de mercado (Monito sin cobertura, KoronaPay cerrando su autorización regulatoria) — no verificable con la metodología del proyecto por ahora.
- [`data-sources/2026-09-09-reconciliacion-fx-rates-vs-research.md`](./data-sources/2026-09-09-reconciliacion-fx-rates-vs-research.md) — auditoría de las 24 filas de `fx_rates` cargadas del research v16-v25 contra la fórmula real de combinación spread+fee. Conclusión: las 24 ya estaban bien cargadas, ninguna necesitó corrección — documenta también por qué una primera lectura ingenua sugería lo contrario (comparar `public_spread_percent` directo contra "costo real" no es válido, `fee` vive aparte).
- [`data-sources/2026-09-09-handoff.md`](./data-sources/2026-09-09-handoff.md) — handoff de la sesión que produjo el research v26 (sin acceso de escritura a GitHub) hacia la siguiente sesión con acceso. Documenta el protocolo de fetch→diff→clone→push sin force que se usa como regla general antes de escribir al repo.
- [`data-sources/2026-09-10-research-venezuela-asia-central-profundizacion.md`](./data-sources/2026-09-10-research-venezuela-asia-central-profundizacion.md) — resuelve la fila de Venezuela del research v26 (la cifra vieja Y la recalculada eran ambas la tasa promocional de primera transferencia de Remitly; se midió la tasa regular y se cargó confirmada, 6.30%) y profundiza Asia Central/Cáucaso con un hallazgo negativo concreto: Profee (la alternativa a KoronaPay identificada en v26) no soporta Rusia como país de origen — confirmado por redirect directo, no solo ausencia de cobertura.

## Research de scoring / ranking multi-criterio

- [`multi-criteria-ranking/scoring-data-findings.md`](./multi-criteria-ranking/scoring-data-findings.md) — research de trust_score, review_count, cash_pickup_available, business_focus_score por proveedor, con fuente citada por dato.
- [`multi-criteria-ranking/delivery-methods-findings.md`](./multi-criteria-ranking/delivery-methods-findings.md) — research de métodos de entrega (card payout, cash pickup) por proveedor.

## Rediseño de producto

- [`handoff/handoff-2026-08-29-rediseno-mangomundi-4.md`](./handoff/handoff-2026-08-29-rediseno-mangomundi-4.md) — handoff en curso del rediseño "Mangomundi 4" (home, comparador, modo Business, widget, identidad de marca): qué se pidió, qué ya se implementó, decisiones de producto ya tomadas y qué falta. Léelo antes de tocar `design/HANDOFF.md` o cualquiera de las secciones del home.

## SEO

- [`handoff/handoff-2026-09-09-auditoria-seo-completa.md`](./handoff/handoff-2026-09-09-auditoria-seo-completa.md) — auditoría técnica completa (sitemap, redirects, metadatos/i18n, datos estructurados, encabezados, imágenes) con hallazgos verificados contra el código y un plan de acción priorizado. Léelo antes de tocar `sitemap[.]xml.ts`, cualquier `head()` de ruta, o `SEO_META`/`ROUTE_SEO` en `i18n.tsx`.
- [`handoff/handoff-2026-09-10-plan-urls-por-idioma.md`](./handoff/handoff-2026-09-10-plan-urls-por-idioma.md) — análisis y plan (sin implementar) de si migrar de `?lang=` a URLs propias por idioma (ej. `/es/blog/...`). Hallazgo clave: el selector de idioma hoy no navega, es sólo estado de cliente — migrar invierte ese modelo, no es sólo agregar un segmento de path. Léelo antes de tocar `I18nProvider`, `LangSwitcher.tsx`, o el esquema de rutas de `src/routes/`.

## Operación

- [`blog-translation-runbook.md`](./blog-translation-runbook.md) — cómo continuar la traducción del blog a los 20 idiomas soportados.

---

**Convención:** cada research nuevo se documenta acá (no en el chat de una sesión puntual) para que cualquier sesión de Claude con acceso al repo pueda retomarlo sin repetir trabajo. Nunca se corre nada contra la base de producción (Supabase) sin aprobación explícita de Alejandro — ver la nota en cada doc de research.
