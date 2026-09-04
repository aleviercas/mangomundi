# mangomundi — sistema de diseño

> Referencia de los tokens/utilidades reales del proyecto (`src/styles.css`).
> Objetivo del sprint de diseño premium (ago 2026): que todo el sitio use
> este sistema de forma consistente — nada de colores/tamaños sueltos en
> componentes. Este documento es la fuente de verdad de qué existe y para
> qué se usa cada cosa; actualizarlo cada vez que se agregue o cambie un
> token.

## Regla no negociable

**Nunca hardcodear un color, radio o tamaño que ya tiene un token.** Antes
del sprint de ago 2026 había 14 lugares con `#ff6b5b`/`#ff5a48`/`#ff8577`
sueltos en componentes — el mismo color que ya existía como token
(`--color-brand-cta`), pero con 3 tonos de "hover" ligeramente distintos
entre sí por no estar centralizados. Ya corregido (ver `git log`, commit de
"design system foundations"). Si hace falta un color/tamaño nuevo, se agrega
como token en `styles.css`, no como valor arbitrario `[#hex]`/`[Npx]` en el
componente.

## Colores

Todo en OKLCH, definido en `:root` (`src/styles.css`) y expuesto como
utilidades Tailwind vía `@theme inline` (cualquier `--color-X` genera
`bg-X`/`text-X`/`border-X`/`ring-X`/etc. automáticamente).

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Fondo y texto base de toda la app |
| `--card` / `--card-foreground` | Superficies elevadas (cards, modales) |
| `--muted` / `--muted-foreground` | Texto secundario, fondos sutiles |
| `--accent` | **El color de marca** (coral/mango) — ver `--color-brand-cta` abajo |
| `--border` / `--input` / `--ring` | Bordes, inputs, focus rings |
| `--destructive` | Errores, acciones destructivas |

**Marca (`--color-brand-cta*`)** — capa semántica sobre `--accent`, para que
el significado ("este es el color de la acción principal") quede explícito
en el nombre de la clase en vez de tener que recordar que `accent` = coral:

- `--color-brand-cta` → `bg-brand-cta` / `text-brand-cta` / `ring-brand-cta` — el **único** color para CTAs primarios, eyebrows/labels de marca y elementos interactivos destacados. No usar para nada decorativo.
- `--color-brand-cta-hover` → `hover:bg-brand-cta-hover` / `hover:text-brand-cta-hover`
- `--color-brand-cta-foreground` → `text-brand-cta-foreground` (texto sobre fondo `brand-cta`, normalmente blanco)

**Superficie de comparación (`--color-surface-canvas`, `--gradient-cta`, `--color-merit-*`)** —
agregados en la pasada "Kayak skin" (sep 2026, ver `docs/kayak-redesign-spec.md`).
El comparador y el widget dejaron de ser "una sección más del home" y pasaron a
ser una superficie de buscador, con su propia geometría y su propio lienzo:

| Token | Utilidad | Uso |
|---|---|---|
| `--surface-canvas` | `bg-surface-canvas` | Fondo de la sección del comparador: medio punto de L por debajo de `--background`, para que las tarjetas blancas floten. Nunca como fondo de página completa. `text-muted-foreground` encima mide **5.26:1**. |
| `--accent-deep` | `bg-accent-deep` / `text-accent-deep` | Extremo oscuro del gradiente de CTA. No usarlo suelto salvo para sombras del propio CTA. |
| `--gradient-cta` | vía `.btn-cta-gradient` | El **único** gradiente del sitio. Va de `--accent` a `--accent-deep` (no de `--mango-glow`, ver el comentario del token). Contraste medido con texto blanco: **3.39:1** en el extremo claro (idéntico al `.btn-cta` plano que reemplaza) y **4.00:1** en el oscuro. No llega a los 4.5:1 de AA para texto chico: subirlo exige oscurecer el coral de marca en todo el sitio, decisión pendiente. |
| `--merit-best` / `--merit-best-foreground` | `bg-merit-best` / `text-merit-best-foreground` | Badge "mejor opción" de la fila de resultados. **7.20:1** medido. |
| `--merit-cheap` / `--merit-cheap-foreground` | `bg-merit-cheap` / `text-merit-cheap-foreground` | Badge "más barato". **7.71:1** medido. |

