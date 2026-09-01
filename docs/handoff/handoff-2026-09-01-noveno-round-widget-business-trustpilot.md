# Handoff — noveno round de ajustes (1-sep-2026)

Continúa `docs/handoff/handoff-2026-08-31-octavo-round-agente-siempre-flotante.md`.
Alejandro pasó una lista de 13 puntos sobre lo entregado en el octavo round;
este documento cubre lo resuelto en esta sesión. Rama sin cambios:
`claude/coordinar-trabajo-simultaneo-y85idz`.

## Resueltos en esta sesión

1. **Acceso a Supabase/Trustpilot** — no es un problema de credenciales.
   Este sandbox bloquea el egreso de red a `*.supabase.co` y
   `trustpilot.com` por política de organización (403 del proxy,
   `/root/.ccr/README.md`). El `SUPABASE_SERVICE_ROLE_KEY` que Alejandro
   cargó en el environment de Claude Code está bien puesto — no cambia esto,
   porque el bloqueo es de red, no de autenticación. Esto se resuelve desde
   la configuración del entorno/organización de Claude Code (fuera del
   alcance de lo que una sesión puede tocar), no reintentando con otra
   clave. Mientras tanto, todo lo que depende de un `result` real
   (comparador, rail, widget con datos) se verifica por lectura de código +
   pruebas visuales con datos simulados localmente, nunca contra el dato
   real — confirmar siempre contra el preview de Vercel.
2. **Rate alert** — confirmado sin tocar: `sendLeadNotificationEmail` sigue
   llamándose en `captureEnterpriseLead` y `captureBusinessLead`
   (`src/lib/agent.functions.ts`). No había regresión.
3. **"150+ Countries · 100+ Currencies · 50+ Providers" del home** —
   eliminado de `HeroSection.tsx` (había quedado de una recomendación
   anterior; pedido explícito esta vez de sacarlo del todo).
4. **Espaciado general vs. el mockup** — auditado contra
   `design/Mangomundi 4 - Final.dc.html` (los `padding:38-46px 30px` de sus
   bandas) y comprimido en las secciones vivas que estaban notablemente más
   sueltas: `HowItWorksSection`, `AboutManifestoSection`,
   `BusinessWidgetRow`, `ContactSection` — de `py-14 sm:py-20` (56–80px) a
   `py-9/10 sm:py-12/14` (36–56px). `CTASection`/`DualAudienceSection`/
   `FeaturesSection`/`TestimonialsSection` son componentes huérfanos (no
   importados en ninguna ruta) — no se tocaron.
5. **Trustpilot vs. "About us" desalineado** — ya estaba resuelto desde el
   octavo round (verificado con `boundingBox()` real, botón y TrustBox al
   mismo centro Y). Sin cambios nuevos.
6. **Ícono del blog** — también ya resuelto desde el round anterior (el
   ícono estaba anclado al `<h1>` en vez de al `<p>` eyebrow "Blog").
7. **Footer — salto de línea después de "for"** — corregido en las dos
   ocurrencias de `footer.tagline` en `i18n.tsx` (`DICTS.en` y el bloque
   `UI_KEYS` que la sombrea — ver su propio comentario sobre este gotcha):
   `"Neutral decision engine for\ninternational transfers."`
8. **Banderas lentas en target country** — ya resuelto desde el round
   anterior: `<link rel="prefetch">` real por bandera en `__root.tsx`
   (descubierto por el preload scanner del browser durante el parseo del
   HTML, antes que cualquier JS). Sin cambios nuevos esta vez.
