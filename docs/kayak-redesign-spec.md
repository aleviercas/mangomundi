# Rediseño "Kayak skin, paleta mango" — spec ejecutable

> **Qué es esto.** Un spec pensado para pegarse tal cual a un agente de código
> (Claude Code / Cursor) que trabaje sobre este repo. Todo está anclado a
> archivos reales, tokens reales de `src/styles.css` y medidas reales medidas
> sobre kayak.com / kayak.co.uk (viewport 1280 y 375, septiembre 2026, valores
> tomados con `getComputedStyle`, no estimados a ojo).
>
> **Objetivo.** Que el comparador, el widget embebible y la vista mobile se
> lean como Kayak — misma densidad, misma geometría, misma jerarquía — pero
> con la tonalidad, la tipografía y la paleta OKLCH de mangomundi. Cero naranja
> Kayak, cero azul Kayak. Solo coral mango sobre slate frío.

---

## 0. Reglas de ejecución (no negociables)

1. **Nada de valores sueltos.** Vale la regla de `docs/design-system.md`: si
   hace falta un color, radio, sombra o tamaño nuevo, se agrega como token en
   `src/styles.css` (`:root` + `@theme inline`) y se usa como utilidad
   Tailwind. Prohibido `bg-[#f0f3f5]`, `rounded-[8px]`, `text-[11px]` dentro de
   las superficies tocadas por este spec.
2. **Cambio de piel, no de lógica.** No se toca `sortByScore`,
   `computeCompositeScores`, `pickFeaturedAmongTies`, `DELIVERY_METHOD_PREDICATES`
   ni nada de `src/services` / `src/lib/*.functions.ts`. Si un cambio visual
   obliga a mover lógica, se para y se pregunta.
3. **i18n primero.** Cualquier string nuevo entra por `t("…")` con su clave en
   los 3+ idiomas. `bun run i18n:check` tiene que pasar. Cero literales.
4. **Fases en orden.** Cada fase compila y pasa `bun run typecheck` sola. No se
   empieza la fase N+1 con la N rota.
5. **La accesibilidad sube, no baja.** Este rediseño **elimina** los tamaños
   `text-[9px]` / `text-[10px]` / `text-[11px]` del comparador: el mínimo del
   sistema pasa a ser 12px (`text-badge`), igual que Kayak. Todo par
   texto/fondo nuevo tiene que dar ≥ 4.5:1.

---

## 1. Referencia Kayak medida (para no inventar)

Valores tomados de kayak.co.uk el 03/09/2026 con `getComputedStyle`:

| Elemento | Valor real de Kayak |
|---|---|
| Fondo de la página de resultados | `#F0F3F5` |
| Fondo de tarjeta | `#FFFFFF` |
| Texto primario | `#192024` |
| Texto secundario | `#5A6872` |
| Radio de tarjeta / barra de búsqueda | `8px` |
| Radio de control (botón de fila, tile) | `4px` |
| Sombra de tarjeta y de barra | `0 3px 6px rgba(25,32,36,.16), 0 -1px 4px rgba(25,32,36,.04)` |
| Barra de búsqueda desktop | `920×60`, blanca, **sin borde**, un solo bloque segmentado |
| CTA hero | `h44`, radio 8, `linear-gradient(135deg,#FF690F,#E8381B)`, 14px/600 |
| CTA de fila de resultado | `144×36`, radio 4, mismo gradiente, 14px/600 |
| Precio de fila | `24px / 600` en texto primario |
| Badges "Best"/"Cheapest" | `12px / 600`, texto `#00485C` / `#074A28` sobre tinte claro |
| Tile de vertical (Flights/Stays) | `36×36`, radio 4, inactivo `#E6EBEF` |
| Columna de resultados | `728px` con rail de filtros a la izquierda |
| Tipografía | una sola familia (TT Hoves) para todo, 16px base, 600 para énfasis |

