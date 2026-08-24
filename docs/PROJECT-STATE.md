# mangomundi — estado del proyecto (para cualquier Claude nuevo)

> Punto de entrada único. Si estás por trabajar en este repo y no tenés el
> contexto de sesiones anteriores, leé este documento primero — resume todo
> lo que hay que saber sin necesitar la conversación original. Los documentos
> de investigación completos (verbatim, tal cual los escribió/subió Alejandro
> o una sesión anterior) están en `docs/handoff/` y `docs/multi-criteria-ranking/`;
> este archivo es el índice y el resumen ejecutivo, se actualiza cada vez que
> se cierra un sprint o se toma una decisión de arquitectura importante.

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

**El problema que se resolvió (sprint ago 2026):** `compareProviders`
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
  `fx_rates` para ese corredor exacto → no se muestra**.
- **Tipo B — cobertura amplia (`is_corridor_specific = false`):** brokers
  multi-moneda sobre infraestructura SWIFT (Wise, OFX, Revolut, Airwallex,
  Moneycorp, CurrencyFair, TorFX, Currencies Direct, CAB Payments, HSBC,
  Chase, Santander, Payoneer, Skrill, TransferGo, XE, Instarem). Por diseño
  cubren casi cualquier par de monedas — nunca se ocultan por falta de fila en
  `fx_rates`, siguen usando `fee_tiers`/campos planos.

**Regla de precedencia** (implementada en `compareProviders`):

```
SI existe fila en fx_rates para (proveedor, corredor exacto, monto en tier)
  → usar fx_rates (fee, spread, speed) — gana siempre
SINO SI el proveedor es Tipo B (o tiene fee_tiers propio)
  → usar fee_tiers / campos planos (comportamiento histórico)
SINO (Tipo A sin fila de corredor)
  → no se muestra en ese corredor
```

**Feature flag:** `ENABLE_CORRIDOR_FILTERING` (env var, default off/false).
Con el flag apagado, el comportamiento es el histórico (sin filtro de
corredor). Diseñado así a propósito para poder cargar datos y verificar en
preview sin afectar producción hasta activarlo explícitamente.

**Tabla `corridor_notes`:** documenta corredores donde a propósito **no** se
cargó cobertura (sanciones vigentes, o corredores dominados por especialistas
tipo hawala que no están en el catálogo). Ver sección 4.

## 4. Estado de los datos (última auditoría: sprint ago 2026)

- **`providers`:** 62 filas (43 Tipo A / 19 Tipo B), todas con `trust_score`
  poblado salvo CAB Payments (a propósito — es infraestructura B2B sin
  reviews de consumidor, ver `docs/multi-criteria-ranking/scoring-data-findings.md`)
  y los 3 bancos locales agregados en las últimas dos rondas (`bdo-remit`,
  `money2india`, `ubl-tezraftaar` — trust_score todavía sin investigar, no es
  urgente porque el motor de scoring los trata como neutral mientras tanto).
- **`fx_rates`:** 754 filas, 248 corredores distintos. 100% de las 650
  combinaciones (proveedor, corredor) del catálogo maestro original
  (`docs/handoff/catalogo_mundial_final.csv`, 684 filas / World Bank RPW
  Q3 2025) están cargadas. Cero proveedor Tipo A activo sin datos.
- **`transparency_score`:** null en absolutamente todos los proveedores, a
  propósito — se sacó del motor de scoring (`most_transparent` profile
  eliminado) por no existir ninguna fuente documentada para ese número en
  todo el repo. No es un hueco a rellenar salvo que aparezca una fuente real.
- **Corredores documentados como excluidos** (`corridor_notes`): Alemania→Rusia
  y Alemania→Siria (sanciones — los proveedores grandes no operan ahí de
  forma confiable), Suecia/Noruega→Somalia (dominado por especialistas hawala
  fuera del catálogo — hace falta sumar un proveedor nuevo, no solo cargar
  tarifas).

## 5. Criterio de inclusión para corredores/proveedores nuevos

"Agregar cada banco/proveedor local del mundo" es un pozo sin fondo — hay
miles de bancos y ninguna sesión puede cubrirlos todos. Después de 3 rondas
de investigación de bancos locales (15 candidatos, 1 calificó — ver sección
8), esto es el patrón que separó al que sirvió del resto, convertido en
regla explícita para decidir sin tener que redescubrirlo cada vez.

**Un candidato nuevo (banco local, MTO chico, lo que sea) se agrega al
catálogo SOLO si pasa los 4 filtros:**

