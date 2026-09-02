# mangomundi — Resolución AG6: discrepancias Grupo A y filas duplicadas Grupo B (2-sep-2026)

> **Nota de estado.** Este documento es el registro de auditoría de la
> ejecución de la lista AG6: 28 casos de discrepancia "Grupo A" (datos ya
> cargados en `fx_rates` vs. hallazgos más nuevos de los addenda de
> research v9-v13, todos en `docs/data-sources/`) y 8 casos de filas
> duplicadas "Grupo B" en `fx_rates` (la consulta de `compareProviders` no
> tenía `ORDER BY`, así que cuál fila duplicada "ganaba" en un `Map` por
> `provider_slug` no era determinístico). La lista fue armada por una
> sesión anterior, revisada por el usuario (Alejandro) en otra sesión de
> Claude que produjo recomendaciones detalladas caso por caso, y
> confirmada de vuelta — incluyendo la única pregunta abierta que quedaba
> (la inconsistencia de spread de Wise: normalizar TODAS las filas de Wise
> a `public_spread_percent = 0`). Esta migración ejecuta esas
> recomendaciones ya confirmadas contra Supabase (`ttqalbexpquzobrdyvgx`,
> migración `ag6_discrepancy_resolution`) y corrige el bug de `ORDER BY`
> en el código.
>
> **Dos desviaciones deliberadas respecto a la lista confirmada, ambas por
> verificación directa contra los datos reales antes de ejecutar** (regla
> de la casa: nunca fabricar ni ejecutar a ciegas sin re-verificar):
>
> 1. **El fix sistemático de Wise tocó 91 filas, no ~15.** La consulta de
>    diagnóstico (Sección 3 de este documento) mostró que el universo real
>    de filas de Wise con `public_spread_percent` > 0 y fuente World Bank
>    RPW era de 91 filas (0,35%-1,20%, incluyendo corredores de
>    Sudáfrica salientes no mencionados en la lista original), no la
>    ~15 estimada. La instrucción confirmada por el usuario fue
>    "normalizar TODAS las filas de Wise a 0" — se ejecutó sobre el
>    universo real completo, no sobre el subconjunto ilustrativo.
> 2. **3 de los 6 corredores "default rule" del Grupo B NO se
>    resolvieron borrando la fila más vieja.** Al revisar `min_amount`/
>    `max_amount` de cada par (columnas que el análisis original no había
>    chequeado), se encontró que MoneyGram GB→IN, Western Union GB→IN,
>    Xoom GB→IN (3 filas) y Money2India US→IN **no son duplicados
>    reales** — son filas de precio escalonado por monto, correctamente
>    acotadas con `min_amount`/`max_amount`, que no se solapan (o se
>    solapan solo parcialmente). Borrar la fila "vieja" en esos casos
>    habría sido una regresión real de cobertura (dejar el corredor sin
>    ninguna fila para montos chicos), no una limpieza. Ver Sección 5.
>
> Fuentes citadas: `docs/data-sources/2026-09-02-research-corredores-addendum-v9.md`
> a `-v13.md`. Todos los valores de este documento vienen literalmente de
> esas fuentes (o son puntos medios/agregaciones simples de rangos que esas
> fuentes dan explícitamente) — ningún número fue inventado.

---

## 1. Parte 1 — Grupo A: 24 sobrescrituras confirmadas en `fx_rates`

Todas las filas de esta sección tienen su `data_source` original preservado
(se usó `||` para **agregar**, no reemplazar) y `data_collected_at` puesto
en `2026-09-02`. `verified_status` no se tocó salvo en los 2 casos de
Mukuru, explícitamente señalados abajo.

