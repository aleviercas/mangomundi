# Ronda 8 del rediseño "Kayak skin" (4-sep-2026) — merge real del header, panel de IA que empuja, borde fluo, selector compacto, auditoría de paleta

Rama `kayakclone` de `aleviercas/mangomundi` — **rama separada** del trabajo
de `claude/coordinar-trabajo-simultaneo-y85idz` que documentan los otros
handoffs de esta carpeta (rondas 9-14 ahí son de OTRA línea de trabajo, no
tocar esa numeración). El rediseño "Kayak skin" en `kayakclone` lleva su
propia numeración de rondas (1 a 8 hasta ahora) y, hasta este handoff, no
tenía ningún archivo propio en `docs/handoff/` — las rondas 1-7 sólo están
documentadas como comentarios `2026-09-04 feedback (ronda N)` dentro de cada
archivo tocado (`src/sections/ComparatorSection.tsx`, `src/components/
Header.tsx`, `src/styles.css`, `src/components/ui/Combobox.tsx`,
`src/config/nav.ts`, `src/sections/HeroSection.tsx` son los que más
acumularon). Si una sesión nueva necesita el detalle de las rondas 1-7, hoy
sólo está ahí — no reconstruido acá para no fabricar detalle sin
verificarlo de nuevo.

`docs/kayak-redesign-spec.md` es el spec ORIGINAL (pre-ronda-1), no un
changelog — no se actualiza ronda a ronda, sigue siendo la referencia de
partida.

## Pedido del usuario (verbatim, resumido)

> "en el comparador no se puede hacer como hace kayak de que la barra de
> seleccion o el combox se mueve al header? el mangomundi ai cuando se
> despliega no tendria que tapar lo del fondo, igual que como hace kayak,
> el widget hay que analizarlo para que tenga la misma logica del combox y
> el mobile tambien, el mangomundi ai que tenga algun borde fluo dinamico
> como hace ask ai de kayak, el icono de personal y business arriba del
> combox ponerlo como el selector de one way return multicity? que ocuapa
> menos lugar? el fondo del mangomundi ai deberia de tener otro color?
> revisar la paleta de colores del omhoem para que tenga sentido y del
> comparador tambien y de todo el sitio"

Seguido de una aclaración a mitad de ronda: *"si le ponemos el borde fluo a
mangomundi ai le sacamos entonces el puntito verde"*.

## 1. Barra de búsqueda se mueve al header — merge real

La ronda 7 sólo había igualado el COLOR del wrapper sticky (`bg-card`)
contra el header — una aproximación visual, no el merge real que el usuario
volvió a pedir.

**Medido en vivo contra kayak.com** (`/flights/JFK-LAX/...`, resultado
real): su `<header>` mide 80px en una página de resultados vs. ~66px en el
home — exactamente porque la fila de búsqueda (trip-type + campos + Search)
vive DENTRO del mismo `<header>`, no pegada debajo.

Implementación:

- **`src/components/Header.tsx`**: el `<header>` deja de tener `h-[66px]`
  fijo y pasa a `flex flex-col`. Fila 1 (igual que antes, ahora con su
  propio `h-[66px]` explícito) + fila 2 nueva, `<div id="header-searchbar-
  slot" />`, vacía por defecto (sin padding/borde propios — el contenido
  portaleado los trae).
- **`src/sections/ComparatorSection.tsx`**: nuevo estado `mergeSearchIntoHeader
  = !embedded && Boolean(result) && !isMobile && isWideForHeaderMerge (≥1280px,
  matchMedia) && Boolean(headerSearchbarSlot)`. Cuando es `true`, `searchBar`
  (el nodo completo: campos + selector Personal/Business + botón Compare) se
  portalea entero a `#header-searchbar-slot` vía `createPortal` — mismo
  patrón que ya usaba `FloatingAgent` para su trigger colapsado. El render
  inline de `searchBar` en su posición de siempre pasa a `null` cuando el
  merge está activo (no se monta dos veces), y el wrapper sticky que antes
  lo envolvía (`sticky top-[...] bg-card py-2`) también colapsa a `""` para
  no dejar una franja blanca vacía.
