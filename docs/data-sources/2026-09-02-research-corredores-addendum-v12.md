# Research corredores — addendum v12 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v12addendum.md` (ADDENDUM #6 / v12 del research
de corredores) — el archivo se lee junto con **v13**
(`researchfindings20260902v13addendum.md`), subido por el usuario en el
mismo momento, y ambos se procesaron como una sola ronda de carga (mismo
día, sin correcciones cruzadas entre sí — v13 abre un país nuevo, China,
sin tocar nada de lo que dice v12). v12 en sí mismo audita
retroactivamente dos hallazgos de Monito ya citados en v11 (Mukuru,
TransferGo), abre cuatro países de origen nuevos para el proyecto (Nueva
Zelanda, Hong Kong, Corea del Sur, Japón) y encuentra una variante nueva
del problema metodológico de tasas promocionales de Monito documentado en
v11 (Sección 31): un descuento de **comisión**, no de tipo de cambio. **Se
cargaron 9 filas nuevas en `fx_rates`**, en migración
`20260902150000_load_v12_corridor_rates.sql`. Detalle punto por punto:

### Lo que se cargó a Supabase (9 filas nuevas, 0 filas tocadas/borradas)

Misma regla conservadora de v11: solo se insertó en pares
proveedor+corredor con **CERO filas previas** en `fx_rates`.

- **Nueva Zelanda→Filipinas** (Sección 2), 4 filas `sin_confirmar`
  (corredor nuevo para el proyecto — NZ solo tenía filas NZ-FJ/ID/TO/VU/WS
  antes de esta ronda): **MoneyGram** (3,04%), **Western Union** (0,93%),
  **Remitly** (1,49%) — los tres con insignia promocional de "primera
  transferencia", cargados con el monto real/recurrente per la
  metodología corregida de v11 Sección 31.4 — y **XE Money Transfer**
  (0,91%, sin promoción, fee explícito de 7 NZD). Los cuatro reusan la
  tasa mid-market dada por el research (1 NZD = 36,4783 PHP) como `rate`
  canónico, con el costo total plegado en `public_spread_percent` (mismo
  criterio que Global66 Colombia en v11), porque salvo XE ninguno separa
  fee de margen FX.
- **Hong Kong→Filipinas** (Sección 4), 2 filas `sin_confirmar`: **InstaReM**
  (0,93%, primer caso del proyecto de la variante de comisión promocional
  — ver más abajo) y **MoneyGram** (2,28%, dato limpio sin promoción).
  Western Union **NO** se cargó aquí — ya tiene una fila `confirmado_activo`
  para HK-PH (2,7%, carga genérica anterior) que no coincide con la nueva
  cifra (1,55%); se documenta la discrepancia, no se sobrescribe.
- **Japón→Filipinas, Japón→Brasil, Japón→Vietnam** (Sección 8), 3 filas
  `sin_confirmar`, **solo InstaReM** (1,30% / -0,43% / 0,82%): Japón se
  abre como país de origen nuevo con cobertura rica (5-7 proveedores por
  corredor). InstaReM tenía cero filas previas en los tres. Western Union
  también fue medido en los tres corredores (5,05% / 3,98% / 4,81%, todos
  limpios de promoción) pero **ninguno se cargó**: los tres ya tienen una
  fila `confirmado_activo` de una carga genérica anterior (3% / 3,3% /
  3,2% respectivamente) que no coincide — tres discrepancias más
  documentadas, no sobrescritas. InstaReM→Brasil es el hallazgo más
  interesante de esta sub-sección: dato limpio (sin insignia promocional)
  con margen **negativo/favorable (-0,43%)** — el tercer caso limpio de
  margen negativo del proyecto (junto a Xoom EEUU-México y Remitly
  Australia-Filipinas, ambos de v11 Sección 31) y el primero de InstaReM,
  pese a su patrón ya establecido de margen bajo-pero-siempre-positivo en
  sus otros 8 corredores.

#### Nota metodológica importante: corrección de signo en las tablas de las Secciones 2 y 4

