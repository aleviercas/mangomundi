# Research corredores — addendum v15 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v15addendum.md` (ADDENDUM #9 / v15 del research
de corredores) — se suma a la cadena v6-v14, no reemplaza a ninguno.
Abre **Brasil→Colombia** (quinto corredor de Brasil, primero fuera de
MERCOSUR), documenta por primera vez con datos concretos (vía World
Bank RPW) a **Mukuru** (4 corredores desde Sudáfrica: Botsuana,
Zimbabue, Zambia, Malaui), resuelve **Xoom** (EEUU→Tailandia) y **Lulu
Money** (Kuwait→Egipto) — cerrando los cinco proveedores "amplios"
catalogados desde v11 — y abre **Argentina** como país de origen nuevo
(2 corredores: España e Italia, ambos con Global66 mostrando un margen
alto ~5,3% explicado por riesgo cambiario del peso, no por controles de
capital, que se investigaron y descartaron). También re-verifica en
vivo TransferGo (confirma que las cifras del proyecto siguen correctas,
sin cambios) y avanza parcialmente sobre el mecanismo de Walmart2World
(sin cerrarlo del todo).

Este documento sigue aplicando la corrección metodológica de v11
(Sección 31) sobre tasas promocionales de Monito: Brasil→Colombia usa
el monto corregido de MoneyGram (3,85%, no el promocional).

**Nota de precaución sobre Malaui (Sección 2.1):** el margen de -9,58%
de Mukuru en Sudáfrica→Malaui está confirmado (vía Wikipedia, brecha de
148% entre tipo de cambio oficial y de mercado paralelo) como un
artefacto de la distorsión cambiaria del propio país, no una ganga real
— cargar con esa salvedad explícita en notas, no como el "mejor caso"
de Mukuru sin contexto.

### Lo que se cargó a Supabase

Cargado el 2026-09-02/03, migración
`supabase/migrations/20260902170000_load_v15_corridor_rates.sql`, aplicada
directamente al proyecto vivo (`ttqalbexpquzobrdyvgx`) y verificada con
`SELECT` contra la base después de aplicar (no solo confiando en los
`INSERT`/`UPDATE` propios). **8 filas nuevas de `fx_rates` + 2 filas
actualizadas + 1 proveedor nuevo** (`fx_rates` pasó de 876 a 884 filas;
`providers` de 64 a 65).

**Nota previa importante:** antes de cargar nada hubo que reconciliar el
worktree de este agente, que partía de un `main` desactualizado sin el
propio archivo v15 ni la carga de v14 — se hizo merge de la rama
`claude/coordinar-trabajo-simultaneo-y85idz` (que sí tenía ambos) para
poder trabajar con el estado real del repo y de Supabase.

**1. Brasil→Colombia (Sección 1) — 2 filas nuevas.** MoneyGram (cifra
CORREGIDA, 3,85%, no la promocional) y Western Union (limpio, 2,61% →
1,62% de margen FX + 1% de fee). Corredor sin filas previas, verificado
antes de cargar. `verified_status='sin_confirmar'` (dato de Monito,
mismo criterio que el resto de Brasil en v14).

**2. Mukuru (Sección 2, 2.1, 5.1) — de los 4 corredores "listos para
cargar" que el propio documento señala, solo 2 se cargaron tal cual; los
otros 2 se decidieron explícitamente NO cargar (o cargar distinto),
verificando primero el estado real de `fx_rates`:**
- **Botsuana (ZA→BW): 1 fila nueva** (INSERT). Sin fila previa. Fee 137
  ZAR (10%), margen -0,25%, tipo de cambio 0,76 (dado explícitamente por
  la fuente RPW). `confirmado_activo`.
