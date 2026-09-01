# Handoff — décimo round de ajustes (1-sep-2026)

Continúa `docs/handoff/handoff-2026-09-01-noveno-round-widget-business-trustpilot.md`.
Alejandro pasó una lista de 9 puntos (con capturas reales del sitio) sobre lo
entregado en el noveno round. Rama sin cambios:
`claude/coordinar-trabajo-simultaneo-y85idz`.

## Resueltos en esta sesión

1. **`/about` rediseñada** — no tenía NINGUNA imagen (solo texto sobre blanco).
   Agregada una banda hero oscura arriba, reusando la misma foto
   `about-coins-globe.jpg` de la banda "Neutral by design" del home (no un
   asset nuevo), con `background-position:center` en vez de `right center`
   para mostrar más de la imagen al no competir con contenido lateral. El
   botón de "Get in touch" (`ContactSection`) ya usaba `btn-cta` (paleta
   correcta) — no hacía falta tocarlo. Trustpilot de esa sección: mismo fix
   que el punto 2 del noveno round (`[&_.trustpilot-widget]:mx-auto`),
   aplicado también acá.
2. **Blog — fecha + audience tag + ancho inconsistente** — el listado
   (`/blog`) no mostraba fecha ni las badges Business/Retail que el post
   individual (`/blog/$slug`) ya renderiza — agregadas con el mismo patrón
   exacto (mismos i18n keys, mismo estilo). El ancho de lectura era una
   inconsistencia real: listado en `max-w-5xl` (1024px), post en `max-w-3xl`
   (768px) — unificado a `max-w-3xl`. Mobile: el layout ya usaba
   `flex-col`→`sm:flex-row`, sin cambios adicionales necesarios.
   **No verificado visualmente** — `/blog` llama a Supabase en su loader
   (`listBlogPosts`), bloqueado por la política de red de este sandbox
   (mismo límite de siempre); el código reutiliza exactamente el patrón ya
   probado en la página de post individual.
3. **Today's routes — click no llevaba a ningún lado** — las cards eran
   `<div>` sin navegación. Ahora son `<Link to="/send/$corridor">` con el
   slug `from-to` en minúsculas — esa ruta ya existe y ya auto-corre
   `compareProviders` con el monto real (1,000, el mismo que todas estas
   cards muestran). **Fondo de la banda**: la causa real no era esta
   sección en particular sino un bug sitewide — ver punto 4.
4. **Colores del comparador vs. el mockup — bug real encontrado**:
   `__root.tsx` envolvía todo el sitio en `bg-[#fcfcfc]` (un hex hardcodeado,
   casi blanco) en vez del token `--background` (`#fbf8f4`, la crema real
   del mockup) que YA existe en `styles.css` — corregido a `bg-background`.
   Esto es lo que hacía que "Today's routes" (y cualquier sección sin fondo
   propio) se viera más pálida que el mockup en TODA la página, no solo ahí.
   Además, dos sombras estaban con los valores cruzados: el shadow de la
   tarjeta GANADORA en los resultados (`ProviderRow`) usaba el valor del
   mockup pensado para las 3 pestañas de sort (línea 828,
   `rgba(238,91,62,.55)` con blur/offset de pestaña), y las pestañas
   usaban un shadow mucho más débil que el suyo propio (línea 827-828). Se
   corrigieron ambos a sus valores reales del mockup — no son
   intercambiables, tienen blur/offset distintos. También la tarjeta del
   comparador (buscador) era `bg-card` (blanco puro) con sombra de tono
   azulado (`rgba(15,23,42,...)`) en vez de `#FDFBF9` (crema, línea 82 del
   mockup) con sombra de tono marrón/mango (`rgba(60,40,30,.4)`) — corregido.
5. **Píldoras agrupadas** — origen (monto + moneda + país) y destino (país +
   moneda) eran 2 y 2 cajas independientes con borde propio cada una.
   Fusionadas en UNA caja bordeada por lado, con el mismo patrón de
   separador `border-l` que la caja monto+moneda ya usaba internamente
   entre sus dos segmentos — solo se extendió a un tercer/segundo segmento.
   Grid de 6 columnas → 4 (origen | swap | destino | CTA). Verificado con
   Playwright (resultado simulado — ver la nota de metodología abajo):
   se ve como un bloque visual único de cada lado, con el swap y el CTA
   entre medio.