**Traducción a mangomundi:** se copian geometría, densidad, jerarquía y
comportamiento. Se reemplaza color por la paleta OKLCH del proyecto y la
familia única por **Manrope (`font-sans`) en toda la superficie del
comparador** — Sora (`font-heading`) queda reservada para los H1/H2 de
marketing. Kayak no mezcla dos familias dentro del buscador; nosotros tampoco.

---

## 2. Fase 0 — Tokens nuevos (`src/styles.css`)

Agregar en `:root` (después del bloque "Mango brand extras"):

```css
  /* === Kayak-skin: geometría compacta para el comparador =================
     El sistema general usa --radius 0.875rem (14px), correcto para las
     secciones de marketing. La superficie de comparación necesita la
     geometría dura de un buscador (8px tarjeta / 4px control): con 14px
     una lista de 8 tarjetas apiladas se lee blanda y pierde densidad. */
  --radius-compact: 0.5rem;   /* tarjetas, barra de búsqueda, sheets */
  --radius-control: 0.25rem;  /* botones de fila, tiles, chips cuadrados */

  /* Lienzo del comparador: un punto más frío/oscuro que --background para
     que las tarjetas blancas floten (Kayak: #F0F3F5 sobre tarjeta #FFF). */
  --surface-canvas: oklch(0.945 0.01 255);

  /* Sombra única de toda la superficie de comparación — el segundo halo
     hacia arriba es lo que hace que la tarjeta se despegue del lienzo sin
     verse "elevada" (mismo truco que Kayak). */
  --shadow-compare:
    0 3px 6px 0 oklch(0.27 0.025 257 / 0.16),
    0 -1px 4px 0 oklch(0.27 0.025 257 / 0.04);

  /* CTA con gradiente — reemplaza el fill plano en TODA acción primaria.
     Mismo ángulo y mismo salto claro→oscuro que Kayak, en hues mango. */
  --accent-deep: oklch(0.62 0.2 25);
  --gradient-cta: linear-gradient(135deg, var(--mango-glow) 0%, var(--accent-deep) 100%);

  /* Badges de mérito — el par "mejor opción" / "más barato" de Kayak,
     traducido: azul frío informativo + verde de la familia de --success. */
  --merit-best: oklch(0.95 0.025 235);
  --merit-best-foreground: oklch(0.42 0.09 235);
  --merit-cheap: oklch(0.95 0.04 150);
  --merit-cheap-foreground: oklch(0.4 0.11 150);
```

Y en `@theme inline`:

```css
  --color-surface-canvas: var(--surface-canvas);
  --color-merit-best: var(--merit-best);
  --color-merit-best-foreground: var(--merit-best-foreground);
  --color-merit-cheap: var(--merit-cheap);
  --color-merit-cheap-foreground: var(--merit-cheap-foreground);
  --color-accent-deep: var(--accent-deep);

  /* Escala de texto de la superficie de comparación. Kayak no baja de 12px
     en ningún lado; esta escala existe para poder borrar los text-[9px]/
     [10px]/[11px] que hoy están sueltos en ComparatorSection. */
  --text-price: 1.5rem;      --text-price--line-height: 1.1;   /* 24px */
  --text-metric: 1rem;       --text-metric--line-height: 1.35; /* 16px */
  --text-meta: 0.8125rem;    --text-meta--line-height: 1.4;    /* 13px */
  --text-badge: 0.75rem;     --text-badge--line-height: 1.35;  /* 12px */
```

Nuevas utilidades compuestas (al final de `styles.css`, junto a `surface-card`):

```css
/* Tarjeta del comparador — geometría Kayak. Convive con .surface-card
   (radio 2xl, sombra difusa) que sigue siendo la de las secciones de
   marketing; no se reemplaza una por otra. */
@utility compare-card {
  background-color: var(--color-card);
  border: 1px solid transparent;
  border-radius: var(--radius-compact);
  box-shadow: var(--shadow-compare);
  transition: box-shadow .18s ease, border-color .18s ease;
}

/* CTA con gradiente. Sustituye a .btn-cta dentro del comparador/widget;
   .btn-cta queda para el resto del sitio hasta la Fase 5. */
@utility btn-cta-gradient {
  background-image: var(--gradient-cta);
  color: var(--color-brand-cta-foreground);
  white-space: nowrap;
  transition: filter .15s ease, box-shadow .15s ease, transform .15s ease;
  &:hover { filter: brightness(1.06); box-shadow: 0 6px 18px -8px var(--accent-deep); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: .55; cursor: not-allowed; filter: none; }
}
```

