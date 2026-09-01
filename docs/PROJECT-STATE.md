# mangomundi — estado del proyecto (para cualquier Claude nuevo)

> Punto de entrada único. Si estás por trabajar en este repo y no tenés el
> contexto de sesiones anteriores, leé este documento primero — resume todo
> lo que hay que saber sin necesitar la conversación original. Los documentos
> de investigación completos (verbatim, tal cual los escribió/subió Alejandro
> o una sesión anterior) están en `docs/handoff/` y `docs/multi-criteria-ranking/`;
> este archivo es el índice y el resumen ejecutivo, se actualiza cada vez que
> se cierra un sprint o se toma una decisión de arquitectura importante.

> **🔴 Rama activa (1-sep-2026):** el trabajo del rediseño en curso vive en
> `claude/coordinar-trabajo-simultaneo-y85idz` (contiene, sin cambios, todos
> los commits que antes estaban en `claude/reorganizar-entrega-rediseno-za6gmc`
> — esa rama quedó congelada como snapshot en `237ffbe`, confirmado sin
> cambios sin commitear, no sigas pusheando ahí). Sin PR abierto todavía,
> deploy de preview en Vercel activo sobre esa rama. Si sos una sesión de
> Claude que arranca a seguir este trabajo: hacé
> `git fetch origin claude/coordinar-trabajo-simultaneo-y85idz` y trabajá
> sobre esa rama, no crees una rama nueva desde `main` — perderías todo este
> contexto y forkearías el trabajo en curso. **PR abierto: #10** (no se
> mergea solo — se dejó abierto a propósito para que cada push a la rama
> re-dispare el preview de Vercel; ver la nota del handoff de la ronda 11
> sobre por qué). **Los datos de proveedores de U9 ya están verificados
> con fuentes primarias** (sesión de Cowork `session_01HYZCZBYwtRKVrfN6k79kTW`
> — quedó bloqueada pidiendo permiso de push al repo sin forma de
> resolverlo por código entre sesiones, así que Alejandro pegó los
> hallazgos directamente en el chat; esa sesión ya cumplió su propósito,
> no hace falta retomarla). Corrigió 2 valores que la ronda anterior había
> cargado sin fuente firme (Moneycorp y Payoneer, ver el handoff de la
> ronda 12 para el detalle completo con URLs y citas). El handoff del
> último round cerrado
> (2 bugs reales de mobile encontrados y arreglados con capturas —
> truncamiento de país a "U.." y el "1 GBP = X USD" cortado sin scroll en
> el header del comparador—, ícono de Sort sin recuadro con el glyph
> clásico, `triggerIconOnly` nuevo en el Combobox base para que el widget
> muestre solo bandera/símbolo cerrado y nombre completo abierto, ejemplo
> del widget ahora clickeable, Mission/Vision/Problem de `/about`
> reescrito como storytelling sin subtítulos, **causa real del Trustpilot
> "cortado"** encontrada (36px le cortaba contenido real al iframe propio
> de Trustpilot, no un problema de nuestro CSS — revertido a 52px), botón
> de email de `/business` ya no desperdicia el espacio en blanco) está en
> `docs/handoff/handoff-2026-09-01-duodecimo-round-mobile-sort-widget-about-business.md`
> — a su vez continúa
> `docs/handoff/handoff-2026-09-01-undecimo-round-fondo-sort-widget-business-datos.md`,
> `docs/handoff/handoff-2026-09-01-decimo-round-agrupar-pildoras-colores-mockup.md`,
> `docs/handoff/handoff-2026-09-01-noveno-round-widget-business-trustpilot.md`,
> `docs/handoff/handoff-2026-08-31-octavo-round-agente-siempre-flotante.md`,
> `docs/handoff/handoff-2026-08-31-septimo-round-ajustes-nav-footer-agente.md`
> y `docs/handoff/handoff-2026-08-31-sexto-round-ajustes-buscador-agente.md`.
> **Importante para la próxima sesión:** este sandbox no puede alcanzar
> `*.supabase.co`, `trustpilot.com` **ni dominios arbitrarios de
> terceros** (confirmado en la ronda 11: `*.vercel.app` y las webs propias
> de los brokers de FX también están bloqueadas) por la política de red de
> salida (403/EGRESS_BLOCKED del proxy, no es un problema de credenciales —
> el `SUPABASE_SERVICE_ROLE_KEY` que Alejandro ya cargó en el environment
> no lo soluciona, el bloqueo es de red, no de autenticación). Esto se
> resuelve en la configuración del entorno/organización de Claude Code, no
> desde una sesión. Mientras tanto, un estado con `result` real solo puede
> verificarse simulando el dato (`window.__FAKE_RESULT_FOR_SCREENSHOT__`
> inyectado con Playwright, revertido antes de commitear — ver el handoff
> del noveno round) contra rutas que no llamen a Supabase en su loader
> (`/business` sirve, `/` y `/blog` no). El widget de Trustpilot real
> (con el script de `trustpilot.com` cargado) sigue sin poder verse en
> este sandbox bajo ninguna técnica — confirmar contra el preview real.
> **Los datos de proveedores (`min_amount`/`settlement_terms`/
> `contract_type` de brokers de business) quedaron verificados en la
> ronda 12** contra fuentes oficiales (help centers y PDFs legales de cada
> broker) vía la sesión de Cowork mencionada arriba — reemplazan los
> valores de segundo nivel que la ronda 11 había cargado sin poder abrir
> las webs oficiales. CAB Payments sigue en `null` (banco mayorista B2B,
> no publica esos datos) — no es un pendiente, es la respuesta real.

