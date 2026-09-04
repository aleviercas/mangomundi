# Handoff — 1-sep-2026, ronda 11 (fondo/swap/sort/widget/business/datos de proveedores)

Continúa `docs/handoff/handoff-2026-09-01-decimo-round-agrupar-pildoras-colores-mockup.md`.
Rama: `claude/coordinar-trabajo-simultaneo-y85idz`. PR abierto: #10.

## Contexto: por qué esta ronda arrancó con Vercel, no con feedback de UI

Alejandro reportó que el último push de la ronda anterior no aparecía en
Vercel. Diagnóstico vía API de GitHub + Vercel: el push llegó bien a GitHub,
pero Vercel **nunca generó un deployment** para ese commit — no había ni
siquiera un build en cola ~9 minutos después del push. No es un conflicto de
ramas ni un problema de código: fue un webhook GitHub→Vercel que se perdió.
Alejandro pidió explícitamente que lo resolviera yo mismo con el acceso que
tengo, sin generar conflictos con las ramas del repo. Solución: abrir el PR
#10 — esto dispara un evento `pull_request` separado que la integración de
Vercel también escucha, y sí generó un deployment nuevo que llegó a `READY`.
El PR se dejó abierto a propósito (ver su descripción) para que seguir
pusheando a la misma rama siga re-disparando previews.

## Feedback de esta ronda (10 puntos, con screenshots reales del preview)

Primera vez en el proyecto que Alejandro adjuntó capturas reales del
preview de Vercel en vez de descripciones — permitió diagnosticar con
precisión en vez de adivinar (caso del botón de Trustpilot del rail: se
asumía desalineación, la captura mostró que en realidad era un problema de
**tamaño**, 2x más alto que el botón vecino).

1. **Color de fondo del home** — la primera banda (hero+comparador) se veía
   idéntica a la de Today's Routes; en el mockup deberían alternar.
   → `HeroSection.tsx` y `ComparatorSection.tsx` (antes del resultado) ahora
   usan `bg-card` (blanco) explícito, distinto del `--background` crema que
   ya tenían las demás secciones.
2. **Flecha de swap desalineada** — corregido con medición de píxeles vía
   Playwright (no a ojo): quedaban 4px y después 2px de diferencia por
   `pb-1`/`py-0.5` sin limpiar en el breakpoint `@4xl`. Verificado exacto
   (333.27/391.27 en ambos lados).
3. **Delay de banderas** — se investigó a fondo: `<link rel="prefetch">` se
   difiere hasta que el navegador está "idle" (puede ser varios segundos),
   por spec. Cambiado a `rel="preload" as="image" fetchPriority="low"` en
   `__root.tsx` — se sigue descargando en baja prioridad (no compite con
   fuentes/JS/CSS críticos) pero como parte de la carga normal de página,
   no diferido a idle. Verificado que los 272 `<link>` se renderizan con
   los atributos correctos.
4. **"More filters" es en realidad Sort** — renombrado a "Sort", ícono
   `ArrowUpDown` chico en vez del tile grande igual a los 3 tabs, y ahora
   se ve claramente que ninguno de los 3 tabs grandes queda resaltado
   cuando se elige una opción del dropdown (son mutuamente excluyentes).
   Default sigue siendo Recommended.
5. **Botón Trustpilot del rail** — la captura real reveló que no era
   alineación sino tamaño (~2x el alto del botón "Set alert" de al lado).
   Causa: `data-style-height="52px"` del widget + padding propio del
   wrapper. Reducido a 36px + padding ajustado.
6. **Trustpilot de /about Contact desalineado** — venía fallando en al
   menos 2 rondas anteriores con el patrón `mx-auto` en el hijo. Se
   comparó contra el mecanismo que sí funciona en `AboutManifestoSection`
   (flex + `justify-content:center` en el padre, que centra sin importar
   el `display` del hijo) y se aplicó el mismo patrón a `ContactSection`.
7. **Widget comprimido, sin resultados reales visibles** — el formulario
   de 5 filas apiladas se reescribió a 2 líneas (origen: bandera+monto+
   moneda en una caja; destino: swap+país+moneda+Compare en la otra),
   liberando ~150px del frame fijo de 360×540. Antes del primer resultado
   ahora se muestra un card de ejemplo real (`WidgetExample`, usa
   `getExclusiveCorridors`, mismos datos que Today's Routes, etiquetado
   "Example rate" para que nunca se lea como el resultado propio del
   widget). Verificado sin overflow con Playwright, antes y después de un
   resultado simulado. **No hizo falta la herramienta de Design** — se
   pudo resolver iterando directo con capturas + medición, que es el
   enfoque que venía funcionando toda la sesión.
8. **`/business` con mucho espacio en blanco** — causa raíz real (no el
   contenido, ya reorganizado en la ronda T6): `__root.tsx` forzaba
   `min-h-screen flex-col` en el wrapper de cada página para que el
   footer quedara pegado al fondo del viewport en páginas cortas. Eso es
   exactamente lo que generaba el hueco de ~250-300px entre el contenido
   y el footer. Se sacó esa forzatura (dos divs redundantes con
   `min-h-screen`, uno en `RootComponent` y otro en `LangKeyedShell`).
   Verificado con Playwright: gap contenido→footer = 0px en `/business` y
   `/about` (mismo síntoma, se corrigió gratis), sin afectar `/` (ya
   excede cualquier viewport). **No se agregó contenido ficticio** — se
   había rechazado explícitamente esa vía en una ronda anterior
   ("no se entiende por qué lo agregaste" sobre `AboutManifestoSection`
   en `/business`) y viola la regla de "nunca inventar datos".
