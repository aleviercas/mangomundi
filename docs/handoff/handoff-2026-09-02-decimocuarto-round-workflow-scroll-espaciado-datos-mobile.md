# Ronda 14 (2-sep-2026) — workflow de email, auto-scroll del wizard, espaciado real, datos estimados, overflow mobile

Continuación directa de la ronda 13
(`docs/handoff/handoff-2026-09-01-decimotercero-round-fuentes-flash-y-truncados-reales.md`).
Alejandro mandó un batch de 13 puntos (W1-W13) en un solo mensaje; todos
quedaron resueltos, commiteados y pusheados a
`claude/coordinar-trabajo-simultaneo-y85idz` (PR #10 sigue abierto, sin
mergear, a propósito — ver la nota de la ronda 11).

## W1 — Workflow de email para business request

Implementado el mail de confirmación automático: se genera al capturar un
lead de business (`captureBusinessLead` en `agent.functions.ts`), pero
**no se manda directo al cliente** — corrección explícita de Alejandro a
mitad de la ronda: *"mejor que el mail automático no se lo mande al
cliente directamente sino que me lo mandas a mi para enviarselo al
cliente así no es automático y yo lo veo antes"*. El mail llega como
borrador a la dirección interna (`LEAD_NOTIFICATION_EMAIL`, mismo
mecanismo que `sendLeadNotificationEmail`), con un preámbulo "esto es un
borrador, no se envió al cliente, reenviar a X" y el email del cliente
bien visible arriba. Además se entregó el plan (solo plan, no código,
como pidió Alejandro) para el siguiente paso — disparar pedidos de
cotización a los proveedores y trackear comisiones — en
`docs/plan-2026-09-02-workflow-business-request-proveedores-comisiones.md`.

## W2/W10 — BusinessRequestPanel: botón siempre a la izquierda

El botón de "Send request" (colapsado) ya no se movía "al centro" —
técnicamente estaba bien alineado con `justify-start` cuando entraba en
una línea propia, pero solo entraba en línea propia si no había espacio
al lado del texto de stats, así que su posición dependía del ancho de
viewport y de cuánto texto tuvieran los stats — leía como que "se movía
solo". Fix real: un spacer invisible `basis-full` justo antes del botón
fuerza el salto de línea SIEMPRE, sin importar el ancho — el botón queda
en su propia línea, alineado a la izquierda, en todos los casos. También:
fondo oscuro (`#241C16`, mismo tono que `FiltersCard`), "Route" ahora
muestra los países (con banderas) en vez de las monedas, "Currency" es un
stat nuevo separado que muestra las monedas.

## W3 — Auto-scroll del wizard Mangomundi AI

Bug real, no solo percepción: `chatBottomRef.current?.scrollIntoView()`
se llamaba sin `block`, que por defecto es `"start"` — para un marcador
vacío justo después del último mensaje, eso alinea su posición (vacía)
contra el TOP del panel, empujando la respuesta recién llegada fuera de
vista. `block: "end"` es el patrón real de "stick to bottom" de cualquier
chat. Además, el auto-scroll ahora se salta si el usuario había
scrolleado hacia arriba para releer historial (threshold 64px, trackeado
en el `onScroll` del panel). Verificado con Playwright simulando varios
mensajes vía las quick actions locales (sin necesitar red).

## W4 — Widget: sacar el símbolo de moneda

Revertido el `leading: currencySymbol(c.code)` que se había agregado en
la ronda 12 — Alejandro pidió sacarlo un día después de pedirlo. Los 2
call sites del widget embebido pasaron de `triggerIconOnly` a
`compactLabel` (código de letras, sin símbolo). `currencySymbol()` se
borró de `currencies.ts` (código muerto).

## W5 — Widget: varios ejemplos de moneda

`WidgetExample` (singular, un solo corridor) pasó a `WidgetExamples`
(plural, hasta 5 corridors reales de `getExclusiveCorridors`, mismos
datos que usa `TodaysRoutesSection`) como filas compactas clickeables en
una lista, no una card grande — usa el espacio libre del frame fijo
360×540 sin agregar scroll.

## W6 — Home: Trustpilot vs botón About us

`AboutManifestoSection` envolvía el `TrustBox` en un `h-11` (44px) fijo
para igualar la altura del botón — pero el widget real declara
`data-style-height="52px"`, así que el wrapper capaba el widget a menos
de lo que necesita, el mismo anti-patrón que `TrustpilotCard` (rail) ya
había revertido por la misma razón. Se sacó el `h-11` fijo; ahora el
`items-center` de la fila centra contra la altura real del widget.
**No se pudo re-verificar contra el widget real** — sin red hacia
`trustpilot.com` y `/` sigue devolviendo 500 en este sandbox (ver nota
más abajo) — si sigue mal en producción, la próxima señal útil es un
screenshot real.

## W7 — Widget: igualar selectores en la 2da línea

El selector de país destino (2da línea) usaba `flex-1` sin un input de
monto al lado que absorbiera ese espacio, quedando ~112px de ancho
(mayormente vacío) contra los 59px del selector de origen — medido con
`getBoundingClientRect`, no a ojo. Ahora ambos usan `w-auto shrink-0`
igual; el espacio liberado agranda el botón de swap (32→38px) y Compare
(74px fijo → `flex-1`).