## 1. Qué es mangomundi

Plataforma multilingüe (20 idiomas) de comparación de proveedores de
remesas/FX con agente AI integrado. Objetivo: comparaciones **precisas por
corredor** (país origen → país destino), con tarifas y datos reales — nunca
inventados —, monetización por afiliados donde exista.

- **Stack:** TanStack Start, React 19, Bun, Vite 7, Supabase (PostgreSQL),
  Tailwind v4, shadcn/ui, cmdk. Deploy en Vercel (Nitro, target auto-detectado).
- **Repo:** `aleviercas/mangomundi` (GitHub, público). `main` es producción.
- **Supabase `project_id`:** `ttqalbexpquzobrdyvgx` (región `eu-west-1`).
- **i18n:** inglés inline en `src/lib/i18n.tsx` (fuente de verdad) + 19 idiomas
  en `scripts/translations/<lang>.json`. Gate estricto en el prebuild
  (`bun run i18n:check`) — ninguna key puede faltar en ningún idioma.

## 2. Principios de trabajo (no negociables)

- **Nunca inventar datos.** Todo dato de tarifa/tasa/trust que se carga a
  Supabase necesita una fuente citable (`data_source`, `data_collected_at`).
  Lo "sin confirmar" queda marcado como tal, nunca se muestra como hecho
  verificado.
- Cuando un dato no existe para un proveedor/corredor, el motor de scoring
  (`src/lib/scoring.functions.ts`) lo trata como **neutral (0.5)**, no como
  penalización — no hay apuro en completar el 100% de todo antes de activar
  algo.
- Migraciones **aditivas únicamente** contra producción compartida (Supabase
  es la misma base para todas las ramas — no hay entorno de staging separado).
- Antes de cargar SQL generado con datos de texto libre, escapar comillas
  simples (`'` → `''`) siempre por código, nunca a mano.

## 3. Modelo de datos: `providers` vs `fx_rates`

**El problema original (sprint ago 2026):** `compareProviders`
(`src/lib/fx.functions.ts`) filtraba solo por `active` + `segment`, sin
ningún filtro de corredor — cualquier proveedor activo aparecía en cualquier
comparación, usando un número de comisión/margen **plano y global**
(`fee_percent`/`fee_fixed`/`spread_percent` en `providers`, o `fee_tiers`
jsonb por tramo de monto), sin importar si ese proveedor realmente opera esa
ruta.

**Dos familias de proveedores** (columna `providers.is_corridor_specific`):

- **Tipo A — corridor-specific (`is_corridor_specific = true`):** MTOs
  clásicos que solo operan corredores concretos (WorldRemit, Remitly,
  MoneyGram, Sendwave, Paysend, Ria, Xoom, TapTap Send, LemFi, NALA, Small
  World, bancos/exchanges regionales del Golfo, etc.). Regla: **sin fila en
  `fx_rates` para ese corredor exacto → no se muestra** (salvo el caso de
  hueco indocumentado que se muestra igual con estimación — ver abajo).
- **Tipo B — cobertura amplia (`is_corridor_specific = false`):** brokers
  multi-moneda sobre infraestructura SWIFT (Wise, OFX, Revolut, Airwallex,
  Moneycorp, CurrencyFair, TorFX, Currencies Direct, CAB Payments, HSBC,
  Chase, Santander, Payoneer, Skrill, TransferGo, XE, Instarem). Por diseño
  cubren casi cualquier par de monedas — nunca se ocultan por falta de fila en
  `fx_rates`, siguen usando `fee_tiers`/campos planos.

**Actualización 27-ago-2026 (sesión Cowork, fase 2):** dentro de Tipo A hay
un sub-grupo — proveedores **estructuralmente de un solo mercado** (Money2India,
BDO Remit, UBL Tezraftaar, Prex) que no pueden operar fuera de una lista
corta y explícita de corredores. Para esos, `providers.supported_corridors`
(array `"ORIGEN-DESTINO"`) actúa como whitelist dura, **enforced siempre,
independiente del flag `ENABLE_CORRIDOR_FILTERING`** — antes del 27-ago esa
columna existía pero no se consultaba en ningún lado, por lo que Money2India
(solo `US-IN`) aparecía filtrando en corredores de Argentina. Corregido en
`fx.functions.ts` (commit `3b99216`). **El detalle completo de esta lógica
— ambas capas de elegibilidad, precedencia de fee/spread, y qué queda
abierto — está en `docs/architecture-motor-comparador.md`, el documento de
referencia para este tema a partir de ahora** (reemplaza la necesidad de
releer el diagnóstico original para entender el estado actual).

**Regla de precedencia de fee/spread** (sin cambios):

```
SI existe fila en fx_rates para (proveedor, corredor exacto, monto en tier)
  → usar fx_rates (fee, spread, speed) — gana siempre
SINO SI el proveedor es Tipo B (o tiene fee_tiers propio)
  → usar fee_tiers / campos planos (comportamiento histórico)
SINO (Tipo A sin fila de corredor, hueco indocumentado)
  → se muestra igual con fee_tiers/planos como estimación,
    has_corridor_data:false (el UI debería badgearlo como no verificado)
SINO (Tipo A con supported_corridors poblado, fuera de esa lista, o hueco
      documentado en corridor_notes)
  → no se muestra
```

