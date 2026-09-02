# Research corredores — addendum v11 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v11addendum.md` (ADDENDUM #5 / v11 del research
de corredores) — el documento más largo y con más rondas de todo el
proyecto hasta ahora (15 actualizaciones el mismo día, incluyendo una
corrección metodológica importante en la Sección 31). A diferencia de v10
(que no cargó nada), **esta ronda sí generó `INSERT`s nuevos en
`fx_rates`: 11 filas, en 8 corredores/proveedores distintos, todas en
migraciones nuevas (`20260902140000_load_v11_corridor_rates.sql`)**. El
resto del research — la gran mayoría del documento en volumen — quedó
documentado pero deliberadamente sin cargar. Detalle punto por punto:

### Lo que se cargó a Supabase (11 filas nuevas, 0 filas tocadas/borradas)

Regla aplicada de forma consistente en toda esta ronda: **solo se insertó
en pares proveedor+corredor que tenían CERO filas previas en `fx_rates`**
(no solo "menos de 2", el umbral literal de la regla de la casa) — una
decisión deliberadamente más conservadora que el mínimo exigido, para no
seguir alimentando el bug de `ORDER BY` ausente en `compareProviders`
(`src/lib/fx.functions.ts` ~línea 720-753) documentado en v10. Ningún
proveedor+corredor de esta lista tenía ninguna fila anterior:

- **Sendwave USD→NGN** (`confirmado_activo`): medición en vivo en
  `sendwave.com/en-us/countries/nigeria`, 1 USD = 1.373,023 NGN, fee 0.
  Margen calculado contra el conversor de Wise (no XE, que sigue
  confirmado desactualizado para NGN — tercera fuente independiente tras
  LemFi/Taptap Send en v10): ~0,12%. Ver Sección 1.1 del research.
  **Sendwave USD→KES (Sección 5.1) NO se cargó**: ya existía una fila
  `confirmado_activo` para `sendwave`/US/KE (spread 1,5%, cercana a la
  nueva medición regular de 1,07%) — por la regla de no insertar sobre una
  fila `confirmado_activo` en conflicto sin reconciliar, se documenta la
  discrepancia (menor, ambos números en el mismo orden de magnitud) en vez
  de cargar una segunda fila. La tasa **promocional** de Sendwave en Kenia
  (0,57%) nunca fue candidata a cargar — el research mismo la distingue
  explícitamente de la regular.
- **Skrill GBP→INR** (`confirmado_activo`): World Bank RPW, Reino
  Unido→India, margen 0,49%. Segundo dato real de Skrill Money Transfer
  del proyecto (el primero, Alemania→India 0,69%, ya vivía en un addendum
  anterior) — ambos corredores por debajo de 1%, afinan el rango real del
  producto frente al flat `providers.skrill=4,5%` (no tocado). RPW no da
  una tasa absoluta GBP/INR: se reusó la tasa canónica ya establecida en
  este proyecto para GB-IN (130,21) en vez de inventar una. Ver Sección
  2.2.
- **Global66, 4 corredores nuevos** (todos `confirmado_activo`): Chile→
  España (margen ~0,05%), Chile→EEUU (~-0,14%), Perú→España (~-0,30%) —
  los tres medidos en vivo, sin fee explícito, cierran el pendiente más
  viejo del proyecto sobre este proveedor. Y Colombia→España, el outlier
  confirmado con comisión explícita del 3% (corroborada por una segunda
  fuente independiente, blog de Wise, ~4%): como el esquema de `fx_rates`
  no tiene un campo de comisión proporcional (solo `fee` como monto fijo),
  se cargó `fee=0` y se usó `public_spread_percent=1,80%` como el costo
  total efectivo (comisión 3% + margen FX favorable -1,17%) tal como lo
  calcula el propio research, dejando la explicación completa en el
  comentario de la fila para que no se lea como "margen FX puro". Ver
  Secciones 19.1, 21.2, 23.1, 25.2.
- **Xoom USD→MXN** (`confirmado_activo`): World Bank RPW, EEUU→México,
  margen -0,24% (mejor que mid-market) — cross-validado independientemente
  vía Monito.com (-1,16%, misma dirección) y **confirmado explícitamente
  limpio** del problema de "doble monto promocional" que contaminó otros
  hallazgos de Monito este mismo día (Sección 31.3: la tarjeta de Xoom acá
  no tiene insignia promocional, un solo monto). Es el único hallazgo de
  "margen negativo" de todo el documento que sobrevive la corrección de la
  Sección 31 sin reservas. Ver Secciones 19.2, 25.1, 31.3.
- **InstaReM, 4 corredores nuevos**: Singapur→Indonesia (`confirmado_activo`,
  World Bank RPW, margen -0,06%, sin riesgo de contaminación promocional
  por no venir de Monito) y tres corredores vía Monito.com — Canadá→
  Filipinas, Canadá→India, Australia→Filipinas — cargados como
  `sin_confirmar` con las cifras **CORREGIDAS** de la Sección 31.2 (1,09%/
  0,46%/1,07%, no las cifras originales 0,34%/0,17%/-0,08% que estaban
  contaminadas por el mismo problema de doble monto). Se prefirió
  `sin_confirmar` en vez de `confirmado_activo` para estas tres porque
  siguen siendo aproximaciones ("~") de un agregador de terceros, no una
  medición directa ni un dato RPW limpio. Ver Secciones 11.3, 27.1, 29.1,
  29.2, 31.2, 31.3.

### Lo que se investigó pero deliberadamente NO se cargó

- **Arabia Saudita→India y Reino Unido→India (Sección 2, cuadro completo
  de India)**: prácticamente toda la tabla choca con estado existente.
  MoneyGram, Western Union, Remitly y WorldRemit en GB-IN **ya tienen 2
  filas cada uno** en `fx_rates` (dedup ya presente, no introducido por
  esta ronda) — agregar una tercera habría empeorado exactamente el mismo
  problema que v10 se negó a empeorar para LemFi/Taptap Send/Sendwave
  GB-NG. Xoom GB-IN ya tiene **3 filas**. Wise y Paysend GB-IN tienen 1
  fila `confirmado_activo` cada uno que **no coincide** con las cifras
  nuevas de este research (Wise: fila existente spread 0,5%/fee 0 vs.
  investigación nueva 0% margen/1,09% total vía fee; Paysend: fila
  existente spread -0,14% vs. nueva 0,37%) — se documenta la discrepancia,
  no se sobrescribe. MoneyGram y Western Union SA-IN también tienen 1 fila
  `confirmado_activo` cada uno en conflicto (MoneyGram: 0,8% existente vs.
  1,27% nuevo; Western Union: 1,5% existente vs. 1,53% nuevo — este último
  esencialmente **confirma** el dato existente, sin necesidad de tocar
  nada). Western Union Kuwait→India (Sección 17.2) también **ya coincide
  casi exacto** con la fila existente (0,59% ambos) — solo se anota la
  confirmación. **State Bank of India, ICICI Bank (como entidad separada
  de money2india), STC Pay, Fawri, TeleMoney, Al-Rajhi Bank, Bank Albilad
  y Saudi British Bank** no existen en `providers` — candidatos a evaluar,
  no se dieron de alta.
- **Sudáfrica→Zimbabue y Sudáfrica→Mozambique — el hallazgo de Mukuru con
  el vuelco de +10,7% a -5% (Sección 13.1)**: es el hallazgo más llamativo
  de todo el documento, pero se decidió **no cargarlo** este round. Mukuru
  ya tiene 1 fila `sin_confirmar` para cada corredor (ZA-ZW spread 2,5%,
  ZA-MZ spread 2,8%, ambas de la carga genérica original), y las cifras
  nuevas son *tan* distantes de esas (10,3%-10,7% real vs. 2,5% cargado en
  ZW; margen -4,6% a -5,1% real vs. 2,8% cargado en MZ, con **inversión de
  signo**) que insertar una segunda fila habría creado exactamente el tipo
  de ambigüedad de "qué fila gana según el orden no determinístico de
  Postgres" que este proyecto ya identificó como un bug latente — con el
  agravante de que acá la diferencia entre las dos filas sería enorme, no
  un matiz. El propio research pide explícitamente que Mukuru necesite
  `verified_status` por corredor específico dado lo extremo del rango; se
  interpretó eso como una razón más para no forzar una carga apurada. Se
  documenta el hallazgo completo (es información valiosa por sí misma)
  pero no se toca `fx_rates`. WorldRemit, Sasai Money Transfer y EcoCash
  Remit en estos corredores solo dan el costo total sin desglose de fee/
  margen en el research — no hay forma de cargar una fila sin inventar el
  split, así que quedan sin cargar (WorldRemit ya existe como proveedor,
  Sasai y EcoCash no). Mama Money ZA-ZW ya tiene una fila (spread 2%) casi
  idéntica a la nueva cifra (1,95%) — se documenta como confirmación, sin
  agregar una fila redundante. Bancos sudafricanos tradicionales (ABSA,
  Standard Bank, Nedbank) no están en `providers`.
- **Qatar→Nepal (Sección 13.2)**: todas las casas de cambio regionales
  (City Exchange Company, Eastern Exchange, Arabian Exchange, Al Dar
  Exchange, Ezremit) son candidatas nuevas, ninguna existe en `providers`.
  Solo Western Union tiene datos, pero no hay ninguna tasa QAR/NPR
  establecida en el resto de la base para reusar sin inventarla — se
  documenta sin cargar.
- **Kuwait→Filipinas (Sección 15.2)**: Western Union es la opción más
  barata y sí existe como proveedor, pero no hay ninguna tasa KWD/PHP
  establecida en ningún otro lado de esta base — cargar una fila habría
  requerido inventar una tasa absoluta, algo que las reglas de esta ronda
  prohíben explícitamente. Se documenta sin cargar. Aman Exchange, Al
  Mulla Exchange, Bahrain Exchange Company, Al Muzaini Exchange y Lulu
  Money no existen en `providers`.
- **España/Italia→Latam (Secciones 5.2, 5.3, 7.2, 9.1)**: 6 corredores
  nuevos con datos reales (España→Bolivia, España→Perú, España→República
  Dominicana, España→Ecuador, Italia→Ecuador, Italia→Brasil), pero **los
  únicos proveedores de esas tablas que ya existen en `providers`**
  (MoneyGram, Western Union, Ria, Remitly, WorldRemit, Wise) tienen, en
  los casos donde hay corredor comparable, filas `confirmado_activo`
  existentes que no coinciden. El resto de nombres de esas tablas (Money
  Exchange, Exact Change, Europhil, BBVA, La Caixa, Unicredit Banca, Poste
  Italiane, National Exchange Company) no existen en `providers` — son
  justamente los proveedores más baratos o los outliers extremos (BBVA
  26-28%, Unicredit 32,42% — el costo total más alto medido en todo el
  proyecto) de estas tablas, así que no cargar nada de estos corredores
  deja el hallazgo solo documentado, no reflejado en `fx_rates`.
- **El patrón "bancos españoles/italianos caros" y el mecanismo BBVA
  (Sección 11.1)**: hallazgo puramente metodológico (fee SWIFT 0,70% con
  mínimo 35€), no un dato de tarifa cargable — BBVA/La Caixa no son
  proveedores en `providers`.
- **TransferGo, datos de Monito (Secciones 25.1 y 27.2: Reino Unido→India
  0,15%, Polonia→Ucrania 2,12%)**: el propio documento deja esto como un
  pendiente explícito sin resolver en su plan de la Sección 32 punto 6 —
  "revisar retroactivamente si TransferGo (Secciones 25.1, 27.2) tiene el
  mismo problema de doble monto [promocional]" que sí se confirmó para
  MoneyGram/Western Union. A diferencia de InstaReM (que sí fue
  específicamente re-examinado y confirmado limpio en la Sección 31.3),
  TransferGo nunca fue re-chequeado — así que, siguiendo la regla de "ante
  la duda, no cargar", estas dos cifras quedan documentadas pero no
  cargadas a `fx_rates` hasta que una ronda futura confirme que no están
  contaminadas.
- **Mukuru vía Monito (Sección 23.2, cross-validation de Sudáfrica→
  Zimbabue)**: mismo pendiente sin resolver que TransferGo (Sección 32
  punto 6) — tampoco se cargó, y de todas formas Mukuru ya estaba fuera de
  alcance por el punto anterior.
- **Walmart2World (Secciones 2.1 de v10 y 19.2/21.1 de v11)**: sigue sin
  existir en `providers`. Su cifra de EEUU→México es la más extrema del
  documento (-2,44%) pero, sin mecanismo económico confirmado que la
  explique (Sección 21.1) y sin ser un proveedor dado de alta, queda como
  candidato a evaluar, no como fila.