| # | Proveedor | Corredor | Campo | Antes | Después | Fuente |
|---|---|---|---|---|---|---|
| 3 | Ria | EEUU→México | spread | 1,8% | **1,24%** | v9 §11.1, World Bank RPW Q3'25 |
| 4 | Ria | España→Colombia | spread | 0% | **1,44%** | v9 §11.1, World Bank RPW |
| 5 | Sendwave | EEUU→Kenia | spread | 1,5% | **1,07%** | v11 §5.1, medición en vivo (no Monito) |
| 6 | MoneyGram | EEUU→India | fee / spread | $0 / 1,45% | **$1,98 / 0,26%** | v10 §2.1, World Bank RPW (envío USD 200) |
| 7 | Ria | EEUU→India | spread | 0% | **0,77%** | v10 §2.1, World Bank RPW |
| 8 | Western Union | EEUU→India | spread | 3% | **1,18%** | v10 §2.1, World Bank RPW |
| 9 | Wise | Reino Unido→India | spread | 0,5% | **0%** | v11 §2.2, World Bank RPW (ver también Parte 2) |
| 10 | Paysend | Reino Unido→India | spread | -0,14% | **0,37%** | v11 §2.2, World Bank RPW (margen FX, no costo total) |
| 11 | MoneyGram | Arabia Saudita→India | spread | 0,8% | **1,27%** | v11 §2.1, World Bank RPW |
| 12 | Mukuru | Sudáfrica→Zimbabue | spread / verified_status | 2,5% / sin_confirmar | **9,66% / confirmado_activo** | v11 §13.1 (RPW, 10,3%-10,7%) + v12 §1.1 (Monito re-auditado, limpio) |
| 13 | Mukuru | Sudáfrica→Mozambique | spread | 2,8% | **-4,85%** | v11 §13.1, World Bank RPW (rango -5,08% a -4,58%, punto medio); verified_status se mantiene sin_confirmar (NO auditada contra el problema de doble-monto de Monito) |
| 14 | Western Union | Hong Kong→Filipinas | spread | 2,7% | **1,55%** | v12 §4, Monito, medición limpia |
| 15 | Western Union | Japón→Filipinas | spread | 3% | **5,05%** | v12 §8, Monito, medición limpia |
| 16 | Western Union | Japón→Brasil | spread | 3,3% | **3,98%** | v12 §8, Monito, medición limpia |
| 17 | Western Union | Japón→Vietnam | spread | 3,2% | **4,81%** | v12 §8, Monito, medición limpia |
| 18 | Ria | España→Bolivia | spread | 0% | **3,76%** | v11 §5.2, World Bank RPW |
| 20 | Ria | España→Perú | spread | 0,8% | **5,02%** | v11 §7.2, World Bank RPW |
| 21 | Western Union | España→Perú | spread | 1,8% | **4,51%** | v11 §7.2, World Bank RPW |
| 22 | Remitly | España→Rep. Dominicana | spread | 1,6% | **5,91%** | v11 §7.2, World Bank RPW |
| 23 | Ria | España→Rep. Dominicana | spread | 0% | **4,64%** | v11 §7.2, World Bank RPW |
| 24 | Western Union | España→Rep. Dominicana | spread | 1,8% | **4,64%** | v11 §7.2, World Bank RPW |
| 25 | Remitly | España→Ecuador | spread | 1,6% | **4,12%** | v11 §9.1, World Bank RPW |
| 26 | Ria | España→Ecuador | spread | 0% | **3,31%** | v11 §9.1, World Bank RPW |
| 27 | Western Union | España→Ecuador | spread | 1,8% | **4,51%** | v11 §9.1, World Bank RPW |

**No tocados (confirmados "no tocar"):**

- **1. Xoom, Reino Unido→México** — métodos de pago distintos.
- **2. Remitly, Reino Unido→Argentina** — métodos de pago distintos.
- **19. Western Union, Italia→Ecuador** — la fila existente mide "cash
  pickup" (0,93%); el research nuevo (v11 §5.3) mide "internet"
  (2,99%-3,12%) vía RPW, sin fila RPW para cash pickup específicamente —
  no es el mismo producto, así que no se sobrescribió. No se agregó una
  fila nueva de "internet" tampoco: dado que el fix de la Parte 3 hace que
  la fila más reciente por `provider_slug`+corredor gane en el `Map` de
  `compareProviders`, agregar una segunda fila de WU IT-EC habría hecho
  que "internet" reemplace silenciosamente a "cash pickup" en el
  comparador — el mismo tipo de ambigüedad de producto que este trabajo
  busca resolver, no crear. Se deja documentado, sin cargar.

---

## 2. Parte 2 — Fix sistemático de Wise (confirmado por el usuario)

Instrucción confirmada: normalizar **todas** las filas de Wise a
`public_spread_percent = 0` donde la fuente sea World Bank RPW (el patrón
documentado de Wise — confirmado aritméticamente en v13 §1.1/1.3 para
China→Filipinas — es tasa mid-market real, con todo el costo en el fee
declarado, sin margen escondido).

**Diagnóstico real antes de ejecutar** (no la estimación de ~15+~15 de la
lista original):

- 111 filas de Wise ya estaban en `public_spread_percent = 0`.
- **91 filas** tenían spread > 0 y fuente `World Bank RPW Q3 2025` — rango
  0,35% a 1,20%, cubriendo Reino Unido/Golfo/Hong Kong/Singapur/Corea/
  Taiwán/Brunéi/Israel→India o Filipinas (la lista ilustrativa del
  encargo), pero también corredores salientes de Sudáfrica (ZA→BW/LS/MZ/
  NA/SZ/ZW, 1,0%-1,2%) que la lista original no mencionaba.