**Feature flag:** `ENABLE_CORRIDOR_FILTERING` (env var, default off/false).
Con el flag apagado, el comportamiento de la capa de `fx_rates`/`corridor_notes`
es el histórico (sin filtro de corredor) — **pero la whitelist de
`supported_corridors` aplica de todas formas, sin importar este flag**. El
valor real de este flag en producción sigue sin poder confirmarse desde
Claude Code — no hay ninguna tool de Vercel en este entorno que lea/escriba
env vars (se revisaron todas las disponibles). Acción pendiente de
Alejandro: confirmarlo en el dashboard de Vercel.

**Tabla `corridor_notes`:** documenta corredores donde a propósito **no** se
cargó cobertura (sanciones vigentes, o corredores dominados por especialistas
tipo hawala que no están en el catálogo).

## 4. Estado de los datos (última auditoría: sesión Cowork 27-ago-2026, fase 2)

- **`providers`:** 62 filas (43 Tipo A / 19 Tipo B). De los Tipo A, 4 tienen
  `supported_corridors` poblado (Money2India, BDO Remit, UBL Tezraftaar,
  Prex — ver sección 3); el resto en `null` a propósito (MTOs de red amplia).
  Todas con `trust_score` poblado salvo CAB Payments (a propósito) y los 3
  bancos locales de rondas anteriores (`bdo-remit`, `money2india`,
  `ubl-tezraftaar` — no urgente, el motor de scoring los trata como neutral).
- **`fx_rates`:** 821 filas, 248 corredores distintos. `verified_status`:
  749 `confirmado_activo` / 72 `sin_confirmar` (sin cambios desde la fase 1
  de esta misma sesión — la fase 2 no tocó `fx_rates`, solo código y
  `providers` research). Detalle de la auditoría de fees sospechosos en
  `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md`: 16 filas de
  LemFi y Remitly bajadas por contaminación promocional (mismo patrón que
  Western Union GB→AR). **Pendiente, tamaño real:** de las ~378 filas
  restantes con `fee<1`, 267 están sourced de World Bank RPW y no se
  revisaron todavía (se asume menor riesgo por ser encuesta independiente,
  pero ese supuesto nunca se validó con una muestra real) — ver
  `docs/architecture-motor-comparador.md` sección 6 para el plan sugerido
  (muestra estratificada antes de comprometerse a las 267 completas).
- **`transparency_score`:** null en absolutamente todos los proveedores, a
  propósito — no existe ninguna fuente documentada para ese número en todo
  el repo.
- **Corredores documentados como excluidos** (`corridor_notes`): Alemania→Rusia
  y Alemania→Siria (sanciones), Suecia/Noruega→Somalia (dominado por
  especialistas hawala fuera del catálogo). Ninguna fila de `corridor_notes`
  toca Argentina en ningún sentido (confirmado 27-ago, fase 2).
- **Fintechs argentinas — investigadas en la fase 2 (27-ago):** Prex ya
  estaba cargada y correctamente configurada (única que califica de las 5
  investigadas). Ualá, Lemon Cash, AstroPay y Global66/Belo no pasan el
  filtro de "fee Y margen con fuente citable" — detalle completo con fuentes
  en `docs/architecture-motor-comparador.md` sección 5.

## 5. Criterio de inclusión para corredores/proveedores nuevos

"Agregar cada banco/proveedor local del mundo" es un pozo sin fondo — hay
miles de bancos y ninguna sesión puede cubrirlos todos. Después de 3 rondas
de investigación de bancos locales (15 candidatos, 1 calificó — ver sección
8) y de investigar 5 fintechs argentinas (1 calificó — ver sección 4), esto
es el patrón que separó al que sirvió del resto, convertido en regla
explícita para decidir sin tener que redescubrirlo cada vez.

**Un candidato nuevo (banco local, MTO chico, fintech, lo que sea) se agrega
al catálogo SOLO si pasa los 4 filtros:**

