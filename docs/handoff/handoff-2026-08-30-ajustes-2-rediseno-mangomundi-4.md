# Handoff — "Mangomundi 4", ronda de ajustes 2 (30-ago-2026)

> Estado: **las 8 secciones de `design/AJUSTES-2.md` están completas**, en
> `claude/reorganizar-entrega-rediseno-za6gmc` (la misma rama de siempre —
> todavía no mergeada a `main`, nada de esto está LIVE). Este documento
> continúa
> [`docs/handoff/handoff-2026-08-29-ajustes-1-rediseno-mangomundi-4.md`](./handoff-2026-08-29-ajustes-1-rediseno-mangomundi-4.md)
> (léelo primero si no tenés ese contexto) — la ronda 1 arregló estructura;
> **esta ronda es sobre cómo se ve**, fidelidad pixel-a-pixel de colores,
> medidas y tipografía contra `design/Mangomundi 4 - Final.dc.html`.

## 1. Qué es `design/AJUSTES-2.md` y cómo se trabajó

8 secciones (0 a 7), cada una con un commit propio, en el orden del propio
documento:

0. **Constantes** — commit `85e0486`: paleta base (`--background`,
   `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`,
   `--border`, `--input`, `--ring`, `--success`) pasada de oklch a hex
   literal del mockup en `src/styles.css`.
1. **«Compare»** — commit `2d79957`: copy del CTA, tamaños de campo, ícono
   de swap.
2. **La pantalla de resultados no muestra la home** — commit `56e4df6`:
   6 secciones de marketing ocultas cuando `hasResult`.
3. **Anatomía de la fila** — commit `f32053f`: medidas exactas de
   `ProviderRow` (borde/sombra, tags de ganador, fee breakdown).
4. **Blog** — commit `4662ab0`: banda compacta al pie en vez de la sección
   grande de tres tarjetas.
5. **Banda oscura** — commit `3fd9f36`: retícula 1fr 340px, tarjetas de
   cifras, dos botones nuevos.
6. **Rail izquierdo** — commit `ad58481`: las cuatro tarjetas (Filtros,
   Agente, Alerta de tasa, Trustpilot) a medida exacta.
7. **Header** — commit `2ff78e4`: 66px, nav de 5 ítems, pastilla de idioma.

**Instrucción explícita de esta ronda, distinta de la anterior:** no
confiar en el resumen en prosa de `AJUSTES-2.md` — abrir
`design/Mangomundi 4 - Final.dc.html` e inspeccionar el markup real de
cada elemento antes de tocar CSS. Esto encontró al menos dos diferencias
reales entre lo que el documento *describía* y lo que el mockup
*mostraba* (ver §3).

## 2. Principio que gobernó cada paso — el mismo de siempre

**Nunca inventar datos.** Aplicado en esta ronda:

- **§2**: el "+0.31%" junto a la tasa mid-market no se replica — no existe
  histórico de `market_rate` en el servidor para calcular un delta real.
- **§4**: el "· N MIN" de tiempo de lectura del blog no se replica — no
  hay campo `reading_time` ni cómputo de palabras en ningún lado del
  código; solo se muestra la fecha real (`post.published_at`).
- **§1**: el hint "Under 10 min" del botón "Fastest" (decisión de la
  ronda 1) sigue aplicando el mismo criterio.

Un principio nuevo de esta ronda, no sobre datos sino sobre **destinos de
link**: cuando el mockup pide un CTA/link a contenido que no tiene página
propia en la app (`§5` "Read our method", `§6` "How we make money"), el
enlace apunta al contenido real más cercano en vez de un ancla muerta o
una página inventada — en ambos casos, `/legal#risk`, el mismo destino
real que `Footer.tsx` ya usa para "Risk Disclosure". Es el mismo
razonamiento que "no inventar datos" aplicado a navegación: mejor un link
real a contenido adyacente que uno falso.

## 3. Discrepancias reales entre el texto de AJUSTES-2.md y el mockup

Encontradas al inspeccionar el `.dc.html` directamente en vez de confiar
en la prosa del documento, como pidió Alejandro para esta ronda:

- **§0** describía el ícono de swap como "cuadrado de 46×46". El markup
  real es una columna de grilla de 46px de **ancho**, cuya altura iguala
  a los campos hermanos (58px con resultado, 52px sin). Implementado
  según el markup, no la descripción — documentado en el commit de §1.
- **§6** dice "cada opción [de Filtros] con el conteo alineado a la
  derecha" en términos genéricos; el markup real (`payoutChips` en el
  script del mockup, línea 853-866) define colores exactos y distintos
  para activo/inactivo (`border 1.5px #241C16` + `bg #F5EFE8` activo vs.
  `border 1px #E5DCD1` + `bg #fff` inactivo) que el texto no menciona.
  Además el markup usa una marca de checkbox literal (☑/☐), no íconos —
  el filtro inline de abajo (mobile, `<lg`) conserva sus propios íconos
  lucide sin tocar, es una superficie distinta.

## 4. Cosas que se dejaron sin tocar a propósito

- **§5**: el eyebrow/título/subtítulo de la banda oscura (AJUSTES-1 §F ya
  los fijó a propósito) — `AJUSTES-2.md` §5 solo pide grilla/tarjetas/
  botones, no copy.
- **§6**: el panel del Agente IA acoplado en el rail mantiene su interior
  real (chat con historial, input, acciones) tal como quedó en
  AJUSTES-1 §D — más rico que la vista estática del mockup a propósito;
  solo se corrigió el radio del contenedor (18px).
