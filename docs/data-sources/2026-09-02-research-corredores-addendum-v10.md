# Research corredores — addendum v10 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v10addendum.md` (ADDENDUM #4 / v10 del research
de corredores). A diferencia de v8 y v9, **esta ronda no generó ningún
`INSERT` nuevo en `fx_rates` ni ningún alta en `providers`.** El motivo,
punto por punto:

### Lo que se cruzó contra Supabase

- **EAU→India (Sección 2.2 del research)**: los 8 proveedores de la tabla
  (Emirates NBD, Remitly, DirectRemit, Western Union, Lari, Al Ansari
  Exchange, MoneyGram, Al Fardan Exchange) **ya estaban cargados en
  `fx_rates` para el corredor AE→IN, con los mismos márgenes exactos**
  que trae este research (Emirates NBD 0.77%, Remitly 0.36%, DirectRemit
  1.11%, Western Union 0.52%, Lari 0.20%, Al Ansari 0.40%, MoneyGram
  0.34%, Al Fardan 0.56%) — evidentemente cargados en una ronda anterior
  (probablemente `research-findings-2026-09-01.md`, mencionado en el
  propio header de este documento como ya subido). **No se tocó nada**:
  no hacía falta ningún cambio.

- **Business — Wise Business (Sección 3.1)**: confirma que Wise Business
  cobra el mismo margen que Wise personal ("from 0.24%, varía por
  moneda"), sin diferenciación por tipo de cuenta. mangomundi no tiene
  (ni necesita) una fila separada de `fx_rates`/`providers` para "Wise
  Business" — el mismo dato de Wise ya cargado sirve para ambos
  segmentos. No hizo falta ningún cambio.

- **Business — Airwallex (Sección 3.2)**: la cifra nueva ("desde 0,2%
  sobre interbancario") afina hacia abajo el piso del rango 0,5%-1% que
  ya se tenía documentado en la addendum v9. El valor cargado en
  `providers.spread_percent` para `airwallex` es 0,5% — cae dentro del
  rango refinado (0,2% es el piso, no el promedio, según la propia nota
  del research), así que **no se modificó** el valor existente. Se deja
  documentado el matiz del piso más bajo para si en el futuro se decide
  cargar un dato más preciso por par de moneda.

### Lo que se investigó pero deliberadamente NO se cargó

- **LemFi y Taptap Send, corredor GB→NG (Sección 1, 1.1, 1.2)**: este
  research trae mediciones en vivo frescas de hoy (1 GBP = 1.868 NGN para
  LemFi, 1.869 NGN para Taptap Send, fee cero en ambos casos) — pero al
  revisar `fx_rates` **ya existen dos filas por proveedor para este mismo
  corredor** (LemFi: una del 23-ago-2026 con rate=1835.35/spread=1.0%, y
  otra del 25-ago-2026 con rate=1895.00/spread=-3.17%; Taptap Send: mismo
  patrón, 23-ago con rate=1835.35/spread=1.0% y 25-ago con
  rate=1875.00/spread=-2.08%; Sendwave también tiene dos filas para el
  mismo corredor). La consulta que usa `compareProviders`
  (`src/lib/fx.functions.ts`, alrededor de la línea 742) no tiene
  `ORDER BY` y arma un `Map` por `provider_slug` — si hay más de una fila
  para el mismo proveedor+corredor, **cuál "gana" depende del orden en
  que Postgres devuelva las filas, que no está garantizado**. Agregar una
  tercera fila más (con la medición de hoy) habría empeorado esa
  ambigüedad en vez de resolverla, así que **se optó por no cargar nada
  nuevo para LemFi/Taptap Send/Sendwave en GB-NG este round** hasta que
  se decida cómo resolver las filas duplicadas existentes (por ejemplo,
  borrar las más viejas y dejar solo la última medición por proveedor, o
  agregar un `ORDER BY data_collected_at DESC` + de-dup en la consulta).
  Esto es un hallazgo de higiene de datos preexistente (no introducido
  por este documento) que vale la pena resolver antes de seguir sumando
  mediciones a ese corredor específico.
- **El hallazgo metodológico de fondo (Sección 1, "XE no sirve como
  referencia de mid-market para NGN")** es igualmente válido y quedó
  documentado abajo tal cual — es información útil para todo el catálogo
  (aplica potencialmente a VES, ZWL, EGP, LBP, cualquier moneda con
  historial de mercados cambiarios múltiples), independiente de si se
  cargó o no una fila nueva de LemFi/Taptap Send.
- **Sendwave (Sección 1.3)**: sin verificación en vivo esta ronda (el
  research lo aclara explícitamente), solo un dato de tercero. No se
  cargó nada — coherente con el dato flat que ya tiene `providers.sendwave`
  (2,5%) y con la fila existente de US-IN, ninguno de los dos en
  conflicto directo con este research.
- **EEUU→India (Sección 2.1)** — los proveedores nuevos de la tabla
  (**Walmart2World**, **Placid Express**, **Wells Fargo**) no existen
  todavía en `providers`. Son candidatos interesantes (Walmart2World en
  particular, con margen mejor que Wise) pero, siguiendo la regla de la
  casa de no dar de alta un proveedor nuevo sin evaluación de negocio
  (¿tiene programa de afiliados? ¿es un producto real que un usuario de
  mangomundi pueda usar?), **no se agregaron a `providers`**. Quedan
  documentados como candidatos a evaluar.
- Los proveedores de esa misma tabla que **sí existen ya** en
  `providers`/`fx_rates` para US-IN (MoneyGram, Ria, Western Union, Wise,
  money2india) tienen datos `confirmado_activo` que **no coinciden** con
  las cifras de este research (ej. MoneyGram: fila existente
  spread=1,45%/fee=0 vs. research v10 fee=0,99%/margen=0,26%/total=0,76%;
  Ria: fila existente spread=0%/fee fijo $2,90 vs. research fee=0,99%/
  margen=0,27%/total=0,77%; Western Union: fila existente spread=3%/fee
  $1,99 vs. research fee=0,99%/margen=0,68%/total=1,18%). Son
  metodologías distintas (World Bank RPW sobre un envío de USD 200 fijo,
  vs. mediciones propias anteriores) y no necesariamente uno esté "mal" —
  pero por la regla de no pisar una fila `confirmado_activo` sin
  reconciliar, **se documenta la discrepancia y no se sobrescribe nada**.
- **Deel (Sección 3.3)**: no publica un número de margen FX propio (solo
  compara contra bancos retail en términos generales) — no es candidato
  a cargar mientras no publique una cifra concreta. No se agregó a
  `providers`.

### Resumen

Ningún `apply_migration`, ningún `execute_sql` de escritura y ningún
commit de datos en esta ronda — coherente con lo que el propio research
aclara en su encabezado ("Nada de esto fue cargado a Supabase. Solo
research + análisis"). Lo único que se agrega al repo es este documento.

---

A continuación, el contenido completo del research tal como fue
entregado.

---

# mangomundi — Research, ADDENDUM #4 (v10) — fintechs de África, corredores gigantes (US-India, Golfo-India), business

> **Documento nuevo — no reemplaza a v6, v7, v8, v9 ni a `research-findings-2026-09-01.md`.**
> Todos esos ya se subieron (o se están subiendo) al otro Claude para cargar
> a Supabase. Este es un sexto archivo con **solo lo nuevo de esta ronda**,
> para no reabrir ni reeditar nada de lo ya entregado. Para el panorama
> completo hacen falta los 6 juntos.
>
> **Nota operativa:** esta sesión no tiene forma de mandarle el archivo
> directamente a la otra sesión de Claude — no hay ninguna sesión
> alcanzable desde acá ahora mismo. Hay que subirlo manualmente, igual que
> con los anteriores.
>
> **Nada de esto fue cargado a Supabase.** Solo research + análisis. Cero
> `apply_migration`, cero `execute_sql` de escritura, cero commits.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Hallazgo metodológico grande: para NGN (naira nigeriano), la "tasa
   mid-market" que da XE.com no sirve como referencia confiable.** XE
   mostró 1 GBP = 1.797,67 NGN, pero **dos fintechs independientes
   (LemFi y Taptap Send) cotizaron en vivo casi lo mismo entre sí (1.868 y
   1.869 NGN por GBP)**, y la propia página de conversor de Wise —que se
   jacta de no cobrar margen— mostró 1.853,74. Es decir: XE está ~3% por
   debajo de lo que muestran 3 fuentes independientes. Ver Sección 1.
2. **LemFi verificado en vivo (Reino Unido→Nigeria):** 1.868 NGN por GBP,
   cero fee. Usando el propio benchmark de Wise (1.853,74) en vez de XE,
   el margen de LemFi da **~-0,77%** (mejor que ese mid-market ajustado).
   Ver Sección 1.1.
3. **Taptap Send verificado en vivo (mismo corredor):** 1.869 NGN por GBP,
   cero fee — prácticamente idéntico a LemFi. Margen ajustado ~-0,83%. Ver
   Sección 1.2. Además, una fuente de reviews reporta que Taptap Send
   **sí varía por corredor de origen**: ~1,8% en EEUU, ~1,2% en Reino
   Unido, ~0,9% en la UE — otro caso (4to del proyecto) de proveedor con
   margen no uniforme entre corredores.
4. **Sendwave (grupo Zepz/WorldRemit):** margen ~1,5% + fee chico según
   una fuente de terceros — más caro que Wise en montos grandes, más
   barato en chicos (breakeven ~USD 200-300). No verificado en vivo. Ver
   Sección 1.3.
5. **Corredor nuevo, el más grande del mundo: EEUU→India.** Datos reales
   de World Bank RPW — Walmart2World con margen negativo (-0,53%), Wise
   con margen FX 0% pero fee 2,31% (total 1,16%), y varios bancos indios
   (ICICI/money2India, Wells Fargo) mucho más caros (2-2,7%). Ver
   Sección 2.1.
6. **Corredor nuevo, corredor grande del Golfo: EAU→India.** Datos reales
   de World Bank RPW, con jugadores locales que no habían aparecido antes
   en el proyecto (Emirates NBD, Al Ansari, Al Fardan Exchange, Lari) al
   lado de Remitly, Western Union y MoneyGram. Ver Sección 2.2.
7. **Business — Wise Business confirmado con el mismo margen que Wise
   personal** ("from 0.24%, varía por moneda", sin diferenciación por
   tipo de cuenta). Ver Sección 3.1.
8. **Business — Airwallex, cifra más precisa:** "desde 0,2% sobre
   interbancario" para transferencias directas (afina el rango 0,5%-1%
   que se tenía antes) — aunque pagos con tarjeta pueden tener markup
   bastante más alto (1,2%-1,9%) según routing del comercio, algo aparte
   del producto de transferencias. Ver Sección 3.2.
9. **Business — Deel (plataforma de payroll internacional) no publica un
   número de margen FX propio.** Solo dice que usa "tasas forward
   institucionales" de su banco partner y que son mejores que el
   "4-5% que cobran muchos bancos retail" — una comparación contra bancos,
   no una cifra propia. Queda como gap. Ver Sección 3.3.

---

## 1. NGN: un problema de referencia, no de proveedor

Durante la investigación de fintechs nuevas enfocadas en corredores hacia
África, surgió algo que cambia cómo hay que leer los márgenes calculados
para naira nigeriano (NGN) en todo el proyecto hasta ahora.

**El problema:** XE.com, la fuente de mid-market usada en absolutamente
todas las mediciones en vivo de este proyecto hasta ahora, dio esta
cotización el 2-sep-2026 a las 09:39 UTC:

> 1 GBP = 1.797,6692 NGN (XE.com, mid-market)

Pero al medir en vivo dos fintechs de remesas independientes entre sí
(sin relación corporativa conocida) en el mismo corredor (Reino Unido→
Nigeria), ambas dieron una cifra muy similar entre sí y **notablemente
más alta** que la de XE:

| Fuente | 1 GBP = ? NGN |
|---|---|
| XE.com (referencia "mid-market" usada en todo el proyecto) | 1.797,6692 |
| Wise (conversor propio, sin margen declarado) | 1.853,74 |
| LemFi (cotización en vivo, fee cero) | 1.868 |
| Taptap Send (cotización en vivo, fee cero) | 1.869 |

Tres fuentes independientes (Wise, LemFi, Taptap Send) están agrupadas
entre 1.853 y 1.869 — a menos de 1% de diferencia entre ellas — mientras
que XE está **~3-4% por debajo de las tres**. Esto no puede explicarse
como que LemFi y Taptap Send estén ambos regalando plata (dos
competidores no relacionados no coinciden por casualidad en un margen
tan agresivamente favorable al cliente); lo más probable es que **la
cifra de XE para NGN esté desactualizada o no refleje bien el mercado
real**, algo conocido en monedas que tuvieron regímenes cambiarios
fragmentados (Nigeria tuvo durante años una ventana oficial del banco
central separada del mercado paralelo/autónomo, unificadas recién en
2023-2024 — es plausible que agregadores como XE tarden en reflejar bien
el nuevo esquema).

**Implicancia práctica para mangomundi:** para corredores con NGN como
moneda destino, **no conviene usar XE como única referencia de
mid-market** — conviene cruzar contra el propio conversor de Wise (que
no cobra margen) o contra 2-3 proveedores en vivo, como se hizo acá. Esto
probablemente también aplique a otras monedas con historial de mercados
cambiarios múltiples o fuertes controles de capital (ARS ya se documentó
como un caso así en rondas anteriores, con dólar oficial vs. CCL/MEP/blue
— **NGN es ahora el segundo caso confirmado del mismo tipo de problema**).
Vale la pena tenerlo en cuenta para cualquier moneda con ese historial
antes de cargar un margen calculado contra XE sin más.

### 1.1 LemFi — verificado en vivo (Reino Unido→Nigeria)

Navegado a `lemfi.com`, calculadora de la portada, corredor GBP→NGN:

- **1 GBP = 1.868 NGN, fee de transferencia: cero.**
- Usando XE (1.797,67) como referencia: margen ≈ **-3,91%** (parecería
  un margen absurdamente bueno).
- Usando el conversor de Wise (1.853,74) como referencia ajustada: margen
  ≈ **-0,77%** (razonable, coherente con un modelo "fee cero + margen
  chico", y coherente con lo que LemFi declara en su propia web sobre
  cobrar "little to no fees").

LemFi también ofrece productos de crédito, ahorro (5% AER promocional) y
eSIM — es plausible que el margen de transferencia sea deliberadamente
muy bajo/competitivo porque la empresa monetiza por otros productos
(crédito con 29,9% TAE, por ejemplo), un patrón de cross-subsidio que no
se había visto antes en el proyecto de forma tan explícita.

*Nota de higiene:* la página de blog de lemfi.com tenía, al momento de
la visita, tres entradas con títulos como "Test XSS" y "CSRF XSS Chain
Test 5" — parecen artefactos de testing de seguridad dejados visibles en
producción, no contenido dirigido a esta sesión ni instrucciones a
seguir. Se menciona solo como curiosidad, no se actuó sobre eso.

### 1.2 Taptap Send — verificado en vivo (mismo corredor) + variación confirmada por corredor de origen

Navegado a `taptapsend.com`, corredor cambiado a Reino Unido→Nigeria:

- **1 GBP = 1.869 NGN, sin fee de transferencia.** Prácticamente idéntico
  a LemFi (diferencia de 1 NGN por GBP, redondeo).
- Margen ajustado contra Wise (1.853,74): ≈ **-0,83%**.

Además, una fuente de reviews de terceros (paybillke.com, especializada
en Kenia/África) reporta cifras propias por corredor de origen (no
verificadas en vivo por esta sesión, pero coherentes con el modelo "FX
puro, sin fee" que confirma la propia empresa: *"TapTap Send uses a pure
FX-margin pricing model. Zero flat fee, all costs embedded in the
exchange rate"*):

| Corredor de origen | Margen declarado (todo incluido) |
|---|---|
| EEUU (USD) | ~1,80% |
| Reino Unido (GBP) | ~1,20% |
| Unión Europea (EUR) | ~0,90% |

**Esto convierte a Taptap Send en el 4to caso confirmado del proyecto**
de proveedor "amplio" con margen que varía fuerte según el corredor de
origen (después de Xoom, TransferGo y SBI Remit) — aunque acá la
variación parece estar más ligada al **país de origen del envío** (costo
de rieles/regulación en cada mercado) que al país de destino
específicamente.

### 1.3 Sendwave — sin verificación en vivo, dato de tercero

Sendwave (parte del grupo Zepz, mismo dueño que WorldRemit) no se pudo
verificar en vivo esta ronda por límite de tiempo. Una fuente de reviews
(paybillke.com, enfocada en Kenia/M-PESA) reporta:

- Fee plano + margen FX de **~1,5%** para USD/GBP/EUR/CAD→KES.
- Fee plano bajo o cero para envíos chicos (<USD 200 desde EEUU, <GBP 100
  desde Reino Unido).
- Comparación con Wise: para un envío de USD 1.000, Wise sale ~USD 5
  total vs. Sendwave ~USD 15-25 — Wise gana en montos grandes. Para un
  envío de USD 50, Sendwave suele salir gratis o casi gratis vs. Wise
  USD 1-2. **Breakeven declarado: ~USD 200-300.**

Esto es consistente con el patrón ya visto en TransferGo/InstaReM/
RemitBee (fee bajo/cero + margen algo más alto, competitivo en montos
chicos, menos competitivo que Wise en montos grandes) — no es un
hallazgo nuevo en el patrón, pero suma otro dato point. Queda pendiente
verificarlo en vivo en una próxima ronda si el usuario lo pide.

---

## 2. Corredores nuevos de altísimo volumen: EEUU→India y EAU→India

Hasta ahora el proyecto había cubierto corredores relativamente chicos o
medianos (Australia/Canadá→Filipinas, Japón→varios, Rumania→Moldavia,
etc.). Esta ronda se sumaron los dos corredores de mayor volumen del
mundo en remesas, que no habían sido tocados: **Estados Unidos→India**
(el corredor #1 del mundo por volumen de envíos) y **Emiratos Árabes
Unidos→India** (uno de los corredores más grandes del Golfo).

### 2.1 Estados Unidos→India (World Bank RPW, Q3 2025, envío de USD 200)

| Proveedor | Fee | Margen FX | Costo total |
|---|---|---|---|
| Walmart2World (tarjeta débito, internet) | 0,00% | -0,53% | **-0,53%** |
| Placid Express (cuenta bancaria, internet) | 0,00% | 0,42% | 0,42% |
| Wise (cuenta bancaria, internet) | 2,31% | 0,00% | 1,16% |
| MoneyGram (cuenta bancaria) | 0,99% | 0,26% | 0,76% |
| Ria (cuenta bancaria) | 0,99% | 0,27% | 0,77% |
| Western Union (cuenta bancaria) | 0,99% | 0,68% | 1,18% |
| Wells Fargo (call center) | 3,00% | 0,57% | 2,07% |
| money2India / ICICI Bank | 4,00% | 0,74% | 2,74% |

Puntos a destacar: **Walmart2World** (el servicio de remesas de Walmart,
operado con Ria/MoneyGram como backend según reportes públicos) da el
mejor costo total, incluso mejor que Wise, algo que no se había visto
antes en el proyecto para un proveedor "de cadena de retail". **Wise**
confirma su patrón de siempre (margen FX 0%, todo el costo va en el fee
explícito). Los bancos tradicionales (Wells Fargo, ICICI) quedan, como
es esperable, como las opciones más caras.

### 2.2 Emiratos Árabes Unidos→India (World Bank RPW, semana del 15-22 ago 2025, envío de 735 AED / 1.835 AED)

| Proveedor | Margen FX | Costo total |
|---|---|---|
| Emirates NBD (banco) | 0,77% | 0,77% |
| Remitly | 0,36% | 1,04% |
| DirectRemit (NBD) | 1,11% | 1,11% |
| Western Union | 0,52% | 1,59% |
| Lari | 0,20% | 1,63% |
| Al Ansari Exchange | 0,40% | 1,83% |
| MoneyGram | 0,34% | 2,48% |
| Al Fardan Exchange | 0,56% | 3,21% |

Este corredor suma varios jugadores locales de casas de cambio del Golfo
que no habían aparecido antes en el proyecto: **Al Ansari Exchange** y
**Al Fardan Exchange** (dos de las casas de cambio más grandes de EAU),
más **Lari** (fintech de remesas más chica) y **Emirates NBD/DirectRemit**
(banco local con su propio servicio de remesas). Interesante que acá
Remitly (1,04% total) le gana a Western Union, MoneyGram y a las casas de
cambio locales — pero pierde contra el banco Emirates NBD directamente
(0,77%), algo poco común (los bancos tradicionales suelen ser más caros
en este proyecto, no más baratos).

**Nota:** estos dos corredores son enormes en volumen real (India recibe
más remesas que cualquier otro país del mundo, y EEUU/Golfo son sus dos
orígenes más grandes) — si mangomundi apunta a cubrir India como país de
destino, estos dos corredores probablemente deberían tener prioridad alta
para carga completa, más que corredores chicos como Rumania→Moldavia o
Singapur→Vietnam que ya se documentaron como de datos casi inexistentes.

---

## 3. Business — profundización

### 3.1 Wise Business — mismo margen que Wise personal, confirmado

Fuente: blog oficial de Wise (`wise.com/gb/blog/wise-personal-vs-wise-
business-understand-the-difference`). Confirma explícitamente que Wise
Business y Wise Personal **cobran la misma tarifa para enviar y convertir
plata** — "from 0.24%; varies by currency" — sin ninguna diferenciación
por tipo de cuenta. La diferencia entre cuentas es de funcionalidad
(facturación, multi-usuario, integraciones contables), no de pricing FX.
Esto confirma que para mangomundi, si ya se cargó el margen de Wise
personal, **el mismo número sirve para Wise Business** — no hace falta
un registro separado por segmento para este proveedor específico.

### 3.2 Airwallex — cifra más precisa que la que se tenía

Fuente: review de Statrys (especializada en cuentas business,
generalmente confiable en este proyecto). Airwallex cobra **"desde 0,2%
sobre la tasa interbancaria"** para conversión de moneda en
transferencias directas — esto afina hacia abajo el rango 0,5%-1% que se
tenía registrado en la Sección 2 de la addendum v9. Importante: **este
0,2% es el piso, no el promedio** — probablemente varíe por par de
monedas y volumen, en la misma línea que Airwallex nunca publicó un
número único.

Dato adicional (fuera del alcance directo de "transferencias" pero
relevante para el producto de tarjetas corporativas Airwallex): pagos con
tarjeta en una moneda que la cuenta también tiene como saldo pueden
terminar con un markup de **1,2%-1,9%** si el comercio rutea el cobro vía
USD en vez de cobrar directo en la moneda local — un costo oculto que
depende del comercio, no de Airwallex en sí. No es directamente aplicable
al pricing de "transferencias" que carga mangomundi, pero vale la pena
tenerlo documentado como matiz.

### 3.3 Deel (plataforma de payroll internacional) — no publica margen propio

Deel es una plataforma de "employer of record" / payroll internacional
(paga contratistas y empleados en más de 100 países) — se investigó como
posible candidato "business" nuevo, ya que mueve muchísimo volumen de
FX aunque no es un remitter tradicional. Su artículo oficial de ayuda
sobre tipos de cambio y fees (`help.letsdeel.com`) **no da ningún número
de margen propio**. Solo dice que usa "tasas forward institucionales de
su banco partner" y que estas son "más favorables y estables que el
markup de 4-5% que cobran muchos bancos retail" — una comparación contra
bancos tradicionales, no una cifra concreta de Deel.

**Conclusión:** Deel (y probablemente plataformas de payroll similares
como Remote, Papaya Global, etc., no evaluadas todavía) no son buenos
candidatos para cargar un margen FX propio a mangomundi por ahora — no
publican el dato, y probablemente terceriza el FX en un proveedor de
fondo (banco partner no identificado, posiblemente uno de los brokers ya
cubiertos como Currencycloud/Airwallex/etc.) sin exponerlo al usuario
final de forma auditable. Queda como gap explícito, no como pendiente
de seguir insistiendo — es información que la empresa simplemente no
publica.

---

## 4. Plan sugerido para la próxima ronda

Si el usuario pide seguir profundizando, estas líneas quedaron abiertas
esta ronda y podrían continuarse:

1. **Verificar Sendwave en vivo** (no se llegó a hacer esta ronda, solo
   dato de tercero) — comparar contra LemFi/Taptap Send en el mismo
   corredor Reino Unido→Nigeria para ver si también da un margen ajustado
   parecido (~0,8%-1,5%) o si es un caso más caro.
2. **Revisar si el "problema XE vs. NGN" se repite en otras monedas con
   historial de mercados cambiarios múltiples** — candidatas: VES
   (Venezuela), ZWL (Zimbabwe), a veces EGP (Egipto) tras las
   devaluaciones de 2022-2024, LBP (Líbano). Si se confirma el mismo
   patrón, sería un hallazgo metodológico transversal importante para
   todo el catálogo, no solo para Nigeria.
3. **India como país de destino, corredores restantes de alto volumen**:
   ya se cubrieron EEUU→India y EAU→India; faltarían Arabia Saudita→India
   y Reino Unido→India (los otros dos corredores gigantes hacia India)
   si se quiere completar el cuadro de los 4 orígenes más grandes.
4. **Remote, Papaya Global y otras plataformas de payroll** — mismo
   ejercicio que con Deel, para confirmar si es un patrón de la
   categoría entera (no publican margen FX) o si alguna sí lo hace.