1. **Marca propia distinguible** — tiene un nombre de producto de remesas
   distinto del nombre genérico del banco (ej. "UBL Tezraftaar", "BDO
   Remit", "Money2India", "Chaabi Cash", "Prex"). Si la única opción es
   "transferir por SWIFT a una cuenta de Banco X", no pasa este filtro — eso
   ya es indistinguible de cualquier transferencia bancaria genérica.
2. **Opera su propio envío** — tiene oficinas, agentes o una app propia en
   el país de **origen** (no solo recibe depósitos que otro proveedor ya
   enruta, y no solo permite fondear la cuenta propia del usuario — eso es
   lo que descartó a Lemon Cash y a Global66/Belo: el dinero tiene que poder
   llegar de un tercero, no solo de una cuenta a nombre del mismo usuario).
   Si el banco es solo un "payout partner" de un MTO que ya está en el
   catálogo (ej. GCB Bank/Ria, BRAC Bank/TapTap Send), ese corredor **ya
   está cubierto** por ese MTO — no hace falta un proveedor nuevo.
3. **Fee Y margen de cambio, ambos con fuente citable** — World Bank RPW,
   PDF/página oficial del proveedor, o un comparador independiente
   (Monito, Wise, etc.) con fecha reciente. **Los dos, no uno solo** — un
   fee sin margen (o viceversa) no alcanza; cargarlo así sería inventar la
   mitad del dato más importante (ver sección 2, "nunca inventar datos").
   Esto descartó a AstroPay (fee y spread genéricos, sin cifra) y a Ualá
   (ni siquiera tiene el producto — no acepta transferencias internacionales
   directas).
4. **No redundante** — el corredor/proveedor no está ya cubierto de forma
   equivalente por algo existente en el catálogo.

**Para corredores** (no proveedores) el criterio es más simple: entran si
aparecen en el catálogo maestro original (`docs/handoff/catalogo_mundial_final.csv`,
219 corredores) o entre los de mayor volumen mundial según World Bank
(top ~50-100 por flujo anual) — no hace falta cubrir cada par de países
posible, la mayoría no tiene volumen de remesas real.

**Cuándo vale la pena una ronda nueva de investigación:** cuando aparece
una pista concreta de que un banco/fintech tiene marca de remesas propia (no
una búsqueda genérica corredor por corredor — eso es lo que dio 1/15 en las
3 rondas de bancos ya hechas, y 1/5 en la ronda de fintechs argentinas).

## 6. UI del comparador — rediseño country-first (sprint ago 2026)

El picker principal pasó de **currency-first** a **country-first**: el
usuario elige país de origen/destino (`CountryCombobox`), la moneda se deriva
automáticamente (`localCurrency()`). Antes, elegir una moneda mapeaba a un
único "país primario" hardcodeado (ej. EUR → siempre Alemania), lo que hacía
irreconciliable con `fx_rates` (una moneda como EUR cubre 9+ países emisores
con tarifas reales distintas cada uno) — además de no ser cómo funciona
ningún comparador real del rubro (Remitly/WorldRemit/Western Union lideran
con país, no con moneda).

**Caso especial — cuenta multi-moneda:** un usuario que envía desde y hacia
el mismo país pero en una moneda distinta a la local (ej. vive en UK pero
tiene cuenta Wise/Revolut en EUR) tiene una disclosure opcional ("¿necesitás
otra moneda?") que abre dos `CurrencyCombobox` independientes. Al activarse,
el servidor detecta la divergencia (`currencyOverridden` en
`fx.functions.ts`) y **excluye todos los proveedores Tipo A** — genuinamente
no pueden operar en una moneda que no sea la local del país, solo los
brokers de cobertura amplia sirven ese caso. La guardia de "mismo país =
inválido" (`sameCorridorBlocked`) respeta este caso: mismo país + moneda
distinta ya no cuenta como corredor inválido.

## 7. Sprints / prioridades (estado a la fecha)

Orden de prioridad acordado con Alejandro:

1. **Diseño premium** — **en curso** (ago 2026). Plan de 5 pasos: (1)
   fundamentos del sistema de diseño, (2) comparador, (3) resto del sitio,
   (4) arquitectura SEO, (5) seguridad. Paso 1 en dos rondas:
   - Ronda 1: los 14 colores hardcodeados (`#ff6b5b`/`#ff5a48`/`#ff8577`)
     migrados al token `--color-brand-cta` ya existente (resultaba ser el
     mismo color, solo sin centralizar — 3 tonos de hover ligeramente
     distintos por no compartir fuente).
   - Ronda 2 (rediseño más profundo, a pedido explícito de Alejandro —
     "reevaluar diseño, colores, tipografía... al estilo skyscanner"):
     escala tipográfica formal agregada (`--text-eyebrow`/`h1`/`h2`/`h3`/`h4`
     en `styles.css`, sintaxis `--text-*--line-height` de Tailwind v4) y
     aplicada a los títulos de todas las secciones del home + blog + legal
     — esto además **corrigió una inconsistencia real**: los títulos de
     sección oscilaban sin ningún criterio entre `sm:text-4xl` y
     `sm:text-5xl` según la sección, ya unificados en `text-h2`. Se agregaron
     tokens semánticos `--color-success`/`--color-warning` (antes: ~15 usos
     sueltos de `emerald-500`/`amber-600` stock de Tailwind sin relación con
     la paleta OKLCH) y se aplicaron en `ComparatorSection` (indicador de
     calidad de tasa, badges), `AiCopilot`, `EmbedWidgetSection`. Se
     migraron a tokens 3 componentes que habían quedado completamente fuera
     del sistema (paleta `slate-*`/`white` cruda): `legal.tsx`,
     `PreferredRateModal.tsx`, `ComingSoonModal.tsx`. Ver
     `docs/design-system.md` para la referencia completa de tokens/
     utilidades (incluye tabla de la escala tipográfica y qué quedó
     deliberadamente fuera: la grilla densa de resultados del comparador,
     `RfqTerminal.tsx`, `admin.i18n-status.tsx`).
   - Hallazgo relevante para el paso 5: **cero headers de seguridad
     configurados** (`vercel.json` no tiene CSP/HSTS/X-Frame-Options/etc.)
     — pendiente.
   - **Ronda 3 (29-ago-2026) — rediseño "Mangomundi 4"**: paquete de diseño
     completo entregado por Alejandro (home, comparador, modo Business,
     widget, identidad de marca), en rama
     `claude/reorganizar-entrega-rediseno-za6gmc` (aún no mergeada, nada
     LIVE todavía). **Las 6 decisiones de producto acordadas están hechas**:
     favicons/og:image → `public/brand/`; `Wordmark.tsx` con el ícono de
     marca real (clip-path diagonal) + Rubik cargada; fotografía
     redimensionada y `AboutManifestoSection`+`StatsSection` fusionadas en
     una banda oscura a sangre; conteo real de proveedores (server fn +
     hook compartido, nunca un número hardcodeado); campos de contract
     type/frequency en el modo Business (con la baja de `RfqTerminal.tsx`,
     que resultó ser código muerto); banner estable de upsell a Business;
     widget a 360×540 con bloque de invitación completo; estado del
     comparador en la URL + rutas reales `/send/:corridor` y `/business`;
     y el rail izquierdo (Filtros, agente IA acoplado, alerta de tasa,
     Trustpilot) reestructurando el grid del comparador en `≥lg`. **Ver
     [`docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md`](./handoff/handoff-2026-08-29-rediseno-mangomundi-4.md)**
     para el detalle completo de cada pieza.
   - **Ronda de ajustes 1 (29-ago-2026)** — sobre lo anterior, un segundo
     documento (`design/AJUSTES-1.md`) pidió fidelidad pixel-a-pixel al
     mockup: tipografía Bricolage Grotesque, tabla de resultados
     rediseñada (sin encabezado compartido, sello de precio de una línea,
     3 botones grandes de orden, detalles de fila), h1 del hero, reskin
     oscuro completo del panel del agente IA (alcance confirmado con
     Alejandro — mayor que "arreglar chips truncados"), copy de la banda
     oscura y de "For business", la sección nueva "Today's routes, already
     priced" (reusa `compareProviders` sobre una lista candidata de
     corredores — no hay query nueva de backend sin poder probarla), y el
     preview del widget con un resultado real. **Los 8 pasos están
     completos.** Pendiente de verificar con datos reales (mismo límite:
     sin credenciales de Supabase en este sandbox) — ver
     [`docs/handoff/handoff-2026-08-29-ajustes-1-rediseno-mangomundi-4.md`](./handoff/handoff-2026-08-29-ajustes-1-rediseno-mangomundi-4.md)
     para el detalle completo y el orden de verificación sugerido antes de
     mergear esta rama.
   - **Ronda de ajustes 2 (30-ago-2026)** — sobre lo anterior, un tercer
     documento (`design/AJUSTES-2.md`) pidió fidelidad pixel-a-pixel de
     colores/medidas/tipografía (no estructura, eso ya lo arregló la
     ronda 1): paleta base pasada de oklch a hex literal, copy y tamaños
     del CTA "Compare", marketing oculto en la pantalla de resultados,
     medidas exactas de cada fila (tag de ganador según criterio de
     orden, link "Fee breakdown"), blog rediseñado como banda compacta al
     pie, retícula y botones de la banda oscura, las cuatro tarjetas del
     rail izquierdo a medida exacta, y el header a 66px con nav de 5
     ítems y pastilla de idioma. **Las 8 secciones están completas.**
     Instrucción explícita de esta ronda: inspeccionar el markup del
     `.dc.html` directamente en vez de confiar en la prosa del documento
     — encontró al menos dos discrepancias reales entre ambos (ver el
     handoff). Mismo límite de siempre, agravado en esta ronda porque casi
     todo lo tocado solo se ve con un resultado de comparación real (sin
     credenciales de Supabase en este sandbox) — ver
     [`docs/handoff/handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md`](./handoff/handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md)
     para el detalle completo y el orden de verificación sugerido antes de
     mergear esta rama.
   - **Rondas de ajustes 3 y 4 (30-ago-2026)** — dos documentos nuevos,
     distintos en naturaleza a los anteriores: no piden fidelidad visual
     sino una pieza de arquitectura que faltaba y contenido/páginas que
     el diseño daba por hechas pero nunca se construyeron.
     `design/AJUSTES-3.md` §A agrega las píldoras de moneda al
     comparador (cambiar moneda sin cambiar país, siempre visible, en
     vez del link colapsado que abría un picker de ~110 monedas) con un
     dataset curado nuevo de monedas plausibles por país
     (`plausibleCurrencies()`, `src/lib/countries.ts`); §B + AJUSTES-4
     §1 construyen `/about` y `/how-we-make-money` como páginas reales
     (antes un redirect y un fallback a `/legal#risk`), reusando copy
     que ya existía huérfano en `i18n.tsx`, y reestructuran el footer a
     3 columnas (Product/Company/Legal). AJUSTES-4 §3 agrega "Two ways
     we work with companies" (Treasury Operations / FX & Payment
     Partnerships) a `/business`, debajo del formulario/resultados —
     **el único gap real de estas dos rondas**: ninguna de esas dos
     tarjetas tenía texto en el mockup, el repo o el historial de git,
     solo los títulos aparecen nombrados en el doc; el cuerpo describe
     mecánica real ya construida en vez de inventar afirmaciones, ver el
     handoff para el detalle. **Las 3 piezas están completas.** Ver
     [`docs/handoff/handoff-2026-08-30-ajustes-3-4-rediseno-mangomundi-4.md`](./handoff/handoff-2026-08-30-ajustes-3-4-rediseno-mangomundi-4.md)
     para el detalle completo, incluida una discrepancia real entre §A y
     §B del mismo documento (AJUSTES-3) sobre un link, y el orden de
     verificación sugerido antes de mergear esta rama.