Se llaman `merit-*` y no `badge-*` a propósito: `text-badge-*` sería ambiguo
entre el color y el tamaño `--text-badge`.

**Estado semántico (`--color-success`/`--color-warning`)** — agregados en la
pasada de rediseño de ago 2026 porque el sitio ya tenía ~15 usos sueltos de
`emerald-500`/`amber-600`/etc. (stock Tailwind, sin relación con la paleta
OKLCH del resto del sitio) para "tasa buena"/"revisar"/"copiado"/"corredor
sin datos". Mismo patrón que `brand-cta`: un color base + su `-foreground`
para texto legible sobre el fill sólido.

- `--color-success` / `--color-success-foreground` → `bg-success`/`text-success` (icono, texto de estado, badge sólido con `text-success-foreground` encima).
- `--color-warning` / `--color-warning-foreground` → mismo patrón. Para una caja de aviso con fondo tenue, usar `bg-warning/10 border-warning/40 text-warning` (el tono base ya es lo bastante oscuro para leerse directo sobre fondo claro, no hace falta un tono "oscuro" aparte — mismo criterio que ya usa `text-brand-cta` sobre fondos claros).
- **`text-destructive`** (ya existía) sigue siendo el tercer estado — error real, no "revisar".
- Deliberadamente NO tocado: `RfqTerminal.tsx` (terminal oscura, paleta propia) y `admin.i18n-status.tsx` (herramienta interna) — mismo criterio de scope que `.terminal-*` abajo.

## Tipografía

- **Sora** (`font-heading`) — todos los `h1`–`h6`, ya aplicado globalmente en `@layer base`.
- **Manrope** (`font-sans`, default del `body`) — todo el texto de párrafo/UI.
- **Escala formal** (agregada ago 2026, `@theme inline` en `styles.css`, sintaxis `--text-*`/`--text-*--line-height`/`--text-*--letter-spacing` de Tailwind v4 — genera `text-eyebrow`/`text-h1`/etc. automáticamente):

  | Token | Tamaño | Uso |
  |---|---|---|
  | `text-eyebrow` | 12px / tracking .18em | Label uppercase sobre un título de sección (antes: `text-xs ... tracking-[0.18em]` repetido a mano en 10+ lugares) |
  | `text-h1` | 48px (usar junto a un tamaño móvil menor, ej. `text-4xl sm:text-h1`) | Título de página standalone: portada del blog, post individual, `/legal` |
  | `text-h2` | 44px (idem, `text-3xl sm:text-h2`) | Título de sección repetible dentro de una página (todas las secciones del home). Antes esto oscilaba sin criterio entre `sm:text-4xl` y `sm:text-5xl` según qué sección — ya unificado. |
  | `text-h3` | 20px | Título de card/subsección (features, testimonios, related posts, sponsored). Antes mezclaba `text-lg`/`text-xl` con distinto `font-semibold`/`font-extrabold` sin regla clara. |
  | `text-h4` | 16px | Reservado para un cuarto nivel si aparece (footer headings, etc. — todavía no migrado, son casos chicos con `text-sm font-bold` que no valía la pena tocar en esta pasada). |

- **Escala de la superficie de comparación** (sep 2026, pasada "Kayak skin").
  Los micro-tamaños de la grilla de resultados (`text-[9px]`/`[10px]`/`[11px]`)
  **sí** se migraron ahora: eran ilegibles y no había regla de cuándo usar
  cuál. El piso del sistema pasa a ser 12px, igual que kayak.com, que no baja
  de ahí en ninguna parte de su buscador. `RfqTerminal.tsx` y
  `admin.i18n-status.tsx` quedan fuera, mismo criterio de scope de siempre.

  | Token | Tamaño | Uso |
  |---|---|---|
  | `text-price` | 24px | El monto recibido — el número de la decisión, uno por fila |
  | `text-metric` | 16px | Valor primario de una métrica de fila / titular de tab |
  | `text-meta` | 13px | Texto secundario denso: métricas inline, labels de chip, CTA de fila |
  | `text-badge` | 12px | Piso del sistema: badges, disclosures, línea de confianza |