**Documentar los tokens nuevos en `docs/design-system.md`** en la misma pasada
(tabla de Colores + secciones de Radios y de Utilidades). El doc dice que es la
fuente de verdad; si no se actualiza, el spec queda incumplido.

---

## 3. Fase 1 — Comparador desktop (`src/sections/ComparatorSection.tsx`)

### 3.1 Lienzo

La sección deja de vivir sobre `--background`. En el `SectionTag` (línea ~1149):

- No embebido: `className="scroll-mt-24 bg-surface-canvas pb-8 sm:pb-12 pt-4"`.
- El contenedor interno sube a `max-w-[1180px]` (hoy `max-w-7xl` = 1280): con el
  rail de filtros de la Fase 1.4, Kayak trabaja con 240 de rail + 728 de
  resultados + gutters. 1180 da exactamente eso.

### 3.2 La barra de búsqueda es **una sola pieza segmentada**

Hoy el formulario son cajas independientes con label arriba (`FieldLight`),
`gap-2.5` entre ellas y un botón separado. Kayak no tiene eso: es **un único
rectángulo blanco de 60px de alto, radio 8, sin borde, con `--shadow-compare`**,
dividido por hairlines verticales, y el CTA ocupa el extremo derecho **a
sangre**, con solo las esquinas derechas redondeadas.

Reescribir el `div` de la línea ~1249 (`grid grid-cols-1 … @2xl:grid-cols-[1.5fr_auto_1.2fr_auto]`) así:

```
<div className="@2xl:flex @2xl:h-15 @2xl:items-stretch @2xl:overflow-hidden
                @2xl:rounded-compact @2xl:bg-card @2xl:shadow-compare
                grid grid-cols-1 gap-2.5 @2xl:gap-0">
```

Reglas de los segmentos (cada uno un `div` hermano):

| Segmento | Ancho | Contenido |
|---|---|---|
| Monto + país origen | `@2xl:flex-[1.4]` | input numérico + `CountryCombobox`, separados por hairline interno |
| Swap | `@2xl:w-11` | botón circular `h-8 w-8` centrado verticalmente, **sin borde ni fondo**, `text-muted-foreground hover:text-brand-cta` |
| País destino | `@2xl:flex-[1.2]` | `CountryCombobox` |
| Método de entrega | `@2xl:flex-[0.9]` | trigger que abre el popover de `DELIVERY_METHODS` (hoy vive abajo, en la fila de filtros — **se sube acá**, es el equivalente al selector de pasajeros/clase de Kayak) |
| CTA | `@2xl:w-[168px]` | `btn-cta-gradient`, altura completa del bloque, `rounded-none @2xl:rounded-r-compact` |

- Separador entre segmentos: `@2xl:border-l @2xl:border-border` en cada
  segmento salvo el primero y el CTA. **Ningún segmento lleva borde propio,
  radio propio ni sombra propia** — ese es el detalle que hace que se lea como
  Kayak y no como cuatro inputs pegados.
- `FieldLight` deja de renderizar el label arriba en desktop: pasa a
  `<span className="text-badge font-semibold text-muted-foreground">` **dentro**
  del segmento, sobre el valor (Kayak muestra el label solo cuando el campo está
  vacío; nosotros lo dejamos siempre, en 12px, porque "Envías"/"Recibís" es
  información que un comparador de FX no puede dar por sobrentendida).
- En mobile (`< @2xl`) los segmentos se apilan como filas de una tarjeta blanca
  única separadas por `border-t border-border`, y el CTA es la última fila a
  ancho completo — exactamente el formulario mobile de Kayak. Ver Fase 2.