2. **Precisión de producto/datos** (este documento) — modelo de elegibilidad
   de proveedores por corredor **cerrado y documentado** en
   `docs/architecture-motor-comparador.md` (27-ago-2026, fase 2) — es el
   documento a leer antes de pasar a la siguiente etapa de diseño/arquitectura
   que pidió Alejandro. Queda abierto: confirmar `ENABLE_CORRIDOR_FILTERING`
   en producción, verificación en vivo con browser real de varios hallazgos,
   y el barrido completo de fees World Bank RPW (ver sección 4 y el
   documento de arquitectura sección 6 para la lista priorizada completa).
3. **SEO / crecimiento orgánico:**
   - Interconexión del blog ("artículos relacionados") — **implementada**
     (sprint ago 2026): columna `blog_posts.topic_cluster` (8 clusters, los
     23 temas × 20 idiomas clasificados, 0 nulls), server fn
     `listRelatedBlogPosts` (mismo audience+cluster primero, completa con
     mismo audience si el cluster es chico) y `RelatedArticlesSection` en
     `blog_.$slug.tsx`, después de `SponsoredProvidersSection`. Diseño
     completo en `docs/handoff/blog-articulos-relacionados.md`.
   - Traducción del blog a 20 idiomas — en progreso, ver `ale.md` sección 9
     para el estado exacto (última cifra conocida: 29/400 filas).
   - Investigar por qué algunos posts no indexan en Google Search Console —
     **no arrancado**.
