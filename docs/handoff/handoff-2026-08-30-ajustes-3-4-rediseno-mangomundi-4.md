# Handoff — "Mangomundi 4", rondas de ajustes 3 y 4 (30-ago-2026)

> Estado: **`design/AJUSTES-3.md` y `design/AJUSTES-4.md` están completos**,
> en `claude/reorganizar-entrega-rediseno-za6gmc` (la misma rama de
> siempre — todavía no mergeada a `main`, nada de esto está LIVE). Este
> documento continúa
> [`docs/handoff/handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md`](./handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md)
> — las rondas 1 y 2 fueron fidelidad estructural y pixel-a-pixel contra el
> mockup; **esta ronda es distinta**: dos documentos nuevos que piden una
> pieza de arquitectura del comparador que faltaba (las píldoras de
> moneda) y contenido/páginas que el diseño daba por hechas pero nunca se
> construyeron.

## 1. Qué son estos dos documentos

`design/AJUSTES-3.md` — "las píldoras de monedas y las páginas de
confianza": §A es una pieza real del comparador (cambiar moneda sin
cambiar país) que el diseño definió pero nunca llegó al código; §B es
sobre dos botones ("Read our method"/"About us") que no llevaban a
ningún lado, y qué páginas construir para que lleven a algo real.

`design/AJUSTES-4.md` — "dónde vive cada contenido": decisiones de
ubicación sobre contenido que en teoría ya existía (misión/visión,
cifras de cobertura, dos tarjetas de venta institucional) pero estaba
mal ubicado o directamente no escrito. En la práctica, uno de los tres
puntos (Treasury Operations / FX & Payment Partnerships) resultó no
tener texto real en ningún lado — ver §4 abajo.

Commits, en orden:

1. **AJUSTES-3 §A · píldoras de moneda** — commit `907aadb`.
2. **AJUSTES-3 §B + AJUSTES-4 §1 · `/about` y `/how-we-make-money`
   reales** — commit `3716b72`.
3. **AJUSTES-4 §3 · Treasury Operations / FX & Payment Partnerships en
   `/business`** — commit `cdc9840`.

AJUSTES-4 §2 (la banda oscura se queda con el market coverage) no generó
commit propio — ya estaba satisfecho desde AJUSTES-2 §5, confirmado sin
cambios necesarios.

## 2. §A — las píldoras de moneda, la pieza más grande

