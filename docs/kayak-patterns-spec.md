# Variante B — patrones de Kayak, piel de mangomundi

> **Relación con el otro spec.** `docs/kayak-redesign-spec.md` (variante A,
> "casi clon") y este documento describen **la misma reestructuración de layout
> e interacción**. Lo que cambia es la piel: A adopta también la geometría, la
> densidad y la tipografía única de Kayak; B se queda con la geometría, la
> tipografía y el peso de marca que mangomundi ya tiene.
>
> Por eso este doc **no repite** las fases de layout. Para todo lo estructural
> —barra de búsqueda segmentada, rail de filtros sticky, matriz de precio en las
> tabs de orden, barra de estado, sheets de mobile, barra inferior fija, layout
> del widget, header y hero— la referencia es el spec A, secciones 3.1–3.6, 4,
> 5 y 6.1/6.3/6.4. Acá se define **solo** la Fase 0 (tokens) y las reglas de
> piel que sobreescriben las de A.
>
> **Elegir una y solo una.** Las dos variantes tocan los mismos archivos. No se
> mergean las dos: se compara en preview y se descarta la otra rama.

---

## 1. La diferencia en una tabla

| Dimensión | A — casi clon | **B — patrones (este doc)** |
|---|---|---|
| Layout e interacción | Kayak | **Kayak, idéntico a A** |
| Anatomía de la fila de resultado | Kayak | **Kayak, idéntica a A** |
| Radio de tarjeta | 8px (`--radius-compact`) | **14px, la escala `--radius` que ya existe** |
| Radio de control | 4px | **`rounded-md` / `rounded-lg` actuales** |
| Sombra | `--shadow-compare` (dos capas, corta) | **`.surface-card`, la difusa de siempre** |
| CTA | gradiente `--gradient-cta` | **`.btn-cta`, fill coral plano** |
| Alto de CTA en fila | 36px | **44px (`h-11`), el táctil actual** |
| Titulares | Manrope, familia única | **Sora (`font-heading`), como todo el sitio** |
| Marca de fila destacada | badge + CTA sólido | **borde coral 2px, la señal que ya tiene** |
| Titular del hero | coral sólido + punto final | **gradiente coral actual, sin tocar** |
| Piso tipográfico | 12px | **12px (esto sí se toma de A)** |

**Por qué el piso de 12px se mantiene en las dos.** No es una decisión estética
prestada de Kayak: los `text-[9px]` de la línea de score y los `text-[10px]` de
la disclosure de patrocinado son ilegibles en cualquier sistema, y la disclosure
en particular es una obligación de transparencia que no puede depender de la
vista del usuario. Bajar de 12px no vuelve más "mangomundi" a la interfaz.

---

## 2. Fase 0 — Tokens (versión B)

En `:root` de `src/styles.css`:

```css
  /* Lienzo del comparador. Único token de superficie que esta variante toma
     del patrón de buscador: la separación lienzo/tarjeta es lo que permite
     que una lista larga de resultados se lea como lista y no como una
     mancha continua. El resto de la geometría se queda como está. */
  --surface-canvas: oklch(0.945 0.01 255);

  /* Badges de mérito de la fila ("mejor opción" / "más barato"). Mismo par
     que en A: no hay versión "más mangomundi" de un verde de ahorro. */
  --merit-best: oklch(0.95 0.025 235);
  --merit-best-foreground: oklch(0.42 0.09 235);
  --merit-cheap: oklch(0.95 0.04 150);
  --merit-cheap-foreground: oklch(0.4 0.11 150);
```

En `@theme inline`:

```css
  --color-surface-canvas: var(--surface-canvas);
  --color-merit-best: var(--merit-best);
  --color-merit-best-foreground: var(--merit-best-foreground);
  --color-merit-cheap: var(--merit-cheap);
  --color-merit-cheap-foreground: var(--merit-cheap-foreground);

  /* Escala de la superficie de comparación, calibrada a la voz actual:
     text-price = 26px porque ese es el tamaño que el monto ya tiene hoy
     (text-[26px] font-extrabold), y se sigue usando con font-extrabold —
     A lo baja a 24/600 para igualar la densidad de Kayak, B no. */
  --text-price: 1.625rem;
  --text-price--line-height: 1.05;
  --text-price--letter-spacing: -0.015em;

  --text-metric: 1rem;
  --text-metric--line-height: 1.35;

  --text-meta: 0.8125rem;
  --text-meta--line-height: 1.4;

  --text-badge: 0.75rem;
  --text-badge--line-height: 1.35;
```

**Nada más.** Sin `--radius-compact`, sin `--radius-control`, sin
`--shadow-compare`, sin `--gradient-cta`, sin `.compare-card`, sin
`.btn-cta-gradient`. La tarjeta del comparador sigue siendo `.surface-card` y
la acción primaria sigue siendo `.btn-cta`.

---

## 3. Reglas de piel que sobreescriben a A

Al ejecutar las fases de A, reemplazar así:

| Donde A dice… | En B va… |
|---|---|
| `compare-card` | `surface-card` |
| `rounded-compact` | `rounded-xl` (contenedores) / `rounded-2xl` (tarjetas) |
| `rounded-control` | `rounded-md` |
| `btn-cta-gradient` | `btn-cta` |
| CTA de fila `h-9` | `h-11` |
| `shadow-compare` | la sombra propia de `surface-card` |
| fila destacada = badge + CTA sólido | fila destacada = `border-2 border-brand-cta` **y** badge `Mejor` (el badge se suma, el borde no se saca) |
| tiles de vertical con gradiente activo | tiles con `bg-brand-cta text-brand-cta-foreground` plano |
| barra de búsqueda `h-15` sin borde | barra `h-14` con `border border-border` y el radio actual — segmentada igual, pero con el borde que el resto del sitio usa en sus inputs |
| titulares del comparador en `font-sans` | titulares en `font-heading` (Sora), como hoy |
| hero: coral sólido + punto | hero: **sin cambios**, el gradiente del titular se queda |
| widget: iframe radio 8 + sombra corta | widget: **sin cambios** de geometría (radio 16, sombra actual); solo el layout apilado y el fondo por token |

Todo lo demás de A —los segmentos de la barra, el rail, la matriz de precio,
los sheets, la barra inferior, la anatomía de la fila y el orden de las fases—
se ejecuta **tal cual está escrito ahí**.

---

## 4. Criterios de aceptación

Los de `docs/kayak-redesign-spec.md` §7, con estos cambios:

- [ ] `grep -rn "gradient-cta\|compare-card\|radius-compact\|radius-control\|shadow-compare" src/` **no devuelve nada** (si aparece, se mezclaron las dos variantes).
- [ ] Los `h1`–`h6` del comparador siguen resolviendo a Sora — verificar con `getComputedStyle` en preview, no de memoria.
- [ ] Ningún hex de Kayak, igual que en A.
- [ ] Se mantiene el resto: typecheck/lint/test/i18n, sin `text-[Npx]`, sin scroll horizontal a 375px, contraste ≥4.5:1, foco visible, disclosure de patrocinado ≥12px.