- Estado focus del bloque entero: `focus-within:ring-2 focus-within:ring-brand-cta/40`
  aplicado al contenedor, no a cada campo.

### 3.3 Encabezado de la tarjeta → tiles de vertical

El header actual (eyebrow "Comparar" + toggle Personal/Empresa en píldora) se
reemplaza por la fila de tiles de Kayak, **arriba y afuera** de la barra:

- Tiles de `36×36`, `rounded-control`, ícono 18px, label 13px (`text-meta`)
  debajo del tile, centrado.
- Activo: `bg-[image:var(--gradient-cta)] text-brand-cta-foreground`.
  Inactivo: `bg-muted text-foreground hover:bg-secondary`.
- Dos tiles hoy: **Personal** (`User`) y **Empresa** (`Building2`), atados al
  estado `segment` que ya existe. El comentario del código explica por qué el
  segmento tiene que decidirse antes de la búsqueda: sigue siendo cierto, y esta
  posición (arriba de la barra, como los verticales de Kayak) lo refuerza.
- El eyebrow "COMPARAR" desaparece: la barra ya se explica sola.

### 3.4 Rail de filtros sticky (≥ `lg`) — **nuevo**

Kayak pone los filtros en una columna izquierda de ~240px, sticky, con secciones
apiladas. Hoy mangomundi los tiene como chips horizontales encima de los
resultados. Migrar a:

```
<div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-5">
  <aside className="hidden lg:block"> … rail … </aside>
  <div className="min-w-0"> … tabs + resultados … </div>
</div>
```

Rail: `compare-card`, `sticky top-[calc(4rem+var(--search-bar-h))]`, `divide-y divide-border`,
cada sección con `px-4 py-3.5`:

1. **Avisame si mejora** — fila con label + `Switch`; abre `PreferredRateModal`.
   (Es el `Track prices` de Kayak, y ya existe el modal.)
2. **Método de entrega** — 4 filas `Checkbox` + label + contador de proveedores
   a la derecha en `text-meta text-muted-foreground`. Sustituye los chips.
   Multi-select real; el estado sigue siendo `deliveryMethod` pero pasa a
   `DeliveryMethod[]` (ajustar `DELIVERY_METHOD_PREDICATES` en el `.filter()`
   con un `.some()`, sin tocar el archivo de predicados).
3. **Velocidad de entrega** — `Slider` de una manija: "hasta N h", filtra por
   `speed_hours`.
4. **Solo ofertas exclusivas** — un `Checkbox`, no un chip coral.
5. **Verificación** — checkbox "Solo rutas verificadas" (`has_corridor_data`).
6. Pie del rail: botón `Limpiar filtros` en `text-meta`, solo visible si hay
   alguno activo.

Los chips horizontales **no se borran**: quedan como la vista `< lg` (Fase 2).

### 3.5 Tabs de orden = la matriz de precio de Kayak

Los 3 chips primarios (`PRIMARY_SORT_CHIPS`) pasan a ser 3 tabs anchos que
**muestran el resultado de cada criterio**, que es lo que hace útil la matriz de
Kayak (no dice "Cheapest", dice "Cheapest £48 · 2h 30m"):

```
<div className="grid grid-cols-3 overflow-hidden rounded-compact bg-card shadow-compare">
  {PRIMARY_SORT_CHIPS.map(key => (
    <button className={active
      ? "border-b-2 border-brand-cta bg-card"
      : "border-b-2 border-transparent bg-muted/40 hover:bg-muted"}>
      <span className="text-meta font-semibold text-muted-foreground">{label}</span>
      <span className="text-metric font-bold text-foreground tabular-nums">{headline}</span>
      <span className="text-badge text-muted-foreground">{sub}</span>
    </button>
  ))}
</div>
```

`headline` / `sub` por tab, calculados sobre `filteredRows` (no sobre
`displayRows`, para que no dependan del orden activo):

- **Recomendado** → monto recibido del ganador `overall` + nombre del proveedor.
- **Recibís más** → `Math.max(received)` + `+N ARS vs. el promedio`.
- **Más rápido** → `formatDeliverySpeed(min(speed_hours))` + nombre.