- **Panda Remit (Secciones 5.4 y 7.1)**: verificado en vivo, pero **es una
  tasa promocional confirmada por el propio sitio** ("Exchange rates and
  transfer fees are only shown to new users") — exactamente el tipo de
  contaminación que la Regla de la casa #2 prohíbe cargar como fila
  estándar. No existe en `providers` de todas formas.
- **Impuestos país-específicos (Secciones 13.3, 15.1, 17.1, 23.3 —
  IOF de Brasil, TCS de India, Impuesto PAIS/percepción del 30%/impuesto
  al cheque de Argentina)**: hallazgos metodológicos importantes sobre
  cómo leer corredores con origen en esos países, pero no son datos de
  `fx_rates` — no hay tabla ni campo para "impuesto país de origen" en el
  esquema actual. Quedan documentados como contexto para futuras cargas de
  corredores con esos orígenes, no como algo para cargar ahora.
- **Payroll internacional (Sección 3 — Deel, Papaya Global, Remote.com)**:
  confirmado como patrón de categoría completa (ninguno publica margen FX
  propio) — línea de investigación cerrada, sin datos para cargar,
  consistente con la addendum v10.
- **GCash/Coins.ph (Sección 5.4)**: aclarado que no son proveedores de FX
  independientes (son payout methods de otros proveedores ya cubiertos) —
  no corresponde evaluarlos como candidatos.

### Duplicado/discrepancias a señalar explícitamente

1. **GB-IN sigue siendo el corredor con más filas duplicadas del
   proyecto**: MoneyGram, Remitly y Western Union ya tienen 2 filas cada
   uno; Xoom tiene 3. Esta ronda no agregó ninguna fila nueva a GB-IN para
   ningún proveedor que ya tuviera una — la única fila GB-IN nueva
   (Skrill) es un proveedor sin ninguna fila previa en todo `fx_rates`.
   **Sigue sin resolverse el bug de `ORDER BY` en `compareProviders`**
   (`src/lib/fx.functions.ts` ~línea 720-753) que hace esto no
   determinístico — cada ronda que pasa sin resolverlo dificulta más una
   futura limpieza (más filas para reconciliar).
2. **Mukuru ZA-ZW y ZA-MZ**: discrepancia grande entre las filas
   `sin_confirmar` existentes (spread genérico 2,5%/2,8%) y los datos
   reales de esta ronda (10,3%-10,7% real en ZW; margen -4,6% a -5,1% en
   MZ). No se sobrescribió ni se agregó una segunda fila — ver arriba.
3. **money2india/US-IN tiene 2 filas idénticas** (mismo rate/spread,
   fee 4 y fee 0) detectadas al auditar el estado de la base para esta
   ronda — no es algo introducido por v11, pero se deja anotado acá como
   otro caso a limpiar junto con GB-IN cuando se aborde el bug de
   `ORDER BY`.

### Auditoría de archivos de research ya subidos (pedido del usuario)

Se revisó `docs/data-sources/` contra los archivos que el propio header de
v11 menciona como "ya subidos": v6, v7, v8, v9, v10 y
`research-findings-2026-09-01.md`. **v6 a v10 están todos presentes** en
el repo (`2026-09-01-research-corredores-xoom-worldremit-v6.md`,
`2026-09-01b-research-moneygram-addendum-v7.md`,
`2026-09-02-research-corredores-addendum-v8.md`, `-v9.md`, `-v10.md`).
**`research-findings-2026-09-01.md` NO está en el repo** — no existe con
ese nombre exacto en `docs/data-sources/` (tampoco con un nombre
parecido; v6 reemplaza a un `research-findings-2026-09-01-v5.md`
distinto, mencionado solo en el propio header de v6). v9 y v10 citan este
archivo faltante repetidamente como fuente de datos ya cargados (el
corredor Golfo→India completo AE-IN, el rango de Airwallex, un dato de
TransferGo Polonia→Ucrania). Cruzando contra Supabase: **el corredor
AE-IN que v10 le atribuye a este archivo ya está cargado en `fx_rates`
tal cual** (verificado por v10 y re-confirmado en esta auditoría), así
que el trabajo subyacente parece estar reflejado en la base aunque el
documento en sí no esté en el repo — probablemente un archivo que se
cargó directamente sin pasar por `docs/data-sources/`, o que se perdió en
el camino entre sesiones. Se lo señala acá para que el usuario decida si
vale la pena volver a subirlo (para tener el research completo
documentado en el repo) o si lo da por suficientemente reflejado en la
base de datos.

---

A continuación, el contenido completo del research tal como fue
entregado.

---

# mangomundi — Research, ADDENDUM #5 (v11) — Sendwave en vivo, el caso NGN se acota, India completo, payroll confirmado sin dato

> **Documento nuevo — no reemplaza a v6, v7, v8, v9, v10 ni a
> `research-findings-2026-09-01.md`.** Todos esos ya se subieron (o se
> están subiendo) al otro Claude para cargar a Supabase. Este es un
> séptimo archivo con **solo lo nuevo de esta ronda**. Para el panorama
> completo hacen falta los 7 juntos.
>
> **Actualizado el mismo día, quince veces.** Primera versión: Secciones 1-4
> (Sendwave en vivo hacia Nigeria, el caso NGN acotado tras probar EGP/LBP,
> corredores España Saudita/Reino Unido→India, payroll confirmado sin
> dato). Segunda actualización: Sección 5 — Sendwave verificado también
> en Kenia (confirma que su margen varía por moneda de destino), dos
> corredores España/Italia→Latam nuevos (España→Bolivia resultó carísimo
> en general, Italia→Ecuador confirma otra vez que Xoom es caro), dos
> corredores más confirmados vacíos en RPW (España→Argentina, Italia→Perú),
> y Panda Remit evaluado (sin cifra pública propia, un dato de tercero
> sugiere que puede ser competitivo). **Tercera actualización: Sección 7
> — Panda Remit verificado en vivo por fin (Singapur→China), pero resultó
> ser otra vez una tasa promocional "solo para clientes nuevos", declarada
> como tal por el propio sitio — otro caso de contaminación por tasa
> promocional. Tres corredores España/Italia→Latam nuevos con datos reales
> (España→Perú, España→República Dominicana, Italia→Brasil, este último
> con un banco -Unicredit- carísimo, 32,42%). Italia→Argentina confirmado
> vacío en RPW, que sumado a España→Argentina de la ronda anterior sugiere
> que World Bank simplemente no tiene datos para Argentina como destino,
> más allá del corredor específico.**
>
> **Cuarta actualización: Sección 9** — se completó el mapeo de corredores
> España/Italia→Latam pendiente. España→Ecuador salió con datos reales,
> otra vez con bancos tradicionales españoles (BBVA, La Caixa) carísimos
> (26,74% y 28%) — ya es el tercer/cuarto caso de BBVA o similar como
> outlier extremo, empieza a verse como un patrón de la categoría "banco
> tradicional español en corredores a Latam", no un caso aislado. España→
> Paraguay, Italia→México e Italia→Uruguay salieron los tres vacíos en
> RPW. **Corrección importante hecha en vivo por el usuario durante esta
> misma actualización: "vacío en RPW" no significa "no se puede enviar
> ahí" — solo significa que esa fuente puntual no lo releva.** Se
> verificó en vivo con Wise que los 4 corredores marcados como vacíos en
> este documento (México, Paraguay, Uruguay, y Argentina de la Sección
> 7.3) están todos activos y operables, con tasas y fees reales — Wise
> incluso marca explícitamente "cargos dinámicos" para Paraguay y
> Argentina, lo que probablemente explica mejor por qué RPW no los cubre
> (más caros/volátiles de estandarizar) que la idea de "no hay volumen".
> Se corrigió el texto de las Secciones 7.3, 9.2 y el plan de la Sección
> 10 para no repetir el error de tratar "sin dato en RPW" como sinónimo
> de "corredor cerrado".
>
> **Quinta actualización: Sección 11** — se confirmó el patrón de bancos
> españoles caros con una fuente mejor que un tercer corredor de RPW: el
> propio tarifario de BBVA (vía blog de Wise), que explica el mecanismo
> exacto (fee SWIFT de 0,70% con mínimo de 35€, que en un envío chico de
> 140-200€ ya representa 18-25% por sí solo, antes de sumar el margen
> cambiario). Se abrieron dos regiones nuevas para el proyecto: Sudáfrica→
> Zimbabue (con Mukuru como candidato nuevo, aunque resultó caro; y
> bancos sudafricanos tradicionales en 22-34%, mismo patrón de bancos
> caros visto en España/Italia) y Singapur→Indonesia (InstaReM reconfirma
> margen muy ajustado, -0,06%, coherente con el dato de UK→India de
> rondas anteriores). Y, aplicando la corrección de la ronda pasada, se
> verificó en vivo con Wise que España→México (vacío en RPW) sí está
> operable (1 EUR = 19,7031 MXN, fee 7,52 EUR).
>
> **Sexta actualización: Sección 13** — **hallazgo grande: Mukuru
> resultó ser el 6to caso confirmado del proyecto de proveedor "amplio"
> con margen que varía muchísimo por corredor.** En Sudáfrica→Zimbabue
> (Sección 11.2) era el más caro de los no-bancarios (10,3%-10,7%); en
> Sudáfrica→Mozambique (esta ronda) domina el corredor con margen
> NEGATIVO (-5,08% a -4,58%) y es el más barato (4,01%) — un vuelco
> completo entre dos corredores del mismo país de origen. Se sumó Qatar→
> Nepal como corredor nuevo de Medio Oriente, con casas de cambio
> regionales no vistas antes (City Exchange Company, Eastern Exchange,
> Arabian Exchange, Al Dar Exchange). Y, aplicando otra vez la corrección
> de la Sección 9.2, se verificó Brasil→Portugal (vacío en RPW) en vivo
> con Wise — reveló que Brasil aplica impuestos (IOF) sobre operaciones
> cambiarias que se suman al margen del proveedor, un componente de costo
> distinto que no se había visto documentado así antes en el proyecto.
>
> **Séptima actualización: Sección 15** — se revisó si Argentina e India
> (los otros 2 países de origen ya cubiertos por el proyecto) tienen un
> impuesto país-específico parecido al IOF de Brasil. **India sí:** el
> TCS (Tax Collected at Source) es un impuesto real sobre remesas bajo el
> esquema LRS, pero con un umbral alto (10 lakh INR / año, ~USD 12.000) —
> **no afecta a los montos chicos que usa RPW para medir** (140-500 USD
> equivalente), así que no contamina los datos ya cargados del proyecto
> para corredores hacia/desde India. **Argentina es más ambiguo:** el
> "Impuesto PAIS" en sí fue eliminado en dic-2024, pero sigue vigente una
> percepción del 30% — que aplica a compra de dólar ahorro, consumos con
> tarjeta en el exterior y paquetes turísticos, **sin confirmación clara
> de que aplique a transferencias/remesas de dinero** (el caso de uso de
> mangomundi). Se dejó marcado como pendiente de verificar más a fondo si
> hace falta. Se sumó también Kuwait→Filipinas como corredor nuevo de
> Medio Oriente (Western Union, inusualmente, es la opción más barata acá).
>
> **Octava actualización: Sección 17** — se profundizó el pendiente de
> Argentina: se encontró un impuesto más universal que la percepción del
> 30% (que sigue sin confirmarse para remesas) — el **Impuesto al Débito
> y Crédito ("impuesto al cheque")**, 0,6% débito + 0,6% crédito = 1,2%
> total, que aplica en términos generales a "todo débito y crédito en
> cuentas bancarias argentinas", por lo que plausiblemente sí toca una
> transferencia/remesa (a diferencia de la percepción del 30%, que sigue
> sin confirmación específica). Es parcialmente recuperable (33% contra
> Ganancias, 17% contra IVA). También se confirmó, con una segunda
> fuente, que el Impuesto PAIS fue derogado el **31 de octubre de 2024**
> (no el 23 de diciembre, como decía una fuente usada en la Sección
> 15.1 — se deja registrada la discrepancia menor entre fuentes). Y se
> sumó un segundo corredor para **Lulu Money** (Kuwait→India), que
> confirma el patrón de margen variable ya sospechado en la Sección
> 15.2: acá el costo total va de 0,87% a 1,96% (margen FX 0,27%-0,58%),
> muy por debajo del 2,89% visto en Kuwait→Filipinas — **7mo caso
> confirmado del proyecto** de proveedor "amplio" con margen que varía
> fuerte por corredor.
>
> **Novena actualización: Sección 19** — se cerró por fin el pendiente
> más viejo del proyecto: **Global66, verificado en vivo en dos
> corredores (Chile→España y Chile→EEUU), resultó tener margen bajo y
> consistente (~0,05% y -0,14%)**, sumándose a InstaReM como segundo
> caso de proveedor "amplio" con margen ajustado y estable — no
> variable. Se abrió también **EEUU→México, el corredor de remesas más
> grande del mundo**, con un hallazgo nuevo para el proyecto: varios
> proveedores (Walmart2World, Xoom) muestran **costo total NEGATIVO**
> (mejor que la referencia de mercado) en algunas de sus opciones — un
> patrón de competencia extrema no visto antes en corredores más chicos.
> Y se armó una **tabla de referencia consolidada** con los 7 casos
> confirmados de margen variable por corredor, pensada para facilitar la
> carga a Supabase.
>
> **Décima actualización: Sección 21** — se investigaron los dos
> pendientes abiertos en la ronda anterior. **Walmart2World:** no se
> encontró confirmación explícita de una estrategia de "loss leader"
> (subsidiar el tipo de cambio para atraer tráfico a las tiendas) — el
> propio Walmart solo comunica públicamente el ahorro acumulado de sus
> clientes ("~USD 1.000 millones ahorrados desde 2014"), sin detallar el
> mecanismo económico. **Global66 desde un segundo origen (Colombia→
> España): el resultado matiza la conclusión de la ronda anterior** — acá
> SÍ aparece una comisión explícita (3% plana) combinada con un tipo de
> cambio ligeramente favorable, dando un costo total de ~1,8%, bastante
> más alto que el ~0,05%/-0,14% visto desde Chile. **Conclusión revisada:
> Global66 no tiene necesariamente el mismo margen bajo en todos sus
> países de origen** — la ronda anterior había sido, en retrospectiva,
> demasiado apurada al generalizar a partir de un solo país de origen
> (Chile).
>
> **Onceava actualización: Sección 23** — ronda enfocada en revisar
> pendientes y sumar fuentes alternativas a las ya usadas (World Bank
> RPW, XE, Wise). **Global66 desde un tercer origen (Perú→España)**
> resultó con el mismo patrón de Chile (sin fee explícito, margen
> ~-0,30%) — con esto, 2 de 3 países de origen probados muestran margen
> bajo sin fee visible, y Colombia queda como el outlier con comisión
> explícita del 3%. **Se usó por primera vez un agregador independiente
> (Monito.com) para cruzar un hallazgo ya establecido**: Mukuru en
> Sudáfrica→Zimbabue dio ~9,66% de costo total en Monito, consistente con
> el 10,3%-10,7% ya documentado vía World Bank RPW — confirma el patrón
> desde una fuente completamente distinta. **Sobre Argentina, dos fuentes
> nuevas (Rankia, AskMonarca) refuerzan (sin confirmar al 100%) que la
> percepción del 30% aplica solo a tarjeta/compra de dólares, no a
> transferencias** — y se resolvió la discrepancia de fechas del
> Impuesto PAIS: Wikipedia, citando la base legal (plazo de 5 años desde
> la ley de dic-2019), confirma **23 de diciembre de 2024** como la fecha
> correcta — la fuente que decía 31 de octubre parece haber sido errónea.
>
> **Doceava actualización: Sección 25** — se profundizaron dos pendientes
> de la ronda anterior. **Xoom cross-validado vía Monito.com en EEUU→
> México**: Monito muestra -1,16% de margen (mejor que mid-market), en
> la misma dirección que el -0,24% ya visto en World Bank RPW —
> confirmación independiente de que Xoom es barato específicamente en
> este corredor hiper-competitivo, ampliando su rango documentado a
> -1,16%/2,35%. De paso, Monito aportó datos propios nuevos para
> **TransferGo** (0,15% peor que mid-market, Reino Unido→India) e
> **InstaReM** (0,66% peor, mismo corredor) — primeros números de
> TransferGo específicos de este archivo v11. **Sobre la excepción de
> Colombia en Global66**: una fuente independiente (blog de Wise)
> confirma que Global66 sí cobra una comisión plana específica para
> Colombia (~4% según esa fuente, cercano al ~3% medido en vivo la ronda
> pasada) — se confirma que es una política de precios real y
> documentada, no un artefacto de la medición, aunque la causa (¿costo
> operativo local? ¿decisión comercial?) sigue sin identificarse.
>
> **Treceava actualización: Sección 27** — se abrió **Canadá como país
> de origen por primera vez en el proyecto** (Canadá→Filipinas, vía
> Monito), con InstaReM reconfirmando margen bajo en un tercer corredor
> (0,34% peor que mid-market). Y se cross-validó **TransferGo en un
> segundo corredor (Polonia→Ucrania): 2,12% peor que mid-market**, muy
> por encima del 0,15% visto la ronda pasada en Reino Unido→India —
> **confirma que TransferGo sí es un caso de margen variable** (el dato
> bajo de la ronda anterior no era representativo), consistente con su
> catalogación histórica previa a este archivo v11.
>
> **Catorceava actualización: Sección 29** — se amplió Canadá con un
> segundo destino (**Canadá→India**) y se abrió **Australia como país de
> origen nuevo** (Australia→Filipinas), ambos vía Monito. **InstaReM
> reconfirmó margen bajo por 4ta y 5ta vez** (0,17% y 0,08%
> respectivamente) — con 5 corredores ahora, todos bajo 1%, es el caso
> más sólido del proyecto de proveedor de margen consistentemente bajo.
> También se reforzó el patrón, visto antes en EEUU→México y Canadá→
> Filipinas, de **margen negativo en corredores de altísimo volumen
> hacia Filipinas**: acá Remitly (-3,56%) y Western Union (-2,22%)
> muestran costo mejor que mid-market.
>
> **Quinceava actualización — CORRECCIÓN IMPORTANTE: Sección 31.** El
> usuario pidió investigar a fondo el patrón de "margen negativo" para
> que no contaminara los resultados. **Se encontró un problema real:
> varias de las tarjetas de proveedor en Monito.com muestran DOS montos
> distintos de "el destinatario recibe"** — uno más alto (el que Monito
> usa para calcular el "% mejor/peor que mid-market" que se venía
> citando) y uno más bajo. El patrón coincide con proveedores que tienen
> una insignia de "tasa preferencial en tu primera transferencia" — es
> decir, **el monto alto parece ser una tasa promocional de primera
> transferencia, y el monto bajo el monto real/recurrente.** Usando el
> monto bajo, **MoneyGram y Western Union en Canadá→Filipinas, Canadá→
> India y Australia→Filipinas pasan de "margen negativo/favorable" a
> costos reales de 3%-6%** — el "patrón de márgenes negativos en
> corredores de alto volumen" de las Secciones 27.1 y 29.2 **se revierte
> en gran parte para estos proveedores.** Dato importante: **Xoom en
> EEUU→México (Sección 25.1) NO tiene este problema** — su tarjeta en
> Monito no tiene insignia promocional y muestra un solo monto, así que
> ese cross-validation específico se mantiene válido. **InstaReM
> tampoco se ve muy afectado** — la brecha entre sus dos montos es chica
> en todos los corredores, así que su estatus de margen bajo sobrevive
> la corrección, aunque con cifras algo más altas que las citadas
> originalmente. Se establece una regla metodológica nueva para el resto
> del proyecto al usar Monito.
>
> **Nada de esto fue cargado a Supabase.** Solo research + análisis. Cero
> `apply_migration`, cero `execute_sql` de escritura, cero commits.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Sendwave verificado en vivo (EEUU→Nigeria): 1 USD = 1.373,02 NGN,
   fee cero.** Usando el benchmark de Wise (1.374,62, ver más abajo) en
   vez de XE, el margen da **~0,12%** — muy ajustado, más parecido a
   Wise que a lo que sugería una fuente de terceros usada en la ronda
   anterior (~1,5% para corredores hacia Kenia). Otro caso de proveedor
   "amplio" cuyo margen parece variar según la moneda de destino
   (Nigeria vs. Kenia), no solo según el corredor. Ver Sección 1.
2. **El "problema XE" de la ronda anterior (Sección 1 de v10) se
   confirma otra vez para NGN con un tercer proveedor independiente, pero
   NO se replica en otras monedas con historial cambiario complicado.**
   Se probó EGP (Egipto) y LBP (Líbano) — ambas mostraron diferencias
   chicas (<0,5%) entre XE y Wise, dentro de lo normal. **Conclusión
   revisada: el problema parece específico de NGN (posiblemente XE con
   un dato desactualizado para esa moneda puntual), no un patrón general
   de "monedas con mercados cambiarios múltiples"** como se había
   planteado como hipótesis la ronda pasada. Ver Sección 1.3.
3. **Corredores hacia India, cuadro completo:** se sumaron Arabia
   Saudita→India y Reino Unido→India (con datos de World Bank RPW),
   completando los 4 orígenes más grandes hacia el país que más remesas
   recibe del mundo (junto con EEUU→India y EAU→India de la ronda
   anterior). Aparece un dato cruzado útil: **Skrill Money Transfer tiene
   un segundo punto de datos real de World Bank (Reino Unido→India:
   0,49% margen)**, que se suma al ya conocido de Alemania→India (0,69%)
   — dos corredores reales, ambos bajo 1%, reforzando que el 0,69%-0,49%
   es un rango creíble para el producto correcto de Skrill. Ver
   Sección 2.
4. **Payroll internacional (Deel/Papaya Global/Remote): confirmado que
   es un patrón de categoría, no un caso aislado de Deel.** Papaya Global
   tampoco publica su propio margen FX — mismo patrón exacto que Deel
   (comparación contra "markups bancarios de hasta 5%", sin cifra
   propia). Remote.com no tiene ni siquiera una página dedicada a
   política de tipo de cambio indexada públicamente. **Conclusión: cerrar
   esta línea de investigación — las plataformas de payroll como
   categoría no publican margen FX propio**, no vale la pena seguir
   insistiendo proveedor por proveedor. Ver Sección 3.

**Segunda ronda del mismo día (Sección 5):**

5. **Sendwave verificado en vivo también hacia Kenia (KES): confirma que
   su margen SÍ varía por moneda de destino**, no es parejo como parecía
   con el solo dato de NGN. Margen regular ≈1,07%, margen promocional
   ≈0,57% — bastante más alto que el ~0,12% medido en Nigeria. Se suma
   como 5to caso del proyecto de proveedor "amplio" con margen variable
   (después de Xoom, TransferGo, SBI Remit, Taptap Send). Ver Sección 5.1.
6. **España→Bolivia: corredor real con datos, pero llamativamente caro
   en general** — promedio de todos los proveedores ~15,8% de costo
   total, con casos extremos como Europhil al 51,32%. Ria es la opción
   más barata encontrada (3,76%), pero incluso esa cifra es alta
   comparada con casi cualquier otro corredor visto en el proyecto hasta
   ahora. Ver Sección 5.2.
7. **Italia→Ecuador: corredor real con datos, Xoom vuelve a ser el más
   caro** (4,49% total, 2,35% de margen FX) — refuerza otra vez el
   patrón de Xoom como proveedor caro en corredores hacia Latinoamérica/
   Asia. Ver Sección 5.3.
8. **España→Argentina e Italia→Perú: confirmados vacíos en World Bank
   RPW** (mismo patrón ya visto en Rumania→Moldavia, Singapur→Vietnam,
   Japón→Perú) — se suman a la lista de corredores donde esta fuente
   simplemente no tiene datos. Ver Sección 5.2 y 5.3.
9. **Panda Remit evaluado:** no publica ninguna cifra propia de fee o
   margen (hay que loguearse para verla), pero un dato de tercero
   (comparación directa contra Wise en Singapur→Malasia) sugiere que
   puede ser competitivo — mejor tasa que Wise en ese ejemplo puntual, no
   verificado en vivo por esta sesión. Ver Sección 5.4.
10. **Aclaración de alcance: GCash/Coins.ph no son proveedores de FX
    independientes** — son billeteras de cobro (payout methods) que ya
    aparecen como método de entrega dentro de otros proveedores (por
    ejemplo WorldRemit, Taptap Send). No corresponde evaluarlos como
    candidatos separados con margen propio. Ver Sección 5.4.

**Tercera ronda del mismo día (Sección 7):**

11. **Panda Remit verificado en vivo (Singapur→China): otro caso de
    contaminación por tasa promocional**, esta vez confirmado por el
    propio sitio en texto explícito ("Exchange rates and transfer fees
    are only shown to new users"). La tasa mostrada (5,3104 CNY/SGD,
    fee 0 en vez de 10 SGD) da un margen ~-0,61% (mejor que mid-market),
    pero es una tasa de bienvenida, no la recurrente. Ver Sección 7.1.
12. **Tres corredores España/Italia→Latam nuevos con datos reales:**
    España→Perú (MoneyGram el más barato, 1,68%-1,78%), España→República
    Dominicana (Money Exchange el más barato, 1,64%), Italia→Brasil
    (Wise el más barato con margen 0%, pero **Unicredit Banca aparece
    con el costo total más alto medido en todo el proyecto: 32,42%**,
    superando incluso a BBVA en España→Bolivia). Ver Sección 7.2.
13. **Italia→Argentina confirmado vacío en RPW — mismo resultado que
    España→Argentina de la ronda anterior.** Con dos corredores distintos
    hacia Argentina (de dos países de origen distintos) ambos vacíos,
    la explicación más probable ya no es "mala suerte de corredor
    específico" sino que **World Bank RPW simplemente no tiene datos
    para Argentina como país de destino**, en ningún corredor. Ver
    Sección 7.3.

**Cuarta ronda del mismo día (Sección 9):**

14. **España→Ecuador: datos reales, y otra vez bancos tradicionales
    españoles carísimos** — BBVA 26,74% y La Caixa 28,00% de costo total.
    Con esto ya son 3 casos (BBVA en Bolivia, BBVA y La Caixa en Ecuador)
    de bancos tradicionales españoles con costos de 25%+ en corredores a
    Latam — empieza a verse como un patrón de la categoría, no un caso
    aislado. MoneyGram queda como la opción más barata (2,16%-2,25%). Ver
    Sección 9.1.
15. **España→Paraguay, Italia→México e Italia→Uruguay: los tres vacíos
    en RPW — pero corregido en vivo: eso NO significa que no se pueda
    enviar ahí.** Se verificó con Wise que los 4 corredores marcados como
    vacíos en este documento (estos 3 + Argentina) están todos activos,
    con tasas y fees reales — Paraguay y Argentina muestran "cargos
    dinámicos" explícitos en Wise, lo que probablemente explica por qué
    RPW no los releva mejor que "no hay volumen". **Regla para el resto
    del proyecto: un corredor vacío en RPW se investiga por otra vía
    (medición en vivo), nunca se da por cerrado solo por eso.** Ver
    Sección 9.2.

**Quinta ronda del mismo día (Sección 11):**

16. **Patrón "bancos españoles caros" confirmado con el propio tarifario
    de BBVA, no solo con más corredores de RPW.** BBVA cobra 0,70% de fee
    SWIFT con mínimo de 35€ + un margen cambiario que en un ejemplo
    documentado llegó a 4,65%. El mínimo de 35€ por sí solo ya explica
    los costos de 25%+ vistos en RPW para envíos chicos de 140-200€ —
    **no es una rareza de la muestra de RPW, es la consecuencia directa y
    esperable de un fee fijo alto sobre un monto chico.** Ver Sección
    11.1.
17. **Nueva región para el proyecto: Sudáfrica→Zimbabue.** Datos reales
    de RPW: WorldRemit (5,15%) y Sasai Money Transfer (5,41%) los más
    baratos, **Mukuru — fintech africana grande, candidato nuevo — resultó
    caro en este corredor puntual (10,28%-10,68%)**, y los bancos
    tradicionales sudafricanos (ABSA, Standard Bank, Nedbank) de nuevo
    carísimos (22%-34%) — mismo patrón de bancos tradicionales visto ya
    varias veces en España/Italia, ahora confirmado también en África.
    Promedio del corredor: 12,49%, otro corredor de costo alto en
    general. Ver Sección 11.2.
18. **Nueva región para el proyecto: Singapur→Indonesia (intra-Asia).**
    InstaReM vuelve a aparecer con margen muy ajustado (**-0,06%**,
    mejor que mid-market), coherente con el dato ya conocido de UK→India
    (~0,31%) — **refuerza que InstaReM es un proveedor consistentemente
    de margen bajo, no uno de los casos "variables" como Xoom/TransferGo**.
    Wise 0,92% (margen 0%), DBS Remit (banco) 1,43%, Western Union
    2,55%-2,62%. Ver Sección 11.3.
19. **España→México, aplicando la corrección de la ronda anterior:**
    salió vacío en RPW, pero se verificó de inmediato en vivo con Wise
    que el corredor está operable (1 EUR = 19,7031 MXN, fee 7,52 EUR) —
    ejemplo directo de la regla nueva en acción. Ver Sección 11.1.

**Sexta ronda del mismo día (Sección 13):**

20. **Mukuru — hallazgo grande: 6to caso confirmado de proveedor "amplio"
    con margen que varía muchísimo por corredor, y el vuelco más extremo
    visto hasta ahora.** En Zimbabue (ronda anterior) era el más caro de
    los no-bancarios (10,3%-10,7%); en Mozambique (esta ronda) domina el
    corredor con **margen negativo (-5,08% a -4,58%)** y es la opción más
    barata (4,01%) — ambos corredores desde el mismo país de origen
    (Sudáfrica). Ningún otro proveedor del proyecto mostró un cambio de
    signo así (de "el más caro" a "margen negativo") entre dos corredores
    tan cercanos geográficamente. Ver Sección 13.1.
21. **Qatar→Nepal: corredor nuevo de Medio Oriente**, con casas de cambio
    regionales no vistas antes en el proyecto (City Exchange Company,
    Eastern Exchange, Arabian Exchange Company, Al Dar Exchange), todas
    agrupadas entre 3,14% y 3,66% — Western Union más cara pero sin la
    brecha extrema vista en otros corredores del Golfo (6,55% vs. 3,14%,
    ~2x en vez de 5-10x). Ver Sección 13.2.
22. **Brasil→Portugal: vacío en RPW, pero operable en Wise — y con un
    hallazgo metodológico nuevo: Brasil cobra impuestos (IOF) sobre
    operaciones cambiarias**, visibles en el propio widget de Wise como
    "Total fees and taxes" y una "Effective rate" ~4,24% peor que la tasa
    comercial mostrada. Es un componente de costo país-específico,
    distinto del margen del proveedor — relevante si mangomundi carga
    corredores con origen en Brasil. Ver Sección 13.3.

**Séptima ronda del mismo día (Sección 15):**

23. **India tiene un impuesto real sobre remesas (TCS), pero con un
    umbral que lo hace irrelevante para los montos chicos del proyecto.**
    El TCS (Tax Collected at Source) bajo el esquema LRS aplica desde
    10 lakh INR/año (~USD 12.000) — muy por encima de los 140-500 USD que
    usa RPW para medir. **Conclusión: los datos de India ya cargados en
    el proyecto no están contaminados por este impuesto**, pero vale la
    pena tenerlo en cuenta si en algún momento se modelan transferencias
    grandes o recurrentes que puedan acumular ese umbral anual. Ver
    Sección 15.1.
24. **Argentina: el "Impuesto PAIS" fue eliminado en diciembre de 2024,
    pero sigue vigente una percepción del 30%** sobre compra de dólar
    ahorro, tarjeta en el exterior y turismo — **sin confirmación de que
    aplique a remesas/transferencias de dinero enviadas**, que es el caso
    de uso de mangomundi. Queda marcado como pendiente de verificar con
    más precisión si hace falta, en vez de asumir que aplica. Ver
    Sección 15.1.
25. **Kuwait→Filipinas: corredor nuevo, con Western Union como la opción
    más barata** (2,21%) — caso inusual, ya que en casi todos los demás
    corredores del proyecto Western Union queda entre las opciones caras.
    Aparecen también varias casas de cambio regionales nuevas (Aman
    Exchange, Al Mulla Exchange, Bahrain Exchange Company, Al Muzaini
    Exchange) y Lulu Money, ya mencionado en rondas mucho más viejas del
    proyecto como candidato del Golfo sin verificar. Ver Sección 15.2.

**Octava ronda del mismo día (Sección 17):**

26. **Argentina: se encontró un impuesto más universal que la
    percepción del 30% — el Impuesto al Débito y Crédito ("impuesto al
    cheque"), 1,2% total (0,6% + 0,6%), que aplica en términos generales
    a todo movimiento de cuentas bancarias argentinas.** A diferencia de
    la percepción del 30% (que sigue sin confirmación de que aplique a
    remesas específicamente), este impuesto es mucho más probable que sí
    toque una transferencia, por su alcance amplio ("todo débito y
    crédito"). Es parcialmente recuperable (33% Ganancias, 17% IVA). Los
    demás impuestos argentinos relevados (IVA importación de servicios
    21%, Retención de Ganancias 24,5-31,5%) parecen de contexto
    empresarial/servicios, no remesas personales. También se reconcilió
    la fecha de derogación del Impuesto PAIS: una fuente adicional dice
    **31-oct-2024**, no 23-dic-2024 como se había escrito en la Sección
    15.1 — discrepancia menor entre fuentes, sin impacto en la
    conclusión de que ya no está vigente. Ver Sección 17.1.
27. **Lulu Money confirmado como 7mo caso de margen variable por
    corredor: Kuwait→India da 0,87%-1,96% de costo total (margen FX
    0,27%-0,58%), muy por debajo del 2,89% visto en Kuwait→Filipinas.**
    Se suma a Xoom, TransferGo, SBI Remit, Taptap Send, Sendwave y
    Mukuru en la lista de proveedores "amplios" sin margen estable. Ver
    Sección 17.2.

**Novena ronda del mismo día (Sección 19):**

28. **Global66, pendiente desde hace muchísimas rondas, por fin
    verificado en vivo — y resultó tener margen bajo y consistente, no
    variable.** Chile→España (CLP→EUR): margen ~0,05%. Chile→EEUU
    (CLP→USD): margen ~-0,14% (mejor que el mercado). **Se cierra este
    pendiente histórico** y Global66 se suma a InstaReM como segundo
    caso confirmado de proveedor "amplio" con margen ajustado y estable
    entre corredores. Ver Sección 19.1.
29. **EEUU→México, el corredor de remesas más grande del mundo, abierto
    por primera vez en el proyecto — con un patrón nuevo: costo total
    NEGATIVO en algunas opciones de Walmart2World y Xoom** (mejor que la
    tasa de referencia usada por World Bank), algo no visto en ningún
    otro corredor del proyecto hasta ahora, probablemente reflejo de lo
    extremadamente competitivo que es este corredor específico. Xoom
    también refuerza acá su estatus de proveedor de margen muy variable
    (de -0,24% en este corredor a 1,41%-2,35% en otros ya documentados).
    Ver Sección 19.2.
30. **Tabla de referencia consolidada de los 7 casos de margen variable
    por corredor** (Xoom, TransferGo, SBI Remit, Taptap Send, Sendwave,
    Mukuru, Lulu Money), armada para facilitar el consumo de este patrón
    desde Supabase. Ver Sección 19.3.

**Décima ronda del mismo día (Sección 21):**

31. **Walmart2World: no se encontró un mecanismo explícito que explique
    el costo negativo visto en la Sección 19.2** — Walmart solo comunica
    el ahorro acumulado de clientes ("~USD 1.000 millones desde 2014")
    sin detallar economics internos (¿subsidio cruzado con tráfico de
    tiendas? ¿reparto de comisión con Ria?). Queda como hipótesis
    razonable pero no confirmada. Ver Sección 21.1.
32. **Global66 desde Colombia (Colombia→España): resultado distinto al
    de Chile, matiza la conclusión de la Sección 19.1.** Acá aparece una
    comisión explícita del 3% plana, combinada con un tipo de cambio
    levemente favorable (-1,17% vs. mid-market), dando un costo total de
    ~1,8% — mucho más alto que el ~0,05%/-0,14% visto desde Chile.
    **Conclusión revisada: Global66 no necesariamente tiene el mismo
    margen bajo en todos sus países de origen** — probar un segundo país
    reveló que el patrón "margen bajo y consistente" de la ronda anterior
    era prematuro. Ver Sección 21.2.

**Onceava ronda del mismo día (Sección 23):**

33. **Global66 desde un tercer origen (Perú→España): mismo patrón que
    Chile** (sin fee explícito, margen ~-0,30%, favorable al cliente).
    Con esto, 2 de 3 orígenes probados muestran margen bajo sin fee
    visible — Colombia queda como el outlier con comisión explícita del
    3%, no la regla. Ver Sección 23.1.
34. **Primer uso de una fuente alternativa independiente (Monito.com)
    para cruzar un hallazgo ya establecido: Mukuru en Sudáfrica→
    Zimbabue.** Monito midió ~9,66% de costo total (fee 150 ZAR + tipo
    de cambio 4,07% peor que mid-market), consistente con el 10,3%-10,7%
    ya documentado vía World Bank RPW — confirma el patrón de "Mukuru
    caro en este corredor" desde una fuente completamente distinta. Ver
    Sección 23.2.
35. **Argentina: dos fuentes nuevas (Rankia, AskMonarca) refuerzan que la
    percepción del 30% parece limitada a tarjeta/compra de dólares, no a
    transferencias** — sin llegar a una confirmación explícita al 100%,
    pero con más fuentes apuntando en la misma dirección. **Se resolvió
    la discrepancia de fechas del Impuesto PAIS**: Wikipedia, citando la
    base legal (plazo de 5 años desde la ley de diciembre de 2019),
    confirma que la fecha correcta es **23 de diciembre de 2024** — la
    fuente que decía 31 de octubre (usada en la Sección 17.1) parece
    haber sido errónea. Ver Sección 23.3.

**Doceava ronda del mismo día (Sección 25):**

36. **Xoom cross-validado vía Monito.com en EEUU→México: -1,16% de
    margen, en la misma dirección que el -0,24% ya visto en World Bank
    RPW.** Confirma desde una segunda fuente que Xoom es barato
    específicamente en este corredor — su rango documentado en el
    proyecto se amplía a -1,16%/2,35%, reforzando su estatus de
    proveedor más variable del archivo v11. Ver Sección 25.1.
37. **Monito también aportó los primeros datos propios de este archivo
    v11 para TransferGo (0,15% peor que mid-market) e InstaReM (0,66%
    peor), ambos en Reino Unido→India.** Ver Sección 25.1.
38. **La excepción de Colombia en Global66 (comisión del 3%-4%) queda
    confirmada como una política de precios real y documentada** —una
    fuente independiente (blog de Wise) reporta ~4% para Colombia,
    cercano al ~3% medido en vivo— aunque la causa específica (costo
    operativo local vs. decisión comercial) sigue sin identificarse. Ver
    Sección 25.2.

**Treceava ronda del mismo día (Sección 27):**

39. **Canadá, país de origen nuevo para el proyecto (Canadá→Filipinas,
    vía Monito).** MoneyGram lidera con margen favorable (-1,67%);
    InstaReM reconfirma margen bajo en un tercer corredor (0,34% peor
    que mid-market), reforzando su estatus de proveedor consistente. Ver
    Sección 27.1.
40. **TransferGo cross-validado en un segundo corredor (Polonia→
    Ucrania): 2,12% peor que mid-market, muy por encima del 0,15% de
    Reino Unido→India (ronda anterior).** Confirma que TransferGo sí es
    un caso genuino de margen variable — el dato bajo de la ronda pasada
    no era representativo. Ver Sección 27.2.

**Catorceava ronda del mismo día (Sección 29):**

41. **Canadá→India: segundo destino desde Canadá. InstaReM reconfirma
    margen bajo por 4ta vez** (0,17% peor que mid-market). Ver
    Sección 29.1.
42. **Australia, país de origen nuevo para el proyecto (Australia→
    Filipinas). InstaReM reconfirma margen bajo por 5ta vez** (0,08%
    peor que mid-market) — con 5 corredores, todos bajo 1%, queda como
    el caso más sólido del proyecto de margen consistentemente bajo. Se
    refuerza además el patrón de margen negativo en corredores de gran
    volumen hacia Filipinas: Remitly (-3,56%) y Western Union (-2,22%)
    acá, sumándose a lo ya visto en Canadá→Filipinas y EEUU→México. Ver
    Sección 29.2.

**Quinceava ronda del mismo día — CORRECCIÓN (Sección 31):**

43. **Descubierto un problema metodológico real en el uso de Monito.com:
    varias tarjetas de proveedor muestran dos montos distintos de
    "el destinatario recibe" — uno alto (usado para el % citado hasta
    ahora) y uno bajo, que coincide con proveedores que anuncian "tasa
    preferencial en tu primera transferencia".** El monto alto parece
    ser la tasa promocional; el bajo, la tasa real/recurrente. Ver
    Sección 31.1.
44. **Usando el monto bajo (real), MoneyGram y Western Union en Canadá→
    Filipinas, Canadá→India y Australia→Filipinas pasan de "margen
    negativo" a costos reales de 3%-6%** — se revierte gran parte del
    "patrón de márgenes negativos en corredores de alto volumen" de las
    Secciones 27.1 y 29.2. Ver Sección 31.2.
45. **Xoom en EEUU→México (Sección 25.1) se confirma limpio de este
    problema** — su tarjeta no tiene insignia promocional y muestra un
    solo monto, así que el cross-validation de esa ronda se mantiene
    válido. **InstaReM también sobrevive la corrección** (brecha chica
    entre sus dos montos en todos los corredores). Ver Sección 31.3.
46. **Nueva regla metodológica para el resto del proyecto**: al usar
    Monito.com, siempre revisar si hay dos montos de "recipient gets"
    por proveedor — si los hay, usar el más bajo como la cifra
    representativa, no el que Monito usa para su badge de "%
    mejor/peor que mid-market". Ver Sección 31.4.

---

## 1. Sendwave — verificado en vivo, y el caso NGN se acota (no es un patrón general)

### 1.1 Medición en vivo

Navegado a `sendwave.com/en-us/countries/nigeria` (la página específica
de país, no el widget de la portada, que resultó no ser interactivo —
mismo tipo de limitación ya vista antes con TransferGo). Corredor
EEUU→Nigeria:

- **1 USD = 1.373,023 NGN, transfer fee: 0,00 USD.**

### 1.2 Referencia de mid-market: XE vs. Wise (mismo patrón que la ronda anterior)

| Fuente | 1 USD = ? NGN |
|---|---|
| XE.com (2-sep-2026, 10:20 UTC) | 1.332,0332 |
| Wise (conversor propio) | 1.374,62 |
| **Sendwave (cotización en vivo)** | **1.373,023** |

Otra vez XE queda claramente por debajo (~3,2%) de Wise y del proveedor
medido en vivo, que coinciden casi exactamente entre sí. Con esto ya son
**3 fuentes independientes** (LemFi, Taptap Send de la ronda anterior, y
ahora Sendwave) que dan una cifra de NGN muy cercana a la de Wise y muy
alejada de la de XE — el patrón está sólidamente confirmado para esta
moneda específica.

Usando Wise como referencia ajustada: margen de Sendwave ≈ **+0,12%**
(prácticamente neutro, coherente con "fee cero"). Esto es notablemente
más ajustado que la cifra de ~1,5% que había reportado una fuente de
terceros (paybillke.com) para corredores de Sendwave hacia Kenia en la
ronda anterior — **sugiere que, igual que TransferGo/Xoom/SBI Remit,
Sendwave también podría tener un margen que varía según la moneda de
destino** (NGN muy ajustado, KES más caro), aunque esto último no está
verificado en vivo todavía, solo es una hipótesis a partir de cruzar el
dato de tercero de la ronda pasada con la medición en vivo de esta
ronda.

### 1.3 El "problema XE" NO se repite en EGP ni en LBP — hipótesis revisada

La ronda anterior se planteó como hipótesis que el problema de XE con
NGN podría deberse a un patrón más general en monedas con historial de
mercados cambiarios fragmentados o control de capitales. Se probó esta
ronda comparando XE vs. Wise (sin necesidad de un proveedor de remesas
en vivo, alcanza con ver si las dos referencias "sin margen" coinciden)
para dos monedas con historial conocido de brechas cambiarias:

| Moneda | XE (mid-market) | Wise (mid-market) | Diferencia |
|---|---|---|---|
| EGP (Egipto) | 1 USD = 51,3183 | 1 USD = 51,0400 | ~0,54% |
| LBP (Líbano) | 1 USD = 89.770,14 | 1 USD = 89.550,00 | ~0,25% |
| **NGN (Nigeria, referencia)** | 1 USD = 1.332,03 | 1 USD = 1.374,62 | **~3,2%** |

Tanto en EGP como en LBP la diferencia entre XE y Wise es chica (menos
de 0,6%) — dentro del ruido normal esperable entre dos fuentes de
mid-market distintas, nada parecido al ~3-4% visto en NGN (tanto para
USD/NGN como para GBP/NGN en la ronda anterior).

**Conclusión revisada:** el problema no parece ser un patrón general de
"monedas con historial de múltiples mercados cambiarios" (Egipto y
Líbano tuvieron ambos brechas oficial/paralelo grandes en el pasado
reciente, y ninguna de las dos muestra el problema hoy). Es más
específico — probablemente XE tiene, puntualmente para NGN, un dato
desactualizado o una fuente distinta a la que usa para otras monedas.
**Recomendación para mangomundi:** no generalizar el ajuste "usar Wise en
vez de XE" a todas las monedas con historial cambiario complicado —
alcanza con tenerlo presente específicamente para NGN, y cruzar contra
Wise puntualmente si en el futuro aparece alguna otra moneda con una
brecha XE-vs-proveedores-en-vivo así de grande.

---

## 2. India — cuadro completo de los 4 orígenes más grandes

Sumando a los dos corredores de la ronda anterior (EEUU→India, EAU→
India), esta ronda se completaron los otros dos orígenes gigantes hacia
India.

### 2.1 Arabia Saudita→India (World Bank RPW, envío de 750 SAR / 200 USD)

| Proveedor | Tipo | Costo total | Margen FX |
|---|---|---|---|
| STC Pay | Money Transfer Operator | 3,14% | 0,84% |
| Fawri | Money Transfer Operator | 3,51% | 1,38% |
| MoneyGram | Money Transfer Operator | 3,57% | 1,27% |
| TeleMoney | Money Transfer Operator | 4,00% | 1,39% |
| Western Union | Money Transfer Operator | 4,14% | 1,53% |
| Al-Rajhi Bank | Banco | 11,42% | 1,42% |
| Bank Albilad | Banco | 11,49% | 1,49% |
| Saudi British Bank | Banco | 11,77% | 1,77% |

Para el envío más grande (1.870 SAR / 500 USD) los costos totales bajan
proporcionalmente (STC Pay ~1,76%, Saudi British Bank ~5,78%) pero el
orden entre proveedores se mantiene igual. Llamativo: los bancos
tradicionales sauditas son **muchísimo más caros** que los money transfer
operators en este corredor (11%+ de costo total contra 3-4%) — la brecha
banco-vs-fintech más grande vista hasta ahora en el proyecto entre estas
dos categorías en un mismo corredor.

### 2.2 Reino Unido→India (World Bank RPW, envío de 120 GBP / 200 USD)

| Proveedor | Costo total | Margen FX |
|---|---|---|
| State Bank of India (banco) | 0,15% | 0,15% |
| **Skrill** | **0,49%** | **0,49%** |
| Western Union (internet) | 0,98% | 0,15% |
| Wise (cuenta bancaria) | 1,09% | 0,00% |
| Paysend | 1,20% | 0,37% |
| ICICI Bank | 1,21%-1,24% | 0,38%-0,41% |
| MoneyGram (cash pickup) | 1,91% | 0,25% |
| Remitly (cash pickup) | 2,11% | 0,45% |
| WorldRemit | 2,29% | 0,63% |
| Xoom | 3,07% | 1,41% |

Dos cosas para destacar acá:

- **State Bank of India (el banco estatal indio, distinto de "SBI
  Remit" ya documentado para corredores desde Japón) es el más barato de
  todo el corredor** (0,15%) — caso raro donde un banco tradicional le
  gana a todos los fintechs, probablemente porque SBI puede operar el
  corredor de forma directa sin intermediarios al ser el banco más grande
  de India.
- **Skrill aparece con un segundo dato real de World Bank: 0,49% de
  margen.** Esto se suma al dato ya conocido de Alemania→India (0,69%,
  documentado en addendums anteriores). Con dos corredores reales, ambos
  bajo 1% (0,49% y 0,69%), el rango 0,5%-0,7% queda como una estimación
  bastante más sólida para el producto de Skrill Money Transfer que un
  solo punto de datos — sigue sin encontrarse un tercer número público,
  pero esta segunda medición reduce bastante la incertidumbre.
- **Xoom vuelve a ser el más caro del corredor** (3,07% total, 1,41% de
  margen) — coherente con el patrón ya establecido de que Xoom es de los
  proveedores más caros en varios corredores hacia India/Asia, reforzando
  la necesidad de verified_status por corredor específico para este
  proveedor.

---

## 3. Payroll internacional — confirmado que es un patrón de categoría completa

La ronda anterior se había encontrado que Deel no publica su propio
margen FX, solo se compara favorablemente contra "bancos retail". Esta
ronda se repitió el ejercicio con Papaya Global y Remote.com para ver si
era un caso aislado o un patrón de toda la categoría.

- **Papaya Global**: su página oficial de política de pagos
  (`papayaglobal.com/payroll-payments-guide`) tampoco da ningún número de
  margen propio. Usa exactamente el mismo tipo de comparación que Deel:
  *"banks making foreign exchange markups of up to 5% and sometimes even
  higher"* — crítica a los bancos, cero cifra propia. Dice que usa "tasas
  wholesale de sus bancos partners" sin especificar el margen que aplica
  arriba de eso.
- **Remote.com**: no se encontró ni siquiera una página dedicada
  públicamente a política de tipo de cambio — solo páginas de pricing
  general de planes de EOR/contractor, sin mención de FX markup en
  ninguna de las fuentes revisadas.

**Conclusión:** con Deel (ronda anterior) + Papaya Global + Remote.com
(esta ronda), el patrón está confirmado para las 3 plataformas de payroll
internacional más grandes: **ninguna publica su margen FX propio**, todas
usan la misma estrategia retórica de compararse contra bancos
tradicionales en vez de dar una cifra propia. Esta línea de investigación
se puede dar por cerrada para mangomundi — no es una cuestión de seguir
buscando más fuentes, es que la categoría entera no expone el dato. Si en
algún momento se necesita un número para cargar estos proveedores,
probablemente haga falta una medición en vivo con cuenta real (fuera del
alcance de esta sesión) o asumir que replican el margen del proveedor de
FX de fondo que usan (no identificado públicamente para ninguno de los
tres).

---

## 5. Segunda ronda del mismo día — Sendwave en Kenia, corredores España/Italia→Latam, Panda Remit

### 5.1 Sendwave en Kenia — confirma que el margen SÍ varía por moneda de destino

Navegado a `sendwave.com/en-us/countries/kenya` (misma metodología que
con Nigeria: página de país específica, no el widget de portada).
Corredor EEUU→Kenia:

- **Tasa regular: 1 USD = 128,010 KES.**
- **Tasa promocional (primera transferencia): 1 USD = 128,657 KES.**
- Fee: 0,49 USD.

Referencia de mid-market — acá XE y Wise coinciden bien (a diferencia de
NGN, confirma otra vez la Sección 1.3):

| Fuente | 1 USD = ? KES |
|---|---|
| XE.com | 129,3746 |
| Wise (conversor propio) | 129,400 |

Con Wise como referencia (129,400):

- **Margen regular ≈ 1,07%.**
- **Margen promocional ≈ 0,57%.**

Comparado con el margen medido en Nigeria la ronda anterior (~0,12%),
esto confirma la hipótesis que había quedado abierta: **Sendwave no
tiene un margen parejo entre monedas de destino** — en Kenia cobra entre
5x y 9x más margen que en Nigeria (según se compare la tasa regular o la
promocional). Se suma como **5to caso confirmado del proyecto** de
proveedor "amplio" con margen variable, junto a Xoom, TransferGo, SBI
Remit y Taptap Send — con la particularidad de que acá la variable
parece ser la moneda/mercado de destino específico, no solo el país de
origen del envío (como se había visto con Taptap Send) ni el corredor
completo (como con Xoom/SBI Remit).

### 5.2 España→Bolivia — corredor real, pero caro en general

World Bank RPW, España→Bolivia:

| Proveedor | Costo total |
|---|---|
| Ria (tarjeta débito/crédito) | 3,76% |
| Remitly (tarjeta débito/crédito) | 8,18% |
| Exact Change (transferencia bancaria) | 9,53% |
| Western Union | 17,14% |
| MoneyGram | 18,66% |
| BBVA | 25,98% |
| Europhil | 51,32% |

Promedio de todos los proveedores listados: **~15,8%** — con fees
promedio de 6,29% y márgenes FX promedio de 11,31%. Este es, por lejos,
el corredor más caro que se documentó en todo el proyecto hasta ahora —
incluso la opción "barata" (Ria, 3,76%) es cara comparada con casi
cualquier otro corredor visto (la mayoría de los corredores del proyecto
tienen su opción más barata por debajo de 1-2%). Vale la pena marcarlo
como corredor de alto costo estructural si mangomundi lo carga, no como
un caso raro de un proveedor puntual.

**España→Argentina, en cambio, se confirmó vacío en RPW** — mismo
placeholder de siempre ("First Quarter 1970", todos los campos en 0) —
se suma a la lista ya conocida de corredores sin datos (Rumania→
Moldavia, Singapur→Vietnam, Japón→Perú).

### 5.3 Italia→Ecuador — Xoom otra vez el más caro

World Bank RPW, Italia→Ecuador (envío de €140, período 8 ago-8 sep 2025):

| Proveedor | Costo total | Notas |
|---|---|---|
| Poste Italiane (vía Western Union) | ~1,58% | correo, tarjeta débito |
| Remitly | ~2,64% | internet, menos de 1 hora |
| Western Union | ~2,99%-3,12% | internet |
| Xoom | **4,49%** | margen FX 2,35%, el más alto |

Bancos tradicionales (Banca Intesa Sanpaolo, Unicredit) cobran fees
altísimos (24-27,5%) pero con mejor tasa de cambio — quedan como los más
caros en total igual, patrón ya visto varias veces en el proyecto (bancos
tradicionales = fees altos que no compensa un mejor tipo de cambio).

**Xoom vuelve a quedar como el proveedor más caro del corredor** —
tercera vez en pocas rondas que aparece en ese lugar (después de UK→India
en la Sección 2.2 de este mismo documento, y varios corredores de
addendums anteriores) — sigue reforzando que Xoom necesita
`verified_status` por corredor específico, nunca un número único.

**Italia→Perú se confirmó vacío en RPW** — mismo patrón que España→
Argentina de esta ronda.

### 5.4 Panda Remit y aclaración sobre GCash/Coins.ph

**Panda Remit** (fintech de remesas hacia China/Asia, con sede en
Singapur): no publica ninguna cifra de fee o margen en sus páginas
públicas — el propio review usado como fuente señala que *"to see the
exact rates and fees involved with your transfer, you'll need to
register an account and log in"*. El único dato disponible es una
comparación de un tercero (blog de Wise) para Singapur→Malasia: Panda
Remit mostró 1 SGD = 3,0834 MYR contra 1 SGD = 3,0744 MYR de Wise — es
decir, **Panda Remit dio una tasa ~0,29% mejor que Wise** en ese ejemplo
puntual. No es una medición en vivo de esta sesión, así que queda como
dato de tercero sin confirmar, pero sugiere que podría ser un candidato
competitivo si se quiere profundizar en remesas hacia China en una
próxima ronda.

**GCash y Coins.ph** (billeteras móviles filipinas): se evaluó incluirlas
como candidatos nuevos, pero **no corresponde tratarlas como proveedores
de FX independientes** — son billeteras de cobro (payout method) que
varios proveedores ya cubiertos ofrecen como opción de entrega (WorldRemit
y Taptap Send, por ejemplo, permiten depositar directo a GCash). El
margen cambiario en esos casos lo fija el proveedor que envía, no la
billetera que recibe — GCash/Coins.ph no cobran su propio spread de FX
en una remesa entrante. Se cierra esta línea sin necesidad de seguir
buscando "el margen de GCash", porque conceptualmente no existe tal cosa
por fuera del proveedor de envío.

---

## 7. Tercera ronda del mismo día — Panda Remit en vivo, más corredores España/Italia→Latam, el vacío de Argentina explicado

### 7.1 Panda Remit — verificado en vivo, pero es tasa promocional (confirmado por el propio sitio)

Se probó primero el widget de conversor dedicado
(`pandaremit.com/en/sgp/china/sgd-cny-converter`), que resultó estar roto
— mostraba "0.00000" en todos los pares de moneda, mismo tipo de bug ya
visto antes con Global66 y con el calculador de portada de TransferGo.
Se encontró en cambio que el widget de la página de corredor específico
(`pandaremit.com/en/sgp/send-money-to-china`) sí funciona:

- **2.000 SGD → 10.570,8 CNY. Tasa: 1 SGD = 5,3104 CNY. Fee: 0,00 SGD**
  (tachado de 10 SGD).
- El propio sitio muestra, en texto visible debajo de la calculadora:
  **"Limited time offer: New user exclusive rates"** y, más chico:
  *"Exchange rates and transfer fees are only shown to new users. Please
  find accurate details in the actual order."*

Es decir, **el sitio mismo declara explícitamente que la tasa mostrada es
promocional/de bienvenida**, no la recurrente — a diferencia de la
mayoría de los casos anteriores del proyecto donde esto había que
inferirlo (banners de "primera transferencia", comparación de dos tasas
lado a lado, etc.), acá Panda Remit lo dice con todas las letras.

Con mid-market de XE (1 SGD = 5,27816 CNY): margen de la tasa promocional
≈ **-0,61%** (mejor que mid-market, ~7 SGD de fee ahorrado también). Es
un dato coherente con el hallazgo de la ronda anterior (comparación de
tercero contra Wise en SGD→MYR, donde Panda Remit también aparecía mejor)
— pero **ambos datos podrían estar contaminados por el mismo mecanismo
promocional**, así que no se puede todavía afirmar que Panda Remit sea
"barato" en su tasa recurrente. Queda en la misma categoría que Remitly/
WorldRemit/MoneyGram Rumania-Moldavia: **tasa regular no obtenible sin
cuenta real**, así que se cierra este pendiente con esa limitación
documentada, no con un número confiable para cargar.

### 7.2 Tres corredores España/Italia→Latam nuevos, todos con datos reales

**España→Perú** (World Bank RPW, Q3 2025):

| Proveedor | Costo total |
|---|---|
| MoneyGram (cash pickup, <1h) | 1,68%-1,78% |
| Remitly | 3,09% |
| Money Exchange | 3,10%-3,42% |
| WorldRemit | 3,38% |
| Western Union | 4,51% |
| Ria | 5,02% |
| Exact Change | 9,53% |

Promedio del corredor: ~3,63%. Un corredor "normal" para los estándares
del proyecto, sin outliers extremos.

**España→República Dominicana** (envío de 140 EUR / 200 USD):

| Proveedor | Costo total |
|---|---|
| Money Exchange (efectivo, agente, next-day) | 1,64% |
| MoneyGram | 1,64%-5,09% |
| Ria | 4,64% |
| Western Union | 4,64% |
| Remitly | 5,91% |
| WorldRemit | 6,49% |
| Exact Change | 9,53% |

**Italia→Brasil** (envío de €140, Q3 2025):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| National Exchange Company (efectivo) | 0,85% | **-1,29%** |
| Poste Italiane / Western Union (débito) | 1,55% | 1,26% |
| Wise (cuenta bancaria) | 1,69% | 0,00% |
| MoneyGram | 1,69%-2,11% | 1,40% |
| **Unicredit Banca** (transferencia bancaria) | **32,42%** | 4,92% |

Dos cosas para destacar en Italia→Brasil: **National Exchange Company**
tiene margen FX negativo (-1,29%, mejor que mid-market) y aun así termina
como la opción más barata en total gracias a un fee bajo — un patrón
poco común (normalmente el margen negativo viene de una promoción con
fee también reducido, acá conviven margen negativo con fee explícito). Y
**Unicredit Banca, con 32,42% de costo total, es el proveedor más caro
medido en todo el proyecto hasta ahora** — supera incluso a BBVA en
España→Bolivia (25,98%, ronda anterior) y a los bancos sauditas en
Arabia Saudita→India (~11%). Confirma otra vez el patrón de que
transferencias bancarias tradicionales para montos chicos (€140) pueden
ser brutalmente caras por el fee fijo, más que por el margen cambiario.

### 7.3 Italia→Argentina vacío en RPW — pero eso no significa que no se pueda enviar ahí (ver corrección en Sección 9.2)

Se confirmó que Italia→Argentina también está vacío en World Bank RPW
(mismo placeholder "First Quarter 1970", todos los campos en cero).
Sumado a España→Argentina (ronda anterior, también vacío), **ya son 2
corredores hacia Argentina, desde 2 países de origen distintos, sin datos
en esta fuente puntual**. Es plausible que World Bank RPW directamente no
releve Argentina como país de destino en su metodología estándar, quizás
por la volatilidad cambiaria del peso o por la existencia de múltiples
tipos de cambio (oficial/CCL/MEP/blue) que complica definir "la" tasa de
referencia — pero **esto es una limitación de RPW específicamente, no
evidencia de que no se pueda enviar dinero a Argentina** (obviamente se
puede — es uno de los corredores centrales de mangomundi). La
recomendación correcta, corregida más abajo en la Sección 9.2 con datos
en vivo de Wise: cuando RPW no tiene un corredor, investigar por otra
vía (medición en vivo de un proveedor conocido) antes de asumir que no
hay datos disponibles de ninguna fuente — no dar por cerrado el corredor
solo porque esta fuente puntual no lo cubre.

---

## 9. Cuarta ronda del mismo día — cierre del mapeo España/Italia→Latam

### 9.1 España→Ecuador — datos reales, y se confirma un patrón de bancos españoles caros

World Bank RPW, España→Ecuador (envío de 140 EUR / 200 USD):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| MoneyGram | 2,16%-2,25% | 0,74%-0,83% |
| Money Exchange | 2,70% | 1,27% |
| Ria | 3,31% | 1,17% |
| Remitly | 4,12% | 2,70% |
| Western Union | 4,51% | 0,95% |
| Europhil | 5,04% | 1,11% |
| Exact Change | 9,53% | 3,10% |
| **BBVA** | **26,74%** | 1,74% |
| **La Caixa** | **28,00%** | 1,57% |

Con este dato, **BBVA aparece caro por segunda vez en el proyecto**
(España→Bolivia, ronda anterior: 25,98%; España→Ecuador, esta ronda:
26,74% — números muy parecidos entre sí, lo que sugiere que no es una
particularidad del corredor sino del fee fijo que BBVA cobra para
transferencias internacionales en general). **La Caixa se suma como
tercer banco tradicional español con costo por encima de 25%.** Esto ya
empieza a ser un patrón identificable: **los bancos tradicionales
españoles (BBVA, La Caixa) tienen un costo estructuralmente muy alto
para remesas a Latam**, casi con independencia del país de destino
específico — útil para mangomundi si en algún momento se plantea cargar
estos bancos como "opción cara conocida" con un rango aproximado (25%-28%)
en vez de necesitar medir cada corredor individualmente.

### 9.2 España→Paraguay, Italia→México, Italia→Uruguay — vacíos en RPW, pero **corrección importante: eso no significa que no se pueda enviar ahí**

Los tres corredores probados esta ronda salieron con el mismo
placeholder vacío de siempre en World Bank RPW ("First Quarter 1970",
todos los campos en cero).

**Corrección hecha en vivo por el usuario, muy importante para no repetir
el error:** que World Bank RPW no tenga un corredor listado **no quiere
decir que ese corredor no se pueda usar** — solo quiere decir que esa
fuente puntual no lo releva. En rondas anteriores de este documento (y en
la primera versión de esta misma Sección 9) se había estado tratando
"vacío en RPW" como si fuera casi sinónimo de "no hay datos disponibles
en ningún lado", cuando lo correcto es: **cuando RPW no tiene un
corredor, hay que investigar por otro lado** (medición en vivo de un
proveedor conocido, por ejemplo) antes de darlo por cerrado.

Se corrigió esto mismo verificando en vivo si **Wise** (que cubre
prácticamente cualquier par de monedas) opera los 4 corredores marcados
como "vacíos" en RPW a lo largo de esta ronda y la anterior (México,
Paraguay, Uruguay, y también Argentina, revisado de nuevo acá):

| Destino | Tasa Wise (GBP→moneda local) | Fee total mostrado | ¿Wise marca "cargos dinámicos"? |
|---|---|---|---|
| México (MXN) | 1 GBP = 22,9279 MXN | 5,98 GBP | No |
| Uruguay (UYU) | 1 GBP = 54,2980 UYU | 21,93 GBP | No |
| Paraguay (PYG) | 1 GBP = 8.019,41 PYG | 42,43 GBP | **Sí** |
| Argentina (ARS) | 1 GBP = 2.036,76 ARS | 117,54 GBP | **Sí** |

**Los 4 corredores están activos y operables en Wise ahora mismo** —
ninguno de los 4 está realmente "sin poder enviarse", contradiciendo
cualquier lectura de la Sección 7.3 o de este documento que sugiriera lo
contrario. Lo que sí queda claro con este cuadro es una jerarquía de
costo/liquidez: México y Uruguay tienen fees bajos y sin advertencia de
"cargos dinámicos" (monedas más líquidas para Wise), mientras que
Paraguay y sobre todo Argentina muestran fees mucho más altos y
**Wise avisa explícitamente que aplica "dynamic charges" por ser monedas
menos usadas o por volatilidad de mercado** — el fee de Argentina
(117,54 GBP) es **~20 veces el de México** (5,98 GBP) para lo que parece
ser el mismo monto de referencia. Esto probablemente explica mejor por
qué World Bank RPW no releva estos corredores (son más caros/volátiles de
medir de forma estandarizada) que la hipótesis de "no hay volumen" que se
había planteado antes.

Cruzando el dato de Argentina contra XE (1 GBP = 2.037,14 ARS): la
diferencia con la tasa de Wise es de apenas ~0,02% — **ARS no muestra el
mismo problema que NGN** (confirma otra vez, con un tercer caso
independiente después de EGP y LBP, que el problema de XE con NGN fue
puntual de esa moneda y no un patrón general).

**Conclusión revisada para mangomundi:** un corredor vacío en World Bank
RPW nunca debe leerse como "no se puede enviar ahí" — solo como "esta
fuente puntual no lo tiene, buscar en otro lado" (Wise u otro proveedor
en vivo, como se hizo acá). El conteo de "corredores vacíos en RPW"
sigue siendo útil como dato sobre esa fuente específica (Rumania→
Moldavia, Singapur→Vietnam, Japón→Perú, Italia→Perú, España→Argentina,
Italia→Argentina, España→Paraguay, Italia→México, Italia→Uruguay — 9 en
total), pero de acá en adelante conviene, para cada uno, hacer al menos
una verificación rápida con un proveedor amplio (Wise es el más práctico
por cubrir casi cualquier par) antes de asumir que no hay datos
disponibles de ninguna fuente.

---

## 10. Plan sugerido para la próxima ronda

0. **Regla corregida esta ronda, aplica de acá en adelante para todo el
   proyecto:** un corredor vacío en World Bank RPW **nunca** se traduce
   como "no se puede enviar ahí". Antes de cerrar cualquier corredor
   como "sin datos", verificar en vivo con al menos un proveedor amplio
   (Wise es el más práctico) — ver Sección 9.2 para el método completo,
   aplicado a México/Paraguay/Uruguay/Argentina.
1. La línea de "payroll internacional" sigue cerrada (Sección 3) — no
   vale la pena seguir ahí salvo pedido explícito distinto del usuario.
2. **Argentina:** RPW no releva el país, pero Wise sí opera el corredor
   (Sección 9.2, tasa en vivo ya obtenida: 1 GBP = 2.036,76 ARS, fee
   ~117,54 GBP con "cargos dinámicos"). Si se necesita más profundidad
   en Argentina, el camino es seguir con mediciones en vivo de otros
   proveedores (Remitly, Western Union, MoneyGram, Global66), no volver a
   insistir con RPW.
3. **El mapeo de corredores España/Italia→Latam se puede dar por
   suficientemente cubierto** (9 corredores probados en 3 rondas) — no
   hace falta seguir probando corredores nuevos de esta pareja de países
   salvo pedido específico del usuario sobre un país puntual. Para
   México, Paraguay y Uruguay ya se sumó el dato en vivo de Wise que
   faltaba (Sección 9.2).
4. **Panda Remit** queda cerrado en cuanto a "tasa regular" (Sección 7.1,
   mismo límite estructural que Remitly/WorldRemit/MoneyGram RO-MD).
5. Corredores hacia India siguen completos con los 4 orígenes más grandes
   — si se quiere seguir profundizando India, el siguiente paso natural
   sería mirar corredores de *egreso* chicos (India→Nepal ya se
   documentó sin candidatos fuertes).
6. ~~Posibles líneas nuevas: verificar patrón de bancos españoles caros
   con un tercer país; abrir región intra-Asia o Sudáfrica.~~ **Hecho en
   la Sección 11** — ver más abajo.
7. Sigue pendiente, de rondas más viejas, verificar en vivo algún dato
   nuevo para Global66 — no hay una vía nueva identificada todavía, solo
   se menciona para no perderlo de vista.

---

## 11. Quinta ronda del mismo día — BBVA explicado, dos regiones nuevas (Sudáfrica, intra-Asia)

### 11.1 BBVA — el patrón de bancos españoles caros, explicado con su propio tarifario (y España→México confirmado operable)

En vez de seguir probando corredores sueltos de RPW para confirmar el
patrón "BBVA/La Caixa carísimos" (que ya había aparecido 3 veces: España→
Bolivia 25,98%, España→Ecuador 26,74% y 28,00%), se buscó directamente el
tarifario oficial de BBVA. Vía un blog de Wise que lo resume:

- **Transferencia SWIFT (fuera de SEPA), envío:** fee de **0,70%, con un
  mínimo de 35€.**
- **Margen cambiario:** "sobreprecio" que en un ejemplo documentado
  (EUR→GBP) llegó a **4,65%** sobre el tipo interbancario.

Esto explica el mecanismo exacto detrás de los números vistos en RPW:
para un envío chico de 140-200€ (el monto estándar que usa RPW para
medir), **el mínimo de 35€ solo ya representa 17,5%-25% del total**,
antes de sumar el margen cambiario — lo que fácilmente explica el
25%-28% visto en los 3 corredores anteriores. **Conclusión más sólida que
antes:** no hace falta seguir probando corredores nuevos para "confirmar"
que BBVA es caro — es una consecuencia directa y predecible de su
estructura de fees (fee fijo alto + mínimo alto), que aplica
prácticamente a cualquier corredor fuera de SEPA para montos chicos, con
independencia del país de destino específico.

De paso, aplicando la corrección de la Sección 9.2: se verificó en vivo
con Wise que **España→México (vacío en RPW) está operable** —
`wise.com/es/send-money-to-mexico`: **1 EUR = 19,7031 MXN, fee 7,52 EUR**
para el monto de referencia de la página. Sin cargos dinámicos marcados
(a diferencia de ARS/PYG), consistente con ser una moneda más líquida.

### 11.2 Sudáfrica→Zimbabue — nueva región para el proyecto, con Mukuru como candidato nuevo

World Bank RPW, Sudáfrica→Zimbabue (Q3 2025):

| Proveedor | Costo total | Notas |
|---|---|---|
| WorldRemit | 5,15% | cuenta bancaria, internet |
| Sasai Money Transfer | 5,41% | margen FX 5,41%, sin fee |
| EcoCash Remit | 5,82% | agente, margen FX solo 0,02% |
| Mama Money | 6,95% | internet, cash pickup, margen FX 1,95% |
| **Mukuru** | **10,28%-10,68%** | internet/call center/agente, margen FX 0,35%-0,75% |
| ABSA (banco) | 22%-34% | 2 días |
| Standard Bank (banco) | 22%-34% | 2 días |
| Nedbank (banco) | 22%-34% | 2 días |

Promedio del corredor: 12,49% — otro corredor de costo alto en general
(en la misma categoría que España→Bolivia, ronda anterior). Dato
interesante: **Mukuru, una de las fintechs de remesas más grandes y
conocidas de África, resultó ser la opción más cara entre los
proveedores no-bancarios** en este corredor puntual — no es la fintech
"barata" que se podría asumir por su tamaño y reputación. Los bancos
tradicionales sudafricanos vuelven a mostrar el mismo patrón ya visto en
España/Italia/Arabia Saudita: costos de 22%-34%, muy por encima de
cualquier fintech.

### 11.3 Singapur→Indonesia — nueva región (intra-Asia), InstaReM reconfirma margen bajo

World Bank RPW, Singapur→Indonesia, envío de 260 SGD (Q3 2025):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| **InstaReM** | **0,56%** | **-0,06%** |
| Wise | 0,92% | 0,00% |
| DBS Remit (banco) | 1,43% | 1,43% |
| Pay2Home Remittance | 2,47% | — |
| Western Union | 2,55%-2,62% | — |

**InstaReM vuelve a aparecer con el margen más bajo del corredor**
(-0,06%, mejor que mid-market), muy en línea con el dato ya conocido de
UK→India (~0,31% margen, addendum anterior). Con dos corredores
independientes ambos por debajo de 0,5%, **InstaReM se perfila como un
proveedor consistentemente de margen bajo** — a diferencia de Xoom,
TransferGo, SBI Remit, Taptap Send o Sendwave, que sí mostraron variación
fuerte entre corredores/monedas. Es un candidato sólido para cargar con
un número más único/estable, no con `verified_status` por corredor.

---

## 12. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (Sección 3).
2. El patrón "bancos tradicionales caros" (España, Italia, Arabia
   Saudita, Sudáfrica) está sólidamente confirmado en 4 regiones
   distintas — se puede dar por cerrado como hallazgo transversal, no
   hace falta seguir buscando más ejemplos salvo que aparezca algo que lo
   contradiga.
3. ~~Mukuru en un segundo corredor sudafricano.~~ **Hecho en la Sección
   13 — confirmó que varía muchísimo (de 10,7% a margen negativo).**
4. **InstaReM** queda como candidato de margen bajo y consistente — no
   necesita más verificación en esta línea salvo que se quiera un tercer
   corredor para confirmarlo del todo.
5. ~~Medio Oriente (Qatar/Kuwait) y Brasil→Portugal.~~ **Hecho en la
   Sección 13** (Qatar→Nepal cubierto; Kuwait queda para otra ronda si se
   quiere).
6. Sigue pendiente, de rondas más viejas, verificar en vivo algún dato
   nuevo para Global66 — no hay una vía nueva identificada todavía.

---

## 13. Sexta ronda del mismo día — Mukuru con un vuelco extremo, Qatar→Nepal, Brasil→Portugal con impuestos

### 13.1 Mukuru — de "el más caro" a margen negativo en dos corredores del mismo origen

World Bank RPW, Sudáfrica→Mozambique (Q3 2025):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| Sikhona Money Transfers (agente, 200 ZAR) | 2,72% | — |
| **Mukuru** (call center, 500 ZAR) | **4,01%** | **-5,08% a -4,58%** |
| Mama Money | 5,79% | — |
| WorldRemit | 5,97% | — |
| First National Bank / Standard Bank / ABSA | 6,12%-35,75% | — |
| Western Union (agente) | 32,90% | — |

**Mukuru "domina" este corredor** según la fuente — es el proveedor con
más opciones de acceso (call center, agentes, internet) y el margen FX
más favorable de toda la tabla, notablemente negativo. Comparado con el
dato de la ronda anterior en Sudáfrica→Zimbabue (10,3%-10,7% de costo
total, el más caro entre los no-bancarios), **es un vuelco completo: de
"el más caro" a "domina con margen negativo"**, entre dos corredores del
mismo país de origen. Con esto, Mukuru se suma como **6to caso
confirmado del proyecto** de proveedor "amplio" con margen fuertemente
variable por corredor (después de Xoom, TransferGo, SBI Remit, Taptap
Send y Sendwave) — y el caso más extremo de todos en términos de rango
(de +10,7% a -5%, más de 15 puntos porcentuales de diferencia).

De paso, **Sikhona Money Transfers** también aparece bien barato acá
(2,72%) — en una ronda mucho más vieja del proyecto se lo había
encontrado como "caro" en el corredor Sudáfrica→Nigeria. Es un dato
point más débil (solo 2 menciones, montos de transferencia distintos:
200 ZAR acá vs. lo que se haya usado en la medición vieja), pero apunta
en la misma dirección que Mukuru: **los proveedores sudafricanos
enfocados en remesas regionales pueden variar mucho según el país
vecino específico**, probablemente por diferencias de infraestructura de
pago/liquidez en cada país receptor (Zimbabue con su historia de crisis
cambiaria es un caso muy distinto de Mozambique).

### 13.2 Qatar→Nepal — corredor nuevo de Medio Oriente

World Bank RPW (Q3 2025, 21-28 ago 2025):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| City Exchange Company | 3,14% | 0,40% |
| Eastern Exchange Co | 3,53% | 0,38% |
| Ezremit | 3,53% | 0,38% |
| Arabian Exchange Company | 3,58% | 0,43% |
| Al Dar Exchange | 3,66% | 0,51% |
| Western Union | 6,55% | 3,81% |

A diferencia de otros corredores del Golfo ya vistos (Arabia Saudita→
India, EAU→India), acá **no aparecen bancos tradicionales** en la lista —
todos son casas de cambio (exchange houses) regionales, varias nuevas
para el proyecto (City Exchange, Eastern Exchange, Arabian Exchange, Al
Dar Exchange, Ezremit). El clúster de opciones baratas es más apretado
(3,14%-3,66%, menos de medio punto de diferencia entre todas) y Western
Union, aunque la más cara, no muestra la brecha extrema (5-10x) vista en
otros corredores del Golfo — acá es solo ~2x la opción más barata.

### 13.3 Brasil→Portugal — vacío en RPW, operable en Wise, con impuestos brasileños de por medio

Aplicando la corrección de la Sección 9.2: RPW no tiene datos para este
corredor, así que se verificó en vivo con Wise
(`wise.com/br/send-money-to-portugal`):

- **Tasa comercial: 1 EUR = 5,9685 BRL.**
- **"Total fees and taxes": 121,44 BRL** (para el monto de referencia de
  la página).
- **"Effective rate (VET)": 1 EUR = 6,220324 BRL** — un ~4,24% peor que
  la tasa comercial.

Lo interesante acá no es tanto el número final sino que **Wise etiqueta
el costo explícitamente como "fees AND TAXES"**, algo que no aparece en
ninguna otra página de corredor revisada en el proyecto hasta ahora. Esto
apunta a que Brasil aplica un impuesto (probablemente el IOF — Imposto
sobre Operações Financeiras, un impuesto brasileño conocido que grava
operaciones de cambio) que se suma al margen que cobra el proveedor.
**Implicancia para mangomundi:** si en algún momento se cargan corredores
con origen en Brasil, el costo total observado en el mercado puede
incluir un componente de impuesto país-específico que no es margen del
proveedor — vale la pena no atribuirle todo el costo al proveedor si se
quiere modelar esto con precisión, y potencialmente separar "impuesto
Brasil" como un factor aparte si se cargan varios proveedores con origen
ahí.

---

## 14. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (Sección 3).
2. El patrón "bancos tradicionales caros" está confirmado en 4+ regiones
   — se puede dar por cerrado como hallazgo transversal.
3. **Mukuru** queda catalogado como proveedor de margen fuertemente
   variable (como Xoom/TransferGo/etc.) — no cargar con un número único,
   necesita verified_status por corredor específico, más todavía que los
   otros casos dado lo extremo del rango encontrado.
4. ~~Revisar impuestos país-específicos en Argentina/India.~~ **Hecho en
   la Sección 15 — India tiene TCS pero con umbral alto (no afecta montos
   chicos), Argentina queda ambiguo (30% de percepción, sin confirmar si
   aplica a remesas).**
5. ~~Kuwait como origen del Golfo.~~ **Hecho en la Sección 15.**
6. Sigue pendiente, de rondas más viejas, verificar en vivo algún dato
   nuevo para Global66 — no hay una vía nueva identificada todavía.

---

## 15. Séptima ronda del mismo día — impuestos país-específicos en Argentina/India, Kuwait→Filipinas

### 15.1 ¿Argentina e India tienen algo como el IOF de Brasil?

La Sección 13.3 encontró que Brasil aplica un impuesto (probablemente
IOF) sobre operaciones cambiarias, visible directamente en el widget de
Wise como "fees and taxes". Se revisó si los otros 2 países de origen ya
cubiertos en el proyecto tienen algo parecido.

**India: sí, y está bien documentado — el TCS (Tax Collected at
Source).** Bajo el esquema LRS (Liberalised Remittance Scheme):

| Propósito de la remesa | Tasa TCS |
|---|---|
| Educación financiada con préstamo bancario | 0% |
| Educación (otras fuentes) | 2% por encima de 10 lakh INR/año |
| Tratamiento médico | 2% por encima de 10 lakh INR/año |
| Otros propósitos | 20% por encima de 10 lakh INR/año |
| Paquetes turísticos | 2% plano |

El punto clave: **el umbral (10 lakh INR/año, ~USD 12.000) está muy por
encima de los montos que usa World Bank RPW para medir** (140-500 USD
equivalente por transacción). Es decir, **una persona que manda una
remesa individual típica no llega a pagar TCS** — el impuesto está
pensado para desalentar/gravar movimientos de capital grandes o
recurrentes que acumulan ese umbral en el año, no remesas familiares
chicas. **Conclusión: los datos de India ya cargados en el proyecto (UK→
India, EEUU→India, EAU→India, Arabia Saudita→India) no están
contaminados por este impuesto** — a diferencia de Brasil, donde el IOF
parece aplicar sin umbral mínimo visible (habría que confirmar esto
último con más detalle si se quiere estar 100% seguro, pero el ejemplo de
Wise no mostró ningún umbral, a diferencia de India donde el umbral está
explícitamente documentado en todas las fuentes).

**Argentina: más ambiguo, queda pendiente.** El "Impuesto PAIS" (5%-30%
según el rubro, vigente desde 2019) **fue eliminado el 23 de diciembre de
2024** al cumplir su plazo de vigencia de 5 años. Sin embargo, sigue
vigente **una percepción del 30%** que funciona como "anticipo de
Ganancias y Bienes Personales" — aplica a: compra de dólar ahorro,
consumos con tarjeta de crédito/débito en el exterior, paquetes de
turismo al exterior (no limítrofes), y algunos bienes importados. **No se
encontró confirmación clara de que esta percepción del 30% aplique
también a transferencias de dinero/remesas enviadas** (el caso de uso
central de mangomundi) — las fuentes consultadas hablan específicamente
de "compra de dólares para ahorro" y "tarjeta", que son categorías
distintas de "enviar plata a alguien en el exterior". Además, vale la
pena notar que **el uso principal de Argentina en este proyecto hasta
ahora ha sido como país de DESTINO** (España→Argentina, Italia→Argentina,
etc.), no como origen — así que aunque se confirmara que la percepción
del 30% aplica a remesas salientes, tendría menos relevancia directa para
mangomundi que para un proyecto enfocado en argentinos mandando plata
afuera. Se deja como pendiente genuino, no cerrado.

### 15.2 Kuwait→Filipinas — corredor nuevo, con un caso inusual (Western Union barato)

World Bank RPW (Q3 2025, 19-26 ago 2025):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| **Western Union** | **2,21%** | 0,29% |
| Aman Exchange | 2,48% | 0,94% |
| Al Mulla Exchange | 2,82% | 0,90% |
| Lulu Money | 2,89% | 0,97% |
| Bahrain Exchange Company | 2,92% | 1,00% |
| Al Muzaini Exchange | 3,00% | 1,08% |
| MoneyGram | 3,13% | 1,21% |

Caso llamativo: **Western Union es la opción más barata de todo el
corredor** — algo prácticamente inédito en el proyecto, donde WU casi
siempre queda entre las opciones caras o intermedias (acá pasó lo
contrario en la mayoría de los corredores del Golfo, donde WU tenía
brechas de 5-10x contra las casas de cambio locales; acá directamente les
gana). Aparecen varias casas de cambio regionales nuevas (Aman Exchange,
Al Mulla Exchange, Bahrain Exchange Company, Al Muzaini Exchange) y
**Lulu Money**, que ya había aparecido mencionado de pasada en rondas
mucho más viejas del proyecto como candidato del Golfo sin verificar —
acá aparece con un dato real (2,89%, en el medio de la tabla).

---

## 17. Octava ronda del mismo día — Argentina: impuesto al cheque, Lulu Money confirma margen variable

### 17.1 Argentina: el Impuesto al Débito y Crédito ("impuesto al cheque") es el candidato más sólido, no la percepción del 30%

La Sección 15.1 dejó abierto si la percepción del 30% (anticipo de
Ganancias/Bienes Personales) aplica a remesas salientes desde Argentina,
sin encontrar confirmación clara — las fuentes hablaban de compra de
dólar ahorro, tarjeta en el exterior y turismo, no de transferencias de
dinero como tales. Se buscó una fuente más específica sobre impuestos a
transferencias/transferencias bancarias en Argentina.

**Impuesto al Débito y Crédito en Cuentas Bancarias ("impuesto al
cheque"):**

| Concepto | Detalle |
|---|---|
| Tasa | 0,6% sobre cada débito + 0,6% sobre cada crédito = **1,2% total** |
| Alcance | "Todo débito y crédito en cuentas bancarias argentinas" — no está limitado a tarjeta, turismo o compra de dólares |
| Recuperable | 33% acreditable contra Impuesto a las Ganancias, 17% contra IVA |

A diferencia de la percepción del 30%, este impuesto **no está descrito
con un alcance restringido a categorías específicas** (dólar ahorro,
tarjeta, turismo) — el lenguaje de la fuente es "todo débito y crédito",
lo que lo hace un candidato bastante más plausible para aplicar también
a una transferencia/remesa saliente desde una cuenta bancaria argentina.
Dicho esto, **esto sigue sin ser una confirmación explícita y
específica de "esto aplica a remesas internacionales"** — es una
inferencia razonable a partir del alcance general descrito, no una cita
textual que mencione remesas. Vale la pena mantenerlo como el candidato
más fuerte encontrado hasta ahora, pero no cerrar el tema como 100%
confirmado.

Otros impuestos argentinos relevados en la misma búsqueda, que parecen
de contexto empresarial/servicios y no de remesas personales:
- IVA por importación de servicios: 21%.
- Retención de Impuesto a las Ganancias: 24,5%-31,5%.
- Percepciones ARCA (ex-AFIP): variable, ya cubierto como la percepción
  del 30% de la Sección 15.1.

**Reconciliación de fechas:** la Sección 15.1 decía que el Impuesto PAIS
fue eliminado "el 23 de diciembre de 2024". La fuente consultada en esta
ronda (fluyez.com) dice explícitamente que **"el Impuesto PAIS fue
derogado el 31 de octubre de 2024"**. Son fuentes distintas con fechas
distintas — no se pudo reconciliar cuál es la correcta con el tiempo
disponible en esta ronda, pero la diferencia (poco más de un mes) no
cambia la conclusión de fondo: el Impuesto PAIS ya no está vigente desde
fines de 2024, antes del período que cubre este proyecto.

**Conclusión general:** Argentina como origen de remesas probablemente sí
tiene un componente impositivo adicional (el impuesto al cheque, ~1,2%),
distinto del margen FX del proveedor — parecido en naturaleza al IOF de
Brasil, aunque de magnitud menor. Como ya se señaló en la Sección 15.1,
esto tiene relevancia limitada para mangomundi hoy porque el proyecto usa
Argentina mayormente como destino, no como origen.

### 17.2 Lulu Money en Kuwait→India: confirma el patrón de margen variable

World Bank RPW, corredor Kuwait→India:

| Proveedor | Costo total (rango) | Margen FX (rango) |
|---|---|---|
| **Lulu Money** | **0,87% – 1,96%** | 0,27% – 0,58% |
| Aman Exchange | 1,13% – 2,67% | 0,30% – 0,75% |
| Al Mulla Exchange | 2,27% – 2,49% | 0,35% – 0,57% |
| MoneyGram | 2,35% | 0,43% |
| Western Union | 2,51% | 0,59% |

El rango de Lulu Money depende del método: 0,87% es la combinación más
barata (150 KWD o 500 USD, vía tarjeta de débito o efectivo a cuenta
bancaria), 1,96% la más cara (65 KWD/200 USD vía tarjeta de débito por
internet). Comparado con el 2,89% (margen 0,97%) que Lulu Money mostró
en Kuwait→Filipinas (Sección 15.2), **el corredor a India resulta
sistemáticamente más barato** — mismo proveedor, dos corredores desde el
mismo país de origen, con una diferencia de más de 2 puntos porcentuales
en el peor caso de Filipinas contra el mejor caso de India.

**Conclusión: Lulu Money se suma como 7mo caso confirmado del proyecto**
de proveedor "amplio" sin margen estable — la lista queda: Xoom,
TransferGo, SBI Remit, Taptap Send, Sendwave, Mukuru, Lulu Money. Nota
aparte: en este corredor Western Union vuelve a su posición habitual
como una de las opciones más caras (a diferencia de Kuwait→Filipinas,
donde había sido la más barata) — reforzando que ni siquiera "Western
Union es cara" es una regla sin excepciones corredor por corredor.

---

## 19. Novena ronda del mismo día — Global66 por fin en vivo, EEUU→México, tabla de referencia consolidada

### 19.1 Global66 — verificado en vivo, cierra el pendiente más viejo del proyecto

La calculadora de portada de Global66 (`global66.com/enviar-dinero/...`)
había estado rota en intentos anteriores del proyecto — mismo patrón de
bug ya visto en TransferGo y Panda Remit. Esta ronda se probó de nuevo,
navegando directo a las páginas de corredor específico, y esta vez sí
cargó con datos reales (moneda de origen por defecto: CLP, es decir
Chile, país base de Global66):

**Chile→España (CLP→EUR):**
- Global66: 1 EUR = 1.084,10 CLP.
- Mid-market (XE): 1 EUR = 1.083,54 CLP.
- **Margen: ~0,05%** — extremadamente ajustado, sin fee visible aparte
  (consistente con el mensaje de marketing del sitio, "sin comisiones
  ocultas").

**Chile→EEUU (CLP→USD):**
- Global66: 1 USD = 934,72 CLP.
- Mid-market (XE): 1 USD = 936,03 CLP.
- **Margen: ~-0,14%** — mejor que la referencia de mercado.

**Conclusión: se cierra el pendiente más viejo del proyecto sobre
Global66.** Con dos corredores reales, ambos con margen bajo (uno
positivo muy chico, uno directamente negativo), Global66 se suma a
**InstaReM** como segundo caso confirmado de proveedor "amplio" con
margen ajustado y consistente entre corredores — no un caso de margen
variable como Xoom/TransferGo/Mukuru/etc. Sigue siendo un solo país de
origen probado (Chile) con dos destinos, así que no se puede descartar
del todo que el margen varíe más al probar otro país de origen (Global66
opera también desde Colombia, Perú, México, entre otros) — pero con la
evidencia disponible hasta ahora, el patrón apunta a "margen bajo por
diseño", coherente con su propuesta de marketing de "tipo de cambio
real, sin comisiones ocultas".

### 19.2 EEUU→México — el corredor de remesas más grande del mundo, con un patrón nuevo: costo negativo

World Bank RPW (Q3 2025, 4-28 ago 2025, envío de 200 USD):

| Proveedor | Costo total | Margen FX |
|---|---|---|
| **Walmart2World (débito, internet)** | **-2,44%** | -2,44% |
| **Xoom (cuenta bancaria, internet)** | **-0,24%** | -0,24% |
| Xoom (débito, internet) | 0,39% | -0,24% |
| Wise (cuenta bancaria, internet) | 1,26% | 0,03% |
| Walmart2World (débito, agente) | 1,67% | -1,33% |
| MoneyGram (cuenta bancaria, internet) | 1,71% | 0,76% |
| Ria (débito, internet) | 2,24% | 1,24% |
| Ria (cuenta bancaria, internet) | 2,31% | 0,81% |
| Wise (débito, internet) | 2,32% | 0,03% |
| MoneyGram (cuenta bancaria, internet, otra opción) | 2,60% | 1,10% |
| Xoom (tarjeta de crédito, internet) | 2,72% | -0,24% |
| Ria (débito, efectivo) | 2,76% | 0,81% |

Este es el primer corredor del proyecto donde varios proveedores
(Walmart2World, Xoom) muestran **costo total negativo** — es decir, más
barato que la propia tasa de referencia que usa World Bank para medir
"mid-market". Esto es consistente con lo extremadamente competitivo y
maduro que es el corredor EEUU→México (el más grande del mundo por
volumen): a diferencia de corredores más chicos/nicho del proyecto,
donde el piso de precio suele estar cerca de 0% de margen, acá hay
suficiente competencia y escala como para que algunos proveedores
subsidien el tipo de cambio (probablemente compensando con volumen o
con ingresos de otro lado, como Walmart2World que se apoya en la
infraestructura de tiendas físicas de Walmart).

También refuerza el caso de **Xoom como proveedor de margen muy
variable**: acá su margen va de -0,24% (mejor que el mercado) hasta el
mismo Xoom mostrando 2,72% de costo total en la opción de tarjeta de
crédito (que combina margen FX con el cargo típico de tarjeta de
crédito) — un rango amplísimo dentro del mismo corredor y proveedor,
sin contar que en otros corredores ya documentados (Reino Unido→India,
Italia→Ecuador) Xoom mostró 1,41% y 2,35% de margen. Xoom termina siendo,
de los 7 casos de margen variable del proyecto, el que tiene el rango
más amplio documentado hasta ahora: de -0,24% a 2,35%.

### 19.3 Tabla de referencia consolidada — los 7 casos de margen variable por corredor

Con 7 proveedores ya confirmados, se arma acá una tabla única de
referencia (en vez de dejarla repartida entre las secciones 1, 5, 11,
13, 15, 17 y 19) pensada para facilitar el consumo del patrón desde
Supabase:

| Proveedor | Corredores con dato real (este proyecto) | Rango de margen FX observado | Sección |
|---|---|---|---|
| **Xoom** | Reino Unido→India, Italia→Ecuador, EEUU→México | -0,24% a 2,35% | 2.2, 5.3, 19.2 |
| **TransferGo** | Documentado en addendums anteriores a v11 (no repetido acá) | — | (fuera de v11) |
| **SBI Remit** | Documentado en addendums anteriores a v11 (no repetido acá) | — | (fuera de v11) |
| **Taptap Send** | Varios orígenes africanos (addendums anteriores + v10) | ~0,9% a 1,8% | (v10 y anteriores) |
| **Sendwave** | EEUU→Nigeria, EEUU→Kenia | 0,12% a 1,07% | 1.1, 5.1 |
| **Mukuru** | Sudáfrica→Zimbabue, Sudáfrica→Mozambique | -5,08% a 10,68% | 11.2, 13.1 |
| **Lulu Money** | Kuwait→Filipinas, Kuwait→India | 0,27% a 0,97% | 15.2, 17.2 |

Nota metodológica: TransferGo y SBI Remit fueron establecidos como casos
de margen variable en addendums previos a este archivo (v11 es
"solo lo nuevo de esta ronda", no repite todo lo ya cargado) — se
mencionan acá por completitud de la lista pero sus cifras específicas
viven en los documentos anteriores, no se reinventan acá. **Mukuru sigue
siendo, por lejos, el caso más extremo** (rango de más de 15 puntos
porcentuales, con inversión de signo entre corredores); **Xoom es el que
tiene el rango más amplio de este archivo v11 específicamente** (-0,24%
a 2,35%, sin contar el 2,72% de la opción con tarjeta de crédito en
EEUU→México, que mezcla margen FX con cargo de tarjeta).

---

## 21. Décima ronda del mismo día — Walmart2World sin mecanismo confirmado, Global66 matizado con un segundo origen

### 21.1 Walmart2World — el mecanismo del costo negativo sigue sin confirmarse

Se buscó información pública sobre el modelo de negocio de Walmart2World
(el servicio de Walmart operado por Ria/MoneyGram) para entender el
costo total negativo visto en la Sección 19.2 (EEUU→México).

Lo encontrado: Walmart comunica públicamente que sus clientes **"ahorraron
aproximadamente USD 1.000 millones en comisiones desde 2014"** usando sus
servicios de transferencia, y posiciona el servicio con mensajes de
"tarifas bajas y buenos tipos de cambio, siempre". El objetivo declarado
por el VP de servicios financieros de Walmart al lanzar el servicio fue
"darle más opciones a los clientes para transferir dinero" — un
posicionamiento de marketplace/elección, no explícitamente de subsidio.

**No se encontró ninguna fuente que explique el mecanismo económico
específico** (reparto de comisión con Ria/MoneyGram, si Walmart subsidia
parte del costo a cambio de tráfico en tiendas físicas, o si simplemente
opera con márgenes más finos por volumen). La hipótesis de "loss leader
para atraer tráfico a las tiendas" sigue siendo razonable dado el patrón
observado (costo negativo, poco común en el resto del proyecto), pero
**no está confirmada por ninguna fuente pública** — se deja marcada como
hipótesis, no como hallazgo.

### 21.2 Global66 desde un segundo origen — matiza la conclusión de la ronda anterior

La Sección 19.1 concluyó, a partir de dos corredores desde Chile
(CLP→EUR y CLP→USD), que Global66 tenía "margen bajo y consistente".
Esta ronda se probó un tercer corredor, esta vez desde un país de origen
distinto: **Colombia→España (COP→EUR)**.

Resultado, con un envío de 1.300.000 COP:

| Concepto | Valor |
|---|---|
| Monto enviado | 1.300.000 COP |
| Comisión explícita | 39.000 COP (**3,00% plano**) |
| Monto convertido (tras comisión) | 1.261.000 COP |
| Tipo de cambio aplicado | 1 EUR = 3.625,65 COP |
| Tipo de cambio mid-market (XE) | 1 EUR = 3.668,48 COP |
| Margen FX (sobre la tasa) | **-1,17%** (favorable al cliente) |
| Monto recibido | 348 EUR |
| **Costo total efectivo** | **~1,80%** |

A diferencia de los corredores desde Chile (sin comisión explícita
visible, margen FX prácticamente neutro), **acá Global66 sí cobra una
comisión explícita del 3% plano**, compensada parcialmente por un tipo
de cambio favorable, resultando en un costo total (~1,80%) bastante más
alto que el ~0,05%/-0,14% de Chile — aunque igual sigue siendo un costo
moderado comparado con el resto del proyecto (lejos de los extremos de
bancos tradicionales o de Mukuru en su corredor caro).

**Conclusión revisada:** la caracterización de Global66 como "margen bajo
y consistente en todos los corredores" (Sección 19.1) fue prematura —
**el modelo de comisión (con fee explícito o sin él) parece variar según
el país de origen**, no solo el margen cambiario. Con tres corredores
ahora (dos sin fee explícito desde Chile, uno con fee explícito desde
Colombia), Global66 pasa a verse más como un caso intermedio: no tan
extremo como Mukuru/Xoom (que varían en varios puntos porcentuales y
hasta cambian de signo), pero tampoco un caso cerrado de "margen único y
bajo" como parecía la ronda pasada. Queda como candidato a un 8vo caso de
variabilidad si se confirma con más corredores, aunque con un rango
mucho más acotado (0% a ~1,8%) que los 7 ya confirmados.

---

## 23. Onceava ronda del mismo día — Global66 desempatado, primera fuente alternativa (Monito), Argentina reforzada

### 23.1 Global66 desde Perú — desempata a favor del patrón de Chile

Se probó un tercer país de origen, Perú→España (PEN→EUR), para desempatar
entre el patrón de Chile (sin fee explícito, margen ~0%) y el de
Colombia (fee explícito del 3%, Sección 21.2).

| Concepto | Valor |
|---|---|
| Monto a enviar (único campo, sin fee separado) | 958,00 PEN |
| Tipo de cambio aplicado | 1 EUR = 3,90 PEN |
| Tipo de cambio mid-market (XE) | 1 EUR = 3,9117 PEN |
| **Margen** | **~-0,30%** (favorable al cliente) |

**Resultado: Perú sigue el mismo patrón que Chile** — un único campo de
"monto a enviar" sin desglose de comisión, y margen cambiario bajo/
negativo. Con esto, **2 de 3 países de origen probados (Chile, Perú)
muestran el mismo modelo de margen bajo sin fee visible; Colombia queda
como el outlier** con comisión explícita del 3%. La hipótesis más
simple ahora es que el modelo de Colombia es la excepción (posiblemente
por alguna estructura de costos o regulación local específica de
Colombia — no identificada en esta ronda, ver plan) y no la regla del
proveedor. Con 2 de 3 corredores de margen bajo, Global66 se recatalogа
más cerca de InstaReM (margen bajo, mayormente consistente) que de
Mukuru/Xoom (variable en varios puntos porcentuales) — aunque el caso de
Colombia sigue sin explicarse.

### 23.2 Primera fuente alternativa: Monito.com confirma el hallazgo de Mukuru desde una fuente distinta

Todo el research de este archivo v11 había usado, hasta ahora, solo tres
fuentes: World Bank RPW (datos estructurados por corredor), XE.com/Wise
(referencia mid-market) y verificación en vivo directa en los sitios de
cada proveedor. Esta ronda se probó **Monito.com**, un agregador
independiente de comparación de remesas, para cruzar un hallazgo ya
documentado: Mukuru en Sudáfrica→Zimbabue (caro, 10,3%-10,7% según World
Bank RPW, Sección 11.2).

Resultado en Monito (transferencia de 3.000 ZAR):

| Concepto | Valor |
|---|---|
| Fee | 150,00 ZAR |
| Tipo de cambio aplicado | 0,059365 |
| Tipo de cambio mid-market (fuente de Monito: XE) | 0,062424 |
| Diferencia de tasa (según Monito) | "4,07% peor que mid-market" |
| Monto recibido | 169,19 USD |
| **Costo total calculado** | **~9,66%** |

**El resultado de Monito (~9,66%) es consistente con el rango ya
documentado vía World Bank RPW (10,3%-10,7%)** — algo más bajo, pero del
mismo orden de magnitud y en la misma categoría ("caro" dentro del
corredor). Esto es valioso porque **confirma el hallazgo desde una
fuente completamente independiente** de World Bank, con su propia
metodología de medición y su propia referencia de mid-market — reduce la
posibilidad de que el hallazgo de Mukuru fuera un artefacto específico
de la metodología de RPW. Sirve como validación del patrón, no solo como
repetición de la misma fuente.

**Nota metodológica para el resto del proyecto:** Monito.com (y
agregadores similares, como Remitly Compare o Exiap) pueden ser útiles
como fuente de verificación cruzada, especialmente en corredores donde
solo se tiene un dato de World Bank RPW sin confirmación independiente
— vale la pena considerarlos como opción cuando se quiera reforzar un
hallazgo puntual, no como reemplazo de RPW.

### 23.3 Argentina — fuentes alternativas refuerzan la conclusión, y se resuelve la fecha del Impuesto PAIS

Se buscaron fuentes distintas de fluyez.com (la única fuente usada hasta
ahora en las Secciones 15.1 y 17.1) para el tema de impuestos a remesas
en Argentina.

**Sobre el alcance de la percepción del 30%:** dos fuentes nuevas
(Rankia — un blog especializado en cuentas bancarias, y AskMonarca — una
guía específica sobre percepciones/dólar tarjeta) describen el alcance
de la percepción del 30% en términos consistentes entre sí y con lo ya
encontrado: **consumos con tarjeta en moneda extranjera y compra de
dólares** (Netflix, Spotify, Steam, compras en el exterior, pasajes,
hoteles, compra de dólar ahorro). **Ninguna de las dos fuentes nuevas
menciona transferencias/giros al exterior como una categoría alcanzada**
— Rankia incluso distingue explícitamente "tarjeta" de "transferencias
(SWIFT, fintech)" como categorías separadas, sugiriendo tratamiento
distinto. **Esto refuerza, sin llegar a una confirmación explícita y
definitiva, la conclusión ya sostenida en la Sección 15.1**: la
percepción del 30% probablemente no aplica a remesas/transferencias de
dinero como tales. Con tres fuentes independientes ahora apuntando en la
misma dirección (ninguna incluye transferencias en su lista de
categorías alcanzadas), la conclusión es más sólida que antes, aunque
sigue sin ser un "sí" o "no" categórico de una fuente oficial (ARCA/
BCRA) que hable específicamente del caso.

**Se resolvió la discrepancia de fechas del Impuesto PAIS** (Sección
17.1 había dejado sin reconciliar dos fechas: 23-dic-2024 vs.
31-oct-2024). Wikipedia, citando la base legal exacta, aporta la
resolución: el impuesto fue creado por la Ley 27.541 (dic-2019) con un
**plazo de vigencia de 5 años**, por lo que venció por cumplimiento de
plazo el **23 de diciembre de 2024** — coincide además con una fuente
adicional (revistaferreteros.com, ARCA) que marca el 22/12/2024 como
fecha de corte administrativo, y con Rankia, que dice "diciembre de
2024" sin precisar el día. **Con 3 fuentes apuntando a diciembre y
ninguna otra corroborando el 31 de octubre, se corrige: la fecha
correcta es 23 de diciembre de 2024** — el dato de "31 de octubre" de la
Sección 17.1 (fluyez.com) parece haber sido un error de esa fuente
puntual.

---

## 25. Doceava ronda del mismo día — Xoom cross-validado, Colombia confirmada como excepción real

### 25.1 Xoom cross-validado vía Monito.com — y datos nuevos de TransferGo/InstaReM de paso

Siguiendo la línea metodológica propuesta en la ronda anterior (Sección
23.2), se usó Monito.com para cruzar el caso de **Xoom en EEUU→México**
— el corredor donde RPW había mostrado a Xoom con margen negativo
(-0,24%, Sección 19.2), algo atípico para un proveedor normalmente caro
en otros corredores del proyecto (1,41% en Reino Unido→India, 2,35% en
Italia→Ecuador).

Resultado en Monito (transferencia de 100 USD, a cuenta bancaria):

| Concepto | Valor |
|---|---|
| Fee | Gratis (FREE) |
| Tipo de cambio aplicado | 17,2326 |
| Mid-market (fuente: XE, vía Monito) | 16,9741 |
| Diferencia reportada por Monito | "1,16% mejor que mid-market" |
| Monto recibido | 1.723 MXN |

**Monito confirma, de forma independiente, que Xoom tiene margen
favorable en este corredor específico** (-1,16% según Monito, -0,24%
según RPW) — ambas fuentes coinciden en la dirección (mejor que
mid-market), aunque no en la magnitud exacta (esperable, dado que cada
fuente mide en un momento distinto y con metodología propia). **Esto
amplía el rango documentado de Xoom en el proyecto a -1,16% / 2,35%**,
reforzando aún más su estatus como el caso de mayor variabilidad
documentado en este archivo v11 — no solo varía entre corredores
distintos, sino que el mismo corredor (EEUU→México) fue confirmado como
"barato para Xoom" por dos fuentes independientes.

De paso, la misma búsqueda en Monito (esta vez para Reino Unido→India)
aportó **los primeros datos propios de este archivo v11 para dos
proveedores que hasta ahora solo se mencionaban por nombre**, con cifras
viviendo en addendums anteriores:

- **TransferGo: 0,15% peor que mid-market** (Reino Unido→India) — un
  margen bastante bajo, en el rango típico de proveedores "ajustados"
  más que "caros" para este corredor puntual.
- **InstaReM: 0,66% peor que mid-market** (mismo corredor) — algo más
  alto que los datos ya documentados de InstaReM en el proyecto (-0,06%
  en Singapur→Indonesia, Sección 11.3), pero **sigue siendo bajo en
  términos absolutos**, consistente con su catalogación como proveedor
  de margen bajo y no-variable.

### 25.2 Global66 en Colombia — confirmado como política de precios real, no un artefacto de medición

La Sección 23.1 había dejado abierto por qué Colombia es la excepción
dentro de Global66 (fee explícito del ~3%, medido en vivo, contra
Chile/Perú sin fee visible). Se buscó una fuente independiente para
confirmar si esto es una política real y documentada, o un artefacto
puntual de la medición en vivo de la Sección 21.2.

**Un blog de Wise sobre Global66 Colombia confirma, de forma
independiente, una comisión específica para transferencias
internacionales desde Colombia: "el costo es 4% del monto enviado"**
(ejemplo dado: 200.000 COP → costo de 8.000 COP) — cercano al ~3% medido
en vivo la ronda pasada (la diferencia puede deberse a cambios de
tarifario en el tiempo, o a que el 3% medido incluía el efecto
compensador de un tipo de cambio favorable, mientras que el 4% de Wise
describe solo la comisión explícita antes de la conversión).

**Conclusión: la excepción de Colombia es una política de precios real y
documentada, no un error de medición.** Lo que sigue sin identificarse es
la causa específica: la página oficial de Global66 Colombia no publica
el porcentaje directamente (remite al "tarifario" dentro de la app), y
no se encontró ninguna fuente que lo vincule explícitamente a un costo
regulatorio colombiano (el GMF/4x1000 es de 0,4%, muy por debajo del
3%-4% observado, así que no explica la diferencia por sí solo). Queda
como una política comercial específica de Global66 para ese mercado,
sin una causa raíz confirmada — de prioridad baja para seguir
profundizando salvo que el usuario lo pida.

---

## 27. Treceava ronda del mismo día — Canadá se suma al proyecto, TransferGo confirmado como variable

### 27.1 Canadá→Filipinas — primer corredor del proyecto con Canadá como origen

Siguiendo la línea propuesta en la ronda anterior (usar Monito para abrir
corredores nuevos, no solo cross-validar), se probó **Canadá como país
de origen por primera vez en todo el proyecto** — no había aparecido ni
en v11 ni, hasta donde se puede verificar desde este archivo, en
addendums anteriores.

Monito, Canadá→Filipinas (transferencia de 100 CAD):

| Proveedor | Tipo de cambio | Margen | Monto recibido |
|---|---|---|---|
| **MoneyGram** | 45,7331 | **-1,67%** (mejor que mid-market) | 4.573 PHP |
| Instarem | 44,8326 | 0,34% peor | 4.483 PHP |
| Western Union | 44,7171 | 0,59% peor | 4.472 PHP |
| Remitly | 44,5500 | 0,96% peor | 4.455 PHP |
| WorldRemit | 45,2345 | -0,56% (mejor) | 4.343 PHP (fee 3,99 CAD) |
| XE Money Transfer | 44,5782 | 0,90% peor | 4.222 PHP (fee 5,30 CAD) |

Mid-market de referencia (XE, vía Monito): 1 CAD = 45,0433 PHP.

Dos cosas para destacar: **MoneyGram vuelve a aparecer con margen
negativo/favorable** (ya se había visto un patrón similar en Xoom/
Walmart2World en EEUU→México, Sección 19.2) — sugiere que en corredores
de alto volumen hacia Filipinas (uno de los principales receptores de
remesas del mundo, junto con India y México) varios proveedores grandes
compiten agresivamente por debajo de la referencia de mercado. Y
**InstaReM reconfirma su estatus de margen bajo en un tercer corredor**
(0,34% acá, sumado a 0,66% en Reino Unido→India y -0,06% en Singapur→
Indonesia) — con tres corredores ahora, todos bajo 1%, InstaReM queda
como el caso mejor documentado del proyecto de proveedor consistentemente
de margen bajo.

### 27.2 TransferGo cross-validado en un segundo corredor — confirma que sí es variable

La ronda anterior había dejado abierto si el 0,15% de margen de
TransferGo visto en Reino Unido→India (vía Monito) era representativo, o
si contradecía su catalogación histórica (de addendums anteriores a v11)
como proveedor de margen variable. Se probó un segundo corredor, esta
vez en la región donde TransferGo tiene más presencia histórica
(Europa del Este): **Polonia→Ucrania**.

| Corredor | Margen TransferGo (vía Monito) |
|---|---|
| Reino Unido→India | 0,15% peor que mid-market |
| **Polonia→Ucrania** | **2,12% peor que mid-market** |

**Confirmado: TransferGo sí es un caso genuino de margen variable** — el
rango entre los dos corredores (0,15% a 2,12%) es de casi 2 puntos
porcentuales, consistente con su catalogación histórica previa a este
archivo v11. El dato bajo de la ronda pasada (Reino Unido→India) no era
representativo del proveedor en general, solo de ese corredor puntual —
un recordatorio de por qué este tipo de proveedores necesita
verified_status por corredor específico y no un solo número genérico.

---

## 29. Catorceava ronda del mismo día — InstaReM consolidado con 5 corredores, patrón de márgenes negativos hacia Filipinas

### 29.1 Canadá→India — segundo destino desde Canadá

Monito, Canadá→India (transferencia de 100 CAD, mid-market 1 CAD =
68,1017 INR):

| Proveedor | Margen |
|---|---|
| MoneyGram | -0,58% (mejor que mid-market) |
| Western Union | -0,56% (mejor) |
| Remitly | -0,10% (mejor) |
| **Instarem** | **0,17% peor** |
| KOHO | 0,02% peor (fee 1,26 CAD) |
| (proveedor no identificado, "no recomendado") | 2,77% peor (fee 29,82 CAD, 3-5 días) |

Mismo patrón de margen favorable/negativo en varios proveedores grandes
que ya se había visto en Canadá→Filipinas y EEUU→México — parece
confirmarse que, en general, **Canadá como país de origen tiende a
mercados de remesas muy competitivos**, con varios proveedores grandes
ofreciendo tasas mejores que la referencia de mercado. **InstaReM
reconfirma su margen bajo por 4ta vez** (0,17%), ahora en 4 corredores
distintos (Singapur→Indonesia, Reino Unido→India, Canadá→Filipinas,
Canadá→India), todos bajo 1%.

### 29.2 Australia→Filipinas — Australia se suma al proyecto, InstaReM llega a 5 corredores

Monito, Australia→Filipinas (transferencia de 100 AUD, mid-market 1 AUD
= 44,8103 PHP):

| Proveedor | Margen |
|---|---|
| **Remitly** | **-3,56%** (mejor que mid-market, el más agresivo del proyecto en este sentido) |
| MoneyGram | -2,22% (mejor) |
| Western Union | -0,68% (mejor) |
| **Instarem** | **-0,08% peor** (prácticamente neutro) |
| XE Money Transfer | 0,56% peor (fee 5,30 AUD) |
| SingX | 0,39% peor (fee 6,00 AUD) |

**Australia se suma al proyecto como país de origen nuevo**, siguiendo
el mismo patrón exitoso de Canadá (abierto vía Monito, sin necesidad de
depender de World Bank RPW). **InstaReM llega a 5 corredores
confirmados** (Singapur→Indonesia -0,06%, Reino Unido→India 0,66%,
Canadá→Filipinas 0,34%, Canadá→India 0,17%, Australia→Filipinas 0,08%)
— con todos los datos bajo 1% (y varios directamente por debajo de
0,2%), **InstaReM queda como el caso mejor documentado y más sólido de
todo el proyecto de proveedor "amplio" con margen consistentemente
bajo**, contraste directo con Xoom, Mukuru, Lulu Money y TransferGo.

**Patrón reforzado: los corredores de altísimo volumen hacia Filipinas
muestran márgenes negativos en varios proveedores grandes** — ya visto
en Canadá→Filipinas (MoneyGram -1,67%) y ahora aún más marcado en
Australia→Filipinas (Remitly -3,56%, MoneyGram -2,22%, Western Union
-0,68%). Sumado al mismo patrón visto en EEUU→México (Walmart2World
-2,44%, Xoom -0,24%), **el patrón ya no parece específico de un
corredor puntual, sino de la categoría "corredores de recepción
masiva/alto volumen"** (México y Filipinas son, junto con India, los
tres mayores receptores de remesas del mundo) — la competencia entre
proveedores grandes en esos mercados parece empujar los precios por
debajo de la referencia de mid-market en varios casos, algo que no se ve
en corredores más chicos/nicho del proyecto.

---

## 31. Quinceava ronda del mismo día — CORRECCIÓN: el patrón de "margen negativo" vía Monito, investigado a fondo

**El usuario pidió explícitamente investigar el patrón de "margen
negativo" documentado en las Secciones 19.2, 27.1 y 29.2, para asegurarse
de que no contaminara los resultados del proyecto y entender bien de qué
se trataba.** Esta sección es el resultado de esa investigación — y
encontró un problema metodológico real que corrige varias cifras citadas
en rondas anteriores.

### 31.1 El hallazgo: Monito muestra dos montos distintos por proveedor, y uno parece ser promocional

Al revisar con más cuidado las tarjetas de proveedor en Monito.com (no
solo el badge de "% mejor/peor que mid-market" que se venía citando), se
notó que **varias tarjetas muestran DOS montos de "el destinatario
recibe"**, uno después del otro — por ejemplo, la tarjeta de MoneyGram en
Canadá→Filipinas muestra "4.573 PHP" y, justo debajo, "4.301 PHP".

Patrón observado al revisar sistemáticamente:

- **El monto alto es el que Monito usa para calcular el tipo de cambio
  mostrado y el badge "X% mejor/peor que mid-market"** que se venía
  citando en este documento como si fuera la cifra representativa.
- **El monto bajo es consistentemente menor** — entre ~0,5% y ~6% menor,
  según el proveedor.
- **La brecha entre los dos montos coincide con la presencia de una
  insignia de "tasa preferencial en tu primera transferencia"** ("Includes
  zero transfer fees and/or preferential exchange rate on your first
  transfer", "Includes preferential pricing for new users", etc.) — casi
  todas las tarjetas con dos montos tienen esta insignia.
- **Cuando la comisión ya está declarada como "Fee FREE" para todos los
  clientes**, la única explicación posible para que haya dos montos
  distintos de dinero recibido es que se estén aplicando **dos tipos de
  cambio distintos** — uno mejor (primera transferencia) y uno peor
  (recurrente).

**No se pudo confirmar esto con una fuente explícita de Monito** (se
intentó abrir los popups de "Details" junto a cada insignia, pero
problemas de renderizado del navegador en esta ronda impidieron leer su
contenido) — así que esta interpretación es una **inferencia bien
fundada a partir del patrón observado, no una confirmación textual
directa de Monito**. Aun así, es consistente con una práctica ya
documentada varias veces en este mismo proyecto (Panda Remit, que
declara explícitamente "New user exclusive rates"; el patrón general de
"tasa promocional de bienvenida" visto en Remitly y otros) — así que
encaja con algo ya conocido, no es un fenómeno nuevo y aislado.

**Evidencia a favor de esta interpretación, no solo especulación:**
la tarjeta de **Xoom en EEUU→México (la misma corridor usada para el
cross-validation de la Sección 25.1) NO tiene insignia promocional y
muestra un solo monto** (1.723 MXN, sin un segundo número) — es decir,
el patrón de "dos montos" no aparece en todas las tarjetas, solo en las
que tienen insignia promocional. Esto descarta que sea un artefacto
genérico de cómo Monito arma sus tarjetas (por ejemplo, dos métodos de
pago distintos) y refuerza que está ligado específicamente a la
promoción de primera transferencia.

### 31.2 Recalculado: los "márgenes negativos" de las Secciones 27.1 y 29.2 se revierten para MoneyGram y Western Union

Usando el monto bajo (interpretado como la tasa real/recurrente) en vez
del monto alto (promocional), estas son las cifras corregidas:

| Corredor | Proveedor | Margen citado (monto alto/promocional) | **Margen corregido (monto bajo/real)** |
|---|---|---|---|
| Canadá→Filipinas | MoneyGram | -1,67% (favorable) | **~+4,49%** (costo real) |
| Canadá→Filipinas | Western Union | 0,59% peor | **~+4,27%** |
| Canadá→Filipinas | Remitly | 0,96% peor | **~+2,82%** |
| Canadá→Filipinas | InstaReM | 0,34% peor | **~+1,09%** |
| Canadá→India | MoneyGram | -0,58% (favorable) | **~+2,69%** |
| Canadá→India | Western Union | -0,56% (favorable) | **~+2,90%** |
| Canadá→India | Remitly | -0,10% (favorable) | **~+3,42%** |
| Canadá→India | InstaReM | 0,17% peor | **~+0,46%** |
| Australia→Filipinas | MoneyGram | -2,22% (favorable) | **~+4,17%** |
| Australia→Filipinas | Western Union | -0,68% (favorable) | **~+5,83%** |
| Australia→Filipinas | Remitly | -3,56% (favorable) | **~-0,65%** (sigue favorable, pero mucho menos extremo) |
| Australia→Filipinas | InstaReM | -0,08% peor | **~+1,07%** |

**Conclusión: el "patrón de márgenes negativos en corredores de alto
volumen hacia Filipinas" (Secciones 27.1 y 29.2) se revierte en gran
parte.** Con la cifra corregida, MoneyGram y Western Union pasan de
"favorables" a costos reales de **4%-6%**, en línea con lo esperable
para remesas normales — no hay nada estructuralmente distinto en estos
corredores, el "margen negativo" era mayormente un artefacto de estar
citando la tasa promocional de primera transferencia en vez de la tasa
recurrente. Remitly en Australia→Filipinas es la única excepción parcial
que sobrevive (-0,65%, prácticamente neutro) — sigue sin ser una cifra
alarmante, y de cualquier forma ya no es el -3,56% dramático citado
originalmente.

### 31.3 Xoom (Sección 25.1) e InstaReM sobreviven la corrección

**Xoom en EEUU→México se mantiene limpio**: su tarjeta en Monito no
tiene insignia promocional y solo muestra un monto (1.723 MXN) — no hay
segunda cifra que sugiera contaminación. **El cross-validation de la
Sección 25.1 (margen -1,16%, confirmando el -0,24% de World Bank RPW)
sigue siendo válido.**

**InstaReM también sobrevive razonablemente bien**: en todos sus
corredores medidos vía Monito, la brecha entre el monto alto y el bajo
es chica (0,5%-1,1%, comparado con 3%-6% en MoneyGram/Western Union) —
así que aunque las cifras exactas citadas en las Secciones 27.1 y 29.1/
29.2 fueron probablemente optimistas por el mismo motivo, **el
recalculado con el monto bajo sigue dando resultados bajos (0,46%-1,09%
en los tres corredores recalculados)**, consistente con su catalogación
como proveedor de margen bajo. Se ajusta la conclusión: InstaReM sigue
siendo el caso más sólido de margen bajo del proyecto, pero con cifras
algo más altas (aunque igual bajas en términos absolutos) que las
citadas originalmente.

### 31.4 Nota metodológica — sobre el hallazgo de World Bank RPW (EEUU→México, Sección 19.2) y regla nueva para Monito

**Sobre Walmart2World/Xoom en la Sección 19.2 (fuente: World Bank RPW,
no Monito):** este hallazgo usa una fuente completamente distinta, y no
se puede aplicar la misma corrección (RPW no muestra "dos montos" por
proveedor). Se investigó la metodología oficial de RPW y **no se
encontró que excluya explícitamente tasas promocionales de primera
transferencia** — el propio texto metodológico no aclara si los
investigadores que hacen de "clientes de prueba" reciben o piden tasas
estándar. Esto significa que **no se puede descartar del todo que el
margen negativo de Walmart2World en RPW tenga el mismo origen** (una
tasa promocional capturada como si fuera la estándar) — pero tampoco hay
evidencia directa de que sea así. **Se deja como una duda metodológica
abierta, no como un hallazgo retractado**, a diferencia de los casos de
Monito de la Sección 31.2 que sí se pudieron corregir con datos
concretos.

**Regla metodológica nueva para el resto del proyecto (aplica a toda
ronda futura que use Monito.com):** al leer una tarjeta de proveedor en
Monito, **siempre revisar si aparecen dos montos de "recipient gets"
seguidos**. Si aparecen dos, usar el monto **más bajo** como la cifra
representativa del costo real, y no el badge de "% mejor/peor que
mid-market" (que corresponde al monto alto/promocional). Si aparece un
solo monto (como en el caso de Xoom), no hay ajuste que hacer. Esta
regla se suma a la ya existente sobre tasas promocionales (Panda Remit,
etc.) — es la misma clase de problema, encontrado en una fuente nueva.

---

## 32. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (Sección 3).
2. El patrón "bancos tradicionales caros" está confirmado en 4+ regiones
   — se puede dar por cerrado.
3. **Mukuru**, **Lulu Money**, **Xoom** y **TransferGo** quedan
   catalogados como proveedores de margen fuertemente variable — todos
   necesitan verified_status por corredor específico (ver tabla
   consolidada, Sección 19.3, pendiente de actualizar con los datos de
   las Secciones 25, 27 y 29, y con las cifras CORREGIDAS de la Sección
   31.2, si se carga a Supabase).
4. **InstaReM** sigue siendo el caso más sólido del proyecto de
   proveedor de margen bajo y consistente, aunque con cifras algo más
   altas que las citadas originalmente tras la corrección de la Sección
   31.3 (0,46%-1,09% en los corredores recalculados, en vez de
   -0,08%-0,66%).
5. ~~Investigar a fondo el patrón de "margen negativo" para que no
   contamine los resultados.~~ **Hecho en la Sección 31** — se encontró
   contaminación real por tasa promocional en MoneyGram/Western Union
   vía Monito (Canadá y Australia), se corrigieron las cifras, y se
   estableció una regla metodológica nueva para el resto del proyecto.
6. **Nuevo pendiente: revisar retroactivamente si otros hallazgos ya
   cargados de Monito en este archivo (rondas 12-14) tienen el mismo
   problema de doble monto** — se corrigieron los casos más evidentes
   (Secciones 27.1, 29.1, 29.2) pero valdría la pena una revisión más
   sistemática de TODAS las tarjetas de Monito citadas en el archivo,
   incluyendo Mukuru (Sección 23.2) y TransferGo (Secciones 25.1, 27.2),
   antes de considerar esos datos completamente limpios.
7. **Nuevo pendiente, de prioridad media: si se carga a Supabase, avisar
   explícitamente a la otra sesión de Claude sobre este hallazgo** — los
   datos de márgenes "negativos" de las Secciones 19.2, 27.1 y 29.2
   deberían cargarse con las cifras corregidas de la Sección 31.2 (o,
   para el caso de RPW/Walmart2World, con una nota de duda metodológica),
   no con las cifras originales.
8. El patrón de "margen negativo en corredores de alto volumen" queda
   ahora en un estado mucho más acotado: **confirmado con más confianza
   solo para Xoom en EEUU→México** (fuente limpia, sin insignia
   promocional) y parcialmente para Remitly en Australia→Filipinas
   (-0,65% incluso corregido). Ya no se sostiene como un patrón amplio de
   "categoría de corredores".
9. Sigue sin identificarse una vía nueva para profundizar SBI Remit o
   Taptap Send con datos frescos de este archivo v11 — pendiente de baja
   prioridad, solo si el usuario lo pide específicamente.
10. Con Canadá y Australia ya cubiertos, las regiones de origen grandes
   que siguen sin aparecer en el proyecto son: Nueva Zelanda, y algunos
   mercados asiáticos grandes como Corea del Sur o Hong Kong — candidatos
   para seguir ampliando cobertura si el usuario quiere continuar en esa
   línea.
