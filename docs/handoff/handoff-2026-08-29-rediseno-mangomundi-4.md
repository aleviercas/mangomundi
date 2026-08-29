# Handoff — rediseño "Mangomundi 4" (29-ago-2026)

> Estado: **en curso**, sobre la rama `claude/reorganizar-entrega-rediseno-za6gmc`
> (todavía no mergeada a `main`, nada de esto está LIVE). Este documento es el
> punto de entrada para cualquier sesión de Claude que retome este trabajo —
> resume qué se pidió, qué ya se hizo, y qué queda, con las decisiones de
> producto ya tomadas para no tener que volver a preguntarlas.

## 1. Origen y dónde está la especificación

Alejandro entregó un rediseño completo (home, comparador, modo Business,
widget, identidad de marca) en una carpeta `entrega/` en la raíz del repo,
con la misma estructura que debía quedar copiada. Esa carpeta ya se
reorganizó según su propio `LEEME.md`:

- `entrega/design/` → **`design/`** (raíz del repo). Incluye los tres
  `.dc.html` (páginas HTML normales, se abren con doble clic, todo el
  markup/CSS es inline y literal — son la referencia exacta de medidas,
  colores y espaciado):
  - **`design/Mangomundi 4 - Final.dc.html`** — el plano a implementar: 4
    pantallas (home antes de comparar, home con resultados, modo Business,
    mobile + widget). **Es la fuente de verdad visual.**
  - `design/Mangomundi 6 - Marca y assets.dc.html` — mesas de trabajo de los
    PNG de marca.
  - `design/Mangomundi 5 - Wordmark.dc.html` — opcional, historia de cómo se
    llegó al logo.
  - `design/HANDOFF.md` — **la especificación en texto**, léela primero.
  - `design/COMO-IMPLEMENTAR.md` — instrucciones de proceso (para humanos).
- `entrega/public/brand/` → **`public/brand/`** — los assets que sí se
  publican (favicons, og-card, avatar, firma de email, `manifest.json`).
  Ya estaban completos en el repo antes de este handoff, no hizo falta
  generar nada.
- `entrega/` se borró una vez copiado.

**Antes de tocar cualquier cosa de esto, leer `design/HANDOFF.md` completo.**
Es corto y tiene las reglas de marca (colores exactos, umbral de bicolor,
qué NO se toca) y la arquitectura de home/comparador/Business/widget
sección por sección.

## 2. Mapeo completo handoff → código

Se hizo un mapeo exhaustivo, archivo por archivo, de cada pedido del
handoff contra el código real de `src/`, con nivel de riesgo. **No se
repite acá** — quedó en la conversación que originó este documento, pero
la síntesis (qué se hizo y qué falta) está en las secciones 3 y 4 de este
archivo, que sí es lo que hace falta para continuar.

## 3. Ya implementado (esta sesión, 29-ago-2026)

Commits en `claude/reorganizar-entrega-rediseno-za6gmc`, en orden:

1. **Reorganización de `entrega/`** → `design/` + `public/brand/` según su
   `LEEME.md`.
2. **Favicons/og:image → `public/brand/`** (`src/routes/__root.tsx`): el
   `<head>` pasó de un set de favicons de una ronda de diseño anterior
   (`favicon.ico`, `icon-16/32.png`, `apple-touch-icon.png`,
   `android-chrome-*.png`, `site.webmanifest`, `og-image.jpg` — documentados
   como LIVE en `docs/ale.md` §8, ronda previa) al set nuevo de
   `public/brand/` (`favicon-16/32.png`, `apple-touch-icon.png`,
   `manifest.json`, `og-card.png`). `theme-color` → `#241C16`. El `logo` del
   JSON-LD (`Organization` en `index.tsx`, `Article.publisher` en
   `blog_.$slug.tsx`) pasó de `og-image.jpg` (pensado para redes, 1200×630)
   a `brand/icon-512.png` (cuadrado, más correcto para ese campo). Los 8
   archivos legacy se borraron de `public/` (confirmado por grep que no
   tenían otras referencias). También se dio de baja `src/assets/mango-logo.svg`
   (ícono legacy de dos emes, cero referencias).