- 32 filas adicionales tenían spread > 0 pero fuente **"Direct research"**
  (comparadores de terceros como valutafx.com, exchangerates.org.uk, no
  RPW) — **estas NO se tocaron**, quedan fuera del alcance de este fix
  específico (son mediciones/estimaciones separadas, no parte del patrón
  RPW que se está corrigiendo).

**Resultado:** las 91 filas RPW-sourced se pusieron en `public_spread_percent
= 0`, con una nota agregada al final de cada `data_source` (preservando la
cita original):

> — spread corrected to 0% 2026-09-02: Wise's documented pattern (verified
> arithmetically in v13 Sección 1.1/1.3 for China→Philippines) is
> mid-market rate with all cost in the explicit fee, no hidden margin;
> this RPW-sourced row previously carried a spread that doesn't match that
> pattern.

Verificado post-migración: `0` filas de Wise quedan con spread>0 y fuente
RPW.

---

## 3. Parte 2 (cont.) — Skrill: corrección a nivel proveedor + 2 filas nuevas

**`providers.skrill.spread_percent`: 4,5% → 0,55%** (punto medio de las 2
mediciones reales confirmadas del producto correcto, `transfers.skrill.com`
— no la billetera general). El 4,5%/4,99% original corresponde al producto
de billetera de Skrill (pagos online, recargas de tarjeta), confundido con
el producto de remesas al cargar. 6+ fuentes independientes a lo largo de
research v8/v9/v11/v12 confirman esta separación de productos.
`providers.notes` actualizado con la explicación completa.

**Filas `fx_rates` corridor-specific:**

| Corredor | Spread | Fee | Estado |
|---|---|---|---|
| Reino Unido→India | 0,49% | $0 | Ya existía (cargada por research v11, migración `20260902140000_load_v11_corridor_rates.sql`) — verificado que coincide exacto, sin cambios. |
| Alemania→India | **0,69% (nueva)** | $0 | Fuente: v9 §3.2, World Bank RPW ("sin fee por transferencia bancaria... 0,69% de margen, 1,35% de costo total"). Tasa EUR/INR (110,925) reusada de la fila ya verificada Sendwave FR→India (25-ago-2026, mismo par de moneda) — no existía ninguna fila DE→IN previa en toda la base de ningún proveedor, así que se reusó la tasa canónica del par en vez de inventar una, siguiendo el mismo criterio ya usado para la fila GB→IN de Skrill (que reusó la tasa canónica GB-IN). |

---

## 4. Parte 3 — Fix del bug de `ORDER BY` en `compareProviders`

`src/lib/fx.functions.ts`, consulta `.from("fx_rates")` dentro de
`compareProviders` (línea ~723): se agregó `.order("updated_at", {
ascending: true })` a la cadena de la consulta (después de los `.eq()`/
`.or()`, antes de que el `Promise.all` la espere). El loop consumidor
(`corridorRates.set(r.provider_slug, {...})`) sigue igual — `Map.set` sobre
una clave duplicada se queda con el último valor asignado — pero ahora,
con las filas ordenadas de más vieja a más nueva, la fila más reciente por
`provider_slug`+corredor es la que se procesa último y por lo tanto la que
"gana", de forma determinística. `bun run typecheck` corrido después del
cambio: pasa sin errores.

---

## 5. Parte 4 — Limpieza de filas duplicadas (Grupo B), re-verificada contra datos en vivo

Se volvieron a leer las 8 corredores desde cero (`min_amount`/
`max_amount` incluidos, columna que el análisis original no había
chequeado). Resultado: **solo 3 de los 8 casos eran duplicados reales**
en el sentido de "misma fila repetida, sin razón para las dos" — los
otros 5 resultaron ser, total o parcialmente, precio legítimamente
escalonado por monto.

### 5.1 Borrados (3 corridors, regla default aplicada sin cambios)

| Proveedor | Corredor | Fila borrada (vieja) | Fila conservada (nueva) | Razón |
|---|---|---|---|---|
| TapTap Send | GB→NG | `0dcd02da…` (23-ago, fuente genérica agregador, min/max null) | `a1057aff…` (25-ago, calculadora en vivo taptapsend.com, min_amount=0,01/max null) | La fila nueva cubre efectivamente todo el rango de monto (min 0,01 ≈ sin piso real) — sin hueco de cobertura al borrar la vieja. |
| Sendwave | GB→NG | `98e9764d…` (23-ago, World Bank RPW, min/max null) | `96d92733…` (25-ago, calculadora en vivo sendwave.com, min_amount=0,01/max null) | Mismo patrón — sin hueco de cobertura. |
| Remitly | GB→IN | `34b82a07…` (23-ago, World Bank RPW, min/max null) | `8023720f…` (25-ago, tasa "everyday" en vivo remitly.com, min_amount=0,01/max null) | Mismo patrón — sin hueco de cobertura. |