- Por debajo de 1280px o en mobile: sin cambios, sigue el fallback de ronda
  7 (tarjeta sticky bajo el header). `searchBar` es una sola fila recién
  desde `@4xl` en el propio container query — meterlo en un header angosto
  se vería roto.

### `--header-h`: por qué

Cuatro lugares necesitaban saber "dónde termina el header" y antes tenían
`66px` hardcodeado cada uno por su cuenta (Header.tsx propio drawer,
`__root.tsx`, el panel de IA y el rail de resultados en
ComparatorSection.tsx) — con el header ahora de alto variable, hardcodear
66px en cuatro lugares distintos garantiza que se rompan el día que el
header mida más. Se centralizó:

- `Header.tsx` mide su propio `offsetHeight` real con un `ResizeObserver` y
  lo publica como `document.documentElement.style.setProperty("--header-h",
  ...)`.
- `src/styles.css` define el default (`--header-h: 66px` en `:root`, el
  valor real antes de que el ResizeObserver corra, para SSR/primer paint).
- Los cuatro consumidores leen `var(--header-h)` en vez de `66px` literal:
  `__root.tsx`'s `<main className="pt-[var(--header-h)]">`, el drawer de
  Header.tsx (`top-[var(--header-h)]` en el backdrop y el `<nav>`), el panel
  de IA (`top-[var(--header-h)]`), y el rail de resultados
  (`lg:top-[calc(var(--header-h)+70px)]` sin merge, `+12px` con merge activo
  — sin la tarjeta sticky de por medio el rail no necesita esos 70px extra).

## 2. Panel de Mangomundi AI empuja el contenido, no lo tapa

Confirmado por medición DOM en vivo (`getBoundingClientRect` sobre el
`<main>` real de kayak.com con su Ask AI abierto, 1440×900): el `<main>` se
angosta y corre a la derecha (x pasa de 0 a ~360px, ancho se reduce en la
misma medida) — es un push de layout real, no un panel `position:fixed`
flotando encima.

- **`src/routes/__root.tsx`**: `<main id="page-main">`.
- **`src/styles.css`**: `#page-main.ai-panel-open { padding-left: min(380px,
  100vw) }` con transición, gateado a `@media (min-width: 640px)` — en
  mobile el panel de IA ya ocupa el viewport completo, empujar ahí sacaría
  todo de pantalla en vez de liberar espacio.
- **`ComparatorSection.tsx`** (`FloatingAgent`): un `useEffect` togglea
  `.ai-panel-open` en `#page-main` por DOM directo cuando `collapsed`
  cambia — mismo patrón cross-tree que los portales del header (Header,
  `<main>`/Outlet y ComparatorSection son hermanos sin padre común).

## 3. Borde "fluo" dinámico + se sacó el puntito verde

Auditoría en vivo contra kayak.com antes de implementar nada (hojas de
estilo vía `document.styleSheets`, pseudo-elementos del trigger inactivo,
barrido de `@keyframes` con nombres tipo glow/shimmer/pulse en todo el
sitio, panel del Ask AI abierto, input del composer): **no se encontró
ningún borde/glow animado real**. El único `@keyframes glow` que existe en
el CSS de kayak es un pulso de opacidad genérico (`1 → 0.6`) usado por
`.c9mPP-mod-loading`, un skeleton de precio cargando — sin relación con el
botón de Ask AI. No se pudo confirmar que kayak tenga este efecto.

Se implementó de todos modos porque el usuario lo pidió explícitamente,
independiente de la paridad literal con kayak:

- **`src/styles.css`**: `.ai-glow-border` — un `::before` con
  `background: conic-gradient(...)` (mango → mango-glow → accent-deep)
  rotando (`@keyframes mg-ai-glow-spin`), enmascarado (`mask-composite:
  exclude`, con el prefijo `-webkit-` para Safari) para que sólo se vea el
  grosor del borde, no el relleno — el truco estándar para animar un
  "borde con gradiente" ya que `border-image` no es animable directamente.
  `border-radius: inherit` para calzar tanto con la píldora del trigger de
  escritorio como con el círculo del trigger mobile.
- Aplicado **sólo al trigger colapsado** (`collapsedTrigger` y
  `collapsedTriggerMobile` en `ComparatorSection.tsx`), no al panel ya
  abierto — para no tener algo animando permanentemente alrededor de donde
  el usuario está leyendo o escribiendo.