6. **"Natural by design" sacado de `/business`** — el round anterior lo había
   agregado ahí para llenar el vacío del sticky-footer en una página corta;
   revertido según pedido explícito ("no se entiende por qué lo
   agregaste"). En su lugar, `BusinessExtrasSection` se reconstruyó sobre el
   MISMO patrón de panel con foto que `BusinessSection.tsx` ya usa una
   sección arriba (`rounded-[20px] border border-border p-5`, foto en
   columna fija a la izquierda estirada a la altura completa del panel) —
   antes eran una columna de texto suelta al lado de una foto en caja
   300×340 sin marco compartido; ahora leen como un único panel cohesivo,
   con la foto como ancla real en vez de una miniatura.
7. **"Your request" comprimido, botón a la derecha** — antes eran 3 filas
   apiladas (título+explicación, una GRID de 4 columnas de stats ocupando
   todo el ancho, el botón "Send request" en su propia línea completa
   abajo). Ahora los 4 stats son un cluster inline (no una grid forzando
   1/4 del ancho cada uno) compartiendo UNA fila con el botón a la derecha
   — el botón ya no necesita su propia línea; solo el formulario de email
   (necesita espacio para el input) baja a su propia fila, y solo cuando se
   aprieta "Send request". Verificado con Playwright: el panel es
   notablemente más bajo y el botón queda a la derecha de los stats.
8. **"Rank by" (Trust/Fees/Rate) movido del rail a "More filters"** — antes
   vivía en DOS lugares: un dropdown "More criteria" que solo se mostraba
   por debajo del breakpoint `lg` (donde el rail se oculta), Y duplicado
   otra vez dentro del `FiltersCard` del rail para `≥lg`. Eliminado del
   rail por completo; el dropdown (renombrado "More filters", antes "More
   criteria") ahora vive en un solo lugar, siempre visible, al lado de la
   pestaña "Fastest" en la fila de las 3 pestañas grandes — igual en
   individual y en business (es la misma fila para ambos segmentos).
   Verificado con Playwright: el dropdown aparece exactamente al lado de
   "Fastest" con resultado real simulado, y el rail ya no tiene "Rank by".
9. **Widget — contenido cortado + logos con borde** — encontrado el bug
   real: `CompactResultsList` (el widget de resultados) renderizaba una
   línea extra al final (`{tRecipient}` = "Recipient gets", una etiqueta
   pensada para ir al lado de una cifra en otro lugar, no como texto
   suelto) que no existe en el mockup — en el frame fijo de 360×540 con
   `overflow-hidden` (sin scrollbar), esa línea de más empujaba el
   contenido (a veces el propio footer "powered by") más allá de lo
   visible, sin ningún indicio de que existiera. Eliminada — no se
   "re-ajustó" el espacio, directamente no correspondía estar ahí.
   También se sacó el `border border-border` de los logos de proveedor
   dentro del widget (el mockup los muestra sin borde, solo el logo).
   **Verificado de verdad, no solo leído**: con un resultado real inyectado
   vía Playwright en `/embed` a 360×540 exacto,
   `document.documentElement.scrollHeight === clientHeight === 540` —
   cero overflow, confirmado con datos, no solo con el formulario vacío
   como en la ronda anterior. El "default sort = Recommended" ya estaba
   correcto en el código (`sortByScore(rows, "overall")` sponsored-first) —
   no hizo falta ningún cambio ahí, solo se confirmó leyendo el código.

## Metodología de verificación (repetida de la ronda anterior, refinada)

El sandbox sigue sin poder alcanzar `*.supabase.co` ni `trustpilot.com`
(bloqueo de red, no de credenciales — ver el noveno round). Para verificar
layouts que solo aparecen con un `result` real, se repitió la técnica de
inyectar `window.__FAKE_RESULT_FOR_SCREENSHOT__` vía
`page.addInitScript()` de Playwright, leído por un `useState` inicial
temporal en `ComparatorSection` — **el hack se revierte del código antes de
cada commit**, nunca queda rastro. Se usó contra `/business` (no llama a
Supabase en su loader) y contra `/embed` (para medir scroll real del
widget con resultado). Esto permitió verificar de verdad — no solo por
lectura de código — la agrupación de píldoras, el "More filters" al lado
de "Fastest", el panel de "Your request" comprimido, y el widget sin
overflow con datos reales.

## Qué falta / no se tocó

- Punto 2 (blog): el código no se pudo ver renderizado (bloqueo de red en
  el loader de `/blog`), aunque reutiliza un patrón ya probado en el post
  individual — bajo riesgo, pero sin confirmación visual real.
- El vacío tipo sticky-footer en `/about` (mencionado en el noveno round
  como posible, no parte de esta lista) sigue sin tocarse — no fue pedido
  esta vez tampoco.
- Validación completa corrida esta sesión: `bun run typecheck` (limpio),
  `eslint` sobre cada archivo tocado (limpio — el error pre-existente en
  `i18n.tsx` línea 3741 es de código no tocado esta ronda, confirmado por
  diff), `bun run i18n:check` (0 rotos / 0 incompletos de 19), `bun run
  test` (34/34). `bun.lock` sin tocar (verificado antes de commitear).
