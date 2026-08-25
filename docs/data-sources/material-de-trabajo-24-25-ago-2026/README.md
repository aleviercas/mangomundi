# Material de trabajo — sesión 24-25 ago 2026 ("otras regiones")

Esta carpeta guarda los **archivos de contexto originales/crudos** que se usaron
durante la sesión de investigación y carga de corredores del 24-25 de agosto de
2026, subidos tal cual para trazabilidad completa — no son la versión final a
leer primero. **Para la versión consolidada y pulida, ver `docs/data-sources/`
(un nivel arriba) y `docs/handoff/2026-08-25-traspaso-otras-regiones-y-fix-ci.md`.**

## Qué es cada archivo

- **`diagnostico-arquitectura-proveedores-borrador.md`** — borrador de trabajo
  del diagnóstico de arquitectura (24-ago). La versión final publicada es
  `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`.
- **`research-tarifas-escalonadas-13-proveedores-original.md`** — research
  original de tarifas escalonadas de los 13 proveedores dinámicos. Se fusionó
  (junto con los dos archivos siguientes) en
  `docs/data-sources/2026-08-25-research-tarifas-y-cobertura-argentina.md`.
- **`global66-argentina-original.md`** — investigación original de si Global66
  opera corredores hacia Argentina. También fusionada en el doc de Argentina.
- **`gaps-confirmados-sin-precio.md`** — borrador de trabajo intermedio (notas
  de corredores confirmados por fuente primaria, pendientes de cotizar) que se
  fusionó en `docs/data-sources/2026-08-25b-auditoria-cobertura-otras-regiones.md`.
- **`auditoria-otras-regiones-v2-borrador.md`** y
  **`auditoria-otras-regiones-v3-borrador.md`** — versiones intermedias
  (después de la tanda 3 y después de la tanda 5, respectivamente) del
  documento de auditoría de "otras regiones", conservadas para ver la
  evolución del research tanda por tanda. La versión v3 es prácticamente
  idéntica a la publicada en `docs/data-sources/2026-08-25b-auditoria-cobertura-otras-regiones.md`
  (que además fue editada una vez más después de v3 para corregir notas).
- **`migration_corridor_gaps.sql`**, **`migration_otras_regiones_1.sql`** a
  **`migration_otras_regiones_5.sql`** (incluyendo `_4_updates`) — los archivos
  SQL de trabajo tal como se generaron en cada tanda, antes de espejarse a
  `supabase/migrations/` con sus nombres y versiones reales. **Estos archivos
  NO deben copiarse a `supabase/migrations/`** — ya fueron aplicados a
  producción y espejados ahí con la versión real que asigna Supabase (ver el
  handoff, sección 1, sobre el incidente de CI que causó justamente mezclar
  timestamps inventados). Se guardan acá solo como referencia histórica de qué
  se corrió y en qué orden.

## Regla que aplica a todo este material

Igual que en el resto del repo: solo precio regular/estándar, nunca
promocional, con fuente primaria y fecha de acceso citadas inline en cada
archivo. Donde un archivo usa una convención de signo distinta a la del resto
del catálogo (spread positivo/negativo), la migración final aplicada a
Supabase ya normalizó todo a la convención única documentada en el handoff —
estos borradores pueden no reflejar esa normalización final.
