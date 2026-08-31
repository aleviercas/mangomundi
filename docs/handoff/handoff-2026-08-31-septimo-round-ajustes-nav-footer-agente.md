# mangomundi — Handoff 31-ago-2026: séptimo round (nav/footer, banderas, agente rediseñado)

> Continúa el trabajo consolidado en `claude/coordinar-trabajo-simultaneo-y85idz`
> (ver `docs/handoff/handoff-2026-08-31-sexto-round-ajustes-buscador-agente.md`
> para el round anterior). Sesión de Alejandro con 16 pedidos puntuales sobre
> el mismo rediseño; 15 implementados, 1 (#16) queda pendiente a propósito.

**Repo:** `aleviercas/mangomundi`. **Estado:** implementado, `tsc`,
`eslint`, `bun run scripts/i18n-validate.ts` (`I18N_STRICT=1`) y `vitest run`
en verde. No commiteado todavía a este momento del handoff — ver el commit
real para el hash.

---

## 1. Qué se hizo

1. **Sin bandera en el selector de moneda** (`CurrencyCombobox.tsx`) — solo
   el selector de país (`CountryCombobox`) conserva bandera.
2. **Banderas: causa real del "tardan en cargar" y fix.** Antes eran
   `<span class="fi fi-xx">` con `background-image` vía CSS (`flag-icons`
   package) — las imágenes de fondo no las descubre el preload scanner del
   browser, se piden recién cuando el layout ya se calculó, de ahí el
   "pop-in" tarde. `FlagIcon.tsx` ahora renderiza un `<img>` real (con
   `import.meta.glob("...flag-icons/flags/4x3/*.svg", {query:"?url"})`),
   descubierto por el browser apenas parsea el HTML. `vite.config.ts`
   mantiene la misma exclusión de `assetsInlineLimit` para este paquete
   (si no, Vite intenta inlinear ~250 SVGs como base64 en el JS bundle).
3. **"Send"/"Receive"** sin "You"/"They" (`comparator.field.amount`,
   `comparator.field.youReceive` en `i18n.tsx` — mismas keys, solo cambió
   el texto EN).
4. **Trustpilot movido** de la cabecera de "Today's routes" al lado del
   botón "About us" en `AboutManifestoSection.tsx` (envuelto en una píldora
   blanca sólida — el widget de Trustpilot es blanco-sobre-transparente,
   no lee bien directo sobre el fondo oscuro de esa banda).
5. **Eyebrow de About** — de "About" a **"Neutral by design"**, el texto
   original del mockup (`design/Mangomundi 4 - Final.dc.html` línea 174 /
   `design/AJUSTES-4.md` §2). Ojo: es el eyebrow (kicker chico), no el h2
   grande ("Financial intelligence..."), que Alejandro no pidió tocar.
6. **Nav superior** → Individual · Business · Widget · Blog · About us +
   selector de idioma. "Individual"/"Business" reusan literalmente las keys
   del toggle que ya existe dentro del comparador
   (`comparator.segment.retail`/`business`) en vez de copy nueva — mismo
   concepto, misma palabra. Sacado "How it works" del nav (era un anchor a
   la home). Ver `config/nav.ts`.
7. **Footer reestructurado**: Product (Individual, Business, Widget) ·
   Company (About us, Contact, Blog) · Legal (sin cambios: Terms/Privacy/
   Risk). Se sacó el párrafo chico "mangomundi is independent..."
   (`footer.legalNote`, ahora sin uso en ningún componente — la key queda
   viva en los diccionarios pero huérfana). El "© 2026 Mangomundi" se movió
   debajo de los íconos de redes sociales (antes al final de la columna
   Legal).
8. **Movimientos automáticos eliminados:**
   - `Header`/`Footer`: el logo ya no fuerza `window.scrollTo(top, smooth)`
     al clickearlo (navegar con `<Link to="/">` ya alcanza).
   - Composer del agente (`ComparatorSection.tsx`) y buscador del
     `LangSwitcher`: `.focus()` ahora usa `{ preventScroll: true }` — el
     foco seguía siendo útil, pero por sí solo bastaba para que el browser
     hiciera scroll automático hacia el input.
9. **"Set alert" — qué pasa realmente:** `captureEnterpriseLead`
   (`agent.functions.ts`) solo insertaba en `enterprise_leads` con
   `status: "beta_pending"` — nada más. El copy actual
   (`comparator.rateAlert.success`: *"we'll email you when this rate
   improves"*) promete algo que **no existe**: no hay ningún cron/job en
   el repo que chequee tasas y mande ese mail. Se agregó una notificación
   interna por mail (mismo mecanismo que `captureBusinessLead` ya usaba,
   `sendLeadNotificationEmail`) para que al menos un humano se entere y
   pueda hacer seguimiento manual. **Decisión pendiente de Alejandro:**
   ¿construir el chequeo automático real (cron + comparación de tasa +
   mail al usuario, es infraestructura recurrente) o dejar esto como
   waitlist manual y suavizar el copy para que no prometa algo que no
   pasa? No se tocó el copy — es una decisión de producto, no de código.
10. **Trustpilot sin logo real — causa encontrada:** el script bootstrap de
    Trustpilot escanea el DOM una sola vez, al terminar de cargar. En una
    SPA el widget casi nunca existe en el DOM en ese momento exacto (depende
    de en qué página aterrizás, o si está detrás de un `useQuery` async como
    en Today's routes) — una vez pasado ese escaneo, el widget se queda
    para siempre como el link de fallback en texto plano. Fix: `TrustBox.tsx`
    llama `window.Trustpilot.loadFromElement(el, true)` en un `useEffect`,
    con reintento acotado (cada 250ms, hasta 20 intentos) por si el script
    bootstrap todavía no terminó de cargar.
11. **Frase "Affiliate links are labelled. Ranking never depends on them."**
    — **recomendación: dejarla.** Es distinta del párrafo de `footer.legalNote`
    que se sacó en el punto 7 (ese era un disclaimer legal genérico,
    redundante con `/legal`). Esta es una promesa de neutralidad puntual,
    justo donde aparece el link de afiliado — el punto exacto donde a
    alguien le puede surgir la duda "¿esto está armado para que ganen
    comisión?". Encaja con el propio posicionamiento del producto ("neutral
    decision engine"). No se tocó.
12. **Ícono de mangomundi en /blog** — movido de la esquina izquierda
    (apilado arriba del eyebrow) a la derecha, a la misma altura del
    `<h1>` "Blog" (ahora eyebrow y título+ícono en dos filas, el ícono
    alineado con el título, no con el eyebrow).
13. **Blog en filas horizontales** — la grilla de 2 columnas
    (`grid sm:grid-cols-2`) pasó a una lista de filas completas apiladas
    (imagen a la izquierda de tamaño fijo, contenido a la derecha,
    `divide-y` entre filas).
14. **Botón "Go to compare" del post** — ahora lleva el ícono de la "m"
    (`BrandMark tone="light"`) y el destino depende de `post.audience`:
    `"business"` → `/business`, cualquier otro valor (`"retail"`/`"both"`)
    → `/` (individual).
15. **Agente IA — rediseño grande:**
    - Se sacó por completo el mecanismo de portal que metía el trigger
      colapsado dentro de la cabecera de "Today's routes"
      (`agentPortalTarget`/`agentSlotRef`/`showPreSearchInlineTrigger`/
      `CompactAgentTrigger`, en `ComparatorSection.tsx`,
      `TodaysRoutesSection.tsx` y `HomePageBody.tsx`). El agente ahora es
      **siempre** la pestaña fija al borde derecho, en todo el sitio,
      sin excepciones por página o por estado.
    - El modo **docked** (rail de resultados en desktop, `showDockedAgent`)
      dejó el panel oscuro fijo de 480px con scroll interno por un **tema
      claro** que combina con sus vecinos de rail (`FiltersCard`/
      `TrustpilotCard` — blanco, borde, texto ink) y **sin altura fija ni
      scroll propio** — fluye con el largo real de su contenido, como un
      "smart filter" de Kayak. El panel flotante (tab a la derecha) sigue
      exactamente igual que antes (oscuro, fijo, con su propio scroll).
      Toda la lógica es la misma — un solo objeto `theme` en
      `FloatingAgent` centraliza los ~12 colores que cambian entre los dos
      modos, para no duplicar el JSX. `AiCopilot.tsx` (la grilla de
      preguntas rápidas) recibió el mismo tratamiento vía su nuevo prop
      `docked`.
    - Scrollbar del agente: nueva utility `thin-scrollbar` en `styles.css`
      (`scrollbar-width: thin` + `::-webkit-scrollbar` de 4px, color
      `currentColor` al 30% — se adapta solo al tema claro/oscuro).
      Aplicada al área de mensajes del panel flotante y al textarea del
      composer en los dos modos.
    - Composer: pasó de un `<input>` de una sola línea (42px) a un
      `<textarea rows={2}>` (min-height 52px) — Enter sigue enviando,
      Shift+Enter hace salto de línea.
    - **Sin verificar visualmente el modo docked**: `showDockedAgent`
      solo se activa cuando existe un `result` real, y este sandbox no
      tiene `SUPABASE_SERVICE_ROLE_KEY` (no se pudo levantar sin pedirle
      esa clave a Alejandro, y no correspondía pedirla acá). El modo
      flotante sí se verificó en browser real (Playwright/Chromium) y
      quedó como se esperaba. **Prioridad para la próxima sesión con
      Supabase real: mirar el modo docked en `/send/:corridor` con un
      resultado cargado.**
16. **Pendiente, a propósito, sin tocar esta ronda:** rediseño de
    About us, Widget y Business (antes/después de comparar).

## 2. Cómo se validó

`tsc --noEmit`, `eslint .` (limpio en todos los archivos tocados — el resto
del repo tiene ~400 errores de `prettier/prettier` preexistentes que no son
de esta sesión, ver nota abajo), `I18N_STRICT=1 bun run scripts/i18n-validate.ts`
(0 incompleto en 19 idiomas — todos los cambios de copy reusaron keys
existentes, no hizo falta tocar `scripts/translations/*.json` ni
`.pending.json`), `vitest run` (34/34). Se levantó el dev server real con
las credenciales públicas de Supabase (anon key, vía `mcp__Supabase__get_publishable_keys`)
y se verificó en Chromium (Playwright) home, `/send/AR-US`, nav, footer,
sección About y el panel flotante del agente (colapsado y abierto).

**Nota sobre el entorno de este sandbox (no es del código):** `bun.lock`
pineaba versiones resueltas contra un registro privado de Lovable
(`*-npm.pkg.dev/lovable-core-prod/...`) inalcanzable desde acá. Se
reinstaló temporalmente contra el registro público de npm solo para poder
levantar el dev server y verificar visualmente — **`bun.lock` se restauró
al original antes de este commit** (`git checkout -- bun.lock`), no viaja
ningún cambio de dependencias. Los ~400 errores de lint en archivos no
tocados por esta sesión vienen de esa reinstalación temporal resolviendo
`prettier@3.9.6` en vez del `3.8.3` pineado — no son una regresión real,
no deberían aparecer corriendo `bun run lint` con el lockfile real en
Vercel/CI.

## 3. Decisiones que quedan abiertas para Alejandro

- **Punto 9 (Set alert):** ¿construir el monitoreo real de tasas (cron +
  comparación + mail al usuario) o dejarlo como waitlist manual con el
  copy ajustado para no prometer algo que no pasa?
- **Punto 11:** se recomendó dejar la frase de affiliate links tal cual —
  avisar si Alejandro prefiere sacarla igual.
