# Handoff — 1-sep-2026, ronda 13 (flash de tipografía + 3 truncados reales encontrados por auditoría)

Continúa `docs/handoff/handoff-2026-09-01-duodecimo-round-mobile-sort-widget-about-business.md`.
Rama: `claude/coordinar-trabajo-simultaneo-y85idz`. PR abierto: #10.

## Contexto

Alejandro reportó dos cosas en un solo mensaje: "hay cambios que no se
hicieron" (sin especificar cuáles) y el flash de tipografía al abrir la
página. Ante la falta de detalle en lo primero, se le preguntó cómo
prefería seguir — eligió que yo mismo auditara pantalla por pantalla en
vez de que él listara los faltantes.

## 1. Flash de tipografía ("el título está en negrita y después cambia la letra")

Causa real: `__root.tsx` cargaba Google Fonts con `&display=swap` — el
navegador pinta el texto con la fuente de respaldo (`ui-sans-serif,
system-ui, sans-serif`) de entrada y la reemplaza visiblemente por
Bricolage Grotesque en cuanto termina de descargar, más notorio en los
títulos grandes/negrita. Cambiado a `&display=optional`: el navegador le
da a la fuente una ventana muy corta (~100ms) para estar lista: si llega a
tiempo (normal en visitas repetidas, ya cacheada) se usa; si no, se queda
con la de respaldo sin volver a cambiar después. El título ya no salta.

## 2. Auditoría propia — 3 truncados reales encontrados (no reportados directamente, hallados revisando)

Verificados con Playwright (`getBoundingClientRect`/`scrollWidth` reales,
no supuestos) en `/business`, con captura antes/después de cada fix:

1. **País de origen truncado incluso en desktop** — la ronda V1 solo
   había arreglado el truncamiento en mobile (`triggerIconOnly` bajo
   768px); a 1280px "United Kingdom" seguía cortándose a "United Kin..."
   porque el input de monto (`flex-[1.4]`) le sacaba espacio al segmento
   de país (`flex-1`) en el mismo box agrupado. Rebalanceado a `flex-1`
   en ambos — probado con 10 países típicos de corredores reales (US,
   México, India, Filipinas, Nigeria, Argentina, Colombia, Polonia,
   Sudáfrica): 9/10 entran completos ahora (antes ninguno entraba, ni
   "United Kingdom"). Nombres muy largos como "Dominican Republic" o
   "United Arab Emirates" todavía truncan — trade-off aceptado, común en
   cualquier buscador compacto.
2. **Nombre del proveedor truncado por el badge "BEST OVERALL"** — en la
   fila destacada, nombre+badge compartían una sola línea en una columna
   fija de 224px; incluso "Provider 1" (10 caracteres) se cortaba a
   "Provid...". `flex-wrap` en vez de `truncate` en esa línea: el badge
   baja a su propia línea si no entra, el nombre (la info que identifica
   al proveedor) nunca se corta.
3. **Métodos de pago truncados** ("Bank · Ca..." en vez de "Bank · Card ·
   Broker") — la columna PAYOUT es una de 4 columnas iguales dentro de la
   fila de métricas; con 2-3 métodos simultáneos (plausible en
   producción, no solo en mis datos de prueba) el texto unido con " · "
   no entraba en una sola línea con `truncate`. Sacado el `truncate`,
   ahora envuelve a una segunda línea sin problema (ninguna palabra
   individual es tan larga como para partirse mal).

## Estado de validación

- `bun run typecheck` — limpio.
- `bun run lint` — limpio en los 2 archivos tocados (`__root.tsx`,
  `ComparatorSection.tsx`).
- `bun run i18n:check` — 0 rotos / 0 incompletos (sin cambios de copy
  esta ronda).
- `bun run test` — 34/34 verdes.
- Verificación visual: Playwright con datos simulados (mismo mecanismo de
  siempre, revertido antes de commitear), capturas antes/después de cada
  uno de los 3 truncados, más una prueba dedicada con 10+ nombres de país
  reales para confirmar que el fix generaliza y no fue casualidad con un
  solo caso.

## `bun.lock`

No tocado.

## Pendientes

- Ninguno nuevo de esta ronda. Si Alejandro tiene en mente cambios
  específicos que no aparecieron en esta auditoría, pasarlos con el
  detalle puntual la próxima vez agiliza mucho más que "revisalo vos".