El dropdown "Más criterios" queda a la derecha de la fila, **fuera** del bloque
de 3 tabs, como texto + chevron (`text-meta font-semibold`), igual que el
`Sort by: Best ⌄` de Kayak.

### 3.6 Barra de estado sobre los resultados

Fila de 40px justo debajo de las tabs, sin fondo:

- Izquierda: `<N> proveedores` en `text-meta`; durante el fetch, spinner +
  "Buscando precios…" (Kayak: `Fetching prices…`).
- Derecha: `Actualizado HH:mm:ss` (hoy está enterrado en un bloque al final de
  la lista; **subirlo acá** — es el dato de confianza y en Kayak vive arriba).
- El bloque legal de abajo (`tRatesSource` / `tNeutrality` / `tDisclaimer` /
  `tTrademarks`) se mantiene, colapsado en un `<details>` con summary
  "Metodología y aviso legal", `text-meta`.

### 3.7 `ProviderRow` — clon de la tarjeta de resultado

Estructura desktop (reemplaza el grid de 5 columnas actual):

```
┌───────────────────────────────────────────────┬──────────────┐
│ [♡][↗]                        [Mejor][+ barato]│              │
│ ▢36 Nombre                    ★4.8 (12k) · FCA │   1.240,50   │
│      Comisión 4,20 USD  ·  Tasa 1.0842 (+0,1%) │      ARS     │
│      ⏱ 2 h  ·  🏦 Banco  💵 Efectivo            │  Recibís más │
│                                                 │ [ Ir a Wise ]│
└───────────────────────────────────────────────┴──────────────┘
```

Reglas exactas:

- Contenedor: `compare-card p-0 overflow-hidden hover:shadow-lg`. **Sin
  `rounded-2xl`, sin `border-2` coral.**
- Grid: `sm:grid-cols-[minmax(0,1fr)_180px]`. La columna derecha lleva
  `sm:border-l sm:border-border` — la línea vertical antes del precio es una de
  las firmas visuales de Kayak.
- **Fila destacada:** ya no se marca con borde coral de 2px (eso pesa demasiado
  repetido en una lista). Se marca como Kayak: badge `Mejor` tintado
  (`bg-merit-best text-merit-best-foreground`) + CTA con gradiente; el resto de
  las filas llevan CTA **outline** (`border border-input bg-card text-foreground`).
  Badge `Más barato` (`bg-merit-cheap text-merit-cheap-foreground`) para la fila
  con mayor `received`. Ambos `text-badge font-semibold rounded-control px-2 py-0.5`,
  arriba a la derecha del bloque izquierdo.
- **Acciones `♡` / `↗`** (guardar y compartir) arriba a la izquierda:
  `h-9 w-9 rounded-control border border-input bg-card text-muted-foreground`.
  Guardar persiste en `localStorage`; compartir usa `navigator.share` con
  fallback a copiar link. Strings nuevos por `t()`.
- **Precio:** `text-price font-bold tabular-nums text-foreground`, moneda debajo
  en `text-meta font-semibold text-muted-foreground` (hoy va inline en 12px;
  Kayak la baja de línea). Debajo: `Recibís más` en `text-success` o
  `−N ARS` en `text-muted-foreground`, siempre `text-badge font-semibold`.
- **CTA:** `h-9 w-full rounded-control text-meta font-semibold` (Kayak: 144×36).
  Nunca más alto que 36px en la fila.
- **Métricas:** una sola línea de `text-meta` con separadores `·`, no tres
  columnas. Los micro-labels desaparecen (ya los tiene el encabezado… que
  también se elimina: con la línea inline no hace falta el header de columnas de
  `ResultsBlock`, borrarlo).
- **Chips de entrega y línea de confianza:** pasan a `text-badge`; el bloque de
  confianza va dentro de un `border-t border-border px-4 py-2 bg-muted/30` al pie
  de la tarjeta, no suelto.
