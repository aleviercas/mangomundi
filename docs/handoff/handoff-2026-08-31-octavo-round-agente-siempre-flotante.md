# mangomundi — Handoff 31-ago-2026: octavo round (agente siempre flotante, widget sin scroll, fixes puntuales)

> Continúa `docs/handoff/handoff-2026-08-31-septimo-round-ajustes-nav-footer-agente.md`.
> Esta ronda corrige varias cosas que el round anterior había hecho mal o
> incompleto, sobre 16 pedidos puntuales nuevos de Alejandro.

**Repo:** `aleviercas/mangomundi`. **Estado:** `tsc`, `eslint` (limpio en
archivos tocados), `i18n:check` y `vitest run` en verde.

---

## 0. Corrección importante sobre el round anterior (agente IA)

El round anterior (séptimo) interpretó mal un pedido: había metido el
agente conversacional (`FloatingAgent`) en modo "docked" claro dentro del
rail de resultados, reemplazando el panel oscuro. Alejandro aclaró que
eso estaba mal en dos sentidos:

1. **El agente conversacional (mangomundi AI) tiene que ser SIEMPRE la
   pestaña fija a la derecha, oscura, en todo el sitio, y solo se
   minimiza cuando el usuario lo minimiza manualmente** — nunca
   desaparece ni se docker automáticamente al haber un resultado.
2. **Lo que va en el rail vertical (individual y business) es un "smart
   filter" al estilo kayak.com — un filtro, no el chat.** Ya existía:
   es `FiltersCard` (rank by, exclusive offers, payout method, contract
   type/frequency en business). Se le cambió la paleta a oscura
   (`#241C16` + acentos mango) para que lea como parte del mismo sistema
   visual del agente, sin ser el agente.

Se sacó por completo el mecanismo `docked` de `FloatingAgent` y
`AiCopilot` (ya no existen esos props — dead code eliminado, no dejado a
medias). `showDockedAgent`/`useIsDesktopRail` también se eliminaron
(quedaron sin uso).

## 1. Qué se hizo (los 16 puntos)

1. **Scroll del logo restaurado.** Sacar el `window.scrollTo` del logo
   (round anterior) fue un error — Alejandro confirmó que ir a home +
   scroll a top al clickear el logo es práctica estándar. Se restauró en
   `Header.tsx`/`Footer.tsx`. Lo que sí había que sacar (y se sacó en el
   round anterior, correcto) era el scroll disparado por `.focus()` en el
   comparador/agente — eso queda como estaba.
2. **Tagline del footer en 2 líneas.** Ojo con esto: `footer.tagline`
   existe DOS veces en `i18n.tsx` — una en `DICTS.en` y otra, más abajo,
   en el bloque `UI_KEYS` que se mergea *encima* y gana (ya había un
   comentario de una sesión anterior avisando esto). El primer intento
   editó solo la copia shadowed y no se vio ningún cambio — la que hay
   que tocar es la de `UI_KEYS` (línea ~2035). Ahora dice
   `"Neutral decision engine\nfor international transfers."` con
   `whitespace-pre-line` en `Footer.tsx`. Si algo similar no parece
   reflejarse en pantalla, buscar duplicados de la key antes de asumir
   que el bug está en el componente.
3. **TrustBox de About sin recuadro** — se sacó el wrapper
   `bg-white rounded-xl` que el round anterior le había puesto; ahora es
   el widget de Trustpilot tal cual, sin caja propia.