El comparador ya separaba país (fuente de verdad) de moneda (derivada),
pero la única forma de mandar una moneda distinta a la local del país
era un link de texto colapsado ("¿Necesitás una moneda distinta a la
local?") que abría dos selectores completos de ~110 monedas — la fricción
exacta que el campo unificado país·moneda estaba pensado para eliminar.

`CurrencyPillRow` (nuevo, en `ComparatorSection.tsx`) reemplaza ese link
por una fila de píldoras siempre visible: antes de tener resultado, "Send
in another currency" con las monedas plausibles del país de origen;
con resultado, "Receive in another currency" con las del país de
destino (mismo boolean `compact` que ya gobierna el resto del
formulario). Reutiliza el mecanismo server-side que ya existía —
`fx.functions.ts` calcula `currencyOverridden` comparando `from`/`to`
contra `localCurrency(country)`, así que tocar una píldora solo necesita
`setFrom`/`setTo`, sin estado de override separado (se eliminó
`fromCurrencyOverride`/`toCurrencyOverride`, dead state).

**Dataset nuevo**: `plausibleCurrencies()` en `src/lib/countries.ts`, con
un mapa curado (`COMMON_ALT_CURRENCIES`) de qué monedas adicionales
mostrar por país — no existía nada así en el repo (`country-to-currency`
solo da la moneda legal de cada país, no cuáles circulan/se piden de
hecho). Curado a mano por razones reales (moneda de reserva ampliamente
sostenida, economía dolarizada, paridad/currency board con USD), no
derivado ni inventado; un país ausente del mapa solo muestra su moneda
local + la píldora "All 113" (`CURRENCIES.length` real, no un "100"
hardcodeado).

**Decisión de alcance en la regla 5** ("cambiar de moneda dispara la
comparación, no hace falta apretar el botón de nuevo"): implementada
SOLO para el tap de píldora con un resultado ya visible
(`compareMut.mutate` con override, mismo mecanismo que
`runSuggestedCompare`) — el comportamiento de país sigue exigiendo el
CTA explícito, como todos los demás campos. El doc dice "igual que
cambiar de país", pero cambiar de país tampoco auto-dispara hoy
(`useEffect` en 1022: "Keep form state shareable, but only compare after
the explicit CTA") — extender eso a país es un cambio de arquitectura
más grande que este ajuste no pedía, así que se dejó fuera.

**Discrepancia real entre §A y §B del mismo documento**: §A incluye
literalmente el link "Exchanging currency inside one country? ↗" dentro
de la fila de píldoras (estado con resultado). §B, en el mismo
documento, dice explícitamente "mientras /exchange no exista... el
enlace del comparador se oculta" — nombrando ese mismo link. Se
priorizó §B (regla explícita y más específica) sobre la inclusión
literal de §A: el link se sacó por completo (antes vivía inerte-pero-
visible en la fila superior), no se movió a la fila de píldoras. La key
`home.hero.localExchangeLink` queda en `i18n.tsx`, reservada para cuando
`/exchange` exista.

## 3. §B + AJUSTES-4 §1 — /about y /how-we-make-money

Dos páginas reales donde antes había un redirect (`/about` → `/`
`#about`) y un fallback genérico (los tres links de "how we make money"
apuntaban a `/legal#risk`, "el contenido existente más cercano").

**`/about`**: misión + visión (`home.about.mission`/`vision` — copy que
ya existía en `i18n.tsx` sin usarse en ningún componente, no nuevo), una
línea sobre cómo funciona el negocio con link a `/how-we-make-money`, y
`<ContactSection/>` al pie (el mismo mailto real, no un formulario
nuevo). A propósito sin las cifras de cobertura — quedan solo en la
banda oscura (AJUSTES-4 §2).

**`/how-we-make-money`**: responde las 4 preguntas del doc, cada sección
con texto que ya existía en el repo pero estaba huérfano:

1. Cómo se gana el dinero → `legal.terms.s3` (Compensation Disclosure),
   huérfana desde que `legal.tsx` se quedó con el set `.h1-h5`.
2. Qué no cambia esa comisión → `home.test.c1` (Algorithmic
   Impartiality), copy que `TestimonialsSection.tsx` usa pero que no
   está montada en ninguna página.
3. Cómo se marca → `fx.disclaimer` + un ejemplo visual literal del badge
   "Affiliate link".
4. De dónde salen los precios → el mecanismo real
   (`fx.functions.ts`: `has_corridor_data` + `corridor_verified_status`)
   con ejemplos visuales de los sellos Live/Estimated.

Los tres links (banda oscura "Read our method", rail "How we make
money", footer "How we make money") ahora apuntan acá.

**Header/footer**: `HEADER_NAV`/`HOME_NAV` distinguen ahora `hash`
(ancla en home) de `to` (ruta real) por entrada — "For business" y
"About" pasan a `/business`/`/about` en vez de anclas de home. Footer
reestructurado a 3 columnas literales (Product/Company/Legal, antes una
lista "Navigate" plana + "Legal"); "Local exchange" queda fuera de
Product a propósito (`/exchange` no existe, misma regla que el link del
comparador).

## 4. AJUSTES-4 §3 — el gap real de esta ronda: Treasury Operations / FX & Payment Partnerships

El doc dice "nada de esto es texto nuevo: es contenido que ya existe y
hay que mover al lugar donde hace su trabajo" — pero para estas dos
tarjetas específicamente, **no existe texto en ningún lado**: ni en el
mockup (`Mangomundi 4 - Final.dc.html` no las menciona), ni en el repo
(ninguna key de `i18n.tsx` dice "Treasury Operations" ni "FX & Payment
Partnerships" antes de este commit), ni en el historial de git. Solo los
dos títulos están nombrados, en el propio `AJUSTES-4.md`.

Se verificó esto explícitamente (grep sobre el mockup, sobre `i18n.tsx`,
sobre `git log --all -p -S`) antes de escribir nada. La resolución:
`BusinessExtrasSection.tsx` (nuevo) usa cada título literal del doc, y
para el cuerpo describe únicamente mecánica real ya construida (los
campos contract-type/frequency del modo business, el mismo flujo real
de captura de lead) en vez de inventar afirmaciones — adaptado del copy
viejo "Corporate Treasury & Operations"/"Institutional & Partnership
Inquiries" (`home.dual.corporate`, `contact.intro`) que quedó sin usar
desde que AJUSTES-1 §G reemplazó esa sección. Documentado en el commit
y en el propio código.

**Efecto de cascada necesario**: para que estas tarjetas aparezcan
siempre debajo del formulario/resultados (como pide la estructura del
doc) y no al final de toda la home cuando `/business` se visita sin
`origin`/`destination` en la URL, `HomePageBody` ganó una prop
`hideMarketingSections` — antes, `/business` sin autoRun mostraba la
home de marketing completa (Hero, TodaysRoutes, HowItWorks, banda
oscura, Widget, banda de negocio, Contact, Blog) porque solo estaba
gateada por `hasResult`. `/` y `/send/:corridor` no pasan la prop,
comportamiento sin cambios ahí.

## 5. i18n de toda esta ronda

Mismo mecanismo de siempre: keys nuevas → placeholder EN en los 19
`scripts/translations/<lang>.json` + `.pending.json`; texto de una key
existente que cambió → solo inglés (decisión #8), sin re-traducir. Se
eliminaron 3 keys huérfanas (`comparator.field.overrideCurrencyLink`/
`overrideCurrencyOpen`/`useLocalCurrency`) del inglés + los 19 idiomas +
el ledger tras reemplazar esa UI por las píldoras.

SEO de las 2 rutas nuevas (`/about`, `/how-we-make-money`) agregado solo
en inglés (`ROUTE_SEO_EN`) — el resto de los 19 idiomas cae al fallback
genérico de `SEO_META` que `getRouteSeo()` ya documenta para cualquier
ruta/idioma faltante. No se tocaron los otros 18 bloques `ROUTE_SEO_*`
por alcance — traducir el SEO de 2 páginas a 18 idiomas más es trabajo
real pero no bloquea nada, queda para una pasada de i18n dedicada.

## 6. Verificación hecha en cada paso

Mismo pipeline de siempre: `tsc --noEmit` limpio, `eslint` sin errores
nuevos (mismo único error preexistente en `i18n.tsx`, no relacionado),
`I18N_STRICT=1 npx tsx scripts/i18n-validate.ts` en verde después de
cada key nueva/eliminada, dev server local (`vite.config.ts` con `host`
temporalmente `127.0.0.1`) contra `/business`, `/embed`, `/about`,
`/how-we-make-money` y `/legal` — todas en 200, contenido real
confirmado en el HTML servido, sin errores de runtime.

**Hallazgo durante la verificación, no una regresión**: la ruta raíz
`/` devuelve 500 en este sandbox ("Missing Supabase environment
variable(s)") — se confirmó que no es algo roto por este trabajo
comparando contra `/business`, que renderiza el mismo
`HomePageBody`+`Footer`+`Header` sin problema. Es la misma limitación de
siempre (sin credenciales de Supabase acá), simplemente nunca se había
golpeado `/` directamente en las rondas anteriores porque la
verificación siempre usó `/business`/`/embed`.

**Nada de esto se pudo probar con un resultado de comparación real** —
mismo límite de siempre. Las píldoras en su estado "con resultado"
(fila "Receive in...", el recompute automático al tocar una), el rail
completo con `/how-we-make-money` enlazado desde Trustpilot, y la tabla
de brokers real en `/business` no se vieron con datos vivos en este
sandbox.

## 7. Cómo seguir

1. Leer
   [`docs/handoff/handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md`](./handoff-2026-08-30-ajustes-2-rediseno-mangomundi-4.md)
   primero si no se leyó todavía.
2. Este documento cubre `design/AJUSTES-3.md` y `design/AJUSTES-4.md`
   completos — no debería quedar nada pendiente de esos dos archivos.
3. **Antes de mergear a `main`**, con credenciales de Supabase reales (o
   un preview de Vercel), en este orden:
   - Confirmar que `/` (la ruta raíz) carga bien con Supabase real — es
     lo único de esta ronda que ni siquiera se pudo ver en 500/200 en
     este sandbox.
   - Las píldoras de moneda con un resultado real: que el tap
     recalcule, que la píldora activa refleje el estado, que "All 113"
     abra el picker completo.
   - `/business` con una búsqueda real corrida: que el conmutador +
     formulario + tabla de brokers + las dos tarjetas nuevas + contacto
     aparezcan en el orden correcto, sin la home de marketing colada en
     el medio.
   - Los 3 links a `/how-we-make-money` (banda oscura, rail, footer) en
     un click real, no solo grep sobre el `href`.
4. **Considerar una pasada de traducción real** para las ~40 keys nuevas
   de estas dos rondas (siguen como placeholder EN en los otros 18
   idiomas) y para el SEO de `/about`/`/how-we-make-money` en esos mismos
   18 idiomas — ninguna de las dos cosas bloquea, pero ambas son deuda
   real de i18n acumulada en 4 rondas de ajustes.
5. **Actualizar este archivo** (o agregar uno nuevo con fecha) si aparece
   otro documento de ajustes — mismo mecanismo que `docs/PROJECT-STATE.md`.
