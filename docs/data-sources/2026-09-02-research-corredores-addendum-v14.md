# Research corredores — addendum v14 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v14addendum.md` (ADDENDUM #8 / v14 del research
de corredores) — se suma a la cadena v6-v13, no reemplaza a ninguno.
Abre **México** y **Brasil** como países de origen nuevos (vía Monito),
resuelve la pregunta pendiente de v13 sobre si Corea del Sur tiene una
restricción de cambio como China (sí, pero más leve y en proceso de
flexibilizarse en 2026), cierra dos casos "pendientes" de larga data
(SBI Remit y la auditoría retroactiva de promedios agregados de Monito),
y confirma SingX como segundo caso de "contaminación estructural"
(junto con TransferGo) — proveedores cuya tasa mostrada en Monito nunca
puede aislarse de un elemento promocional/bono, sin forma de corregir
desde la interfaz.

Este documento sigue aplicando la corrección metodológica de v11
(Sección 31) sobre tasas promocionales de Monito: donde una tarjeta
mostró un segundo monto "real" además del promocional (MoneyGram en
Brasil→Paraguay/Perú/Argentina), la carga a Supabase usa el monto
corregido, nunca el promocional.

### Lo que se cargó a Supabase

Pendiente de completar por el agente que ejecute la carga — ver
migración correspondiente en `supabase/migrations/` y el resumen que
se agregue a esta sección al finalizar. Candidatos identificados por el
research (Sección 6, plan sugerido, punto 16):

- **México** (4 corredores, todos datos limpios sin insignia
  promocional): México→Guatemala (Global66 0,01% margen FX / 3,07%
  costo total; Western Union cuenta bancaria 6,09%, cash pickup 8,94%),
  México→Honduras (Paysend 4,62% costo total confirmado por URL;
  Western Union 10,80%), México→El Salvador (Paysend 5,06%; Western
  Union cuenta bancaria 11,02%, cash pickup 13,72%), México→EEUU
  (Global66 0,01% margen FX / 6,04% costo total; Western Union cuenta
  bancaria 10,78%, cash pickup 13,41%).
- **Brasil** (4 corredores — usar cifras YA CORREGIDAS, no las
  promocionales, para MoneyGram): Brasil→Bolivia (MoneyGram, dato
  limpio, 4,98%), Brasil→Paraguay (MoneyGram corregido 5,71% — más caro
  que Western Union limpio 3,49%), Brasil→Perú (MoneyGram corregido
  7,85% — más caro que Western Union limpio 2,84%), Brasil→Argentina
  (MoneyGram corregido 0,25% cash pickup / -0,58% cuenta bancaria;
  Western Union limpio -3,42% cash pickup / -3,95% cuenta bancaria,
  ambos favorables).
- **Taptap Send, Reino Unido→Ghana** (fuente World Bank RPW, margen
  1,03%, sin fee).
- **SBI Remit, Japón→Filipinas** (fuente World Bank RPW, margen
  cambiario 0,09% — resuelve la inconsistencia de tasa pendiente desde
  la ronda anterior; fee ¥720 para envíos de ¥17.000, ¥1.000 para
  ¥42.000).

### Proveedores marcados como "contaminación estructural confirmada" (no cargar su tasa de Monito tal cual)