- **§6**: `RateAlertCard` conserva su formulario real de captura de email
  (decisión ya documentada en el código: capturar interés real en vez de
  un botón estático falso) — el mockup solo muestra un botón porque es
  una maqueta estática, no una instrucción de quitar la funcionalidad.
- **§7**: `HOME_NAV` (compartido con `Footer.tsx`, con "Contact" y otro
  orden) queda sin tocar — Footer no es una de las 8 secciones de esta
  ronda. El header usa una lista nueva y separada, `HEADER_NAV`, con los
  mismos anchors pero el orden/subconjunto literal del mockup (5 ítems,
  sin Contact).
- **Wide-format logo** (76×30, mencionado en el mockup pero no en el
  texto de AJUSTES-2.md): no implementado — no existen assets del
  logotipo en formato ancho, solo los PNG cuadrados actuales; estirarlos
  se vería mal. Ya documentado como excepción en la ronda 1.

## 5. Efecto de cascada de §7 — altura del header

El header pasó de 64px (`h-16`) a 66px, lo que dejó desincronizadas dos
referencias que asumían 64px:

- `src/routes/__root.tsx` — `pt-16` → `pt-[66px]` en el `<main>` que
  compensa el header `fixed`.
- `src/sections/ComparatorSection.tsx` — la barra de búsqueda sticky con
  resultado, `sticky top-16` → `sticky top-[66px]`.

Ambas corregidas en el mismo commit de §7. Si en el futuro el header
vuelve a cambiar de alto, buscar `66px` en el repo debería encontrar las
tres referencias juntas.

## 6. i18n de toda esta ronda

Mismo mecanismo de siempre: cada key nueva se agrega primero en inglés y
se propaga como **placeholder EN** (no traducción real) a los 19
`scripts/translations/<lang>.json` + `.pending.json`. Cuando un paso
**cambió el texto de una key ya traducida** (no una key nueva) — el
"They receive"/"Compare"/"Update" de §1, el `rankByHint` de §6 (corregido
de "above" a "on the right" porque el rail ya no vive arriba de los tabs,
vive a la izquierda) — se tocó **solo el inglés**; las otras 19 quedaron
con el string viejo, sin re-traducir sin revisión (decisión #8 de la
ronda original).

Total de keys nuevas agregadas en esta ronda: `comparator.field.youReceive`
(cambio EN-only), `comparator.cta.compareRates`/`comparator.cta.update`
(§1); 7 keys `comparator.row.tag*`/`feeBreakdown` (§3); `home.blog.
compactTitle`/`allArticles` (§4); `home.about.cta.method`/`aboutUs` (§5);
`comparator.filter.exclusiveOnlyLong`, `comparator.filters.clear`,
`comparator.disclaimer.howWeMakeMoney` (§6); `nav.forBusiness` (§7).

## 7. Verificación hecha en cada paso

Mismo pipeline que la ronda 1: `tsc --noEmit` limpio, `eslint` sin errores
nuevos (mismo único error preexistente en `i18n.tsx` ~línea 3600+,
`react-hooks/rules-of-hooks` sobre un `useRouterState` envuelto a propósito
en `try/catch`, no relacionado con este trabajo), `I18N_STRICT=1 npx tsx
scripts/i18n-validate.ts` en verde después de cada key nueva, y para cada
componente tocado un dev server local (`vite.config.ts` con `host` cambiado
temporalmente a `127.0.0.1`, revertido después) contra rutas que no
dependen de Supabase (`/embed`, `/business`) confirmando el HTML servido
sin errores de runtime. `git status --short` limpio antes de cada
`git add`.

**Nada de esto se pudo probar con un resultado de comparación real** —
mismo límite de siempre, sin credenciales de Supabase en este sandbox. Es
un límite mayor en esta ronda que en la anterior porque casi todo
`AJUSTES-2.md` (§1 compacto, §2, §3, §6) solo se ve una vez que existe un
resultado — la verificación se quedó en tipos + render sin errores +
inspección de código contra el mockup, nunca un screenshot real con datos
vivos.

## 8. Cómo seguir

1. Leer `docs/handoff/handoff-2026-08-29-ajustes-1-rediseno-mangomundi-4.md`
   primero si no se leyó todavía.
2. Este documento cubre `design/AJUSTES-2.md` completo — no debería quedar
   nada pendiente de ese archivo específico.
3. **Antes de mergear a `main`**, con credenciales de Supabase reales (o
   un preview de Vercel), correr una comparación real y mirar en este
   orden — es lo menos verificado de esta rama entera:
   - La barra de búsqueda compacta con resultado (§1/§2): tamaños de
     campo, la tasa mid-market en el header, el ocultamiento de las
     secciones de marketing.
   - Cada fila de resultado (§3): el tag de ganador según el criterio de
     orden activo, el link "Fee breakdown", el footer con los separadores
     "·".
   - El rail izquierdo completo (§6) con un resultado real: los ☑/☐ de
     Filtros, el contador "Clear · N", la tarjeta de Trustpilot con el
     link "How we make money".
   - El header (§7) en un viewport real: que la pastilla de idioma no
     rompa el layout en anchos intermedios (no hay breakpoint específico
     probado entre el nav completo y el menú mobile).
4. **Actualizar este archivo** (o agregar uno nuevo con fecha) si aparece
   otro documento de ajustes — mismo mecanismo que `docs/PROJECT-STATE.md`.