9. **Datos de proveedores (minimum/settlement/contracts)** — investigados
   y cargados en Supabase (tabla `providers`) para 7 de los 8 brokers de
   business: Currencies Direct, Moneycorp, OFX, TorFX, Convera
   (`western-union-business`), Airwallex, Payoneer. **CAB Payments se
   dejó sin completar a propósito** — es un banco mayorista B2B sin
   mínimos públicos, no hay nada citable para no inventar.
   ⚠️ **Importante:** el sandbox bloquea el acceso directo a los dominios
   de los proveedores (egress proxy — mismo bloqueo que Supabase/
   Trustpilot, ahora confirmado que también incluye dominios arbitrarios
   de terceros, no solo esos dos). No se pudo verificar contra la fuente
   primaria de cada broker. Los valores salen de búsquedas web — algunas
   citan documentos oficiales (ej. el PDF legal de "Forward Contract
   Addendum" de Convera, muy confiable), otras son de sitios comparadores
   (businessexpert.co.uk, moneytransfers.com, wise.com/blog) que son
   citables pero de segundo nivel. **Recomendación: que alguien del
   equipo verifique estos números contra las webs oficiales de cada
   broker antes de usarlos comercialmente.** Valores cargados:
   - Currencies Direct: min 100 GBP · 1-2 días hábiles · Spot, Forward (24m)
   - Moneycorp: min 50 GBP · hasta 2 días hábiles · Spot, Forward (2 años), Options
   - OFX: min 150 USD · 1-2 días hábiles (monedas mayores) · Spot, Forward (12m)
   - TorFX: min 100 GBP · mismo día a 2 días hábiles · Spot, Forward (24m)
   - Convera: sin mínimo general publicado (se dejó `min_amount` null) ·
     spot vía clearing local: horas a 1-2 días · Spot, Forward (mín. contrato
     ~£10.000/€15.000)
   - Airwallex: min 0 (sin mínimo, plan Explore) · mismo día a 3 días hábiles
   - Payoneer: min 0.5 USD · hasta 3-5 días hábiles (retiro a banco)
10. **Panel "Your request" con espacio desaprovechado** — causa: el botón
    "Send request" usaba `justify-between` para pegarse al borde derecho
    del row, dejando un hueco muerto entre las 4 estadísticas (Volume/
    Route/Contract/Brokers) y el botón en cualquier pantalla más ancha que
    ambos grupos juntos. Se sacó `justify-between` para que el botón fluya
    justo después de las estadísticas con el mismo `gap-x-5`; el espacio
    sobrante ahora queda después del botón, que se lee como padding normal
    de card en vez de un vacío en medio del contenido. Verificado en
    1280px y 700px de ancho, y en el estado con brokers seleccionados.
    **No hizo falta Design tool** — mismo enfoque directo.

## Decisiones explícitas de Alejandro esta ronda

- Sobre los datos de U9 con fuentes de segundo nivel: **dejarlos cargados
  tal cual**, seguir con el resto y dejar la nota de verificación en este
  handoff (no revertir, no marcar visualmente como "sin verificar" en la UI).
- Sobre U10 (panel "Your request"): **iterar directo**, no usar la
  herramienta de Design — mismo criterio que R15/S13/U7 (el widget en
  profundidad) donde iterar con capturas propias funcionó bien.

## Nota menor NO corregida (fuera de alcance de esta ronda)

`comparator.business.request.cta` = `"Send request to {n} brokers"` no
pluraliza — con `n=1` se lee "Send request to 1 brokers". Es un bug
preexistente de i18n (mismo string sin lógica de plural en los 20 idiomas),
no relacionado con el pedido de espacio en blanco de esta ronda. Señalado
para una futura ronda si Alejandro quiere corregirlo.

## Estado de validación

- `bun run typecheck` — limpio.
- `bun run lint` — limpio en todos los archivos tocados esta ronda
  (`ComparatorSection.tsx` tenía 2 errores de formato de prettier propios,
  corregidos). El resto de los ~394 errores que reporta `bun run lint` en
  el repo son **preexistentes**, en archivos que esta ronda no tocó
  (`master.functions.ts`, `retail.functions.ts`, `admin.i18n-status.tsx`,
  `server.ts`, `ProviderFactory.ts`, `fxProviders.ts`, tests, etc.) —
  deuda técnica del repo, no introducida acá.
- `bun run i18n:check` — 0 rotos / 0 incompletos de 19 idiomas.
- `bun run test` — 34/34 verdes.
- Verificación visual: Playwright contra dev server local con datos
  simulados (mismo mecanismo `window.__FAKE_RESULT_FOR_SCREENSHOT__` /
  `window.__FAKE_EXAMPLE_FOR_SCREENSHOT__`, siempre revertido antes de
  commitear) — el sandbox sigue sin acceso a Supabase/Trustpilot ni a
  `*.vercel.app` (confirmado esta ronda con un `curl` fallido contra el
  preview real), así que no se pudo navegar el deploy en vivo.

## `bun.lock`

No tocado, como en rondas anteriores (está pineado a un registro privado).

## Pendientes para la próxima sesión

- Verificar contra las webs oficiales de cada broker los datos de U9
  cargados esta ronda (ver tabla arriba).
- CAB Payments sigue con `min_amount`/`settlement_terms`/`contract_type`
  en null — completar si en algún momento aparece una fuente pública.
- (Opcional, menor) pluralización de `comparator.business.request.cta`.
- Verificación visual real contra el preview de Vercel del PR #10 una vez
  alguien con acceso al browser lo abra.