1. **Marca propia distinguible** — tiene un nombre de producto de remesas
   distinto del nombre genérico del banco (ej. "UBL Tezraftaar", "BDO
   Remit", "Money2India", "Chaabi Cash"). Si la única opción es "transferir
   por SWIFT a una cuenta de Banco X", no pasa este filtro — eso ya es
   indistinguible de cualquier transferencia bancaria genérica.
2. **Opera su propio envío** — tiene oficinas, agentes o una app propia en
   el país de **origen** (no solo recibe depósitos que otro proveedor ya
   enruta). Si el banco es solo un "payout partner" de un MTO que ya está en
   el catálogo (ej. GCB Bank/Ria, BRAC Bank/TapTap Send), ese corredor
   **ya está cubierto** por ese MTO — no hace falta un proveedor nuevo.
3. **Fee Y margen de cambio, ambos con fuente citable** — World Bank RPW,
   PDF/página oficial del proveedor, o un comparador independiente
   (Monito, Wise, etc.) con fecha reciente. **Los dos, no uno solo** — un
   fee sin margen (o viceversa) no alcanza; cargarlo así sería inventar la
   mitad del dato más importante (ver sección 2, "nunca inventar datos").
4. **No redundante** — el corredor/proveedor no está ya cubierto de forma
   equivalente por algo existente en el catálogo.

**Para corredores** (no proveedores) el criterio es más simple: entran si
aparecen en el catálogo maestro original (`docs/handoff/catalogo_mundial_final.csv`,
219 corredores) o entre los de mayor volumen mundial según World Bank
(top ~50-100 por flujo anual) — no hace falta cubrir cada par de países
posible, la mayoría no tiene volumen de remesas real.

**Cuándo vale la pena una ronda nueva de investigación:** cuando aparece
una pista concreta de que un banco tiene marca de remesas propia (no una
búsqueda genérica "¿tiene este país un banco con remesas?" corredor por
corredor — eso es lo que dio 1/15 en las 3 rondas ya hechas).

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
2. **Precisión de producto/datos** (este documento) — runbook de 7 pasos
   ejecutado completo, flag `ENABLE_CORRIDOR_FILTERING` cargado y verificable
   en preview, pendiente activarlo en producción tras verificación manual.
   Investigación de corredores/proveedores faltantes: completa contra el
   catálogo original, con una pasada adicional de ~50 corredores de alto
   volumen mundial verificados y cargados (ver `git log` de la rama
   `claude/mangomundi-sprint-corridor-ui` para el detalle commit por commit).
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

**Balance de las 3 rondas: 1 de 15 candidatos calificó** (UBL Tezraftaar
Cash, UAE→Pakistán). El patrón es consistente y ya está claro: la gran
mayoría de bancos locales grandes son puntos de pago de MTOs existentes o
solo ofrecen SWIFT genérico sin marca de remesas propia ni margen publicado
— no hay muchos "UBL Tezraftaar" más por encontrar con este método. **Antes
de una ronda 4, vale la pena repensar el enfoque** (ej. apuntar directo a
bancos que SÍ se sabe que tienen brazo de remesas con marca — como Chaabi
Cash/Banque Populaire para Marruecos, ya cargado — en vez de ir país por
país a ciegas) en lugar de seguir con la misma búsqueda genérica.

## 9. Dónde está cada cosa

| Qué | Dónde |
|---|---|
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

## 10. Cómo continuar

Si es una sesión nueva de Claude sin memoria de esta conversación: leer este
archivo primero, después `docs/README.md` (índice completo de toda la demás
documentación — `ale.md`, research de datos, scoring, etc.), después el
`docs/handoff/` o `docs/data-sources/` que corresponda al tema puntual que se
va a tocar. No hace falta leer todo completo para cambios chicos — los
índices ya resumen lo esencial de cada uno.

Research de arquitectura de datos en curso: ver
`docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`
— diagnóstico completo de por qué desaparecen proveedores en corredores sin
datos (caso Western Union UK→Argentina), panorama de fuentes externas (World
Bank RPW, Wise Comparison API, RemitSCOPE, FX local vía dolarapi.com/
bluelytics para Argentina) y arquitectura propuesta (degradación con
transparencia en vez de exclusión dura). Tiene decisiones concretas
pendientes de aprobación de Alejandro en su sección 7 antes de tocar código/
producción.

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
  research web).
- **Claude chat / Claude in Chrome** (en la máquina de Alejandro, sin esa
  restricción) hace el research externo puntual — tarifas de un proveedor,
  verificación de un dato — que Claude Code no puede traer directo.
- El loop: Claude Code identifica el hueco exacto y da un pedido de
  investigación acotado (qué proveedores, qué dato exacto, qué formato) →
  Alejandro lo corre en Claude chat → pega el resultado en la conversación de
  Claude Code → Claude Code lo valida contra el criterio de la sección 5 (fee
  Y margen con fuente citable, nunca inventado) y lo carga con commit.
- Documentado acá para que cualquier sesión futura (de cualquiera de las dos
  herramientas) entienda el reparto sin tener que redescubrirlo.