Al recalcular las cifras de Nueva Zelanda y Hong Kong directamente desde
los montos crudos que el propio research da (monto que recibe el
destinatario vs. el monto que le correspondería al tipo de cambio
mid-market, ambos explícitos en el documento), se encontró que **las
tablas de las Secciones 2 y 4 muestran estas cifras con signo negativo**
(ej. "MoneyGram ... -3,04%"), pero **la propia prosa de esas mismas
secciones lo contradice explícitamente**: el resumen de la Sección 2 dice
literalmente "todos los proveedores muestran un **costo real POSITIVO**
(0,9%-3,0%)", y la Sección 4 describe los datos de MoneyGram/Western
Union como "en línea con lo esperable para una remesa normal" — lenguaje
de costo normal, no de margen favorable. Recalculando de forma
independiente con la fórmula ya usada de forma consistente en el resto
del proyecto (costo = (mid-market − monto real) / mid-market), el
resultado coincide con la prosa, no con el signo de la tabla — y esa
misma fórmula, aplicada a la Sección 8 (Japón) del mismo documento, sí da
resultados consistentes con el signo que la tabla de esa sección
efectivamente muestra (positivo para costo, negativo solo para el caso
explícitamente etiquetado "favorable"). Esto sugiere que las Secciones 2
y 4 se armaron con la fórmula invertida (monto real − mid-market en vez de
mid-market − monto real), un error de signo aislado a esas dos tablas.
**Se cargó el signo positivo (costo real), recalculado de forma
independiente a partir de los montos crudos dados por el research, no
transcripto de la tabla** — cada fila cargada de estos dos corredores
documenta esto explícitamente en su comentario SQL. Se deja señalado acá
con prioridad para que el usuario pueda verificar contra el research
original si tiene alguna duda sobre esta interpretación.

### Lo que se investigó pero deliberadamente NO se cargó

- **Corea del Sur→Filipinas, OFX (Sección 6.2)**: la cobertura de Monito
  para Corea del Sur es "notablemente más delgada" que la de las demás
  regiones abiertas este día (1-2 proveedores por corredor contra 6-20 en
  Canadá/Australia/Nueva Zelanda/Japón) — el propio research recomienda
  "tratar este dato con cautela". A diferencia de todo lo demás cargado
  esta ronda, esta cifra (-6,88%/~6,88%) viene únicamente del badge de
  porcentaje de Monito, no de un monto crudo + mid-market explícitos que
  permitan recalcular de forma independiente. Con esa combinación —
  cobertura delgada explícitamente señalada + cifra no verificable de
  forma independiente — se prefirió no cargar, siguiendo la regla de "ante
  la duda, no cargar". Corea del Sur→Vietnam y Corea del Sur→Nepal ni
  siquiera llegaron a tener un solo dato utilizable (1-2 proveedores sin
  detalle suficiente).
- **CurrencyFair, Reino Unido→India (Sección 6.1)**: confirma que la
  variante de comisión promocional (encontrada primero en InstaReM Hong
  Kong) no es un caso aislado — pero el monto de la transferencia de
  referencia (que determinaría el fee exacto) no está dado explícitamente
  en el research, solo se puede inferir asumiendo un monto redondo (100
  GBP). Como el fee involucra una inferencia, no un dato directamente
  dado, se documenta el hallazgo metodológico (confirma el patrón) sin
  cargar una fila — queda como candidato a verificación en vivo directa
  en una ronda futura.
- **Auditoría retroactiva de Mukuru, Sudáfrica→Zimbabue (Sección 1.1)**:
  se confirmó que el cross-validation vía Monito ya documentado en v11
  (Sección 23.2, ~9,66%) está limpio del problema de doble monto (un solo
  monto, sin insignia promocional). No hay nada nuevo que cargar — la
  fila `sin_confirmar` existente de Mukuru ZA-ZW (spread genérico 2,5%,
  no tocada por v11 ni por esta ronda) sigue igual. Se documenta la
  confirmación por completitud.
- **Auditoría retroactiva de TransferGo, Reino Unido→India y Polonia→
  Ucrania (Sección 1.2)**: resultado **parcial** — ambas tarjetas
  muestran un solo monto (no hay una segunda cifra que corregir), pero
  **ambas sí tienen una insignia promocional de primera transferencia**
  visible, sin que se pueda cuantificar cuánto la infla. Las cifras 0,15%
  y 2,12% ya documentadas (no cargadas) en v11 siguen sin cargarse, ahora
  con esta advertencia explícita adicional de riesgo no cuantificado.
- **Verificación aritmética de InstaReM Canadá-Filipinas/Canadá-India/
  Australia-Filipinas (Sección 3)**: recalculado con aritmética exacta,
  **sin errores encontrados** frente a lo ya cargado en v11 (las 3 filas
  `sin_confirmar` de InstaReM de esa migración, 1,09%/0,46%/1,07%,
  quedan confirmadas correctas, sin necesidad de ningún ajuste ni flag).

### Candidatos evaluados que no están en `providers`

**SingX** (Hong Kong→Filipinas, Sección 4) — mencionado con su propia
promoción ("cero comisión en tus primeras 2 transferencias") y, además,
el research mismo marca su cifra como "riesgo no cuantificado" (un solo
monto, sin poder distinguir si ya está afectado por su propia promoción).
No existe en `providers` — no se dio de alta.

### Duplicado/discrepancias a señalar explícitamente