9. **Rediseño de `/business` (espacios en blanco + paleta)** — el problema
   real no era el padding de `BusinessExtrasSection` (ya comprimido en la
   sesión anterior), sino un vacío enorme (~500px) entre esa sección y el
   footer: el layout raíz (`__root.tsx`) usa el patrón sticky-footer
   (`flex min-h-screen flex-col`), así que en una página corta el `<main>`
   se estira para empujar el footer al fondo del viewport. La solución no
   fue pelear contra ese patrón (rompería el footer en cualquier página
   corta) sino agregar contenido real: `AboutManifestoSection` ("Neutral by
   design" + stats reales) ahora también se renderiza en `/business` antes
   de un resultado — su copy nunca fue retail-específico, aplica igual de
   bien a una audiencia corporativa evaluando un comparador neutral. Botón
   de email ya estaba en paleta (`btn-cta`) desde la sesión anterior.
10. **Business — panel de request arriba de resultados, ancho completo,
    explica el request personalizado** — ya resuelto en la sesión anterior
    (`BusinessRequestPanel` movido arriba de `ResultsBlock`, grid de 4
    columnas, nueva key `comparator.business.request.explainer`).
11. **"Rather talk to someone" en el rail, debajo de filtros** — ya resuelto
    en la sesión anterior (`BusinessContactCard` en el `<aside>`, debajo de
    `FiltersCard`, mutuamente excluyente con `RateAlertCard` según
    `segment`).
12. **Trustpilot del rail desalineado** — el wrapper ya usaba
    `flex items-center justify-center`, igual que el de "About us", pero es
    un ítem de rail de ancho fijo (268px) en vez de compartir fila con un
    botón angosto — si el script de Trustpilot le pone su propio
    ancho/display inline al montar `.trustpilot-widget`, el
    `justify-center` del padre no necesariamente lo re-centra. Se agregó
    `[&_.trustpilot-widget]:mx-auto` apuntando directo a ese div — centra
    por sus propios márgenes sin depender del contexto flex del padre, así
    que no importa qué ancho/display le imponga el script. **Sigue sin
    poder verse con el script real** (mismo bloqueo de red que el punto 1)
    — si en producción se sigue viendo mal, hace falta un screenshot real
    para poder seguir iterando; no hay más que razonar en blanco.
13. **Rediseño en profundidad del widget** — el widget compacto anterior
    (literal al mockup, línea 726-786) en realidad NO tenía selector de
    país: los dos "pills" de moneda eran `CountryCombobox` con
    `compactLabel` (que oculta el nombre y solo muestra bandera+moneda),
    sin selector de moneda independiente. Pedido explícito esta vez: país
    de origen y destino Y moneda de cada lado, igual que el comparador
    completo, y monto — todo sin scroll en el frame fijo de 360×540.
    Rediseñado como 5 controles apilados (no en fila, no entran 6 columnas
    en 360px): monto+moneda origen (40px) → país origen (34px) → swap
    (24px) → país destino + moneda destino en grid de 2 (34px) → botón
    Compare (38px). Total ~200px de controles, deja margen de sobra en los
    540px totales. Tablist de segmento (Individual/Business) ocultado por
    completo en `embedded` — el widget es solo retail
    (`EmbedComparator.tsx` ya fuerza `segment: "retail"`), mostrar un
    tablist sin nada que cambiar no tenía sentido y ocupaba ~34px.
    **Verificado de verdad** (no solo por lectura de código): `/embed` real
    a 360×540 en Playwright da `scrollHeight === clientHeight === 540`
    exacto — cero scroll confirmado, no supuesto.

## Verificación realizada esta sesión

A diferencia de rondas anteriores, esta vez se pudo verificar visualmente
bastante más que "solo lectura de código", con dos técnicas:

- **Estados que no dependen de un `result`** (widget antes de comparar,
  `/business` sin búsqueda): screenshot Playwright directo contra el dev
  server local — sin problema, no llaman a Supabase hasta que se aprieta
  "Compare".
- **El rail con resultado** (para revisar `TrustpilotCard`/`FiltersCard`/
  `BusinessContactCard` juntos): como `/` y las secciones con datos reales
  (Today's routes, Blog) rompen la SSR completa sin Supabase, se probó
  contra `/business` (que no las renderiza) inyectando un `result`
  simulado vía `window.__FAKE_RESULT_FOR_SCREENSHOT__` seteado con
  `page.addInitScript` **solo durante la sesión de testing** — el hack se
  revirtió del código antes de cualquier commit, no quedó rastro. Sirvió
  para confirmar el layout/alineación estructural del rail, pero **no**
  reemplaza ver el widget real de Trustpilot (ese sigue bloqueado por red,
  ver punto 12).

## Qué falta / no se tocó

- El vacío tipo sticky-footer del punto 9 también existe en `/about` (y
  probablemente en `/legal` u otras páginas cortas) — no fue parte de los
  13 puntos de esta ronda, no se tocó. Si Alejandro lo nota ahí también,
  el mismo patrón (agregar contenido real en vez de forzar el layout)
  aplica.
- Punto 12 (Trustpilot del rail) queda con la mejor corrección razonable
  dado el bloqueo de red — necesita confirmación con screenshot real o
  acceso de red antes de poder decir que está "resuelto de verdad" en vez
  de "razonado a ciegas".
- Validación completa corrida esta sesión: `bun run typecheck` (limpio),
  `bun run lint` sobre los archivos tocados (limpio — el resto de errores
  de lint en el repo son pre-existentes, no de esta sesión), `bun run
  i18n:check` (0 rotos / 0 incompletos de 19), `bun run test` (34/34).
  `bun.lock` sin tocar (verificado antes de commitear).