## Radios y espaciado

- `--radius: 0.875rem` como base, con la escala derivada `--radius-sm` hasta `--radius-4xl` (todas calculadas a partir de la base — cambiar `--radius` ajusta todo el sitio de una vez).
- **`--radius-compact: 0.5rem` (8px) y `--radius-control: 0.25rem` (4px)** → `rounded-compact` / `rounded-control`. Geometría de la superficie de comparación, deliberadamente fuera de la escala derivada de `--radius`: un buscador denso necesita esquinas duras (8px tarjeta / 4px control, exactamente lo que usa kayak.com), y con 14px una lista de 8 tarjetas apiladas se lee blanda. Cambiar `--radius` **no** los afecta, y está bien que así sea.
- **`--shadow-compare`** → `shadow-compare`. Sombra de dos capas (una hacia abajo, un halo corto hacia arriba) que despega la tarjeta del lienzo sin hacerla flotar. Va siempre junto a `--radius-compact`; en la práctica se consume por `.compare-card`.
- Espaciado: sin tokens propios, usa la escala default de Tailwind (`gap-2`, `p-4`, etc.) — consistente por convención, no por sistema formal.

## Utilidades compuestas (`@utility` en `styles.css`)

- **`.btn-cta`** — botón de acción primaria completo: fondo `brand-cta`, hover con elevación (`box-shadow`), estado `:active` (press down), `:disabled` (opacity). Usar esto en vez de armar `bg-brand-cta hover:bg-brand-cta-hover` a mano — ya incluye los estados que un CTA premium necesita.
- **`.surface-card`** — card elevada estándar (fondo `--card`, borde, radio `2xl`, sombra sutil de dos capas). Usado en `ContactSection`, `BlogSection`, `ComparatorSection`, `BusinessSection`, `CTASection`.
- **`.compare-card`** — tarjeta de la superficie de comparación: fondo `--card`, radio `compact` (8px), `--shadow-compare`, borde transparente que se puede pintar para estados. **No reemplaza a `.surface-card`**: esa sigue siendo la del marketing (radio 2xl, sombra difusa). Las dos conviven a propósito — el comparador se lee como buscador, el resto de la página como sitio.
- **`.btn-cta-gradient`** — CTA primaria del comparador y del widget: `--gradient-cta` + hover por `brightness` + `:active` + `:disabled`. `.btn-cta` (fill plano) sigue siendo la del resto del sitio.
- **`.terminal-*`** (`terminal-card`, `terminal-input`, `terminal-chip`, etc.) — estética "consola" a propósito, **usada solo en `RfqTerminal.tsx`** (el widget de cotización de negocios). No es un sistema visual en competencia con el resto del sitio, es una elección de diseño deliberada y acotada a ese único componente — no expandir a otras secciones sin que sea una decisión consciente.
- **`.no-scrollbar`** — oculta scrollbar manteniendo el scroll funcional (listas horizontales tipo chips).

## Pendiente (próximas pasadas del sprint de diseño)

1. ~~Escala tipográfica formal~~ — hecho (ago 2026, ver arriba).
2. `legal.tsx`, `PreferredRateModal.tsx` y `ComingSoonModal.tsx` estaban enteramente en paleta `slate-*`/`white` sin tocar los tokens — ya migrados en la misma pasada. Revisar si quedan más componentes fuera del inventario de este documento (no se hizo un grep exhaustivo de *todo* el árbol, solo de lo visiblemente cliente-facing).
3. Aplicar el sistema depurado al resto de componentes que ya usan `surface-card`/`btn-cta` correctamente pero podrían pulirse más (ver plan en `docs/PROJECT-STATE.md` sección 7).
4. Arquitectura SEO (Search Console) y seguridad (headers, CSP) — sprints 4 y 5 del plan, no forman parte de este documento.