4. **Afiliados** — prioridad más baja, investigación intermitente. Ver
   sección 8.

## 8. Afiliados — estado conocido

**Activos hoy** (con `affiliate_url` real, `sponsored=true`): Wise, Airwallex,
Currencies Direct, TorFX, MoneyGram, Instarem.

**Plataformas de afiliados usadas:** Partnerize (`console.partnerize.com`),
Impact (`app.impact.com`), CJ Affiliate (`members.cj.com`), Sovrn
(`platform.sovrn.com`). FlexOffers — cuenta declinada, no sirve para este
proyecto aunque Sendwave figure ahí.

**Candidatos con afiliado confirmado o alta probabilidad, sin registrar
todavía:**
- **Sendwave** — mismo grupo que WorldRemit (Zepz), que ya tiene afiliado
  activo. Acción de mayor potencial/menor esfuerzo: preguntarle al equipo de
  afiliados de WorldRemit si el acuerdo ya cubre Sendwave.
- **Paysend** — programa de afiliados real confirmado vía redes de terceros
  (no solo referidos). Candidato fuerte para aplicar directo.

**Confirmado que NO tienen afiliado publisher (solo referidos usuario-a-usuario):**
Aspora, Al Ansari, Hubpay, ARQ Finance. Skrill tiene programa de afiliados,
pero es específicamente para la industria del gaming/depósitos de wallet, no
aplica a transferencias P2P.

**CashMinute — candidato real, verificar** (encontrado en esta pasada, ago
2026): tienen página propia de afiliados en `cashminute.com/affiliate-with-us`
— confirmado que existe vía búsqueda, pero el fetch directo está bloqueado
por la política de red del sandbox (dominio no whitelisteado). Alejandro
tiene que entrar directo a esa URL para ver estructura de comisión y
requisitos.

**Sin confirmar todavía** (re-verificado ago 2026, sin novedades): GCC
Exchange, Wall St Exchange, Al Fardan Exchange — ninguno de los tres tiene
programa de afiliados público encontrable por búsqueda; son casas de cambio
físicas del Golfo, probablemente sin infraestructura de afiliados digital.
e& money (telco, afiliado improbable), Payit (producto de banco, afiliado
improbable), Rocket Remit (en un corredor investigado resultó caro — bajar
prioridad, no descartar).

**Pendientes de esta línea de trabajo:** emails redactados sin enviar a
Redpin (Currencies Direct + TorFX) y a OFX; aplicación de afiliado a
Moneycorp; registro de afiliado en WorldRemit; evaluar integrar la API paga
de Trustpilot Data Solutions.

Detalle completo, corredor por corredor, en
`docs/handoff/tabla-maestra-proveedores-nuevos.md`.

### Bancos locales por país (ago 2026)

El sandbox de esta sesión bloquea el fetch directo a la mayoría de dominios
externos (`WebFetch` a `bdo.com.ph`, `cashminute.com`, etc. falla —
`EGRESS_BLOCKED`), así que la investigación profunda de bancos locales se
delegó a **Claude.ai / Claude in Chrome desde la máquina de Alejandro**, que
no tiene esa restricción y pudo entrar directo a los PDFs/páginas reales.
Resultado (traído de vuelta y cargado a Supabase en esta sesión):

- **BDO Remit (USA), Inc. — cargado.** Proveedor nuevo (`bdo-remit`, Tipo A),
  6 tramos reales de comisión por monto ($7/$8/$10/$15/$20/$25 según tramo,
  PDF oficial de BDO vigente may 2026) + margen FX 0.8% (Monito, comparador
  independiente — BDO no publica margen propio). Corredor US→PH únicamente
  por ahora. Es una subsidiaria propia de BDO, licenciada, con oficinas
  físicas en EEUU — no es un canal de cobro de otro proveedor (a diferencia
  de Walmart2World, que sí resultó serlo).
- **Money2India (ICICI Bank) — cargado, solo US→IN.** Proveedor nuevo
  (`money2india`, Tipo A), 2 tramos ($4 fee bajo US$1,000, $0 en adelante),
  margen 0.74% confirmado vía World Bank RPW (node 395869). **UK→IN y
  UAE→IN quedaron sin cargar a propósito** — se confirmó el fee (£0 y AED 12
  respectivamente) pero no un margen de cambio confiable atribuible
  específicamente a Money2India (vs. transferencias bancarias genéricas de
  ICICI), así que cargarlo hubiera significado adivinar el spread.
- **Banorte Link / BBVA "Envíos de Dinero" (México) — no cargado.** Ambos
  confirmados como productos reales (Banorte Link: app de remesas EEUU→México
  lanzada oct/nov 2025, sin comisión hacia cuentas Banorte; BBVA: tarjeta para
  receptores no bancarizados, $22.50 MXN/mes solo si no hay depósitos) pero
  **ninguno publica margen de cambio**, y ese es justo el componente que más
  varía entre proveedores — cargar fee=0/spread=0 sin confirmarlo hubiera sido
  inventar el dato más importante. Queda pendiente hasta conseguir esa cifra.