- **Tag de patrocinado:** se mantiene la esquina, pero en `rounded-br-control` y
  `text-badge`. La disclosure no se toca ni se achica: es obligación legal, no
  decoración.
- **Prohibido en toda la fila:** `text-[9px]`, `text-[10px]`, `text-[11px]`,
  `rounded-2xl`, `rounded-full` en botones de acción.

### 3.8 Densidad

Kayak mete 2 tramos + precio + CTA en 200px de alto y 728 de ancho. Objetivo
equivalente: **una fila de proveedor no supera los 148px de alto en desktop**
con todos sus chips visibles. Si se pasa, se recorta contenido secundario, no se
achica la tipografía.

---

## 4. Fase 2 — Mobile (`< sm`) y tablet

### 4.1 Barra de búsqueda colapsada (patrón exacto de Kayak mobile)

Una vez que hay `result`, la barra completa se reemplaza por una **píldora de
resumen** sticky bajo el header:

```
[K] ┌────────────────────────────────┐  ( ✦ )
    │ Argentina → España             │
    │ 1.000 USD · Banco              │
    └────────────────────────────────┘
```

- Píldora: `bg-muted rounded-compact px-3 py-2`, ruta en `text-metric font-bold`,
  detalle en `text-meta text-muted-foreground`. Al tocarla se abre el formulario
  completo en un `Drawer` (ya está `src/components/ui/drawer.tsx`) a pantalla
  casi completa, con el CTA fijo abajo.
- A la derecha, botón circular `h-11 w-11 rounded-full border border-input bg-card`
  que abre el `FloatingAgent` (es el `Ask AI` de Kayak; el agente ya existe, solo
  cambia el punto de entrada en mobile).
- Mientras corre la búsqueda: barra de progreso de 3px con `--gradient-cta` al
  pie del header (Kayak la tiene; es el feedback más barato que hay).

### 4.2 Fila de filtros horizontal

Debajo de la píldora, fila que **no envuelve** (hoy usa `flex-wrap`; en mobile
Kayak scrollea):

- Botón cuadrado `h-10 w-10 rounded-control border border-input` con ícono
  `SlidersHorizontal` → abre el `Drawer` de filtros (mismo contenido que el rail
  de la Fase 1.4, apilado, con "Aplicar (N)" fijo abajo).
- A su derecha, chips `h-10 rounded-full border px-4 text-meta font-semibold`
  en un contenedor `flex overflow-x-auto no-scrollbar gap-2` (la utilidad
  `no-scrollbar` ya existe): `Ordenar ⌄`, `Método ⌄`, `Velocidad ⌄`, `Exclusivas`.
- Chip activo: `border-transparent bg-foreground text-background` (Kayak marca el
  filtro activo en oscuro sólido, no en color de marca — el color de marca se
  reserva para la acción).
- El chip de orden abre un `Drawer` con las 6 opciones como radio list.

> Nota: el comentario largo que hoy justifica `flex-wrap` en vez de
> `overflow-x-auto` es correcto **para el widget de 440px**, no para mobile
> real. Solución: `flex-wrap` se mantiene únicamente cuando `embedded === true`;
> mobile normal pasa a scroll horizontal.

### 4.3 Tarjeta de resultado mobile

- Badges `Mejor` / `Más barato` arriba a la derecha, `text-badge`.
- Identidad (logo 32 + nombre + rating) a la izquierda, **monto grande a la
  derecha en la misma línea** (`text-price`) — ya es así, se mantiene, solo sube
  de `text-xl` a `text-price` y de `font-extrabold` a `font-bold`.
- Línea de métricas en `text-meta` (hoy `text-[12px]`, queda igual pero por token).
- CTA a ancho completo, `h-11 rounded-control`, gradiente solo en la destacada.
- Sin `♡`/`↗` en mobile: no hay ancho; se accede desde el detalle.

### 4.4 Barra inferior fija