3. **`Wordmark.tsx` reescrito** con la identidad definitiva del handoff:
   - Ícono nuevo (`BrandMark`, interno al archivo): una sola "m" de Rubik
     700 partida por un `clip-path` diagonal en dos copias superpuestas
     (tinta a la izquierda, mango a la derecha) — replica exactamente el
     patrón del `.dc.html` (mismo polígono de `clip-path`), no es un SVG
     trazado (eso sigue pendiente, ver §5 del HANDOFF — "Lo que falta
     diseñar").
   - `"ango"`/`"undi"` en cursiva **real** (`font-style: italic` sobre Rubik
     Italic 700 cargada), las dos "m" rectas.
   - Prop nueva `compact` (sin ícono, una sola tinta) para usos por debajo
     del umbral de 18px del handoff — usado en el "powered by" de
     `EmbedComparator.tsx`.
   - Colores como constantes hex literales (`#241C16` / `#EE5B3E` /
     `#FF8A6B`) en vez del token `--accent` del sitio — a propósito, para
     que la marca no derive si el accent general de la UI cambia.
   - Rubik (`ital,wght@0,700;1,700`) se sumó a los `<link>` de Google Fonts
     en `__root.tsx`, **solo para estos usos de marca** — no reemplaza
     Sora/Manrope en el resto del sitio (eso no estaba pedido). Token
     `--font-brand` nuevo en `styles.css`.
   - Los 3 call-sites reales (`Header.tsx`, `Footer.tsx`,
     `EmbedComparator.tsx`) no cambiaron de props salvo el `compact` en el
     widget.
4. **Fotografía — 2 de 3 imágenes**, tratamiento propio en vez del
   thumbnail compartido `max-w-xs`/16:9 que tenían las tres:
   - `HowItWorksSection.tsx`: `howitworks-person.jpg` a 470×340 (medida
     literal del handoff), columna fija `470px` en el grid.
   - `BusinessSection.tsx`: `business-person.jpg` agrandada (`aspect-[4/3]`,
     `max-w-sm`), columna del grid ajustada a `1.3fr/0.7fr`.
   - **`AboutManifestoSection.tsx`** — este fue más grande de lo que
     parecía: el handoff pide `about-coins-globe.jpg` como **banda oscura a
     sangre "detrás del manifiesto y las cifras"**, y "el manifiesto" y "las
     cifras" eran dos secciones separadas (`AboutManifestoSection` con 3
     pilares mission/vision/problem, y `StatsSection` con 4 números). Se
     **fusionaron en una sola sección** (decisión confirmada por Alejandro):
     fondo `#120E0B` a sangre, imagen a la derecha con degradado 90° (mismos
     valores literales del `.dc.html`), copy a la izquierda, y las 4 cifras
     de `StatsSection` como tarjetas translúcidas 2×2 a la derecha.
     `StatsSection.tsx` se borró (sin otro uso salvo un comentario en
     `HeroSection.tsx`, actualizado). **El copy no cambió** —
     `home.about.eyebrow/title/subtitle` y las 4 labels de `home.stats.*`
     son las mismas keys ya traducidas a 20 idiomas (el título "Financial
     intelligence for every currency decision" es uno de los dos titulares
     que el propio HANDOFF pide conservar tal cual — ver su §2). Los 3
     pilares dejaron de renderizarse (el mockup no los muestra en esta
     pantalla); sus i18n keys quedan definidas pero sin uso, no se
     borraron.

5. **Conteo real de proveedores (punto 7)** — nuevo server fn
   `getProviderCounts` (`src/lib/fx.functions.ts`), misma regla de
   elegibilidad que `compareProviders` (`segment IN (x, "both")`), consumido
   por un hook compartido `useProviderCounts` (`src/hooks/use-provider-counts.ts`,
   una sola query cacheada por React Query — nunca un número escrito a
   mano). Alimenta la línea "N providers · retail rates" / "N brokers ·
   negotiated rates" junto al conmutador Individual/Business en
   `ComparatorSection.tsx`.