4. **Stats del subtítulo del home ("150+ Countries...") — recomendación:
   dejarlos.** Es un patrón deliberado y ya documentado en el propio
   código (`HeroSection.tsx`, comentario "Skyscanner/Kayak-style search
   page shows a credibility signal right next to the search box, not
   several scrolls away") — no es un descuido, es la misma técnica que
   usan Kayak/Skyscanner/Booking: mostrar la señal de confianza junto al
   buscador para el visitante que recién llega, aparte de la que ya
   existe en la sección About para quien sigue leyendo. No se tocó.
5. **Símbolo de moneda duplicado — bug real, encontrado y arreglado.**
   `CurrencyCombobox.tsx` armaba `label: "USD — US Dollar"` y
   `secondary: "USD"` — la lista abierta del dropdown mostraba el código
   dos veces en la misma fila ("USD — US Dollar ... USD"). Ahora
   `label: c.name` (sin el código adelante), `secondary` se queda con el
   código — la fila lee "US Dollar ... USD", una sola vez. El trigger
   compacto (que solo muestra `secondary`) no cambió.
6. **Banderas del dropdown de país — delay real, causa distinta a la
   bandera individual.** El fix del round anterior (`<img>` en vez de
   CSS background) solo ayuda a las banderas YA visibles en pantalla —
   las de la LISTA del dropdown ni existen en el DOM hasta que se abre
   por primera vez (Radix Popover no monta el contenido antes), así que
   nada las pedía de antemano. Se agregó `prefetchAllFlags()`
   (`FlagIcon.tsx`) llamado una vez desde `__root.tsx` en
   `requestIdleCallback` — calienta la cache HTTP del browser para las
   ~195 banderas bastante antes de que alguien abra el dropdown.
7. **RateAlertCard sacado del rail en business** — ya queda
   `BusinessContactCard` ("email our business desk") cubriendo eso. En
   individual sigue igual.
8. **TrustpilotCard del rail — centrado.** Se le agregó `flex
   items-center justify-center`, y `TrustBox` pasó `data-style-width` de
   `"100%"` a `"auto"` (Trustpilot estira el iframe a la card completa
   pero el contenido real es más angosto y quedaba pegado a la
   izquierda). **Sin verificar en vivo** — Trustpilot no carga en este
   sandbox (red bloqueada hacia trustpilot.com también), avisar si en el
   preview real sigue viéndose descentrado.
9. **Agente siempre flotante, oscuro, minimiza solo manual** — ver
   sección 0.
10. **Rail = FiltersCard oscuro ("smart filter")** — ver sección 0.
    Misma lógica/filtros de siempre (rank by, exclusive, payout method,
    contract type/frequency), paleta cambiada a `#241C16` + mango.
11. **BusinessRequestPanel + BusinessContactCard movidos** del rail
    vertical a la columna de resultados, debajo de `ResultsBlock`
    (debajo de "Your results", los 3 tabs grandes y la lista) — ya no
    depende de `showDockedAgent`/ancho de pantalla, es contenido normal
    de esa columna en cualquier ancho.
12. **Frase de neutralidad (⚖︎ Affiliate links...) movida** de arriba de
    la lista de resultados a junto con "Values fetched directly..." al
    final, mismo cuadro de letra chica (`ResultsBlock`).
13. **Subtítulo de Today's routes en un renglón** — `max-w-2xl` se quedó
    corto ahora que la cabecera ya no comparte espacio con el trigger del
    agente (removido en el round anterior); pasado a `max-w-3xl` +
    `lg:whitespace-nowrap`.
14. **Ícono del blog — ya estaba corregido** (round anterior, verificado
    de nuevo por código): está en la misma fila que el `<h1>` "Blog", a
    la derecha. Si en el preview real seguía viéndose mal, probablemente
    era una versión vieja del deploy — confirmar contra este commit.
15. **Widget — scroll interno eliminado.** `EmbedComparator.tsx` tenía un
    `overflow-y-auto` + flecha de "hay más abajo" (mecanismo agregado en
    algún momento porque el contenido no siempre entraba en 540px) — se
    sacó del todo, junto con el `MutationObserver`/estado que lo
    manejaba. El mockup original (`design/Mangomundi 4 - Final.dc.html`
    línea 728) etiqueta esta pantalla literalmente "Widget · sin scroll",
    y `CompactResultsList` (ganador + 2 filas + bloque de invitación) ya
    estaba bastante ajustado por una sesión anterior con comentarios
    explícitos sobre por qué el tope es 2 filas, no 3. **No se pudo
    probar con datos reales** (ver sección 2) si el conjunto realmente
    entra sin cortar nada — si en el preview real algo se corta, avisar
    qué parte exacta (buscador, fila ganadora, filas secundarias, o el
    bloque de invitación) para ajustar tamaños ahí puntualmente en vez de
    adivinar a ciegas.
16. **Set alert → mail automático:** ya se había agregado en el round
    anterior (`sendLeadNotificationEmail` dentro de `captureEnterpriseLead`,
    `agent.functions.ts`) — mismo mecanismo que usa `captureBusinessLead`
    para "Talk to us"/business desk. Sigue pendiente la decisión de
    producto de si se construye el monitoreo automático de tasas en sí
    (cron + comparación + mail al usuario final) — no es parte de este
    fix, es infraestructura nueva.

## 2. Sobre la verificación con datos reales

Alejandro agregó `SUPABASE_SERVICE_ROLE_KEY` a mitad de esta sesión. **No
alcanza por sí sola**: el sandbox de esta sesión tiene una política de red
de salida que bloquea el host `ttqalbexpquzobrdyvgx.supabase.co`
directamente (`Host not in allowlist`, ver `/root/.ccr/README.md` — 403
del proxy de egress, no un error de código ni de credenciales). Mismo
problema con `widget.trustpilot.com`. Osea: con la clave puesta, `/` y
`/blog` dejan de tirar el error de "Missing Supabase environment
variable(s)" pero el compare en sí sigue fallando ("An unexpected error
occurred") porque la llamada de red nunca sale del sandbox.

Esto significa que **nunca se pudo ver en este sandbox** ningún estado
con `result` real: la tabla de resultados, el rail con
`FiltersCard`/`RateAlertCard`/`TrustpilotCard` en su disposición final, el
panel de business (`BusinessRequestPanel`), ni el widget con un ganador +
filas reales. Todo lo de esta ronda que depende de esos estados
(puntos 7, 8, 9 parcialmente, 10, 11, 12, 15) se hizo por lectura de
código + revisión cuidadosa, no por verificación visual directa. Se
recomienda que la próxima sesión (o Alejandro contra el preview real de
Vercel) confirme específicamente esos puntos.

Lo que sí se pudo verificar en Chromium real en este sandbox: nav,
footer (2 líneas del tagline confirmado), la sección About (eyebrow
"Neutral by design", TrustBox sin caja), la pestaña flotante del agente
(colapsada y abierta, sigue oscura), `/business` y `/widget` en su
estado sin resultado.