- **Malaui (ZA→MW): 1 fila actualizada** (UPDATE, no insert — ya existía
  una fila con fuente genérica "Direct research Aug 2025", spread 2%). Se
  reemplaza con el dato de World Bank RPW (margen -9,58%, costo 0,42%)
  **con la advertencia explícita exigida por el research en el propio
  campo `data_source`**: el margen favorable es un artefacto de la brecha
  de ~148% entre el tipo de cambio oficial y el paralelo de Malaui, NO
  una ganga real de Mukuru — el texto completo (con "*** ADVERTENCIA
  EXPLICITA, NO LEER A VALOR NOMINAL ***") queda en la fila y también
  resumido en `providers.notes` de Mukuru.
- **Zimbabue (ZA→ZW): NO tocado, decisión deliberada.** La fila existente
  (id `5f21f5b4…`) ya tenía spread=9,66%, `confirmado_activo`,
  cross-validada con DOS fuentes independientes (RPW + Monito v12) en una
  sesión anterior. El propio v15 (Sección 5.1) reconoce que su cifra
  (9,81% costo/0,32% margen) es una medición distinta y NO resuelve cuál
  de las dos es más reciente ("no se investigó cuál de las dos fechas es
  más reciente") — sobreescribir una fila cross-validada con una fila de
  fuente única y admitidamente ambigua habría violado la regla de nunca
  reemplazar un dato mejor por uno peor. Verificado tras la carga: la
  fila sigue intacta.
- **Zambia (ZA→ZM): NO cargado como fila de `fx_rates`.** A diferencia de
  Botsuana y Malaui, el documento no da ningún tipo de cambio absoluto
  para este par (ZAR→ZMW) en ninguna parte del texto — solo fee (137
  ZAR/10%), margen (1,48%) y costo total (11,48%). `fx_rates.rate` es
  `NOT NULL` y el proyecto no tiene ningún corredor ZAR→ZMW previamente
  cargado del cual reusar una tasa canónica (verificado por consulta
  antes de escribir la migración). Inventar una tasa habría violado la
  regla de nunca fabricar datos, así que se optó por NO cargar la fila —
  el fee/margen/costo sí quedan documentados en `providers.notes` de
  Mukuru para no perder el dato, pero sin una fila de precio en
  `fx_rates`.

**3. Xoom, EEUU→Tailandia (Sección 3) — 1 fila nueva.** Margen 4,71% (el
más alto medido en el proyecto entre "proveedores de referencia"), fee
USD 4,99, tipo de cambio 31,02 THB/USD (dado explícitamente). Se cargó
UNA sola fila representativa a USD 200 (mismo monto de referencia ya
usado para Xoom EEUU→México) en vez de partir en 2 tramos por
`min_amount/max_amount` — el margen es constante entre los dos montos de
ejemplo de la fuente (USD 200 y USD 500), solo cambia el fee relativo de
un mismo fee flat de USD 4,99, así que no es un escalón de tarifa real
que justifique dos filas (a diferencia de Xoom GB→IN, donde sí hay 3
filas porque ahí el margen mismo cambia por tramo). El tramo de USD 500
(costo total 5,71%) queda documentado en el comentario de la fila, no
cargado aparte. `confirmado_activo`.

**4. Lulu Money, Kuwait→Egipto (Sección 4) — proveedor nuevo + 1 fila.**
No existía en `providers` (verificado antes de cargar) — se agregó
siguiendo el mismo patrón usado para SBI Remit en v14 (slug
`lulu-money`, `is_corridor_specific=true`, `active=true`). Fee KWD 1,50
(2,31%), margen 1,08%, costo total 3,39%. La fuente no da un tipo de
cambio absoluto para KWD→EGP — se derivó reusando el tipo de cambio
KWD→EGP ya establecido en el proyecto (163,321743, de la fila de Wise
para ese mismo par, spread 0%) aplicándole el margen del 1,08% dado por
RPW (161,5579), la misma técnica que el proyecto ya usa para Xoom
EEUU→México cuando RPW da el margen pero no una tasa absoluta — no es
una tasa inventada, es una reutilizada. No se cargó `website_url` (la
fuente no da uno y no se quiso inventar uno). `confirmado_activo`. Con
esto, los cinco proveedores "amplios" catalogados en v11 (Mukuru, Xoom,
Lulu Money, SBI Remit, TransferGo) quedan todos con al menos un
corredor numérico documentado.

**5. Argentina→España y Argentina→Italia (Sección 6, 6.2) — 3 filas
nuevas + 1 actualizada.** Verificación previa importante: Argentina como
`sending_country` YA existía en el proyecto desde v8 (10 corredores vía
Prex) y ya había filas AR→ES (Wise, Western Union) y AR→IT (Ria, Wise) de
sesiones anteriores — lo genuinamente nuevo de v15 no es "Argentina como
país de origen" (como decía el recordatorio del propio documento) sino
Global66 en ambos corredores y Western Union en AR→IT:
- **Global66 AR→ES: 1 fila nueva.** Fee 0, margen 5,28%, tipo de cambio
  0,000541 (dado explícitamente). Primera fila de Global66 para un
  corredor de SALIDA de Argentina (su único dato previo de Argentina era
  EUR→ARS, de ENTRADA).
- **Global66 AR→IT: 1 fila nueva.** Mismo tipo de cambio (0,000541) y
  margen (5,28%) que España pese a mucha menos cobertura en Monito (646
  vs. 1.659 comparaciones) — confirma la hipótesis del research de que el
  margen depende del origen (ARS, riesgo cambiario del peso) y no de la
  competencia por destino.
- **Western Union AR→IT: 1 fila nueva.** Sin fila previa para este
  corredor exacto. Fee 5.000 ARS (5%, cash pickup), margen FX 5,27%.
- **Western Union AR→ES: 1 fila ACTUALIZADA** (no insert — ya existía una
  fila con fee=500 ARS flat/spread=3%, fuente genérica "Direct research
  Aug 2025", sin monto de referencia ni método de entrega). Se reemplaza
  con el dato específico de Monito (fee 5.000 ARS/5%, cash pickup, margen
  5,12%) — mismo criterio que la corrección de Taptap Send UK→Ghana en
  v14 (fuente más específica reemplaza una genérica), con el mismo tipo
  de caveat de "método de entrega no necesariamente idéntico" ya usado en
  v14 para Reino Unido→Nigeria.

Todas las filas de Argentina/Brasil/Global66 quedaron con
`verified_status='sin_confirmar'` (dato de Monito, siguiendo el criterio
ya establecido para este tipo de fuente en el proyecto); las de Mukuru
(RPW), Xoom (RPW) y Lulu Money (RPW) quedaron en `confirmado_activo`.

**Lo que NO se tocó, por diseño:** TransferGo y SingX (Sección 5.3, 5.1)
— el propio documento confirma que sus cifras actuales en el proyecto
siguen siendo correctas y que no hay una cifra limpia con la cual
reemplazarlas; Walmart2World (Sección 5.5) — avance de contexto/mecanismo
sin cifra nueva de tarifa; Secciones 5, 5.2, 5.4 y 7 — tablas de
consolidación y plan, no datos nuevos.

---

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #9 (v15) — Brasil→Colombia confirma el patrón fuera de MERCOSUR, y Mukuru documentado por primera vez con datos concretos (vía RPW)

> **Documento nuevo — no reemplaza a v6-v14 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya tiene v14
> cargado. Este es un undécimo archivo con **solo lo nuevo de esta
> ronda**. Para el panorama completo hacen falta los 11 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** sigue
> aplicando la corrección metodológica de v11 (Sección 31) sobre tasas
> promocionales de Monito — el hallazgo nuevo de Brasil→Colombia es de
> ese tipo (dos montos, usar el bajo/real).
>
> **Primera versión.** Dos líneas de investigación: (1) se abrió
> **Brasil→Colombia**, quinto corredor de Brasil y el primero fuera de
> la región MERCOSUR/vecinos inmediatos — sirve como prueba de si el
> patrón de MoneyGram promocional (visto en Paraguay, Perú, Argentina)
> se sostiene también hacia un destino más lejano. Resultado: **sí se
> sostiene** — MoneyGram vuelve a mostrar el patrón, y Western Union
> vuelve a ganar una vez corregido. (2) Se encontró, vía World Bank RPW,
> el primer dato concreto y citable del proyecto para **Mukuru**
> (Sudáfrica→Botsuana) — hasta ahora catalogado solo como "margen
> fuertemente variable" sin ningún corredor medido con precisión.
>
> **Segunda actualización (Secciones 2 y 3):** se profundizó Mukuru con
> tres corredores más desde Sudáfrica (Zimbabue, Zambia, Malaui),
> confirmando el patrón de fee plano ~10% con margen de tipo de cambio
> variable — y apareció un caso llamativo en Malaui, con un margen de
> -9,58% que probablemente refleja una distorsión cambiaria del propio
> país, no una ganga real. Y se resolvió **Xoom** con el mismo método
> (World Bank RPW): margen 4,71%, el más alto medido hasta ahora entre
> los proveedores "de referencia" del proyecto — confirma con datos
> concretos su reputación de ser más caro que la competencia fintech.
>
> **Tercera actualización (Secciones 2.1 y 4):** se confirmó, con una
> fuente independiente y dramática (Wikipedia, citando datos de
> noviembre de 2025), la hipótesis dejada abierta sobre Malaui: hay una
> brecha de casi 148% entre el tipo de cambio oficial (1.734 MWK/USD) y
> el del mercado paralelo (4.300 MWK/USD) — la distorsión cambiaria más
> grande documentada en todo el proyecto, y confirma que el margen de
> -9,58% de Mukuru no era una ganga real. Y se cerró el último proveedor
> "amplio" pendiente desde v11: **Lulu Money**, vía RPW (Kuwait→Egipto),
> con un margen de 1,08% — moderado, similar al rango de InstaReM/SBI
> Remit.
>
> **Cuarta actualización (Sección 5): ronda de consolidación general,**
> como sugería el plan de la ronda anterior. Se armó una tabla única que
> cruza todos los proveedores "amplios" del proyecto con sus rangos
> completos — incluyendo datos de v11 que no se habían vuelto a
> mencionar en v12-v15 — organizados en tres categorías: margen bajo y
> consistente (proveedores de referencia), contaminación estructural
> confirmada (sin forma de corregir desde Monito), y margen alto/
> variable confirmado con datos concretos. De paso se encontró que la
> tabla de Mukuru de esta ronda (v15, Sección 2) y la de v11 (Sudáfrica
> →Zimbabue) dan cifras ligeramente distintas para el mismo corredor —
> una discrepancia menor que se documenta, no se resuelve.
>
> **Quinta actualización (Sección 5.5):** se retomó un pendiente viejo,
> de v11 (Sección 21.1) — el mecanismo económico detrás del costo
> negativo de Walmart2World en EEUU→México, que había quedado sin
> confirmar. No se encontró una fuente que revele la cifra exacta de
> reparto de comisión, pero sí dos mecanismos concretos y mejor
> sustentados que la hipótesis original de "loss leader": Walmart
> diseñó el servicio como un **marketplace competitivo** donde Ria y
> MoneyGram compiten entre sí por el tráfico de Walmart (no un
> proveedor único), y Walmart negocia con su escala de retail una
> **tarifa plana de bajo costo** en vez del modelo de fee variable
> típico de los proveedores. Queda como avance parcial, no como cierre
> definitivo.
>
> **Sexta actualización (Sección 5.3):** el usuario confirmó que v14 ya
> está cargado en Supabase (commit `968109c`, 15 corredores nuevos/
> actualizados) y relayó una nota de la otra sesión de Claude: el
> addendum v14 cita cifras de TransferGo que no coinciden con lo que hay
> hoy en la base. Se re-verificaron en vivo ambos corredores de
> TransferGo (Reino Unido→India, Polonia→Ucrania) y **las cifras del
> proyecto siguen siendo exactamente correctas** (0,15% y 2,12%, sin
> ningún cambio) — la discrepancia no es un error de investigación ni
> un dato desactualizado. La explicación más probable, según lo que la
> otra sesión ya reportó, es que **TransferGo fue dejado sin tocar a
> propósito en la carga de v14** (por estar flageado como
> "contaminado/sin dato limpio"), así que la base todavía tiene un
> valor anterior a la corrección metodológica de v11 — la discrepancia
> es esperable y correcta dado el diseño del proceso, no un bug.
>
> **Séptima actualización (Sección 6): Argentina abierta como país de
> origen nuevo.** Corredor Argentina→España, cobertura delgada (2
> proveedores). Hallazgo principal: **Global66 muestra acá un margen de
> ~5,3%** — muy por encima de su patrón habitual de margen casi nulo en
> Chile, Perú y México (0,01%). La hipótesis obvia (controles de
> capital argentinos, dado el patrón ya visto con Malaui) **se
> investigó y se descarta en gran parte**: las restricciones cambiarias
> para individuos en Argentina fueron levantadas en abril de 2025, casi
> año y medio antes de esta medición — lo que queda de controles hoy
> afecta a inversores no residentes y movimientos financieros
> corporativos, no a transferencias personales. El margen alto de
> Global66 en este corredor probablemente refleja el riesgo cambiario
> genuino de operar en pesos argentinos (una moneda históricamente muy
> volátil/inflacionaria) o la cobertura delgada del corredor, no un
> régimen de tipo de cambio múltiple como en Malaui.
>
> **Octava actualización (Sección 6.2): segundo corredor argentino,
> confirma cuál de las dos explicaciones pesa más.** Argentina→Italia
> da resultados casi idénticos a Argentina→España (Global66: 5,28% de
> margen en ambos; Western Union: 5,27% vs. 5,12%) — a pesar de que
> Italia tiene una cobertura bastante más delgada que España (646
> comparaciones contra 1.659). **Esto favorece la explicación de
> "riesgo cambiario genuino del peso argentino" por sobre la de
> "cobertura delgada/poca competencia":** si la competencia fuera el
> factor principal, se esperaría que el corredor con menos actividad
> (Italia) tuviera peor margen — pero el margen es prácticamente el
> mismo en los dos, lo que apunta a que el origen (ARS) es lo que fija
> el margen, no el destino específico.

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v14, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Brasil→Colombia abierto, quinto corredor de Brasil y primero fuera
   de MERCOSUR.** MoneyGram vuelve a mostrar el patrón promocional de
   tasa (real 3,85%, corregido desde un monto promocional más alto);
   Western Union, con dato limpio, resulta más barato una vez corregido
   (2,61%). Ver Sección 1.
2. **Con Colombia, el patrón de Brasil queda establecido en 4 de 5
   corredores medidos** (Paraguay, Perú, Argentina, Colombia): Western
   Union le gana a MoneyGram después de aplicar la corrección — y el
   patrón se sostiene tanto dentro de MERCOSUR (Paraguay, Argentina)
   como hacia destinos más lejanos (Perú, Colombia). Bolivia sigue
   siendo el único corredor de Brasil con MoneyGram limpio (sin
   insignia promocional), sin punto de comparación con Western Union.
   Ver Sección 1.1.
3. **Mukuru documentado por primera vez con un corredor concreto**
   (Sudáfrica→Botsuana, vía World Bank RPW): fee plano muy alto (~10%
   del monto enviado) domina el costo total (8,75%-9,75%), con margen
   de tipo de cambio prácticamente nulo o levemente favorable
   (-0,25%). Confirma que la etiqueta de "margen fuertemente variable"
   que el proyecto le venía dando a Mukuru se refería al **fee**, no al
   tipo de cambio — un patrón distinto al de InstaReM/Global66/SBI
   Remit (margen bajo Y fee bajo) y más parecido al de Western Union en
   corredores de fee plano alto. Ver Sección 2.

**Segunda ronda del mismo día (Secciones 2 y 3):**

4. **Mukuru ampliado a 4 corredores desde Sudáfrica** (Botsuana,
   Zimbabue, Zambia, Malaui): el fee plano ~10% se confirma como
   consistente en los cuatro, mientras que el margen de tipo de cambio
   varía bastante (-9,58% a +1,48%) — confirmando que la "variabilidad"
   de Mukuru está en el margen, no en el fee. Ver Sección 2.
5. **Caso llamativo en Malaui: margen de -9,58%, probablemente una
   distorsión cambiaria del propio país, no una ganga real de Mukuru**
   — el "tipo de cambio inter-bancario" de referencia de RPW y el tipo
   de cambio efectivo del mercado en Malaui divergen fuertemente, un
   patrón que recuerda al de los controles de capital/cambio ya
   documentados para China y Corea del Sur (v13, v14 Sección 2), aunque
   acá no se investigó la causa regulatoria específica. Ver Sección 2.1.
6. **Xoom resuelto con el mismo método (World Bank RPW)**: margen de
   tipo de cambio 4,71% en EEUU→Tailandia — el margen más alto medido
   hasta ahora entre los proveedores de referencia del proyecto,
   coherente con la reputación de Xoom (propiedad de PayPal) de ser más
   caro que la competencia fintech pura. Ver Sección 3.

**Tercera ronda del mismo día (Secciones 2.1 y 4):**

7. **Confirmado con fuente independiente: la distorsión cambiaria de
   Malaui es real y enorme.** Wikipedia (citando datos de noviembre de
   2025) reporta una brecha de casi 148% entre el tipo de cambio
   oficial (1.734 MWK/USD) y el del mercado paralelo (4.300 MWK/USD) —
   la mayor distorsión cambiaria documentada en todo el proyecto,
   confirmando que el margen "favorable" de -9,58% de Mukuru en ese
   corredor (Sección 2.1) refleja una anomalía del propio país, no una
   ganga real. Ver Sección 2.1.
8. **Lulu Money resuelto — último de los cinco proveedores "amplios"
   pendientes desde v11.** Vía World Bank RPW (Kuwait→Egipto): margen
   de tipo de cambio 1,08%, costo total 3,39% — moderado, en el mismo
   rango que InstaReM/SBI Remit, no en el extremo alto de Xoom ni el
   extremo bajo de Global66. Ver Sección 4.

**Cuarta ronda del mismo día — consolidación general (Sección 5):**

9. **Tabla única de referencia para todos los proveedores "amplios" del
   proyecto**, recopilando datos de v10-v11 que no se habían vuelto a
   citar en v12-v15 junto con lo nuevo de esta sesión. Tres categorías
   quedan claras: margen bajo y consistente (InstaReM, Global66, SBI
   Remit, Wise), contaminación estructural confirmada sin forma de
   corregir (TransferGo, SingX), y margen alto/variable con datos
   concretos por corredor (Xoom, Mukuru, Lulu Money, Taptap Send,
   Sendwave). Ver Sección 5.
10. **Discrepancia menor detectada y documentada, no resuelta:** el
    corredor Sudáfrica→Zimbabue de Mukuru tiene dos mediciones
    distintas en el proyecto (v11: costo 10,28%-10,68%, margen
    0,35%-0,75%; v15: costo 9,81%, margen 0,32%) — cercanas pero no
    idénticas, probablemente por fechas de captura distintas. Ver
    Sección 5.1.

**Quinta ronda del mismo día (Sección 5.5):**

11. **Avance parcial sobre un pendiente viejo (v11, Sección 21.1):**
    el mecanismo económico detrás del costo negativo de Walmart2World
    en EEUU→México. No se confirmó la cifra exacta de reparto de
    comisión, pero se encontraron dos mecanismos concretos mejor
    sustentados que la hipótesis original: un diseño de marketplace
    competitivo (Ria y MoneyGram compiten por el tráfico de Walmart) y
    una tarifa plana negociada con la escala de retail de Walmart. Ver
    Sección 5.5.

**Sexta ronda del mismo día (Sección 5.3):**

12. **v14 confirmado cargado en Supabase** (commit `968109c`). La otra
    sesión de Claude reportó una inconsistencia entre las cifras de
    TransferGo del addendum v14 y lo que hay hoy en la base — se
    re-verificaron en vivo ambos corredores (Reino Unido→India,
    Polonia→Ucrania) y **las cifras del proyecto siguen siendo
    exactamente correctas**, sin cambios desde v11. La explicación más
    probable: TransferGo fue dejado sin tocar a propósito en la carga
    (por estar flageado como contaminado), así que la base retiene un
    valor anterior a la corrección metodológica — discrepancia
    esperable, no un error. Ver Sección 5.3.

**Séptima ronda del mismo día (Sección 6):**

13. **Argentina abierta como país de origen** (Argentina→España),
    cobertura delgada (2 proveedores). Global66 aparece con un margen
    de ~5,3% — muy por encima de su patrón habitual de margen casi
    nulo en Chile, Perú y México. Ver Sección 6.
14. **La hipótesis de controles de capital argentinos como explicación
    se investigó y se descarta en gran parte**: las restricciones para
    individuos fueron levantadas en abril de 2025, bastante antes de
    esta medición. El margen alto probablemente refleja riesgo
    cambiario genuino del peso argentino o la cobertura delgada del
    corredor, no un régimen de tipo de cambio múltiple — a diferencia
    de Malaui (Sección 2.1), donde la distorsión sí está activa hoy.
    Ver Sección 6.1.

**Octava ronda del mismo día (Sección 6.2):**

15. **Segundo corredor argentino (Argentina→Italia) confirma cuál
    explicación pesa más.** Da resultados casi idénticos a España
    (Global66: 5,28% en ambos) a pesar de tener bastante menos
    cobertura (646 vs. 1.659 comparaciones) — favorece la explicación
    de "riesgo cambiario del peso argentino" sobre la de "cobertura
    delgada/competencia", porque el margen no varía con la
    competencia del corredor. Ver Sección 6.2.

---

## 1. Brasil→Colombia: el patrón de MoneyGram se sostiene fuera de MERCOSUR

Corredor con cobertura razonable (4 proveedores, 2.515 comparaciones en
3 meses — el segundo más consultado de los cinco corredores brasileños
medidos, después de Bolivia). Datos para un envío de 1.500 BRL,
mid-market 1 BRL = 615,9086 COP (923.862,9 COP de referencia, tomado
del mismo snapshot que las tarjetas):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets (promo) | Recipient gets (real) | Costo total (real) |
|---|---|---|---|---|---|---|
| **MoneyGram** | Cuenta bancaria | Free | 608,2151 (promo) | 912.323 COP | **888.266 COP** | **3,85%** |
| Western Union | Cuenta bancaria | 15 BRL | 605,9146 | — (limpio) | 899.783 COP | **2,61%** |

**MoneyGram, identificado por URL (`go.monito.com/moneygram`), muestra
otra vez el patrón promocional de tasa** — mismo badge ("cero comisión
y/o tasa de cambio preferencial en tu primera transferencia") y misma
estructura de dos montos ya vista en Paraguay, Perú y Argentina. Usando
el monto real (888.266 COP), el costo de MoneyGram (3,85%) vuelve a ser
más alto que el de Western Union limpio (2,61%, identificado por el
texto distintivo "Over 10 million online customers" y confirmado por
URL `go.monito.com/western-union`).

**Este corredor es importante porque es el primero de Brasil que NO es
un vecino inmediato ni forma parte de MERCOSUR** (a diferencia de
Bolivia, Paraguay, Argentina) ni comparte la dolarización de El
Salvador — Colombia es un destino más lejano dentro de Sudamérica, con
su propia moneda (COP) y un mercado de remesas más grande y
competitivo en general. Que el mismo patrón (MoneyGram promocional,
Western Union gana corregido) se repita acá sugiere que **el patrón no
es específico de la relación bilateral Brasil-MERCOSUR, sino un
comportamiento más general de MoneyGram en corredores con origen
Brasil** — reforzando la recomendación ya hecha en v14 (Sección 3.4) de
tratar con sospecha cualquier insignia "cheapest"/"best deal" de
MoneyGram en corredores brasileños hasta corregir.

### 1.1 Estado consolidado de Brasil, 5 corredores

| Corredor | MoneyGram (dato) | Western Union (dato) | ¿Quién gana corregido? |
|---|---|---|---|
| Bolivia | 4,98% (limpio) | — (no comparado) | — |
| Paraguay | 5,71% (corregido) | 3,49% (limpio) | **Western Union** |
| Perú | 7,85% (corregido) | 2,84% (limpio) | **Western Union** |
| Argentina | 0,25%/-0,58% (corregido) | -3,42%/-3,95% (limpio) | **Western Union** (aunque MoneyGram corregido también queda barato) |
| Colombia | 3,85% (corregido) | 2,61% (limpio) | **Western Union** |

**En los 4 corredores donde hay comparación directa, Western Union
termina siendo más barato que MoneyGram una vez aplicada la
corrección** — el único corredor donde MoneyGram aparece "limpio" es
Bolivia, sin insignia promocional y sin dato de Western Union para
comparar. Esto es, hasta ahora, el patrón más consistente y mejor
documentado del proyecto sobre el comportamiento promocional de un
proveedor específico en una región de origen específica.

---

## 2. Mukuru: primer corredor concreto del proyecto, vía World Bank RPW

Mukuru viene catalogado desde v11 (junto con Xoom, TransferGo, SBI
Remit y Taptap Send) como uno de los proveedores "amplios" (presentes
en muchos corredores) de margen fuertemente variable — pero, a
diferencia de SBI Remit (resuelto en v14 Sección 5.2) y Taptap Send (con
varios corredores ya documentados), Mukuru nunca había tenido un
corredor con desglose numérico preciso en el proyecto, solo menciones
generales (ej. v11, España→República Dominicana, donde apareció como la
opción más cara entre los no-bancarios, 10,28%-10,68%, pero sin desglose
de fee vs. margen).

Se encontró un nodo de World Bank RPW específico para Mukuru,
**Sudáfrica→Botsuana** (dato con fecha del período jul-oct 2025):

| Monto enviado | Fee | Tipo de cambio | Margen FX | Costo total |
|---|---|---|---|---|
| 1.370 ZAR | 137,00 ZAR (10,0%) | 0,76 | **-0,25%** | **9,75%** |
| 3.410 ZAR | 307,00 ZAR (9,0%) | 0,76 | **-0,25%** | **8,75%** |

Método: transferencia a cuenta bancaria vía call center, pickup en
efectivo, entrega el mismo día, cobertura "alta" según RPW.

**Esto aclara, con datos concretos por primera vez, en qué consiste el
"margen variable" de Mukuru:** el margen de tipo de cambio en sí es
prácticamente nulo o levemente favorable (-0,25%, mejor que
mid-market) — el costo alto para el usuario (8,75%-9,75%) está
dominado casi enteramente por un **fee plano muy alto** (9-10% del
monto enviado). Este es un patrón distinto al de InstaReM/Global66/SBI
Remit (margen bajo Y fee bajo, costo total bajo) — Mukuru tiene margen
cambiario bajo pero fee alto, más parecido estructuralmente a Western
Union en los corredores de México (Sección 1 de v14) donde el fee
plano domina el costo total.

**Actualización (ronda 2): tres corredores más desde Sudáfrica,
confirmando y matizando el patrón.**

| Corredor (desde Sudáfrica) | Fee (sobre 1.370 ZAR) | Margen FX | Costo total |
|---|---|---|---|
| →Botsuana | 137 ZAR (10,0%) | -0,25% | 9,75% |
| →Zimbabue | 130 ZAR (9,5%) | 0,32% | 9,81% |
| →Zambia | 137 ZAR (10,0%) | 1,48% | 11,48% |
| →Malaui | 137 ZAR (10,0%) | **-9,58%** | **0,42%** |

**El fee plano de ~10% del monto enviado se confirma como el rasgo más
consistente de Mukuru** en los cuatro corredores — la variación real
está en el margen de tipo de cambio, que va de -0,25% a +1,48% en tres
de los cuatro casos (un rango típico, comparable al de otros
proveedores "amplios" del proyecto como Taptap Send). **Con este
patrón, el costo total de Mukuru queda dominado por el fee en casi
todos los casos — ronda los 9,75%-11,48%**, consistentemente alto
independientemente del destino, coherente con lo ya visto en v11
(España→República Dominicana, 10,28%-10,68%).

### 2.1 El caso de Malaui: un margen de -9,58% que probablemente no es una ganga real

El corredor Sudáfrica→Malaui rompe el patrón: un margen de tipo de
cambio de **-9,58%** (RPW reporta un tipo de cambio inter-bancario de
referencia de 226,40 ZAR/MWK contra un tipo de cambio efectivo de
Mukuru de 248,10 ZAR/MWK — es decir, Mukuru da casi 10% más MWK por ZAR
que la referencia "oficial"), que casi cancela el fee de 10% y deja un
costo total de apenas 0,42%, el más bajo medido en todo el corredor
sudafricano y de los más bajos del proyecto en general.

**Esto probablemente no es una ganga real de Mukuru, sino un reflejo de
que Malaui tiene un tipo de cambio oficial/de referencia que diverge
fuertemente del tipo de cambio de mercado** — un patrón conocido en
países con controles de cambio o regímenes de tasa múltiple. Esto es
conceptualmente parecido a los casos de controles de capital ya
documentados para China y Corea del Sur (v13, v14 Sección 2), aunque
acá la señal es indirecta (un margen calculado inusualmente favorable,
no una restricción de monto).

**Actualización (ronda 3): confirmado con fuente independiente.**
Wikipedia, citando datos de noviembre de 2025, reporta que el tipo de
cambio oficial de Malaui es de 1.734 MWK/USD, mientras que "en la
calle, los dólares estadounidenses pueden alcanzar una tasa de mercado
negro de 4.300 MWK/USD" — **una brecha de casi 148%** entre la tasa
oficial y la del mercado paralelo. El artículo también documenta la
historia reciente de devaluaciones oficiales del kwacha (34% en 2012,
25% en 2022, 44% en noviembre de 2023), consistente con presión
cambiaria sostenida en el país. **Esto confirma la hipótesis: el
margen de -9,58% de Mukuru no es una ganga real, sino un artefacto de
qué tasa "oficial"/de referencia usa RPW como mid-market** — si Mukuru
aplica una tasa más cercana a la realidad del mercado (o simplemente
distinta a la tasa oficial controlada) que la que RPW toma como
referencia "inter-bancaria", el margen calculado sale artificialmente
favorable sin que el usuario esté recibiendo necesariamente una tasa
mejor que la disponible en la calle. **Es, hasta ahora, la distorsión
cambiaria más grande documentada en todo el proyecto** — más severa
que los controles de capital de China (cuota de monto, no de tasa) o
Corea del Sur (límite de trámite, no de tasa); acá el problema es
específicamente que existen dos tasas de cambio muy distintas
operando al mismo tiempo en el mismo país. **Recomendación
metodológica confirmada:** cuando aparezca un margen de tipo de cambio
muy favorable y fuera de lo común, no asumir automáticamente que es
una buena noticia para el usuario sin verificar si el país de destino
tiene un régimen de tipo de cambio múltiple — el margen calculado
depende enteramente de qué tasa usa RPW/Monito como referencia
"mid-market", y esa referencia puede no reflejar la realidad del
mercado en países con esta clase de distorsión.

---

## 3. Xoom: resuelto vía World Bank RPW, el margen más alto medido hasta ahora entre los proveedores de referencia

Xoom (propiedad de PayPal) viene catalogado desde v11 junto con Mukuru,
TransferGo, SBI Remit y Taptap Send como proveedor "amplio" de margen
fuertemente variable, sin un corredor preciso documentado. Se encontró
un nodo de RPW para **Xoom, EEUU→Tailandia** (dato del 20 de agosto de
2025):

| Monto enviado | Fee | Tipo de cambio | Margen FX | Costo total |
|---|---|---|---|---|
| USD 200 | USD 4,99 (2,50%) | 31,02 THB/USD | **4,71%** | **7,21%** |
| USD 500 | USD 4,99 (1,00%) | 31,02 THB/USD | **4,71%** | **5,71%** |

**El margen de tipo de cambio de Xoom (4,71%) es, hasta ahora, el más
alto medido entre los proveedores de referencia del proyecto** — muy
por encima de InstaReM (-0,43% a 1,30%), Global66 (0,01% en 3 de 4
países), SBI Remit (0,09%) y también más alto que el de Mukuru en la
mayoría de sus corredores (-0,25% a 1,48%). A diferencia de Mukuru
(margen bajo, fee alto), **Xoom combina un margen de tipo de cambio
alto con un fee bajo** (USD 4,99 flat, apenas 1-2,5% del monto) — un
patrón de "costo escondido en el tipo de cambio, no en el fee visible",
el mismo mecanismo que el proyecto viene documentando como más difícil
de detectar para el usuario común (que suele fijarse en el fee, no en
el margen cambiario). **Esto confirma con datos concretos la reputación
de Xoom, un servicio de un actor grande y establecido (PayPal), de ser
más caro que la competencia fintech pura** — coherente con el patrón ya
visto en el proyecto de que los actores más grandes/establecidos no
siempre son más baratos, y a veces compensan un fee bajo con un margen
cambiario más alto.

---

## 4. Lulu Money: resuelto vía World Bank RPW — el último de los cinco proveedores "amplios" pendientes desde v11

Lulu Money (parte de Lulu Financial Holdings, un grupo grande de
Medio Oriente/Asia) era el último de los cinco proveedores "amplios"
catalogados en v11 (junto con Mukuru, Xoom, TransferGo y SBI Remit)
que seguía sin un corredor numérico preciso. Se encontró un nodo de
RPW para **Lulu Money, Kuwait→Egipto** (dato del período jul-sep 2025):

| Monto enviado | Fee | Margen FX | Costo total |
|---|---|---|---|
| KWD 65 / USD 200 | KWD 1,50 / USD 4,62 (2,31%) | **1,08%** | **3,39%** |

Dato disponible tanto para transferencia a cuenta bancaria como a
retiro en efectivo, con el mismo costo total en ambos casos. **El
margen de Lulu Money (1,08%) es moderado** — más alto que los casos de
referencia de margen casi nulo (InstaReM, Global66, SBI Remit, todos
por debajo de 0,1%-1,3%) pero muy por debajo del 4,71% de Xoom, y en la
misma liga que el margen "normal" de Mukuru en la mayoría de sus
corredores (0,32%-1,48%, excluyendo el caso distorsionado de Malaui).
El costo total (3,39%) es razonable para los estándares del proyecto —
ni un caso de referencia de margen bajo, ni un caso caro.

**Con esto, los cinco proveedores "amplios" catalogados en v11 quedan
todos con al menos un corredor numérico documentado:** Mukuru (4
corredores, Sección 2), Xoom (1 corredor, Sección 3), Lulu Money (1
corredor, acá), SBI Remit (resuelto en v14, Sección 5.2) y TransferGo
(cerrado como "contaminación estructural confirmada", v14 Sección 4,
sin margen numérico posible de extraer desde Monito). Es un buen punto
de cierre para esta línea de investigación específica — el próximo
paso natural, si se quiere seguir esta línea, sería replicar el mismo
método (buscar nodos de World Bank RPW) para proveedores que aparecen
en el catálogo del proyecto pero sin ningún dato preciso todavía, en
vez de seguir profundizando los mismos cinco.

---

## 5. Consolidación general: tabla única de proveedores "amplios" (margen variable por corredor)

Esta sección responde a la sugerencia dejada en el plan de la ronda
anterior — con los cinco proveedores "amplios" de v11 ya resueltos
(Sección 4), es un buen momento para juntar en un solo lugar los datos
que quedaron repartidos entre v10, v11 y v12-v15, la mayoría de los
cuales no se habían vuelto a mencionar desde que se generaron.

### 5.1 Margen alto/variable confirmado con datos concretos por corredor

| Proveedor | Corredores con dato real | Rango de margen FX | Rango de costo total | Fuente/sección |
|---|---|---|---|---|
| **Xoom** | Reino Unido→India, Italia→Ecuador, EEUU→México, EEUU→Tailandia | -0,24% a **4,71%** | — | v11 Sección 19.3; v15 Sección 3 |
| **Mukuru** | Sudáfrica→{Zimbabue, Mozambique, Botsuana, Zambia, Malaui} | -9,58%* a 1,48% (excluyendo Malaui: -5,08% a 1,48%) | 0,42%* a 11,48% (excluyendo Malaui: 4,01% a 11,48%) | v11 Secciones 11.2/13.1; v15 Sección 2 |
| **Lulu Money** | Kuwait→{Filipinas, India, Egipto} | 0,27% a 1,08% | — | v11 Secciones 15.2/17.2; v15 Sección 4 |
| **Taptap Send** | Reino Unido→{Nigeria, Ghana}, y cifras declaradas por país de origen (EEUU, RU, UE) | -0,83% a 1,80% | — | v10 Sección 1.2; v14 Sección 5.3 |
| **Sendwave** | EEUU→{Nigeria, Kenia} | 0,12% a 1,07% (1,30% en versión promocional) | — | v11 Secciones 1.1/5.1 |
| **SBI Remit** | Japón→Filipinas | 0,09% (un solo corredor resuelto) | 2,47%-4,33% | v14 Sección 5.2 |
| **TransferGo** | Reino Unido→India, Polonia→Ucrania, Reino Unido→Nigeria | 0,15%-2,12% (pisos optimistas, ver 5.2) | — | v12; v14 Sección 4 |

*El -9,58%/0,42% de Malaui está marcado con asterisco porque, a
diferencia del resto de la tabla, no refleja necesariamente el trato
real que recibe el usuario — es un artefacto de la brecha cambiaria
oficial/paralela del país (Sección 2.1). Se incluye por completitud
pero no debería usarse como "el mejor caso de Mukuru" sin esa
salvedad.

**Con esta tabla, dos cosas quedan más claras que mirando los casos por
separado:** (1) **Xoom y Mukuru son, con la evidencia actual, los dos
proveedores con el rango de margen más amplio del proyecto** (Xoom casi
5 puntos porcentuales entre su mejor y peor corredor, Mukuru más de 10
si se cuenta el caso de Malaui) — ninguno de los dos se puede
recomendar ni descartar en bloque, hay que mirar el corredor específico
cada vez. (2) **Taptap Send y Sendwave, a pesar de estar catalogados
como "amplios" desde hace varias rondas, en la práctica muestran rangos
bastante más acotados** (menos de 2,7 puntos porcentuales cada uno) que
Xoom o Mukuru — están más cerca, en términos de consistencia, de la
categoría de "margen bajo" (Sección 5.2) que de la de "margen
verdaderamente errático" — quizás merecerían una reclasificación en una
futura ronda de limpieza de categorías.

**Discrepancia detectada, no resuelta:** el corredor Sudáfrica→Zimbabue
de Mukuru aparece dos veces en el proyecto con cifras distintas — v11
(Sección 11.2, World Bank RPW) reportó costo total 10,28%-10,68% con
margen 0,35%-0,75%; v15 (Sección 2, también World Bank RPW) reportó
costo total 9,81% con margen 0,32%. Son cifras cercanas, no
contradictorias en la dirección del hallazgo, pero no idénticas —
probablemente reflejan capturas de RPW en fechas distintas (RPW
actualiza sus datos trimestralmente) más que un error de alguna de las
dos rondas. **No se investigó cuál de las dos fechas es más reciente**
— queda como nota metodológica: al cargar a Supabase, usar la cifra más
reciente si el timestamp está disponible, o marcar el campo como
`rango` en vez de un número único si no se puede determinar.

### 5.2 Margen bajo y consistente (proveedores de referencia)

| Proveedor | Corredores medidos | Rango de margen FX |
|---|---|---|
| **InstaReM** | 9 corredores (varios orígenes/destinos) | -0,43% a 1,30% |
| **Global66** | Chile, Perú, Colombia (excepción), México (2 corredores) | 0,01% en 3 de 4 países; Colombia con comisión plana 3-4% en vez de margen FX |
| **SBI Remit** | Japón→Filipinas | 0,09% |
| **Wise** | China→Filipinas, Japón (varios), y otros orígenes en rondas anteriores | ~0% (tipo de cambio mid-market real, solo fee explícito) |

Estos cuatro son los casos que el proyecto puede citar con más
confianza como "margen bajo" sin necesidad de aclarar por corredor —
aunque Global66/Colombia sigue siendo la excepción que impide
generalizar "Global66 siempre tiene margen bajo" sin matiz.

### 5.3 Contaminación estructural confirmada (sin forma de corregir desde Monito)

| Proveedor | Corredores | Mecanismo confirmado |
|---|---|---|
| **TransferGo** | Reino Unido→India, Polonia→Ucrania, Reino Unido→Nigeria | Texto explícito de Monito: "receiver bonus" incorporado a la tasa publicada |
| **SingX** | Hong Kong→Filipinas | Confirmado vía lectura del árbol de accesibilidad completo: nunca expone un segundo monto en ninguna parte del HTML |

A diferencia de los proveedores de la Sección 5.1, acá el problema no
es que el margen varíe — es que **no hay forma de saber cuál es el
margen real** desde la interfaz de Monito. Las cifras de TransferGo ya
cargadas en el proyecto (0,15% UK→India, 2,12% Polonia→Ucrania) deben
tratarse como pisos optimistas, no como el costo real recurrente.

**Actualización (ronda 6): re-verificación en vivo, en respuesta a una
inconsistencia reportada desde Supabase.** El usuario relayó una nota
de la otra sesión de Claude (la que carga los datos a Supabase): al
cargar v14, detectó que **el addendum v14 cita cifras de TransferGo que
no coinciden con lo que hay hoy en la base** — quedó documentada como
pendiente de auditoría, sin resolver, y **la otra sesión dejó
TransferGo y SingX sin tocar a propósito** en esa carga, precisamente
por estar flageados como "contaminados/sin dato limpio para
reemplazar" (una decisión correcta y coherente con la regla del
proyecto de nunca inventar ni sobreescribir con datos inciertos).

Para entender el origen de la discrepancia, se volvió a Monito y se
re-midieron en vivo los dos corredores:

| Corredor | Cifra ya citada en el proyecto (desde v11) | Cifra re-verificada hoy (ronda 6) | ¿Cambió? |
|---|---|---|---|
| Reino Unido→India | 0,15% peor que mid-market | 0,15% peor que mid-market (tipo de cambio 129,3886, 12.939 INR) | **No, idéntica** |
| Polonia→Ucrania | 2,12% peor que mid-market | 2,12% peor que mid-market (tipo de cambio 11,6709, 11.671 UAH) | **No, idéntica** |

**Las dos cifras son exactamente reproducibles, sin ningún cambio desde
que se midieron por primera vez (v11).** Esto descarta la hipótesis de
que la discrepancia se deba a que las tasas de Monito cambiaron con el
tiempo — las cifras del proyecto son correctas y estables. **La
explicación más probable de la discrepancia reportada por la otra
sesión es entonces la más simple: la base de Supabase todavía tiene un
valor de TransferGo anterior a la corrección metodológica de v11**
(posiblemente un dato cargado en una ronda muy temprana del proyecto,
antes de que se estableciera la regla de usar el monto real/bajo — ver
v8, donde TransferGo aparece solo con el margen publicitado "desde
0,5%", una cifra de marketing, no medida), **y ese valor viejo nunca se
sobreescribió porque, correctamente, se decidió no reemplazar un dato
antiguo con uno flageado como potencialmente optimista.** No es un
error de ninguna de las dos sesiones — es el resultado esperado de
aplicar la regla "nunca inventar/sobreescribir con datos inciertos" de
forma consistente en ambos sentidos. **Recomendación para una futura
carga:** si en algún momento se decide reemplazar el valor viejo de
TransferGo en Supabase, usar las cifras de esta tabla (reconfirmadas
hoy) pero mantener la advertencia de "piso optimista" en el campo de
notas/`verified_status`, no cargarlas como un dato limpio.

### 5.4 MoneyGram: caso aparte — contaminación promocional recurrente, pero corregible

MoneyGram no encaja en ninguna de las tres categorías anteriores:
muestra el patrón promocional de "doble monto" con mucha frecuencia
(Canadá, Australia, Nueva Zelanda — v11 Sección 31.2 — y 4 de 5
corredores de Brasil — v14-v15), pero, a diferencia de TransferGo/
SingX, **sí se puede corregir** — Monito muestra ambos montos (el
promocional y el real) en la misma tarjeta, solo hay que usar el más
bajo. Es el caso de contaminación más frecuente del proyecto en
términos de número de corredores afectados, pero el más fácil de
resolver en términos metodológicos.

### 5.5 Walmart2World: avance parcial sobre el mecanismo del costo negativo (sigue sin confirmarse del todo)

v11 (Sección 21.1) había encontrado un costo total negativo para
Walmart2World en EEUU→México (Sección 19.2 de ese archivo) sin poder
explicar el mecanismo económico — se dejó marcado como hipótesis
("loss leader para atraer tráfico a tiendas"), no como hallazgo, por
falta de una fuente pública que lo confirmara.

Esta ronda se buscaron fuentes adicionales sobre la relación comercial
entre Walmart y Ria/MoneyGram. Ninguna fuente encontrada revela la
cifra exacta de reparto de comisión o si existe un subsidio directo —
en ese sentido, **el pendiente de v11 sigue sin cerrarse del todo**.
Pero sí aparecieron dos mecanismos concretos, con cita directa de
fuentes de la industria de pagos (Payments Dive, Electronic Payments
International), que son explicaciones más específicas y mejor
sustentadas que la hipótesis original de "loss leader":

1. **Diseño de marketplace competitivo, no de proveedor único.**
   Según el VP de Walmart citado en el anuncio de la incorporación de
   Ria: *"La incorporación de Ria a Walmart2World, que crea una
   plataforma competitiva de tipos de cambio que creemos ayudará a
   entregar más valor, es simplemente el próximo paso en nuestro
   camino."* Es decir, Walmart no tiene un acuerdo exclusivo con un
   solo proveedor — pone a Ria y MoneyGram a competir directamente por
   el mismo tráfico de clientes en el mismo punto de venta, lo que
   presiona los precios hacia abajo por competencia genuina, no
   necesariamente por subsidio.
2. **Tarifa plana negociada con la escala de retail de Walmart.**
   Las fuentes describen el servicio como operando con *"una tarifa de
   transferencia plana y de bajo costo"* — una estructura más simple
   que el modelo de fee variable/escalonado típico de los proveedores
   por separado, consistente con la estrategia declarada de Walmart de
   "precios bajos todos los días" aplicada a este servicio. Walmart
   también comunica públicamente que sus clientes ahorraron
   "aproximadamente USD 1.000 millones en costos totales desde 2014" —
   una cifra de marketing, no una prueba del mecanismo, pero coherente
   con la dirección del hallazgo.

**Ninguno de los dos mecanismos requiere que Walmart subsidie
directamente las transferencias** (a diferencia de la hipótesis
original de "loss leader") — son explicaciones de "por qué el precio
puede ser genuinamente más bajo" vía competencia y escala, no de
"quién absorbe la pérdida". **Conclusión: avance parcial, no cierre.**
El pendiente de v11 se puede marcar como "parcialmente resuelto" en vez
de completamente abierto, pero seguiría faltando una fuente que
confirme la cifra real de reparto de comisión entre Walmart y sus
proveedores — esa cifra específica probablemente nunca se hace pública
por ser información comercial sensible entre las partes.

---

## 6. Argentina — nueva región de origen, con un margen alto para Global66 que NO se explica por controles de capital

Se abrió Argentina como país de origen vía Monito. Primer corredor:
**Argentina→España** (destino con fuerte vínculo migratorio histórico
con Argentina). Cobertura delgada: solo 2 proveedores, 1.659
comparaciones en 3 meses — comparable a México→Honduras (Sección 1 de
v14) en términos de escasez, aunque el destino (España) no es un país
de cobertura delgada en el resto del proyecto.

Datos para un envío de 100.000 ARS, mid-market 1 ARS = 0,000571 EUR
(57,10 EUR de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets | Costo total |
|---|---|---|---|---|---|
| **Global66** | Cuenta bancaria | Free | 0,000541 | 54,05 EUR | **~5,3%** |
| Western Union | Cash pickup | 5.000 ARS (5%) | 0,000541 | 51,43 EUR | **~9,9%** |

Ambos datos son limpios (sin insignia promocional, un solo monto cada
uno). **Global66 muestra acá, por primera vez en el proyecto, un
margen de tipo de cambio alto (~5,3%)** — muy por encima de su patrón
establecido de margen casi nulo (0,01%) en Chile, Perú y México (2
corredores), y también por encima de su único caso de comisión plana
conocido (Colombia, ~1,80% de costo total efectivo, v11 Sección 21.2).
De los 5 países de origen donde ahora se midió Global66, Argentina es,
por lejos, el de peor costo total para el usuario.

### 6.1 ¿Es esto un caso de controles de capital, como Malaui? Investigado y descartado en gran parte

Dado el patrón recién confirmado en Malaui (Sección 2.1) — un margen
FX inusual explicado por una distorsión cambiaria regulatoria — la
hipótesis obvia acá era que el conocido "cepo cambiario" argentino
explicara el margen alto de Global66. Se investigó con una fuente
independiente (Infobae, artículo del 11 de marzo de 2026, citando al
presidente del BCRA Santiago Bausili) y **la hipótesis se descarta en
gran parte**: **las restricciones cambiarias para individuos en
Argentina fueron levantadas en abril de 2025** — casi un año y medio
antes de esta medición (septiembre de 2026). Lo que queda de controles
hoy es selectivo y no afecta a remesas personales: restricciones para
inversores no residentes, y una prohibición de 90 días para quienes
compran dólares oficiales de operar en los mercados financieros
(MEP/CCL) — mecanismos de defensa del Banco Central, según el propio
Bausili, mientras se recupera el balance de la entidad, con un camino
declarado hacia "eliminar los controles administrativos" de forma
gradual.

**Esto es un resultado metodológicamente valioso aunque sea negativo:
no todo margen alto o inusual en un país de origen se explica por
controles de capital** — el proyecto ya tiene un patrón fuerte de
"cuando aparece algo raro, sospechar de una distorsión regulatoria"
(China, Corea del Sur, Malaui), y este corredor confirma que esa
sospecha hay que verificarla cada vez, no darla por sentada por
parecido superficial. **Explicaciones más probables para el margen
alto de Global66 en Argentina:** (a) el riesgo cambiario genuino de
operar en pesos argentinos, una moneda con una historia reciente de
alta inflación y volatilidad (que encarece el hedging para cualquier
proveedor, controles aparte), y/o (b) la cobertura delgada del
corredor (solo 2 proveedores) — con menos competencia, hay menos
presión para achicar el margen. **No se pudo determinar cuál de las
dos explicaciones pesa más** con los datos disponibles — quedaría para
una futura ronda, si se abre un segundo corredor argentino, ver si el
margen alto se repite (favoreciendo la explicación de volatilidad de
la moneda) o varía mucho (favoreciendo la explicación de cobertura
delgada/competencia).

### 6.2 Segundo corredor (Argentina→Italia): la explicación de volatilidad de la moneda gana

Se abrió un segundo corredor argentino, **Argentina→Italia**, elegido
por compartir el mismo vínculo migratorio histórico fuerte con
Argentina que España, pero con menos actividad en Monito (646
comparaciones contra 1.659 de España — más delgado). Datos para el
mismo envío de 100.000 ARS (mid-market 1 ARS = 0,000571 EUR, igual que
España porque ambos destinos usan EUR):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets | Costo total | (recordatorio: mismo dato en España) |
|---|---|---|---|---|---|---|
| **Global66** | Cuenta bancaria | Free | 0,000541 | 54,10 EUR | **~5,28%** | España: 54,05 EUR, ~5,28% |
| Western Union | Cash pickup | 5.000 ARS (5%) | 0,000541 | 51,40 EUR | **~5,27%** (margen FX) / ~9,9% total | España: 51,43 EUR, ~5,12%/~9,9% |

**Los dos corredores son prácticamente idénticos** — mismo tipo de
cambio aplicado por ambos proveedores (0,000541, sin importar si el
destino es España o Italia), mismo margen de Global66 (5,28% en los
dos), y montos recibidos casi iguales (54,05 vs. 54,10 EUR). **Esto
responde la pregunta dejada abierta en la Sección 6.1: si la cobertura
delgada/competencia fuera el factor principal, se esperaría que Italia
(646 comparaciones, bastante menos actividad) tuviera un margen peor
que España (1.659 comparaciones) — pero no lo tiene, son
prácticamente el mismo número.** Esto favorece con bastante claridad
la explicación de **riesgo cambiario genuino del peso argentino**: el
margen parece fijarse principalmente por el par de origen (ARS→EUR),
no por la competencia específica de cada corredor de destino — algo
coherente con cómo un proveedor gestionaría el riesgo: cubrirse contra
la volatilidad de la moneda que recibe (ARS), sea cual sea el destino
final en euros.

**Conclusión revisada de la Sección 6:** Argentina se suma al proyecto
como una región de origen con **margen consistentemente alto para
Global66** (~5,3% en dos corredores, muy por encima de su patrón
habitual en otros países), explicado con bastante confianza por el
riesgo cambiario del peso argentino más que por controles de capital
(descartados en 6.1) o por competencia/cobertura (descartado acá). Es
un caso interesante para el proyecto: **el mismo proveedor (Global66)
puede tener un perfil de "margen bajo y consistente" en algunos países
de origen y un perfil de "margen alto pero también consistente" en
otro** — la consistencia entre corredores es alta en ambos casos, lo
que cambia es el nivel, probablemente por el riesgo cambiario del país
de origen específico.

---

## 7. Plan sugerido para la próxima ronda

1. **Brasil parece estar llegando a un punto de rendimientos
   decrecientes** (5 corredores, patrón ya consistente y bien
   documentado) — buen candidato para dar por suficientemente
   explorado y pasar a otra línea, salvo que aparezca una razón
   específica para seguir (ej. un corredor con un proveedor distinto a
   MoneyGram/Western Union).
2. ~~Mukuru con un solo corredor medido.~~ **Hecho (Sección 2)** —
   ampliado a 4 corredores desde Sudáfrica (Botsuana, Zimbabue, Zambia,
   Malaui). Patrón confirmado: fee ~10% consistente, margen FX variable
   (-9,58% a +1,48%, con el caso de Malaui probablemente explicado por
   una distorsión cambiaria del propio país — Sección 2.1). Mukuru
   pasa a la categoría de casos bien documentados del proyecto.
3. ~~Buscar nodos de RPW para Xoom/Lulu Money.~~ **Hecho — ambos
   resueltos.** Xoom (Sección 3): margen 4,71%, el más alto medido
   entre los proveedores de referencia. Lulu Money (Sección 4, ronda
   3): margen 1,08%, moderado — Kuwait→Egipto vía RPW.
4. ~~Investigar si Malaui tiene una distorsión cambiaria regulatoria
   documentable.~~ **Hecho (Sección 2.1, ronda 3)** — confirmado con
   Wikipedia (datos de noviembre de 2025): brecha de casi 148% entre el
   tipo de cambio oficial (1.734 MWK/USD) y el del mercado paralelo
   (4.300 MWK/USD), la distorsión cambiaria más grande documentada en
   el proyecto. El margen "favorable" de -9,58% de Mukuru en ese
   corredor queda explicado como un artefacto de qué tasa de
   referencia usa RPW, no como una ganga real.
5. **Recordatorio para la carga a Supabase:** este archivo (v15) se
   suma a la cadena v6-v14 — Brasil→Colombia (Sección 1) es candidato
   directo, con la cifra ya corregida de MoneyGram (3,85%, no la
   promocional) — y los corredores de Mukuru (Sección 2, 4 países desde
   Sudáfrica — con nota de precaución sobre Malaui, Sección 2.1),
   Xoom (Sección 3, EEUU→Tailandia) y Lulu Money (Sección 4,
   Kuwait→Egipto) si el esquema de Supabase ya contempla esos países de
   origen.
6. ~~Los cinco proveedores "amplios" catalogados en v11 quedan todos con
   al menos un corredor numérico documentado.~~ **Hecho, y consolidado
   en una tabla única (Sección 5)** — junto con los casos de margen
   bajo (InstaReM, Global66, SBI Remit, Wise) y los de contaminación
   estructural (TransferGo, SingX). El proyecto ya cubrió 7 regiones de
   origen nuevas esta sesión (Nueva Zelanda, Hong Kong, Corea del Sur,
   Japón, China, México, Brasil).
7. **Nuevo pendiente, de baja prioridad:** determinar cuál de las dos
   mediciones de Mukuru Sudáfrica→Zimbabue (v11 vs. v15, Sección 5.1)
   es la más reciente — no es urgente porque ambas apuntan en la misma
   dirección, pero conviene resolverlo antes de cargar una cifra única
   a Supabase para ese corredor específico.
8. **Nuevo pendiente, de baja prioridad:** evaluar si Taptap Send y
   Sendwave (Sección 5.1) deberían reclasificarse de "margen
   fuertemente variable" a una categoría intermedia — sus rangos
   medidos (menos de 2,7 puntos porcentuales cada uno) son bastante más
   acotados que los de Xoom o Mukuru, y más parecidos en consistencia a
   los de la Sección 5.2 (margen bajo).
9. **Con la consolidación de proveedores hecha, los candidatos más
   naturales para una próxima ronda son de tres tipos:** (a) seguir con
   la lógica de "primer corredor concreto vía RPW" para algún proveedor
   del catálogo del proyecto que todavía no tenga ningún dato preciso
   (fuera de los ya resueltos); (b) abrir una región de origen nueva
   distinta a las 7 ya cubiertas esta sesión (el proyecto lleva un buen
   ritmo de una región nueva por ronda, pero convendría espaciarlas más
   dado el punto de rendimientos decrecientes de Brasil); o (c) una
   segunda pasada de consolidación, esta vez sobre las regiones de
   origen en vez de los proveedores (una tabla que resuma, por región,
   qué corredores están cubiertos y cuáles patrones se repiten).
10. ~~Walmart2World: mecanismo del costo negativo sin confirmar (v11,
    Sección 21.1).~~ **Avance parcial (Sección 5.5)** — dos mecanismos
    concretos encontrados (marketplace competitivo entre Ria/MoneyGram,
    tarifa plana por escala de retail), con cita directa de fuentes de
    la industria de pagos, pero sin la cifra exacta de reparto de
    comisión. Queda marcado como "parcialmente resuelto" — probable que
    nunca se cierre del todo por tratarse de información comercial no
    pública entre las partes. No requiere más esfuerzo salvo que
    aparezca una fuente nueva.
11. ~~Aclarar la inconsistencia de TransferGo reportada desde Supabase
    (v14 vs. base de datos).~~ **Aclarado (Sección 5.3, ronda 6)** — se
    re-verificaron en vivo los dos corredores y las cifras del proyecto
    (0,15% UK→India, 2,12% Polonia→Ucrania) siguen siendo exactamente
    correctas, sin cambios desde v11. La discrepancia se explica porque
    la otra sesión dejó TransferGo sin tocar a propósito en la carga de
    v14 (dato flageado como contaminado) — la base retiene un valor más
    viejo, probablemente pre-v11. No es un error de investigación; no
    requiere más acción de esta sesión, salvo que se decida en algún
    momento reemplazar el valor viejo de Supabase (usar la tabla de la
    Sección 5.3, con la advertencia de "piso optimista").
12. ~~Argentina abierta como país de origen, un solo corredor.~~
    **Ampliado a 2 corredores (Sección 6)** — España e Italia, ambos con
    Global66 en ~5,3% de margen. Investigado y descartado como caso de
    controles de capital (Sección 6.1).
13. ~~Segundo corredor argentino para ver cuál explicación pesa más.~~
    **Hecho (Sección 6.2)** — Argentina→Italia da prácticamente el
    mismo margen que España a pesar de tener bastante menos cobertura,
    lo que favorece con bastante confianza la explicación de "riesgo
    cambiario genuino del peso argentino" sobre la de "cobertura
    delgada/competencia". Argentina queda documentada como un caso de
    margen alto pero consistente para Global66 — un perfil distinto al
    de margen bajo que tiene en Chile/Perú/México, pero igual de
    predecible.
14. **Nuevo pendiente, de baja prioridad:** un tercer corredor argentino
    hacia un destino NO europeo (ej. Argentina→EEUU) confirmaría si el
    margen alto es específico del par ARS→EUR o se extiende a
    cualquier par de divisas con origen ARS — con dos corredores
    EUR-only, no se puede descartar del todo que el patrón sea
    específico de esa moneda de destino en particular.
15. **Recordatorio para la carga a Supabase:** este archivo (v15) es
    candidato para Brasil→Colombia (Sección 1), Mukuru (Sección 2, 4
    países desde Sudáfrica), Xoom (Sección 3), Lulu Money (Sección 4) y
    Argentina→España y Argentina→Italia (Sección 6, Global66 y Western
    Union, ambos corredores con datos limpios) — todos con cifra ya
    lista para cargar directamente.