## W8 — About us: espaciado real entre párrafos

Bug de CSS real: el contenedor usaba `space-y-9` para separar los tres
párrafos (misión/visión/problema), pero ReactMarkdown renderiza cada uno
como un `<p>` suelto sin wrapper, y ese mismo `<p>` ya tenía `[&_p]:m-0`
— el reset de margen anulaba el `margin-top` del que depende `space-y-9`,
dejando 0px de gap real (confirmado midiendo, no a ojo). `gap-9` en un
flex column no usa margin, así que no choca con el reset — ahora hay 36px
reales entre cada idea.

## W9 — Comparador "se mueve raro"

Auditado con Playwright interacción por interacción (elegir país, elegir
moneda, abrir dropdown, filtrar) — nada de eso mueve el layout. Lo que sí
lo mueve, reproducido y medido: elegir el MISMO país en origen y destino
inserta el aviso "Same-country route..." y la card salta ~42px al
instante, empujando todo lo de abajo de golpe. Con la técnica de
`grid-template-rows` (0fr↔1fr) el aviso queda siempre montado y la altura
interpola suavemente en 200ms en vez de saltar.

## W11 — Datos faltantes de business, marcados como estimados

8 proveedores de business (`CAB Payments`, `CurrencyFair`, `Revolut`,
`Wise`, `XE`, `Instarem`, `Moneycorp`, `Payoneer`) tenían
`min_amount`/`settlement_terms`/`contract_type` en `null`. Un subagente
investigó cada campo con WebSearch (WebFetch estaba bloqueado en su
sandbox para todos los dominios probados, así que son snippets
sintetizados por WebSearch, no páginas reabiertas y releídas — vale un
spot-check humano antes de tratarlos como 100% verificados, especialmente
CurrencyFair/Moneycorp/Payoneer). Con eso se completaron los campos con
fuente real donde existía (fuentes citadas en la migración
`20260902120500_load_business_terms_and_estimates.sql`). Donde no había
fuente pública confiable (CAB Payments completo, `min_amount` de Revolut
e Instarem, `contract_type` de Instarem, `min_amount` de Convera), se
completó con una **estimación lógica**: mediana de `min_amount` entre
proveedores del mismo `provider_type` (app vs. broker) que sí tienen dato
real, y `contract_type` estimado como "Spot" (el mínimo común que ofrece
cualquier proveedor de FX) en vez de inventar Forward/Options sin
confirmar.

Nuevas columnas `providers.min_amount_estimated` /
`settlement_terms_estimated` / `contract_type_estimated` (migración
`20260902120000_add_business_terms_estimated_flags.sql`) distinguen dato
real de estimado. `ComparisonRow` expone las 3 flags; `BusinessRowExtra`
muestra un badge "Est." (con tooltip) solo en los campos estimados — el
dato real nunca se etiqueta como estimado. **Esto reemplaza la nota de la
ronda 12/13 de "CAB Payments queda en null, no es un pendiente"** — ya
no es así, ahora tiene una estimación etiquetada.

## W12 — Business: botón "Add to request" no mueve el texto

Ya resuelto (ver commit `b1cb95c`): ancho fijo `w-[118px]` en el botón
para que "Add to request" (14 caracteres) vs. "Added" (5 caracteres) no
cambie el ancho del cluster y arrastre el texto vecino.

## W13 — Auditoría de mobile

Más exhaustiva que la de la ronda 12 (que solo cubrió antes/después de
buscar). Escaneo automatizado (Playwright, `document.documentElement.
scrollWidth` vs. `window.innerWidth`) en las 3 páginas testeables en este
sandbox (`/widget`, `/about`, `/business` — `/` y `/blog` siguen en 500,
ver nota de abajo) a 320px/360px/375px/390px/428px. Encontrado y
arreglado un overflow horizontal real en `/widget` (385px vs 375px de
viewport): el bloque de código del script de instalación (`<pre
overflow-x-auto>`) tiene contenido más ancho que el viewport, y el div
que lo envuelve (columna izquierda del grid de dos columnas) tenía
`min-width: auto` por defecto como todo grid item — eso fuerza la columna
a crecer para acomodar el contenido en vez de dejar que
`overflow-x-auto` lo contenga. `min-w-0` en ese wrapper lo resuelve.
También verificado sin overflow ni bugs visuales: menú de nav mobile
abierto, panel del wizard AI abierto, grid de métricas de business con
los nuevos badges "Est." en 2 columnas.

## Nota permanente sobre el sandbox (sigue igual)

`*.supabase.co`, `trustpilot.com` y dominios arbitrarios de terceros
siguen bloqueados por la política de red de salida — no es un problema de
credenciales. `/` y `/blog` siguen devolviendo 500 (loader depende de
Supabase). `/widget`, `/about`, `/business` sirven en vivo. Un estado con
`result` real solo se puede verificar simulando el dato
(`window.__FAKE_RESULT_FOR_SCREENSHOT__` inyectado con Playwright,
siempre revertido antes de commitear) contra esas 3 rutas. El widget real
de Trustpilot (con el script de `trustpilot.com` cargado) sigue sin
poder verse en este sandbox bajo ninguna técnica.