Cuando hay resultados y el usuario scrollea más de 400px, aparece una barra fija
al pie (`fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur px-4 py-2.5`)
con: a la izquierda `Mejor: 1.240 ARS` en `text-meta`, a la derecha botón
`btn-cta-gradient h-10 rounded-control px-5` que dispara el CTA del ganador.
`pb-[env(safe-area-inset-bottom)]`.

---

## 5. Fase 3 — Widget embebible

Archivos: `src/components/EmbedComparator.tsx`, `public/widget.js`,
`src/sections/EmbedWidgetSection.tsx`, `src/routes/embed.tsx`.

1. **Geometría del iframe** (`public/widget.js`): `border-radius:16px` → `8px`;
   sombra → `0 3px 6px rgba(25,32,36,.16), 0 -1px 4px rgba(25,32,36,.04)`
   (misma que `--shadow-compare`, escrita literal porque es CSS inline en un
   loader que no tiene acceso a los tokens — **única excepción autorizada** a la
   regla 1, y va comentada como tal en el archivo).
2. **Alto por defecto** `600` → `620`: el formulario apilado gana ~20px con la
   fila de tiles. Actualizar el snippet de `EmbedWidgetSection.tsx` y el
   `data-height` documentado en el JSDoc de `widget.js`.
3. **`EmbedComparator`**: `bg-[#fcfcfc]` (hardcodeado, viola la regla 1) →
   `bg-card`. El contenedor scrolleable pasa a `px-3 py-3` fijo (sin `sm:`: el
   iframe no conoce el viewport).
4. **Formulario del widget = formulario mobile de Kayak**, siempre apilado:
   tarjeta blanca única, filas divididas por `border-t border-border`, CTA
   `btn-cta-gradient` a ancho completo como última fila, `rounded-b-compact`.
   Nada de `@2xl` acá: en 440px nunca aplica, y el código queda más simple si el
   modo `embedded` pide explícitamente el layout apilado.
5. **`CompactResultsList`**: el ganador pasa a ser una `compare-card` con la
   misma anatomía que `ProviderRow` mobile (badge `Mejor`, precio `text-price`,
   CTA `h-10` gradiente). Las filas 2–4 quedan como líneas de 40px
   (`logo 20 · nombre · monto tabular · delta`) separadas por `divide-y`, sin
   tarjeta propia. Cierre: link `Ver los 12 proveedores →` a
   `mangomundi.com/compare` con `target="_blank"`.
6. **El chevron rebotante se elimina.** Si el contenido no entra en 620px, se
   recorta contenido; una pista de scroll animada dentro del iframe de un
   tercero se lee como banner. (El comentario del código ya dice que la meta es
   "que entre por ser corto, no por scrollear" — esto lo cumple.)
7. **Footer de atribución**: `text-badge`, `py-2`, `border-t border-border`. Se
   mantiene el link a mangomundi.com.

---

## 6. Fase 4 — Resto de la página (ideas Kayak, tono mango)

Aplicar solo después de que 1–3 estén mergeadas y verificadas.

### 6.1 Header (`src/components/Header.tsx`)

- Alto 64px, `bg-card` sólido (hoy `bg-card/90 backdrop-blur-xl` — Kayak no
  difumina, y el blur sobre una lista densa produce ruido al scrollear).
- Izquierda: hamburguesa (`h-9 w-9`, **también en desktop**, abre un `Sheet`
  con toda la navegación) + `Wordmark`. Kayak esconde la nav completa detrás del
  menú y deja el header casi vacío: eso es lo que le da aire al buscador.
- Derecha: píldora `✦ Preguntale a mango` (`h-9 rounded-full border border-input`)
  que abre el `FloatingAgent`, + `♡` guardados, + avatar/cuenta.
- La nav horizontal de 5 links desaparece del header y vive en el `Sheet` y en
  el footer.

### 6.2 Hero (`src/sections/HeroSection.tsx`)

- Banda: `rounded-compact bg-muted px-6 py-10` a `max-w-[1180px]`, no full-bleed.
  A la derecha (≥lg), collage de 2–3 imágenes verticales `rounded-compact` con
  `aspect-[3/4]` — Kayak usa fotos de viaje; el equivalente honesto acá son
  fotos de personas/lugares de los corredores reales que cubrimos, nunca stock
  de "fintech".