6. **Modo Business, campos "ahora" (punto 4)** — antes de tocar nada se
   confirmó que **`RfqTerminal.tsx` no se usaba en ningún lado de la app**
   (ninguna ruta lo importaba); se borró junto con `rfq.functions.ts`, su
   único consumidor. El flujo de Business real vive en `ComparatorSection`
   (buscador compartido + chat de captación), así que ahí se sumaron
   **Contract type** (Spot/Forward/Option) y **Frequency**
   (One-off/Monthly/Quarterly), visibles solo con el conmutador en Business,
   con el CTA cambiando a "Request". Son estado de UI únicamente por ahora
   — no hay tabla de brokers ni backend para spread/minimum/settlement, así
   que no se fuerza ningún envío con estos datos.
7. **Banner estable de upsell a Business (punto 2)** — el banner que
   aparecía/desaparecía debajo de resultados según el monto tipeado
   (removido a propósito, ver el comentario en `BusinessSection.tsx`) se
   reintrodujo distinto: una línea **siempre visible** una vez que hay
   resultado (segmento retail), que solo cambia de énfasis según
   `B2B_UPSELL_MIN_AMOUNT` (gris por debajo, fondo arena + CTA marcado por
   encima) — nunca un salto de layout entre los dos estados. El copy usa el
   importe que el usuario realmente tipeó, no un número fijo. La banda
   estable de `BusinessSection.tsx` (home) y el nudge dentro del chat del
   agente (`comparator.copilot.b2bUpsell`) son piezas distintas, no se
   tocaron.
8. **Widget 360×540 + bloque de invitación (punto 3)** — se confirmó
   explícitamente con Alejandro cambiar el **default público** del widget
   (`public/widget.js` era 440×600, no 360×540 — afecta en silencio a
   cualquier sitio de terceros que ya lo haya embebido sin fijar
   `data-height`/`data-max-width`). Actualizado en las 3 fuentes de esa
   medida (`public/widget.js`, el snippet `<iframe>` copiable y el preview
   en vivo de `EmbedWidgetSection.tsx`). Proveedores mostrados: se mantiene
   ganador + 2 (sin cambios) — con el formulario compartido apilándose a
   ~4 campos a 360px de ancho, el presupuesto vertical de un box de 540px
   no alcanza para más (razonamiento completo en el comentario de
   `CompactResultsList`, `ComparatorSection.tsx`). Lo que sí cambió, la
   parte innegociable: el bloque de invitación pasó de un link suelto
   ("See all N on mangomundi") a un bloque completo — título + bajada + CTA
   — con el número real de proveedores restantes de ESE corredor, nunca el
   catálogo global.

**i18n de todo lo anterior:** cada key nueva se agregó primero en inglés
(`src/lib/i18n.tsx`) y se propagó como **placeholder EN** (no traducción
real) a los 19 `scripts/translations/<lang>.json` + el ledger
`scripts/translations/.pending.json` — es el mismo mecanismo de fallback
que ya usa `scripts/translate.ts` (`t()` cae a inglés si falta la key, y el
propio script trata "idéntico al EN" como "todavía no traducido, en cola").
Sin este paso, `I18N_STRICT=1` (parte del `prebuild`) rompía el build en
Vercel — no es opcional, hay que hacerlo cada vez que se agrega una key
genuinamente nueva (no aplica cuando solo se MODIFICA el texto de una key
existente — ahí sí alcanza con tocar el inglés, la traducción vieja de las
otras 19 sigue siendo válida hasta el próximo lote real de traducción, que
necesita `OPENROUTER_API_KEY` — no disponible en este sandbox).