- **TransferGo**: Monito confirma por escrito ("Total includes Central
  Bank of Nigeria rate and receiver bonus from TransferGo") que su tasa
  siempre incluye un bono no cuantificable — las cifras ya cargadas de
  TransferGo (UK→India 0,15%, Polonia→Ucrania 2,12%) deben tratarse como
  pisos optimistas, no como costo real recurrente.
- **SingX**: confirmado en esta ronda (vía árbol de accesibilidad
  completo de la página) que nunca expone un segundo monto — no es una
  limitación de herramienta, es un límite real de la interfaz de Monito
  para este proveedor.

### Nota metodológica transversal (relevante para research futuro, no solo para este documento)

Los promedios agregados "costo total más bajo (promedio)" que Monito
muestra en el FAQ/estadísticas de cada corredor **no son confiables**
— en Brasil→Bolivia ese promedio mostraba -21,3%, sin relación con
ningún dato de tarjeta en vivo (que mostraba 4,98%, positivo). El
proyecto ya solo usa datos de tarjeta en vivo con desglose de fee/tipo
de cambio, nunca esos promedios — una auditoría retroactiva de v6-v13
confirmó que ningún uso previo de "promedio" en el proyecto usó ese
número contaminado.

---

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #8 (v14) — México como origen (con Global66 en un 4to país), y el paralelo Corea del Sur/China en controles de cambio

> **Documento nuevo — no reemplaza a v6-v13 ni a
> `research-findings-2026-09-01.md`.** El usuario ya le pasó v13 y el
> documento de recomendaciones sobre discrepancias (AG6) a la otra
> sesión de Claude. Este es un décimo archivo con **solo lo nuevo de
> esta ronda**. Para el panorama completo hacen falta los 10 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** sigue
> aplicando la corrección metodológica de v11 (Sección 31) sobre tasas
> promocionales de Monito — los dos hallazgos nuevos de esta ronda son
> limpios (sin insignia promocional, un solo monto cada uno).
>
> **Actualizado el mismo día, cinco veces — la tercera con investigación
> de mayor alcance, varias líneas en paralelo, la cuarta consolidando y
> verificando lo abierto en la tercera, y la quinta cerrando los dos
> pendientes de más larga data del documento (SBI Remit y la auditoría
> de promedios agregados) más un cuarto corredor de Brasil.** Primera
> versión: se abrió
> **México como país de origen nuevo** vía Monito, con dos corredores
> hacia Centroamérica (Guatemala, Honduras) — y apareció **Global66 en
> un cuarto país de origen**, reforzando su patrón ya documentado de
> margen bajo. Y se investigó si **Corea del Sur** tiene una
> restricción de cambio de divisas que explique su cobertura delgada en
> Monito (v12, Sección 6.2), la misma pregunta que se resolvió para
> China en v13 — resultado: **sí, hay una restricción real, aunque
> menos severa que la de China y en proceso de flexibilizarse
> justamente este año.**
>
> **Segunda actualización: Secciones 1.2 y 1.3.** Se confirmó con
> certeza (por URL, no por inferencia) que el proveedor más barato en
> México→Honduras es **Paysend**, resolviendo la duda que había quedado
> abierta en la primera versión. Y se completó el Triángulo Norte con
> **México→El Salvador**, el tercer corredor — mismo patrón que
> Guatemala y Honduras: Western Union sistemáticamente el más caro
> (11,02% cuenta bancaria, 13,41% cash pickup), Paysend varias veces más
> barato (4,92%, corregido a 5,06% en la tercera ronda).
>
> **Tercera actualización — investigación de mayor alcance, cuatro
> líneas en paralelo (Secciones 1.4, 3 y 4):** (1) se cerró México con
> el corredor inverso, México→EEUU, con Global66 otra vez casi a
> mid-market. (2) Se completó el desglose de Paysend en El Salvador que
> había quedado pendiente. (3) **Se abrió Brasil como región de origen
> nueva** (Bolivia, Paraguay) — con un nuevo caso confirmado de
> MoneyGram mostrando el patrón promocional de tasa, y un hallazgo
> metodológico importante: los promedios agregados que Monito muestra
> en sus FAQ ("costo total más bajo") pueden estar muy contaminados por
> promociones (un caso extremo de -21,3% que no coincide con ningún
> dato real de tarjeta) — el proyecto nunca debe usar esos promedios,
> solo los datos de tarjeta en vivo, como ya era la práctica. (4) **Se
> probó un tercer corredor de TransferGo y se encontró la explicación
> textual de por qué nunca muestra un segundo monto**: Monito confirma
> por escrito que su tasa ya incluye un "receiver bonus" — el riesgo no
> cuantificado de TransferGo pasa a ser una contaminación estructural
> confirmada. De paso, el mismo corredor (Reino Unido→Nigeria) mostró el
> patrón de doble monto en Western Union, Remitly y MoneyGram
> simultáneamente.
>
> **Cuarta actualización — cierre y verificación (Secciones 4.1 y 5):**
> se confirmó por URL individual la identificación de los tres
> proveedores del hallazgo de Reino Unido→Nigeria (Sección 4.1). Se
> cerró **SingX** como segundo caso, después de TransferGo, de
> "contaminación estructural confirmada, sin forma de corregir desde
> Monito" — ya no es un límite de herramienta, es un límite real de la
> interfaz de Monito. **Se abrió un tercer corredor de Brasil**
> (Brasil→Perú), reforzando el patrón de MoneyGram promocional ya visto
> en Paraguay. Y se hizo avance parcial en dos proveedores pendientes de
> hace varias rondas: **SBI Remit** (fee schedule real encontrado por
> primera vez, margen cambiario todavía sin resolver por una
> inconsistencia de fecha en la fuente) y **Taptap Send** (nuevo
> corredor limpio vía World Bank RPW, Reino Unido→Ghana).
>
> **Quinta actualización — dos pendientes cerrados y un cuarto corredor
> de Brasil (Secciones 3.4 y 5.2, Plan items 13-14):** se encontró la
> fuente primaria correcta para **SBI Remit** (World Bank RPW, no un
> blog) que resuelve por completo la inconsistencia de tasa que venía
> arrastrando desde la ronda anterior — margen real 0,09%, otro caso de
> margen bajo como InstaReM y Global66. Se completó también la
> **auditoría retroactiva de promedios agregados** (Plan item 13,
> pendiente desde la ronda 3): revisando todos los usos de "promedio" en
> v6-v13, ninguno resultó ser el número contaminado de Monito, todos son
> promedios propios calculados sobre datos de tarjeta — auditoría
> cerrada sin hallazgos. Y se abrió **Brasil→Argentina**, cuarto
> corredor de Brasil: un caso nuevo de MoneyGram con el patrón
> promocional, pero en un corredor genuinamente hipercompetitivo donde,
> a diferencia de Paraguay/Perú, la corrección no invierte el resultado
> (MoneyGram sigue barato incluso corregido) — Western Union termina
> siendo el más barato, con costos reales negativos (favorables).

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v13, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **México abierto como país de origen, vía Monito, en dos corredores
   hacia Centroamérica** (México→Guatemala, México→Honduras). Ver
   Sección 1.
2. **Global66 aparece en México→Guatemala con margen casi nulo (0,01%
   de margen FX, ~3,07% de costo total, dominado por un fee plano) —
   su cuarto país de origen confirmado en el proyecto** (después de
   Chile, Perú, y como contraste con Colombia, que sí tiene una
   comisión plana del 3-4%). Ver Sección 1.1.
3. **Se resolvió la pregunta pendiente de v13 sobre Corea del Sur:**
   sí existe una restricción de cambio de divisas para individuos (un
   sistema de bancos designados con límites de USD 50.000-100.000
   anuales sin trámite), pero **menos severa que la de China** (no hay
   un tope duro que requiera permiso gubernamental para superarlo) y
   además **se está flexibilizando exactamente este año (2026)** — el
   gobierno surcoreano anunció que a partir de 2026 cualquier entidad
   financiera podrá tramitar hasta USD 100.000 anuales sin
   documentación, eliminando el sistema de "banco designado" que hasta
   ahora limitaba a los no-bancos (como los fintechs de remesas) a
   USD 50.000. Ver Sección 2.

**Segunda ronda del mismo día (Secciones 1.2 y 1.3):**

4. **Confirmado con certeza: el proveedor más barato en México→
   Honduras es Paysend** (antes marcado "sin confirmar" por una
   limitación de extracción de texto plano — resuelto leyendo el árbol
   de accesibilidad de la página). Ver Sección 1.2.
5. **México→El Salvador, tercer y último corredor del Triángulo Norte
   desde México: mismo patrón que Guatemala y Honduras.** Western Union
   el más caro (11,02% cuenta bancaria, 13,41% cash pickup), Paysend el
   más barato (4,92%). Con los tres corredores completos, el patrón
   "WU caro, el proveedor más barato varía pero siempre cuesta un
   tercio-mitad de WU" queda establecido como consistente en todo el
   Triángulo Norte desde México. Ver Sección 1.3.

**Tercera ronda del mismo día — investigación de mayor alcance (Secciones 1.4, 3 y 4):**

6. **México→EEUU, corredor inverso: Global66 con el mismo margen FX
   casi nulo (0,01%) que en Guatemala.** Cross-validación interna útil:
   el dato de Western Union coincide casi exactamente con el de El
   Salvador (dolarizado, mismo par de divisas). Ver Sección 1.4.
7. **Brasil abierto como región de origen** (Bolivia, Paraguay). En
   Paraguay, **MoneyGram muestra el patrón promocional de tasa
   cambiaria** — costo real corregido 5,71%, más caro que Western Union
   limpio (3,49%) una vez corregido. Ver Sección 3.
8. **Hallazgo metodológico: los promedios agregados "costo total más
   bajo" que Monito muestra en el FAQ de cada corredor no son
   confiables** — en Brasil→Bolivia ese promedio decía -21,3%, un
   número que no coincide con ningún dato de tarjeta en vivo. Refuerza
   la práctica ya establecida del proyecto de usar solo datos de
   tarjeta, nunca esos promedios. Ver Sección 3.1.
9. **TransferGo: se encontró la explicación de por qué nunca muestra un
   segundo monto.** Monito confirma por escrito, en un tercer corredor
   (Reino Unido→Nigeria), que la tasa de TransferGo ya incluye un
   "receiver bonus" — el riesgo no cuantificado pasa a ser una
   contaminación estructural confirmada, no solo una sospecha por
   ausencia de datos. Ver Sección 4.
10. **De paso, el mismo corredor (Reino Unido→Nigeria) mostró el patrón
    de doble monto simultáneamente en Western Union, Remitly y
    MoneyGram** — los tres, incluso corregidos, dan costos muy bajos o
    favorables, posiblemente porque es uno de los corredores de remesas
    más grandes y competitivos del mundo. Ver Sección 4.1.

**Cuarta ronda del mismo día — cierre y verificación (Secciones 4.1 y 5):**

11. **Identificación por URL confirmada para los tres proveedores del
    hallazgo de Reino Unido→Nigeria** (Western Union, Remitly,
    MoneyGram) — mismo nivel de certeza que Paysend/Global66 en México.
    Ver Sección 4.1.
12. **SingX (Hong Kong→Filipinas) confirmado como segundo caso de
    "contaminación estructural"**, junto con TransferGo — nunca muestra
    un segundo monto, y ahora está verificado que no es una limitación
    de la herramienta de lectura sino de la propia interfaz de Monito.
    Ver Sección 5.1.
13. **Brasil→Perú, tercer corredor de Brasil**: MoneyGram otra vez con
    el patrón promocional de tasa (real 7,85%, corregido desde un monto
    promocional más bajo), Western Union más barato una vez corregido
    (2,84%) — ya son 2 de 3 corredores brasileños donde Western Union
    gana después de la corrección. Ver Sección 3.3.
14. **SBI Remit: primer fee schedule real del proyecto para este
    proveedor** (1,40%-1,98% según monto y destino, vía un blog
    independiente), aunque el margen cambiario sigue sin poder
    calcularse por una inconsistencia de fecha en la cotización fuente.
    **Taptap Send: nuevo corredor limpio** (Reino Unido→Ghana, 1,03% de
    margen, sin fee, vía World Bank RPW). Ver Sección 5.2 y 5.3.

**Quinta ronda del mismo día — dos pendientes cerrados (Secciones 3.4 y 5.2):**

15. **SBI Remit resuelto por completo: margen cambiario real 0,09%**,
    vía la fuente primaria correcta (World Bank RPW, no el blog citado
    la ronda anterior) — se suma a InstaReM y Global66 como caso de
    margen bajo bien documentado. Ver Sección 5.2.
16. **Auditoría retroactiva de promedios agregados de Monito
    completada, sin hallazgos** — se revisaron todos los usos de
    "promedio" en v6-v13 y ninguno usó el número contaminado de Monito;
    todos son cálculos propios del proyecto sobre datos de tarjeta en
    vivo. Plan item 13 (pendiente desde la ronda 3) queda cerrado.
17. **Brasil→Argentina, cuarto corredor de Brasil**: MoneyGram otra vez
    con el patrón promocional, pero en un corredor hipercompetitivo
    donde corregir no invierte el resultado — Western Union termina
    siendo el más barato, con costos reales negativos (favorables al
    usuario) tanto en cuenta bancaria como en cash pickup. Notable
    también porque el propio promedio agregado de Monito para este
    corredor sí resultó cercano a la realidad (a diferencia de
    Brasil→Bolivia) — un recordatorio de que la contaminación de esos
    promedios no es universal, así que la metodología del proyecto
    (nunca confiar en ellos sin verificar) sigue siendo la correcta. Ver
    Sección 3.4.

---

## 1. México — nueva región de origen, cuatro corredores (Triángulo Norte completo + corredor inverso)

### 1.1 México→Guatemala: Global66 confirma su patrón en un cuarto país

Corredor con cobertura razonable (4 proveedores comparables). Datos para
un envío de 2.000 MXN, mid-market 1 MXN = 0,4494 GTQ (898,80 GTQ de
referencia):

| Proveedor | Método | Fee | Tipo de cambio | Margen FX | Recipient gets | Costo total |
|---|---|---|---|---|---|---|
| **Global66** | Cuenta bancaria | 60 MXN | 0,4491 | **0,01%** | 871,18 GTQ | **3,07%** |
| Western Union | Cuenta bancaria | 100 MXN | 0,4442 | 1,09% | 844,03 GTQ | 6,09% |
| Western Union | Cash pickup | 100 MXN | 0,4308 | 4,09% | 818,45 GTQ | 8,94% |

Todos los datos son limpios — ninguna tarjeta mostró insignia
promocional ni un segundo monto.

**Global66 vuelve a mostrar prácticamente el tipo de cambio mid-market
real** (0,4491 contra 0,4494 de referencia, apenas 0,01% de margen) —
casi todo el costo para el usuario es el fee plano de 60 MXN, no un
margen cambiario oculto. Esto es coherente con el patrón ya establecido
para Global66 en Chile y Perú (margen bajo/nulo) y contrasta con
Colombia (donde Global66 cobra una comisión plana del 3-4%, un caso
atípico ya documentado y sin explicación concluyente en v11). **Con
México, Global66 ya tiene 4 países de origen medidos: Chile, Colombia,
Perú y ahora México — 3 de 4 con margen bajo/nulo, Colombia sigue
siendo la única excepción clara.**

De paso, se confirma otra vez que **Western Union cobra distinto según
el método de entrega dentro del mismo corredor** (cuenta bancaria 6,09%
vs. cash pickup 8,94%) — un patrón ya visto varias veces en el
proyecto (el cash pickup casi siempre sale más caro que la cuenta
bancaria para WU), no una anomalía puntual de este corredor.

### 1.2 México→Honduras: corredor con cobertura más delgada, WU caro por fee

Solo 3 proveedores comparables. Datos para un envío de 1.000 MXN,
mid-market 1 MXN = 1,5800 HNL (1.580 HNL de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Margen FX | Recipient gets | Costo total |
|---|---|---|---|---|---|---|
| Western Union | Cuenta bancaria | 100 MXN | 1,5660 | 0,86% | 1.409 HNL | 10,80% |
| **Paysend** | Card | 20 MXN | 1,5376 | 2,66% | 1.507 HNL | 4,62% |

**Actualización (ronda 2): el segundo proveedor se confirmó como
Paysend** — en la ronda anterior quedó marcado como "sin confirmar con
certeza" por una limitación de la extracción de texto plano de Monito.
Se resolvió leyendo directamente el árbol de accesibilidad de la página
(en vez de solo el texto plano): el link "Go to Paysend"
(`go.monito.com/paysend?...&po=bank...`) aparece inmediatamente después
del bloque "Transferred to a card" — confirmación directa por URL, no
por inferencia de posición. Aunque Paysend tiene peor margen FX que
Western Union en este corredor (2,66% vs. 0,86%), su fee mucho más bajo
(20 MXN vs. 100 MXN) hace que el costo total termine siendo menos de la
mitad (4,62% vs. 10,80%) — otro caso, coherente con el resto del
proyecto, de que el fee plano suele pesar más que el margen cambiario
en montos de envío chicos.

Este corredor tiene una cobertura más delgada que Guatemala (3
proveedores contra 4, y solo 323 comparaciones en 3 meses contra 377) —
no tan delgada como Corea del Sur o China, pero tampoco tan rica como
Japón/Canadá/Australia/Nueva Zelanda. Otro caso de **WU cobrando un fee
plano alto (100 MXN, 10% del monto enviado)** que domina el costo
total, un patrón consistente con lo ya visto en otros corredores de
Western Union esta sesión (Japón, Hong Kong).

### 1.3 México→El Salvador: se completa el Triángulo Norte, mismo patrón

Corredor con la cobertura más rica de los tres (4 proveedores, 875
comparaciones en 3 meses — más del doble que Guatemala y Honduras).
Datos para un envío de 1.000 MXN, mid-market 1 MXN = 0,058899 USD
(58,899 USD de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Margen FX | Recipient gets | Costo total |
|---|---|---|---|---|---|---|
| Western Union | Cuenta bancaria | 100 MXN | 0,058231 | 1,15% | 52,41 USD | 11,02% |
| Western Union | Cash pickup | 100 MXN | 0,056466 | 4,15% | 50,82 USD | 13,72% |
| **Paysend** | Card | 20 MXN | 0,057061 | 3,14% | 55,92 USD | 5,06% |

**Actualización (ronda 3): desglose completo de Paysend ya
confirmado.** En la ronda anterior el monto final (56 USD, redondeado)
era confiable pero no se pudo abrir el detalle de fee/tipo de cambio
por una limitación de interacción con la pestaña "Card". Se resolvió
leyendo directamente el árbol de accesibilidad completo de la página
(en vez de depender de que la pestaña esté visualmente activa): los
tres paneles (cuenta bancaria, cash pickup, card) están presentes en el
HTML simultáneamente, solo uno se muestra a la vez — así que se pudo
extraer el desglose exacto de Paysend sin necesidad de que el click
funcionara. Cifra final más precisa: 55,92 USD (no 56 USD redondeado),
5,06% de costo total (no 4,92%, una corrección menor). De paso también
se completó el desglose de Western Union en cash pickup.

**Con los tres corredores del Triángulo Norte completos desde México
(Guatemala, Honduras, El Salvador), aparece un patrón consistente:**
Western Union es sistemáticamente el proveedor más caro en cuenta
bancaria (6,09%-11,02%) y más caro todavía en cash pickup cuando está
disponible (8,94%-13,41%), mientras que el proveedor más barato en cada
corredor —que varía (Global66 en Guatemala, Paysend en Honduras y El
Salvador)— siempre termina costando entre un tercio y la mitad de lo
que cuesta Western Union. Ninguno de los tres corredores mostró
insignia promocional en ninguna tarjeta — los tres son datos limpios.

### 1.4 México→EEUU: el corredor inverso, con Global66 otra vez casi a mid-market

Corredor con, por lejos, el mayor volumen de todo el proyecto en
Monito (15.587 comparaciones en 3 meses — más de 10x cualquier otro
corredor mexicano medido). Datos para un envío de 1.000 MXN, mid-market
1 MXN = 0,058898 USD (58,898 USD de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Margen FX | Recipient gets | Costo total |
|---|---|---|---|---|---|---|
| **Global66** | Cuenta bancaria | 60 MXN | 0,058872 | 0,01% | 55,34 USD | 6,04% |
| Western Union | Cuenta bancaria | 100 MXN | 0,058384 | 0,84% | 52,55 USD | 10,78% |
| Western Union | Cash pickup | — | — | — | 51 USD | 13,41% |

Todos los datos son limpios. **Global66 reconfirma su patrón de tipo de
cambio casi exactamente igual al mid-market** (0,058872 contra 0,058898
de referencia, 0,01% de margen FX — idéntico al margen encontrado en
México→Guatemala) — el costo para el usuario vuelve a estar
prácticamente todo concentrado en el fee plano, no en el tipo de
cambio. Con este corredor, Global66 ya tiene el mismo margen FX (0,01%)
en sus dos corredores probados desde México, un nivel de consistencia
llamativo.

**Dato curioso de cross-validación:** el monto de cash pickup de
Western Union (51 USD) es prácticamente idéntico al de México→El
Salvador (Sección 1.3, también 51 USD/50,82 USD) — tiene sentido, ya
que El Salvador está oficialmente dolarizado (usa USD como moneda
oficial), así que México→El Salvador y México→EEUU son, en términos de
par de divisas, el mismo corredor (MXN→USD). Que Western Union produzca
resultados casi idénticos en ambos confirma que los datos de Monito son
internamente consistentes — no es un error, es el mismo producto
subyacente aplicado a dos "países destino" distintos en la
clasificación de Monito.

---

## 2. Corea del Sur: sí hay una restricción de cambio, pero distinta a la de China

En v13 (Sección 1.2) se encontró que China limita las transferencias
personales al exterior a ~USD 50.000/año con permiso obligatorio de
SAFE para montos mayores, y se dejó como pregunta abierta si Corea del
Sur (cuya cobertura en Monito también es delgada, v12 Sección 6.2)
tiene una restricción parecida.

**Respuesta: sí, pero con matices importantes.** Según Korea Times (8
de diciembre de 2025), el sistema surcoreano histórico tenía dos
niveles:

- **Bancos "designados"**: hasta USD 100.000 anuales sin trámite.
- **Otras entidades financieras** (empresas de valores, tarjetas de
  crédito, bancos de ahorro — la categoría donde caerían la mayoría de
  los fintechs de remesas): limitadas a **USD 50.000 anuales** sin
  documentación.

Esto es distinto de China en un punto clave: **no hay un tope duro que
requiera permiso gubernamental para superarlo** (a diferencia de la
cuota SAFE china) — es más bien un límite de "sin trámite", superable
con más papeleo. Pero **sí explicaría por qué los fintechs de remesas
(no-bancos) podrían tener una posición estructuralmente más débil en
el mercado surcoreano** que en países sin esa distinción — el límite
más bajo (USD 50.000 vs. USD 100.000) aplicaba justo a la categoría de
proveedor que domina Monito en el resto del proyecto.

**Dato temporal importante: esto se está flexibilizando ahora mismo.**
El gobierno surcoreano anunció que **a partir de 2026 elimina el
sistema de "banco designado"** y permite que cualquier tipo de entidad
financiera tramite hasta USD 100.000 anuales sin documentación —
citando como motivos mejor supervisión (vía un nuevo sistema integrado
de remesas al exterior), eficiencia y conveniencia. Como este anuncio
es de diciembre de 2025 y habla de "el año que viene", el cambio
debería estar ya vigente o por entrar en vigencia en el momento en que
se escribe este documento (septiembre de 2026).

**Conclusión para el proyecto:** la cobertura delgada de Corea del Sur
en Monito probablemente sí tiene una explicación regulatoria parcial
(no tan severa como China, pero real) — y, a diferencia de China, **es
un caso donde la restricción se está levantando activamente este año**,
así que vale la pena volver a chequear la cobertura de Corea del Sur en
Monito en unos meses: si la flexibilización de 2026 tiene efecto en el
mercado, debería aparecer más oferta de proveedores en ese corredor con
el tiempo.

---

## 3. Brasil — nueva región de origen, y un nuevo caso de MoneyGram con contaminación promocional

Se abrió Brasil como país de origen vía Monito, con dos corredores
hacia países vecinos con fuerte migración regional (MERCOSUR): Bolivia
y Paraguay.

### 3.1 Brasil→Bolivia: dato limpio, MoneyGram

Datos para un envío de 1.500 BRL, mid-market 1 BRL = 2,3813 BOB
(3.571,95 BOB de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets | Costo total |
|---|---|---|---|---|---|
| MoneyGram | Cash pickup | 20 BRL | 2,2935 | 3.394 BOB | 4,98% |

Dato limpio (sin insignia promocional, un solo monto).

**Nota metodológica importante:** la página de este corredor muestra en
su sección de FAQ/estadísticas un dato agregado de **"costo total más
bajo (promedio): -21,3%"** — un margen negativo extremo, muy por fuera
de cualquier cosa vista en el proyecto hasta ahora. Este número **no
coincide con ningún dato de la tarjeta en vivo** (que muestra 4,98% de
costo real, positivo) — es casi con certeza un promedio calculado sobre
30 días que en algún momento capturó una promoción puntual muy agresiva
de algún proveedor, sin que Monito lo distinga de una tarifa recurrente
en ese resumen agregado. **Esto refuerza, con un ejemplo extremo, por
qué la metodología del proyecto usa siempre los datos de la tarjeta en
vivo (con desglose de fee y tipo de cambio) y nunca los promedios
agregados de "menor costo" que Monito muestra en sus FAQ/estadísticas
de cada página — esos promedios pueden estar contaminados por
promociones sin ninguna forma de detectarlo desde afuera.**

### 3.2 Brasil→Paraguay: nuevo caso confirmado de MoneyGram con el patrón promocional (variante de tasa)

Datos para un envío de 1.500 BRL, mid-market 1 BRL = 1.159 PYG
(1.738.500 PYG de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets (promo) | Recipient gets (real) | Costo total (real) |
|---|---|---|---|---|---|---|
| **MoneyGram** | Cash pickup | Free | 1108 (promo) | 1.661.894 PYG | **1.639.140 PYG** | **5,71%** |
| Western Union | Cash pickup | 20 BRL | 1134 | — (limpio) | 1.677.810 PYG | 3,49% |

**MoneyGram muestra acá la variante de tasa cambiaria del patrón
promocional** (no la variante de fee vista en InstaReM/CurrencyFair) —
la insignia dice "cero comisión y/o tasa de cambio preferencial en tu
primera transferencia", y en efecto hay dos montos distintos con tasas
de cambio distintas detrás (aunque el texto de la tarjeta solo imprime
explícitamente la tasa promocional, 1108 — la tasa real implícita en el
segundo monto es más baja). Identificado por URL (`go.monito.com/
moneygram`), confirmando que el segundo monto corresponde al mismo
proveedor, no a uno distinto.

Usando el monto corregido (1.639.140 PYG), el costo real de MoneyGram
(5,71%) termina siendo **más caro que Western Union limpio (3,49%)** en
este corredor — un caso más donde la corrección invierte cuál proveedor
parece más barato, coherente con lo ya visto en v11 Sección 31.2 para
Canadá/Australia.

**MoneyGram acumula ahora múltiples corredores confirmados con el
patrón promocional** (Canadá, Australia, Nueva Zelanda — v11 Sección
31.2 — y ahora Brasil→Paraguay), reforzando que es, junto con Western
Union, uno de los dos proveedores donde este patrón aparece con más
frecuencia en el proyecto.

### 3.3 Brasil→Perú: tercer corredor, mismo patrón que Paraguay

Datos para un envío de 1.000 BRL, mid-market 1 BRL = 0,6600 PEN (660
PEN de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets (promo) | Recipient gets (real) | Costo total (real) |
|---|---|---|---|---|---|---|
| **MoneyGram** | Cash pickup | Free | 0,6326 (promo) | 632,60 PEN | **608,20 PEN** | **7,85%** |
| Western Union | Cuenta bancaria | 15 BRL | 0,6510 | — (limpio) | 641,28 PEN | 2,84% |

Otra vez MoneyGram con el patrón promocional de tasa (confirmado por
URL: `go.monito.com/moneygram`), y otra vez Western Union termina más
barato una vez corregido (2,84% contra 7,85%). **Con Perú, ya son 2 de
3 corredores de Brasil donde Western Union le gana a MoneyGram después
de la corrección** (Bolivia fue el único corredor donde MoneyGram
apareció limpio, sin insignia) — un patrón consistente que vale la pena
tener en cuenta: **las insignias "cheapest" de Monito para MoneyGram en
corredores desde Brasil probablemente están sesgadas por la tasa
promocional**, no reflejan el costo recurrente real.

### 3.4 Brasil→Argentina: cuarto corredor, corredor genuinamente hipercompetitivo (costos reales bajos o favorables incluso corregidos)

Datos para un envío de 1.000 BRL, mid-market 1 BRL = 293,4800 ARS
(293.480 ARS de referencia, tomado del mismo snapshot que las tarjetas):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets (promo) | Recipient gets (real) | Costo total (real) |
|---|---|---|---|---|---|---|
| **MoneyGram** | Cash pickup | Free | 299,0497 (promo) | 299.050 ARS | 292.745 ARS | 0,25% |
| **MoneyGram** | Cuenta bancaria | Free | 305,7871 (promo) | 305.787 ARS | 295.191 ARS | **-0,58%** (favorable) |
| Western Union | Cash pickup | 20 BRL | 309,7225 | — (limpio) | 303.528 ARS | **-3,42%** (favorable) |
| Western Union | Cuenta bancaria | 15 BRL | 309,7225 | — (limpio) | 305.077 ARS | **-3,95%** (favorable) |

MoneyGram vuelve a mostrar el patrón promocional de tasa (badge "cero
comisión y/o tasa de cambio preferencial en tu primera transferencia",
confirmado por URL — `go.monito.com/moneygram` — en ambos métodos de
entrega), igual que en Paraguay y Perú. Pero a diferencia de esos dos
corredores, acá **la corrección no revierte el resultado**: incluso
usando el monto real/bajo, MoneyGram sigue siendo barato (0,25% cash
pickup, -0,58% cuenta bancaria) — simplemente Western Union es todavía
más barato. Western Union, con datos limpios (un solo monto, sin
insignia) en ambos métodos, termina siendo la opción más barata del
corredor, con costos reales negativos (favorables al usuario) tanto en
cash pickup como en cuenta bancaria.

**Coherente con el propio resumen agregado de Monito para este
corredor** ("Cheapest provider (on average): Western Union"; "Lowest
total cost (on average): -4,6%") — a diferencia del caso de Brasil→
Bolivia (Sección 3.1), acá el número agregado de Monito sí queda cerca
de lo que se calculó de forma independiente a partir de las tarjetas en
vivo (-3,42% a -3,95% para Western Union). **Esto no cambia la
metodología del proyecto** (seguir usando siempre datos de tarjeta en
vivo, nunca el agregado, porque no hay forma de saber de antemano si el
agregado de un corredor dado va a ser confiable como acá o estar
contaminado como en Bolivia) — pero es un dato interesante: la
contaminación de los promedios agregados de Monito no es universal, a
veces coincide con la realidad y a veces no, lo cual hace que confiar en
ellos sin verificar sea, en cualquier caso, una mala práctica.

**Con Argentina, Brasil ya tiene 4 corredores medidos**: uno limpio sin
patrón promocional (Bolivia), dos donde la corrección invierte cuál
proveedor es más barato (Paraguay, Perú — MoneyGram corregido pierde
frente a Western Union), y uno donde la corrección no cambia el
resultado pero sí achica la ventaja aparente de MoneyGram (Argentina).
En los 4, Western Union termina siendo competitivo o directamente el
más barato una vez aplicada la corrección — reforzando que las
insignias "cheapest"/"best deal" de Monito para MoneyGram en corredores
desde Brasil deben tratarse siempre con sospecha hasta corregir.

---

## 4. TransferGo: nueva evidencia sobre el "riesgo no cuantificado" — confirmación textual de Monito, no solo ausencia de un segundo monto

Desde v12 (Sección 1.2), TransferGo viene marcado con un riesgo no
cuantificado: sus tarjetas en Monito siempre muestran una insignia
promocional pero nunca un segundo monto, así que no se podía calcular
una corrección concreta (a diferencia de InstaReM/CurrencyFair/
MoneyGram, que sí muestran dos montos). Esta ronda se probó un tercer
corredor — **Reino Unido→Nigeria** — y apareció **una pista nueva y más
concreta**: la tarjeta de TransferGo incluye el siguiente texto,
visible en el HTML de la página aunque no siempre se renderiza de forma
prominente: **"Total includes Central Bank of Nigeria rate and receiver
bonus from TransferGo"** ("El total incluye la tasa del Banco Central
de Nigeria y un bono para el destinatario de parte de TransferGo").

Esto **confirma, con las propias palabras de Monito, que el número
único que TransferGo muestra ya tiene un "bono" (léase: elemento
promocional) incorporado directamente en la tasa de cambio publicada**
— no es que falte un segundo monto por casualidad, es que TransferGo
estructuralmente nunca expone la tasa sin el bono en esta interfaz. Con
esto, el corredor confirma el mismo patrón que Reino Unido→India y
Polonia→Ucrania (v12): insignia promocional presente, un solo monto,
sin forma de aislar la cifra real desde la interfaz de Monito.

**Cambio de estatus recomendado:** con tres corredores independientes
mostrando exactamente el mismo comportamiento, y ahora con confirmación
textual explícita de Monito sobre el mecanismo (un "receiver bonus"
incorporado a la tasa), el flag de TransferGo pasa de "riesgo no
cuantificado, quizás" a **"contaminación confirmada estructuralmente,
magnitud desconocida"** — las cifras de 0,15% y 2,12% ya cargadas en el
proyecto (UK→India, Polonia→Ucrania) deberían tratarse como pisos
optimistas, no como el costo real recurrente, hasta que se consiga una
fuente alternativa (la propia app de TransferGo, o su fee schedule
público) que muestre la tasa sin bono.

### 4.1 Nota adicional: el mismo corredor (UK→Nigeria) mostró el patrón en otros tres proveedores grandes

De paso, en la pestaña de cash pickup de este mismo corredor aparecieron
**Western Union, Remitly y MoneyGram, los tres con el patrón de doble
monto** (insignia de tasa/comisión preferencial en la primera
transferencia). Usando los montos corregidos (mid-market de referencia:
100 GBP = 179.300 NGN):

| Proveedor | Recipient gets (real) | Costo total (real) |
|---|---|---|
| Western Union | 175.716 NGN | 2,00% |
| Remitly | 184.916 NGN | **-3,13%** (favorable) |
| MoneyGram | 179.164 NGN | 0,08% (prácticamente a mid-market) |

**Los tres, incluso después de la corrección, dan costos muy bajos o
favorables** — a diferencia de lo encontrado en Canadá/Australia/Japón
(donde corregir revertía "favorable" a 3-6% de costo real). Esto podría
reflejar que Reino Unido→Nigeria es un corredor genuinamente
hipercompetitivo (es uno de los corredores de remesas más grandes del
mundo, con 10.930 comparaciones en 3 meses solo en Monito — el volumen
más alto medido en el proyecto junto con México→EEUU), no
necesariamente que la corrección esté mal aplicada. Vale la pena tener
en cuenta, de todos modos, que estos números corregidos siguen viniendo
de Monito, cuya confiabilidad para "bonos" no siempre explícitos
(Sección 4) sigue siendo un tema abierto — no se identificaron con
certeza absoluta los tres proveedores (WU y MoneyGram sí, por el
patrón de puntaje y frases ya vistas; Remitly por el puntaje 9,1
coincidiendo con el badge superior de la página), pero no se verificó
cada uno por URL individual como en los casos de Paysend/Global66.

**Actualización (ronda 4): identificación confirmada por URL.** Se
volvió a la misma página y se extrajeron los links "Go to X" en orden
de aparición — coinciden exactamente con el orden de las tres tarjetas
(Western Union primero, Remitly segundo con el badge "Best deal",
MoneyGram tercero), confirmando la identificación de la tabla arriba
con el mismo nivel de certeza que Paysend/Global66 en México.

---

## 5. Auditoría adicional: SingX confirmado como caso estructural, y avances en SBI Remit y Taptap Send

### 5.1 SingX (Hong Kong→Filipinas): confirmado que nunca muestra un segundo monto, no es un límite de extracción de texto

En v12 (Sección 4), SingX había quedado marcado con el mismo "riesgo no
cuantificado" que TransferGo: insignia promocional visible ("cero
comisión en tus primeras 2 transferencias con código WELCOME15K") pero
solo un monto en el texto extraído. Existía la duda de si esto era un
límite de la extracción de texto plano de Monito (como pasó, y se
resolvió, con Paysend en México esta sesión) o un comportamiento
estructural real de la tarjeta.

Se volvió a revisar leyendo el **árbol de accesibilidad completo de la
página** (no solo el texto visible) — el mismo método que reveló el
desglose oculto de Paysend. Resultado: **SingX efectivamente muestra un
solo par de fee/tipo de cambio/monto** (20 HKD de fee, tipo de cambio
7,9418, 7.783 PHP), sin ningún segundo panel oculto en el HTML. A
diferencia de TransferGo, SingX no tiene un texto explicativo tipo
"receiver bonus" — simplemente no expone una segunda cifra en ninguna
parte de la página. **Conclusión: el riesgo no cuantificado de SingX
queda confirmado como genuino, no como una limitación de herramienta.**

### 5.2 SBI Remit: margen cambiario resuelto — fuente primaria (World Bank RPW) confirma un caso más de margen casi nulo

**Actualización (ronda 5): resuelto.** El problema pendiente desde la
ronda anterior era que un blog de Wise en japonés citaba una tasa
JPY→PHP (1 JPY = 0,47295 PHP) incompatible con el mid-market usado en
el resto del proyecto para ese par (1 JPY ≈ 0,394 PHP) — una diferencia
de casi 20% que impedía calcular el margen con confianza. Se encontró
la fuente primaria correcta: **World Bank Remittance Prices Worldwide
(RPW) tiene un nodo específico para SBI Remit, corredor Japón→
Filipinas** (dato con fecha del 18 de agosto de 2025, válido para el
período jul-oct 2025):

| Dato | Valor |
|---|---|
| Tipo de cambio inter-bancario (mid-market) | 1 JPY = 0,39 PHP |
| **Margen de tipo de cambio** | **0,09%** |
| Fee (envío de ¥17.000) | ¥720 → costo total 4,33% |
| Fee (envío de ¥42.000) | ¥1.000 → costo total 2,47% |

El tipo de cambio de referencia de RPW (0,39) es consistente con el
mid-market ya usado en el proyecto para Japón→Filipinas (~0,394, v12
Sección 8) — a diferencia del dato del blog de Wise, que efectivamente
era viejo/desactualizado, como se sospechaba. **Confirmación cruzada
adicional:** se consultó directamente la página oficial de fees de SBI
Remit (`remit.co.jp/en/kaigaisoukin/exchangeratecommission/commission/`)
y su tabla de fees para Filipinas coincide exactamente con la del blog
de Wise citada la ronda anterior (tramo ¥10.001-¥20.000 → ¥720 de fee;
tramo ¥30.001-¥50.000 → ¥1.000 de fee) — es decir, **el fee schedule
del blog era correcto desde el principio, solo la tasa de cambio citada
estaba desactualizada.**

**Conclusión: SBI Remit se suma a InstaReM y Global66 como caso de
margen cambiario bajo y consistente** (0,09%, en la misma liga que el
0,01% de Global66 en México) — el costo real para el usuario está
dominado casi enteramente por el fee plano, no por un margen cambiario
oculto. Con esto, SBI Remit deja de ser un proveedor "pendiente" y pasa
a la categoría de casos bien documentados del proyecto.

### 5.3 Taptap Send: nuevo corredor confirmado vía World Bank RPW

Se encontró un corredor de Taptap Send en el propio World Bank RPW
(fuente primaria, no un blog de comparación): **Reino Unido→Ghana**,
120-300 GBP, **margen de tipo de cambio 1,03%, sin fee** (todo el costo
es margen cambiario, coherente con el posicionamiento de "no fees" de
Taptap Send), entrega vía billetera móvil en menos de una hora. Dato
limpio, de fuente primaria, sin ninguna ambigüedad de doble monto (RPW
no tiene ese problema, solo Monito). **Refuerza el perfil de Taptap
Send como proveedor de margen bajo**, ya establecido en el proyecto
para otros corredores.

---

## 6. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (heredado de v11,
   Sección 3).
2. El patrón "bancos tradicionales caros" sigue confirmado y cerrado
   (heredado de v11).
3. **InstaReM** (9 corredores) y **Global66** (4 países de origen, 3 de
   4 con margen bajo/nulo) quedan como los dos casos de referencia mejor
   documentados de "margen bajo y consistente" del proyecto.
4. ~~Abrir México vía Monito.~~ **Hecho en la Sección 1** — Global66
   reconfirmado en un 4to país, Western Union con su patrón habitual de
   cobrar más caro en cash pickup que en cuenta bancaria.
5. ~~Investigar si Corea del Sur tiene una restricción regulatoria como
   China.~~ **Hecho en la Sección 2** — sí, aunque más leve y en
   proceso de flexibilizarse este mismo año.
6. ~~Confirmar con certeza el nombre del segundo proveedor de México→
   Honduras.~~ **Hecho en la Sección 1.2 (ronda 2)** — confirmado
   Paysend por URL directa.
7. ~~Abrir México→El Salvador, tercer país del Triángulo Norte.~~
   **Hecho en la Sección 1.3 (ronda 2)** — mismo patrón que Guatemala/
   Honduras, Triángulo Norte desde México queda completo.
8. ~~México→EEUU (corredor inverso).~~ **Hecho en la Sección 1.4** —
   Global66 reconfirmado con el mismo margen FX casi nulo (0,01%,
   idéntico al de Guatemala), y una cross-validación interna útil
   contra el dato de El Salvador (ambos dan cifras casi idénticas para
   Western Union, coherente con que El Salvador está dolarizado).
9. ~~Reintentar el desglose de Paysend en México→El Salvador.~~
   **Hecho en la Sección 1.3 (ronda 3)** — desglose completo obtenido
   leyendo el árbol de accesibilidad completo en vez de depender de que
   el click cambie la pestaña visible; cifra corregida a 5,06% (antes
   4,92% redondeado).
10. ~~Probar un tercer corredor de TransferGo para resolver el riesgo no
    cuantificado.~~ **Hecho en la Sección 4** — no se resolvió con un
    segundo monto, pero se encontró algo más valioso: **confirmación
    textual de Monito** de que la tasa de TransferGo ya incluye un
    "receiver bonus" — el riesgo pasa de "no cuantificado, tal vez" a
    "contaminación confirmada estructuralmente, magnitud desconocida".
11. **Brasil abierto como región de origen** (Sección 3) — Bolivia con
    dato limpio (MoneyGram, 4,98%), Paraguay con un nuevo caso
    confirmado de MoneyGram mostrando el patrón promocional de tasa
    (real 5,71%, más caro que Western Union limpio una vez corregido).
    Ver también la advertencia sobre los promedios agregados de Monito
    (Sección 3.1) — un hallazgo metodológico útil para todo el
    proyecto, no solo para Brasil.
12. ~~Verificar por URL individual los tres proveedores del hallazgo
    bonus de la Sección 4.1.~~ **Hecho (Sección 4.1, actualización
    ronda 4)** — confirmado por orden de los links "Go to X": Western
    Union, Remitly, MoneyGram, mismo orden que las tres tarjetas.
13. ~~Aplicar la advertencia de la Sección 3.1 retroactivamente
    (auditoría de promedios agregados).~~ **Hecho (ronda 5)** — se
    revisaron con grep todos los usos de "promedio" en los documentos
    v6-v13: en todos los casos son promedios calculados por el propio
    proyecto a partir de datos de tarjeta en vivo (ej. "promedio del
    corredor: 12,49%" calculado sobre una tabla de proveedores medidos
    a mano), nunca el número agregado "costo total más bajo (promedio)"
    que Monito muestra en su FAQ. **Auditoría cerrada: no se encontró
    ningún caso de contaminación retroactiva.**
14. ~~Intentar de nuevo SBI Remit y Taptap Send.~~ **Cerrado (Sección
    5.2)** — se encontró la fuente primaria correcta (World Bank RPW,
    nodo específico para SBI Remit Japón→Filipinas) que resuelve la
    inconsistencia de tasa que había quedado pendiente: margen
    cambiario real 0,09%, más una confirmación cruzada de que el fee
    schedule ya encontrado (vía blog) era correcto. SBI Remit pasa a la
    categoría de casos bien documentados de margen bajo, junto con
    InstaReM y Global66.
15. ~~SingX confirmado como caso estructural.~~ **Cerrado en la Sección
    5.1** — "contaminación confirmada, sin forma de corregir desde
    Monito", igual que TransferGo.
16. **Recordatorio para la carga a Supabase:** este archivo (v14) se
    suma a la cadena v6-v13 — los cuatro corredores de México (Sección
    1) y los cuatro de Brasil (Sección 3, incluyendo Argentina de la
    ronda 5) son candidatos directos para cargar, todos con dato limpio
    y alta confianza (salvo Brasil→Paraguay, Brasil→Perú y Brasil→
    Argentina/MoneyGram, que deben cargarse con las cifras ya
    corregidas — 5,71%, 7,85% y 0,25%/-0,58% respectivamente, no las
    promocionales) — y el nuevo corredor de Taptap Send (Sección 5.3,
    Reino Unido→Ghana, 1,03%, fuente RPW), y el margen resuelto de SBI
    Remit (Sección 5.2, 0,09%, fuente RPW).
17. A esta altura el proyecto ya cubrió 7 regiones de origen nuevas en
    esta sesión (Nueva Zelanda, Hong Kong, Corea del Sur, Japón, China,
    México, Brasil) — con Brasil ya en 4 corredores medidos (Bolivia,
    Paraguay, Perú, Argentina), sigue en pie la sugerencia de hacer una
    ronda de consolidación general antes de abrir una octava región
    nueva. **Nuevo candidato de bajo riesgo para una próxima ronda, si
    se prefiere seguir profundizando en vez de consolidar:** completar
    Brasil con un quinto corredor hacia un país no-MERCOSUR (ej.
    Brasil→Colombia o Brasil→México, para ver si el patrón de MoneyGram
    promocional se sostiene fuera de la región inmediata), o repetir el
    ejercicio de "fuente primaria RPW" que resolvió SBI Remit para
    algún otro proveedor con riesgo no cuantificado en el proyecto.