- H1: alineado a la **izquierda** (hoy centrado), `font-heading`,
  `text-[40px] lg:text-[52px] font-extrabold tracking-tight`, con **punto final
  coral**: `<span className="text-brand-cta">.</span>`. Es literalmente el
  remate de Kayak y funciona perfecto con el naming de marca.
- El gradiente sobre la palabra destacada se elimina: con el CTA ahora en
  gradiente, dos gradientes en la misma pantalla compiten.
- La barra de confianza (150+/100+/50+) se mantiene, alineada a la izquierda,
  en `text-meta`.

### 6.3 Tres tarjetas de prueba social

Debajo del comparador, antes de `HowItWorksSection`: 3 `compare-card` en grid,
`p-5`, con la misma anatomía de Kayak (ilustración/íconos arriba, título
`text-metric font-bold`, subtítulo `text-meta text-muted-foreground`):
**"Comparás y ahorrás"**, **"N búsquedas esta semana"** (dato real de
`StatsSection`, no inventado), **"Sin comisión oculta"**. Reutiliza copy
existente; no se inventan métricas.

### 6.4 Resto

- `HowItWorks`, `Stats`, `Business`, `Blog`: cambiar `surface-card` →
  `compare-card` y radios `2xl` → `compact` para que la página entera tenga la
  misma geometría dura. Es un find/replace acotado por sección, revisando cada
  uno.
- Footer: pasar a 4 columnas de links con títulos `text-badge uppercase
  font-bold tracking-wide text-muted-foreground`, estilo Kayak.
- **Modo oscuro:** el `.dark` de `styles.css` hoy solo declara `color-scheme`.
  Este spec no lo introduce; si más adelante se agrega, los tokens nuevos deben
  redefinirse ahí también.

---

## 7. Criterios de aceptación

Un cambio está listo cuando **todo** esto se cumple:

- [ ] `bun run typecheck`, `bun run lint`, `bun run test` y `bun run i18n:check` pasan.
- [ ] `grep -rn "text-\[9px\]\|text-\[10px\]\|text-\[11px\]" src/sections/ComparatorSection.tsx src/components/EmbedComparator.tsx` no devuelve nada.
- [ ] `grep -rn "bg-\[#\|text-\[#\|rounded-\[" src/sections/ComparatorSection.tsx src/components/EmbedComparator.tsx` no devuelve nada.
- [ ] Ningún token nuevo quedó sin fila en `docs/design-system.md`.
- [ ] La barra de búsqueda desktop es un solo rectángulo: capturar screenshot a
      1280px y verificar que no hay bordes ni sombras internas entre segmentos.
- [ ] Una fila de proveedor mide ≤148px de alto a 1280px con todos sus chips.
- [ ] A 375px no hay scroll horizontal en ninguna parte de `/` ni de `/embed`.
- [ ] El widget entra completo en 440×620 sin scroll interno con 4 resultados.
- [ ] Contraste ≥ 4.5:1 en: badge de mérito best, badge de mérito cheap, texto sobre `--gradient-cta`,
      `text-muted-foreground` sobre `--surface-canvas`.
- [ ] Foco visible con teclado en los 5 segmentos de la barra, en las 3 tabs, en
      los chips y en cada CTA de fila.
- [ ] La disclosure de patrocinado sigue visible y legible (≥12px) en desktop,
      mobile y widget.

## 8. Lo que este spec deliberadamente NO hace

- No toca `RfqTerminal.tsx` ni `admin.i18n-status.tsx` (paleta propia; mismo
  criterio de scope que ya usa `docs/design-system.md`).
- No cambia el ranking, el scoring ni la neutralidad del comparador. La única
  regla de jerarquía visual que cambia es cómo se marca la fila destacada
  (borde coral → badge + CTA sólido).
- No introduce el naranja de Kayak (`#FF690F`/`#E8381B`) en ningún lado. Si
  aparece un hex de esa familia en un diff, está mal.