Verificación hecha en cada paso: `tsc --noEmit` limpio, `eslint` sin errores
nuevos (queda un error preexistente en `i18n.tsx` línea ~3524,
`react-hooks/rules-of-hooks` sobre un `useRouterState` envuelto a propósito
en `try/catch` — no relacionado con nada de este handoff), `I18N_STRICT=1
bun run scripts/i18n-validate.ts` en verde, y SSR real vía `/embed`
(la única ruta que no depende de Supabase en su loader) confirmando que
`ComparatorSection`/`EmbedComparator` siguen renderizando sin errores en
cada paso. **No se pudo levantar la home completa en este sandbox** — falta
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (no es un problema de estos
cambios, es una limitación del sandbox: `index.tsx`'s loader hace
`ensureQueryData` de `listBlogPosts` sin try/catch, y tira abajo toda la
ruta si Supabase no responde). Cualquier verificación visual completa del
comparador (incluido el bloque de campos de Business, que no se pudo
renderizar por esto) necesita esas credenciales o un preview de Vercel.

## 4. Decisiones de producto ya tomadas (para lo que falta)

Todas confirmadas por Alejandro el 29-ago-2026 — no volver a preguntarlas:

1. ✅ **HECHO** (ver §3.7). **Umbral de upsell a Business**: usar `B2B_UPSELL_MIN_AMOUNT`
   (`src/config/providers.config.ts`, hoy 10.000) — el 25.000 del mockup era
   el importe de ejemplo de esa pantalla, no una regla nueva. El copy debe
   mostrar el importe que tipeó el usuario, no un número fijo.
2. ✅ **HECHO** (ver §3.7). **Banner de captación a Business en el comparador**: no debe aparecer y
   desaparecer según el monto tipeado (por eso se había sacado — ver el
   comentario ya existente en `BusinessSection.tsx`). Convertirlo en **una
   línea estable al pie de los resultados**, siempre visible, que cambia de
   énfasis (no de existencia): por debajo del umbral, gris, "Sending more
   than 10,000? Business brokers quote negotiated rates"; por encima, mismo
   texto con fondo arena y el CTA marcado. Sin salto de layout entre los dos
   estados. La banda estable que ya vive en `BusinessSection.tsx` (home) NO
   se toca — esto es una pieza nueva, adentro de `ComparatorSection.tsx`.
3. ✅ **HECHO** (ver §3.8, con una decisión extra confirmada: cambiar también
   el default público 440×600 → 360×540). **Widget (`EmbedComparator.tsx`)**: el bloque de invitación a mangomundi
   ("X more providers... Compare all 52 ↗") es **innegociable** — es el
   punto central de ese rediseño. La cantidad de proveedores mostrados (4 en
   el mockup) NO es innegociable: hay que medirlo con la densidad visual
   nueva dentro de 360×540 sin scroll; si 4 no entran, se baja a ganador + 2
   (que es lo que hay hoy — ver el comentario en `CompactResultsList`,
   dentro de `ComparatorSection.tsx`, que documenta que ya se probó 3 y no
   entraba con la densidad actual) pero el bloque de invitación se mantiene
   completo siempre.
4. **`RfqTerminal.tsx` (modo Business)** — partido en dos fases:
   - ✅ **HECHO** (ver §3.6, con un hallazgo que cambió el plan: `RfqTerminal.tsx`
     no se usaba en ningún lado, se borró). **Ahora**: sumar al form los dos
     campos que faltan (tipo de contrato: Spot/Forward/Option; frecuencia:
     One-off/Monthly/Quarterly) — la línea "N brokers · negotiated rates"
     junto al conmutador salió gratis del punto 7, que también quedó hecho.
   - **Sigue pendiente — no hacer sin confirmar primero.** La tabla de
     brokers con SPREAD/MINIMUM/SETTLEMENT/
     CONTRACTS + panel acumulativo "Your request". **No inventar estos datos**
     si no existen en el schema de Supabase — confirmar primero si
     `providers` (o una tabla nueva) tiene spread/minimum/settlement para
     brokers corporate; si no existe, es trabajo de backend, se decide y se
     prioriza aparte.