- **CashMinute afiliados — sigue sin resolver.** La página de afiliados
  renderiza con JavaScript y no expuso contenido ni siquiera desde Claude.ai/
  Chrome. Contacto público verificado: `contact@cashminute.com` — la vía que
  queda es escribirles directo.

**Mecanismo que funcionó:** cuando este sandbox bloquea el acceso a una
fuente, el patrón es delegar esa investigación puntual a Claude.ai o Claude
in Chrome (sin la restricción de red), traer el resultado de vuelta a esta
conversación, y cargarlo acá con la misma disciplina de fuente citada.

### Ronda 2 (ago 2026) — resultado: 1 de 5 candidatos calificó

- **UBL Tezraftaar Cash (UBL, Pakistán) — cargado.** Proveedor nuevo
  (`ubl-tezraftaar`, Tipo A), corredor UAE→Pakistán únicamente: fee $0, margen
  0.54% confirmado vía World Bank RPW (dato ago 2025). Marca propia de United
  Bank Limited, no un MTO blanqueado. UBL UK NetRemit y HBL UK también son
  productos propios reales, pero solo se confirmó el fee, no el margen —
  quedan sin cargar por la misma razón de siempre.
- **Banorte Link / BBVA México — sigue sin margen confirmado.** Hallazgo
  nuevo importante: Banorte Link **no es 100% producto propio** — la propia
  página de Banorte dice que "está operado por Servicio UniTeller, Inc."
  (un MTO ya existente). Si en algún momento se consigue el margen, cargarlo
  como variante de UniTeller, no como banco independiente.
- **Nigeria (Access Bank/GTBank) — descartado por ahora.** Access Bank
  AccessAfrica es marca propia pero solo para clientes existentes del banco
  (no público general) y sin margen publicado. GTBank solo tiene tarifa
  SWIFT genérica, no un producto de remesas con marca propia.
- **Kenia (Equity Bank/KCB) — descartado.** Equity Direct figuraba en World
  Bank RPW en 2016 pero ya no aparece en el corredor UK→Kenia vigente
  (ago 2025) — probablemente discontinuado. KCB Diaspora Banking es una
  cuenta bancaria para diáspora, no un producto de remesas con fee/margen
  propio.
- **Ghana (GCB/Ecobank) — descartado.** GCB Bank no tiene remesas propias —
  su método es asociarse con Ria como payout partner (ya cubierto por Ria).
  Ecobank Rapid Transfer es real pero solo hay datos para corredores
  intra-África, ninguno para EEUU/UK→Ghana.

### Ronda 3 (ago 2026) — resultado: 0 de 5 candidatos calificó

- **UBL/HBL EEUU→Pakistán:** descartado — ninguno de los dos tiene sucursal
  propia en EEUU (solo UK/UAE/Canadá/Europa/Arabia Saudita), y ninguno
  figura en el World Bank RPW para ese corredor.
- **Vietcombank Remittance (Vietnam):** el más prometedor de la ronda — es
  real, subsidiaria 100% propia de Vietcombank con oficina en EEUU. Pero
  **no encontrado** ningún comparador que haya medido su fee+margen —
  descartado por falta de dato, no por ilegítimo. Candidato a re-intentar
  si aparece una fuente nueva.
- **BRAC Bank / Islami Bank (Bangladesh):** son puntos de pago de MTOs que
  ya tenemos (Ria, TapTap Send, Western Union), no productos propios.
- **Banque Misr / NBE (Egipto):** ninguno figura en World Bank RPW — solo
  transferencia SWIFT genérica, sin marca de remesas propia.
- **Bancolombia:** sin comisión directa pero sin margen publicado ni medido
  por ningún comparador — es recepción de giro SWIFT estándar, no un
  producto de remesas con marca propia.

**Balance de las 3 rondas de bancos: 1 de 15 candidatos calificó** (UBL
Tezraftaar Cash, UAE→Pakistán). El patrón es consistente: la gran mayoría de
bancos locales grandes son puntos de pago de MTOs existentes o solo ofrecen
SWIFT genérico sin marca de remesas propia ni margen publicado.

### Ronda de fintechs argentinas (27-ago-2026, sesión Cowork fase 2) — resultado: 1 de 5 calificó

