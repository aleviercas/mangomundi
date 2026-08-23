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

## Tipografía

- **Sora** (`font-heading`) — todos los `h1`–`h6`, ya aplicado globalmente en `@layer base`.
- **Manrope** (`font-sans`, default del `body`) — todo el texto de párrafo/UI.
- Sin escala de tamaños formal todavía (los componentes usan tamaños Tailwind ad-hoc: `text-xs`/`text-sm`/`text-lg`/etc. según contexto) — **pendiente para una próxima pasada**: definir una escala nombrada (ej. `--text-eyebrow`, `--text-body`, `--text-h1`...) si se quiere más consistencia entre secciones.

## Radios y espaciado

- `--radius: 0.875rem` como base, con la escala derivada `--radius-sm` hasta `--radius-4xl` (todas calculadas a partir de la base — cambiar `--radius` ajusta todo el sitio de una vez).
- Espaciado: sin tokens propios, usa la escala default de Tailwind (`gap-2`, `p-4`, etc.) — consistente por convención, no por sistema formal.

## Utilidades compuestas (`@utility` en `styles.css`)

- **`.btn-cta`** — botón de acción primaria completo: fondo `brand-cta`, hover con elevación (`box-shadow`), estado `:active` (press down), `:disabled` (opacity). Usar esto en vez de armar `bg-brand-cta hover:bg-brand-cta-hover` a mano — ya incluye los estados que un CTA premium necesita.
- **`.surface-card`** — card elevada estándar (fondo `--card`, borde, radio `2xl`, sombra sutil de dos capas). Usado en `ContactSection`, `BlogSection`, `ComparatorSection`, `BusinessSection`, `CTASection`.
- **`.terminal-*`** (`terminal-card`, `terminal-input`, `terminal-chip`, etc.) — estética "consola" a propósito, **usada solo en `RfqTerminal.tsx`** (el widget de cotización de negocios). No es un sistema visual en competencia con el resto del sitio, es una elección de diseño deliberada y acotada a ese único componente — no expandir a otras secciones sin que sea una decisión consciente.
- **`.no-scrollbar`** — oculta scrollbar manteniendo el scroll funcional (listas horizontales tipo chips).

## Pendiente (próximas pasadas del sprint de diseño)

1. Escala tipográfica formal (si se decide que hace falta más consistencia que la actual).
2. Aplicar el sistema depurado al resto de componentes que ya usan `surface-card`/`btn-cta` correctamente pero podrían pulirse más (ver plan en `docs/PROJECT-STATE.md` sección 7).
3. Arquitectura SEO (Search Console) y seguridad (headers, CSP) — sprints 4 y 5 del plan, no forman parte de este documento.