5. **Pendiente.** **Rutas `/send/:from-:to`, `/exchange/...`, `/business` con estado en la
   URL** — partido en dos fases también:
   - **Fase A** (refactor puro, sin cambio visual): mover el estado del
     comparador (`from`/`to`/`amount`/países/segmento en
     `ComparatorSection.tsx`, hoy 100% en `useState`) a `validateSearch` +
     `Route.useSearch()`/`navigate({ search })`. Se prueba solo — nada debería
     verse distinto.
   - **Fase B** (después de A): las rutas lindas `/send/:from-:to` y
     `/business` como archivos nuevos en `src/routes/`, reusando el estado ya
     levantado a la URL en la fase A.
   - **`/exchange` no entra** en ninguna fase — la pantalla no está
     diseñada (el propio HANDOFF §8 lo reconoce como pendiente).
6. **Pendiente.** **Rail izquierdo de 268px** (Filtros → Agente IA → Alerta de tasa →
   Trustpilot) en `ComparatorSection.tsx` — paso propio, **después** de
   reposicionar filtros/sort (que ya existen casi completos —
   `PRIMARY_SORT_CHIPS`/`MORE_SORT_CHIPS`/`DELIVERY_METHODS`, solo hay que
   redistribuirlos) y con el modo `embedded` (usado por
   `EmbedComparator.tsx`) revisado explícitamente, porque hoy la sección es
   de una sola columna y esto reestructura el grid madre, no es un ajuste
   de estilos.
7. ✅ **HECHO** (ver §3.5). **Conteos "52 providers" / "14 brokers"**: no existen en el código ni
   derivados de datos reales hoy (lo más parecido es un `"50+"` hardcodeado
   en `HeroSection.tsx`, `home.stats.providers`). Contarlos **de verdad**
   desde la config/datos de proveedores. Si no se puede resolver ahora, usar
   **una sola constante** que alimente todos los lugares que necesiten el
   número — nunca escribirlo suelto dentro del copy de cada pantalla (es
   exactamente el motivo por el que el handoff ya sacó el conteo del
   subtítulo del hero — ver su §2). Si ni eso es viable de inmediato, usar
   "50+"/"más de 50" como fallback.
8. **i18n**: cualquier copy nuevo o modificado (el sello "Live/Estimated ·
   fecha", "Go to X ↗", "−X vs best", el texto del punto 2 de esta lista,
   etc.) se agrega **primero en inglés** (`src/lib/i18n.tsx`, dict `en`). Las
   otras 19 traducciones **no se tocan en el mismo cambio** — quedan con el
   string viejo hasta un lote de traducción aparte revisado. No traducir
   copy financiero sin revisión.

**Orden acordado para lo que sigue** (agregado por Alejandro sobre la
secuencia original): rail (punto 6) va después de filtros/sort, con
`embedded` revisado — no es un ajuste, es reestructurar el layout madre.
Rutas (punto 5) primero el refactor de estado a la URL (fase A, se prueba
solo), después las rutas lindas (fase B). Business (punto 4) y el conteo
real de proveedores (punto 7) pueden resolverse en paralelo a lo anterior,
son más acotados.

## 5. Qué queda sin resolver (ni por el handoff ni por esta sesión)

Reconocido explícitamente en `design/HANDOFF.md` §8 — no es una omisión de
esta sesión:

- Estados de carga/error/sin-resultados del comparador rediseñados al nuevo
  lenguaje visual (hoy existe una versión funcional, sin el rediseño).
- La pantalla `/exchange` completa (solo está resuelto el modelo y el punto
  de entrada, ver punto 5 arriba).
- El SVG trazado del logo (los PNG de `public/brand/`, renderizados con
  Rubik, son válidos en producción hasta que exista).

## 6. Cómo seguir

1. Leer este documento completo.
2. Leer `design/HANDOFF.md` completo (es corto).
3. Abrir `design/Mangomundi 4 - Final.dc.html` en un navegador para ver las
   4 pantallas de referencia — cada valor de color/tamaño/espaciado ahí es
   literal.
4. Retomar por la sección 4 de este documento, en el orden acordado.
5. **Actualizar este archivo** (o agregar uno nuevo con fecha, si el alcance
   cambia mucho) cada vez que se cierre un tramo — mismo mecanismo que
   `docs/PROJECT-STATE.md` ya usa para el resto del proyecto.