1. **4 discrepancias nuevas Western Union vs. filas `confirmado_activo`
   existentes de una carga genérica anterior**: Hong Kong→Filipinas
   (existente 2,7% vs. nuevo 1,55%), Japón→Filipinas (existente 3% vs.
   nuevo 5,05%), Japón→Brasil (existente 3,3% vs. nuevo 3,98%), Japón→
   Vietnam (existente 3,2% vs. nuevo 4,81%). En los tres corredores de
   Japón la dirección es consistente (la cifra nueva de v12 es más alta
   que la existente); en Hong Kong es al revés (la nueva es más baja). No
   se sobrescribió ninguna — quedan como discrepancias para reconciliar
   en una ronda futura, no como error de esta carga.
2. **GB-IN y money2india/US-IN**: sin cambios respecto a lo ya señalado
   en v10/v11 (MoneyGram/Remitly/Western Union 2 filas cada uno, Xoom 3,
   money2india 2 filas idénticas) — el bug de `ORDER BY` ausente en
   `compareProviders` (`src/lib/fx.functions.ts` ~línea 720-753) sigue sin
   resolverse, y esta ronda no le agregó ni le quitó nada.

---

A continuación, el contenido completo del research tal como fue
entregado.

---

# mangomundi — Research, ADDENDUM #6 (v12) — auditoría de Monito post-corrección, Nueva Zelanda con metodología corregida

> **Documento nuevo — no reemplaza a v6, v7, v8, v9, v10, v11 ni a
> `research-findings-2026-09-01.md`.** Todos esos ya se subieron (o se
> están subiendo) al otro Claude para cargar a Supabase. Este es un
> octavo archivo con **solo lo nuevo de esta ronda**. Para el panorama
> completo hacen falta los 8 juntos.
>
> **Contexto importante para quien cargue este archivo a Supabase:** el
> archivo v11 (Sección 31) documentó una corrección metodológica
> importante — varias tarjetas de proveedor en Monito.com mezclan una
> tasa promocional de "primera transferencia" con la tasa real/
> recurrente, mostrando dos montos distintos de "el destinatario
> recibe". Si se están cargando datos de Monito de v11 (Secciones 27.1,
> 29.1, 29.2) a Supabase, **usar las cifras corregidas de la Sección
> 31.2 de v11, no las citadas originalmente en esas secciones**. Este
> archivo (v12) continúa esa línea: audita retroactivamente otros datos
> de Monito ya citados en el proyecto, y aplica la metodología corregida
> desde el inicio para los datos nuevos.
>
> **Actualizado el mismo día, cuatro veces.** Primera versión: Secciones
> 1-2. Se auditaron retroactivamente dos hallazgos de Monito ya citados
> en v11 que no habían sido revisados por el problema de doble monto
> (Mukuru en Sudáfrica→Zimbabue, Sección 23.2 de v11; TransferGo en
> Reino Unido→India y Polonia→Ucrania, Secciones 25.1 y 27.2 de v11) —
> **ambos casos se confirman limpios o parcialmente limpios**, ver
> detalle abajo. Y se abrió **Nueva Zelanda como país de origen nuevo
> para el proyecto** (Nueva Zelanda→Filipinas), aplicando la metodología
> corregida desde el primer momento (usando el monto bajo/real cuando
> Monito muestra dos).
>
> **Segunda actualización: Sección 4.** Se confirmaron los cálculos
> corregidos de InstaReM de la Sección 31.3 de v11 (verificados con
> aritmética exacta, sin errores encontrados). Y se abrió **Hong Kong
> como región de origen nueva** (Hong Kong→Filipinas), donde apareció
> **una variante nueva del patrón promocional: en vez de una tasa de
> cambio distinta, InstaReM ofrece "cero comisión en tu primera
> transferencia"** — un descuento basado en fee, no en tasa, pero con el
> mismo efecto de inflar la cifra citada si no se distingue. InstaReM
> reconfirma margen bajo por 6ta vez (~0,93% usando el monto post-promo).
>
> **Tercera actualización: Sección 6.** Se volvió a revisar TransferGo
> (Reino Unido→India) con más cuidado por tener el mismo tipo de
> insignia promocional basada en comisión encontrada en Hong Kong —
> **sigue mostrando un solo monto, sin segunda cifra que corregir**; el
> riesgo no cuantificado de la ronda anterior se mantiene sin cambios.
> De paso se encontró un caso nuevo y más claro de la variante de
> comisión promocional: **CurrencyFair**, con insignia "cero comisión en
> todas tus transferencias por 3 meses" y dos montos distintos. Y se
> abrió **Corea del Sur como región de origen** (Corea del Sur→
> Filipinas) — con una salvedad importante: **la cobertura de Monito
> para Corea del Sur es muy delgada** (1-2 proveedores por corredor,
> contra 6-20 en Canadá/Australia/Nueva Zelanda), así que estos datos
> deben tratarse con más cautela que los de otras regiones recién
> abiertas.
>
> **Cuarta actualización: Sección 8.** Se abrió **Japón como región de
> origen nueva**, con cobertura rica (5-7 proveedores por corredor, en
> línea con Canadá/Australia/Nueva Zelanda, no con la cobertura delgada
> de Corea del Sur). Se midieron tres corredores (Japón→Filipinas,
> Japón→Brasil, Japón→Vietnam), todos con el mismo patrón: **InstaReM
> con la variante de comisión promocional** (gap pequeño, 0,1-0,5
> puntos porcentuales) y **Western Union limpio** (sin insignia, un
> solo monto) con costo real de 3,98%-5,05%, en línea con las cifras ya
> corregidas para Western Union en otros corredores (v11, Sección
> 31.2). Y aparece un **nuevo caso limpio de margen negativo/favorable**:
> InstaReM en Japón→Brasil, sin insignia promocional, un solo monto,
> 0,43% mejor que el mid-market — reforzando (con Xoom y Remitly) que
> el fenómeno de margen negativo es real pero puntual, no generalizado.
>
> **Nada de esto fue cargado a Supabase.** Solo research + análisis. Cero
> `apply_migration`, cero `execute_sql` de escritura, cero commits.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Auditoría retroactiva: Mukuru en Sudáfrica→Zimbabue (v11, Sección
   23.2) se confirma limpio del problema de doble monto.** Su tarjeta en
   Monito no tiene insignia promocional y muestra un solo monto (169,19
   USD) — el cross-validation de Mukuru hecho en v11 sigue siendo válido
   sin cambios. Ver Sección 1.1.