- Punto verde `hasNewResult`: se sacó el `<span>` del punto en ambos
  triggers (el `useState`/localStorage de `hasNewResult` en sí se dejó
  intacto, sólo se dejó de renderizar el indicador visual) — instrucción
  explícita del usuario al confirmar que se agregaba el glow.

## 4. Personal/Business → selector compacto de un solo trigger

Medido en vivo el selector real de tipo de viaje de kayak.com ("One-way
⌄", top-controls de la barra de búsqueda): un trigger ÚNICO de 78.8×28px,
`background-color: rgba(0,0,0,0)`, `border: 0px` — texto plano 14px/400 +
un chevron, sin caja ni fondo propio. Lo que había desde ronda 7 (una
píldora `bg-muted` con dos botones, más compacta que los tiles de 52px pero
todavía un contenedor con dos opciones visibles) no era ese patrón.

`src/sections/ComparatorSection.tsx`: pasa de un `role="group"` con dos
`<button>` a un `DropdownMenu` (mismo primitive de `@/components/ui/
dropdown-menu` que ya usa el Sort del listado de resultados) — trigger de
texto plano sin borde/fondo (`{t(segment)} <ChevronDown />`) y un
`DropdownMenuRadioGroup` con las dos opciones (Individual/Business, con su
ícono) adentro. Mismo estado `segment`/`handleSegmentChange` de siempre.

## 5. ¿Debería cambiar el fondo del panel de IA?

**No hacía falta cambiarlo.** El panel usa `#241C16` de fondo — ese valor
NO es un color nuevo o suelto: es exactamente `--foreground`/`--primary`
(la tinta de marca del sistema, definida en `styles.css` `:root`) usada
como fondo en vez de como texto. Ya pertenecía a la paleta del sitio, sólo
invertido.

Lo que sí estaba mal: vivía como dos strings hex sueltos (`#241C16`/
`#F1EBE4`) repetidos en 3 `style={{}}` inline distintos dentro de
`ComparatorSection.tsx`, sin ningún token detrás — si la tinta de marca
cambiara algún día, el panel se desincronizaría en silencio. Se agregaron
tokens propios en `:root` (`styles.css`):

```css
--ai-panel-bg: var(--foreground);       /* atado de verdad, no copiado */
--ai-panel-foreground: #f1ebe4;         /* hueso cálido, no --primary-foreground blanco puro — decisión propia, se preserva aparte */
```

y los 3 `style={{}}` inline pasaron a `style={{ backgroundColor:
"var(--ai-panel-bg)", color: "var(--ai-panel-foreground)" }}`.

## 6. Auditoría de paleta (home, comparador, todo el sitio)

Revisión de `src/styles.css` completo: el sistema de color es coherente —
una sola paleta cálida (papel `#FBF8F4` / blanco `#FFFFFF` / arena
`#F5EFE8` / tinta `#241C16` / mango `#EE5B3E` / verde `#1F7A5A`), literal
del mockup, con pasadas de contraste AA ya documentadas y hechas en rondas
anteriores (`--accent-text` oscurecido para texto normal-size, `--surface-
canvas` movida de hue frío a cálido en rondas 5-6). No se encontraron
inconsistencias de fondo — esas ya se habían corregido antes.

Se encontraron y corrigieron ~10 valores hex sueltos, todos dentro del
panel de IA (`ComparatorSection.tsx`), que duplicaban tokens existentes o
merecían uno propio sin tenerlo:

- `#FF8A6B` (ícono/foco sobre el fondo oscuro del panel, 2 usos) y
  `#A79C92` (texto secundario sobre ese mismo fondo, 5 usos) → nuevos
  tokens `--ai-panel-accent` / `--ai-panel-muted` (`styles.css`) — no se
  fusionan con `--accent`/`--muted-foreground` normales porque esos están
  calibrados para fondos claros, no para la tinta oscura del panel.
- El composer del panel (input blanco dentro del panel oscuro):
  `bg-white`/`text-[#241C16]`/`bg-[#EE5B3E]` → `bg-card`/`text-foreground`/
  `bg-brand-cta text-brand-cta-foreground` (clases de token ya generadas,
  sin arbitrary values).
- El badge de verificación de tarifa (fuera del panel de IA, en la fila de
  resultados): `style={{ color: isVerified ? "#1F7A5A" : "#6B5F55" }}` →
  `var(--success)` / `var(--muted-foreground)` (mismos valores exactos, ya
  tokenizados).

## 7. Widget embebido (`EmbedComparator.tsx`) y mobile

Revisión de consistencia, sin cambios de código (ya estaban alineados):

- El picker de país/moneda (`src/components/ui/Combobox.tsx`, con el panel
  flotante ancho + hover neutro que arregló la ronda 7) es un componente
  COMPARTIDO — `CountryCombobox`/`CurrencyCombobox` en el widget y en
  mobile ya heredan ese fix automáticamente, sin nada propio que tocar.
- `searchBar` (la barra principal) es un único nodo React que se adapta por
  container queries, no una implementación separada por breakpoint — el fix
  de chips planos de `FieldLight` (ronda 7) ya cubre mobile sin cambios
  aparte.
- El formulario propio del widget (rama `embedded` de `ComparatorSection`,
  usada por `/embed` y por la vista previa en vivo de `WidgetTeaserSection`)
  ya usaba `rounded-control bg-muted` sin sombra en sus campos — mismo
  espíritu "flat" que el resto, sólo estructurado como cajas compuestas
  (amount+currency+country en un solo box con hairlines internos) por una
  razón de espacio documentada (frame fijo de 360px), no un descuido.
- El tablist Personal/Business propio de `EmbedComparator.tsx` (distinto
  del de la barra principal — selecciona el segmento de TODO el widget, no
  un campo dentro del formulario) se dejó como está: ya es muy compacto
  (`h-5`, texto `10.5px`) y convertirlo a dropdown ahí no aporta nada en un
  header de widget de por sí minúsculo.

## Archivos tocados y estado de entrega

| Archivo | Cómo se subió | Verificado |
|---|---|---|
| `src/components/Header.tsx` | `github push_files` → `kayakclone` (commit `a4f2684`) | Sí — re-clon + diff byte a byte |
| `src/routes/__root.tsx` | mismo commit | Sí |
| `src/styles.css` | mismo commit | Sí |
| `src/sections/ComparatorSection.tsx` | `SendUserFile` + `device_commit_files` a `C:\Users\aleja\Claude\Mangomundi\Claude outputs\ComparatorSection.tsx` (292575 bytes, tamaño confirmado igual local/remoto) | **Pendiente de subida manual a GitHub por Alejandro** — mismo flujo que ronda 7 (el archivo es demasiado grande/riesgoso para la API de push directo) |

`src/components/ui/Combobox.tsx`, `src/config/nav.ts`,
`src/sections/HeroSection.tsx` — sin cambios esta ronda; confirmado por
`git diff origin/kayakclone` (0 líneas) que ya estaban al día en origin
desde la ronda 7.

## Disciplina de verificación usada esta ronda

Antes de editar: `git fetch origin kayakclone` + `git diff HEAD
origin/kayakclone --stat` mostró que origin había avanzado (23 commits vs.
7 locales) — la ronda 7 ya estaba subida por Alejandro, incluyendo la carga
manual de `ComparatorSection.tsx` que en el handoff anterior figuraba como
"no confirmada". Se revisó el diff línea por línea contra origin de cada
archivo, antes de tocar nada y de nuevo después de editar, para confirmar
que el delta final era exactamente el trabajo de esta ronda — sin sorpresas
ni contenido ajeno pisado. Contenido, no ancestría de git, es la fuente de
verdad (Alejandro a veces sube archivos manualmente por la web de GitHub,
lo que puede dejar el historial local de la sesión desincronizado).

## Pendiente / próximos pasos

1. Alejandro sube manualmente `ComparatorSection.tsx` (ya en su carpeta
   `Claude outputs`) a GitHub, rama `kayakclone`, reemplazando el archivo
   existente.
2. Verificar visualmente en el deploy de Vercel (auto-deploy al pushear)
   una vez subido: el merge del header en ≥1280px con resultado, el push
   del panel de IA, el glow del trigger, y el nuevo selector Personal/
   Business.
3. Ninguna tarea nueva quedó abierta de este pedido — las 7 partes (a-g del
   mensaje original) están implementadas.