### 5.2 NO borrados — desviación de la regla default, justificada por `min_amount`/`max_amount`

| Proveedor | Corredor | Filas | Por qué NO se borró nada |
|---|---|---|---|
| MoneyGram | GB→IN | `9a726e01…` (RPW, min/max **null** = todos los montos) vs. `edadfc6e…` (cotización en vivo moneygram.com, **min_amount=5000**, sin max) | La fila nueva **solo** cubre montos ≥5000 GBP. Borrar la vieja habría dejado el corredor sin ninguna fila para montos menores a 5000 GBP — una regresión de cobertura real, no una limpieza. El fix de la Parte 3 (ORDER BY) ya resuelve el solape (montos ≥5000, donde ambas filas matchean) de forma determinística: gana la más nueva. |
| Western Union | GB→IN | `65d7f19d…` (RPW, min/max null) vs. `a4497787…` (cotización en vivo westernunion.com, **min_amount=1000**, sin max) | Mismo patrón que MoneyGram — la fila nueva solo cubre ≥1000 GBP. Ambas se dejan; el fix de Parte 3 resuelve el solape. |
| Xoom | GB→IN (3 filas) | `a003ee86…` (0,01-999,99, fee 1,99, spread 1,24%), `3af2bb5a…` (1000-4999,99, fee 0, spread 1,04%), `e1430970…` (5000+, fee 0, spread 0,96%) | **No son duplicados en absoluto** — son 3 tramos de monto que no se solapan entre sí, de la misma sesión de cotización en vivo xoom.com (mismo `updated_at` exacto, mismo `data_source`: 3 montos cotizados en una sola sesión, no 3 mediciones repetidas del mismo monto). Sin solape, no hay ambigüedad ni siquiera antes del fix de Parte 3. Se dejaron las 3. |
| Money2India | US→IN (2 filas) | `1de288e7…` (0,01-999,99, fee $4) vs. `d622096c…` (1000+, fee $0) | **No es un duplicado** — coincide exactamente con `providers.fee_tiers` de money2india (`[{"max":999.99,"fee_fixed":4,...},{"min":1000,"fee_fixed":0,...}]`). La nota original del Grupo B ("difieren solo en fee, una es error de carga duplicada") no había chequeado `min_amount`/`max_amount`. Ambas filas son correctas y están correctamente acotadas — se dejaron las 2. |

### 5.3 LemFi GB→NG — dejado sin resolver, per instrucción explícita

No se borró ninguna de las 2 filas. A diferencia de los casos anteriores,
estas SÍ se solapan completamente en monto (`94363bfe…`: min/max null;
`5ecf0c9b…`: min_amount=0,01/max null — ambas cubren esencialmente todo el
rango), así que la ambigüedad de "cuál gana" sigue existiendo en la
práctica — resuelta por ahora por el fix de Parte 3 (la más nueva,
`5ecf0c9b…`, gana), pero el conflicto de datos de fondo sigue sin
resolver:

- `94363bfe…` (23-ago, "Direct research Aug 2026 — lemfi.com, aggregator
  reviews") se auto-marca explícitamente en su propio `data_source`:
  *"RE-VERIFICAR (27-ago-2026): fuente genérica sin distinción
  regular/promo ... cerrar con navegador real antes de restaurar a
  confirmado_activo"*.
- `5ecf0c9b…` (25-ago, "lemfi.com, calculadora de marketing sin login")
  es la medición en vivo más reciente, sin esa auto-marca de
  re-verificación.

**Queda flagueado para la próxima ronda de research** — no se descartó
ninguna de las 2 filas, siguiendo la instrucción explícita de no elegir a
ciegas entre ellas.

---

## 6. Resumen para referencia rápida

- **Grupo A:** 24 filas de `fx_rates` sobrescritas (spread/fee/
  verified_status según el caso), 0 de los 3 casos "no tocar" tocados.
- **Wise:** 91 filas normalizadas a spread=0 (universo real, no la
  estimación de ~15 de la lista original); 32 filas no-RPW sin tocar.
- **Skrill:** `providers.skrill.spread_percent` 4,5%→0,55%; fila GB→IN sin
  cambios (ya coincidía); fila DE→IN nueva (0,69%).
- **`compareProviders`:** `.order("updated_at", {ascending:true})`
  agregado a la consulta de `fx_rates` en `src/lib/fx.functions.ts`;
  `bun run typecheck` pasa.
- **Grupo B:** 3 filas borradas (TapTap Send, Sendwave, Remitly GB
  corridors), 5 corredores dejados sin borrar por ser precio
  legítimamente escalonado por monto o por instrucción explícita (LemFi).