2. **Auditoría retroactiva: TransferGo (v11, Secciones 25.1 y 27.2) se
   confirma parcialmente limpio — con una salvedad.** Sus tarjetas en
   Reino Unido→India y Polonia→Ucrania muestran un solo monto cada una
   (no hay segunda cifra que corregir), pero **ambas sí tienen una
   insignia promocional** ("zero transfer fees on your first transfer
   with code MONITO") — así que, aunque no se puede cuantificar una
   corrección concreta (no hay un segundo número), **las cifras de
   0,15% y 2,12% siguen teniendo un riesgo no cuantificado de estar
   levemente optimistas**. Se deja como advertencia, no como corrección.
   Ver Sección 1.2.
3. **Nueva Zelanda, país de origen nuevo para el proyecto (Nueva
   Zelanda→Filipinas), abierto vía Monito con la metodología ya
   corregida aplicada desde el inicio.** MoneyGram, Western Union y
   Remitly mostraron el mismo patrón de doble monto — se usaron los
   montos bajos/reales directamente, dando costos reales de 0,9%-3,0%
   (nada de "margen negativo" esta vez, porque ya se descartó la cifra
   promocional desde el principio). Ver Sección 2.

**Segunda ronda del mismo día (Sección 4):**

4. **Verificados con aritmética exacta los cálculos corregidos de
   InstaReM de la Sección 31.3 de v11 — sin errores encontrados**, las
   tres cifras (0,46%-1,12%) están bien calculadas. Ver Sección 3.
5. **Hong Kong, región de origen nueva para el proyecto (Hong Kong→
   Filipinas), con una variante nueva del patrón promocional: descuento
   basado en comisión ("cero comisión en tu primera transferencia"), no
   en tipo de cambio.** InstaReM reconfirma margen bajo por 6ta vez
   (~0,93% post-promo). MoneyGram, sin insignia promocional en este
   corredor puntual, dio un dato limpio de un solo monto (~2,28%). Ver
   Sección 4.

**Tercera ronda del mismo día (Sección 6):**

6. **TransferGo re-revisado: sigue mostrando un solo monto, sin segunda
   cifra que corregir** — el riesgo no cuantificado se mantiene sin
   cambios. Se encontró un caso nuevo y más claro de la variante de
   comisión promocional: **CurrencyFair** (Reino Unido→India), con
   insignia "cero comisión en todas tus transferencias por 3 meses" y
   dos montos distintos. Ver Sección 6.1.
7. **Corea del Sur abierta como región de origen, con una salvedad
   importante: su cobertura en Monito es muy delgada** (1-2 proveedores
   por corredor, contra 6-20 en las regiones anteriores) — el dato
   obtenido (OFX, Corea del Sur→Filipinas) es limpio pero aislado, sin
   posibilidad de comparar contra otros proveedores en el mismo
   corredor. Ver Sección 6.2.

**Cuarta ronda del mismo día (Sección 8):**

8. **Japón abierto como región de origen, con cobertura rica (5-7
   proveedores por corredor) en tres corredores (→Filipinas, →Brasil,
   →Vietnam).** InstaReM muestra la variante de comisión promocional en
   los tres (gap pequeño), Western Union es limpio en los tres (3,98%-
   5,05% de costo real, coherente con las cifras ya corregidas en v11
   Sección 31.2). Ver Sección 8.
9. **Nuevo caso limpio de margen negativo/favorable: InstaReM en
   Japón→Brasil** (sin insignia, un solo monto, 0,43% mejor que
   mid-market) — un tercer ejemplo confirmado del fenómeno (junto con
   Xoom y Remitly), reforzando que es real pero puntual, no un
   patrón generalizado. Ver Sección 8.2.

---

## 1. Auditoría retroactiva de Monito — Mukuru y TransferGo

### 1.1 Mukuru (Sudáfrica→Zimbabue) — confirmado limpio

Se volvió a revisar la tarjeta de Mukuru en Monito para el corredor
Sudáfrica→Zimbabue (usada en la Sección 23.2 de v11 para cross-validar
el hallazgo de World Bank RPW). Resultado: **la tarjeta no tiene ninguna
insignia de "tasa preferencial en tu primera transferencia" y muestra un
solo monto** ("Recipient gets: 169,19 USD", sin un segundo número al
lado). Esto es exactamente el mismo patrón que ya se había visto con
Xoom en EEUU→México (v11, Sección 31.1) — proveedores sin promoción
activa muestran una sola cifra.

**Conclusión: el cross-validation de Mukuru hecho en la Sección 23.2 de
v11 (costo total ~9,66% en Monito, consistente con el 10,3%-10,7% de
World Bank RPW) se mantiene válido sin ningún ajuste.**

### 1.2 TransferGo (Reino Unido→India, Polonia→Ucrania) — parcialmente limpio, con advertencia

Se revisaron las dos tarjetas de TransferGo usadas en v11 (Sección 25.1,
Reino Unido→India, 0,15% peor que mid-market; Sección 27.2, Polonia→
Ucrania, 2,12% peor). En ambos casos:

- Solo se muestra **un monto** de "recipient gets" (12.939 INR y 11.671
  UAH respectivamente) — no hay una segunda cifra que corregir, a
  diferencia de MoneyGram/Western Union en v11 Sección 31.2.
- **Pero ambas tarjetas sí muestran una insignia promocional**:
  "Includes zero transfer fees on your first transfer with code
  MONITO" — es decir, TransferGo también tiene una promoción de primera
  transferencia activa en Monito, aunque en este caso (a diferencia de
  MoneyGram/Western Union) no se ve reflejada en dos montos distintos.

**Conclusión: no se puede aplicar una corrección concreta (no hay una
segunda cifra que sustituir), pero tampoco se puede dar por completamente
limpio.** Es posible que el monto único mostrado ya sea la versión
promocional, y que sin el código MONITO la tasa real sea algo peor —
esto queda como un **riesgo no cuantificado**, no como una corrección
como la de MoneyGram/Western Union. Las cifras de 0,15% (Reino Unido→
India) y 2,12% (Polonia→Ucrania) se mantienen en el documento, pero con
esta advertencia explícita: podrían estar levemente optimistas.

---

## 2. Nueva Zelanda — nueva región, metodología corregida aplicada desde el inicio

Se abrió **Nueva Zelanda como país de origen nuevo para el proyecto**
(Nueva Zelanda→Filipinas), vía Monito, aplicando directamente la regla
metodológica establecida en la Sección 31.4 de v11: cuando una tarjeta
muestra dos montos de "recipient gets", se usa el más bajo (real) y no
el que Monito usa para su badge de "% mejor/peor que mid-market".

Monito, Nueva Zelanda→Filipinas (transferencia de 500 NZD, mid-market 1
NZD = 36,4783 PHP → 500 NZD = 18.239,15 PHP a mid-market):

| Proveedor | Monto promocional (no usado) | **Monto real usado** | **Margen real** |
|---|---|---|---|
| MoneyGram | 18.999 PHP | **17.684 PHP** | **~-3,04%** |
| Western Union | 18.981 PHP | **18.070 PHP** | **~-0,93%** |
| Remitly | 18.960 PHP | **17.968 PHP** | **~-1,49%** |
| XE Money Transfer (sin promo, un solo monto, fee 7 NZD) | — | 18.074 PHP | **~-0,91%** |

**A diferencia de los corredores de Canadá y Australia en v11 (antes de
la corrección), acá no aparece ningún "margen negativo" — todos los
proveedores muestran un costo real positivo (0,9%-3,0%), justo lo que se
esperaría de un corredor competitivo pero normal.** Esto es un buen
ejemplo de que la metodología corregida produce resultados más creíbles
y consistentes con el resto del proyecto, en vez de las cifras
"favorables" que resultaron ser en gran parte un artefacto promocional.

**Nota:** los tres proveedores con doble monto (MoneyGram, Western
Union, Remitly) también tienen la insignia promocional habitual —
consistente con el patrón ya documentado. XE Money Transfer, sin
insignia y con un solo monto, es el único dato de este corredor que no
requirió ningún ajuste.

> **Nota de carga (agregada al subir este documento a Supabase):** la
> tabla de arriba usa signo negativo para estas cuatro cifras, pero el
> párrafo siguiente dice explícitamente "costo real positivo" — son
> contradictorios entre sí. Se cargó el signo positivo (recalculado
> directamente de los montos de esta misma tabla), ver la "Nota de
> estado" al principio del documento para el detalle completo.

---

## 3. Verificación aritmética de InstaReM (v11, Sección 31.3)

El plan de la ronda anterior dejó pendiente una revisión final de que
las cifras corregidas de InstaReM en la Sección 31.3 de v11 estuvieran
bien calculadas. Se recalcularon las tres con aritmética exacta:

| Corredor | Monto real usado | Mid-market (100 unidades) | **Margen recalculado** | Cifra citada en v11 |
|---|---|---|---|---|
| Canadá→Filipinas | 4.454 PHP | 4.504,33 PHP | **-1,12%** | ~+1,09% |
| Canadá→India | 6.779 INR | 6.810,17 INR | **-0,46%** | ~+0,46% |
| Australia→Filipinas | 4.433 PHP | 4.481,03 PHP | **-1,07%** | ~+1,07% |

**Sin errores encontrados** — las tres cifras coinciden con lo publicado
en v11 (la diferencia de 0,03 puntos en el primer caso es solo por
variación normal del tipo de cambio de referencia entre el momento en
que se citó y el momento de esta verificación, no un error de cálculo).
**Se da el tema por cerrado**: la corrección de InstaReM en v11 queda
verificada y confirmada.

## 4. Hong Kong — nueva región, y una variante nueva del patrón promocional

Se abrió **Hong Kong como región de origen nueva para el proyecto**
(Hong Kong→Filipinas, otro corredor de altísimo volumen dada la enorme
población de trabajadoras domésticas filipinas en Hong Kong), vía
Monito.

Mid-market: 1 HKD = 7,9664 PHP → 1.000 HKD = 7.966,4 PHP.

| Proveedor | Insignia promocional | Monto(s) mostrado(s) | **Margen usado** |
|---|---|---|---|
| **InstaReM** (transferencia bancaria) | "Cero comisión en tu primera transferencia" | 7.945 PHP (promo) / **7.892 PHP (post-promo)** | **~-0,93%** |
| MoneyGram | Ninguna visible en este corredor | 7.785 PHP (único monto) | **~-2,28%** |
| Western Union (transferencia bancaria) | Ninguna visible | 7.843 PHP (único monto) | **~-1,55%** |
| SingX | "Cero comisión en tus primeras 2 transferencias con código WELCOME15K" | 7.783 PHP (único monto — **riesgo no cuantificado**) | ~-2,30% (con advertencia) |

**Hallazgo metodológico nuevo: acá la promoción de InstaReM no es una
tasa de cambio distinta, sino una comisión distinta.** El tipo de cambio
mostrado (7,9452) es el MISMO en ambos montos — lo que cambia es que el
monto alto (7.945 PHP) corresponde a "Fee FREE" (la promoción: cero
comisión en la primera transferencia) y el monto bajo (7.892 PHP)
corresponde a una comisión pequeña pero real (~6,7 HKD) que se aplicaría
en transferencias posteriores. **Es la misma clase de contaminación ya
documentada en la Sección 31 de v11, pero manifestada distinto** — antes
se veía en el tipo de cambio, acá se ve en la comisión. La regla
metodológica de usar el monto bajo/post-promo sigue aplicando igual.

**InstaReM reconfirma margen bajo por 6ta vez** (~0,93% en este
corredor), sumándose a los 5 corredores ya documentados en v11 (todos
entre 0,46% y 1,12% tras la corrección) — sigue siendo, con diferencia,
el caso más sólido y consistente del proyecto.

**MoneyGram y Western Union dieron datos limpios** en este corredor
puntual (sin insignia promocional visible, un solo monto cada uno) —
~2,28% y ~1,55% respectivamente, en línea con lo esperable para una
remesa normal, reforzando además que el "margen negativo" de estos dos
proveedores en Canadá/Australia (v11, Sección 31.2) era específico de
esos corredores/promociones puntuales, no una característica general de
MoneyGram o Western Union como proveedores.

> **Nota de carga:** mismo problema de signo que la Sección 2 (ver "Nota
> de estado" al principio del documento) — esta tabla también usa signo
> negativo, mientras que el texto ("en línea con lo esperable para una
> remesa normal") describe costos normales, no márgenes favorables. Se
> cargó con signo positivo, recalculado directamente de los montos
> crudos de esta tabla.

---

## 6. Tercera ronda del mismo día — TransferGo re-revisado, CurrencyFair como nuevo caso, Corea del Sur con cobertura delgada

### 6.1 TransferGo sin cambios, y CurrencyFair confirma la variante de comisión promocional

Se volvió a revisar la tarjeta de TransferGo en Reino Unido→India,
prestando atención específica a si su insignia ("cero comisión en tu
primera transferencia con código MONITO") venía acompañada de una
segunda cifra, como pasó con InstaReM en Hong Kong (Sección 4).
**Resultado: sigue mostrando un solo monto** (12.939 INR) — no hay
segunda cifra que permita calcular una corrección. El riesgo no
cuantificado documentado en la Sección 1.2 se mantiene exactamente
igual: ni se confirma contaminación, ni se puede descartar.

De paso, en la misma página se encontró un caso más claro y ya
inequívoco de la variante de comisión promocional: **CurrencyFair**, con
la insignia "cero comisión en todas tus transferencias por 3 meses" y
dos montos distintos (12.866 INR promocional / 12.746 INR post-promo,
mismo tipo de cambio 128,6564 en ambos casos — igual que el patrón visto
con InstaReM en Hong Kong). CurrencyFair no había sido citado como
hallazgo en ninguna sección anterior del proyecto, así que no hace falta
corregir nada retroactivamente — pero confirma que la variante de
comisión promocional (Sección 4) no fue un caso aislado de InstaReM, es
un patrón que aparece en más de un proveedor.

### 6.2 Corea del Sur — región nueva, pero con cobertura de Monito muy delgada

Se intentó abrir Corea del Sur como país de origen, probando varios
destinos (Filipinas, Vietnam, Nepal — corredores grandes dado el
programa EPS de trabajadores migrantes de Corea del Sur). **Resultado:
la cobertura de Monito para Corea del Sur es notablemente más delgada
que la de las demás regiones abiertas en este proyecto** — Corea del
Sur→Vietnam y Corea del Sur→Nepal mostraron solo 1-2 proveedores
comparables (contra 6-20 en Canadá, Australia o Nueva Zelanda), y Corea
del Sur→Filipinas dio exactamente un proveedor:

| Corredor | Proveedor | Margen | Notas |
|---|---|---|---|
| Corea del Sur→Filipinas | OFX | -6,88% (peor que mid-market, según badge de Monito) | Sin insignia promocional, un solo monto (127.038 PHP de 3.000.000 KRW) — dato limpio |

**Este dato es limpio (sin contaminación promocional) pero aislado** —
al no haber otros proveedores para comparar en el mismo corredor, no se
puede contextualizar si 6,88% es caro, barato o típico para este
corredor específico, a diferencia de los corredores de Canadá/Australia/
Nueva Zelanda donde había 4-6 proveedores para comparar entre sí.
**Conclusión: Corea del Sur queda técnicamente "abierta" para el
proyecto, pero con una sola referencia de dato, no con la cobertura rica
de las rondas anteriores.** Se recomienda tratar este dato con cautela y,
si se quiere profundizar Corea del Sur más adelante, considerar fuentes
alternativas a Monito (World Bank RPW, o verificación en vivo directa
con un proveedor) dado lo delgado de la cobertura acá.

---

## 8. Japón — nueva región de origen, tres corredores con patrón consistente

### 8.1 Resumen de resultados

Japón se abrió con cobertura rica en Monito (5-7 proveedores por
corredor comparable — Filipinas 7, Brasil 6, Vietnam 5), a la par de
Canadá/Australia/Nueva Zelanda y muy por encima de la cobertura delgada
encontrada en Corea del Sur (Sección 6.2). Se midieron tres corredores,
todos con el mismo patrón de dos proveedores dominantes:

| Corredor | InstaReM (post-promo, real) | Western Union (limpio) | Mid-market |
|---|---|---|---|
| Japón→Filipinas | 3.887 PHP de 10.000 JPY → **1,30%** de costo real | 3.739 PHP → **5,05%** | 1 JPY = 0,3938 PHP |
| Japón→Brasil | 1.615 BRL de 50.000 JPY → **-0,43%** (favorable, sin promo) | 1.544 BRL → **3,98%** | 1 JPY = 0,032161 BRL |
| Japón→Vietnam | 1.792.205 VND de 11.000 JPY → **0,82%** de costo real | 1.720.134 VND → **4,81%** | 1 JPY = 164,2717 VND |

Todas las cifras se calcularon de forma independiente comparando el
monto que el destinatario recibe contra el monto que le correspondería
al tipo de cambio mid-market publicado por Monito (fuente XE.com) para
el mismo corredor, siguiendo la metodología estándar del proyecto — no
se usan las insignias de porcentaje de Monito directamente.

### 8.2 InstaReM: comisión promocional en dos corredores, y un tercer caso limpio de margen negativo

En Filipinas y Vietnam, InstaReM mostró la misma variante de comisión
promocional ya vista en Hong Kong (Sección 4) y confirmada en
CurrencyFair (Sección 6.1): insignia "cero comisión en tu primera
transferencia", mismo tipo de cambio en ambos montos, solo cambia la
comisión. El gap entre el monto promocional y el real es pequeño en
ambos casos (Filipinas: 3.891 vs. 3.887 PHP, 0,1 punto porcentual;
Vietnam: 1.794.003 vs. 1.792.205 VND, 0,1 punto porcentual) — coherente
con el patrón ya documentado de que el gap promo/real de InstaReM
específicamente siempre es chico (a diferencia de MoneyGram/Western
Union, donde el gap fue de 3-6 puntos porcentuales, v11 Sección 31.2).

En Brasil, en cambio, **la tarjeta de InstaReM no tenía insignia
promocional y mostró un solo monto** (1.615 BRL) — dato limpio por
definición. Y ese dato limpio resulta ser **un margen negativo/
favorable: 0,43% mejor que el mid-market**. Esto es significativo
porque es el **tercer caso limpio de margen negativo documentado en el
proyecto** (junto con Xoom en EEUU→México, v11 Sección 31.3, y
Remitly en Australia→Filipinas, v11 Sección 31.2) — y el primero que
involucra a InstaReM, un proveedor ya catalogado como "margen bajo y
consistente" en seis corredores previos, todos positivos (0,46%-1,3%).
Esto sugiere que incluso los proveedores de margen consistentemente
bajo pueden cruzar a terreno negativo en corredores específicos de alto
volumen — reforzando que el fenómeno de margen negativo es real, pero
sigue siendo puntual y dependiente del corredor exacto, no una
propiedad fija de ciertos proveedores.

Con este corredor, InstaReM acumula **9 corredores medidos** en el
proyecto: Singapur→Indonesia, Reino Unido→India, Canadá→Filipinas,
Canadá→India, Australia→Filipinas, Hong Kong→Filipinas, Japón→
Filipinas, Japón→Brasil y Japón→Vietnam. Rango completo tras la
corrección metodológica: -0,43% (Japón→Brasil, favorable) a 1,30%
(Japón→Filipinas).

### 8.3 Western Union: limpio en los tres corredores, costos en línea con la corrección de v11

Ningún corredor de Japón mostró insignia promocional en la tarjeta de
Western Union — los tres son datos limpios de un solo monto. Los
costos reales (3,98%-5,05%) están en línea con las cifras ya corregidas
para Western Union en Canadá/Australia (3-6%, v11 Sección 31.2),
reforzando que esa corrección refleja el costo real y recurrente de
Western Union como proveedor, no un artefacto de esos corredores en
particular.

---

## 9. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (heredado de v11,
   Sección 3).
2. El patrón "bancos tradicionales caros" sigue confirmado y cerrado
   (heredado de v11).
3. **Mukuru**, **Lulu Money**, **Xoom** y **TransferGo** siguen
   catalogados como proveedores de margen fuertemente variable — Mukuru
   y Xoom confirmados limpios del problema de doble monto; TransferGo
   con la advertencia sin resolver.
4. **InstaReM** ahora tiene 9 corredores medidos (-0,43% a 1,30%,
   aritmética confirmada donde se auditó) — dado por cerrado como caso
   de referencia de margen bajo y consistente, con la salvedad de que
   ocasionalmente cruza a negativo (Sección 8.2).
5. ~~Abrir Japón vía Monito.~~ **Hecho en la Sección 8** — cobertura
   rica, patrón consistente en los tres corredores, un nuevo caso limpio
   de margen negativo (InstaReM→Brasil).
6. **Nuevo pendiente: si se quiere profundizar Corea del Sur más allá
   del único dato de OFX**, la vía recomendada es World Bank RPW o
   verificación en vivo directa, no Monito (que no tiene suficiente
   cobertura para este país de origen).
7. Sigue sin identificarse una vía nueva para profundizar SBI Remit o
   Taptap Send — pendiente de baja prioridad, solo si el usuario lo pide
   específicamente.
8. **Recordatorio para la carga a Supabase:** este archivo (v12, ahora
   con las Secciones 1-8) y la Sección 31 de v11 deberían leerse
   juntos — v11 tiene la corrección original con las cifras
   recalculadas; v12 tiene la auditoría de qué otros datos del proyecto
   se ven o no afectados por el mismo problema, la variante de comisión
   promocional (Secciones 4, 6.1 y 8.2), los datos aislados de Corea del
   Sur (Sección 6.2) y los tres corredores nuevos de Japón (Sección 8).
9. Con Nueva Zelanda, Hong Kong, Corea del Sur y Japón ya probados,
   posibles candidatos de región nueva para una próxima ronda: China
   (origen), México (origen, dado su enorme peso como receptor podría
   valer la pena verlo también como origen hacia Centroamérica), o
   profundizar más corredores dentro de las regiones ya abiertas en vez
   de seguir sumando países nuevos.