Investigadas a pedido explícito de Alejandro ("las fintech deberían aparecer
y no aparecen"): Prex, Ualá, Lemon Cash, AstroPay, Global66/Belo. Solo Prex
califica (y ya estaba cargada y activa desde antes). Detalle completo con
fuentes en `docs/architecture-motor-comparador.md` sección 5 — resumen:
Ualá no acepta transferencias internacionales directas (sin SWIFT), Lemon
Cash y Global66/Belo solo permiten fondear la cuenta propia del usuario (no
recibir de un tercero) y ninguno publica el spread, AstroPay usa lenguaje de
marketing genérico sin cifra concreta en ninguna página oficial revisada.

## 9. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| **Arquitectura definitiva del motor de proveedores/corredores (elegibilidad + resolución de tarifa)** | `docs/architecture-motor-comparador.md` |
| Runbook técnico original (diagnóstico, modelo de datos, plan de rollout paso a paso) | `docs/handoff/arquitectura-corredor-proveedores.md` |
| Investigación de proveedores nuevos por corredor + estado de afiliados | `docs/handoff/tabla-maestra-proveedores-nuevos.md` |
| Briefing de traspaso general (blog, redes, principios de trabajo) | `docs/handoff/briefing-traspaso.md` |
| Diseño de interconexión del blog | `docs/handoff/blog-articulos-relacionados.md` |
| Catálogo maestro original de corredores (684 filas, World Bank RPW Q3 2025) | `docs/handoff/catalogo_mundial_final.csv` |
| Metodología e investigación de `trust_score` por proveedor | `docs/multi-criteria-ranking/scoring-data-findings.md` |
| Investigación de métodos de entrega (cash pickup, etc.) | `docs/multi-criteria-ranking/delivery-methods-findings.md` |
| Runbook de traducción del blog | `docs/blog-translation-runbook.md` |
| Changelog de UI/UX/SEO del sitio (home, hero, widget, secciones institucionales) | `ale.md` (raíz del repo) |
| Lógica de comparación de proveedores + flag de corredores | `src/lib/fx.functions.ts` |
| Motor de scoring multi-criterio | `src/lib/scoring.functions.ts` |
| Sección del comparador (UI) | `src/sections/ComparatorSection.tsx` |
| Handoff: precisión de corredores + badges de confianza (27-ago) | `docs/handoff/handoff-2026-08-27-precision-corredores-badges.md` |
| Brief: auditoría de tarifas, sesión Cowork (27-ago) | `docs/handoff/brief-cowork-2026-08-27-audit-tarifas.md` |
| Handoff: resultado de la auditoría de tarifas, sesión Cowork fase 1 (27-ago) | `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md` |
| Handoff: fix de corredores + investigación de fintechs, sesión Cowork fase 2 (27-ago) | `docs/handoff/handoff-2026-08-27-fix-corredores-fintechs-cowork.md` |
| Handoff: sexto round de ajustes de diseño — buscador en una línea, agente junto a Today's routes, Trustpilot real (31-ago) | `docs/handoff/handoff-2026-08-31-sexto-round-ajustes-buscador-agente.md` |
| Handoff: séptimo round — nav/footer reestructurados, fix de banderas, agente rediseñado (docked claro sin scroll) (31-ago) | `docs/handoff/handoff-2026-08-31-septimo-round-ajustes-nav-footer-agente.md` |
| Handoff: octavo round — agente siempre flotante/oscuro (corrige el séptimo), rail = FiltersCard oscuro, widget sin scroll (31-ago) | `docs/handoff/handoff-2026-08-31-octavo-round-agente-siempre-flotante.md` |
| Handoff: noveno round — widget con país+moneda+monto verificado sin scroll, `/business` sin vacío de sticky-footer, espaciado sitewide, fix Trustpilot del rail (1-sep) | `docs/handoff/handoff-2026-09-01-noveno-round-widget-business-trustpilot.md` |
| Handoff: décimo round — bug de color de fondo sitewide, píldoras agrupadas, "Rank by" unificado en "More filters", "Your request" comprimido, `/about` con imagen, bug de contenido cortado en el widget (1-sep) | `docs/handoff/handoff-2026-09-01-decimo-round-agrupar-pildoras-colores-mockup.md` |

## 10. Cómo continuar

Si es una sesión nueva de Claude sin memoria de esta conversación: leer este
archivo primero, después `docs/README.md` (índice completo de toda la demás
documentación — `ale.md`, research de datos, scoring, etc.), después el
`docs/handoff/` o `docs/data-sources/` que corresponda al tema puntual que se
va a tocar. No hace falta leer todo completo para cambios chicos — los
índices ya resumen lo esencial de cada uno.

**Modelo de proveedores/corredores:** ya no hace falta leer el diagnóstico
histórico en `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`
para entender el estado actual — `docs/architecture-motor-comparador.md` es
el documento vivo y autosuficiente para ese tema, se actualiza cada vez que
cambia la lógica.

**Actualizar este archivo** cada vez que se cierre un sprint, se cargue una
tanda grande de datos, o se tome una decisión de arquitectura — es el
mecanismo acordado para que el contexto sobreviva entre sesiones (reemplaza
depender de adjuntar archivos sueltos cada vez).

### Cómo se reparte el trabajo entre Claude Code y Claude chat

Dos herramientas con acceso complementario, no en competencia:

- **Claude Code** (esta sesión y otras en paralelo) tiene acceso al repo real,
  Supabase y Vercel — hace el diagnóstico sobre datos reales, escribe y
  commitea el código/los datos, y verifica el deploy. No puede acceder a la
  mayoría de sitios externos (la política de red del sandbox bloquea el
  research web) — WebSearch/WebFetch sí funcionan para research puntual,
  pero no pueden ejecutar calculadoras dinámicas con estado de sesión
  (ej. "usuario no nuevo" en LemFi/Remitly) ni pasar bloqueos anti-bot.
- **Claude chat / Claude in Chrome** (en la máquina de Alejandro, sin esa
  restricción) hace el research externo puntual — tarifas de un proveedor,
  verificación de un dato con browser real — que Claude Code no puede traer
  directo.
- El loop: Claude Code identifica el hueco exacto y da un pedido de
  investigación acotado (qué proveedores, qué dato exacto, qué formato) →
  Alejandro lo corre en Claude chat → pega el resultado en la conversación de
  Claude Code → Claude Code lo valida contra el criterio de la sección 5 (fee
  Y margen con fuente citable, nunca inventado) y lo carga con commit.
- Documentado acá para que cualquier sesión futura (de cualquiera de las dos
  herramientas) entienda el reparto sin tener que redescubrirlo.
