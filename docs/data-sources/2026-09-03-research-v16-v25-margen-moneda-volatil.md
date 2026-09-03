# Research corredores — moneda volátil → margen de remesas (v16-v25, 2026-09-02/03)

## Nota de estado (agregada al cargar este documento al repo)

Este documento consolida **doce archivos de research** de una sola sesión
de investigación (Claude, sin permisos de escritura en Supabase) que
corrió v16 a v25 del hilo "moneda volátil → margen de remesas" —
continuación directa de v6-v15, ya cargados en rondas anteriores. A
diferencia de v6-v15 (un archivo de research = una migración = un doc),
esta tanda se carga como **un solo documento consolidado** porque:

1. El propio hilo de investigación se reescribió sobre sí mismo varias
   veces (v21→v23, v22→v23 corrigieron datos de rondas anteriores del
   mismo hilo, "sin crear v22/v23/v24/v25 nuevos" según indicó el usuario
   en su momento) — tratar cada archivo como una unidad de carga
   independiente habría significado cargar y luego recorregir los mismos
   números varias veces.
2. Hay **dos documentos meta** (un instructivo de carga y un documento de
   conclusiones) escritos específicamente para guiar esta carga, y ambos
   dependen del contexto completo de los 10 archivos de research crudos
   para tener sentido — separarlos en 12 docs individuales habría roto esa
   relación.
3. Doce archivos concatenados sin ningún orden serían difíciles de auditar
   — este documento los organiza: primero los dos meta-documentos (la guía
   de lectura), después los 10 archivos crudos en orden cronológico (v16 a
   v25), cada uno con su propio separador y encabezado.

**Fuentes** (los doce archivos, tal como los entregó el usuario):

1. `INSTRUCTIVO-carga-v16-a-v24.md` — instructivo de carga escrito por la
   sesión de investigación específicamente para la sesión con permisos de
   Supabase (esta sesión). Documenta el descubrimiento metodológico central
   de esta tanda (ver más abajo) y da una tabla maestra de valores
   corregidos.
2. `CONCLUSIONES-moneda-volatil-margen-v16-v25.md` — documento de cierre
   del hilo completo (investigación pausada a pedido del usuario tras v25).
3. `research-findings-2026-09-02-v16-addendum.md`
4. `research-findings-2026-09-02-v17-addendum.md`
5. `research-findings-2026-09-02-v18-addendum.md`
6. `research-findings-2026-09-02-v19-addendum.md`
7. `research-findings-2026-09-03-v20-addendum.md`
8. `research-findings-2026-09-03-v21-addendum.md`
9. `research-findings-2026-09-03-v22-addendum.md`
10. `research-findings-2026-09-03-v23-addendum.md`
11. `research-findings-2026-09-03-v24-addendum.md`
12. `research-findings-2026-09-03-v25-addendum.md`

### El hallazgo metodológico central de esta tanda

A mitad del hilo (v23, Sección 6), la investigación descubrió que el "%
peor que el tipo de cambio medio" que Monito muestra en cada tarjeta de
proveedor **no incluye el costo de una comisión fija como fracción del
monto enviado** — cuando la comisión es $0 esa cifra coincide con el costo
real, pero cuando es un monto fijo con peso real sobre el envío, la cifra
de Monito subestima el costo real, a veces por el doble (el caso más
extremo: Mukuru en Botsuana, citado durante 3 rondas como "el margen más
bajo del proyecto" con 0,37%, resultó ser uno de los más altos, 9,64%,
corregido). v25 confirmó en vivo los dos hallazgos que habían quedado
como recálculo preliminar (Western Union Chile/Argentina, Skrill Kenia
Reino Unido/EEUU) antes de que el usuario pausara la investigación.

**Cómo se aplicó la corrección al cargar a Supabase** (detalle técnico
completo en la migración `supabase/migrations/20260903180000_load_v16_v25_corridor_rates.sql`):
el esquema de este proyecto ya separa `fee` (comisión, en unidades de la
moneda de origen) de `public_spread_percent` (margen puro de tipo de
cambio) — y el calculador en vivo del proyecto
(`src/lib/fx.functions.ts`) ya los combina correctamente:
`rate = tipo_medio*(1-spread/100)`, `recibido = (monto-fee)*rate` — es
decir, `costo = 1 - recibido/(monto*tipo_medio)`, exactamente la fórmula
corregida que la investigación derivó. El "bug" nunca estuvo en cómo este
proyecto combina fee+spread — estuvo en tratar el "% mostrado por Monito"
como si fuera el costo total al citarlo en rondas anteriores (v16-v22),
sin sumarle el fee. Por eso, cargar correctamente `fee` (real, dado por la
fuente) y `public_spread_percent` (el margen puro de tipo de cambio — no
el "costo real" recalculado) hace que este proyecto reproduzca
automáticamente la cifra corregida. Se verificó fila por fila, antes de
escribir la migración, que el "% mostrado por Monito" + fee reproduce el
costo_real corregido de la fuente (típicamente dentro de 0,01-0,1
puntos porcentuales, atribuible al redondeo de la propia fuente). Donde
esa verificación falló por una cifra vieja/inconsistente con su propio
recálculo (Sudáfrica→Reino Unido es el único caso claro) o donde nunca se
dio un "% mostrado" (Botsuana), `public_spread_percent` se derivó
algebraicamente del fee real y el costo_real final de la fuente — nunca
inventado, siempre una transformación directa de dos números reales ya
dados por la investigación.

## Lo que se cargó a Supabase

Migración: `supabase/migrations/20260903180000_load_v16_v25_corridor_rates.sql`,
aplicada directamente al proyecto vivo (`ttqalbexpquzobrdyvgx`) y
verificada con `SELECT` contra la base después de aplicar. **fx_rates pasó
de 884 a 920 filas** (36 filas nuevas + 2 filas actualizadas).

**1. Mukuru — 7 países de origen, 18 filas (todas INSERT, cero filas
previas de Mukuru en ninguno de estos corredores):**

| Origen | Destinos | Costo real corregido |
|---|---|---|
| Kenia | Reino Unido, EEUU, Alemania | 8,64% / 8,43% / 9,85% |
| Zambia | Reino Unido, EEUU, Alemania | 8,85% / 4,99% / 8,93% |
| Botsuana | Reino Unido, EEUU, Sudáfrica | 9,64% / 7,91% / 9,63% |
| Sudáfrica | Reino Unido, EEUU, Alemania | 2,48%* / 3,27% / 1,86% |
| Lesotho | Reino Unido (2 tramos), EEUU, Sudáfrica | 1,33%/1,15% / 3,18% / 5,21% |
| Uganda | Reino Unido | ≈7,52% |
| Rwanda | Reino Unido | 7,42% |

*Sudáfrica→Reino Unido es el único corredor donde el "% mostrado por
Monito" (1,29%, heredado sin cambios de v22) no reproducía el propio
costo_real recalculado por la misma fuente (2,48%) vía la fórmula de este
proyecto — `public_spread_percent` se derivó algebraicamente del fee real
y el 2,48% final, en vez de cargar el 1,29% desactualizado. Documentado
en detalle en la migración para auditoría futura.

Todas corrigen — o evitan repetir — el sesgo de comisión fija descrito
arriba. Ninguna fila carga el "4,01%" que v20-v22 le atribuyó por error a
Mukuru en Kenia→Reino Unido (esa cifra pertenece a Skrill, ver abajo) —
nunca existió como fila de Mukuru en Supabase, así que no hubo nada que
corregir, solo evitar repetir el error.

**2. Western Union — Chile/España y Argentina/EEUU, el "santo grial"
fundacional del proyecto, confirmado en vivo en v25 (2 filas):**

- Chile→España: **UPDATE** de la fila existente (id `fbd2a4a7…`, cargada
  en v16 con datos de 2025-08-01) — reemplaza 1,37-1,40% por **3,25%**
  confirmado en vivo.
- Argentina→EEUU: **INSERT** nuevo (no existía; solo AR→ES y AR→IT ya
  estaban cargados, de v15) — reemplaza 5,12-5,35% por **10,10%**
  confirmado en vivo, con la salvedad explícita de que esto es válido
  para este corredor específico (validado por consistencia interna
  contra Global66), no una resolución general del problema de tasa de
  referencia del ARS.

**3. Skrill, Kenia — 3 corredores (3 INSERT, cero filas previas de Skrill
para Kenia):** Alemania 2,51% (sin cambios, fee $0), Reino Unido **7,73%**
y EEUU **8,28%**, ambos confirmados en vivo en v25, reemplazando 6,81%/7,4%.

**4. OFX — 8 filas (todas INSERT, cero filas previas para estos
corredores), todas con fee $0, ninguna necesitó corrección:** Egipto→Reino
Unido (4,14%), →EEUU (7,53%), →Italia (7,54%); Sri Lanka→Reino Unido
(2,51%); Pakistán→Reino Unido (5,13%); México→Reino Unido en 2 tramos de
monto (4,04% a 6.000 MXN, 2,5% a 30.000 MXN, vía `min_amount`/`max_amount`
igual que SBI Remit); Tanzania→Reino Unido (8,21%).

**5. Global66, Argentina→EEUU — 1 fila (INSERT):** 5,24%, fee $0, tercer
corredor argentino confirmado de Global66 (junto a España e Italia, ya
cargados en v15).

**6. Western Union, Bolivia — 5 orígenes, 6 filas (1 UPDATE + 5 INSERT):**
cargado como filas separadas por origen, **nunca como un número único
"Bolivia = X%"** (el rango medido fue 0,62%-9,16%, más de 8 puntos
porcentuales, sin patrón claro): EEUU en 2 tramos de monto (1,35% a 1.000
USD — UPDATE de la fila RPW existente de 2025-08-01 — y 0,62% a 5.000 USD
— INSERT), España (2,04-2,14%, cargado como fila única representativa),
Brasil (3,62%), Italia (6,35%), Argentina (9,16%, con la salvedad ARS
explícita en notas).

**Excluido deliberadamente (nada cargado a `fx_rates`):**

- **25+ países de cobertura cero** (Líbano, Venezuela, Nigeria, Ucrania,
  Rusia, Ghana, Cuba, Surinam, Gambia, Guinea, Mozambique, Malaui,
  Nicaragua, Angola, Sierra Leona, Etiopía, Sudán, Haití, Myanmar, Laos,
  Bangladesh, Vietnam, Paraguay, Mongolia, Camboya, y otros) — no son un
  dato de tarifa, son ausencia de proveedor. Este proyecto no tiene una
  tabla dedicada a registrar "cobertura cero, y por qué" — se revisó
  `corridor_notes` antes de decidir esto, pero su propósito (verificado en
  el esquema) es otro: notas editoriales sobre corredores YA soportados
  por el comparador, no un registro de ausencia de cobertura. Quedan
  documentados solo en este archivo (ver los 10 archivos crudos más
  abajo), no en la base de datos.
- **Zimbabue, RD Congo, Sudán del Sur** — Monito ni siquiera ofrece su
  moneda local como opción de envío (fuerza USD/USD/GBP respectivamente)
  — no hay margen cambiario que medir con los datos disponibles.
- **TransferGo (Turquía, v17)** — contaminación estructural ya confirmada
  en v15 Sección 5.3 (bono al receptor incorporado en la tasa publicada);
  el propio archivo v17 señala explícitamente no cargar estos datos.
- **OFX Turquía** — mencionado como parte del conjunto de proveedores del
  país (v17/v18/v20) pero sin una cifra de tarjeta individual (fee/tasa/%)
  citable en ningún archivo fuente — solo el agregado propio de Monito
  ("costo total... 1,2%"), que la convención del proyecto excluye siempre
  de la carga.
- **Cualquier otro corredor en ARS** más allá de Western Union Argentina→EEUU
  y Argentina→Bolivia (ambos con salvedad explícita en notas) — el
  instructivo (Sección 5) y las conclusiones (Sección 6) advierten
  explícitamente no generalizar el tipo de cambio "medio" del peso
  argentino a ningún otro corredor sin verificación caso por caso.
- **Bolivia como Mukuru** de Botsuana/etc. (5to-6to país de Mukuru): no
  aplica, Mukuru y Bolivia-WU son hilos separados de este mismo research;
  ningún dato de Bolivia vía Mukuru aparece en las fuentes.

### Discrepancia encontrada entre el instructivo y las conclusiones

Ambos documentos coinciden en casi todos los números — se los cruzó fila
por fila antes de escribir la migración. La única discrepancia real
encontrada: la tabla maestra del **instructivo** (Sección 2) lista, para
Botsuana, "0,37% (citado como 'el margen más bajo del proyecto')" en la
columna de **Botsuana→EEUU**, y "4,58% aprox." en la de **Botsuana→Sudáfrica**
— pero los archivos de research crudos (v22 Sección 8, v23 Sección 6.3)
son inequívocos en que el "0,37%" corresponde específicamente al corredor
**Botsuana→Reino Unido**, no a EEUU (que ni siquiera tenía un "%
mostrado" documentado, solo el costo_real final de 7,91% dado
directamente en v24 Sección 4.2), y que "4,58%" sí corresponde a
Sudáfrica. Se trata como un error de transcripción del propio instructivo
al armar esa tabla resumen (probablemente al reordenar filas), no como un
dato en disputa — se cargó siguiendo la atribución de los archivos
crudos (v22/v23/v24), que es consistente entre sí y con las
conclusiones (Sección 4, que no repite el detalle por destino pero da el
rango correcto "7,91%-9,64%" sin atribuir mal ningún valor a un destino
específico).

---

A continuación, el contenido verbatim de los doce archivos, en el orden
en que se entregaron: primero los dos meta-documentos, después los diez
archivos de research crudos en orden cronológico (v16 a v25).

---

## Meta-documento 1: Instructivo de carga a Supabase (v16 a v24)

<!-- Contenido verbatim del research entregado por el usuario -->

# Instructivo de carga a Supabase — archivos v16 a v24

> **Para quién es esto:** este documento está escrito para pasarse como prompt/contexto a la sesión de Claude Code que sí tiene permiso de escritura en Supabase (`ttqalbexpquzobrdyvgx`, repo `aleviercas/mangomundi`). **La sesión que escribió este documento es de investigación únicamente — nunca ejecutó `apply_migration` ni `execute_sql` de escritura, y no lo va a hacer.** Todo lo de abajo es una guía de lectura e interpretación de 9 archivos de research (`research-findings-*-v16-addendum.md` a `...-v24-addendum.md`, todos en `/tmp/mangomundi-research/`) para que la carga a la base de datos se haga con los valores correctos, no con los que Monito muestra en pantalla cuando esos dos números difieren.

---

## 0. Por qué hace falta este instructivo y no alcanza con leer los 9 archivos en orden

Los archivos v16-v24 se escribieron en orden cronológico y cada uno es válido *como registro de lo que se investigó ese día*. El problema es que **tres rondas de este tramo (v23 primera mitad de la Sección 6, y ahora este instructivo) descubrieron que una parte de los números ya publicados en rondas anteriores estaban mal calculados** — no por un error de tipeo, sino por un problema metodológico de fondo que afecta a cualquier proveedor que cobra una comisión fija separada del tipo de cambio. Cargar los archivos "tal cual" fila por fila va a meter a la base de datos varios números que ya sabemos que están mal, y probablemente algunos más que sospechamos que están mal pero todavía no se recalcularon con datos en vivo.

Este instructivo tiene cuatro partes:

1. **La regla central** — qué campo mirar en cada fila antes de cargarla, y la fórmula para recalcular si hace falta.
2. **Tabla maestra de correcciones** — casos ya confirmados con la fórmula correcta, listos para cargar con el valor corregido.
3. **Casos recién detectados, todavía NO confirmados con re-testeo en vivo** — hay que decidir si cargarlos como "provisorio" o esperar una ronda más de verificación.
4. **Guía archivo por archivo** — qué aporta cada versión, qué está sano tal cual, qué necesita la corrección de la Sección 1.

---

## 1. La regla central: cuándo el "% peor que el tipo de cambio medio" de Monito NO es el costo total

**Descubrimiento (v23, Sección 6):** Monito muestra, para cada proveedor, un porcentaje "peor que el tipo de cambio medio". Esa cifra compara *solamente* el tipo de cambio aplicado contra el tipo de cambio medio de mercado — **no** incluye el costo de la comisión fija como fracción del monto original enviado. Cuando la comisión es $0 (o es un porcentaje del monto, no un monto fijo), esa cifra coincide con el costo real. Cuando la comisión es un monto fijo que representa una fracción no despreciable del envío, **la cifra de Monito subestima el costo real**, a veces por varios puntos porcentuales.

**Fórmula correcta (costo total real):**

```
costo_real = 1 − recibido / (monto_enviado × tipo_de_cambio_medio)
```

donde `tipo_de_cambio_medio` es el tipo de cambio de mercado (mid-market) para ese par de monedas en el momento de la medición — **no** el tipo de cambio que aplicó el proveedor.

**Regla de decisión para quien carga los datos**, fila por fila:

- Si la tabla de origen dice **"Fee: Gratis" / "Fee: Free" / "$0"** → el % que muestra Monito **ya es** el costo real. Cargar tal cual, sin tocar nada.
- Si la tabla de origen dice **una comisión fija en la moneda de origen** (ej. "635 KES", "2.100 CLP", "5% del monto") → **no cargar el % de Monito directamente**. Hay que aplicar la fórmula de arriba con los datos crudos de la misma fila (monto enviado, comisión, tipo de cambio aplicado, recibido, y el tipo de cambio medio — que Monito muestra aparte en la página de comparación, o se puede despejar de `tipo_aplicado / (1 − %_mostrado)` si no quedó registrado por separado, aunque esto último es una aproximación, no una medición directa).
- Si no hay certeza de cuál es la comisión de una fila puntual (algunos archivos no la registraron explícitamente) → **no cargar esa fila como cifra final**; marcarla `pendiente_verificacion` o similar y dejarla para una ronda de research específica.

**Por qué esto importa más de lo que parecía en v23:** en esta ronda de armado del instructivo se comprobó que el sesgo **no es exclusivo de Mukuru**. Ver Sección 3 más abajo — también afecta al comparador original Western Union Chile/Argentina (el "santo grial" de v16) y, parcialmente, a Skrill en Kenia (que se había dado por "exento" en v24 basándose en un solo corredor).

---

## 2. Tabla maestra de correcciones — CONFIRMADAS, listas para cargar con el valor nuevo

Estas ya pasaron por la fórmula correcta con datos verificados (fee, tasa, recibido, y tipo medio observado directamente en Monito, no aproximado). **Cargar el valor de la columna "Costo real corregido"; NO cargar el valor viejo.**

| País/caso (corredor) | Proveedor | Valor viejo publicado (Monito, con sesgo) | Costo real corregido | Fuente de la corrección |
|---|---|---|---|---|
| Botsuana → EEUU | Mukuru | 0.37% (citado como "el margen más bajo del proyecto") | **7.91%** | v23 §6, v24 §4 |
| Botsuana → Sudáfrica | Mukuru | 4.58% aprox. | **9.63%** | v23 §6, v24 §4 |
| Botsuana → Reino Unido | Mukuru | — | **9.64%** | v23 §6, v24 §4 |
| Kenia → Reino Unido | Mukuru | "4.01%" (⚠️ esta cifra en realidad correspondía a **Skrill**, no a Mukuru — error de identificación de proveedor, ver Sección 4 abajo) | **8.64%** (Mukuru real) | v23 §6, v24 §1 |
| Kenia → EEUU | Mukuru | 6.84% aprox. | **8.43%** | v24 §1 |
| Kenia → Alemania | Mukuru | — | **9.85%** | v24 §1 |
| Sudáfrica (como origen) | Mukuru | 1.29-1.44% | **1.86-3.27%** | v23 §6 |
| Zambia (como origen) | Mukuru | 3.08-4.37% | **4.99-8.93%** | v23 §6 |
| Lesotho → Sudáfrica | Mukuru | — (ya calculado con fórmula correcta desde el inicio) | 5.21% (200,000 y 500,000 LSL, estable — amount-independent) | v23 §3, §7 |
| Lesotho → Reino Unido | Mukuru | — | 1.15-1.33% según monto | v23 §3, §7 |
| Lesotho → EEUU | Mukuru | — | 3.18% | v24 §4 |
| Uganda → Reino Unido | Mukuru | — (calculado con fórmula correcta desde el inicio) | ≈7.52% (700,000 UGX) | v23 §8 |
| Rwanda → Reino Unido | Mukuru | — (calculado con fórmula correcta desde el inicio) | 7.42% (200,000 RWF) | v24 §5 |
| Chile → España | Western Union | 1.37%-1.40% | **3.25%** | v25 §1.2 — confirmado en vivo |
| Argentina → EEUU | Western Union | 5.12%-5.35% | **10.10%** | v25 §1.3 — confirmado en vivo, con salvedad de alcance (no generalizar a otros corredores ARS) |
| Kenia → Reino Unido | Skrill | 6.81% (histórico) / 5.99% (v25) | **7.73%** | v25 §2.1 — confirmado en vivo |
| Kenia → EEUU | Skrill | 7.4% (histórico) / 7.37% (v25) | **8.28%** | v25 §2.2 — confirmado en vivo |

Zambia, Uganda, Lesotho, Rwanda **ya se calcularon con la fórmula correcta en el momento de la medición** (no hubo que corregirlas retroactivamente) — se listan acá solo para dejar constancia de que son seguras para cargar tal cual figuran en v23/v24.

---

## 3. Casos detectados en la ronda anterior — CONFIRMADOS con re-testeo en vivo en v25

> **Actualización (v25):** ambos hallazgos de esta sección, que se habían marcado como recálculo de escritorio pendiente de verificación, **ya se confirmaron con mediciones en vivo** en `research-findings-2026-09-03-v25-addendum.md` (Secciones 1 y 2), con el tipo de cambio medio leído directamente de la pantalla de Monito, no derivado. Los valores corregidos de abajo son ahora definitivos, no preliminares — **cargarlos directamente**, con la misma prioridad que la tabla maestra de la Sección 2 de este instructivo.

Estos dos hallazgos surgieron releyendo v16 y v19/v20 con la fórmula de la Sección 1 en mente, y se confirmaron con datos frescos en v25.

### 3.1 El "santo grial" original — Western Union Chile vs. Argentina (v16)

Esta es la comparación fundacional de todo el proyecto, citada sin cambios desde v16 hasta v24 como "Chile 1.37-1.40% vs. Argentina 5.12-5.35%, casi 4 veces más alto". Releyendo los datos crudos de v16 con la fórmula corregida:

**Chile→España, WU** (v16 §3.1): monto enviado 100.000 CLP, comisión 2.100 CLP, tipo de cambio aplicado 0,000914, **tipo de cambio medio 0,000927 (dato directo, no aproximado)**, recibido 89,50 EUR.

```
costo_real = 1 − 89.50 / (100,000 × 0.000927) = 1 − 89.50/92.70 = 0.0345 → 3.45%
```

vs. el 1.37-1.40% publicado. **Más del doble.** ✅ **Confirmado en vivo en v25 §1.2: 3.25%** (tipo de cambio medio leído directamente de Monito, no derivado — la comisión de WU se mantuvo idéntica, 2.100 CLP).

**Argentina→EEUU, WU** (v16 §1): monto enviado 100.000 ARS, comisión 5.000 ARS (5%), tipo de cambio aplicado 0,000627, recibido 59,52 USD. El tipo de cambio medio **no se registró como dato directo** en v16 — se aproximó ahí mismo, en el momento, despejándolo del propio % sesgado (0,000662, textualmente "calculado a partir del margen y el monto recibido"), lo cual es circular y además choca con el problema de la Sección 5 (tasa "media" del ARS no confiable). Usando esa misma aproximación igual:

```
costo_real ≈ 1 − 59.52/(100,000 × 0.0006625) = 1 − 59.52/66.25 ≈ 0.102 → ~10.2%
```

vs. el 5.35% publicado. **Casi el doble, con una salvedad extra:** esta cifra depende de una tasa media aproximada, no medida — así que el número de Argentina es doblemente preliminar (sesgo de comisión + incertidumbre de la tasa de referencia ARS). ✅ **Confirmado en vivo en v25 §1.3: 10.10%**, con el tipo de cambio medio (0,000662 USD/ARS) leído directamente de Monito — y validado por consistencia interna contra Global66 (comisión $0) en el mismo corredor (v25 §1.4). Sigue con la salvedad de que esto no resuelve el problema estructural del ARS en otros corredores (v25 §1.5).

**Dato curioso:** v16 mismo ya tenía una nota del investigador de esa ronda admitiendo el problema para Argentina sin resolverlo: *"5,35% margen FX (costo total más alto por el fee, no calculado con precisión acá)"*. Quedó como una alerta abierta sin seguimiento durante 8 rondas (v17-v24).

**Recomendación (actualizada tras v25): cargar directamente los valores confirmados — Chile→España WU 3.25%, Argentina→EEUU WU 10.10% — en reemplazo de 1.37-1.40%/5.12-5.35%.** Ya no hace falta ningún status de "pendiente" para estos dos valores puntuales. Para Argentina, mantener igualmente la salvedad general de la Sección 5 (no generalizar a otros corredores en ARS sin verificar caso por caso).

### 3.2 Skrill Kenia — la "exención" de v24 no es general, es de un solo corredor

v24 §2 concluyó "Skrill queda exento de la corrección" probando **un solo corredor**: Kenia→Alemania, 200.000 KES, comisión $0 → el % de Monito coincidía exactamente con el costo real (2.51%). Esa conclusión se generalizó en la Sección 8 de v24 ("Kenia (Skrill): 2.51%... sin cambios") sin volver a revisar los **dos corredores originales de Skrill en Kenia** (v19 §4, v20 §1), que sí tienen comisión fija y no son $0:

**Kenia→Reino Unido, Skrill** (v19/v20): 32.400 KES enviados, comisión **635 KES** (no $0), tasa aplicada 0,005338, recibido 169,56 GBP, % mostrado 6,81%. Despejando el tipo medio del propio % (misma limitación de aproximación que en 3.1): tipo medio ≈0,005338/(1−0,0681) = 0,0057285.

```
costo_real ≈ 1 − 169.56/(32,400 × 0.0057285) = 1 − 169.56/185.60 ≈ 0.0864 → ~8.64%
```

vs. 6.81% publicado. ✅ **Confirmado en vivo en v25 §2.1: 7.73%** (con datos frescos — el tipo de cambio de mercado se movió desde v19/v20, pero la comisión de Skrill, 635 KES, se mantuvo idéntica).

**Kenia→EEUU, Skrill** (v19): 50.000 KES enviados, comisión **495 KES**, tasa aplicada 0,007153, recibido 354,11 USD, % mostrado 7,4%. Tipo medio aproximado ≈0,007153/(1−0,074) = 0,0077247.

```
costo_real ≈ 1 − 354.11/(50,000 × 0.0077247) = 1 − 354.11/386.24 ≈ 0.0832 → ~8.32%
```

vs. 7.4% publicado. ✅ **Confirmado en vivo en v25 §2.2: 8.28%** (comisión de Skrill idéntica, 495 KES).

**Conclusión:** Skrill **no** es un proveedor "exento por diseño" — es exento **solo cuando su comisión en ese corredor puntual es $0**, igual que cualquier otro proveedor. En Kenia→Reino Unido y Kenia→EEUU (los dos corredores originales, los más citados del proyecto para Kenia-vía-Skrill) sí cobra comisión fija y el sesgo sí aplica, en una magnitud similar a la de Mukuru en el mismo país (~8.3-8.6% real vs. 6.8-7.4% publicado).

**Recomendación (actualizada tras v25): cargar los tres corredores de Skrill Kenia directamente** — Alemania 2.51% (comisión $0, sin corrección), Reino Unido 7.73% y EEUU 8.28% (costo real confirmado en vivo, en reemplazo de los valores que muestra Monito).

---

## 4. El error de identificación de proveedor (Kenia "4.01%")

Documentado en v23 §6.5-6.6: la cifra "Kenia 4.01%" citada en la tabla de v20-v22 como margen de **Mukuru** en Kenia→Reino Unido en realidad correspondía a **Skrill**. El error fue de lectura de tarjeta (confundir a qué proveedor pertenecía un resultado en la página de Monito), no de cálculo. **No cargar "Kenia 4.01% = Mukuru" bajo ningún concepto** — si esa fila ya se cargó en una ronda anterior de Supabase, corregir el proveedor asociado, no solo el valor.

Regla general para evitar que se repita: la identidad de un proveedor en una tarjeta de resultado de Monito solo se confirma verificando que el link `go.monito.com/<proveedor>` está estructuralmente *dentro* de esa tarjeta específica (inspección de DOM), no solo presente en algún lugar de la página.

---

## 5. Argentina (ARS) — no cargar como corredor "resuelto" en ningún archivo

Problema estructural, independiente del sesgo de comisión de las Secciones 1-3: el tipo de cambio "medio" que usa Monito/XE para el peso argentino no refleja tasas realmente disponibles, por la historia de tipos de cambio dual/paralelo del país. Esto ya había aparecido en rondas anteriores al v16 y se reconfirmó en v24 §7.2 (Italia→Argentina WU dio un costo real *negativo*, sin sentido). **Ningún corredor en ARS debería cargarse con un "costo real" recalculado hasta que se resuelva qué tasa de referencia usar** — incluyendo el corredor Argentina→EEUU de la Sección 3.1 de este instructivo. Los valores que Monito muestra sin recalcular (5.12-5.35%, etc.) se pueden cargar como "referencia histórica, no confirmada", pero no como costo real.

---

## 6. Bolivia (WU) — no cargar como un número único

v23 §5/§9 y v24 §3/§6 midieron Western Union Bolivia desde **cinco orígenes distintos** (EEUU, España, Brasil, Italia, Argentina) y el margen varió de **0.62% a 9.16%** — más de 8 puntos porcentuales de rango, sin patrón claro entre origen y margen. **No cargar "Bolivia = X%"** como si fuera un dato representativo del país. Si el esquema de Supabase requiere una fila por país, cargar las cinco mediciones por separado, cada una etiquetada con su origen específico, o dejar Bolivia fuera de cualquier tabla que asuma "un país = un margen".

| Origen | Rango medido |
|---|---|
| EEUU | 0.62%-1.35% (decrece con el monto) |
| España | 2.04%-2.14% (estable) |
| Brasil | 3.62% |
| Italia | 6.35% |
| Argentina | 9.16% |

---

## 7. Proveedores/corredores confirmados SIN sesgo — seguros para cargar tal cual

- **OFX** — en los cuatro corredores probados (México, Egipto EEUU/Reino Unido/Italia, Pakistán, Sri Lanka — v18) la comisión fue siempre "Gratis". El % de Monito es el costo real directamente. Ojo aparte: OFX **sí** depende del tamaño de la transferencia (v18 §4.3: 4.04% a 6.000 MXN vs. 2.5% a 30.000 MXN) — eso es una característica real del proveedor, no un error de medición, así que cargar cada monto probado como una medición separada, no promediar.
- **Global66 (Argentina)** — comisión "Free" en el corredor probado (v16 §1). Costo real = valor publicado (5.24%).
- **Skrill Kenia→Alemania únicamente** (200.000 KES) — comisión $0 confirmada, 2.51%. **No extender esta exención a los otros corredores de Skrill** (ver Sección 3.2).

---

## 8. Guía archivo por archivo (v16 → v24)

| Archivo | Aporta | Estado de sus cifras de margen |
|---|---|---|
| **v16** | Argentina→EEUU (Global66 5.24%, WU "5.35%"), tabla Global66 5 orígenes, comparación WU Chile/Argentina fundacional ("1.37-1.40%" / "5.12-5.35%"), Líbano cobertura cero (sanción regulatoria Banque du Liban), Venezuela cobertura cero (sanciones OFAC, levantadas 2026) | ⚠️ **La comparación WU Chile/Argentina necesita la salvedad de la Sección 3.1 de este instructivo.** Global66 (fee Free) seguro tal cual. Líbano/Venezuela (cobertura cero) seguros tal cual — no son cifras de margen, son ausencia de proveedor. |
| **v17** | Turquía (no comparable de forma controlada), consolidación de 6 países de origen (tabla resumen) | La tabla resume v16, hereda la misma salvedad. Turquía en sí no tiene fee documentado con el detalle necesario — tratar como referencia, no recalcular sin volver a medir. |
| **v18** | Nigeria (cobertura cero, mecanismo regulatorio CBN), Egipto (OFX, fee Gratis), Sri Lanka/Pakistán (OFX), verificación de que el margen de OFX depende del monto | ✅ Seguro tal cual — todas las mediciones de margen de este archivo son OFX con fee $0. |
| **v19** | Ucrania/Rusia (cobertura cero), Ghana (mismo mecanismo regulatorio que Nigeria), **Kenia — Skrill, primeros dos corredores (Reino Unido 6.81%, EEUU 7.4%)** | ⚠️ Los dos corredores de Skrill Kenia **necesitan la salvedad de la Sección 3.2** — no son $0 de comisión, no están confirmados con la fórmula correcta. Ucrania/Rusia/Ghana (cobertura cero o mecanismo regulatorio) seguros tal cual. |
| **v20** | Confirma independencia de monto de Skrill Kenia (mismos dos corredores, montos más grandes), 8 países nuevos de cobertura cero, método de forzado de monto por URL, tabla de 22 países | Mismo caveat que v19 para los corredores de Skrill (son la misma medición, montos distintos). Cobertura cero de los 8 países nuevos, segura tal cual. |
| **v21** | Cuba/Surinam/Gambia/Guinea (cobertura cero), tercer corredor de Skrill, **descubrimiento de Mukuru** (primeras cifras, Sudáfrica vs. Kenia), aviso de "amount bucket"/datos desactualizados, tabla 25 países | ⚠️ Las cifras de Mukuru de este archivo son las que se corrigieron en v23 §6 (ver tabla maestra, Sección 2 de este instructivo) — **no cargar los valores originales de v21**, usar los corregidos. |
| **v22** | Zambia (3er país Mukuru), comparación de 3 vías, Mozambique/Malaui/Nicaragua/Angola/Sierra Leona/Guinea (cobertura), breakpoint Sudáfrica, **Botswana (4to país Mukuru, "0.37% más bajo del proyecto")**, tabla 31 países | ⚠️ **Botswana "0.37%" es el caso más severo de sesgo detectado en todo el proyecto — NO cargar ese valor bajo ninguna circunstancia.** Usar 7.91-9.64% (tabla maestra). Zambia también necesita el valor corregido. |
| **v23** | Lesotho (5to Mukuru), Namibia/Eswatini (cobertura cero), Bolivia (WU, 1er y 2do origen), **descubrimiento y documentación completa del sesgo metodológico (Sección 6)**, corrección retroactiva de Sudáfrica/Kenia/Zambia/Botswana, Uganda (6to Mukuru), tabla 36 | ✅ Las cifras de Lesotho/Uganda de este archivo ya están calculadas con la fórmula correcta desde el momento de la medición. Las correcciones de la Sección 6 son las que hay que aplicar a v21/v22. Bolivia necesita la salvedad de la Sección 6 de este instructivo (no cargar como número único). |
| **v24** | Kenia recalculada en 3 destinos, "Skrill exento" (⚠️ ver Sección 3.2 de este instructivo — la conclusión es incompleta), Rwanda (7mo Mukuru), Bolivia ampliada a 5 orígenes, Chile/Argentina desde Italia (Chile estable 1.67%, Argentina choca con el problema del ARS), tabla 37 | ✅ Kenia/Rwanda calculadas con fórmula correcta, seguras. ⚠️ La frase "Skrill sin cambios" en la tabla de este archivo es engañosa — corregir con la salvedad de la Sección 3.2. Bolivia y Argentina, ver Secciones 5 y 6 de este instructivo. |

---

## 9. Orden recomendado de carga

1. **Cargar primero lo confirmado sin ambigüedad:** cobertura cero de todos los países (no requiere ningún cálculo, es solo "sin proveedor"); OFX; Global66 Argentina; Skrill Kenia→Alemania; Lesotho/Uganda/Rwanda (Mukuru, ya con fórmula correcta).
2. **Aplicar la tabla maestra de correcciones (Sección 2)** para Botswana, Kenia-Mukuru, Sudáfrica, Zambia — sobrescribiendo cualquier valor que ya se haya cargado de v20-v22 con el número viejo.
3. **Corregir la identidad de proveedor de "Kenia 4.01%"** (Sección 4) si esa fila ya existe en la base con Mukuru como proveedor.
4. **Cargar Bolivia como 5 filas separadas por origen**, no como un país con un margen único (Sección 6).
5. **Marcar el corredor Argentina en cualquier moneda como "referencia no confirmada"**, nunca como costo real recalculado, hasta resolver el problema de tasa de referencia (Sección 5).
6. **Dejar pendientes, con status explícito de "requiere re-medición en vivo"**: Chile→España WU (v16), Argentina→EEUU WU (v16), Kenia→Reino Unido y Kenia→EEUU vía Skrill (v19/v20) — los cuatro casos de la Sección 3, con sus recálculos preliminares como referencia pero no como valor final.

---

## 10. Alcance de este documento

Este instructivo es puramente informativo/instructivo. La sesión que lo escribió **no ejecutó ninguna escritura en Supabase** — ni `apply_migration` ni `execute_sql` de escritura — y no inició sesión en ninguna cuenta ni ingresó credenciales en ningún momento de todo el proyecto. Toda acción de carga descrita acá debe ejecutarla la sesión de Claude Code que tiene ese permiso, usando este documento como guía de interpretación de los 9 archivos fuente.


---

## Meta-documento 2: Conclusiones — moneda volátil → margen (v16-v25)

<!-- Contenido verbatim del research entregado por el usuario -->

# Moneda volátil → margen de remesas: documento de conclusiones (v16-v25)

> **Estado del proyecto: investigación pausada a pedido, cierre en v25 (2026-09-03).** Este documento reemplaza la necesidad de leer los 10 archivos de research (`research-findings-*-v16` a `*-v25-addendum.md`) para entender el estado actual del hilo — consolida las cifras ya corregidas, con el contexto metodológico fresco. Para el detalle de carga a Supabase, sigue vigente `INSTRUCTIVO-carga-v16-a-v24.md` (actualizado con las confirmaciones de v25).

---

## 1. La pregunta que abrió el proyecto

¿Los países con monedas volátiles o en crisis pagan, de forma sistemática, un margen cambiario más alto al enviar remesas al exterior que los países con monedas estables? La hipótesis de trabajo, probada corredor por corredor desde v16: **sí, y la brecha es grande** — pero el tamaño exacto de esa brecha dependía de un error metodológico que no se detectó hasta la Sección 6 de v23, y que terminó de confirmarse recién en v25.

---

## 2. La corrección metodológica central (aplica a todo lo que sigue)

Monito muestra, para cada proveedor, un "% peor que el tipo de cambio medio" — pero esa cifra **solo compara el tipo de cambio aplicado contra el tipo de cambio de mercado**. No incluye el costo de la comisión fija como fracción del monto enviado. Cuando la comisión es $0, esa cifra coincide con el costo real. Cuando la comisión es un monto fijo con peso real sobre el envío, **la cifra de Monito subestima el costo real**, a veces por el doble.

**Fórmula del costo real:**

```
costo_real = 1 − recibido / (monto_enviado × tipo_de_cambio_medio)
```

Esta corrección se descubrió con Mukuru en Botsuana (v23) — donde el "margen más bajo del proyecto" (0.37%) resultó ser en realidad uno de los más altos (7.9-9.6%) — y en esta última ronda (v25) se confirmó que también afectaba al comparador fundacional del proyecto (Western Union Chile/Argentina, establecido en v16) y a Skrill en Kenia. **Todas las cifras de este documento ya tienen la corrección aplicada donde correspondía**; se marca explícitamente cuándo un valor no la necesitó (comisión $0).

---

## 3. Los "termómetros" controlados — la evidencia más sólida del proyecto

Estos son los casos donde se comparó el mismo proveedor, mismo mecanismo de precios, en corredores con origen de moneda volátil vs. moneda estable — el diseño experimental más limpio del proyecto.

### 3.1 Western Union: Chile (moneda estable) vs. Argentina (moneda volátil) — el caso fundacional

| Corredor | Costo real | Nota |
|---|---|---|
| Chile→España | **3.25%** | Confirmado en vivo, v25 §1.2 |
| Argentina→EEUU | **10.10%** | Confirmado en vivo, v25 §1.3, validado por consistencia interna con Global66 |

**La brecha se sostiene con la corrección (Argentina ≈3.1 veces más cara que Chile) — pero la magnitud absoluta cambió sustancialmente respecto a lo publicado entre v16 y v24 (Chile 1.37-1.40%, Argentina 5.12-5.35%, brecha "de casi 4 veces").** La conclusión cualitativa del proyecto (moneda volátil → margen mucho más alto) resulta reforzada, no debilitada, por la corrección: ambos números subieron, pero el de Argentina subió más en términos absolutos.

### 3.2 Global66: mismo origen (Argentina), distintos destinos

Argentina→EEUU: 5.24% (comisión $0, no necesita corrección). Un dato adicional, no un segundo termómetro — confirma que el margen alto de Argentina no es exclusivo de Western Union.

### 3.3 México — el país "de control" de moneda estable

Western Union en México se mantuvo estable en 0.86%-1.09% en las mediciones históricas del proyecto (comisión baja/proporcional, no necesitó la corrección de comisión fija en la misma medida). OFX en México, en cambio, mostró un comportamiento distinto: 2.5%-4.04% según el monto (ver Sección 4) — México sigue funcionando como el "control" de moneda estable frente al cual se miden los países volátiles.

### 3.4 OFX: mismo proveedor "de relleno", múltiples orígenes

| Origen | Costo real | Nota |
|---|---|---|
| Egipto→Reino Unido | 4.14% | Comisión $0 |
| Egipto→EEUU | 7.53% | Comisión $0 |
| Egipto→Italia | 7.54% | Comisión $0 |
| Pakistán | 5.13% | Comisión $0 — "en el rango de Argentina" |
| Sri Lanka | Bajo (ver v18 para cifra exacta) | Comisión $0 |
| México (control) | 2.5%-4.04%, según monto | Comisión $0; único caso del proyecto donde el margen del proveedor depende marcadamente del tamaño de la transferencia |
| Tanzania→Reino Unido | 8.21% | Comisión $0 — nuevo en v25, el más alto del grupo OFX |

Todos los valores de OFX son directos (comisión $0 en todos los corredores probados) — ninguno necesitó la corrección de la Sección 2.

### 3.5 Skrill: mismo proveedor, tres corredores de Kenia

| Corredor | Costo real | Nota |
|---|---|---|
| Kenia→Alemania | 2.51% | Comisión $0 — el único corredor de Skrill sin comisión fija encontrado |
| Kenia→Reino Unido | 7.73% | Confirmado en vivo v25 §2.1 — corrige una exención que se había declarado erróneamente en v24 |
| Kenia→EEUU | 8.28% | Confirmado en vivo v25 §2.2 |

La variación entre los tres corredores de un mismo proveedor en un mismo país de origen (2.51% a 8.28%) es un recordatorio de que **la comisión, no solo la moneda de origen, determina buena parte del costo total** — y de que ningún proveedor puede darse por "exento" de la corrección sin verificar cada corredor por separado.

---

## 4. El clúster de Mukuru — siete países, todos en África subsahariana austral y oriental

Mukuru apareció como proveedor "de relleno" en siete países durante el proyecto, todos con la corrección de comisión fija ya aplicada:

| País (origen) | Costo real | Rango de destinos probados |
|---|---|---|
| Kenia | 8.43%-9.85% | EEUU, Reino Unido, Alemania |
| Sudáfrica | 1.86%-3.27% | Múltiples destinos — el más bajo del clúster |
| Zambia | 4.99%-8.93% | Múltiples destinos |
| Botsuana | 7.91%-9.64% | EEUU, Sudáfrica, Reino Unido — antes citado erróneamente como "0.37%, el más bajo del proyecto" |
| Lesotho | 1.2%-5.21% | Reino Unido (bajo), EEUU (medio), Sudáfrica (alto) — gradiente limpio por destino |
| Uganda | ≈7.52% | Reino Unido — primer país del clúster fuera de África austral |
| Rwanda | 7.42% | Reino Unido |

**Patrón no resuelto:** Lesotho muestra un gradiente ordenado y consistente según el destino (más barato hacia el Reino Unido, más caro hacia Sudáfrica), pero Botsuana no sigue el mismo orden pese a estar en la misma región y usar el mismo proveedor. No se encontró una explicación — quedó como pregunta abierta, posiblemente relacionada con distintos socios de pago/agentes de Mukuru según el país receptor. Se buscó un octavo país de Mukuru fuera de este clúster geográfico (se probó Pakistán, Filipinas, Tanzania, Senegal) sin éxito — la cobertura de Mukuru en Monito parece confinada a este grupo de países.

---

## 5. Bolivia — el caso que no tiene un número representativo

Western Union en Bolivia se midió desde cinco orígenes distintos, con resultados que van de 0.62% a 9.16% — más de 8 puntos porcentuales de rango, sin relación clara entre origen y margen:

| Origen | Costo real |
|---|---|
| EEUU | 0.62%-1.35% (decrece con el monto) |
| España | 2.04%-2.14% |
| Brasil | 3.62% |
| Italia | 6.35% |
| Argentina | 9.16% |

A diferencia de los "termómetros" de la Sección 3, Bolivia no funciona como un punto de comparación limpio — la variabilidad es demasiado alta como para atribuirle un margen único al país. Esta línea de investigación se consideró suficientemente explorada y no se recomienda seguir sumando orígenes.

---

## 6. El problema estructural del peso argentino (ARS)

Independiente del sesgo de comisión de la Sección 2, el tipo de cambio "medio" que usa Monito/XE para el ARS no siempre refleja una tasa realmente disponible, por la historia de tipos de cambio dual/paralelo del país. En la medición de la Sección 3.1 (Argentina→EEUU) el número pasó una prueba de consistencia interna y se trata como confiable — pero en otros corredores probados con origen Argentina (ej. Italia→Argentina, v24 §7.2) la misma fórmula dio resultados sin sentido (costo real negativo). **Ningún corredor en ARS debería tratarse como "resuelto" de forma automática** — cada uno necesita su propia verificación de consistencia antes de confiar en el número.

---

## 7. Cobertura cero — por qué también es información válida

Una parte significativa del proyecto consistió en encontrar países sin ningún proveedor en Monito para su moneda local. Esto no es un vacío de datos — es evidencia de un mecanismo distinto en cada caso:

- **Sanciones o restricciones regulatorias formales:** Líbano (Banque du Liban, Decisión 13729), Venezuela (sanciones OFAC 2019 hasta abril de 2026, recién levantadas al momento del cierre del proyecto).
- **Mecanismos de control cambiario del banco central:** Nigeria (Banco Central, enero 2024) y Ghana (mismo mecanismo).
- **Guerra o colapso institucional:** Ucrania, Rusia (contexto de guerra), Sudán (guerra civil que fracturó el sistema monetario en dos autoridades competidoras desde 2023).
- **Mercados de remesas fragmentados/informales, no indexados por comparadores web:** Cuba, Surinam, Gambia, Guinea, Mozambique, Malaui, Nicaragua, Angola, Sierra Leona, y la mayoría de los candidatos probados en la última ronda de búsqueda (Myanmar, Laos, Bangladesh, Vietnam, Paraguay, Mongolia, Camboya).
- **Cobertura de Monito limitada a un subconjunto de rutas dentro de una región** (Namibia y Eswatini, vecinos de países del clúster de Mukuru, no tienen cobertura de Mukuru pese a la cercanía geográfica).

*(Para el listado exhaustivo y las fechas exactas de cada verificación, ver los archivos fuente v16-v25 — este documento resume los mecanismos, no pretende ser el registro país por país.)*

---

## 8. Fuera de alcance: países sin moneda local disponible en Monito

Hallazgo de la última ronda (v25 §4.2): Zimbabue, la República Democrática del Congo y Sudán del Sur — tres de los candidatos más obvios del proyecto por su historia cambiaria extrema — no tienen su moneda local como opción en el selector de Monito. El sistema los fuerza a USD (Zimbabue, Congo) o GBP (Sudán del Sur) por defecto. **No hay margen cambiario que medir ahí** con los datos que ofrece la plataforma — quedan fuera del alcance de este hilo, no por falta de proveedores sino porque la pregunta no aplica.

---

## 9. Conclusión general

La hipótesis central del proyecto —que el origen en una moneda volátil o en crisis se asocia con un margen de remesas más alto— **se sostiene con la corrección aplicada, y en algunos casos se sostiene con más fuerza que antes de corregir**: la brecha Chile/Argentina, el caso que abrió el proyecto, pasó de "casi 4 veces" a "poco más de 3 veces" en términos relativos, pero ambos extremos subieron en términos absolutos (Argentina en particular, de ~5.3% a ~10.1%). El clúster de Mukuru, una vez corregido, muestra márgenes uniformemente altos (mayoría entre 5% y 10%) que antes de la corrección aparecían artificialmente bajos en varios casos (Botsuana era, antes de corregir, "el margen más bajo del proyecto"; corregido, es de los más altos).

Lo que el proyecto **no** logró establecer con la misma solidez: una explicación causal completa de por qué algunos países dentro del mismo perfil de riesgo cambiario tienen márgenes muy distintos (Lesotho vs. Botsuana, mismo proveedor, misma región), y una resolución definitiva del problema de referencia cambiaria para el ARS que permita generalizar con confianza a cualquier corredor argentino sin verificación caso por caso.

**Cifras con datos de margen reales, corregidos y confiables al cierre del proyecto:** 16 países/casos (Chile, Argentina x2 proveedores, México, Turquía, Egipto, Pakistán, Sri Lanka, Kenia x2 proveedores, Sudáfrica, Zambia, Botsuana, Lesotho, Uganda, Rwanda, Bolivia [como rango, no número único], Tanzania). Más de 25 países adicionales documentados con cobertura cero y su mecanismo asociado.

---

## 10. Estado de cierre

Investigación pausada a pedido explícito en esta fecha (2026-09-03), después de v25. No hay líneas de investigación bloqueantes ni errores sin resolver conocidos — los dos hallazgos que quedaron pendientes de confirmación en la ronda anterior (Chile/Argentina y Skrill Kenia) se confirmaron en vivo antes del cierre. Si se retoma en el futuro, los puntos de entrada más productivos identificados fueron: probar Tanzania hacia otros destinos, revisar Asia Central/Cáucaso como región todavía no explorada, y — si alguna vez se resuelve el problema de referencia del ARS — reabrir la auditoría de corredores argentinos con esa resolución en mano.

Esta sesión de investigación no realizó ninguna escritura en Supabase en ningún momento del proyecto — todo el trabajo fue de research y documentación, para que otra sesión con permisos de escritura ejecute la carga usando este documento y el instructivo como guía.


---

## research-findings-2026-09-02-v16-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #10 (v16) — Argentina confirmado: el margen alto de Global66 es del peso, no del par de divisas

> **Documento nuevo — no reemplaza a v6-v15 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya tiene v15
> descargado. Este es un duodécimo archivo con **solo lo nuevo de esta
> ronda**. Para el panorama completo hacen falta los 12 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** todos los
> datos nuevos de esta ronda son limpios (sin insignia promocional, sin
> el problema de doble monto de v11 Sección 31) — no hace falta aplicar
> ninguna corrección.
>
> **Actualizado el mismo día, cuatro veces.** Primera versión: se cierra el
> pendiente que había quedado abierto al final de v15 (Sección 6, plan
> item 14): un tercer corredor argentino, esta vez hacia un destino no
> europeo (**Argentina→EEUU**, USD en vez de EUR), para probar si el
> margen alto de Global66 en Argentina (~5,3%, visto en España e
> Italia) es específico del par ARS→EUR o se extiende a cualquier
> destino. **Resultado: se extiende.** Global66 muestra 5,24% de margen
> en Argentina→EEUU — prácticamente igual al 5,28% de España/Italia —
> confirmando con un tercer corredor independiente que el fenómeno es
> del **origen** (riesgo cambiario del peso argentino), no del destino
> específico. Con esto, la pregunta abierta al final de v15 queda
> cerrada.
>
> **Segunda actualización (Sección 3):** se probó si el patrón "margen
> alto en origen de moneda volátil" se generaliza más allá de Global66,
> como sugería el plan de la primera versión. **Se confirma con
> Western Union**: en Chile→España (misma moneda de destino, EUR, que
> los corredores argentinos), Western Union muestra solo 1,37%-1,40% de
> margen — muy por debajo del 5,12%-5,35% que muestra en los tres
> corredores argentinos. Es la primera comparación controlada del
> proyecto (mismo proveedor, mismo destino, origen distinto) que aísla
> el efecto de la moneda de origen.
>
> **Tercera actualización (Sección 4):** se intentó extender el patrón
> en dos direcciones y una quedó bloqueada, la otra dio un hallazgo
> distinto pero valioso. **(a)** MoneyGram, candidato natural para un
> tercer proveedor dentro de Argentina (Plan item 3 de la ronda
> anterior), no aparece en ningún corredor con origen Argentina probado
> hasta ahora (España, Italia, EEUU, y ahora Bolivia) — el test queda
> bloqueado por falta de datos, no descartado. **(b)** Se probó Líbano
> (LBP) como origen de moneda todavía más volátil que el peso argentino
> (Plan item 4) — pero Monito no tiene **ningún** proveedor para
> Líbano→Francia, así que no se pudo obtener un punto de margen. La
> cobertura cero, sin embargo, tiene una explicación regulatoria
> concreta y fechada: la **Decisión Básica N.º 13729 del Banque du
> Liban** (1 de julio de 2025), que restringe los retiros en moneda
> extranjera de cuentas anteriores a noviembre de 2019 — formalizando
> restricciones bancarias informales vigentes desde octubre de 2019. Es
> el mismo tipo de hallazgo que China (v13) y Corea del Sur (v14): una
> explicación regulatoria independiente para una cobertura ausente o
> escasa en Monito.
>
> **Cuarta actualización (Sección 5):** se repitió el intento de la
> ronda anterior con un segundo candidato de moneda extrema —
> **Venezuela (VES)** — probado hacia tres destinos distintos (Colombia,
> España, EEUU). **Mismo resultado que Líbano: cobertura cero en los
> tres.** Pero la explicación esta vez es distinta y más rica: no es una
> restricción bancaria doméstica reciente, sino **siete años de sanciones
> de EE.UU. al Banco Central de Venezuela** (abril 2019-abril 2026, OFAC)
> que cortaron a la banca venezolana de sus relaciones de banca
> corresponsal internacional (una caída de más del 80% de esas
> relaciones para 2022, según el BIS) — la infraestructura que cualquier
> proveedor de remesas necesita para operar. Dato llamativo: esas
> sanciones específicas se **levantaron apenas cinco meses antes de esta
> medición** (Licencia General 57 de OFAC, 14 de abril de 2026), pero
> Monito todavía no muestra ningún proveedor — sugiriendo que la
> reapertura regulatoria todavía no se tradujo en cobertura real. Con
> dos países de crisis cambiaria seguidos (Líbano, Venezuela) dando
> cobertura cero en vez de un dato de margen, el plan para la próxima
> ronda cambia de enfoque: en vez de insistir con monedas en crisis
> extrema, conviene buscar un origen de inflación alta pero con sistema
> bancario todavía conectado internacionalmente (candidatos: Turquía,
> Nigeria, Egipto).

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v15, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Argentina→EEUU, tercer corredor argentino: confirma que el margen
   alto de Global66 es del peso, no del par de divisas.** Margen 5,24%
   (contra 5,28% en España e Italia, ambos EUR) — con tres corredores
   independientes hacia tres monedas de destino distintas (EUR vía dos
   países, y ahora USD) dando prácticamente el mismo número, la
   explicación de "riesgo cambiario genuino del peso argentino" queda
   bastante más sólida que antes. Ver Sección 1.
2. **Western Union confirma el mismo patrón**: 5,35% de margen FX en
   Argentina→EEUU, en línea con el 5,27%-5,12% visto en los otros dos
   corredores. Ver Sección 1.
3. **Tabla de Global66 actualizada** (extiende la de v15, Sección 5.2):
   con Argentina, Global66 ya tiene 5 países de origen medidos — 3 de
   margen bajo/nulo (Chile, Perú, México), 1 de comisión plana con
   margen favorable (Colombia) y ahora 1 de margen genuinamente alto
   pero consistente (Argentina, ~5,2%-5,3% en sus 3 corredores). Ver
   Sección 2.

**Segunda ronda del mismo día (Sección 3):**

4. **El patrón se generaliza más allá de Global66: Western Union
   también muestra un margen mucho más alto en Argentina que en un
   país de moneda estable, para el mismo destino.** Comparación
   controlada Chile→España vs. Argentina→España (mismo proveedor,
   mismo destino/moneda EUR): Western Union pasa de 1,37%-1,40% de
   margen en Chile a 5,12% en Argentina — casi 4 veces más. Ver
   Sección 3.
5. **De paso, Global66 y MoneyGram reconfirman sus patrones ya
   establecidos en un país más:** Global66 con margen casi nulo en
   Chile→España (0,02%, coherente con Chile en general) y MoneyGram con
   el patrón promocional de doble monto otra vez (real 4,86%, corregido
   desde un monto promocional). Ver Sección 3.1.

**Tercera ronda del mismo día (Sección 4):**

6. **MoneyGram sigue sin aparecer en ningún corredor con origen
   Argentina** (España, Italia, EEUU, y ahora Bolivia) — el candidato
   natural a "tercer proveedor" para el patrón de la Sección 3 queda
   bloqueado por falta de datos, no descartado. De paso, Bolivia
   reconfirma el patrón de Western Union en Argentina: 4,03% de margen,
   en línea con los otros tres corredores. Ver Sección 4.
7. **Se probó Líbano (LBP) como origen de moneda todavía más volátil
   que el peso argentino — Monito no tiene ningún proveedor para ese
   corredor.** No es un dato de margen, pero la cobertura cero se
   explica con una fuente regulatoria concreta y fechada: la Decisión
   Básica N.º 13729 del Banque du Liban (1 de julio de 2025), que
   restringe los retiros en moneda extranjera de cuentas pre-crisis.
   Mismo patrón metodológico que China (v13) y Corea del Sur (v14). Ver
   Sección 4.

**Cuarta ronda del mismo día (Sección 5):**

8. **Venezuela (VES) probado hacia tres destinos (Colombia, España,
   EEUU) — cobertura cero en los tres, igual que Líbano.** Pero la
   explicación es distinta: no una restricción bancaria doméstica, sino
   siete años de sanciones de EE.UU. al Banco Central de Venezuela
   (2019-2026) que cortaron a la banca venezolana de la banca
   corresponsal internacional. Ver Sección 5.
9. **Dato llamativo: esas sanciones se levantaron hace apenas cinco
   meses (OFAC, abril de 2026) y Monito todavía no muestra cobertura**
   — la reapertura regulatoria no se tradujo (todavía) en proveedores
   activos. Con dos países de crisis cambiaria seguidos sin dato de
   margen, el plan cambia de enfoque para la próxima ronda: buscar
   inflación alta con banca todavía conectada (Turquía, Nigeria,
   Egipto) en vez de crisis cambiarias extremas. Ver Sección 5.

---

## 1. Argentina→EEUU: tercer corredor, confirma el patrón con una moneda de destino distinta

Corredor con cobertura igual de delgada que los otros dos corredores
argentinos (2 proveedores, 594 comparaciones en 3 meses — el más
delgado de los tres). Datos para un envío de 100.000 ARS, mid-market 1
ARS = 0,000662 USD aproximado (calculado a partir del margen y el
monto recibido, ver nota):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets | Costo total |
|---|---|---|---|---|---|
| **Global66** | Cuenta bancaria | Free | 0,000627 | 62,72 USD | **~5,24%** (margen FX = costo total, sin fee) |
| Western Union | Cash pickup | 5.000 ARS (5%) | 0,000627 | 59,52 USD | **5,35%** margen FX (costo total más alto por el fee, no calculado con precisión acá) |

Ambos datos son limpios (sin insignia promocional, un solo monto cada
uno) — mismo patrón que España e Italia.

**Con tres corredores independientes (España, Italia y ahora EEUU),
Global66 muestra un margen de tipo de cambio prácticamente idéntico en
los tres (5,28%, 5,28%, 5,24%)** — a pesar de que el destino cambia de
moneda (EUR a USD) y de país. Esto extiende y refuerza la conclusión
de v15 (Sección 6.2): **el margen alto no depende del destino
específico ni de su moneda — depende del origen (pesos argentinos).**
La hipótesis de "riesgo cambiario genuino de una moneda volátil/
inflacionaria" (favorecida sobre la de controles de capital y sobre la
de cobertura delgada/competencia en v15) queda considerablemente más
sólida con este tercer punto de dato: un proveedor gestionando el
riesgo de mantener/convertir pesos argentinos aplicaría, con lógica,
un margen similar sin importar en qué moneda finalmente entrega el
dinero — que es exactamente el patrón observado.

**Western Union también reconfirma el patrón** (5,35% de margen FX en
EEUU, contra 5,27% en Italia y 5,12% en España) — la variación entre
los tres corredores de Western Union (5,12%-5,35%) es algo mayor que
la de Global66 (5,24%-5,28%), pero sigue siendo un rango angosto
comparado con los casos de margen "verdaderamente variable" del
proyecto (Xoom, Mukuru — v15 Sección 5.1), donde los rangos superan
varios puntos porcentuales.

**Con esto, la pregunta abierta al final de v15 (plan item 14) queda
cerrada:** el fenómeno de Argentina es consistente entre monedas de
destino (EUR y USD), lo que apunta con bastante confianza a que es un
rasgo del origen (ARS) y no una coincidencia de dos corredores
similares (España e Italia comparten no solo la moneda EUR sino
también el vínculo migratorio histórico con Argentina — EEUU no
comparte ninguna de las dos cosas de la misma manera, y aun así da un
resultado casi idéntico).

---

## 2. Global66 — tabla actualizada con 5 países de origen

Extiende la tabla de v15 (Sección 5.2) con el nuevo perfil de
Argentina:

| País de origen | Corredores medidos | Margen FX | Perfil |
|---|---|---|---|
| Chile | 2 (CLP→EUR, CLP→USD) | ~0,05%/-0,14% | Margen bajo/nulo |
| Perú | — (mencionado desde antes de esta sesión) | bajo | Margen bajo/nulo |
| México | 2 (Guatemala, EEUU) | 0,01% en ambos | Margen bajo/nulo |
| Colombia | 1 (España) | -1,17% (favorable) con comisión plana 3% | Comisión plana, costo total moderado (~1,80%) |
| **Argentina** | **3 (España, Italia, EEUU)** | **5,24%-5,28%** | **Margen alto, pero consistente** |

**Global66 pasa de ser un caso simple ("margen bajo y consistente") a
uno más matizado con 5 países de origen medidos: en 3 de 5 el margen
es casi nulo, en 1 usa un modelo de comisión plana con margen
favorable, y en 1 (Argentina) el margen es alto pero igual de
consistente entre corredores que en los países de margen bajo.** Esto
es un dato importante para cómo se documenta Global66 en el proyecto:
no se le puede asignar un único número de margen "representativo" sin
especificar el país de origen — el margen depende fuertemente de qué
moneda de origen está gestionando el proveedor, más que ser una
característica fija de la empresa. **Hipótesis para una futura ronda:**
si el patrón se sostiene, países de origen con monedas históricamente
volátiles/inflacionarias (como el peso argentino) probablemente
muestran márgenes más altos en general, no solo para Global66 — sería
interesante probar si Western Union, que también opera en los tres
países latinoamericanos con margen bajo de Global66 y en Argentina,
muestra el mismo salto (los datos que ya se tienen de Western Union en
Argentina, Sección 1, sugieren que sí).

---

## 3. El patrón se generaliza: Western Union confirma margen más alto en Argentina que en un país de moneda estable

La Sección 2 sugería probar si el patrón "margen alto en países de
moneda volátil" era específico de Global66 o se repetía con otros
proveedores. Se armó la comparación más controlada posible dentro del
proyecto: **el mismo proveedor (Western Union), el mismo destino y
moneda (España, EUR), cambiando solo el país/moneda de origen**
(Argentina/ARS vs. Chile/CLP).

### 3.1 Chile→España: Western Union con margen bajo, en el mismo destino que los corredores argentinos

Datos para un envío de 100.000 CLP, mid-market 1 CLP = 0,000927 EUR
(92,70 EUR de referencia):

| Proveedor | Método | Fee | Tipo de cambio | Recipient gets (promo) | Recipient gets (real) | Costo total (real) |
|---|---|---|---|---|---|---|
| **MoneyGram** | Cuenta bancaria | Free | 0,000900 (promo) | 90,00 EUR | **88,20 EUR** | **~4,86%** |
| Western Union | Cuenta bancaria | 2.100 CLP | 0,000914 | — (limpio) | 89,50 EUR | **~1,37%-1,40%** |
| Global66 | Cuenta bancaria | 4.000 CLP | 0,000927 | — (limpio) | 88,97 EUR | **~0,02%** de margen FX |

**MoneyGram reconfirma el patrón promocional de doble monto** (badge
"Includes special offers", identificado por URL `go.monito.com/
moneygram`) — mismo mecanismo ya documentado en Brasil (v15). **Global66
reconfirma su margen casi nulo en Chile** (0,02%, coherente con
mediciones anteriores del proyecto en este país). Y **Western Union
muestra un margen de 1,37%-1,40%** — bajo, en línea con lo esperado
para un país de moneda relativamente estable.

### 3.2 La comparación: mismo proveedor, mismo destino, origen distinto

| Origen (proveedor: Western Union) | Destino | Margen FX |
|---|---|---|
| **Argentina** (ARS) | España (EUR) | **5,12%** |
| **Chile** (CLP) | España (EUR) | **1,37%-1,40%** |

**Con el destino y la moneda de destino controlados (ambos España/EUR),
el margen de Western Union es casi 4 veces más alto desde Argentina que
desde Chile.** Esta es la comparación más limpia que el proyecto tiene
hasta ahora para aislar el efecto de la moneda de origen: mismo
proveedor, mismo corredor de destino, solo cambia el país/moneda que
envía. **El patrón "margen alto en países de origen con moneda
volátil/inflacionaria" ya no es una observación aislada de Global66 —
se repite con un segundo proveedor grande e independiente.**

Como referencia adicional (sin destino controlado, pero en la misma
dirección): Western Union también mostró márgenes bajos en los
corredores mexicanos de v14 (Guatemala 1,09%, Honduras 0,86%, ambos
cuenta bancaria) — un tercer país de moneda relativamente estable con
el mismo patrón de margen bajo. **Con tres países de origen de moneda
estable (Chile, México, y los orígenes de InstaReM/Global66 en general)
mostrando márgenes de Western Union por debajo de 1,5%, contra el rango
5,12%-5,35% de sus tres corredores argentinos, el patrón queda bastante
bien establecido** — aunque, siendo rigurosos, con dos proveedores y
un origen de moneda volátil (Argentina) medido hasta ahora, todavía es
una muestra chica para llamarlo una regla general del proyecto.

---

## 4. MoneyGram sigue ausente en Argentina; Líbano probado como origen todavía más volátil, cobertura cero explicada por una crisis bancaria activa

### 4.1 MoneyGram, Argentina→Bolivia: sigue sin aparecer

Siguiendo el Plan item 3 de la ronda anterior (probar un tercer
proveedor dentro de Argentina, con MoneyGram como candidato natural por
tener datos limpios tanto en Chile como en Argentina-vía-Brasil), se
revisó el corredor Argentina→Bolivia
(`monito.com/send-money/argentina/bolivia/ars/bob`). El resultado es el
mismo que en España, Italia y EEUU: **solo aparecen Western Union y
Global66**, dos proveedores en total. MoneyGram no tiene presencia en
ningún corredor con origen Argentina revisado hasta ahora.

De paso, el corredor deja un dato incidental que reconfirma el patrón
de la Sección 3: Western Union, sobre una transferencia de 700.000 ARS
a retiro en efectivo, cobra 35.000 ARS de comisión (5%) con una tasa de
0,007594 (5.050 BOB recibidos), lo que Monito marca como **4,03% peor
que el mid-market**. Es el cuarto corredor argentino de Western Union
medido esta sesión (junto a España 5,12%, Italia ~5,27%, EEUU 5,35%),
todos en el mismo rango 4%-5,4%.

**Conclusión:** el test del "tercer proveedor" sigue abierto, no
descartado — es una limitación de qué proveedores lista Monito para
Argentina, no evidencia de que el patrón no se sostenga con MoneyGram.

### 4.2 Líbano→Francia: cobertura cero en Monito

Para probar si la relación "más volatilidad de moneda → más margen" es
proporcional o se satura, se buscó un origen con una moneda
históricamente más volátil que el peso argentino. Líbano (LBP) es un
caso conocido por su crisis bancaria y cambiaria activa desde 2019.

Al navegar a `monito.com/send-money/lebanon/france/lbp/eur`, Monito
devuelve: *"No results — We couldn't find any providers who'd transfer
1,000 LBP from Lebanon to France"*, con un monto mínimo sugerido de
17.957.700 LBP y una tasa mid-market de referencia de 1 LBP =
0,00000963 EUR. Un intento de forzar un monto mayor vía parámetro de
URL (`?amount=20000000`) no tuvo efecto — la página volvió a mostrar el
mismo estado de "sin resultados" para el monto por defecto de 1.000
LBP. No se probaron otras formas de interactuar con el campo de monto
(por ejemplo, un click directo en el input), así que **no se puede
afirmar con total certeza que la cobertura sea cero a cualquier
monto** — pero sí que lo es al menos para los montos que la interfaz
estándar de Monito permite alcanzar.

**Esto no es un punto de margen** (a diferencia de Argentina, Chile,
México, etc.) — es una ausencia total de cobertura, y por lo tanto no
extiende directamente la tabla de comparación de márgenes de la
Sección 3. Pero la ausencia en sí misma es un dato, y tiene una
explicación concreta.

### 4.3 Por qué: la Decisión Básica N.º 13729 del Banque du Liban

Una búsqueda independiente (`WebSearch` + `WebFetch` de un artículo del
estudio Herbert Smith Freehills Kramer,
`hsfkramer.com/notes/arbitration/2025-06/foreign-currency-foreign-litigation-lebanon`)
confirma el mecanismo regulatorio detrás de la ausencia de proveedores:

- El **Banque du Liban** (banco central libanés) emitió la **Decisión
  Básica N.º 13729** el **1 de julio de 2025**, que restringe los
  retiros en moneda extranjera de cuentas bancarias abiertas antes del
  17 de noviembre de 2019 — permitiendo solo montos dentro de límites
  fijados por el banco central, o retiros mayores con autorización
  previa y explícita del propio Banque du Liban.
- Esta decisión **formaliza** restricciones bancarias que ya eran
  informales desde octubre de 2019 (el inicio de la crisis), cuando
  los bancos libaneses empezaron a limitar retiros y transferencias en
  dólares de facto, sin una base regulatoria explícita.
- El banco central justificó la medida citando "estabilidad
  financiera" y "equidad entre depositantes" en medio de la crisis
  bancaria en curso.

**Encaja con el patrón metodológico ya establecido en el proyecto**
(China, v13, cupo anual ~US$50.000 de SAFE; Corea del Sur, v14, sistema
bancario escalonado con límites de US$50.000/US$100.000): una
explicación regulatoria concreta y fechada para una cobertura ausente
o escasa en Monito, en vez de asumir que se trata simplemente de una
plataforma con datos incompletos. La diferencia con esos dos casos es
de grado — allí Monito sí tenía algo de cobertura (aunque restringida o
con provedores específicos), mientras que en Líbano la cobertura es
completamente cero, consistente con que la restricción de 2025 aplica
a retiros en general, no a un tipo específico de transferencia.

**Nota metodológica:** esto deja la pregunta del Plan item 4 (¿la
relación volatilidad→margen es proporcional o se satura?) sin
responder todavía — Líbano no dio un punto de margen para comparar. Si
se quiere seguir esta línea, el próximo paso sería buscar un origen con
volatilidad extrema pero que sí tenga cobertura activa en Monito (por
ejemplo, alguna moneda con inflación muy alta pero sin restricciones de
retiro tan severas como las libanesas).

---

## 5. Venezuela — segundo intento con moneda extrema, cobertura cero explicada por siete años de sanciones a la banca central (2019-2026, recién levantadas)

### 5.1 Cobertura cero en tres destinos

Siguiendo la sugerencia de la Sección 4.3 (buscar otro origen de
volatilidad extrema tras el resultado de Líbano), se probó Venezuela
(VES) — moneda con una historia de hiperinflación bien conocida y tres
redenominaciones desde 2008 (Bolívar Fuerte, Soberano, Digital) — hacia
tres destinos distintos:

- `monito.com/send-money/venezuela/colombia/ves/cop` — sin resultados
- `monito.com/send-money/venezuela/spain/ves/eur` — sin resultados
- `monito.com/send-money/venezuela/united-states/ves/usd` — sin
  resultados

En los tres casos Monito devuelve el mismo mensaje ("We couldn't find
any providers who'd transfer 1,000 VES from Venezuela to...") y sugiere
un monto mínimo más alto (160.000 VES). Se intentó aumentar el monto
usando el propio formulario de la página (campo numérico, botón "Find
providers") en el corredor Venezuela→Colombia — el resultado no
cambió: sigue sin listar ningún proveedor. Con tres destinos
distintos (dos monedas fuertes, EUR y USD, y una regional, COP) dando
el mismo resultado, la cobertura cero parece estructural y no un
problema de un corredor específico.

**Es el segundo país seguido (después de Líbano) en dar cobertura
total cero en vez de un dato de margen** — pero, a diferencia de
Líbano, la explicación no es una restricción bancaria doméstica sobre
retiros.

### 5.2 La explicación: sanciones de EE.UU. al Banco Central de Venezuela, 2019-2026

Una búsqueda independiente (`WebSearch` + `WebFetch` de fuentes que
incluyen OFAC directamente, CEPR, y Rio Times) reconstruye una
cronología distinta a la de Líbano:

- **Abril de 2019:** OFAC designó al **Banco Central de Venezuela
  (BCV)** como entidad sancionada (Orden Ejecutiva relacionada con el
  reconocimiento de Juan Guaidó por EE.UU. en enero de 2019), bloqueando
  sus activos en EE.UU. y cortándolo, en la práctica, del sistema
  financiero internacional.
- **Efecto medido por el BIS:** entre 2011 y 2019 las transacciones de
  bancos venezolanos con bancos corresponsales extranjeros cayeron 87%
  en número y 99% en monto. Para 2022, los bancos venezolanos habían
  perdido **más del 80% de sus relaciones de banca corresponsal**
  — comparado con 24% en México y 36% en Colombia en el mismo período.
  La banca corresponsal es la infraestructura que cualquier proveedor
  de remesas (Western Union, Wise, MoneyGram, etc.) necesita para mover
  dinero hacia o desde un país — sin ella, no hay forma técnica de
  ofrecer el servicio, más allá de si está permitido o no.
- **Nota importante: las remesas personales sí estaban permitidas
  incluso bajo sanciones** — la Licencia General 16B de OFAC autoriza
  explícitamente remesas personales no comerciales, siempre que no
  involucren personas o entidades bloqueadas. El problema no era la
  legalidad de la remesa individual, sino que los propios bancos
  venezolanos no tenían canales internacionales por los que un proveedor
  pudiera operar.
- **14 de abril de 2026 — apenas cinco meses antes de esta medición:**
  OFAC emitió la **Licencia General 57**, levantando las sanciones sobre
  el BCV y tres bancos estatales (Banco de Venezuela, Banco Digital de
  los Trabajadores, Banco del Tesoro), autorizando explícitamente
  "transferencias en dólares, banca corresponsal, remesas, pagos de
  salarios y operaciones de cambio". La motivación citada fue en
  realidad más comercial que humanitaria: licencias petroleras y
  mineras ya existentes no podían liquidarse porque no había vía legal
  bancaria para el ingreso de esos fondos (~US$1.000 millones
  acumulados sin poder desembolsarse).

**Lectura para el proyecto:** el hecho de que la cobertura siga en cero
**cinco meses después** de levantada la sanción sugiere que hay un
rezago entre la reapertura regulatoria y que los proveedores de
remesas efectivamente reconstruyan relaciones bancarias y aparezcan en
plataformas como Monito — siete años de aislamiento no se revierten de
un día para el otro. Es un matiz interesante para el patrón ya
establecido: no alcanza con que algo esté "permitido" en el papel para
que se refleje en la oferta real de proveedores.

### 5.3 Conclusión para el plan: cambiar de enfoque

Con Líbano y Venezuela dando el mismo resultado (cobertura cero, no un
dato de margen), la línea "buscar un origen de moneda todavía más
volátil que el peso argentino" parece estructuralmente poco productiva
en Monito: los países con las crisis cambiarias más extremas tienden a
ser justamente los que tienen la banca menos conectada
internacionalmente, así que Monito no los cubre en absoluto. Para
seguir probando si "más volatilidad → más margen" es proporcional,
conviene buscar un país con **inflación alta pero banca todavía
conectada** — no un colapso bancario. Candidatos razonables: Turquía
(TRY, inflación históricamente alta pero sistema bancario grande e
integrado internacionalmente), Nigeria (NGN) o Egipto (EGP).

---

## 6. Plan sugerido para la próxima ronda

1. **La línea de investigación sobre Argentina/Global66 parece
   suficientemente cerrada con 3 corredores** — no hace falta un cuarto
   corredor argentino salvo que aparezca una razón específica.
2. ~~Probar si el patrón "margen alto en países de moneda volátil" se
   generaliza más allá de Global66.~~ **Hecho (Sección 3)** — confirmado
   con Western Union en una comparación controlada (Chile→España vs.
   Argentina→España, mismo proveedor y destino): margen casi 4 veces
   más alto desde Argentina (5,12%) que desde Chile (1,37%-1,40%). El
   patrón deja de ser una observación aislada de Global66.
3. ~~Probar el patrón con un tercer proveedor "amplio" (ej. MoneyGram)
   dentro de Argentina.~~ **Intentado, bloqueado por datos (Sección
   4.1)** — MoneyGram no aparece en ningún corredor con origen
   Argentina probado (España, Italia, EEUU, Bolivia). Si se quiere
   seguir esta línea, el camino que queda es armar una tabla más amplia
   que cruce varios proveedores × varios países de origen con
   volatilidad conocida, en vez de insistir con MoneyGram
   específicamente en Argentina.
4. ~~Probar el mismo patrón con un origen de moneda todavía más
   volátil que el peso argentino.~~ **Intentado dos veces, sin punto de
   margen ninguna de las dos (Secciones 4.2-4.3 y 5.1-5.2)** — Líbano
   (explicado por la Decisión Básica N.º 13729 del Banque du Liban,
   julio 2025) y Venezuela (explicada por siete años de sanciones de
   OFAC al Banco Central de Venezuela, 2019-abril 2026, recién
   levantadas) dieron cobertura cero en vez de margen alto. **Conclusión
   del patrón (Sección 5.3): esta línea parece estructuralmente poco
   productiva** — los países con crisis cambiarias más extremas tienden
   a tener la banca demasiado desconectada internacionalmente como para
   que Monito los cubra en absoluto. La pregunta de si volatilidad→margen
   es proporcional sigue abierta, pero el próximo candidato debería
   tener **inflación alta con banca todavía conectada** (no un colapso
   bancario) — ej. Turquía (TRY), Nigeria (NGN) o Egipto (EGP) — en vez
   de otro caso de crisis extrema.
5. **Recordatorio para la carga a Supabase:** este archivo (v16) suma
   un corredor más de Argentina (Sección 1, EEUU) y un corredor de
   Chile (Sección 3.1, con MoneyGram/Western Union/Global66) — junto
   con v15 (España, Italia), Argentina queda con 3 corredores listos
   para cargar, todos con dato limpio (MoneyGram con la cifra ya
   corregida, 4,86%, no la promocional).
6. El proyecto ya cubrió 8 regiones de origen nuevas esta sesión (Nueva
   Zelanda, Hong Kong, Corea del Sur, Japón, China, México, Brasil,
   Argentina). Sigue en pie la sugerencia de espaciar la apertura de
   regiones nuevas y priorizar profundizar patrones transversales (como
   el de la Sección 3) sobre seguir sumando países.


---

## research-findings-2026-09-02-v17-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #11 (v17) — Turquía probado como origen de inflación alta con banca conectada: el margen no se acerca al de Argentina

> **Documento nuevo — no reemplaza a v6-v16 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya tiene v16
> descargado. Este es un decimotercer archivo con **solo lo nuevo de
> esta ronda**. Para el panorama completo hacen falta los 13 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** los datos de
> TransferGo de esta ronda (Turquía) **no deben cargarse sin revisión**
> — TransferGo es un proveedor con contaminación estructural confirmada
> (bonus al receptor incorporado en la tasa publicada, ver v15 Sección
> 5.3), así que las cifras de esta ronda para Turquía se muestran a
> título informativo/comparativo, no como dato limpio para el buscador.
>
> **Nota sobre esta ronda:** la investigación de esta ronda quedó
> interrumpida por una limitación de herramientas de la sesión (el
> navegador dejó de responder — ver Sección 2) antes de poder probar
> tantos corredores como en rondas anteriores. Lo que sigue es lo que
> se alcanzó a investigar y confirmar antes del corte.

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v16, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Turquía (TRY) probado como el candidato sugerido al cierre de v16
   (Sección 5.3): inflación alta pero con banca todavía conectada
   internacionalmente** — a diferencia de Líbano y Venezuela, Turquía sí
   tiene cobertura activa en Monito (5 proveedores en los corredores
   probados). Ver Sección 1.
2. **El margen en Turquía no se acerca al ~5% visto en Argentina.** El
   proveedor más barato disponible (Wise, según los propios agregados
   de Monito) promedia un costo total de 1,2% en Turquía→Alemania —
   mucho más cerca del rango "bajo" de Chile/México que del rango
   "alto" de Argentina. Ver Sección 1.1.
3. **Limitación metodológica importante: el conjunto de proveedores en
   Turquía es distinto al de Argentina/Chile.** No aparecen Western
   Union, Global66 ni MoneyGram en los corredores probados desde
   Turquía — en su lugar, el mercado está servido por TransferGo, dos
   bancos turcos (QNB Finansbank, Türk Ekonomi Bankası) y Wise/OFX. Esto
   significa que la comparación con Argentina **no es una comparación
   controlada del mismo proveedor** como la de Chile-vs-Argentina con
   Western Union (v16 Sección 3) — es una comparación de "mejor oferta
   disponible" en cada país, más débil metodológicamente. Ver Sección
   1.2.
4. **La sesión se quedó sin poder seguir navegando Monito a mitad de la
   ronda** (ver Sección 2) — Nigeria y Egipto, los otros dos candidatos
   sugeridos en v16, quedan pendientes para la próxima ronda.
5. **Con los datos ya disponibles, se armó una tabla consolidada de los
   6 países probados hasta ahora en el hilo "moneda volátil → margen"**
   (Argentina, Chile, México, Turquía, Líbano, Venezuela) — la
   conclusión general queda matizada en tres lecturas distintas en vez
   de una sola regla simple. Ver Sección 3.

---

## 1. Turquía — inflación alta, banca conectada, pero margen bajo

### 1.1 Turquía→Alemania y Turquía→Reino Unido

Se probaron dos corredores con origen Turquía (`monito.com/send-money/turkey/germany/try/eur` y `.../turkey/united-kingdom/try/gbp`), sobre una transferencia de 10.000 TRY en ambos casos:

| Corredor | Proveedor | Fee | Tasa | vs. mid-market | Recibe |
|---|---|---|---|---|---|
| Turquía→Alemania | TransferGo (⚠️ contaminado) | Gratis | 0.017490 | 2,27% peor | 174,90 EUR |
| Turquía→Alemania | QNB Finansbank (banco) | 1.559,36 TRY | 0.017174 | 4,04% peor | 144,96 EUR |
| Turquía→Alemania | Türk Ekonomi Bankası (banco) | 1.641,09 TRY | 0.017141 | 4,22% peor | 143,28 EUR |
| Turquía→Reino Unido | TransferGo (⚠️ contaminado) | Gratis | 0.015000 | 2,03% peor | 150,00 GBP |
| Turquía→Reino Unido | QNB Finansbank (banco) | 1.183,12 TRY | 0.014699 | 4,00% peor | 129,60 GBP |
| Turquía→Reino Unido | Türk Ekonomi Bankası (banco) | 1.264,85 TRY | 0.014683 | 4,10% peor | 128,25 GBP |

En ambos corredores, Monito no muestra las tarjetas individuales de Wise
con cifra numérica (solo aparece como "Top Provider" con insignias de
"Cheapest in 81-82% of comparisons", sin la tasa exacta visible sin
completar la transacción) — pero sí publica agregados propios en la
sección de FAQ de cada página:

- **Turquía→Alemania:** "costo total con el proveedor más barato: 1,2%"
  (promedio); "costo del proveedor más caro: 11,3%"; proveedores
  recomendados: TransferGo, OFX, Wise; proveedor más barato en
  promedio: **Wise**.
- **Turquía→Reino Unido:** mismo patrón — Wise como proveedor más
  barato en 82% de comparaciones, top rated en 100%.

**Advertencia metodológica:** esta cifra de 1,2% es un agregado propio
de Monito (no recalculada de forma independiente por este proyecto,
como sí se hizo con los datos de RPW en v14-v15), así que se reporta
con la misma cautela que cualquier estadística de Monito no verificada
— pero es consistente con el comportamiento de Wise ya documentado en
el proyecto (v15 Sección 5.1: margen real ~0% del mid-market en todos
los corredores medidos hasta ahora).

### 1.2 Por qué esta comparación es más débil que la de Chile-vs-Argentina

La comparación controlada más sólida del proyecto hasta ahora (v16
Sección 3) usó el **mismo proveedor** (Western Union) en dos países de
origen distintos, aislando así el efecto de la moneda de origen. En
Turquía eso no es posible: **Western Union, Global66 y MoneyGram no
aparecen en ningún corredor probado desde Turquía** — el mercado está
dominado por TransferGo (especialista en remesas UE-céntrico), dos
bancos turcos locales, y Wise/OFX.

Esto deja dos lecturas posibles, y con los datos actuales no se puede
distinguir entre ellas con certeza:

1. **Lectura A (apoya la hipótesis de volatilidad):** el conjunto de
   proveedores disponible en Turquía ya es uno estructuralmente barato
   (dominado por Wise/TransferGo, competidores conocidos por márgenes
   bajos en este proyecto) — así que no es una prueba real de si un
   proveedor "amplio" como Western Union cobraría más en Turquía que en
   un país estable. Simplemente Western Union no opera ahí.
2. **Lectura B (matiza la hipótesis):** si el mercado turco atrae
   competidores de margen bajo (Wise, TransferGo) en vez de replicar el
   patrón de proveedores "amplios" con margen alto que sí operan en
   Argentina, eso en sí mismo sugiere que el nivel de inflación de
   Turquía (~31% anual a mediados de 2026, ver más abajo) no genera el
   mismo tipo de "prima de riesgo cambiario" que el peso argentino —
   sea porque el mercado turco es más grande/competitivo, porque la
   lira, pese a la inflación alta, no tiene el mismo historial de
   crisis abruptas y redenominaciones que otras monedas de este hilo de
   investigación, o por alguna otra razón todavía no identificada.

**Conclusión provisional:** con los datos disponibles, lo más honesto
es decir que **Turquía no reproduce el patrón de margen alto de
Argentina**, pero sin poder aislar si es por el proveedor disponible o
por la moneda en sí — a diferencia de la comparación Chile-vs-Argentina
(v16 Sección 3), que sí logró controlar por proveedor. Para una prueba
más limpia, el próximo paso sería buscar un origen de inflación alta
donde Western Union, Global66 o MoneyGram sí operen.

### 1.3 Contexto: la inflación turca

Según fuentes de mercado (Trading Economics, Statista, Bazaar Times),
la inflación anual de Turquía rondaba **~31,5% hacia agosto de 2026**
— alta para estándares globales, pero muy por debajo de los picos
históricos del país (por encima del 70% en 2022) y sin el tipo de
crisis bancaria o de convertibilidad que sí afectan a Líbano o
Venezuela. Es una inflación alta pero "administrada", con un banco
central (TCMB) activo y un sistema bancario plenamente integrado a la
red financiera internacional — consistente con por qué Monito sí tiene
cobertura ahí, a diferencia de los dos casos de la ronda anterior.

---

## 2. Corte de la ronda por limitación de herramientas

A mitad de esta ronda, después de confirmar los datos de Turquía, la
herramienta de navegador de la sesión dejó de responder (timeouts
repetidos en el clasificador de seguridad que aprueba cada acción del
navegador), y poco después ocurrió lo mismo con otras herramientas
(incluida la de búsqueda profunda de páginas web). No fue posible
completar los dos candidatos restantes sugeridos al cierre de v16
(Nigeria, Egipto) en esta ronda.

Esto no es un hallazgo de investigación — es una limitación operativa
de la sesión, y se documenta acá para que quede claro por qué esta
ronda es más corta que las anteriores, y para que la próxima ronda
retome exactamente donde esta se cortó.

---

## 3. Consolidación del hilo "moneda volátil → margen" (todos los países probados hasta ahora)

Con seis países de origen ya probados en este hilo (Argentina, Chile,
México, Líbano, Venezuela, Turquía), vale la pena consolidarlos en una
sola tabla — siguiendo el mismo espíritu que la consolidación de
proveedores de v15 Sección 5. Esta tabla no agrega datos nuevos, solo
reorganiza lo ya confirmado en v16 y en este archivo:

| País de origen | Moneda | Resultado en Monito | Proveedor(es) medido(s) | Margen / cobertura | Categoría |
|---|---|---|---|---|---|
| Argentina | ARS | Cobertura normal | Global66 (3 corredores), Western Union (4 corredores) | 4,03%-5,35% | **Alto, confirmado** — riesgo cambiario del peso |
| Chile | CLP | Cobertura normal | Western Union, Global66, MoneyGram | 0,02%-1,40% | Bajo — grupo de control |
| México | MXN | Cobertura normal | Western Union (Guatemala, Honduras) | 0,86%-1,09% | Bajo — corrobora el control |
| Turquía | TRY | Cobertura normal, pero **otro conjunto de proveedores** | TransferGo (⚠️contaminado), Wise (agregado) | 1,2%-2,27% | Bajo/moderado — **no comparable de forma controlada** (sin WU/Global66/MoneyGram) |
| Líbano | LBP | **Cobertura cero** (todos los destinos probados) | — | N/A | Explicado por restricción bancaria doméstica (Banque du Liban, jul. 2025) |
| Venezuela | VES | **Cobertura cero** (3 destinos probados) | — | N/A | Explicado por sanciones de EE.UU. al banco central (2019-abr. 2026) |

**Lectura del patrón completo:** el hilo muestra tres resultados
distintos, no uno solo:

1. **Cuando hay cobertura Y el mismo proveedor "amplio" opera en ambos
   países (Argentina vs. Chile con Western Union), el margen sí escala
   claramente con la volatilidad/historial de crisis de la moneda** —
   esta es la parte más sólida del hallazgo, con casi 4x de diferencia.
2. **Cuando la moneda entra en crisis bancaria/de sanciones abierta
   (Líbano, Venezuela), Monito no tiene NINGÚN dato de margen que
   mostrar** — la pregunta "¿cuánto más caro es?" deja de aplicar
   porque la respuesta es "no se puede enviar por los canales que
   Monito compara". Esto es un hallazgo en sí mismo (documentado con
   fuentes regulatorias concretas en v16 Secciones 4 y 5), pero no
   extiende la tabla de márgenes.
3. **Cuando hay inflación alta pero sin crisis bancaria/de
   convertibilidad (Turquía), el mercado de proveedores es distinto al
   de Argentina/Chile** — no aparecen los proveedores "amplios" ya
   catalogados, así que no se puede aislar limpiamente el efecto de la
   moneda. El resultado (márgenes bajos) es sugerente pero no
   concluyente por esta limitación.

**Conclusión para el proyecto:** la hipótesis "moneda volátil → margen
alto" está bien confirmada como un fenómeno real (punto 1), pero
generalizarla a "cualquier moneda con problemas cambiarios" requiere
matizarla en dos direcciones — hay un punto en el que la volatilidad
deja de generar margen alto y empieza a generar ausencia total de
cobertura (punto 2), y hay países de inflación alta donde simplemente
cambia el conjunto de competidores en vez de el precio del mismo
proveedor (punto 3). La prueba más limpia que falta todavía es un país
de inflación alta y banca conectada **donde también opere Western
Union, Global66 o MoneyGram** — ahí sí se podría aislar el efecto con
el mismo rigor que la comparación Chile-vs-Argentina.

---

## 4. Plan sugerido para la próxima ronda

1. **Nigeria (NGN) y Egipto (EGP), los dos candidatos que quedaron
   pendientes de v16 Sección 5.3**, todavía no probados. Son el primer
   paso natural para retomar la línea de "inflación alta con banca
   conectada".
2. **Buscar específicamente un origen de inflación alta donde Western
   Union, Global66 o MoneyGram sí operen** — para lograr una
   comparación controlada por proveedor como la de Chile-vs-Argentina
   (v16 Sección 3), en vez de comparar "mejor oferta disponible" entre
   países con conjuntos de proveedores distintos (la limitación
   identificada en la Sección 1.2 de este archivo). Nigeria es un buen
   candidato para esto — Western Union suele tener presencia fuerte en
   corredores africanos (ya confirmado en el proyecto para Sudáfrica,
   vía Mukuru/RPW).
3. **Turquía queda documentada como un resultado parcial/matizado, no
   cerrado** — el hallazgo de que no reproduce el margen alto de
   Argentina es real, pero la Sección 1.2 explica por qué no es
   concluyente sobre el mecanismo. Si en el futuro aparece Western
   Union u otro proveedor "amplio" ya catalogado en un corredor turco,
   vale la pena revisar esto de nuevo.
4. **Recordatorio para la carga a Supabase:** ninguno de los datos de
   esta ronda debería cargarse todavía — TransferGo está marcado como
   contaminado (ver nota del encabezado) y las cifras de los bancos
   turcos (QNB Finansbank, Türk Ekonomi Bankası) no fueron
   contrastadas con una segunda fuente independiente como sí se hizo
   con los datos de RPW en rondas anteriores.
5. ~~Consolidar los países de origen probados en el hilo "moneda
   volátil → margen" en una sola tabla comparativa.~~ **Hecho en esta
   misma ronda (Sección 3)** — con 6 países consolidados, la conclusión
   del proyecto queda matizada en tres lecturas distintas (margen que
   escala con la volatilidad cuando hay mismo proveedor y cobertura;
   ausencia total de cobertura en crisis extremas; y conjunto de
   proveedores distinto en países de inflación alta pero banca
   conectada). La prueba que sigue faltando: un país de inflación alta
   y banca conectada donde también opere Western Union, Global66 o
   MoneyGram — ver item 2 de este plan.


---

## research-findings-2026-09-02-v18-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #12 (v18) — Nigeria y Egipto cierran los candidatos de v16/v17; OFX aparece como proveedor "de relleno" en mercados de moneda dura, pero falla como segundo termómetro de volatilidad

> **Documento nuevo — no reemplaza a v6-v17 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya tiene v17
> descargado. Este es un decimocuarto archivo con **solo lo nuevo de
> esta ronda**. Para el panorama completo hacen falta los 14 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** los datos de
> OFX de esta ronda (Egipto, Sri Lanka, Pakistán) son de un **bróker de
> cambio, no un proveedor minorista de remesas** — Monito los muestra
> bajo su propia pestaña "Via a broker" / "Transfer via a broker". No
> hay contraindicación conocida para cargarlos, pero conviene marcarlos
> como una categoría de proveedor distinta a Western Union/Global66/
> MoneyGram/Wise si el buscador distingue por tipo de servicio. Los
> datos de Nigeria son inexistentes por definición (cobertura cero) —
> nada que cargar ahí, solo la ausencia documentada.
>
> **Nota sobre el alcance de esta ronda:** al arrancar la sesión de
> nuevo (después de que v17 quedara cortado por una limitación de
> herramientas), se retomó exactamente donde había quedado el plan:
> Nigeria y Egipto, los dos candidatos pendientes de v16 Sección 5.3.
> Con la sesión funcionando con normalidad, se pudo ir más lejos de lo
> planeado — se sumaron Sri Lanka y Pakistán como dos países adicionales
> del mismo hilo, y apareció un hallazgo lateral no buscado (OFX como
> proveedor recurrente en estos mercados) que se documenta en su propia
> sección.

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v17, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Nigeria (NGN) probada en tres corredores (Reino Unido, EEUU,
   Ghana) — cobertura cero en los tres, incluso forzando un monto más
   alto (265.700 NGN) en el corredor a EEUU.** A diferencia de Líbano y
   Venezuela, acá la explicación es la más directa y mejor documentada
   de las tres: una **prohibición regulatoria explícita y fechada** del
   Banco Central de Nigeria a las transferencias salientes de dinero vía
   IMTOs (enero de 2024). Ver Sección 1.
2. **Egipto (EGP) probado en tres corredores (Reino Unido, EEUU,
   Italia) — cobertura mínima pero no nula: un solo proveedor (OFX,
   un bróker de cambio) en los tres.** El margen es alto y
   sorprendentemente consistente entre EEUU e Italia (~7,5% en ambos),
   más bajo hacia el Reino Unido (4,14%) — la primera comparación
   "mismo proveedor, mismo origen, distinto destino" del hilo desde el
   caso de Global66 en Argentina (v16 Sección 2). Ver Sección 2.
3. **Se sumaron dos países no planeados originalmente: Sri Lanka y
   Pakistán — mismo patrón de un único proveedor (OFX), pero con
   resultados bien distintos entre sí:** Sri Lanka con margen bajo
   (2,51%, coherente con una crisis cambiaria ya mayormente resuelta) y
   Pakistán con margen alto (5,13%, en el rango de Argentina). Ver
   Sección 3.
4. **Hallazgo lateral no buscado: OFX aparece como el único proveedor
   en los tres países de esta ronda (Egipto, Sri Lanka, Pakistán) — un
   patrón que no se había notado hasta ahora.** Se intentó usar a OFX
   como un segundo "termómetro" de volatilidad cambiaria, replicando el
   ejercicio de Western Union en Argentina/Chile — **el intento dio
   negativo, y se pudo confirmar por qué**: al medir OFX en México (el
   país control) con dos montos distintos, el margen bajó de 4,04% a
   2,5% con solo aumentar el monto 5 veces — el margen de OFX depende
   del tamaño de la transferencia, no de la moneda de origen. Un
   hallazgo metodológico honesto y bien confirmado (qué NO funciona
   como comparación controlada, y por qué) tan valioso como uno
   positivo. Ver Sección 4.
5. **Tabla consolidada actualizada a 10 países de origen** (sumando
   Nigeria, Egipto, Sri Lanka y Pakistán a los 6 de v17) — la lectura
   del hilo se refina en cuatro categorías en vez de tres. Ver Sección
   5.

---

## 1. Nigeria — cobertura cero explicada por una prohibición regulatoria explícita (CBN, enero de 2024)

### 1.1 Tres corredores probados, cobertura cero en los tres

Se probaron tres corredores con origen Nigeria:

- `monito.com/send-money/nigeria/united-kingdom/ngn/gbp` — sin
  resultados a 1.000 NGN, sugiere probar con 265.600 NGN.
- `monito.com/send-money/nigeria/united-states/ngn/usd` — sin
  resultados a 1.000 NGN, sugiere 265.700 NGN. **Se forzó el monto
  sugerido a través del formulario de la página** (a diferencia del
  intento fallido con Venezuela en la ronda anterior, esta vez el envío
  del formulario sí funcionó) — el resultado cambió de "prueba un monto
  más alto" a un mensaje distinto: *"We couldn't find any providers
  who'd send Nigerian nairas (NGN) from Nigeria to the USA. Try sending
  the same amount in US dollars instead"* — es decir, **cobertura cero
  confirmada independientemente del monto**, no un problema de umbral
  mínimo.
- `monito.com/send-money/nigeria/ghana/ngn/ghs` — sin resultados a
  1.000 NGN, mismo patrón.

Con tres destinos distintos (dos monedas fuertes y una regional
africana) y una confirmación explícita de que el problema no es el
monto, la cobertura cero de Nigeria queda tan bien establecida como la
de Líbano y Venezuela en la ronda anterior.

### 1.2 La explicación: el Banco Central de Nigeria prohibió las transferencias salientes vía IMTO en enero de 2024

A diferencia de Líbano (restricción de retiros bancarios) y Venezuela
(sanciones de un tercer país a la banca corresponsal), la explicación
para Nigeria es la más directa y precisa de las tres encontradas hasta
ahora en este hilo — no una restricción bancaria indirecta, sino una
**prohibición regulatoria explícita sobre exactamente la categoría de
proveedor que Monito compara**:

- El **31 de enero de 2024**, el Banco Central de Nigeria (CBN) publicó
  guías revisadas que restringen a los **IMTOs (International Money
  Transfer Operators — la categoría regulatoria que incluye a Western
  Union, MoneyGram, WorldRemit y proveedores similares)** a operar
  **solo transferencias entrantes**. Las guías anteriores (de 2014)
  permitían tanto entrada como salida de dinero por este canal; la
  nueva norma elimina por completo la capacidad de operar salidas.
- **Motivo declarado por el CBN:** gestionar las reservas de divisas y
  estabilizar la moneda local limitando la salida de fondos, además de
  monitorear transacciones internacionales más de cerca y prevenir
  movimientos financieros ilícitos.
- **Efecto directo sobre plataformas de comparación como Monito:** dado
  que los IMTOs ya no pueden operar salidas de forma legal, no hay
  proveedores conformes con la regulación para listar en corredores con
  origen Nigeria — la cobertura cero no es una limitación de la
  plataforma, es la consecuencia directa y esperable de la norma.
- **Medida complementaria, de la misma norma:** todas las remesas
  entrantes a Nigeria deben pagarse en naira, no en moneda extranjera —
  consolidando el control del banco central sobre los flujos de divisas
  que sí entran al país.

### 1.3 Nota sobre una reforma más reciente (mayo de 2026)

Una búsqueda adicional encontró que el CBN profundizó esta línea de
política más recientemente: a partir del **1 de mayo de 2026**, los
fondos remitidos a Nigeria a través de IMTOs **ya no se aceptan en
dólares** — deben liquidarse en cuentas denominadas en naira a través
de bancos autorizados. Esta reforma en particular apunta principalmente
a remesas **entrantes** (no cambia directamente la prohibición de
salidas de 2024), pero confirma que Nigeria sigue profundizando el
control regulatorio sobre los flujos de divisas en ambas direcciones, y
no hay señal de que la prohibición de salidas vaya a revertirse pronto.

### 1.4 Nigeria en el contexto de Líbano y Venezuela: tres mecanismos, mismo resultado

Con Nigeria, el hilo de "cobertura cero por razones regulatorias" ya
tiene tres casos, cada uno con un mecanismo legal distinto:

| País | Mecanismo | Nivel | Fecha |
|---|---|---|---|
| Líbano | Restricción bancaria doméstica sobre retiros en moneda extranjera (formaliza una práctica informal de bancos individuales) | Decisión de banca central sobre depósitos preexistentes | Decisión Básica N.º 13729, jul. 2025 |
| Venezuela | Sanciones de un tercer país (EE.UU./OFAC) a la banca central, cortando el acceso a banca corresponsal internacional | Sanción externa sobre el sistema bancario | Abr. 2019 – abr. 2026 (recién levantada) |
| Nigeria | Prohibición regulatoria doméstica explícita sobre una categoría de proveedor (IMTOs) | Norma del banco central sobre el tipo de operación | 31 ene. 2024 (vigente) |

Nigeria es, de los tres, el caso donde la cadena causal es más corta y
más fácil de verificar: no hace falta inferir el efecto sobre los
proveedores (como con las sanciones a la banca corresponsal en
Venezuela) — la norma nombra directamente a los IMTOs y prohíbe
exactamente el tipo de operación que Monito compara.

---

## 2. Egipto — cobertura mínima (un solo proveedor), margen alto y consistente entre destinos

### 2.1 Tres corredores, mismo proveedor, margen similar

| Corredor | Proveedor | Monto enviado | Fee | Tasa | vs. mid-market | Recibe |
|---|---|---|---|---|---|---|
| Egipto→Reino Unido | OFX (bróker) | 30.000 EGP | Gratis | 0.013875 | 4,14% peor | 416,25 GBP |
| Egipto→EEUU | OFX (bróker) | 10.000 EGP | Gratis | 0.018113 | 7,53% peor | 181,13 USD |
| Egipto→Italia | OFX (bróker) | 10.000 EGP | Gratis | 0.015646 | 7,54% peor | 156,46 EUR |

En los tres corredores, Monito solo lista **un proveedor** — no
aparecen Western Union, Global66, MoneyGram ni Wise en ningún corredor
con origen Egipto probado.

### 2.2 Una comparación "mismo proveedor, mismo origen, distinto destino" — la primera desde Global66 en Argentina

El patrón EEUU (7,53%) ≈ Italia (7,54%) es prácticamente idéntico,
mientras que Reino Unido (4,14%) es notablemente más bajo — un
resultado parecido en espíritu al de Global66 en Argentina (v16 Sección
2, donde el margen se mantuvo ~5,2-5,3% sin importar el destino), pero
con una variación real entre destinos que Argentina no mostraba. Esto
sugiere que, si bien el efecto "origen" domina (Egipto es
consistentemente más caro que un país de moneda estable en cualquier
destino), todavía hay algo de variación por destino específico que
valdría la pena investigar más — posiblemente relacionado con el
volumen de comparaciones que recibe cada corredor (443 para EEUU, 213
para Italia, cifras mucho más chicas que corredores establecidos) o con
diferencias reales en el costo de liquidez de OFX para cada par de
divisas.

### 2.3 Contexto: la crisis cambiaria egipcia, 2022-2026

Egipto atravesó una crisis financiera severa entre 2022 y 2024,
confirmada por fuentes independientes (Wikipedia, Middle East Insider):

- **Causa:** un déficit comercial estructural enorme (importaciones
  ~US$90.000 millones anuales contra exportaciones de ~US$52.000
  millones) combinado con gasto público en megaproyectos que no
  generaron divisas.
- **6 de marzo de 2024:** el Banco Central egipcio dejó flotar la
  libra egipcia (EGP) de forma más libre por primera vez en más de 14
  meses, después de que la moneda cayera de ~30 a casi 50 EGP por dólar
  durante la crisis (una devaluación de más del 60%). La inflación de
  alimentos llegó a 68,2% a mediados de 2023.
- **Programa del FMI:** paquete combinado de ~US$22.000 millones
  (FMI + UE + Banco Mundial) más un acuerdo de inversión de US$35.000
  millones con EAU (desarrollo de Ras El-Hekma) — condicionado a
  flotación cambiaria, disciplina fiscal, y reducción de exenciones
  fiscales a empresas estatales/militares.
- **Estado a marzo de 2026:** la libra ya no está en crisis abierta,
  pero tampoco flota libremente — el banco central egipcio opera un
  **"régimen de flotación administrada"** (banda de depreciación
  gradual y controlada, no una flotación pura). La libra se depreció
  otro 4,2% en lo que va de 2026 (a ~51,8 EGP/USD en marzo). El FMI
  liberó US$2.300 millones tras completar la 5ª y 6ª revisión del
  programa (marzo de 2026), de un paquete total de US$8.000 millones a
  46 meses. La inflación bajó de un pico de 38,1% (sept. 2024) a 13,4%
  (feb. 2026) — una desinflación importante pero todavía con una tasa
  de referencia del banco central en 22,75% (después de mantenerla en
  27,25% por más de un año).

**Lectura para el proyecto:** Egipto es un caso intermedio — no llegó
al colapso bancario/de sanciones de Líbano/Venezuela (por eso sí hay
cobertura), pero tampoco es una moneda "administrada con normalidad"
como el peso mexicano o el franco chileno. Es una moneda en transición
activa desde una crisis reciente, todavía bajo un régimen cambiario no
del todo libre — y el margen alto y consistente que muestra OFX encaja
con esa lectura.

---

## 3. Dos países adicionales del mismo patrón: Sri Lanka y Pakistán

No estaban en el plan original de v16/v17, pero surgieron naturalmente
al notar que Egipto solo tenía un proveedor (OFX) — la pregunta lógica
fue si ese mismo patrón se repite en otras monedas con historial de
crisis. Se probó un corredor de cada una hacia el Reino Unido:

| País | Moneda | Proveedor | Monto enviado | vs. mid-market | Contexto |
|---|---|---|---|---|---|
| Sri Lanka | LKR | OFX (único proveedor) | 2.000.000 LKR | 2,51% peor | Default de 2022: crisis de deuda soberana, colapso de la rupia — pero mayormente resuelta a 2026 |
| Pakistán | PKR | OFX (único proveedor) | 500.000 PKR | 5,13% peor | Devaluación persistente y prima histórica del mercado paralelo, sin default formal |

### 3.1 El contraste es la parte más interesante

Sri Lanka tuvo, en 2022, una de las crisis cambiarias más severas de la
década — default soberano, colapso de la rupia, escasez de
combustible y alimentos. Sin embargo, **el margen que muestra hoy
(2,51%) es bajo, más cerca del rango "moderado" de Turquía que del
rango "alto" de Argentina o Egipto.** Esto es consistente con lo que
se sabe del proceso de recuperación de Sri Lanka: el país completó una
reestructuración de deuda relativamente ordenada con el FMI y la rupia
se estabilizó de forma notable entre 2023 y 2025 — a diferencia de
Egipto, que en 2026 todavía está en medio de un régimen de flotación
administrada activo.

Pakistán, sin un evento de crisis tan dramático ni tan mediático como
el de Sri Lanka o Egipto, muestra sin embargo un margen más alto
(5,13%) — en línea con el historial más largo y menos resuelto de
devaluación persistente y brecha con el mercado paralelo que caracteriza
a la rupia paquistaní desde hace años.

**Esto refuerza una idea importante para el hilo completo: lo que
parece importar no es "la moneda tuvo una crisis en algún momento" sino
"qué tan resuelta o activa está esa crisis en el momento de la
medición".** Argentina, Egipto y Pakistán están en distintas etapas de
crisis activa o reciente; Sri Lanka, pese a haber tenido la crisis más
severa de las cuatro, ya la superó en gran parte.

---

## 4. Hallazgo lateral: OFX como proveedor "de relleno" en mercados de moneda dura

### 4.1 El patrón

En esta ronda, **OFX apareció como el único proveedor disponible en los
tres países nuevos probados (Egipto, Sri Lanka, Pakistán)** — un
patrón que no se había notado en rondas anteriores porque el proyecto
se había concentrado en proveedores minoristas conocidos (Western
Union, Global66, MoneyGram, Wise, TransferGo). OFX también apareció,
aunque no como líder, entre los 5 proveedores de Turquía (v17 Sección
1), con un puntaje de "Fees & Exchange Rates" más bajo que Wise (5,3
vs. 7,6).

El patrón sugiere que OFX cumple un rol estructural distinto al de los
proveedores minoristas del proyecto: parece ser el bróker que Monito
lista cuando el mercado de un país de origen es demasiado pequeño o
complicado para que operen los proveedores de remesas minoristas
tradicionales — llenando el vacío en vez de competir directamente con
ellos.

### 4.2 Caveat metodológico importante

OFX es, por su propia categorización en Monito ("Transfer via a
broker... Forex brokers are usually the best options for large
transactions"), un **bróker de cambio para transferencias grandes**,
no un proveedor de remesas minorista. Esto importa por dos razones:

1. **El margen de un bróker de FX suele depender del tamaño de la
   transferencia** además del riesgo de la moneda — los brokers
   típicamente ofrecen mejores tasas cuanto más grande es la operación,
   a diferencia de un proveedor de remesas minorista que suele tener una
   estructura de precios más plana. Los montos por defecto de Monito
   variaron bastante entre estos corredores (30.000 EGP ≈ US$610;
   2.000.000 LKR ≈ US$6.700; 500.000 PKR ≈ US$1.750) — así que parte de
   la variación en margen observada podría deberse al tamaño del envío,
   no solo a la moneda de origen.
2. **No es directamente equiparable al ejercicio "mismo proveedor"**
   que dio el hallazgo más sólido del proyecto hasta ahora (Western
   Union en Chile vs. Argentina, v16 Sección 3) — ahí se comparó el
   mismo proveedor minorista, con la misma estructura de precios, en
   dos países. Con OFX no hay un punto de comparación en un país de
   moneda estable con el mismo monto para aislar el efecto.

### 4.3 Verificado: OFX en México (control), a dos montos distintos — confirma que el margen depende del tamaño de la transferencia

Se verificó el dato pendiente en dos pasos. Primero, OFX **sí** aparece
en México→Reino Unido (México es el país "control" de margen bajo del
proyecto, confirmado repetidas veces con Western Union en 0,86%-1,09%),
con un margen inicial que no encajaba con la hipótesis de volatilidad.
Después, usando el formulario de "comparar para tu monto" de la misma
página, se repitió la medición con un monto más grande, comparable en
escala a los de Egipto/Pakistán:

| Corredor | Proveedor | Monto | Fee | Tasa | vs. mid-market |
|---|---|---|---|---|---|
| México→Reino Unido | OFX (bróker) | 6.000 MXN (~US$290) | Gratis | 0.041690 | **4,04% peor** |
| México→Reino Unido | OFX (bróker) | 30.000 MXN (~US$1.450) | Gratis | 0.042573 | **2,5% peor** |

**Con 5 veces más monto, el margen de OFX baja casi a la mitad (de
4,04% a 2,5%) — en el mismo país, la misma moneda, el mismo proveedor.**
Esto confirma con datos propios el caveat de la Sección 4.2: **el
margen de OFX depende marcadamente del tamaño de la transferencia**,
un comportamiento típico de un bróker de cambio (mejores tasas para
operaciones más grandes) y muy distinto al de un proveedor de remesas
minorista como Western Union, cuyo margen se mantuvo estable en el
mismo rango (4-5%) en los cuatro corredores argentinos medidos en
rondas anteriores, sin importar el monto.

**Conclusión:** con esto, se puede afirmar con bastante más confianza
que **OFX no sirve como un segundo "termómetro" de volatilidad
cambiaria** al estilo de Western Union — su margen está dominado por el
tamaño de la operación, no por el riesgo de la moneda de origen. Esto
no invalida los datos de Egipto/Sri Lanka/Pakistán como información
descriptiva real (siguen siendo el único proveedor disponible en esos
países, con el margen que efectivamente se les cobra a esos montos),
pero sí descarta usarlos como evidencia de que esas monedas
específicamente "valen más caras" por su volatilidad — el mismo efecto
de monto podría estar operando ahí también, y no hay forma de
distinguirlo sin repetir la medición a montos equivalentes en cada país
(una tarea para una ronda futura, si el hilo lo amerita).

---

## 5. Consolidación actualizada del hilo (10 países de origen)

| País de origen | Moneda | Resultado en Monito | Proveedor(es) | Margen / cobertura | Categoría |
|---|---|---|---|---|---|
| Argentina | ARS | Cobertura normal | Global66, Western Union | 4,03%-5,35% | **Alto, confirmado** (mismo proveedor vs. control) |
| Chile | CLP | Cobertura normal | Western Union, Global66, MoneyGram | 0,02%-1,40% | Bajo — grupo de control |
| México | MXN | Cobertura normal | Western Union | 0,86%-1,09% | Bajo — corrobora el control |
| Turquía | TRY | Cobertura normal, otro conjunto de proveedores | TransferGo (⚠️), Wise (agregado), OFX | 1,2%-2,27% | Bajo/moderado — sin comparación controlada |
| Egipto | EGP | Cobertura mínima (1 proveedor) | OFX (bróker) | 4,14%-7,54% | Alto, pero **sin comparación controlada confiable** (ver 4.3) |
| Pakistán | PKR | Cobertura mínima (1 proveedor) | OFX (bróker) | 5,13% | Alto, pero **sin comparación controlada confiable** (ver 4.3) |
| Sri Lanka | LKR | Cobertura mínima (1 proveedor) | OFX (bróker) | 2,51% | Bajo/moderado, pero **sin comparación controlada confiable** (ver 4.3) |
| México (control, vía OFX) | MXN | Cobertura normal | OFX (bróker) | 4,04% (monto chico) / 2,5% (monto 5x mayor) | Confirma que OFX responde al monto, no a la moneda — ver Sección 4.3 |
| Líbano | LBP | **Cobertura cero** | — | N/A | Restricción bancaria doméstica (BdL, jul. 2025) |
| Venezuela | VES | **Cobertura cero** | — | N/A | Sanciones de EE.UU. a la banca central (2019-abr. 2026) |
| Nigeria | NGN | **Cobertura cero** | — | N/A | Prohibición regulatoria explícita a IMTOs (CBN, ene. 2024) |
| Zimbabue | ZWG | **Ni siquiera existe como ruta en Monito** | — | N/A | Ver nota debajo de la tabla |

**Nota aparte — Zimbabue, un caso todavía más extremo que "cobertura
cero":** se intentó sumar Zimbabue al hilo por su historia de
hiperinflación (la más extrema documentada en lo que va del siglo,
2007-2009) y su moneda actual (ZiG, adoptada en abril de 2024 tras el
colapso del dólar zimbabuense). El resultado fue distinto a los otros
tres casos de "cobertura cero": **Zimbabue ni siquiera es una ruta
válida en el sitio de Monito** — tanto como origen (Zimbabue→Sudáfrica)
como destino (Sudáfrica→Zimbabue) devuelven un error 404 genuino ("la
página que buscás no existe"), no la página de "no encontramos
proveedores" que sí muestran Líbano, Venezuela y Nigeria. Es decir,
Monito ni siquiera modela a Zimbabue como país dentro de su sistema —
un nivel de ausencia más extremo que "hay cobertura cero pero la
pregunta tiene sentido". No se investigó más a fondo el porqué (podría
ser simplemente que Monito no incluye a Zimbabue en su catálogo de
países por bajo volumen de negocio, sin relación necesaria con su
historia cambiaria) — se deja como una nota de color, no como un dato
del hilo.

**Cuatro lecturas del hilo completo, no una sola regla:**

1. **Cuando hay cobertura y el mismo proveedor minorista opera en
   ambos países, el margen escala claramente con la volatilidad/
   historial de crisis de la moneda** (Argentina vs. Chile, Western
   Union) — la parte más sólida del hallazgo.
2. **Cuando la moneda entra en crisis bancaria, de sanciones, o queda
   sujeta a una prohibición regulatoria explícita, Monito no tiene
   NINGÚN dato de margen que mostrar** (Líbano, Venezuela, Nigeria) —
   tres mecanismos legales distintos, mismo resultado. La pregunta
   "¿cuánto más caro es?" deja de aplicar.
3. **Cuando hay una crisis reciente o activa pero sin colapso bancario
   total, el mercado se reduce a un solo bróker (no minoristas)**
   (Egipto, Pakistán, Sri Lanka) — cobertura mínima mejor que cero, con
   un margen numérico real, pero **sin forma confiable de saber si ese
   margen refleja la moneda de origen o la estructura de precios del
   bróker** (ver punto 4). Esta lectura queda más débil de lo que
   parecía al principio de la ronda.
4. **El intento de usar OFX como un segundo "termómetro" de
   volatilidad (como Western Union en la lectura 1) no funcionó, y se
   pudo confirmar por qué:** al medir OFX en México con dos montos
   (6.000 y 30.000 MXN), el margen bajó de 4,04% a 2,5% — el margen de
   OFX depende del tamaño de la transferencia, no de la moneda de
   origen (Sección 4.3). Es un resultado negativo, pero uno de los
   mejor confirmados de esta ronda. La única comparación controlada
   sólida del proyecto sigue siendo la de Western Union en
   Argentina/Chile (lectura 1).

**La prueba más limpia que sigue faltando:** un país de moneda volátil
donde opere el **mismo proveedor minorista** que en un país de control
(como se logró con Western Union en Argentina/Chile). La vía
alternativa que se exploró esta ronda — usar a OFX como segundo
"termómetro" — **quedó descartada, con evidencia propia**: el margen de
OFX en México cambió de 4,04% a 2,5% solo por aumentar el monto 5
veces, confirmando que responde al tamaño de la operación, no a la
moneda (Sección 4.3). Los
datos de OFX en Egipto/Sri Lanka/Pakistán, entonces, **quedan
degradados de "evidencia de margen alto por volatilidad" a "dato
descriptivo sin comparación controlada confiable"** — siguen siendo
información real y útil (cobertura escasa, margen numérico), pero no se
puede afirmar con la misma confianza que ese margen refleja la moneda
de origen y no otra cosa (tamaño del envío, estructura de precios de
OFX en general, o ambas).

---

## 6. Plan sugerido para la próxima ronda

1. ~~Verificar si OFX muestra margen bajo en un país de moneda estable,
   y si el efecto se explica por el monto de la transferencia.~~
   **Hecho en esta misma ronda (Sección 4.3) — resultado negativo y
   bien confirmado:** OFX mostró 4,04% en México a 6.000 MXN, pero solo
   2,5% a 30.000 MXN — el margen depende del monto, no de la moneda.
   OFX queda descartado como segundo "termómetro" de volatilidad
   cambiaria; el hallazgo en sí (qué proveedor NO sirve para este tipo
   de comparación, y por qué) queda documentado para no repetir el
   intento sin querer en una ronda futura.
2. **Si se quiere insistir con la idea de un segundo proveedor de
   comparación controlada**, el camino que queda abierto es repetir la
   medición de OFX en Egipto/Sri Lanka/Pakistán controlando el monto
   (usando el mismo monto exacto, grande, en los tres) — así se podría
   aislar si sigue habiendo variación entre esos tres países una vez
   descontado el efecto del monto. Es un experimento más específico
   que el de este archivo, y de valor incierto dado lo visto en la
   Sección 4.3.
3. **La variación de margen de OFX entre destinos dentro de Egipto**
   (4,14% Reino Unido vs. 7,53-7,54% EEUU/Italia) quedó sin explicar —
   vale la pena revisar si es un patrón real (relacionado con el par de
   divisas o el volumen de comparaciones) o ruido de un corredor con
   pocos datos.
4. **Nigeria y su reforma de mayo 2026** (remesas entrantes solo en
   naira) es un desarrollo regulatorio reciente que vale la pena seguir
   — si en algún momento Nigeria revierte la prohibición de 2024 sobre
   salidas, sería la primera vez que el proyecto observa una transición
   de "cobertura cero" a "cobertura con datos" en tiempo real (algo
   parecido a lo que ya se especuló para Venezuela en v16 Sección 5.2).
5. **Recordatorio para la carga a Supabase:** los datos de OFX de esta
   ronda (Egipto, Sri Lanka, Pakistán, y los dos de México) son de un
   proveedor de tipo bróker, no minorista — conviene distinguirlos si
   el buscador separa por categoría de servicio, y ojo con no cargar
   los dos montos de México como si fueran corredores distintos (son el
   mismo corredor a dos montos, con fines exploratorios). Nada que
   cargar de Nigeria (cobertura cero).
6. **El hilo "moneda volátil → margen" ya tiene 10 países de origen
   documentados** — antes de sumar más, puede valer la pena consolidar
   esto en un solo documento de referencia (fuera de la cadena v6-v18)
   que reúna toda la metodología y los hallazgos en un lugar, dado que
   ya está disperso en varios archivos (principalmente v16, v17, v18).


---

## research-findings-2026-09-02-v19-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #13 (v19) — Ucrania y Rusia confirman "cobertura cero" por guerra/sanciones; Ghana replica el mecanismo exacto de Nigeria (patrón regional de África Occidental); Kenia aporta un proveedor nuevo

> **Documento nuevo — no reemplaza a v6-v18 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya guardó
> v18. Este es un decimoquinto archivo con **solo lo nuevo de esta
> ronda**. Para el panorama completo hacen falta los 15 juntos.
>
> **Contexto para quien cargue este archivo a Supabase:** los datos de
> Skrill (Kenia) son de un proveedor nuevo para el proyecto — no hay
> contraindicación conocida, pero todavía no se verificó si su margen
> depende del monto de la transferencia (como sí se confirmó para OFX
> en v18 Sección 4.3), así que conviene tratarlo con la misma cautela
> que a los datos de bróker hasta que se investigue. Nigeria, Ghana,
> Ucrania y Rusia son cobertura cero — nada que cargar de esos cuatro.
>
> **Nota metodológica sobre el alcance de esta ronda:** se intentó
> confirmar la cobertura cero de Ucrania a un monto más alto que el
> mínimo (siguiendo el patrón ya usado con éxito para Nigeria en v18),
> pero el mecanismo de clic en el botón "Find providers" falló de forma
> reproducible en esta ronda (un problema de la herramienta de
> navegador, no un hallazgo de datos) — la cobertura cero de Ucrania
> queda confirmada en dos corredores al monto mínimo por defecto, sin la
> confirmación adicional a monto alto que sí se logró con Nigeria. Se
> señala explícitamente como una limitación menor, no se oculta.

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v18, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Ucrania (UAH) probada en dos corredores (Polonia, Alemania) —
   cobertura cero en ambos.** La explicación es la más actual del
   proyecto hasta ahora: el Banco Nacional de Ucrania mantiene un
   régimen de controles de capital de guerra que limita las compras de
   moneda extranjera y pagos al exterior de personas físicas a UAH
   200.000 por mes calendario — un límite que subió recién el **11 de
   agosto de 2026** (hace apenas tres semanas de esta medición), parte
   de una liberalización gradual que sigue en marcha desde la invasión
   rusa de febrero de 2022. Es un mecanismo regulatorio distinto a los
   tres ya documentados (restricción bancaria doméstica en Líbano,
   sanciones externas en Venezuela, prohibición explícita a IMTOs en
   Nigeria) — acá es un **tope mensual de moneda extranjera bajo ley
   marcial**, todavía vigente pero en proceso activo de relajación. Ver
   Sección 1.
2. **Rusia (RUB) probada en dos corredores (Alemania, Turquía) —
   cobertura cero en ambos, incluso hacia Turquía**, un país que
   mantiene relaciones comerciales y bancarias activas con Rusia y no
   participa de las sanciones occidentales — reforzando que el
   mecanismo (sanciones de Occidente a la conectividad bancaria
   internacional de Rusia) es efectivamente global y no depende del
   país de destino específico. Es el caso más parecido a Venezuela del
   hilo, pero a una escala mucho mayor y más documentada. Ver Sección
   2.
3. **Ghana (GHS) probada en dos corredores (Reino Unido, EEUU) —
   cobertura cero en ambos — con un mecanismo prácticamente idéntico al
   de Nigeria: el Banco de Ghana restringe explícitamente a los IMTOs a
   remesas entrantes únicamente, prohibiéndoles operar salidas — una
   norma publicada apenas el 5 de enero de 2026.** Con Nigeria (enero
   2024) y Ghana (enero 2026) usando el mismo mecanismo regulatorio casi
   textual, separados por dos años y ambos en África Occidental, esto
   deja de ser una coincidencia aislada y empieza a verse como un
   **patrón regional de política monetaria**. Ver Sección 3.
4. **Kenia (KES) aportó un proveedor nuevo para el proyecto: Skrill**
   — único proveedor disponible en los dos corredores probados (Reino
   Unido, EEUU), con un margen alto y notablemente consistente entre
   ambos (6,81% y 7,4%) — la primera comparación "mismo proveedor,
   mismo origen, distinto destino" con un proveedor que **no es OFX**,
   desde el caso de Egipto en v18. Ver Sección 4.
5. **Tabla consolidada actualizada a 14 países de origen** — se agrega
   una quinta lectura del hilo, específica para el mecanismo "IMTOs
   restringidos a remesas entrantes por norma explícita" ahora que hay
   dos casos (Nigeria, Ghana) en vez de uno. Ver Sección 5.

---

## 1. Ucrania — cobertura cero bajo un régimen de controles de capital de guerra, todavía vigente pero en liberalización activa

### 1.1 Dos corredores probados, cobertura cero en ambos

- `monito.com/send-money/ukraine/poland/uah/pln` — sin resultados a
  1.000 UAH, sugiere al menos 8.900 UAH.
- `monito.com/send-money/ukraine/germany/uah/eur` — mismo resultado,
  mismo monto sugerido.

Polonia y Alemania son, en la práctica, los dos destinos más relevantes
para la diáspora ucraniana desde 2022 (millones de refugiados y
trabajadores desplazados por la guerra) — así que si Monito tuviera
cualquier cobertura real para transferencias salientes desde Ucrania,
estos serían los corredores más probables de encontrarla. No se pudo
confirmar la cobertura cero a un monto más alto por la limitación de
herramienta ya señalada en la nota del encabezado — queda como una
confirmación parcial, en la misma línea metodológica que Líbano en v16
(donde tampoco se pudo forzar un monto mayor).

### 1.2 La explicación: controles de capital bajo ley marcial, actualizados hace tres semanas

A diferencia de los tres mecanismos ya documentados, el de Ucrania es
el más "vivo" y cambiante del hilo — no una prohibición fija, sino un
régimen de excepción bélica que el Banco Nacional de Ucrania (NBU) va
ajustando periódicamente desde febrero de 2022:

- **Desde el inicio de la invasión rusa (24 de febrero de 2022)**, el
  NBU impuso controles de capital de emergencia bajo ley marcial —
  restringiendo la compra de moneda extranjera, los pagos al exterior,
  y los retiros en efectivo, para preservar las reservas del país en
  medio de la guerra.
- **El NBU ha ido relajando estos controles de forma gradual y
  reiterada** desde entonces, en lo que sus propios comunicados llaman
  una política de "liberalización estimulativa" — cada relajación es
  cuidadosamente calibrada para no comprometer la estabilidad cambiaria
  mientras la guerra sigue en curso.
- **La actualización más reciente encontrada: 10 de agosto de 2026**
  (enmienda a la Resolución N.º 18 del NBU, vigente desde el 11 de
  agosto), que subió varios límites para personas físicas:
  - Compra de moneda extranjera: de UAH 50.000 a **UAH 200.000 por mes
    calendario**, con un mismo banco.
  - Pagos por bienes y servicios en el exterior desde cuentas en
    hryvnia: tope de **UAH 200.000 por mes calendario** (ampliable vía
    tarjeta o transferencias cuenta a cuenta, incluyendo SWIFT).
  - Transferencias desde cuentas propias en moneda extranjera para
    pagar bienes/servicios en el exterior: mismo tope de UAH 200.000
    mensuales.
  - Alquiler y alojamiento en el exterior: tope ampliado a **UAH
    500.000 por mes calendario** desde cuentas en moneda extranjera.
- **A un tipo de cambio de referencia de ~42 UAH/USD**, UAH 200.000
  equivalen a unos **US$4.760 por mes** — un límite real, pero no
  trivialmente bajo. El límite en sí no explica necesariamente por qué
  Monito no lista ningún proveedor (el tope permitiría transferencias
  del tamaño típico de una remesa personal) — lo que probablemente
  explica la ausencia es la combinación de la complejidad regulatoria
  cambiante, el riesgo de cumplimiento normativo bajo ley marcial, y la
  necesidad de que un proveedor de remesas construya toda una
  infraestructura de verificación de límites mensuales por banco — algo
  que ningún proveedor global parece haber decidido construir todavía
  para el mercado ucraniano saliente.

**Este es el cuarto mecanismo regulatorio distinto del hilo** — ni
restricción de retiro bancario (Líbano), ni sanción externa a la banca
(Venezuela), ni prohibición explícita a una categoría de proveedor
(Nigeria/Ghana), sino un **régimen de excepción bélica con topes
mensuales, actualizado con frecuencia y todavía activo pese a más de
cuatro años de guerra**. Es también el caso más reciente y mejor
documentado en tiempo real: la última actualización es de hace apenas
tres semanas.

---

## 2. Rusia — cobertura cero por sanciones occidentales, incluso hacia un país no sancionador

### 2.1 Dos corredores, cobertura cero en ambos — incluyendo Turquía

- `monito.com/send-money/russia/germany/rub/eur` — sin resultados,
  sugiere al menos 17.400 RUB.
- `monito.com/send-money/russia/turkey/rub/try` — mismo resultado,
  mismo monto sugerido.

El segundo corredor es el más revelador de los dos: **Turquía no
participa de las sanciones occidentales a Rusia** y mantiene relaciones
bancarias y comerciales activas con el país (de hecho, Turquía es uno
de los destinos más importantes para el dinero y los ciudadanos rusos
que salieron del país desde 2022). Que Monito no muestre **ningún**
proveedor incluso para ese corredor confirma que el problema no es que
el país de destino sancione a Rusia — es que **los proveedores
minoristas globales que Monito compara (Western Union, Wise, MoneyGram,
etc.) evitan Rusia como origen en general**, casi con certeza por su
propia exposición a las sanciones occidentales (más que por una
restricción específica del destino).

### 2.2 El mecanismo: sanciones occidentales a la conectividad bancaria internacional de Rusia

Este caso no requirió una investigación nueva a fondo — es, con
diferencia, el más documentado y conocido de los cuatro casos de
"cobertura cero" del proyecto, y sigue el mismo mecanismo general que
Venezuela (v16 Sección 5.2), pero a una escala mucho mayor:

- Desde la invasión a gran escala de Ucrania (24 de febrero de 2022),
  EE.UU., la UE, el Reino Unido y otros países impusieron sanciones
  masivas al sistema financiero ruso: exclusión de varios bancos
  rusos del sistema SWIFT, congelamiento de activos del banco central
  ruso en el exterior, y prohibiciones a instituciones financieras
  occidentales de procesar transacciones vinculadas a Rusia.
- A diferencia de Venezuela (sanciones dirigidas específicamente al
  banco central y a un puñado de bancos estatales, con una licencia
  general que sí permitía remesas personales), las sanciones a Rusia
  son mucho más amplias y no incluyen una excepción equivalente y
  ampliamente usada para remesas personales salientes — la mayoría de
  los grandes proveedores globales de remesas simplemente decidieron
  discontinuar sus servicios desde Rusia por completo, antes que
  gestionar el riesgo de cumplimiento normativo caso por caso.
- **Rusia queda, entonces, como el caso "control" más extremo del
  mecanismo de sanciones**: mientras que Venezuela recuperó parcialmente
  la conectividad bancaria en abril de 2026 (v16 Sección 5.2), no hay
  ninguna señal equivalente para Rusia — las sanciones occidentales a
  Rusia siguen en pleno vigor y sin fecha de revisión conocida.

**Rusia y Venezuela, comparados:** ambos casos comparten el mecanismo
general (sanciones externas cortan la conectividad bancaria), pero
difieren en escala y trayectoria — Venezuela es un caso más chico,
ya con una licencia de reversión parcial reciente; Rusia es un caso
mucho más grande, con sanciones más profundas y sin señales de
reversión. El hilo del proyecto ahora tiene dos ejemplos de este
mecanismo con trayectorias claramente distintas, lo que lo vuelve más
robusto como categoría.

---

## 3. Ghana — el mismo mecanismo que Nigeria, casi al pie de la letra: un patrón regional de África Occidental

### 3.1 Dos corredores, cobertura cero en ambos

- `monito.com/send-money/ghana/united-kingdom/ghs/gbp` — mensaje
  distinto a los demás casos: *"We couldn't find any providers who'd
  transfer to the UK in Pounds sterling (GBP). Try sending to US
  dollars instead"* — sugiriendo probar en dólares en vez de un monto
  mayor.
- `monito.com/send-money/ghana/united-states/ghs/usd` — mismo
  resultado ahí también: *"We couldn't find any providers who'd send
  Ghanaian cedi (GHS) from Ghana to the USA. Try sending the same
  amount in US dollars instead"* — es decir, cobertura cero incluso
  intentando la moneda de destino más común del mundo.

### 3.2 La explicación: el Banco de Ghana prohibió a los IMTOs operar salidas — casi el mismo texto que Nigeria, dos años después

Una búsqueda encontró la norma exacta, publicada muy recientemente:

- El **5 de enero de 2026**, el Banco de Ghana (BoG) publicó nuevas
  guías para los IMTOs (International Money Transfer Operators) que
  los **restringen explícitamente a remesas entrantes de persona a
  persona únicamente, prohibiéndoles operar transferencias
  salientes**. El texto es notablemente parecido en espíritu al de la
  norma nigeriana de 2024.
- Restricciones operativas adicionales de la misma norma: los IMTOs no
  pueden aceptar depósitos, otorgar préstamos, comerciar divisas, ni
  ofrecer seguros o productos de inversión; no pueden pagar remesas a
  cuentas corporativas (solo cuentas personales); deben liquidar todas
  las operaciones en cedis a través de bancos universales; y la moneda
  extranjera recibida debe convertirse a cedis el mismo día, al tipo de
  cambio que fija el BoG.
- **Plazos de transición:** un período de procesamiento de 90 días
  para solicitudes completas, y un período de gracia de 3 meses para
  que los IMTOs ya operando regularicen su situación bajo las nuevas
  reglas.

### 3.3 Nigeria y Ghana, lado a lado: ¿un patrón regional?

| | Nigeria | Ghana |
|---|---|---|
| Regulador | Banco Central de Nigeria (CBN) | Banco de Ghana (BoG) |
| Fecha de la norma | 31 de enero de 2024 | 5 de enero de 2026 |
| Mecanismo | IMTOs restringidos a remesas **entrantes** únicamente | IMTOs restringidos a remesas **entrantes** de persona a persona únicamente |
| Motivo declarado | Gestionar reservas de divisas, estabilizar la moneda, monitorear transacciones | Fortalecer el cumplimiento normativo de cambio de divisas (parte de una estrategia más amplia del BoG) |
| Moneda de origen | Naira (NGN) | Cedi (GHS) |

**Con dos países de África Occidental usando el mismo mecanismo
regulatorio — restringir a los IMTOs a operar solo remesas entrantes,
nunca salientes — con apenas dos años de diferencia, esto empieza a
verse menos como una coincidencia y más como un patrón regional.**
Ambos países comparten características relevantes: monedas con
depreciación crónica, dependencia histórica de remesas entrantes como
fuente de divisas, y bancos centrales presionados por reservas
limitadas. Es razonable especular que uno de los dos reguladores tomó
al otro como referencia (Ghana siguiendo el precedente nigeriano dos
años después), aunque esto no se pudo confirmar con una fuente directa
— queda como una hipótesis razonable, no un hecho verificado.

**Implicación para el proyecto:** si este patrón se confirma en un
tercer país de la región (candidatos: Sierra Leona, Liberia, Guinea, o
cualquier otro país de la CEDEAO/ECOWAS con una moneda bajo presión),
dejaría de ser una coincidencia bilateral y se convertiría en una
categoría regional de política monetaria digna de su propia sección en
la consolidación del hilo.

---

## 4. Kenia — un proveedor nuevo (Skrill), margen alto y consistente entre destinos

### 4.1 Dos corredores, mismo proveedor, margen similar

| Corredor | Proveedor | Monto enviado | Fee | Tasa | vs. mid-market | Recibe |
|---|---|---|---|---|---|---|
| Kenia→Reino Unido | Skrill | 32.400 KES | 635,00 KES | 0.005338 | 6,81% peor | 169,56 GBP |
| Kenia→EEUU | Skrill | 50.000 KES | 495,00 KES | 0.007153 | 7,4% peor | 354,11 USD |

**Skrill** es una billetera digital/proveedor de pagos que no había
aparecido antes en el proyecto — se suma a OFX (v18) como un segundo
proveedor de "relleno" que aparece cuando los proveedores minoristas
tradicionales (Western Union, Global66, MoneyGram, Wise) no operan
desde un país de origen. En ambos corredores kenianos, Skrill es el
**único** proveedor disponible.

El margen es alto (6,81%-7,4%) — más alto que cualquier corredor
argentino medido hasta ahora, y consistente entre los dos destinos
probados, en la misma línea que el patrón "mismo proveedor, mismo
origen, distinto destino" ya visto con Global66 en Argentina (v16
Sección 2) y OFX en Egipto (v18 Sección 2.2).

### 4.2 El chelín keniano no es un caso de crisis extrema — lo que hace este dato más interesante

A diferencia de Argentina, Egipto o Pakistán, Kenia no tiene una
historia de crisis cambiaria dramática o reciente muy conocida
internacionalmente. El chelín keniano (KES) sí devaluó notablemente en
2023 (llegando a mínimos históricos frente al dólar), pero se recuperó
de forma relativamente ordenada durante 2024-2025 con el apoyo de un
programa del FMI — un perfil más parecido al de Sri Lanka
(crisis-y-recuperación) que al de Argentina o Egipto (crisis
prolongada o en curso). Sin embargo, **el margen de Skrill en Kenia
(6,81%-7,4%) es más alto que cualquiera de esos dos casos.**

**Esto es un recordatorio importante del caveat ya aprendido con OFX en
v18:** no se puede asumir que el margen de un proveedor "de relleno"
como Skrill refleje la volatilidad de la moneda de origen sin antes
descartar otras explicaciones — el tamaño de la transferencia (632.400
KES ≈ US$250 y 50.000 KES ≈ US$385, montos relativamente chicos en
términos absolutos), la estructura de precios propia de Skrill como
billetera digital (que puede no ser comparable a un bróker de FX como
OFX, pero tampoco es un proveedor de remesas minorista clásico), o
simplemente que Kenia tenga menos competencia de proveedores
establecidos que otros mercados de tamaño similar. **No se investigó
esto a fondo en esta ronda** — queda como una pregunta abierta
explícita para no repetir el error de sacar una conclusión apurada
sobre volatilidad cambiaria sin antes controlar por estos factores, tal
como pasó (y se corrigió) con OFX.

---

## 5. Consolidación actualizada del hilo (14 países de origen)

| País de origen | Moneda | Resultado en Monito | Proveedor(es) | Margen / cobertura | Categoría |
|---|---|---|---|---|---|
| Argentina | ARS | Cobertura normal | Global66, Western Union | 4,03%-5,35% | **Alto, confirmado** (mismo proveedor vs. control) |
| Chile | CLP | Cobertura normal | Western Union, Global66, MoneyGram | 0,02%-1,40% | Bajo — grupo de control |
| México | MXN | Cobertura normal | Western Union, OFX | 0,86%-1,09% (WU) / 2,5%-4,04% (OFX, según monto) | Bajo (WU) — control |
| Turquía | TRY | Cobertura normal, otro conjunto de proveedores | TransferGo (⚠️), Wise (agregado), OFX | 1,2%-2,27% | Bajo/moderado — sin comparación controlada |
| Egipto | EGP | Cobertura mínima (1 proveedor) | OFX (bróker) | 4,14%-7,54% | Alto, pero sin comparación controlada confiable |
| Pakistán | PKR | Cobertura mínima (1 proveedor) | OFX (bróker) | 5,13% | Alto, pero sin comparación controlada confiable |
| Sri Lanka | LKR | Cobertura mínima (1 proveedor) | OFX (bróker) | 2,51% | Bajo/moderado, sin comparación controlada confiable |
| Kenia | KES | Cobertura mínima (1 proveedor) | Skrill | 6,81%-7,4% | Alto, pero sin comparación controlada confiable (caveat pendiente, ver 4.2) |
| Líbano | LBP | **Cobertura cero** | — | N/A | Restricción bancaria doméstica (BdL, jul. 2025) |
| Venezuela | VES | **Cobertura cero** | — | N/A | Sanciones de EE.UU. a la banca central (2019-abr. 2026) |
| Nigeria | NGN | **Cobertura cero** | — | N/A | Prohibición explícita a IMTOs (CBN, ene. 2024) |
| Ghana | GHS | **Cobertura cero** | — | N/A | Prohibición explícita a IMTOs (BoG, ene. 2026) — mismo mecanismo que Nigeria |
| Ucrania | UAH | **Cobertura cero** | — | N/A | Controles de capital bajo ley marcial (NBU, actualizado ago. 2026) |
| Rusia | RUB | **Cobertura cero** | — | N/A | Sanciones occidentales a la conectividad bancaria (feb. 2022-presente) |

**Cinco lecturas del hilo completo:**

1. **Cuando hay cobertura y el mismo proveedor minorista opera en
   ambos países, el margen escala con la volatilidad/historial de
   crisis de la moneda** (Argentina vs. Chile, Western Union) — sigue
   siendo la única comparación controlada verdaderamente sólida.
2. **Bajo restricción bancaria doméstica sobre retiros, cobertura
   cero** (Líbano).
3. **Bajo sanciones externas a la conectividad bancaria, cobertura
   cero** — ahora con dos ejemplos de escala y trayectoria distinta
   (Venezuela, revirtiendo parcialmente; Rusia, sin señales de
   reversión).
4. **Bajo prohibición regulatoria explícita a la categoría de
   proveedor (IMTOs), cobertura cero** — ahora con dos ejemplos que
   comparten el mismo mecanismo casi textual (Nigeria 2024, Ghana
   2026), lo que empieza a sugerir un patrón regional de política
   monetaria en África Occidental en vez de una decisión aislada.
5. **[Nueva] Bajo un régimen de controles de capital de excepción
   (guerra, no crisis cambiaria ordinaria), cobertura cero incluso con
   límites mensuales que en principio permitirían el monto típico de
   una remesa personal** (Ucrania) — sugiriendo que la ausencia de
   proveedores responde más a la complejidad/riesgo regulatorio
   percibido que al límite numérico en sí.
6. **Cuando hay una crisis reciente, activa, o simplemente un mercado
   de menor escala, el mercado se reduce a un solo proveedor "de
   relleno" (bróker o billetera digital) con margen alto** — ahora con
   dos proveedores distintos cumpliendo este rol (OFX en Egipto/Sri
   Lanka/Pakistán; Skrill en Kenia), pero **sin forma confiable
   todavía de atribuir ese margen a la moneda de origen** en ninguno de
   los dos casos — el precedente de OFX (v18 Sección 4.3, margen
   dependiente del monto) es una advertencia que se aplica también a
   Skrill hasta que se investigue.

---

## 6. Plan sugerido para la próxima ronda

1. **Verificar si el margen de Skrill en Kenia también depende del
   monto de la transferencia**, replicando el experimento que se hizo
   con OFX en México (v18 Sección 4.3) — probar el mismo corredor
   keniano con un monto bastante mayor a 32.400/50.000 KES, para
   confirmar o descartar el mismo efecto de confusión.
2. **Buscar un tercer país de África Occidental con el mismo mecanismo
   regulatorio que Nigeria/Ghana** (candidatos: Sierra Leona, Liberia,
   Guinea, Costa de Marfil) — si se confirma, la Sección 3.3 de este
   archivo pasaría de "hipótesis razonable" a "patrón regional
   confirmado con 3+ casos".
3. **Confirmar la cobertura cero de Ucrania a un monto más alto**,
   retomando el intento que falló en esta ronda por una limitación de
   herramienta — no debería requerir investigación nueva, solo
   resolver el problema de interacción con el formulario.
4. **Seguir buscando el santo grial del hilo: un país de moneda
   volátil donde opere el mismo proveedor minorista que en un país de
   control** (como Western Union en Argentina/Chile) — ninguno de los
   países probados en v18 o en esta ronda lo logró. Vale la pena
   revisar sistemáticamente en qué países africanos o asiáticos aparece
   Western Union como proveedor de origen (no solo de destino, que es
   mucho más común) antes de seguir probando países al azar.
5. **Recordatorio para la carga a Supabase:** nada que cargar de
   Nigeria, Ghana, Ucrania o Rusia (cobertura cero). Los datos de Kenia
   (Skrill) son de un proveedor nuevo, sin verificar todavía si su
   margen depende del monto — misma cautela que con OFX hasta
   confirmar.
6. **El hilo ya tiene 14 países de origen y 5 lecturas distintas** —
   sigue siendo, con diferencia, el tema más desarrollado y con más
   evidencia acumulada de todo el proyecto esta sesión. Podría valer la
   pena, en algún momento cercano, convertirlo en su propio documento
   de referencia consolidado (idea que ya había aparecido en v18 Sección
   6, punto 6, y que sigue en pie).


---

## research-findings-2026-09-03-v20-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #14 (v20) — El "santo grial" se reformula: ocho países nuevos de cobertura cero sugieren que Chile/Argentina-Western Union es la excepción, no la regla; Skrill se confirma independiente del monto; Ucrania cierra su verificación pendiente

> **Documento nuevo.** No reemplaza a v6 – v19 (`research-findings-2026-09-02-v16-addendum.md` en adelante); los complementa. Si estás cargando datos a Supabase, este archivo es la referencia más reciente sobre el hilo "moneda volátil → margen", pero **no repite** las tablas de detalle de rondas anteriores — solo las resume en la Sección 6.
>
> **Contexto para quien cargue este archivo a Supabase:** de las ocho investigaciones nuevas de esta ronda (Etiopía, Bolivia, Angola, Sierra Leona, Liberia, Sudán, Surinam, Haití), **ninguna aporta datos de proveedores cargables** — los ocho países tienen cobertura cero confirmada en Monito (sin proveedor, sin margen, sin tarifa). Lo único cargable de esta ronda es la reconfirmación de Skrill en Kenia (dato ya cargado en v19, ahora con mayor certeza metodológica) y la reconfirmación de Ucrania (también ya "cargado" como cobertura cero en v19, ahora con evidencia más sólida). **No hay filas nuevas para la tabla de proveedores; sí hay contexto adicional para las notas metodológicas de países con cobertura cero.**
>
> **Nota metodológica importante para rondas futuras:** esta ronda encontró un método mucho más confiable para forzar un monto específico en Monito — pasar el monto como segmento final de la URL (`monito.com/send-money/{origen}/{destino}/{moneda-origen}/{moneda-destino}/{MONTO}`) en lugar de usar el formulario "Compare for your transfer amount", que en rondas anteriores (v18, v19) falló de forma intermitente por errores de clic ("outside the viewport", "(0,0) could not be attributed to a frame"). Este método por URL funcionó de forma consistente y reproducible en los ~20 intentos de esta ronda. Se documenta en la Sección 3.

## 0. Resumen de esta ronda

Esta ronda tuvo dos objetivos heredados del plan de v19 (verificar Skrill y reconfirmar Ucrania) y un tercer objetivo abierto (seguir buscando el "santo grial": un segundo país de moneda volátil con un proveedor retail conocido, como el hallazgo original de Western Union en Chile/Argentina). Los tres se cumplieron, y el tercero terminó generando el hallazgo más importante de la ronda:

- **Skrill (Kenia) se confirma independiente del monto** — a diferencia de OFX (México), que sí mostró un margen dependiente del tamaño de la transferencia, Skrill mostró el **mismo margen exacto** (6.81% en Kenia→Reino Unido, 7.4% en Kenia→EEUU) tanto en el monto por defecto de Monito como en montos ~15-20 veces mayores. Esto **mejora** la confiabilidad de los datos de Kenia de v19: ya no hace falta la advertencia de "pendiente de verificar como se hizo con OFX" — quedó verificado, y el resultado es el opuesto al de OFX.
- **Ucrania cierra su verificación pendiente de v19**: la ronda anterior no pudo confirmar la cobertura cero a un monto forzado más alto por una falla de herramientas (clics rotos). Esta ronda, con el nuevo método de forzado por URL, se confirmó cobertura cero en ambos corredores (Polonia, Alemania) a 100,000 UAH — muy por encima del mínimo sugerido de 8,900 UAH.
- **Ocho países nuevos, cobertura cero en los ocho**: Etiopía, Bolivia, Angola, Sierra Leona, Liberia, Sudán, Surinam y Haití — todos con monedas volátiles o economías en crisis, todos sin un solo proveedor en Monito para el corredor probado, confirmado tanto al monto por defecto como a un monto forzado varias veces mayor.
- **Reformulación del "santo grial"**: después de probar ahora 22 países/corredores de moneda volátil en total a lo largo de todo el proyecto, Western Union en Chile/Argentina sigue siendo el **único** caso de comparación controlada limpia (mismo proveedor, mismo tipo de moneda destino, distinto origen). La nueva hipótesis de trabajo — explícitamente marcada como interpretación, no como hecho confirmado — es que ese hallazgo podría ser **una anomalía histórica de Western Union en América Latina** (presencia comercial de décadas) más que un patrón replicable en otras regiones. Ver Sección 4.9.
- **Distinción metodológica nueva**: no todos los casos de "cobertura cero" tienen un mecanismo regulatorio fechado y documentable como Nigeria/Ghana/Líbano/Venezuela/Ucrania/Rusia. Sierra Leona y Liberia no arrojaron ninguna normativa específica de restricción — probablemente son vacíos comerciales/de cobertura de Monito, no controles de capital activos. Haití es un caso aparte: Western Union tiene presencia real y conocida allí, pero Monito no lo muestra — lo cual sugiere que la "cobertura cero en Monito" a veces refleja un vacío de la propia plataforma, no necesariamente la ausencia real de proveedores en el mercado.
- **Nuevo método de forzado de monto por URL**, documentado en la Sección 3, que debería reemplazar el uso del formulario "Compare for your transfer amount" en rondas futuras.
- Tabla consolidada actualizada a **22 países** (Sección 6).

---

## 1. Verificación de dependencia de monto en Skrill (Kenia)

### 1.1 Contexto

En v19 se descubrió a Skrill como proveedor único ("de relleno") en Kenia→Reino Unido (margen 6.81%) y Kenia→EEUU (margen 7.4%), con una advertencia explícita: OFX ya había mostrado en v18 que un proveedor "de relleno" de este tipo puede tener un margen que depende del **tamaño de la transferencia** más que de la volatilidad de la moneda, lo cual invalidaría su uso como "segundo termómetro" de volatilidad. Esa pregunta quedó abierta como ítem #1 del plan de v19.

### 1.2 Metodología

Se repitió exactamente el experimento que se le hizo a OFX en México (v18): comparar el margen porcentual del mismo proveedor, mismo corredor, en dos montos muy distintos.

### 1.3 Resultado — Kenia → Reino Unido (KES → GBP)

| Monto enviado | Proveedor | Tarifa | Tipo de cambio aplicado | Margen vs. mid-market | Recibido |
|---|---|---|---|---|---|
| 32,400 KES (monto por defecto de Monito) | Skrill | 635.00 KES | 0.005338 | **6.81%** | 169.56 GBP |
| 500,000 KES (~15.4x el default) | Skrill | 9,804.00 KES | 0.005338 | **6.81%** | 2,617 GBP |

### 1.4 Resultado — Kenia → EEUU (KES → USD)

| Monto enviado | Proveedor | Tarifa | Tipo de cambio aplicado | Margen vs. mid-market | Recibido |
|---|---|---|---|---|---|
| 50,000 KES (monto por defecto de Monito, dato de v19) | Skrill | 495.00 KES | 0.007155 | **7.4%** | — |
| 1,000,000 KES (20x el default) | Skrill | 9,901.00 KES | 0.007155 | **7.4%** | 7,084 USD |

### 1.5 Interpretación

El tipo de cambio aplicado por Skrill (0.005338 GBP/KES y 0.007155 USD/KES) es **idéntico** en ambos montos probados por corredor, y por lo tanto el margen porcentual también lo es. Esto es el resultado **opuesto** al de OFX en México, donde el tipo de cambio efectivamente aplicado mejoraba con el monto (empeorando menos el margen a medida que subía el monto — 4.04% a 6,000 MXN vs. 2.5% a 30,000 MXN).

Conclusión: **Skrill no muestra el patrón de "descuento por volumen" que sí mostró OFX.** Esto no prueba que Skrill's margen esté impulsado por la volatilidad de la moneda (seguimos sin tener un segundo corredor del mismo proveedor Skrill en un país de moneda estable para hacer la comparación controlada), pero sí **descarta la principal amenaza a la validez** que se había señalado en v19. El dato de Kenia puede tratarse ahora con la misma confianza descriptiva que Egipto/Sri Lanka/Pakistán (proveedor de relleno confiable en su propio margen, aunque sin comparación controlada same-provider todavía).

---

## 2. Ucrania: cierre de la verificación pendiente de v19

### 2.1 Qué quedó pendiente

v19 documentó cobertura cero para Ucrania→Polonia y Ucrania→Alemania, pero solo al monto por defecto de Monito (1,000 UAH, con un mínimo sugerido de 8,900 UAH) — el intento de forzar un monto más alto para confirmar que la cobertura cero no era un artefacto del monto mínimo falló repetidamente por errores de clic en el botón "Find providers" y en el formulario complementario.

### 2.2 Resultado esta ronda

Usando el nuevo método de forzado por URL (Sección 3), se repitieron ambos corredores a **100,000 UAH** — más de 11 veces el mínimo sugerido por la propia Monito:

| Corredor | Monto forzado | Resultado |
|---|---|---|
| Ucrania → Polonia (UAH → PLN) | 100,000 UAH | Cobertura cero — "We couldn't find any providers who'd transfer to Poland in Polish zlotys (PLN)" |
| Ucrania → Alemania (UAH → EUR) | 100,000 UAH | Cobertura cero — "We couldn't find any providers who'd transfer to Germany in euros (EUR)" |

### 2.3 Interpretación

Queda confirmado: la cobertura cero de Ucrania **no es un artefacto de monto insuficiente**. A un monto de 100,000 UAH (~US$2,380 al tipo de cambio de mercado de esta ronda), Monito sigue sin encontrar un solo proveedor para ninguno de los dos corredores probados. Esto refuerza la lectura de v19: el mecanismo detrás de la cobertura cero de Ucrania es estructural (controles de capital de guerra del NBU, o directamente ausencia de proveedores dispuestos a operar el corredor dado el riesgo), no un simple problema de "monto demasiado bajo para que a Monito le convenga mostrar resultados" como sí ocurre en Sierra Leona, Liberia, Etiopía, Angola, Sudán, Surinam y Haití (ver Sección 4), donde el mensaje explícitamente invita a "probar un monto más alto" en lugar de sugerir cambiar de moneda.

---

## 3. Avance metodológico: forzado de monto vía URL

### 3.1 El problema en rondas anteriores

Desde v17 en adelante, forzar un monto distinto al que carga Monito por defecto requería interactuar con el formulario "Compare for your transfer amount" (rellenar el campo y hacer clic en "Compare ❯"), o con el botón "Find providers" de la página de "sin resultados". Ambos mecanismos fallaron de forma intermitente y a veces catastrófica en rondas anteriores: errores de "the press at (0, 0) could not be attributed to a frame", refs "entirely outside the viewport" (a veces con coordenadas Y negativas extremas, sugiriendo un estado de scroll roto), y un `computer screenshot` que devolvía sistemáticamente una imagen en blanco, lo que impedía verificar visualmente el estado de la página antes de intentar un clic por coordenadas.

### 3.2 El método encontrado esta ronda

Monito acepta el monto como un **quinto segmento en la ruta de la URL**, después de las monedas:

```
https://monito.com/send-money/{origen}/{destino}/{moneda-origen}/{moneda-destino}/{MONTO}
```

Ejemplo verificado: `https://monito.com/send-money/kenya/united-kingdom/kes/gbp/500000` carga directamente los resultados para un envío de 500,000 KES, sin necesidad de ningún clic ni interacción con formularios.

**Importante:** un parámetro de query string (`?amount=500000`) **no funciona** — se probó explícitamente y la página ignora el parámetro y sigue mostrando el monto por defecto. Solo el segmento de ruta funciona.

### 3.3 Confiabilidad

Este método se usó exitosamente unas 15 veces en esta ronda (Kenia x2, Ucrania x2, Sierra Leona x2, Liberia, Etiopía, Bolivia x2, Angola, Sudán x2, Surinam x2, Haití x2) sin un solo fallo. Se recomienda que sea el método por defecto en rondas futuras para cualquier verificación de dependencia de monto o confirmación de cobertura cero a un monto más alto, reservando el formulario interactivo solo para casos donde no se pueda predecir la URL de antemano.

### 3.4 Limitación

Este método no resuelve la necesidad de interactuar con otros elementos de la página (por ejemplo, cambiar el país de origen/destino desde cero sin conocer el slug exacto). Para eso puede seguir haciendo falta el buscador de la página principal — pero para el caso de uso más común de este proyecto (confirmar o refutar cobertura cero a un monto más alto en un corredor ya identificado), el método por URL es estrictamente superior.

---

## 4. Ampliación de la búsqueda del "santo grial": ocho países nuevos, cobertura cero en los ocho

Recordatorio del objetivo: se busca un país de moneda volátil/en crisis donde opere un proveedor **retail conocido** (Western Union, MoneyGram, Global66, etc.) para poder repetir la comparación controlada mismo-proveedor que dio el hallazgo más limpio de todo el proyecto (Western Union: 1.37-1.40% en Chile vs. 5.12-5.35% en Argentina). Esta ronda se probaron ocho candidatos nuevos, elegidos por tener antecedentes conocidos de crisis cambiaria, inflación alta o controles de capital, y explícitamente evitando países ya cubiertos por sanciones/guerra activa cuando fue posible (para variar el tipo de mecanismo).

### 4.1 Etiopía (ETB)

**Corredor probado:** Etiopía → EEUU (ETB → USD). Cobertura cero al monto por defecto (1,000 ETB, mínimo sugerido 32,300 ETB) y confirmada a 500,000 ETB.

**Mecanismo:** en julio de 2024, el Banco Nacional de Etiopía liberalizó el tipo de cambio (Directiva FXD/01/2024), permitiendo que el birr flotara. La moneda se devaluó un 30% de inmediato y un 70% adicional en los diez días siguientes al retirarse los controles del banco central. Para mediados de 2025, sin embargo, había reaparecido una prima de mercado paralelo del 20-30%, con un sistema fragmentado de "más de cuatro tipos de cambio distintos simultáneos" (tasa bancaria oficial, tasa de casas de cambio, tasa del mercado paralelo en el Merkato de Adís Abeba, y tasas especiales de bancos con conexiones políticas). El banco central cuenta con reservas de solo 2.4 meses de cobertura de importaciones, y el FMI estructuró un rescate de US$3,400 millones para reconstruir reservas gradualmente en cuatro años, no para dar liquidez inmediata.

**Lectura:** un caso más de "liberalización cambiaria que no logra unificar el mercado" — comparable en espíritu al caso egipcio (v18), pero sin que eso se traduzca (todavía) en cobertura de Monito.

Fuente: [Ethiopia's Currency Gamble — Ethiopia Insight](https://www.ethiopia-insight.com/2025/12/27/ethiopias-currency-gamble/)

### 4.2 Bolivia (BOB)

**Corredores probados:** Bolivia → EEUU (BOB → USD) y Bolivia → España (BOB → EUR). Cobertura cero en ambos, confirmada a montos más altos (100,000 BOB para España).

**Nota de patrón de mensaje:** a diferencia de Etiopía/Angola/Sierra Leona/Liberia/Sudán/Surinam/Haití (que muestran el mensaje "try a higher amount" / "monto sugerido"), Bolivia mostró el mensaje "Try sending [to Spain / the same amount] in US dollars instead" — el mismo patrón de mensaje que Nigeria y Ghana (v18/v19), que tienen un mecanismo regulatorio confirmado de restricción activa. Esto podría ser una pista de que la ausencia de BOB específicamente (no solo de proveedores en general) está más regulada que en los otros seis casos nuevos — aunque no se encontró una normativa boliviana específica de restricción a IMTOs equivalente a la de Nigeria/Ghana; queda como hipótesis a investigar en una próxima ronda.

**Mecanismo (contexto de crisis, no necesariamente de restricción a remesas):** la escasez de dólares se agravó durante 2024, impulsada por la dependencia boliviana del dólar para el pago de deuda externa e importaciones esenciales, junto con la caída de reservas. Para mediados de 2024, la brecha entre el tipo de cambio oficial (~6.96 BOB/USD) y el paralelo (hasta 10 BOB/USD) había llegado a más del 50%.

Fuente: [What happened with the dollar shortage in Bolivia — Oikocredit](https://www.oikocredit.org/news/what-happened-with-the-dollar-shortage-in-bolivia-and-why-it-matters-for-oikocredit/)

### 4.3 Angola (AOA)

**Corredor probado:** Angola → Portugal (AOA → EUR, elegido por la fuerte diáspora angoleña en Portugal). Cobertura cero al monto por defecto (mínimo sugerido 183,300 AOA) y confirmada a 1,000,000 AOA.

**Mecanismo:** el Banco Nacional de Angola (BNA) mantiene lo que fuentes bancarias describen como una "mano invisible" que presiona a los bancos para que no hagan ofertas "especulativas", manteniendo de facto un régimen casi fijo pese a que el gobernador niega públicamente intervenir. El tipo de cambio quedó prácticamente estancado en torno a 912 Kz/USD desde diciembre de 2024 hasta mayo de 2025 (cinco meses), tras una devaluación del 39% en 2023. A diferencia de Nigeria/Ghana, esto es una gestión **informal/opaca** del tipo de cambio, no una normativa fechada y publicada que prohíba explícitamente las remesas salientes — otra distinción metodológica relevante (ver Sección 4.9).

Fuente: [Angola: BNA Moves Exchange Rate After Long Stagnation — 360 Mozambique](https://360mozambique.com/world/angola/angola-bna-moves-exchange-rate-after-long-stagnation/)

### 4.4 Sierra Leona (SLL/SLE)

**Corredores probados:** Sierra Leona → Reino Unido (SLL → GBP) y Sierra Leona → EEUU (SLL → USD). Cobertura cero en ambos al monto por defecto (mínimo sugerido 4,585,600 SLL) y confirmada a 10,000,000 SLL.

**Mecanismo:** no se encontró ninguna normativa vigente y fechada equivalente a la de Nigeria/Ghana. La única restricción documentada fue una **restricción de divisas de 2019** (límite de US$10,000 en tenencias fuera del sistema bancario, prohibición de transacciones en moneda extranjera), que fue **levantada** según una nota de prensa sin fecha exacta de derogación, pero descrita como "de un año de duración" — es decir, ya no vigente. No hay evidencia de una prohibición actual a IMTOs.

**Lectura:** este es probablemente un caso de **vacío comercial/de cobertura de Monito**, no un control de capital activo — ver la distinción metodológica de la Sección 4.9.

Fuente: [Sierra Leone lifts year-long foreign currency transaction restriction — TrendsnAfrica](https://trendsnafrica.com/sierra-leone-lifts-year-long-foreign-currency-transaction-restriction/)

### 4.5 Liberia (LRD)

**Corredor probado:** Liberia → EEUU (LRD → USD). Cobertura cero al monto por defecto (mínimo sugerido 35,600 LRD) y confirmada a 500,000 LRD.

**Mecanismo:** no se encontró ninguna normativa específica de restricción a IMTOs. Liberia tiene una economía **dual-moneda** (el dólar liberiano y el dólar estadounidense circulan simultáneamente como moneda de curso legal), lo cual podría explicar en parte por qué Monito no tiene proveedores modelados para el LRD específicamente — quienes envían dinero hacia o desde Liberia probablemente usan directamente USD en la práctica, dejando al LRD sin un mercado de remesas desarrollado que atraiga a los IMTOs internacionales.

**Lectura:** al igual que Sierra Leona, sin mecanismo regulatorio confirmado — otro candidato a "vacío de cobertura" más que a "control de capital".

### 4.6 Sudán (SDG)

**Corredor probado:** Sudán → Reino Unido (SDG → GBP). Cobertura cero al monto por defecto (mínimo sugerido 120,000 SDG) y confirmada a 1,000,000 SDG.

**Mecanismo:** la guerra civil sudanesa desde abril de 2023 (Fuerzas Armadas de Sudán, SAF, contra las Fuerzas de Apoyo Rápido, RSF) fracturó el sistema monetario del país en dos autoridades monetarias competidoras. En noviembre de 2024, el banco central introdujo billetes rediseñados de SDG 1,000 y 500, restringiendo el canje a titulares de cuentas bancarias — lo cual excluyó de facto a las zonas controladas por la RSF, que respondió declarando de curso legal los billetes antiguos en su territorio, creando sistemas monetarios paralelos. La banca tradicional dejó de funcionar en gran parte de las zonas RSF (particularmente Darfur); usuarios de la aplicación bancaria Bankak (del Bank of Khartoum) reportaron cuentas congeladas, y las tarifas de transferencia dentro del país llegaron al 30% por la falta de liquidez.

**Lectura:** un quinto mecanismo distinto dentro del hilo — no es sanción externa (como Rusia/Venezuela), no es control de capital de guerra centralizado (como Ucrania), no es prohibición regulatoria a IMTOs (como Nigeria/Ghana): es **colapso institucional por guerra civil interna**, con dos autoridades monetarias compitiendo dentro del mismo país.

Fuente: [STPT: 'Sudan's monetary system is fractured by war' — Dabanga Sudan](https://www.dabangasudan.org/en/all-news/article/stpt-sudans-monetary-system-is-fractured-by-war)

### 4.7 Surinam (SRD)

**Corredor probado:** Surinam → Países Bajos (SRD → EUR, elegido por la fuerte diáspora surinamesa en los Países Bajos). Cobertura cero al monto por defecto (mínimo sugerido 7,600 SRD) y confirmada a 50,000 SRD.

**Mecanismo:** no investigado en profundidad esta ronda por límite de tiempo — se sabe, por conocimiento general, que Surinam atravesó una crisis cambiaria severa en 2021-2023 (el SRD perdió aproximadamente el 90% de su valor) y mantiene un programa del FMI desde diciembre de 2021, pero no se verificó si existe una restricción específica a remesas salientes. **Queda como ítem explícito para la próxima ronda.**

### 4.8 Haití (HTG)

**Corredor probado:** Haití → EEUU (HTG → USD). Cobertura cero al monto por defecto (mínimo sugerido 26,200 HTG) y confirmada a 500,000 HTG.

**Por qué este caso es distinto a los otros siete:** Western Union tiene una presencia real y muy conocida en Haití — es, en la práctica, uno de los mercados de remesas más grandes y mejor establecidos de Western Union en el Caribe, dada la enorme diáspora haitiana en EEUU. Que Monito muestre cobertura cero para este corredor **no puede explicarse por ausencia real de proveedores en el mercado** — es casi con certeza un vacío de la propia base de datos/cobertura comercial de Monito para este origen específico, no un reflejo de la realidad del mercado de remesas haitiano.

**Implicación metodológica importante:** este caso es la evidencia más clara hasta ahora de que "cobertura cero en Monito" y "ausencia real de proveedores en el país" **no son lo mismo**. Para países donde Monito simplemente no tiene acuerdos comerciales o datos cargados (mercados más pequeños o considerados de mayor riesgo por los propios IMTOs para expandir su comparador), la cobertura cero mide la cobertura de Monito, no el mercado real. Esto no invalida los hallazgos de países donde sí se documentó un mecanismo regulatorio explícito y fechado (Nigeria, Ghana, Líbano, Venezuela, Ucrania, Rusia) — ahí la cobertura cero es consistente con una explicación causal verificada independientemente — pero sí debilita la fuerza probatoria de los casos sin mecanismo confirmado (Sierra Leona, Liberia, y ahora, más claramente, Haití).

### 4.9 Síntesis: reformulando la pregunta del "santo grial"

Con esta ronda, el proyecto ha probado ahora **22 países/corredores** de moneda volátil, en crisis, o bajo sanciones a lo largo de todas las rondas (ver tabla completa en la Sección 6). El resultado agregado es sorprendentemente uniforme:

- **Un solo caso** de comparación controlada limpia mismo-proveedor: Western Union, Chile (1.37-1.40%) vs. Argentina (5.12-5.35%).
- **Dos casos** de proveedor "de relleno" único, sin comparación controlada posible (broker/gap-filler): OFX (Egipto/Sri Lanka/Pakistán/México — con margen dependiente del monto) y Skrill (Kenia — margen independiente del monto, confirmado esta ronda).
- **Diecinueve casos** de cobertura cero, con al menos cinco mecanismos regulatorios/estructurales distintos y confirmados de forma independiente: sanciones externas (Venezuela, Rusia), prohibición regulatoria explícita a IMTOs (Nigeria, Ghana), restricción bancaria específica (Líbano), controles de capital de guerra (Ucrania), y colapso institucional por guerra civil (Sudán) — más un grupo de países (Etiopía, Bolivia, Angola, Sierra Leona, Liberia, Surinam, Haití) donde hay crisis cambiaria real pero **no siempre** un mecanismo regulatorio explícito confirmado, y en el caso de Haití, evidencia de que la cobertura cero puede ser un artefacto de la propia plataforma.

**Hipótesis de trabajo (explícitamente no confirmada, para probar en rondas futuras):** el hallazgo Chile/Argentina podría no ser el primero de una familia de casos esperando a ser descubiertos, sino **una anomalía histórica específica de Western Union en América Latina** — una región donde WU construyó redes de agentes durante décadas (con un patrón geopolítico e migratorio particular hacia EEUU y Europa) que no tiene un equivalente directo en África Subsahariana, Europa del Este o Asia Meridional, donde la cobertura de remesas hacia esos orígenes tiende a depender de operadores más nuevos, más pequeños o inexistentes en el comparador de Monito.

**Qué haría falta para probar (o refutar) esta hipótesis:** encontrar un país latinoamericano adicional con moneda volátil y antecedentes de crisis cambiaria donde Western Union efectivamente aparezca en Monito como proveedor de origen. Candidatos aún no probados en el proyecto: Cuba (peso cubano, múltiples tipos de cambio, aunque con sanciones que podrían generar cobertura cero de todas formas), y con matices, otros países ya cubiertos parcialmente. Se sugiere como ítem prioritario del plan de la próxima ronda (Sección 7).

---

## 5. Nota operativa breve: incidente de detección de bots

En medio de esta ronda, tras una secuencia rápida de navegaciones consecutivas, Monito mostró brevemente la página "Max challenge attempts exceeded. Please refresh the page to try again!" — un mecanismo de detección de bots/rate-limiting. Seguí la regla del proyecto de no intentar eludir CAPTCHAs ni mecanismos de detección de bots: no se hizo ningún intento de sortear el desafío; simplemente se esperó (unos 15-20 segundos en total) y el acceso se restableció solo, sin necesidad de intervención. A partir de ese momento se espaciaron las navegaciones con pausas breves entre cada una, y no volvió a ocurrir en el resto de la ronda. Se documenta por transparencia, no porque haya afectado la validez de ningún dato.

---

## 6. Tabla consolidada — 22 países probados en todo el proyecto

*(Resumen; para el detalle completo de cada fila con fuentes y metodología, ver el documento donde se investigó originalmente: v16 para Líbano/Venezuela, v17 para Turquía, v18 para Nigeria/Egipto/Sri Lanka/Pakistán/México-OFX, v19 para Ucrania/Rusia/Ghana/Kenia, este documento (v20) para las ocho filas nuevas.)*

| # | País (origen) | Moneda | Estado en Monito | Dato / margen | Mecanismo o nota |
|---|---|---|---|---|---|
| 1 | Chile | CLP | Cobertura activa | WU: 1.37–1.40% | Baseline de moneda estable-ish |
| 2 | Argentina | ARS | Cobertura activa | WU: 5.12–5.35% | Comparación controlada limpia vs. #1 |
| 3 | México | MXN | Cobertura activa | OFX: 4.04% (6,000 MXN) / 2.5% (30,000 MXN) | Margen dependiente del monto — descarta a OFX como termómetro |
| 4 | Turquía | TRY | Cobertura activa | TransferGo 2.03–2.27% ⚠️contaminado; bancos ~4–4.2%; Wise agregado ~1.2% | Sin comparación controlada (proveedores distintos a Chile/Argentina) |
| 5 | Egipto | EGP | Cobertura activa (solo OFX) | OFX: UK 4.14%, EEUU 7.53%, Italia 7.54% | Descriptivo, no controlado (ver México) |
| 6 | Sri Lanka | LKR | Cobertura activa (solo OFX) | OFX UK: 2.51% | Crisis mayormente resuelta |
| 7 | Pakistán | PKR | Cobertura activa (solo OFX) | OFX UK: 5.13% | Devaluación persistente, sin default formal |
| 8 | Kenia | KES | Cobertura activa (solo Skrill) | Skrill UK: 6.81%; EEUU: 7.4% — **confirmado independiente del monto (v20)** | Sin comparación controlada todavía |
| 9 | Líbano | LBP | Cobertura cero | — | Restricción bancaria BdL, jul. 2025 |
| 10 | Venezuela | VES | Cobertura cero | — | Sanciones OFAC (parcialmente levantadas abr. 2026) |
| 11 | Nigeria | NGN | Cobertura cero | — | Prohibición CBN a IMTOs salientes, ene. 2024 |
| 12 | Ghana | GHS | Cobertura cero | — | Prohibición BoG a IMTOs salientes, ene. 2026 (mismo mecanismo que #11) |
| 13 | Ucrania | UAH | Cobertura cero — **confirmada a monto alto (v20)** | — | Controles de capital de guerra, NBU |
| 14 | Rusia | RUB | Cobertura cero | — | Sanciones occidentales, confirmadas incluso hacia Turquía (no sancionador) |
| 15 | Etiopía | ETB | Cobertura cero (nuevo, v20) | — | Flotación jul. 2024, prima paralela 20–30% |
| 16 | Bolivia | BOB | Cobertura cero (nuevo, v20) | — | Escasez de dólares, brecha oficial/paralelo >50% |
| 17 | Angola | AOA | Cobertura cero (nuevo, v20) | — | Controles informales del BNA, tipo casi fijo desde dic. 2024 |
| 18 | Sierra Leona | SLL | Cobertura cero (nuevo, v20) | — | Sin mecanismo confirmado — posible vacío de cobertura |
| 19 | Liberia | LRD | Cobertura cero (nuevo, v20) | — | Sin mecanismo confirmado — economía dual-moneda (LRD/USD) |
| 20 | Sudán | SDG | Cobertura cero (nuevo, v20) | — | Colapso monetario por guerra civil desde abr. 2023 |
| 21 | Surinam | SRD | Cobertura cero (nuevo, v20) | — | Crisis cambiaria 2021–2023 (mecanismo actual sin investigar) |
| 22 | Haití | HTG | Cobertura cero (nuevo, v20) | — | WU opera en el mundo real — vacío probable de la propia plataforma Monito |

*(Zimbabwe no se incluye en esta tabla: es un caso distinto — la ruta no existe en Monito, 404 real, ni siquiera una página de "cobertura cero" — documentado como curiosidad en v18.)*

---

## 7. Plan sugerido para la próxima ronda

1. **Probar Cuba** (peso cubano/CUP, múltiples tipos de cambio, sanciones parciales de EEUU) como candidato adicional para la hipótesis de la Sección 4.9 (¿Western Union en un país latinoamericano de moneda volátil, más allá de Chile/Argentina?).
2. **Investigar el mecanismo regulatorio de Surinam** en profundidad — quedó pendiente esta ronda por límite de tiempo.
3. **Buscar un cuarto país de África Occidental** con el mismo patrón de prohibición a IMTOs que Nigeria/Ghana, para reforzar (o refutar) la hipótesis de patrón regional — Sierra Leona y Liberia, probados esta ronda, **no** mostraron ese mecanismo, así que la búsqueda sigue abierta con otros candidatos (ej. Gambia, Guinea).
4. **Confirmar Skrill en un tercer corredor de Kenia** (por ejemplo, Kenia→Alemania o Kenia→Canadá) para ver si el margen de ~6.8-7.4% se mantiene estable en más de dos destinos, fortaleciendo el dato como descriptivamente confiable.
5. **Recordatorio de carga a Supabase:** nada de los ocho países nuevos de esta ronda (Etiopía, Bolivia, Angola, Sierra Leona, Liberia, Sudán, Surinam, Haití) tiene datos de proveedores para cargar — son todos cobertura cero. Kenia (Skrill) puede cargarse con mayor confianza que antes, dado que ya no depende de una advertencia de "verificación pendiente".
6. **Uso del método de forzado de monto por URL (Sección 3)** como estándar para todas las verificaciones de monto en rondas futuras, reemplazando el formulario interactivo salvo que sea estrictamente necesario.
7. Sigue en pie la sugerencia (planteada en v18 y v19) de eventualmente consolidar todo el hilo "moneda volátil → margen" en un documento de referencia independiente, ahora con 22 países de base — probablemente el próximo hito natural del proyecto una vez que se agote razonablemente la búsqueda de nuevos países candidatos.


---

## research-findings-2026-09-03-v21-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #15 (v21) — Cuba no ayuda a probar la hipótesis de v20; Gambia y Guinea debilitan aún más el "patrón regional" de África Occidental; Skrill aporta un tercer corredor con un matiz importante sobre frescura de datos

> **Documento nuevo, ahora en su segunda ronda.** No reemplaza a v6 – v20; los complementa. v20 (`research-findings-2026-09-03-v20-addendum.md`) ya fue descargado por el usuario; este mismo archivo (v21) sigue actualizándose por indicación explícita del usuario ("continua en este mismo archivo"), en vez de generar v22.
>
> **Contexto para quien cargue este archivo a Supabase — ACTUALIZADO en la segunda ronda:** la primera ronda de este archivo (Secciones 1-4) no aportó datos cargables. **La segunda ronda sí aporta datos nuevos y potencialmente cargables**: se descubrió **Mukuru** como un segundo proveedor real en varios corredores de Kenia (más barato que Skrill en los tres destinos probados) y, más importante, en **Sudáfrica→Reino Unido** con un margen mucho más bajo (1.29%). Ver Secciones 5-7 para el detalle completo antes de cargar nada — hay una advertencia metodológica importante sobre por qué estos datos aparecieron recién ahora y no en rondas anteriores.

## 0. Resumen de esta ronda

- **Cuba se probó como candidato para la hipótesis "Western Union es una anomalía latinoamericana" de v20** — pero el resultado no es informativo: Cuba tiene cobertura cero tanto hacia EEUU como hacia España, lo cual es totalmente explicable por el embargo estadounidense y las sanciones asociadas, sin relación con la hipótesis de "cobertura de mercado de WU en Latinoamérica". Cuba queda descartado como caso de prueba útil; hace falta un candidato latinoamericano con crisis cambiaria pero **sin** un régimen de sanciones que confunda la lectura.
- **Surinam ya tiene mecanismo documentado**: flotación desde junio de 2021 (devaluación del 33%), inflación bajando de 60.7% (2021) a ~11.1% (proyectado 2025), sin controles de cambio formales identificados — mismo patrón "sin mecanismo regulatorio confirmado" que Sierra Leona, Liberia y Angola.
- **Gambia y Guinea, dos nuevos países de África Occidental probados, ambos cobertura cero, ninguno con un mecanismo tipo Nigeria/Ghana confirmado** — Guinea tiene un comunicado del banco central dirigido a los establecimientos de transferencia de dinero cuyo contenido no pudo verificarse esta ronda (posible pista, no confirmada). Con esto, van **cuatro** países de África Occidental probados (Sierra Leona, Liberia, Gambia, Guinea) sin encontrar el mecanismo de Nigeria/Ghana en ninguno — la hipótesis de "patrón regional" queda considerablemente debilitada.
- **Skrill aporta un tercer corredor (Kenia→Alemania): margen de 5.76%** a 50,000 KES — algo más bajo que Reino Unido (6.81%) y EEUU (7.4%), pero dentro del mismo orden de magnitud. Al repetir la prueba de independencia de monto en este corredor, el margen bajó a 5.35% a 1,000,000 KES — **pero con una salvedad importante**: los "resultados actualizados" de Monito para ese monto tenían un mes de antigüedad, contra 16 horas para el monto menor, así que la diferencia podría deberse a datos desactualizados y no a una verdadera dependencia del monto. Ver Sección 4 para el detalle y la recomendación de no sacar conclusiones todavía.
- Tabla consolidada actualizada a **25 países**.

### Segunda ronda del mismo día (continuación en este archivo, sin crear v22)

- **Hallazgo mayor: Mukuru aparece como segundo proveedor real en Kenia**, invisible en las consultas de rondas anteriores porque solo se mostraba en ciertos montos ("buckets") con datos en vivo — no en el monto por defecto ni en montos muy altos, que muestran datos en caché. Mukuru es **más barato que Skrill** en los tres corredores de Kenia probados (Reino Unido 4.01% vs. 6.84%; Alemania 2.51% vs. 5.38%; EEUU 4.35% vs. 7.43%).
- **Posible segunda comparación controlada mismo-proveedor**, distinta a Western Union Chile/Argentina: Mukuru en **Sudáfrica→Reino Unido muestra un margen de apenas 1.29%**, muy por debajo de su margen en Kenia→Reino Unido (4.01%) — el mismo patrón cualitativo que "moneda más estable → margen más bajo", ahora con un segundo proveedor. Ver Sección 6.
- **Advertencia metodológica importante**: el hecho de que Mukuru estuviera "escondido" en ciertos montos y visible en otros significa que el método de "confirmar cobertura cero en dos montos (bajo y alto)" usado en rondas anteriores **podría no ser suficiente** para descartar la presencia de un proveedor. Se hizo una prueba de estrés con 5 montos distintos en Haití y 3 en Etiopía — ambos se mantuvieron en cobertura cero en todos los montos probados, lo cual **no invalida** esos hallazgos anteriores, pero sí obliga a matizar la confianza en los países de cobertura cero que no fueron sometidos a esta prueba más exhaustiva. Ver Sección 7.

---

## 1. Cuba (CUP): un candidato que no sirve para probar la hipótesis de v20

### 1.1 Qué se buscaba

v20 planteó la hipótesis de que el hallazgo de Western Union en Chile/Argentina podría ser una anomalía específica de la presencia histórica de WU en América Latina, y sugirió Cuba como primer candidato a probar (moneda con múltiples tipos de cambio, sanciones parciales).

### 1.2 Resultado

| Corredor | Monto | Resultado |
|---|---|---|
| Cuba → EEUU (CUP → USD) | 1,000 CUP (default) y 500,000 CUP | Cobertura cero en ambos |
| Cuba → España (CUP → EUR) | 1,000 CUP (default) | Cobertura cero |

El tipo de cambio de referencia que usa Monito (1 CUP = 0.0417 USD) corresponde aproximadamente al tipo de cambio oficial/bancario cubano, muy distinto del tipo de cambio informal real (que en 2026 ronda varias veces ese valor) — una discrepancia interesante en sí misma, pero no el foco de esta prueba.

### 1.3 Por qué este resultado no es informativo para la hipótesis de v20

La cobertura cero de Cuba es completamente explicable por el embargo estadounidense de larga data y las sanciones asociadas — un mecanismo ya bien establecido y no específico de esta investigación. Que la cobertura sea cero también **hacia España** (fuera del régimen de sanciones directas de EEUU) sugiere que el efecto se extiende más allá del embargo bilateral, probablemente por el riesgo de sanciones secundarias que disuade a proveedores globales de operar en Cuba en general, independientemente del destino. En cualquier caso, este mecanismo es tan dominante que **no permite aislar** si la ausencia de Western Union se debe a la volatilidad/crisis de la moneda cubana o simplemente al embargo — Cuba queda descartado como caso de prueba útil para la hipótesis.

### 1.4 Implicación para la próxima ronda

Hace falta un candidato latinoamericano con antecedentes de crisis cambiaria real, pero **sin** un régimen de sanciones internacionales que confunda la lectura. Ningún candidato obvio surgió esta ronda — se marca como pendiente de identificar en el plan (Sección 6).

---

## 2. Surinam (SRD): mecanismo cerrado

### 2.1 Contexto

v20 documentó cobertura cero para Surinam→Países Bajos pero dejó pendiente investigar el mecanismo regulatorio específico.

### 2.2 Hallazgos

Entre 2020 y 2021, Surinam atravesó una crisis severa: inflación del 60.7% tanto en 2020 como en 2021, y una contracción del PBI del -15.9% (2020) y -2.7% (2021). En junio de 2021, el banco central devaluó el dólar surinamés (SRD) un 33% y anunció que la moneda flotaría libremente, abandonando el régimen de tipo fijo que había agotado las reservas internacionales del país. Para junio de 2022, el tipo de cambio oficial ya reflejaba el tipo de cambio flotante real.

Desde entonces, la inflación bajó de forma sostenida: 54.6% (2022), 28.2% (2023), 15.1% (2024), y una proyección de 11.1% para 2025 — una recuperación notable, aunque la inflación sigue muy por encima de niveles pre-crisis.

**No se encontró documentación de controles de cambio formales vigentes** — es decir, Surinam entra en la misma categoría que Sierra Leona, Liberia y Angola: crisis cambiaria real y bien documentada, pero sin una normativa específica y fechada que prohíba las remesas salientes como sí existe para Nigeria y Ghana. La cobertura cero de Monito podría deberse simplemente a que ningún IMTO importante ha considerado que valga la pena operar el corredor SRD, dado el tamaño reducido del mercado surinamés (menos de 650,000 habitantes).

Fuente: [Economy of Suriname — Wikipedia](https://en.wikipedia.org/wiki/Economy_of_Suriname)

---

## 3. Gambia y Guinea: la búsqueda del "patrón regional" de África Occidental se debilita más

### 3.1 Contexto

v20 dejó como plan probar un cuarto país de África Occidental (después de que Sierra Leona y Liberia no mostraran el mecanismo de Nigeria/Ghana) para intentar confirmar o refutar la hipótesis de un patrón regional de prohibición a IMTOs.

### 3.2 Gambia (GMD)

**Corredor probado:** Gambia → Reino Unido (GMD → GBP). Cobertura cero al monto por defecto (mínimo sugerido 14,800 GMD) y confirmada a 500,000 GMD.

**Búsqueda de mecanismo:** no se encontró ninguna directiva del Banco Central de Gambia equivalente a la de Nigeria/Ghana. Los resultados de búsqueda relevantes se referían mayormente a Nigeria (contaminación de palabras clave), no a Gambia específicamente.

### 3.3 Guinea (GNF)

**Corredor probado:** Guinea → Francia (GNF → EUR, elegido por la fuerte diáspora guineana en Francia). Cobertura cero al monto por defecto (mínimo sugerido 1,758,200 GNF) y confirmada a 20,000,000 GNF.

**Búsqueda de mecanismo:** se encontró un "Communiqué à l'attention des Établissements de Transfert d'argent en République de Guinée" (Comunicado dirigido a los Establecimientos de Transferencia de Dinero en la República de Guinea) publicado por el banco central (BCRG). **No se pudo acceder al contenido del documento** (el enlace de descarga no fue accesible mediante las herramientas de esta ronda) — así que no se puede confirmar si se trata de una restricción tipo Nigeria/Ghana, un requisito administrativo sin relación con esto, o algo distinto. Se marca explícitamente como **pista no confirmada**, no como hallazgo.

### 3.4 Balance acumulado del "patrón regional"

Con Gambia y Guinea sumados a Sierra Leona y Liberia (v20), van **cuatro** países de África Occidental probados con cobertura cero en Monito, y en **ninguno de los cuatro** se confirmó un mecanismo regulatorio explícito equivalente al de Nigeria (CBN, enero 2024) o Ghana (BoG, enero 2026). Esto debilita considerablemente la hipótesis planteada en v19 de que el mecanismo de Nigeria/Ghana pudiera ser un patrón regional emergente en África Occidental — hasta ahora, parece ser un mecanismo específico de esos dos países, no una tendencia regional. La única pista pendiente de confirmar es el comunicado del BCRG en Guinea, que requeriría acceder al PDF directamente (posible tarea para una próxima ronda si se dispone de mejores herramientas de descarga).

---

## 4. Skrill: tercer corredor (Kenia → Alemania) y una advertencia sobre frescura de datos

### 4.1 Resultado al monto por defecto

| Corredor | Monto | Proveedor | Tarifa | Tipo de cambio | Margen | "Resultados actualizados" |
|---|---|---|---|---|---|---|
| Kenia → Alemania (KES → EUR) | 50,000 KES | Skrill | 2,381.00 KES | 0.006288 | **5.76%** | hace 16 horas |

Este es el tercer corredor de Skrill documentado para el proyecto (después de Reino Unido, 6.81%, y EEUU, 7.4%, ambos en v19/v20). El margen de Alemania es algo más bajo, pero se mantiene en el mismo orden de magnitud general (5.76%-7.4%).

### 4.2 Repetición de la prueba de independencia de monto — resultado con salvedad

| Monto | Tarifa | Tipo de cambio | Margen | "Resultados actualizados" |
|---|---|---|---|---|
| 50,000 KES | 2,381.00 KES | 0.006288 | 5.76% | hace 16 horas |
| 1,000,000 KES | 47,619.00 KES | 0.006419 | **5.35%** | **hace 1 mes** |

A diferencia de los corredores de Reino Unido y EEUU (donde el margen fue idéntico en ambos montos probados, con datos igualmente frescos en ambos casos), este corredor mostró una diferencia de 0.41 puntos porcentuales entre los dos montos. **Pero la comparación no es limpia**: el resultado al monto mayor está basado en datos que Monito marca como actualizados hace un mes, mientras que el del monto menor tiene apenas 16 horas de antigüedad. El tipo de cambio de mercado (mid-market) también puede haberse movido en ese lapso, lo cual por sí solo podría explicar buena parte de la diferencia de margen sin que exista ninguna dependencia real del monto.

**Conclusión:** este resultado es **inconcluso**, no una refutación del hallazgo de independencia de monto de v20. Se necesita repetir esta prueba específica con dos consultas hechas en la misma sesión y verificando que ambas tengan el mismo timestamp de "resultados actualizados" antes de sacar cualquier conclusión. Se dejó como ítem del plan (Sección 6) en lugar de forzar una lectura prematura — coherente con la lección aprendida en v18 con OFX, donde apurar una conclusión tuvo que corregirse después.

---

## 5. Repetición limpia de la prueba de monto (Kenia→Alemania) y el descubrimiento de Mukuru

### 5.1 Metodología

Para resolver la ambigüedad de frescura de datos señalada en la Sección 4, se repitieron las dos consultas (50,000 KES y 1,000,000 KES) y, al ver que el problema persistía, se probaron montos intermedios adicionales (100,000, 200,000 KES) para intentar aislar en qué punto cambiaba el comportamiento.

### 5.2 Resultado — Kenia → Alemania, cuatro montos

| Monto | Proveedor(es) mostrados | Margen | "Resultados actualizados" |
|---|---|---|---|
| 50,000 KES | Skrill (único) | 5.76% | hace 16 horas |
| 100,000 KES | Skrill (único) | 5.2% | **hace 5 días** |
| 200,000 KES | **Skrill + Mukuru** | Skrill 5.38%; **Mukuru 2.51% (fee FREE)** | **hace 12 segundos** |
| 1,000,000 KES | Skrill (único) | 5.35% | hace 1 mes |

### 5.3 El hallazgo

A 200,000 KES, Monito muestra **dos** proveedores en vez de uno: Skrill (que ya conocíamos) y **Mukuru** — un proveedor sudafricano de transferencias con presencia histórica fuerte en el sur y el este de África (ya identificado en la taxonomía de proveedores de rondas anteriores a este documento como "margen alto/variable confirmado" junto a Xoom, Lulu Money, Taptap Send y Sendwave). En este corredor específico, sin embargo, Mukuru resultó **más barato** que Skrill, no más caro — con tarifa cero y un margen de 2.51% contra el 5.38-5.76% de Skrill.

Crucialmente, la marca de tiempo "resultados actualizados hace 12 segundos" en el monto de 200,000 KES —muy distinta de los "5 días" o "1 mes" de los otros montos— sugiere que Monito solo hace una consulta **en vivo** a sus proveedores cuando el monto solicitado coincide con uno de los "buckets" que consulta con más frecuencia (probablemente montos redondos que los usuarios reales piden más seguido), y sirve una copia en caché, potencialmente desactualizada, para el resto. Eso explicaría por qué Mukuru no apareció en ninguna de las consultas anteriores del proyecto en Kenia (siempre se usaron el monto por defecto o un monto muy alto, nunca un valor redondo intermedio como 200,000).

### 5.4 Confirmación en los otros dos corredores de Kenia

| Corredor | Monto | Proveedores | Margen Mukuru | Margen Skrill | Frescura |
|---|---|---|---|---|---|
| Kenia → Reino Unido | 200,000 KES | Skrill + Mukuru | **4.01%** (fee FREE) | 6.84% | hace 8 segundos |
| Kenia → EEUU | 200,000 KES | Skrill (único) | — | 7.49% | hace 22 horas |
| Kenia → EEUU | 300,000 KES | Skrill + Mukuru | **4.35%** (fee FREE) | 7.43% | hace 2 meses |

Mukuru aparece en los tres corredores de Kenia (Reino Unido, Alemania, EEUU), siempre con un margen mejor que Skrill, aunque el monto exacto en el que aparece varía por corredor (200,000 KES para Reino Unido y Alemania; 300,000 KES, no 200,000, para EEUU). Esto confirma que Mukuru es un proveedor real y activo para Kenia, no una anomalía puntual — simplemente estaba fuera del alcance de la metodología de "monto por defecto + un monto alto" usada hasta ahora.

---

## 6. Segunda comparación controlada mismo-proveedor: Mukuru, Sudáfrica vs. Kenia

### 6.1 Por qué esto importa

Desde el hallazgo original de Western Union en Chile (1.37-1.40%) vs. Argentina (5.12-5.35%) — documentado hace varias rondas — el proyecto no había vuelto a encontrar una segunda comparación controlada limpia (mismo proveedor, mismo tipo de corredor, origen con moneda más estable vs. origen con moneda más volátil) pese a probar 25 países. Con el descubrimiento de Mukuru, apareció una segunda oportunidad.

### 6.2 El experimento

Se probó Mukuru en **Sudáfrica → Reino Unido** (ZAR → GBP) al mismo monto redondo (200,000, en este caso ZAR) que reveló a Mukuru en los corredores de Kenia.

| País (origen) | Corredor | Monto | Proveedor | Margen | Fee |
|---|---|---|---|---|---|
| Sudáfrica | → Reino Unido | 200,000 ZAR | Mukuru | **1.29%** | 850.00 ZAR |
| Kenia | → Reino Unido | 200,000 KES | Mukuru | **4.01%** | FREE |

### 6.3 Interpretación — con matices

El patrón cualitativo es el mismo que Chile/Argentina: el origen de moneda más estable (rand sudafricano, una de las monedas emergentes más líquidas y transadas de África, con un mercado cambiario profundo) muestra un margen de Mukuru notablemente más bajo que el origen de moneda más volátil (chelín keniano). Esto es consistente con la hipótesis central del proyecto.

**Pero hay matices importantes que impiden llamarlo, todavía, tan limpio como el caso Chile/Argentina:**

1. **Solo un monto probado por país** — no se repitió la prueba de independencia de monto para el lado sudafricano (algo que sí se hizo, aunque de forma imperfecta, en Kenia). No se puede descartar todavía que el margen de Mukuru en Sudáfrica varíe con el monto.
2. **La comparación de volatilidad entre ZAR y KES es más débil que entre CLP y ARS**: el rand sudafricano, si bien es una moneda emergente con cierta volatilidad, no tiene una historia de crisis cambiaria ni de inflación descontrolada comparable a la de Argentina — es una diferencia de grado, no de categoría, a diferencia del contraste Chile/Argentina.
3. **Sudáfrica tiene un mercado de remesas mucho más desarrollado en general** (6 proveedores comparados en Monito, contra 1-2 para Kenia), lo cual podría reflejar economías de escala y competencia, no solo estabilidad cambiaria per se, como explicación alternativa del margen más bajo.

### 6.4 Conclusión

Este es un hallazgo **prometedor pero preliminar** — la segunda pista más sólida encontrada hasta ahora hacia una comparación controlada adicional, después de 25 países probados sin éxito equivalente. Se recomienda como prioridad de la próxima ronda: probar Mukuru en un tercer país (idealmente uno con moneda claramente más volátil que Kenia, como Zimbabwe o Mozambique, si Monito los cubre) y repetir la prueba de independencia de monto en Sudáfrica, antes de afirmar que esto iguala en solidez al hallazgo de Chile/Argentina.

---

## 7. Advertencia metodológica: visibilidad de proveedores por "bucket" de monto

### 7.1 El riesgo que este hallazgo expone

Si Mukuru estuvo "invisible" en Kenia durante toda la investigación del proyecto (varias rondas, múltiples corredores) simplemente porque nunca se probó el monto "correcto", existe el riesgo de que **algunos de los 19+ países marcados como "cobertura cero" en este proyecto en realidad tengan un proveedor visible solo en un monto específico no probado**. Esto matiza — sin necesariamente invalidar — buena parte del trabajo de las rondas anteriores.

### 7.2 Prueba de estrés aplicada esta ronda

Para evaluar qué tan extendido podría ser este riesgo, se sometieron dos países ya marcados como "cobertura cero sin mecanismo regulatorio confirmado" (los candidatos más susceptibles a ser en realidad "vacíos de cobertura" según la Sección 4.8-4.9 de v20) a una prueba con más montos de los habituales:

**Haití → EEUU (HTG → USD):** probado en 1,000 (default), 26,200 (mínimo sugerido, implícito), 50,000, 100,000, 200,000 y 500,000 HTG — **cobertura cero en los seis montos**.

**Etiopía → EEUU (ETB → USD):** probado en 1,000 (default), 32,300 (mínimo sugerido, implícito), 200,000 y 500,000 ETB — **cobertura cero en los cuatro montos**.

### 7.3 Interpretación

Estos dos países **superaron** la prueba de estrés: a diferencia de Kenia, no mostraron ningún proveedor oculto en montos intermedios. Esto es evidencia (aunque no prueba definitiva — no se probaron todos los montos posibles) de que la cobertura cero de Haití y Etiopía es genuina y no un artefacto de metodología. Combinado con el hecho de que ninguno de los dos mostró nunca el patrón de "resultados actualizados hace pocos segundos" que sí mostró Kenia en su monto revelador, es razonable mantener la confianza en esos dos hallazgos específicos.

**Sin embargo**, los demás países de "cobertura cero sin mecanismo confirmado" del proyecto (Sierra Leona, Liberia, Angola, Surinam, Gambia, Guinea) **no fueron sometidos a esta prueba de estrés todavía** — solo se probaron en dos montos cada uno (bajo y alto), el mismo patrón que en Kenia no habría revelado a Mukuru. Se recomienda, como tarea de fondo para futuras rondas (no necesariamente urgente, dado el volumen de trabajo pendiente), volver a probar esos seis países con 3-4 montos intermedios adicionales antes de tratar sus hallazgos de "cobertura cero" como definitivos.

### 7.4 Alcance de esta advertencia

Es importante no sobre-corregir: los países con un **mecanismo regulatorio explícito y fechado** (Nigeria, Ghana, Líbano, Venezuela, Ucrania, Rusia, Cuba, Sudán) tienen una explicación causal independiente de la disponibilidad de datos de Monito — un bloqueo normativo o un colapso institucional no se revierte por probar un monto distinto. La advertencia de esta sección aplica específicamente a los países donde la única evidencia de "cobertura cero" es la ausencia de resultados en Monito, sin una causa estructural confirmada por otra fuente.

---

## 8. Tabla consolidada — 25 países

*(Solo se listan los tres países nuevos de esta ronda; para las 22 filas anteriores ver la Sección 6 de v20.)*

| # | País (origen) | Moneda | Estado en Monito | Dato / margen | Mecanismo o nota |
|---|---|---|---|---|---|
| 23 | Cuba | CUP | Cobertura cero (nuevo, v21) | — | Embargo de EEUU + riesgo de sanciones secundarias; no sirve para probar la hipótesis de v20 |
| 24 | Gambia | GMD | Cobertura cero (nuevo, v21) | — | Sin mecanismo confirmado |
| 25 | Guinea | GNF | Cobertura cero (nuevo, v21) | — | Comunicado del BCRG existente pero contenido no verificado — pista abierta |

*(Kenia ya estaba en la tabla desde v19/v20; esta ronda agrega un tercer corredor de Skrill — Alemania, 5.76% — y un segundo proveedor, Mukuru, en los tres corredores existentes, a la fila ya existente, no como filas nuevas. Sudáfrica es país nuevo — ver abajo.)*

| # | País (origen) | Moneda | Estado en Monito | Dato / margen | Mecanismo o nota |
|---|---|---|---|---|---|
| 26 | Sudáfrica | ZAR | Cobertura activa (nuevo, v21 2ª ronda) | Mukuru: 1.29% (200,000 ZAR); 6 proveedores en total, mejor: ~0.79% | Mercado de remesas desarrollado; posible segunda pata de comparación controlada con Kenia (ver Sección 6) |

**Actualización de la fila de Kenia:** Skrill UK 6.81-6.84%, Alemania 5.2-5.76%, EEUU 7.4-7.49% (varía levemente por monto/frescura de caché — ver Sección 5); **Mukuru (nuevo): UK 4.01%, Alemania 2.51%, EEUU 4.35%** — Mukuru es consistentemente más barato que Skrill en Kenia, y ambos matizados por el hallazgo de "buckets" de monto de la Sección 5.

---

## 9. Plan sugerido para la próxima ronda

1. ~~Repetir limpiamente la prueba de independencia de monto en Kenia→Alemania~~ — **hecho esta ronda** (Sección 5); reveló algo más importante que lo buscado (Mukuru), y la pregunta original de independencia de monto para Skrill específicamente sigue sin resolverse de forma limpia (los montos que muestran datos frescos ahora incluyen a Mukuru, complicando la comparación directa Skrill-contra-Skrill).
2. **Prioridad más alta: probar Mukuru en un tercer país** para reforzar la comparación controlada de la Sección 6 — idealmente uno con moneda claramente más volátil que Kenia. Candidatos a verificar si Monito los cubre para Mukuru: Mozambique (metical), Malawi (kwacha, devaluación fuerte en noviembre 2023), Zambia (kwacha).
3. **Repetir la prueba de independencia de monto para Mukuru en Sudáfrica** (probar al menos un segundo monto redondo, ej. 500,000 o 1,000,000 ZAR) antes de tratar el 1.29% como comparable en solidez al 6.81% de Kenia.
4. **Aplicar la prueba de estrés de montos múltiples (Sección 7) a los seis países de "cobertura cero sin mecanismo confirmado" restantes**: Sierra Leona, Liberia, Angola, Surinam, Gambia, Guinea — probar 3-4 montos redondos intermedios (100,000; 200,000; 300,000; 500,000, ajustados a la escala de cada moneda) en cada uno, no solo el monto por defecto y uno alto.
5. ~~Encontrar un candidato latinoamericano mejor que Cuba~~ — sigue pendiente, sin candidato identificado todavía.
6. ~~Intentar acceder al contenido del comunicado del BCRG (Guinea)~~ — sigue pendiente, el PDF no fue accesible esta ronda.
7. **Recordatorio de carga a Supabase:** el dato de Mukuru en Sudáfrica→Reino Unido (1.29%, 200,000 ZAR) y en los tres corredores de Kenia (4.01%/2.51%/4.35%) son los primeros candidatos sólidos a cargar de esta ronda — release con la advertencia de la Sección 7 de que el monto importa mucho para saber si un proveedor aparece o no. El dato de Skrill Kenia→Alemania sigue con la misma cautela de rondas anteriores sobre frescura de datos.
8. Sigue en pie la sugerencia de consolidar el hilo completo en un documento de referencia independiente una vez que la búsqueda de países candidatos se agote razonablemente — con el hallazgo de Mukuru, ese documento debería incluir ahora una sección propia sobre "visibilidad de proveedores por monto", no solo el hilo de moneda volátil.


---

## research-findings-2026-09-03-v22-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #16 (v22) — Zambia confirma a Mukuru como segundo instrumento de comparación controlada limpio: Sudáfrica (1.29%), Kenia (4.01%) y Zambia (4.25%), los tres al mismo monto y mismo destino

> **Documento nuevo, ahora en su segunda ronda.** No reemplaza a v6 – v21; los complementa. v21 fue descargado; este archivo (v22) sigue actualizándose por indicación explícita del usuario ("continuar y actualizar este mismo archivo"), en vez de generar v23.
>
> **Contexto para quien cargue este archivo a Supabase — ACTUALIZADO en la segunda ronda:** la primera ronda (Secciones 1-6) ya dejó el conjunto de datos de Mukuru en Sudáfrica/Kenia/Zambia. **La segunda ronda agrega Botswana como cuarto país de Mukuru** — con el margen más bajo de todo el hilo (0.37% a Reino Unido) — y localiza con precisión el punto donde el margen de Sudáfrica cambia de nivel (entre 200,000 y 300,000 ZAR). También cierra por completo el programa de "prueba de estrés de montos redondos": los diez países de cobertura cero sin mecanismo regulatorio confirmado (Haití, Etiopía, Angola, Sierra Leona, Liberia, Surinam, Gambia, Guinea, más Mozambique y Malaui de la ronda anterior) ya pasaron la prueba — ninguno reveló un proveedor oculto. Ver Secciones 7-9 antes de cargar nada nuevo.

## 0. Resumen de esta ronda

- **Zambia se suma como tercer país con Mukuru**, y es el más limpio de los tres: el margen se mantuvo en 4.24-4.26% en tres montos muy distintos (1,000 ZMW, 200,000 ZMW y 2,000,000 ZMW), todos con datos "en vivo" (segundos a minutos de antigüedad) — la confirmación de independencia de monto más sólida que ha tenido cualquier proveedor en todo el proyecto, incluyendo a Skrill.
- **Comparación de tres vías al mismo monto y mismo destino (200,000 unidades de moneda local → Reino Unido, vía Mukuru)**: Sudáfrica 1.29%, Kenia 4.01%, Zambia 4.25%. Es la evidencia más fuerte encontrada hasta ahora, después de Chile/Argentina con Western Union, de que el margen de un mismo proveedor escala con algo relacionado al origen — aunque con las salvedades de la Sección 2.
- **Pero Sudáfrica reveló una complicación**: a un monto mucho mayor (1,000,000 ZAR), el margen de Mukuru en Sudáfrica subió de 1.29% a 2.7% — y además cambió de "modalidad" de producto (de transferencia bancaria a un producto "vía bróker"). Esto significa que, a diferencia de Zambia, **el dato de Sudáfrica sí depende del monto**, lo cual complica usar el 1.29% como el número representativo sin más contexto.
- **Mozambique, Malaui y Nicaragua se suman a la lista de cobertura cero** — Mozambique y Malaui probados en múltiples corredores con el monto "revelador" de 200,000 (que sí funcionó para Kenia y Zambia) y aun así cobertura cero, lo cual es un dato en sí mismo: no todos los países vecinos de Sudáfrica tienen a Mukuru en Monito. Nicaragua se probó como candidato para la hipótesis de "Western Union en Latinoamérica" de v20, pero también cobertura cero — y sigue sin encontrarse un buen candidato latinoamericano para esa hipótesis específica.
- **Angola y Sierra Leona pasaron la prueba de estrés de montos redondos** (200,000 AOA y 5,000,000 SLL, respectivamente — los "montos reveladores" que sí funcionaron en Kenia/Zambia) y se mantuvieron en cobertura cero, reforzando la confianza en esos dos hallazgos previos.
- **El comunicado del BCRG (Guinea) sigue sin poder verificarse** — se intentó de nuevo con un documento regulatorio más general del banco central, sin encontrar ninguna restricción específica a IMTOs.
- Tabla consolidada actualizada a **28 países** en esta primera ronda (25 de v21 + Mozambique, Malaui, Nicaragua; Zambia y Sudáfrica ya estaban listados desde v21) — **actualizada de nuevo a 31 en la segunda ronda, al sumarse Botsuana** (ver Sección 10).

### Segunda ronda del mismo día (continuación en este archivo, sin crear v23)

- **Botswana se suma como cuarto país de Mukuru — y con el margen más bajo registrado en todo el hilo**: 0.37% en Botswana→Reino Unido (200,000 BWP), por debajo incluso de Sudáfrica (1.29%). Es un resultado que complica la lectura simple de "moneda volátil → margen alto": el pula botsuano es, históricamente, una de las monedas más estables de África, y aun así el margen fue el más bajo de los cuatro países.
- **Se localizó con precisión el punto de quiebre del margen de Sudáfrica**: 1.29% a 200,000 ZAR, mismo nivel bajo a... en realidad ya sube a 2.55% a 300,000 ZAR, y se estabiliza en ~2.7% a 500,000 y 1,000,000 ZAR. El quiebre ocurre entre 200,000 y 300,000 ZAR — no entre 500,000 y 1,000,000 como se pensaba al cierre de la primera ronda.
- **Corrección importante sobre Kenia→Reino Unido a 1,000,000 KES**: el resultado que en la primera ronda de este archivo se habría asumido como Skrill en realidad, al verificarlo con el enlace de identidad del proveedor, es **Mukuru** (margen 5.92%) — Skrill no aparece como resultado visible a ese monto. Esto refuerza, una vez más, que la identidad del proveedor debe verificarse siempre con el enlace `go.monito.com/<proveedor>`, nunca asumirse por continuidad con consultas anteriores.
- **Los diez países de "cobertura cero sin mecanismo confirmado" ya completaron la prueba de estrés de montos redondos**: se sumaron esta ronda Liberia, Surinam, Gambia y Guinea (los cuatro que quedaban pendientes) — los diez se mantuvieron en cobertura cero. Este programa de verificación queda cerrado.

---

## 1. Zambia: el tercer país de Mukuru, y el más limpio metodológicamente

### 1.1 Descubrimiento

Siguiendo el patrón aprendido en v21 (Mukuru aparece en "montos redondos" con datos en vivo, no en el monto por defecto ni en montos extremos), se probó Zambia → Reino Unido (ZMW → GBP) al monto de 200,000 ZMW — el mismo tipo de monto que reveló a Mukuru en Kenia.

### 1.2 Resultado — tres montos, margen prácticamente idéntico

| Monto | Fee | Tipo de cambio | Margen | "Resultados actualizados" |
|---|---|---|---|---|
| 1,000 ZMW (default) | 48.00 ZMW | 0.037039 | **4.26%** | hace 29 minutos |
| 200,000 ZMW | 9,524.00 ZMW | 0.037039 | **4.25%** | hace 9-12 segundos |
| 2,000,000 ZMW | 95,238.00 ZMW | 0.037039 | **4.24%** | hace 10 segundos |

El tipo de cambio aplicado es **exactamente el mismo** (0.037039) en los tres montos, y el margen varía solo en la segunda cifra decimal — una diferencia perfectamente explicable por redondeo de la tarifa fija, no por un cambio real en la política de precios de Mukuru. Esta es la confirmación de independencia de monto **más limpia** que ha tenido cualquier proveedor en todo el proyecto: a diferencia de la prueba de Skrill en Kenia→Alemania (v21, confundida por diferencias de frescura de caché) o de la propia Sudáfrica en este mismo documento (Sección 2), aquí los tres montos tienen datos frescos o casi frescos, eliminando la principal fuente de ambigüedad de rondas anteriores.

### 1.3 Segundo corredor — Zambia → EEUU

| Monto | Proveedor | Margen | Frescura |
|---|---|---|---|
| 200,000 ZMW | Mukuru | **3.08%** | hace 10 segundos |

Un margen más bajo que el corredor a Reino Unido (4.25%), consistente con el patrón ya visto en Kenia (donde Reino Unido, Alemania y EEUU también mostraron márgenes distintos entre sí para el mismo proveedor) — el margen de Mukuru varía por corredor de destino, no solo por país de origen.

### 1.4 Contexto de volatilidad de la moneda zambiana

Zambia entró en default de su deuda soberana en noviembbre de 2020 — el primer país africano en hacerlo durante la pandemia — y pasó varios años en un proceso de reestructuración de deuda bajo el Marco Común del G20, con un programa del FMI desde agosto de 2022. El kwacha zambiano (ZMW) sufrió depreciaciones significativas durante ese período, aunque se ha estabilizado parcialmente desde entonces con el apoyo del programa del FMI. Es una moneda con antecedentes de crisis real, aunque no al nivel de Argentina o Turquía.

---

## 2. Comparación de tres vías: Sudáfrica, Kenia y Zambia al mismo monto — con una complicación importante

### 2.1 La tabla central de esta ronda

Al mismo monto nominal (200,000 unidades de moneda local) y al mismo destino (Reino Unido), vía el mismo proveedor (Mukuru):

| País (origen) | Moneda | Monto | Fee | Margen | Frescura |
|---|---|---|---|---|---|
| Sudáfrica | ZAR | 200,000 | 850.00 ZAR | **1.29%** | hace 12 días |
| Kenia | KES | 200,000 | FREE | **4.01%** | hace 8 segundos |
| Zambia | ZMW | 200,000 | 9,524.00 ZMW | **4.25%** | hace 9 segundos |

El patrón cualitativo es consistente con la hipótesis central del proyecto: el origen con el mercado financiero más desarrollado y la moneda de mayor liquidez internacional (rand sudafricano) tiene el margen más bajo, y los dos orígenes con antecedentes más marcados de inestabilidad (chelín keniano, kwacha zambiano) tienen márgenes muy similares entre sí y notablemente más altos.

### 2.2 La complicación: Sudáfrica sí depende del monto

Al repetir la prueba en Sudáfrica con un monto mucho mayor (1,000,000 ZAR en vez de 200,000 ZAR):

| Monto | Fee | Margen | Modalidad de producto | Frescura |
|---|---|---|---|---|
| 200,000 ZAR | 850.00 ZAR | 1.29% | Transferencia bancaria (`po=bank`) | hace 12 días |
| 1,000,000 ZAR | 850.00 ZAR | **2.7%** | Vía bróker (`po=broker`) | hace 12 horas |

La tarifa fija (850 ZAR) se mantuvo igual, pero el **tipo de cambio aplicado empeoró** (de 0.045171 a 0.044946 GBP por ZAR), y — dato importante — Monito etiquetó el resultado con un identificador de modalidad de producto distinto (`po=broker` en vez de `po=bank`), sugiriendo que a partir de cierto monto Mukuru factura la transferencia como un producto de tipo "bróker de cambio" en lugar de "transferencia bancaria" — posiblemente un producto interno distinto con una estructura de precios propia, no simplemente el mismo producto con un descuento o recargo por volumen.

### 2.3 Cómo interpretar esto honestamente

**No se puede repetir el mismo error que ya se cometió una vez con OFX (v18) y evitó repetirse con Skrill (v20)**: no alcanza con dos montos para afirmar una conclusión sobre dependencia de monto. Lo que sí se puede decir con los datos disponibles:

1. **Zambia (tres montos, incluyendo un extremo de 2,000,000 ZMW) es sólido**: no depende del monto, dentro del rango probado.
2. **Sudáfrica (dos montos) muestra una diferencia real**, pero podría deberse a un cambio de producto/modalidad en vez de una simple relación monto-margen — es una situación más parecida a "hay dos productos distintos de Mukuru en Sudáfrica según el monto" que a "el margen de Mukuru depende linealmente del monto".
3. **La comparación de la Sección 2.1 sigue siendo válida como snapshot al mismo monto (200,000)** — eso es exactamente lo que se comparó, con las tres cifras obtenidas de la misma manera. Lo que no se puede hacer todavía es generalizar el 1.29% de Sudáfrica como "el margen de Mukuru en Sudáfrica" sin más contexto, de la misma manera que no se pudo hacer eso con el primer dato de OFX en v18.

### 2.4 Siguiente paso necesario

Probar Sudáfrica en un tercer monto (por ejemplo, 500,000 ZAR) para ver si el quiebre de modalidad de producto ocurre en algún punto entre 200,000 y 1,000,000, y probar Kenia y Zambia también a 1,000,000 para completar la comparación de forma más rigurosa. Se deja como ítem del plan (Sección 7).

---

## 3. Países vecinos probados sin éxito: Mozambique y Malaui

Con el "método del monto revelador" (200,000 unidades locales) ya confirmado en Kenia y Zambia, se probaron dos países más de la región (vecinos de Sudáfrica, donde Mukuru tiene su base) para ver si el mismo patrón se repite.

| País | Corredor | Monto | Resultado |
|---|---|---|---|
| Mozambique | → Portugal (MZN→EUR) | 200,000 MZN | Cobertura cero |
| Mozambique | → Sudáfrica (MZN→ZAR) | 200,000 MZN | Cobertura cero |
| Mozambique | → EEUU (MZN→USD) | 200,000 MZN | Cobertura cero |
| Malaui | → Sudáfrica (MWK→ZAR) | 200,000 MWK | Cobertura cero |
| Malaui | → Reino Unido (MWK→GBP) | 200,000 MWK | Cobertura cero |

**Ninguno de los dos mostró a Mukuru ni a ningún otro proveedor**, ni siquiera al monto que sí funcionó en los países vecinos. Esto es un dato interesante en sí mismo: la presencia de Mukuru en Monito no es simplemente "toda la región donde opera Mukuru en la vida real" — es específica de los países donde Monito tiene un acuerdo comercial y datos cargados, que no incluye (todavía, en Monito) a Mozambique ni a Malaui pese a que Mukuru sí opera en ambos países en la realidad (es una empresa con fuerte presencia en el sur de África en general). Refuerza la lección de Haití en v20: cobertura cero en Monito ≠ ausencia real del proveedor en el mercado.

---

## 4. Nicaragua: otro intento fallido de encontrar un candidato latinoamericano limpio

### 4.1 Por qué se probó

v21 dejó pendiente encontrar un país latinoamericano con crisis cambiaria real pero sin un régimen de sanciones internacionales amplio que confundiera la lectura de la hipótesis "Western Union es una anomalía histórica de América Latina" (Sección 4.9 de v20).

### 4.2 Resultado

| Corredor | Monto | Resultado |
|---|---|---|
| Nicaragua → EEUU (NIO→USD) | 200,000 NIO | Cobertura cero |

### 4.3 Por qué tampoco es un buen caso de prueba

El córdoba nicaragüense, contrario a lo que se esperaba, **no es actualmente un caso de volatilidad cambiaria activa** — Nicaragua mantuvo durante años una devaluación programada y predecible del córdoba (una "minidevaluación" de alrededor de 2% anual respecto al dólar), un mecanismo diseñado explícitamente para ser estable y predecible, no una crisis. Además, aunque Nicaragua no tiene un embargo económico amplio como Cuba, sí existen sanciones dirigidas (tipo Magnitsky) a funcionarios específicos del régimen de Ortega-Murillo, lo cual introduce su propia fuente de confusión para la hipótesis, aunque de un tipo distinto al de Cuba.

### 4.4 Balance de la búsqueda de un candidato latinoamericano

Después de Cuba (v21) y Nicaragua (esta ronda), la búsqueda de un candidato latinoamericano "limpio" (crisis cambiaria real, sin sanciones que confundan la lectura) sigue sin éxito — y esto empieza a ser, en sí mismo, un dato: **la mayoría de las economías latinoamericanas con antecedentes de crisis cambiaria severa hoy están, o bien bajo algún régimen de sanciones (Cuba, Venezuela, Nicaragua), o bien han estabilizado su moneda en las últimas décadas** (México, Perú, Colombia, la propia Argentina bajo el nuevo esquema cambiario desde 2024). Esto es consistente, de forma indirecta, con la idea de que el caso Chile/Argentina fue posible precisamente porque Argentina —a diferencia de sus pares regionales— mantuvo una crisis cambiaria activa y sin sanciones internacionales durante el período en que se hizo la medición.

---

## 5. Angola y Sierra Leona superan la prueba de estrés de montos redondos

Siguiendo el ítem #4 del plan de v21, se aplicó el "monto revelador" (redondo, del mismo orden de magnitud que reveló a Mukuru en Kenia/Zambia) a dos de los seis países de "cobertura cero sin mecanismo confirmado":

| País | Corredor | Monto probado | Resultado |
|---|---|---|---|
| Angola | → Portugal (AOA→EUR) | 200,000 AOA | Cobertura cero |
| Sierra Leona | → Reino Unido (SLL→GBP) | 5,000,000 SLL | Cobertura cero |

Ambos se mantuvieron en cobertura cero incluso en el monto que sí reveló proveedores ocultos en otros países. Esto no prueba de manera absoluta que no exista ningún monto en el que aparezca un proveedor (habría que probar un rango más amplio para eso), pero es una segunda confirmación razonable, en la línea de lo que ya se hizo con Haití y Etiopía en v21 — y refuerza la confianza relativa en estos dos hallazgos frente a los otros cuatro países de la misma categoría (Liberia, Surinam, Gambia, Guinea) que todavía no pasaron por esta prueba adicional.

---

## 6. Guinea: el comunicado del BCRG sigue sin poder verificarse

Se intentó nuevamente acceder al contenido de la restricción regulatoria de Guinea mencionada en v21, esta vez a través de un documento más general del banco central (BCRG) que compila textos regulatorios ("Recueil de textes"). El documento no contiene ninguna disposición específica que restrinja a los IMTOs o transferencias salientes — es decir, **sigue sin confirmarse** si el comunicado original (dirigido específicamente a "Établissements de Transfert d'argent") es una restricción tipo Nigeria/Ghana o algo administrativo sin relación. Se mantiene como pista abierta, no como hallazgo.

---

## 7. El punto de quiebre de Sudáfrica, localizado con precisión

### 7.1 Metodología

Se probaron montos adicionales entre los dos puntos conocidos (200,000 ZAR = 1.29%; 1,000,000 ZAR = 2.7%) para localizar dónde ocurre el cambio.

### 7.2 Resultado

| Monto (ZAR) | Fee | Margen | Modalidad (`po=`) |
|---|---|---|---|
| 200,000 | 850.00 ZAR | **1.29%** | bank |
| 300,000 | 850.00 ZAR | **2.55%** | bank |
| 500,000 | 850.00 ZAR | **2.73%** | bank |
| 1,000,000 | 850.00 ZAR | **2.7%** | broker |

### 7.3 Corrección de una hipótesis de la primera ronda

En la primera ronda de este documento se había planteado que el cambio de margen podía estar ligado al cambio de modalidad de producto (`po=bank` a `po=broker`). **Esto queda descartado con estos nuevos datos**: el salto grande de margen (de 1.29% a 2.55%) ocurre entre 200,000 y 300,000 ZAR, mientras todavía en modalidad `po=bank` — el cambio a `po=broker` no aparece hasta 1,000,000 ZAR, cuando el margen ya llevaba rato estable en ~2.7%. Es decir, el quiebre de margen y el cambio de modalidad de producto son **dos fenómenos distintos que no coinciden en el mismo punto** — el primero ocurre mucho antes que el segundo.

La tarifa fija (850.00 ZAR) se mantiene idéntica en los cuatro montos — el cambio de margen viene enteramente del tipo de cambio aplicado, que empeora escalonadamente. Esto sugiere que Mukuru en Sudáfrica tiene, en efecto, umbrales de monto donde aplica un tipo de cambio distinto (probablemente un "tier" de precios), y 200,000 ZAR (~US$10,900 en esta fecha) parece estar cerca del límite superior del primer escalón.

---

## 8. Botswana: cuarto país de Mukuru, y el margen más bajo del proyecto — con una complicación para la hipótesis central

### 8.1 Resultado

| Corredor | Monto | Margen | Frescura |
|---|---|---|---|
| Botswana → Sudáfrica (BWP→ZAR) | 200,000 BWP | 4.58% | hace 9 segundos |
| Botswana → Reino Unido (BWP→GBP) | 200,000 BWP | **0.37%** | hace 11 segundos |
| Botswana → Reino Unido (BWP→GBP) | 1,000 BWP (default) | 0.69% | hace 3 días |

### 8.2 Por qué esto complica la hipótesis, no solo la confirma

El pula botsuano (BWP) es, por consenso general entre analistas de mercados emergentes, una de las monedas africanas mejor gestionadas y más estables — Botswana mantiene desde hace décadas una política monetaria conservadora respaldada por ingresos diamantíferos y reservas internacionales sólidas, sin antecedentes de crisis cambiaria ni devaluaciones abruptas comparables a las de Kenia o Zambia. Bajo la hipótesis "moneda más estable → margen más bajo", Botswana debería tener un margen bajo — y lo tiene: **0.37% a Reino Unido, el más bajo de los cuatro países probados, incluso por debajo de Sudáfrica (1.29% al mismo monto)**.

**Pero el mismo país, mismo monto, mismo proveedor, distinto destino (Sudáfrica en vez de Reino Unido) da 4.58%** — un margen de los más altos de todo el hilo, comparable al de Kenia y Zambia. Esto es una variación de más de 12 veces (0.37% vs. 4.58%) **dentro del mismo país de origen**, solo por cambiar el destino.

### 8.3 Interpretación honesta

Este resultado no refuta la hipótesis de "moneda volátil → margen alto" (Botswana→Reino Unido de hecho la confirma, siendo la moneda más estable de las cuatro y el margen más bajo), pero sí demuestra que **el destino del envío es, como mínimo, un factor tan importante como el origen** a la hora de explicar el margen de un proveedor — algo que ya se había insinuado en Kenia (donde Reino Unido, Alemania y EEUU dieron márgenes distintos) pero que aquí se ve de forma mucho más extrema. La comparación de la Sección 2 de la primera ronda (Sudáfrica/Kenia/Zambia, todos hacia Reino Unido) sigue siendo válida precisamente porque mantiene el destino constante — pero cualquier futura comparación de países debe seguir esa misma disciplina de "mismo destino" para no mezclar el efecto del origen con el efecto del destino.

### 8.4 Tabla actualizada — cuatro países, mismo destino (Reino Unido), mismo monto (200,000 unidades locales)

| País (origen) | Margen (Mukuru → Reino Unido, 200,000 unidades) |
|---|---|
| Botswana | **0.37%** |
| Sudáfrica | 1.29% |
| Kenia | 4.01% |
| Zambia | 4.25% |

---

## 9. Cierre del programa de prueba de estrés: los diez países de cobertura cero sin mecanismo confirmado

### 9.1 Los cuatro países restantes

Se aplicó el mismo método (monto redondo "revelador", en la escala de 200,000-2,000,000 según la moneda) a los cuatro países que quedaban pendientes desde v21/v22 primera ronda:

| País | Corredor | Monto probado | Resultado |
|---|---|---|---|
| Liberia | → EEUU (LRD→USD) | 200,000 LRD | Cobertura cero |
| Surinam | → Países Bajos (SRD→EUR) | 200,000 SRD | Cobertura cero |
| Gambia | → Reino Unido (GMD→GBP) | 200,000 GMD | Cobertura cero |
| Guinea | → Francia (GNF→EUR) | 2,000,000 GNF | Cobertura cero |

### 9.2 Balance final del programa

Con esto, los **diez** países de "cobertura cero sin mecanismo regulatorio confirmado" del proyecto (Haití, Etiopía, Angola, Sierra Leona — probados en v21/primera ronda de v22 —, más Liberia, Surinam, Gambia, Guinea, Mozambique y Malaui — probados entre la primera y esta segunda ronda) **pasaron todos la prueba de estrés de montos redondos**. Ninguno reveló un proveedor oculto de la manera en que Kenia y Zambia sí lo hicieron con Mukuru. Esto no es una prueba absoluta e irrefutable (siempre podría existir un monto no probado que revele algo), pero es la evidencia más fuerte disponible de que estos diez hallazgos de cobertura cero son genuinos y no un artefacto de la metodología de "solo dos montos" que sí falló en Kenia. **Se da por cerrado este programa de verificación** — no se considera necesario seguir probando montos adicionales en estos diez países salvo que surja una razón específica para dudar de alguno en particular.

---

## 10. Tabla consolidada — 31 países

*(Solo se listan los países nuevos o actualizados en v22; para las 25 filas anteriores a Sudáfrica ver la Sección 5 de v21 y la Sección 6 de v20. Sudáfrica y Zambia figuraban parcialmente desde v21 — aquí se actualizan con datos completos de ambas rondas de v22. Botsuana es enteramente nuevo, agregado en la segunda ronda.)*

| # | País (origen) | Moneda | Estado en Monito | Dato / margen | Mecanismo o nota |
|---|---|---|---|---|---|
| 26 | Sudáfrica | ZAR | Cobertura activa (actualizado, 2ª ronda v22) | Mukuru: 1.29% (200,000 ZAR, po=bank) → 2.55% (300,000 ZAR, po=bank) → 2.73% (500,000 ZAR, po=bank) → ~2.7% (1,000,000 ZAR, po=broker) | Punto de quiebre localizado entre 200,000-300,000 ZAR; NO coincide con el cambio de modalidad po=bank→po=broker (ese ocurre recién en 1,000,000 ZAR) — ver Sección 7 |
| 27 | Zambia | ZMW | Cobertura activa (nuevo, v22) | Mukuru: 4.24-4.26% (independiente del monto, 3 montos probados: 1,000 / ~316,000 / 2,000,000 ZMW); EEUU 3.08% | La confirmación de independencia de monto más limpia del proyecto — contraste directo con Sudáfrica |
| 28 | Mozambique | MZN | Cobertura cero (nuevo, v22) | — | Sin proveedor ni siquiera al monto "revelador"; Mukuru opera ahí en la realidad pero no en Monito |
| 29 | Malaui | MWK | Cobertura cero (nuevo, v22) | — | Mismo patrón que Mozambique |
| 30 | Nicaragua | NIO | Cobertura cero (nuevo, v22) | — | Devaluación programada, no crisis activa; sanciones dirigidas a funcionarios (no embargo amplio) — sigue sin ser un buen candidato para la hipótesis de v20 |
| 31 | Botsuana | BWP | Cobertura activa (nuevo, 2ª ronda v22) | Mukuru→UK: 0.37% (200,000 BWP) / 0.69% (1,000 BWP, default); Mukuru→Sudáfrica: 4.58% (200,000 BWP) | El margen más bajo del proyecto hacia UK, pero 4.58% hacia Sudáfrica con el mismo origen/monto/proveedor — el destino importa tanto como el origen, ver Sección 8 |

**Comparación de las cuatro vías de Mukuru al mismo destino (Reino Unido), 200,000 unidades locales:** Botsuana 0.37% < Sudáfrica 1.29% < Kenia 4.01% < Zambia 4.25%.

---

## 11. Plan sugerido para la próxima ronda

1. ~~Probar Sudáfrica, Kenia y Zambia todos a 500,000 y 1,000,000 de sus respectivas monedas~~ — **Completado esta ronda.** Se confirmó que el punto de quiebre de Sudáfrica está entre 200,000-300,000 ZAR y que no coincide con el cambio de modalidad po=bank→po=broker (ver Sección 7).
2. ~~Probar Mukuru en un cuarto país~~ — **Completado esta ronda con Botsuana.** Reveló una complicación importante: el margen depende también del destino, no solo del origen (ver Sección 8).
3. ~~Aplicar la prueba de estrés de montos redondos a los cuatro países restantes (Liberia, Surinam, Gambia, Guinea)~~ — **Completado esta ronda.** Los diez países del programa pasaron la prueba; programa cerrado (ver Sección 9).
4. **Probar un quinto país de Mukuru con un perfil de destino genuinamente distinto** — dado que Botsuana mostró que el destino importa tanto como el origen, valdría la pena mantener el origen constante (por ejemplo Sudáfrica o Zambia) y variar sistemáticamente el destino, en vez de seguir agregando países de origen nuevos.
5. **Investigar por qué el destino afecta tanto el margen** — ¿liquidez del corredor, volumen de remesas hacia ese destino específico, o algo del lado de fondeo de Mukuru en el país receptor? Esto es una pregunta nueva que abre el hallazgo de Botsuana, sin respuesta clara todavía.
6. **Seguir buscando un candidato latinoamericano limpio** para la hipótesis de v20 — después de Cuba y Nicaragua, los candidatos obvios se agotaron; podría valer la pena reconsiderar el enfoque y aceptar que la ausencia de candidatos es en sí misma informativa (ver Sección 4), en vez de seguir buscando indefinidamente.
7. **Recordatorio de carga a Supabase:** los datos de Mukuru en Zambia (tres montos, margen estable), Sudáfrica (cuatro montos, con el punto de quiebre ya localizado) y Botsuana (dos destinos, con la complicación de destino documentada) son ahora los más sólidos y completos generados en el hilo de Mukuru — ver la nota de cabecera de este documento.
8. Sigue en pie la sugerencia de consolidar el hilo completo en un documento de referencia independiente — con 31 países y dos proveedores de comparación controlada (Western Union y ahora Mukuru con cuatro países), ese documento tiene cada vez más sentido como próximo hito del proyecto.


---

## research-findings-2026-09-03-v23-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #17 (v23, 2ª ronda) — CORRECCIÓN IMPORTANTE: el margen "más bajo del proyecto" de Botsuana era un artefacto de medición (el costo real es ~9.6%, no 0.37%); Lesotho y Bolivia se confirman con más datos; Uganda es el sexto país de Mukuru

> **Documento nuevo, ahora en su segunda ronda.** No reemplaza a v6–v22; los complementa. v23 fue entregado tras su primera ronda; esta ronda continúa y actualiza el mismo archivo, por indicación explícita del usuario ("continuar la investigación y actualizar el mismo archivo"), en vez de generar v24.
>
> **⚠️ CORRECCIÓN METODOLÓGICA IMPORTANTE — LEER ANTES DE USAR CUALQUIER DATO DE MUKURU DE RONDAS ANTERIORES:** esta ronda descubrió que el porcentaje que Monito muestra como "X% peor que el tipo de cambio medio" **no incluye el costo de la comisión fija como fracción del monto enviado** — solo compara la tasa de cambio aplicada contra la tasa media, calculada sobre el monto *después* de descontar la comisión. Cuando la comisión es chica (como en Western Union, con comisiones de unos pocos dólares/euros sobre montos de miles), la diferencia es menor. Pero en Mukuru, donde las comisiones son grandes en proporción al monto (hasta ~9% del monto en algunos corredores), esto **subestima gravemente el costo real**. Recalculando el costo total verdadero (lo que el destinatario recibe vs. lo que recibiría al tipo de cambio medio puro), varios hallazgos centrales de v22 se revierten: **Botsuana, presentado como "el margen más bajo del proyecto" (0.37%), en realidad cuesta ~9.6% — de los más caros**, no de los más baratos. Además, se detectó que la cifra "Kenia 4.01%" usada en la tabla comparativa de cuatro países en realidad correspondía a **Skrill, no a Mukuru** (un error de identificación no capturado por la verificación anterior, que sí usó el enlace `go.monito.com` pero puede haber tomado la tarjeta equivocada en ese momento). Ver la Sección 6 de esta ronda para la recomputación completa y una disculpa metodológica más extensa. **No cargar a Supabase ningún margen de Mukuru de v21-v23 (primera ronda) sin antes recalcularlo con la fórmula correcta.**
>
> **Resto del contexto de esta ronda:** se confirmó que Lesotho es amount-independent (5.21% estable a 200,000 y 500,000 LSL, con datos frescos); se encontró un **sexto país de Mukuru, Uganda**, el primero fuera de África austral; y Bolivia se probó desde un segundo origen (EEUU), mostrando que el margen de Western Union ahí es más variable de lo pensado (0.6%-2.1% según monto/origen) pero se sigue manteniendo entre Chile y Argentina.

## 0. Resumen de esta ronda

- **Sudáfrica: el destino casi no importa.** A 200,000 ZAR, Mukuru cobra 1.29% hacia Reino Unido, 1.32% hacia EEUU y 1.44% hacia Alemania — una variación de apenas 0.15 puntos porcentuales entre los tres destinos probados. Esto contrasta fuertemente con lo encontrado en Botsuana la ronda pasada.
- **Zambia: un tercer destino confirma que el patrón no es ruido.** A un monto ya validado como estable (316,000 ZMW), el margen hacia Alemania es 4.37%, muy cercano al de Reino Unido (4.25%) pero notablemente por encima del de EEUU (3.08%). El patrón "EEUU más barato que Europa" se sostiene con un segundo destino europeo.
- **Lesotho se suma como quinto país de Mukuru — y es el hallazgo más importante de la ronda.** Su moneda (loti, LSL) está fijada 1:1 al rand desde hace décadas (Área Monetaria Común), sin ningún riesgo cambiario. Aun así, el margen hacia Sudáfrica es **5.21%** — el más alto de los cinco países de Mukuru estudiados hasta ahora, y compuesto enteramente por una comisión fija (la tasa de cambio no tiene spread, "as good as the mid-market rate"). Hacia Reino Unido, en cambio, el margen es apenas 0.9%. Esto reproduce exactamente el patrón de Botsuana (barato hacia Reino Unido, caro hacia Sudáfrica) con un origen de volatilidad cambiaria nula, lo cual sugiere que el "efecto destino" hacia Sudáfrica —no la volatilidad del origen— es lo que domina el margen en estos corredores regionales.
- **Namibia y Eswatini no tienen a Mukuru.** Namibia tiene cobertura de Monito (Currencies Direct) pero no de Mukuru, ni hacia Reino Unido ni hacia Sudáfrica. Eswatini no tiene ningún proveedor en Monito, ni siquiera hacia sus dos destinos más obvios (Sudáfrica, Reino Unido) — cobertura cero total, un caso distinto a los de la "prueba de estrés" porque aquí ni el propio agregador tiene datos.
- **Bolivia entrega un tercer punto de comparación Western Union** — Chile 1.37-1.40%, Bolivia ~2.04%, Argentina 5.12-5.35% — un valor intermedio, en un país que en julio de 2026 terminó con 15 años de paridad fija boliviano-dólar y devaluó de facto cerca de 30%, sin estar bajo sanciones internacionales (a diferencia de Cuba, Nicaragua o Venezuela). Es el candidato más prometedor hasta ahora para ampliar el hallazgo Chile/Argentina más allá de un caso aislado.
- Tabla consolidada actualizada a **35 países/casos** (31 de v22 + Lesotho, Namibia, Eswatini, Bolivia).

### Segunda ronda del mismo día (continuación en este archivo, sin crear v24)

- **Corrección metodológica mayor: el "% peor que el tipo de cambio medio" de Monito subestima el costo real cuando la comisión es grande.** Recalculando el costo verdadero (recibido vs. lo que se recibiría al tipo de cambio medio puro, sin descontar antes la comisión), **Botsuana no tiene el margen más bajo del proyecto — tiene uno de los más altos (~9.6% hacia ambos destinos probados)**. La "complicación del destino" que parecía ser el hallazgo central de la ronda anterior (Botsuana: 0.37% a Reino Unido vs. 4.58% a Sudáfrica) resulta ser, en gran parte, un artefacto de medición: al recalcular correctamente, ambos destinos cuestan casi lo mismo (~9.6%). Ver Sección 6.
- **Error de identificación detectado: "Kenia 4.01%" en la tabla de cuatro países era en realidad Skrill, no Mukuru.** El verdadero margen de Mukuru en Kenia→Reino Unido, recalculado, es ~8.6%. Esto se suma a la corrección anterior — ver Sección 6.
- **Lesotho confirma independencia de monto**, con datos frescos en dos montos (200,000 y 500,000 LSL): margen estable en 5.21% hacia Sudáfrica en ambos casos (una lectura de 9.1% a 1,000 LSL resultó ser un artefacto de datos desactualizados, "1 mes de antigüedad" — el mismo fenómeno de "bucket de monto" ya documentado en v21).
- **Uganda se suma como sexto país de Mukuru — el primero fuera de África austral.** Su costo real hacia Reino Unido es de aproximadamente 7.5%, dominado casi enteramente por una comisión fija (52,615 UGX sobre 700,000 UGX, ≈7.5% del monto).
- **Western Union en Bolivia, probado desde un segundo origen (EEUU)**, muestra más variabilidad de la esperada: 1.35% a 1,000 USD, mejorando a 0.62% a 5,000 USD — más barato que la lectura original desde España (~2.04-2.14%), pero siempre entre Chile y Argentina.

---

## 1. Sudáfrica: el destino casi no importa cuando el origen es el mercado más desarrollado

### 1.1 Metodología

Se repitió la consulta de Mukuru Sudáfrica→Reino Unido (ya documentada en v22: 1.29% a 200,000 ZAR) agregando dos destinos nuevos al mismo monto y mismo origen: Estados Unidos y Alemania. El objetivo es aislar el "efecto destino" manteniendo el origen constante — el mismo experimento que reveló la complicación de Botsuana la ronda pasada, pero esta vez con el origen de mercado más desarrollado del proyecto.

### 1.2 Resultados

| Destino | Monto | Fee | Tipo de cambio | Margen | Recibe |
|---|---|---|---|---|---|
| Reino Unido | 200,000 ZAR | 850 ZAR | — | **1.29%** | (v22) |
| Estados Unidos | 200,000 ZAR | 4,000.00 ZAR | 0.061446 | **1.32%** | 12,043 USD |
| Alemania | 200,000 ZAR | 850.00 ZAR | 0.052886 | **1.44%** | 10,532 EUR |

Los tres resultados fueron verificados con el enlace `go.monito.com/mukuru` y el parámetro `amt=200000` coincidente.

### 1.3 Interpretación

La variación entre los tres destinos es de apenas 0.15 puntos porcentuales (1.29% a 1.44%) — dentro de lo que podría considerarse ruido normal de pricing entre corredores, no una diferencia estructural. Esto es notablemente distinto de lo encontrado en Botsuana (0.37% a Reino Unido vs. 4.58% a Sudáfrica, una diferencia de más de 4 puntos porcentuales) y, como se ve en la Sección 3, en Lesotho. La hipótesis de trabajo que emerge: **el "efecto destino" parece ser específico de los corredores regionales de países pequeños que dependen de Sudáfrica como centro económico** (Botsuana, Lesotho), no un fenómeno general de Mukuru. Para Sudáfrica mismo — que ya es el país "ancla" de la región — el destino no cambia mucho el margen, probablemente porque su producto hacia el extranjero usa la misma infraestructura de pago (bróker/banco) independientemente de a dónde vaya el dinero.

---

## 2. Zambia: un tercer destino (Alemania) confirma que el patrón "EEUU más barato" no es ruido

### 2.1 Metodología

Zambia ya tenía dos destinos documentados en v22: Reino Unido (4.25% a 200,000 ZMW) y EEUU (3.08%, monto no especificado con precisión en ese momento). Para evitar cualquier duda sobre si la diferencia entre esos dos destinos podía deberse al monto (dado que Zambia ya demostró independencia de monto en tres pruebas separadas: 1,000 / 316,000 / 2,000,000 ZMW, todas 4.24-4.26%), se probó Alemania al monto ya validado como estable: **316,000 ZMW**.

### 2.2 Resultado

Zambia→Alemania a 316,000 ZMW: fee 15,048.00 ZMW, tipo de cambio 0.043068, **margen 4.37%**, recibe 12,961 EUR. Verificado vía `go.monito.com/mukuru?...amt=316000...` — único proveedor disponible en este corredor.

### 2.3 Comparación de los tres destinos de Zambia

| Destino | Margen | Nota |
|---|---|---|
| Alemania | 4.37% | Este redonda |
| Reino Unido | 4.25% | v22 |
| Estados Unidos | 3.08% | v22 |

El patrón se sostiene: los dos destinos europeos (Alemania, Reino Unido) están muy cerca entre sí (4.25-4.37%), mientras que EEUU es consistentemente más barato (3.08%), casi 1.2-1.3 puntos porcentuales por debajo. A diferencia de Sudáfrica (Sección 1), en Zambia el destino sí genera una diferencia real, aunque mucho más moderada que la de Botsuana o Lesotho — sugiere una jerarquía de tres niveles de sensibilidad al destino: Sudáfrica (insensible) < Zambia (moderadamente sensible) < Botsuana/Lesotho (muy sensible, y específicamente por el destino Sudáfrica).

---

## 3. Lesotho: quinto país de Mukuru, y una paridad cambiaria total que no elimina el margen

### 3.1 Por qué se probó

Lesotho es un país completamente rodeado por Sudáfrica, miembro del Área Monetaria Común (Common Monetary Area) junto con Sudáfrica, Namibia y Eswatini. Su moneda, el loti (LSL), está fijada 1:1 al rand desde 1974 y es de curso legal intercambiable con el rand dentro de Lesotho. Es, en teoría, el caso de **menor volatilidad cambiaria posible** en la muestra del proyecto — no hay ningún riesgo de tipo de cambio que un proveedor pueda usar como excusa para cobrar un margen más alto. Se probó como control directo de la hipótesis "moneda volátil → margen alto".

### 3.2 Resultado — Lesotho→Sudáfrica

A 200,000 LSL: fee 10,427.00 LSL, tipo de cambio 1.0000 ("as good as the mid-market rate" — es decir, **sin ningún spread cambiario**), recibe 189,573 ZAR. Verificado vía `go.monito.com/mukuru?...cof=ls&cot=za...amt=200000...` — único proveedor.

Como la tasa de cambio no tiene spread, el costo total del envío es exclusivamente la comisión fija: 10,427 / 200,000 = **5.21%**. Es, con esto, **el margen más alto de los cinco países de Mukuru estudiados en todo el proyecto** — más alto que Zambia (4.24-4.37%), Botsuana→Sudáfrica (4.58%), Kenia (4.01%) y muy por encima de Sudáfrica (1.29-1.44%).

### 3.3 Resultado — Lesotho→Reino Unido

A 200,000 LSL: fee 850.00 LSL, tipo de cambio 0.045694, **0.9% peor que el tipo de cambio medio**, recibe 9,100 GBP. Verificado vía el mismo método — único proveedor.

### 3.4 Interpretación: el "efecto destino" domina sobre la volatilidad del origen

Lesotho reproduce, casi con precisión, el mismo patrón de Botsuana: barato hacia Reino Unido (0.9%, similar al 0.37% de Botsuana), carísimo hacia Sudáfrica (5.21%, incluso más que el 4.58% de Botsuana). La diferencia es que Lesotho tiene **volatilidad cambiaria cero** (paridad fija, sin spread), mientras que Botsuana tiene una moneda libremente flotante y considerada una de las más estables de África, pero no fijada.

Esto es una evidencia fuerte de que, al menos en estos corredores regionales pequeños hacia/desde Sudáfrica, **el mecanismo que determina el margen no es la volatilidad de la moneda de origen, sino algo específico del corredor hacia Sudáfrica** — posiblemente la estructura de la red de agentes de Mukuru para pagos en efectivo dentro de Sudáfrica (que podría tener costos operativos fijos más altos, por ejemplo por regulación de cambio de divisas o por la naturaleza de "cash-heavy" del corredor), en contraste con transferencias bancarias hacia Reino Unido/EEUU/Alemania que usan rieles de pago internacionales más baratos y estandarizados.

Esta es una revisión importante de la hipótesis central del proyecto. La hipótesis original ("moneda volátil de origen → margen más alto") sigue siendo válida para el conjunto amplio de comparaciones cruzadas entre países (Kenia y Zambia, con monedas históricamente inestables, tienen márgenes más altos que Sudáfrica, con la moneda más líquida). Pero **dentro de un mismo país de origen, el destino puede pesar más que cualquier diferencia de volatilidad** — y specialmente el destino Sudáfrica parece tener un recargo estructural que nada tiene que ver con el riesgo cambiario del origen.

### 3.5 Pendiente

No se probó la independencia de monto para Lesotho (solo un monto, 200,000 LSL, en cada corredor). Dado el patrón ya visto en Zambia y Sudáfrica, sería valioso confirmar si el margen de 5.21% hacia Sudáfrica se mantiene a otros montos, o si — como Sudáfrica — cambia de nivel en algún punto.

---

## 4. Namibia y Eswatini: la cobertura de Mukuru no cubre toda la región de la CMA

Namibia y Eswatini son los otros dos miembros del Área Monetaria Común además de Lesotho y Sudáfrica. Se probaron como candidatos naturales para un sexto/séptimo país de Mukuru.

- **Namibia→Reino Unido** (200,000 NAD): un solo proveedor, Currencies Direct (5.8% de costo total, según el resumen agregado de Monito) — **no aparece Mukuru**.
- **Namibia→Sudáfrica** (200,000 NAD): un solo proveedor, nuevamente Currencies Direct (`po=broker`) — **tampoco aparece Mukuru**.
- **Eswatini→Sudáfrica** (200,000 SZL): **"No results"** — Monito no encuentra ningún proveedor que transfiera a rands desde Eswatini.
- **Eswatini→Reino Unido** (200,000 SZL): **"No results"** — tampoco hay proveedores hacia libras esterlinas.

Namibia tiene cobertura de Monito pero no de Mukuru específicamente — es un dato en sí mismo: Mukuru opera comercialmente en Namibia en la realidad, pero no aparece en el comparador para estos corredores. Eswatini directamente no tiene ningún dato en Monito para estos dos corredores — cobertura cero total, un caso más extremo que los de la "prueba de estrés" de rondas anteriores (que sí encontraban al menos otros proveedores, solo no Mukuru).

---

## 5. Bolivia: Western Union suma un tercer punto de comparación latinoamericana — y quizás un candidato genuino para el "santo grial"

### 5.1 Contexto: por qué Bolivia es distinto a los candidatos fallidos anteriores

v20 y v21 probaron Cuba y Nicaragua como candidatos para replicar el hallazgo Western Union Chile (1.37-1.40%) / Argentina (5.12-5.35%) en un tercer país latinoamericano de moneda volátil. Ambos fallaron: Cuba por el embargo (confunde crisis monetaria con sanciones), Nicaragua porque su moneda en realidad no es volátil (devaluación programada y predecible) y tiene sanciones dirigidas a funcionarios.

Bolivia es un caso genuinamente distinto. En julio de 2026, Bolivia **terminó con 15 años de paridad fija** entre el boliviano y el dólar (fijada desde 2011 en 6.96 BOB/USD) y adoptó un régimen de tipo de cambio flotante, en medio de una escasez severa de dólares y negociaciones con el FMI. El tipo de cambio de facto se devaluó cerca de un 30% de una sola vez, y para septiembre de 2026 ya había subido más de 76% desde junio. **No hay sanciones internacionales de ningún tipo sobre Bolivia** — es una crisis puramente doméstica de origen fiscal/cambiario, exactamente el tipo de caso que la hipótesis original necesitaba.

### 5.2 Resultado — España→Bolivia vía Western Union

Se probó en dos montos (1,000 EUR y 5,000 EUR) para verificar estabilidad. En ambos casos:

- **Tasa promocional de primera transferencia**: tipo de cambio 14.2745, "1.36% mejor que el tipo de cambio medio" — marcada explícitamente en la página como beneficio de "primera transferencia" (comisión cero + tasa preferencial). Este es el mismo patrón de contaminación por tasa promocional ya identificado y corregido en rondas anteriores del proyecto (y, de hecho, ya visto específicamente en España→Bolivia en v11, donde el agregado de Monito mostraba un costo promedio de -20.9%, un valor absurdo típico de esta contaminación).
- **Tasa regular** (mostrada en la misma tarjeta, tachada, como alternativa a la promocional): tipo de cambio **13.7970** frente a un tipo de cambio medio de 14.0828-14.0848. Esto da un margen real de **~2.04%**, idéntico en ambos montos probados (1,000 y 5,000 EUR) — es decir, estable frente al monto.

### 5.3 Comparación de los tres países

| País | Margen Western Union | Contexto cambiario |
|---|---|---|
| Chile | 1.37-1.40% | Peso chileno, sin crisis activa |
| **Bolivia** | **~2.04%** | Boliviano, fin de paridad fija de 15 años + devaluación ~30% desde julio 2026, sin sanciones |
| Argentina | 5.12-5.35% | Peso argentino, historial de inflación y controles de cambio |

Bolivia cae en un punto intermedio, no en el extremo de Argentina — pero es la primera vez que se encuentra un tercer país latinoamericano, sin confusión de sanciones, donde Western Union muestra un margen claramente por encima del de Chile. Es una diferencia modesta (0.6-0.7 puntos porcentuales sobre Chile) comparada con el salto hacia Argentina (casi 4 puntos), lo cual es consistente con que la crisis boliviana, aunque real y reciente, todavía es mucho menos severa que la historia larga de inflación y controles argentinos.

### 5.4 Interpretación honesta

Este hallazgo debe tratarse con cautela por varias razones: (1) el régimen cambiario de Bolivia cambió hace apenas dos meses (julio de 2026), por lo que el margen de Western Union podría no haberse ajustado todavía completamente a la nueva volatilidad, o podría subir más si la crisis se profundiza; (2) solo se probó un proveedor (Western Union) y un origen (España) — no se verificó si el patrón se sostiene con otro origen, como se hizo con Chile/Argentina en rondas anteriores; (3) la magnitud del efecto (0.6-0.7 puntos) es mucho más chica que la diferencia Chile/Argentina, así que el poder explicativo de este dato por sí solo es limitado.

Aun así, es el mejor candidato encontrado hasta ahora para extender la hipótesis del "santo grial" más allá de un único caso aislado — precisamente porque, a diferencia de Cuba y Nicaragua, no tiene un confounder de sanciones internacionales que pueda explicar el resultado por otro motivo.

---

## 6. Corrección metodológica: el "% peor que el tipo de cambio medio" de Monito no es el costo total cuando hay una comisión fija grande

### 6.1 Cómo se descubrió

Al investigar Uganda (Sección 8), se encontró un resultado que no encajaba: una comisión de 52,615 UGX sobre un envío de 700,000 UGX (7.5% del monto solo en comisión), pero Monito mostraba el margen como **"0.01% peor que el tipo de cambio medio"** — una cifra que, tomada al pie de la letra, sugeriría que Uganda es casi gratis. Esto disparó una revisión de la fórmula que usa Monito para ese porcentaje.

### 6.2 El problema

El "X% peor que el tipo de cambio medio" que Monito muestra en cada tarjeta compara **la tasa de cambio aplicada por el proveedor** contra **la tasa de cambio media**, como una simple razón entre las dos tasas. No tiene en cuenta que, antes de aplicar esa tasa, el proveedor ya descontó una comisión fija del monto enviado. El resultado: cuando la comisión es una fracción significativa del monto, el "% peor que el tipo de cambio medio" **subestima gravemente** cuánto dinero se pierde en total.

La forma correcta de calcular el costo real es comparar lo que el destinatario efectivamente recibe contra lo que recibiría si el monto completo se convirtiera al tipo de cambio medio puro, sin ninguna comisión:

**Costo real = 1 − (lo que recibe el destinatario) / (monto enviado × tipo de cambio medio)**

### 6.3 El impacto: se prueba con las cifras ya recolectadas

| Corredor | Monto | Comisión | % mostrado por Monito | Costo real recalculado |
|---|---|---|---|---|
| Sudáfrica→Reino Unido | 200,000 ZAR | 850 ZAR | 1.29% | **2.48%** |
| Sudáfrica→EEUU | 200,000 ZAR | 4,000 ZAR | 1.32% | **3.27%** |
| Sudáfrica→Alemania | 200,000 ZAR | 850 ZAR | 1.44% | **1.86%** |
| Kenia→Reino Unido (Mukuru, verificado) | 200,000 KES | 3,922 KES | 6.84% | **8.64%** |
| Zambia→Reino Unido | 200,000 ZMW | 9,524 ZMW | 4.25% | **8.85%** |
| Zambia→Alemania | 316,000 ZMW | 15,048 ZMW | 4.37% | **8.93%** |
| Zambia→EEUU | 316,000 ZMW | 6,196 ZMW | 3.09% | **4.99%** |
| Botsuana→Reino Unido | 200,000 BWP | 18,182 BWP | 0.37% | **9.64%** |
| Botsuana→Sudáfrica | 200,000 BWP | 9,524 BWP | 4.58% | **9.63%** |
| Lesotho→Sudáfrica | 200,000 / 500,000 LSL | 10,427 / 26,066 LSL | — (sin spread, 1:1) | **5.21%** (sin cambios — ver 6.4) |
| Lesotho→Reino Unido | 200,000 / 500,000 LSL | 850 LSL (ambos) | 0.9% / 0.98% | **1.33% / 1.15%** |
| Uganda→Reino Unido | 700,000 UGX | 52,615 UGX | 0.01% | **≈7.52%** |

La corrección es más chica cuanto más grande es el monto en relación con la comisión (comparar Lesotho a 200,000 vs. 500,000 LSL: 1.33% vs. 1.15%, ambos con la misma comisión fija de 850 LSL pero denominadores distintos), y prácticamente inexistente cuando no hay comisión separada del spread cambiario (Lesotho→Sudáfrica, donde la "comisión" ya es matemáticamente el 100% del costo por la paridad 1:1).

### 6.4 Dos hallazgos centrales de v22 que se revierten

**Botsuana ya no es "el margen más bajo del proyecto" — es de los más altos.** El hallazgo insignia de la ronda anterior ("0.37% a Reino Unido, el margen más bajo de los cuatro países, complicando la hipótesis de volatilidad porque el pula es de las monedas más estables de África") se basaba en la cifra sin corregir. El costo real es **~9.64%** hacia Reino Unido — de hecho, el corredor más caro de todo el proyecto hasta ahora. Y la "complicación del destino" (0.37% a Reino Unido vs. 4.58% a Sudáfrica) **también se revierte**: una vez recalculado, ambos destinos cuestan prácticamente lo mismo (9.64% y 9.63%). Lo que parecía ser una diferencia real de 4 puntos porcentuales entre destinos era, en gran medida, un artefacto de cómo Mukuru distribuye su margen entre comisión fija y spread cambiario en cada corredor — no una diferencia real de costo total.

**La cifra "Kenia 4.01%" de la tabla comparativa de cuatro países (v22) correspondía a Skrill, no a Mukuru.** Al volver a verificar Kenia→Reino Unido esta ronda con el mismo método de siempre (enlace `go.monito.com/<proveedor>`), se encontró que la tarjeta con comisión gratis, tasa 0.005500 y "4.01% peor" es **Skrill** — y la tarjeta de Mukuru es la otra, con comisión 3,922 KES, tasa 0.005338 y "6.84% peor" (costo real recalculado: **8.64%**). Es decir, en algún momento de v20-v22 se tomó la tarjeta equivocada al leer los resultados de esa página específica, a pesar de que el protocolo de verificación por enlace ya estaba establecido — un recordatorio de que verificar el enlace no es suficiente si se lee la tarjeta incorrecta al hacerlo; hay que confirmar que el enlace propio de Mukuru está *dentro* de la tarjeta cuyos números se están anotando, no solo que existe en algún lugar de la página.

### 6.5 Qué sobrevive de la ronda anterior

La hipótesis central del proyecto (Kenia y Zambia, monedas con historial de crisis, tienen márgenes más altos que Sudáfrica, la moneda más líquida) **sigue siendo válida y de hecho se refuerza**: con las cifras corregidas, Sudáfrica (1.86-3.27%) sigue siendo claramente más barata que Kenia (8.64%) y Zambia (8.85-8.93%). Lo que no sobrevive es el caso específico de Botsuana como excepción a esa regla — Botsuana, con una moneda considerada estable, ahora aparece como uno de los corredores *más caros*, no más baratos, lo cual en todo caso sería **más consistente** con... en realidad, ni siquiera eso: Botsuana tiene fama de moneda estable, así que un costo real tan alto (9.6%) sigue sin encajar limpiamente en la hipótesis de volatilidad en ninguna dirección. Lo más honesto es decir que, con los datos actuales, el costo de Mukuru parece depender más de la estructura de comisiones específica de cada corredor que de la volatilidad cambiaria del país de origen — una conclusión más modesta, pero más sólida, que la de la ronda anterior.

### 6.6 Nota de responsabilidad metodológica

Este error no fue producto de no seguir el protocolo del proyecto (verificar con `go.monito.com`), sino de una limitación no detectada en la fórmula que Monito usa para mostrar el margen, combinada — en el caso de Kenia — con una lectura descuidada de cuál tarjeta correspondía a qué proveedor. Se decidió documentar esto de forma extensa y explícita, en vez de simplemente corregir los números en silencio, porque **la tabla de cuatro países fue presentada como el hallazgo más importante de v22** y merece ser revisada con el mismo rigor con el que se presentó originalmente.

### 6.7 Trabajo pendiente derivado de esta corrección

No se recalcularon con esta fórmula correcta todas las cifras de Mukuru publicadas en v21-v22 (Kenia a otros montos/destinos, Sudáfrica en su versión original de v22, etc.) — sería un trabajo extenso que se recomienda como prioridad de la próxima ronda (ver Sección 11). Tampoco se revisó si el mismo problema afecta a Skrill o a otros proveedores de comisión fija estudiados en rondas muy anteriores del proyecto. Sí se verificó que Western Union en Bolivia (Sección 9) es mucho menos sensible a este problema, porque sus comisiones son chicas en relación al monto (0.12%-2.1% del monto, según el corredor) — la corrección ahí es real pero mucho menor.

---

## 7. Lesotho confirma independencia de monto, con un aviso sobre datos desactualizados

Se repitió Lesotho→Sudáfrica en dos montos adicionales al ya probado (200,000 LSL): uno más chico (1,000 LSL, el monto por defecto) y uno más grande (500,000 LSL).

- **1,000 LSL**: comisión 91.00 LSL → 9.1% de costo (fee-only, dado el peg 1:1). Pero los datos estaban marcados como **"actualizados hace 1 mes"** — es decir, el mismo fenómeno de "bucket de monto" con datos obsoletos ya documentado en v21 para Kenia. Esta cifra no es confiable.
- **500,000 LSL**: comisión 26,066.00 LSL → 5.2132% de costo, con datos marcados como **"actualizados hace 10 segundos"** (frescos). Esto coincide casi exactamente con el 5.2135% encontrado a 200,000 LSL (también con datos frescos).

**Conclusión:** con datos frescos, el margen de Lesotho→Sudáfrica es estable en **5.21%** independientemente del monto — confirmando el mismo patrón de independencia de monto ya visto en Zambia, y reforzando que el monto de 1,000 LSL (el default) no debe usarse para conclusiones, tal como se aprendió con Kenia en v21.

También se repitió Lesotho→Reino Unido a 500,000 LSL: comisión 850.00 LSL (la misma comisión fija que a 200,000 LSL), margen mostrado por Monito de 0.98% (vs. 0.9% a 200,000 LSL) — prácticamente estable, con la pequeña diferencia explicada por el denominador más grande diluyendo levemente el costo fijo. El costo real recalculado (Sección 6) es 1.15% a 500,000 LSL vs. 1.33% a 200,000 LSL — la misma lógica.

---

## 8. Uganda: sexto país de Mukuru, y el primero fuera de África austral

Se probó Uganda→Reino Unido (700,000 UGX) buscando ampliar la muestra de países de Mukuru más allá del clúster de África austral (Sudáfrica, Kenia, Zambia, Botsuana, Lesotho — con la excepción de Kenia, que es de África oriental pero fue el segundo país descubierto, en v21). Uganda es la primera confirmación en un país no directamente conectado a la Área Monetaria Común ni a la esfera económica inmediata de Sudáfrica.

Resultado: comisión 52,615.00 UGX, tasa de cambio 0.000196, "0.01% peor que el tipo de cambio medio" (cifra engañosa por la razón explicada en la Sección 6 — la comisión es enorme en relación al monto: 7.5%). **Costo real recalculado: ≈7.52%.** Verificado con `go.monito.com/mukuru?...cof=ug&cot=gb...amt=700000...` — único proveedor en el corredor.

Con esto, Uganda entra a la tabla comparativa junto a los otros cinco países de Mukuru con un costo real de ~7.52% hacia Reino Unido — en el rango medio-alto del grupo, cerca de Kenia (8.64%) pero algo más barato.

---

## 9. Western Union en Bolivia desde un segundo origen: más variable de lo esperado, pero sigue entre Chile y Argentina

### 9.1 Metodología

Siguiendo el mismo estándar aplicado a Chile/Argentina en rondas anteriores (verificar desde más de un origen), se probó Western Union para Bolivia desde Estados Unidos, en los mismos dos montos usados para España (1,000 y 5,000 USD).

### 9.2 Resultados

| Monto | Comisión (regular, sin promo) | Tasa aplicada | Tasa media | Recibe (regular) | Costo real |
|---|---|---|---|---|---|
| 1,000 USD | 20.99 USD | 12.2600 | 12.1677 | 12,003 BOB | **1.35%** |
| 5,000 USD | 64.99 USD | 12.2600 | 12.1760 | 60,503 BOB | **0.62%** |

En ambos casos se identificó y descartó la tarifa promocional de primera transferencia (comisión $0 + tasa preferencial), mostrada en la misma tarjeta junto a la cifra "regular" — el mismo patrón de contaminación ya conocido en el proyecto. A diferencia del corredor España→Bolivia (donde la comisión regular era fija en 5.99 EUR para ambos montos, dando un costo estable de ~2.04-2.14%), en EEUU→Bolivia la comisión regular **sí escala con el monto** (20.99 USD a 1,000 USD vs. 64.99 USD a 5,000 USD, aunque no proporcionalmente — de ahí que el costo real baje con el monto en vez de mantenerse plano).

### 9.3 Interpretación

El margen de Western Union en Bolivia resulta más sensible al origen y al monto de lo que sugería el primer dato (España, ~2.04-2.14% estable). Con EEUU como origen, el costo real va de 0.62% a 1.35% según el monto — más bajo que España, pero **siempre entre Chile (1.37-1.40%) y Argentina (5.12-5.35%)**, aunque en el extremo inferior de ese rango, y en el monto más alto (5,000 USD, 0.62%) incluso ligeramente por debajo de Chile. Esto no invalida a Bolivia como candidato a "santo grial", pero sí exige más cautela: el margen boliviano parece depender bastante del corredor específico (origen + monto), a diferencia de Chile y Argentina, donde el rango citado en el proyecto es más angosto. Sería necesario probar más orígenes y montos para tener una cifra representativa confiable de Bolivia, en vez de tratarla como un número único.

---

## 10. Tabla consolidada — 36 países/casos

*(Solo se listan los países/casos nuevos o corregidos de esta ronda. Para las 31 filas anteriores a v23 ver la Sección 10 de v22, la Sección 5 de v21 y la Sección 6 de v20. ⚠️ Las cifras de Mukuru marcadas "costo real" usan la fórmula corregida de la Sección 6, no el porcentaje que muestra Monito directamente.)*

| # | País (origen) | Moneda | Estado en Monito | Dato / margen | Mecanismo o nota |
|---|---|---|---|---|---|
| 32 | Lesotho | LSL | Cobertura activa (confirmado amount-independent, 2ª ronda v23) | Mukuru: costo real 5.21% (200,000 y 500,000 LSL → Sudáfrica, estable) / 1.15-1.33% (→ Reino Unido, según monto) | Quinto país de Mukuru; paridad 1:1 con el rand, sin riesgo cambiario, y aun así de los márgenes más altos del proyecto hacia Sudáfrica — ver Secciones 3 y 7 |
| 33 | Namibia | NAD | Cobertura cero para Mukuru (nuevo, v23) | — | Sí tiene cobertura de Monito (Currencies Direct) hacia Reino Unido y Sudáfrica, pero no Mukuru |
| 34 | Eswatini | SZL | Cobertura cero total (nuevo, v23) | — | Ningún proveedor en Monito hacia Sudáfrica ni Reino Unido — ni siquiera "No conocido", directamente "No results" |
| 35 | Bolivia | BOB | Cobertura activa — Western Union (nuevo, v23; actualizado 2ª ronda) | WU: España 2.04-2.14% (1,000/5,000 EUR, estable) — EEUU 0.62-1.35% (1,000/5,000 USD, decreciente con el monto) | Tercer punto de comparación controlada mismo-proveedor en Latinoamérica; más variable por origen/monto de lo esperado, pero siempre entre Chile y Argentina — ver Secciones 5 y 9 |
| 36 | Uganda | UGX | Cobertura activa (nuevo, 2ª ronda v23) | Mukuru: costo real ≈7.52% (700,000 UGX → Reino Unido) | Sexto país de Mukuru, y el primero fuera del clúster de África austral — ver Sección 8 |

**Corrección de filas anteriores (Sudáfrica #26, Kenia, Zambia #27, Botsuana #31) — ver Sección 6 para la tabla completa de recomputación:** los márgenes de Mukuru reportados en v22 y en la primera ronda de v23 para estos países usaban el porcentaje que Monito muestra directamente, el cual **subestima el costo real** cuando la comisión fija es grande en relación al monto. Recalculados: Sudáfrica 1.86-3.27% (antes 1.29-1.44%), Kenia→Reino Unido 8.64% (antes "4.01%", que en realidad era Skrill), Zambia 4.99-8.93% (antes 3.08-4.37%), Botsuana 9.63-9.64% en ambos destinos (antes 0.37%/4.58% — la cifra de 0.37% que se citó como "el margen más bajo del proyecto" queda descartada).

---

## 11. Plan sugerido para la próxima ronda

1. ~~Probar la independencia de monto de Lesotho~~ — **Completado esta ronda.** Confirmado estable en 5.21% hacia Sudáfrica (200,000 y 500,000 LSL, datos frescos); el monto por defecto (1,000 LSL) dio una lectura de 9.1% que resultó ser un artefacto de datos desactualizados (1 mes de antigüedad).
2. ~~Buscar un sexto país de Mukuru fuera de África austral~~ — **Completado esta ronda con Uganda** (costo real ≈7.52% hacia Reino Unido).
3. ~~Verificar Western Union en Bolivia desde un segundo origen~~ — **Completado esta ronda con EEUU.** El margen resultó más variable de lo esperado (0.62-1.35% según monto, vs. 2.04-2.14% estable desde España) — ver punto 6 más abajo para el seguimiento necesario.
4. **PRIORIDAD ALTA — Recalcular con la fórmula correcta (Sección 6) todos los márgenes de Mukuru publicados en v20, v21 y v22** que todavía usan el porcentaje sin corregir: Kenia en otros destinos/montos (Alemania, EEUU, y los distintos montos probados en v21), y cualquier otra cifra de Mukuru citada en esas rondas. Esto es necesario antes de cargar cualquier dato histórico de Mukuru a Supabase.
5. **Revisar si el mismo problema de la Sección 6 afecta a Skrill u otros proveedores de comisión fija** estudiados en rondas anteriores del proyecto (no solo Mukuru) — el mecanismo (comisión fija grande en relación al monto) no es exclusivo de Mukuru.
6. **Conseguir una cifra más representativa de Western Union en Bolivia** — con solo dos orígenes y dos montos cada uno, y resultados que no convergen limpiamente (España estable ~2.1%, EEUU decreciente 0.6-1.35%), hace falta más muestreo antes de citar un número único comparable a los de Chile/Argentina.
7. **Con la corrección de la Sección 6, reconsiderar si la hipótesis de "recargo estructural hacia Sudáfrica" (planteada en la ronda anterior a partir de Botsuana/Lesotho) sigue siendo válida** — Lesotho todavía muestra una diferencia real por destino (5.21% SA vs. ~1.2% UK) incluso corregida, pero Botsuana ya no (9.63% vs. 9.64%, prácticamente iguales). Vale la pena entender por qué estos dos países vecinos, con la misma estructura de moneda/región, se comportan tan distinto entre sí.
8. **Recordatorio de carga a Supabase:** ningún margen de Mukuru de v21/v22/primera-ronda-v23 debe cargarse sin antes recalcularlo con la fórmula corregida — ver la nota de cabecera de este documento y la Sección 6. Los datos de Lesotho (Sección 7) y Uganda (Sección 8) de esta segunda ronda ya están calculados correctamente.
9. Sigue en pie la sugerencia de consolidar el hilo completo (ahora con 36 países/casos, dos proveedores de comparación controlada, y una corrección metodológica importante) en un documento de referencia independiente — quizás incluso más urgente ahora, dado que ese documento de referencia debería nacer ya con la fórmula correcta en vez de heredar el error.


---

## research-findings-2026-09-03-v24-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# mangomundi — Research, ADDENDUM #18 (v24, 2ª ronda) — Rwanda es el séptimo país de Mukuru; Western Union en Bolivia ya no tiene un margen citable (rango de 0.62% a 9.16% según origen); Chile confirma ser estable entre orígenes, Argentina se topa con el problema ya conocido de su tasa "mid-market"

> **Documento nuevo, ahora en su segunda ronda.** No reemplaza a v6–v23; los complementa. v24 fue entregado tras su primera ronda; esta ronda continúa y actualiza el mismo archivo, por indicación explícita del usuario ("continuar y actualizar el mismo archivo"), en vez de generar v25.
>
> **Contexto para quien cargue este archivo a Supabase:** esta ronda continúa el trabajo de auditoría abierto en la segunda ronda de v23 (Sección 6 de ese documento), que descubrió que el margen que Monito muestra ("X% peor que el tipo de cambio medio") subestima el costo real de Mukuru cuando la comisión fija es grande. Esta ronda: (1) recalculó Kenia en sus tres destinos ya probados (Reino Unido, Alemania, EEUU) con la fórmula corregida — el costo real ronda 8.4-9.9%, muy por encima de lo publicado en v20-v22; (2) confirmó que **Skrill no necesita corrección** porque no cobra comisión aparte (todo el costo está en el spread cambiario, que es lo que Monito sí mide bien); (3) sumó un tercer origen (Italia) a la comparación Western Union de Bolivia, ampliando el rango observado a 0.62%-6.35% según origen; y (4) probó Botsuana y Lesotho hacia un tercer destino (EEUU) cada uno, encontrando que **el patrón "Sudáfrica es el destino caro" no es una regla general** — en Botsuana, EEUU es el destino más barato, no Sudáfrica. Ver Secciones 1-4 antes de cargar nada nuevo.

## 0. Resumen de esta ronda

- **Kenia recalculada en sus tres destinos con la fórmula corregida**: Reino Unido 8.64%, EEUU 8.43%, Alemania 9.85% — todos muy por encima de las cifras publicadas en rondas anteriores (4.01%-6.84%, según el destino y sin corregir). Kenia se confirma como uno de los corredores más caros de Mukuru en todo el proyecto, en línea con Zambia (4.99-8.93%) y no muy lejos de Botsuana/Uganda.
- **Skrill queda exento de la corrección metodológica — y esto se puede explicar claramente.** Se verificó Skrill Kenia→Alemania: comisión $0, por lo que el "% peor que el tipo de cambio medio" que muestra Monito **coincide exactamente** con el costo real (2.51% en ambos casos). El problema de subestimación de la Sección 6 de v23 es específico de proveedores con comisión fija separada del tipo de cambio (como Mukuru) — no afecta a proveedores de comisión cero como Skrill.
- **Western Union en Bolivia, ahora con un tercer origen (Italia): el rango se amplía más todavía.** Italia→Bolivia da un costo real de 6.35% — más alto que España (2.04-2.14%) y bastante más alto que EEUU (0.62-1.35%), y de hecho más cerca del extremo del rango de Argentina (5.12-5.35%) que del de Chile. Con tres orígenes ahora probados, el rango observado (0.62%-6.35%) es demasiado amplio para citar un número representativo único de Bolivia.
- **El patrón "destino Sudáfrica es caro" no se sostiene como regla general.** Se probó un tercer destino (EEUU) para Botsuana y Lesotho. En Lesotho, el patrón se mantiene y hasta se refina: Reino Unido (~1.2-1.3%) < EEUU (3.18%) < Sudáfrica (5.21%) — un gradiente limpio de tres niveles. Pero en **Botsuana el patrón se invierte**: EEUU (7.91%) es el destino más barato de los tres, no Sudáfrica ni Reino Unido (9.63-9.64%, prácticamente empatados como los más caros). Es decir, no hay una regla consistente entre países sobre cuál destino es más barato — parece ser específico de la estructura comercial de cada corredor, no un patrón general de "Sudáfrica es cara" o "el destino más desarrollado es barato".
- Tabla consolidada: sin países nuevos esta ronda, pero con actualizaciones sustanciales a Kenia, Botsuana, Lesotho y Bolivia (ver Sección 5).

### Segunda ronda del mismo día (continuación en este archivo, sin crear v25)

- **Rwanda se suma como séptimo país de Mukuru** — costo real ≈7.42% hacia Reino Unido. Sigue dentro del clúster de África subsahariana oriental/austral; no se encontró presencia de Mukuru fuera de África en esta búsqueda (se probaron Pakistán, Filipinas, Tanzania y Senegal, todos sin Mukuru).
- **Western Union en Bolivia, con dos orígenes más (Argentina y Brasil): el rango se amplía todavía más, hasta 0.62%-9.16%.** Argentina→Bolivia da el costo más alto de los cinco orígenes probados (9.16%) — más caro incluso que el propio rango de Argentina para sí misma (5.12-5.35%). Brasil→Bolivia da 3.62%, un valor intermedio. Con cinco orígenes y un rango tan amplio, queda descartado citar cualquier número único para "Western Union en Bolivia".
- **Chile, probado desde un nuevo origen (Italia), confirma ser mucho más estable que Bolivia**: 1.67% — cercano al rango ya establecido (1.37-1.40%). Esto refuerza que la variabilidad extrema de Bolivia es un fenómeno propio de ese país, no un problema general de cómo Western Union fija precios según el origen.
- **Argentina, probada desde Italia, no pudo compararse limpiamente** — se topó con el fenómeno de "margen negativo" ya documentado en rondas muy anteriores del proyecto (la tasa "mid-market" oficial que usa Monito para el peso argentino no refleja la tasa realmente disponible, dado el sistema cambiario dual/paralelo de Argentina). Es un recordatorio de una limitación ya conocida, no un hallazgo nuevo — ver Sección 7.

---

## 1. Kenia recalculada en sus tres destinos con la fórmula corregida

### 1.1 Por qué

La corrección metodológica de la ronda anterior (subestimación del costo real cuando hay comisión fija) se aplicó a Kenia→Reino Unido, revelando que la cifra "4.01%" citada desde v20 en realidad correspondía a Skrill, y que el verdadero costo de Mukuru ahí es 8.64%. Esta ronda se completó el resto de los destinos de Kenia ya probados en rondas anteriores (Alemania, EEUU) con la misma fórmula.

### 1.2 Resultados

| Destino | Monto | Comisión | Tasa aplicada | Tasa media | Recibe | % mostrado por Monito | Costo real |
|---|---|---|---|---|---|---|---|
| Reino Unido | 200,000 KES | 3,922 KES | 0.005338 | 0.005730 | 1,047 GBP | 6.84% | **8.64%** |
| EEUU | 200,000 KES | 1,980 KES | 0.007147 | 0.007726 | 1,415 USD | 7.49% | **8.43%** |
| Alemania | 200,000 KES | 9,524 KES | 0.006309 | 0.006667 | 1,202 EUR | 5.38% | **9.85%** |

Los tres fueron verificados con el enlace `go.monito.com/mukuru` correspondiente.

### 1.3 Interpretación

Con las cifras corregidas, Kenia deja de ser "el país intermedio" que sugería la tabla original de v22 y pasa a ser uno de los corredores más caros de Mukuru en general (8.43-9.85%, según destino), en el mismo rango que Zambia (4.99-8.93%) y cerca de Botsuana/Uganda. La variación por destino dentro de Kenia (8.43% a 9.85%, un rango de 1.4 puntos) es moderada — ni tan plana como Sudáfrica (1.86-3.27%) ni tan marcada como la de Lesotho (1.2%-5.21%, ver Sección 4).

---

## 2. Skrill queda exento de la corrección — y se puede explicar por qué

### 2.1 Verificación

Se probó Skrill Kenia→Alemania (200,000 KES, mismo corredor y monto que el Mukuru recalculado en la Sección 1) para comparar directamente los dos proveedores bajo la misma fórmula.

Resultado: comisión **$0**, tasa aplicada 0.006500, tasa media 0.006667, "2.51% peor que el tipo de cambio medio", recibe 1,300 EUR. Verificado vía `go.monito.com/skrill`.

Recalculando con la fórmula corregida: tipo de cambio medio puro habría dado 200,000 × 0.006667 = 1,333.4 EUR; el destinatario recibe 1,300 EUR. Costo real = (1,333.4−1,300)/1,333.4 = **2.51%** — **exactamente la misma cifra** que muestra Monito directamente.

### 2.2 Por qué

La fórmula de Monito subestima el costo real específicamente porque no contabiliza la comisión fija como una pérdida adicional sobre el monto original — solo mide el spread entre la tasa aplicada y la tasa media. Cuando la comisión es **cero** (como en Skrill, que construye su margen enteramente dentro del tipo de cambio, sin comisión aparte), no hay nada que la fórmula esté "olvidando": el spread cambiario ES el costo total. Por eso todas las cifras de Skrill publicadas en rondas anteriores del proyecto (que fueron uno de los ejes centrales de v19-v21) **no necesitan recalcularse** — ya eran correctas.

Esto también aclara qué proveedores sí necesitan revisión en el futuro: cualquiera con una comisión fija visible y distinta de cero (Mukuru, y la modalidad "regular" de Western Union) — no los que ya operan con comisión cero y margen íntegramente en el tipo de cambio.

---

## 3. Western Union en Bolivia: un tercer origen (Italia) amplía aún más el rango

### 3.1 Resultado

Italia→Bolivia, 1,000 EUR: comisión 10.00 EUR, tasa aplicada 13.3349, tasa media 14.0969, "5.41% peor que el tipo de cambio medio", recibe 13,202 BOB. A diferencia de España y EEUU, esta tarjeta **no mostraba ninguna oferta promocional de primera transferencia** — parece ser ya la tarifa regular directamente. Verificado vía `go.monito.com/western-union`.

Costo real recalculado: tipo de cambio medio puro habría dado 1,000 × 14.0969 = 14,096.9 BOB; el destinatario recibe 13,202 BOB. Costo real = (14,096.9−13,202)/14,096.9 = **6.35%**.

### 3.2 El rango se amplía

| Origen | Costo real (según monto) |
|---|---|
| España | 2.04% (5,000 EUR) – 2.14% (1,000 EUR) |
| EEUU | 0.62% (5,000 USD) – 1.35% (1,000 USD) |
| **Italia** | **6.35% (1,000 EUR)** |
| — | — |
| *Referencia: Chile* | *1.37-1.40%* |
| *Referencia: Argentina* | *5.12-5.35%* |

### 3.3 Interpretación honesta

Con tres orígenes probados, el rango observado para Bolivia (0.62%-6.35%) es más ancho que la diferencia entre Chile y Argentina combinados. Italia, en particular, da un costo *más alto* que el extremo inferior del rango de Argentina — lo cual complica la narrativa de "Bolivia es un punto intermedio limpio entre Chile y Argentina". Es posible que Western Union simplemente tenga estructuras de precios bastante distintas según el mercado de origen (algo ya insinuado por la diferencia EEUU/España), y que la variable relevante no sea tanto "qué tan volátil es la moneda de destino" sino "qué tan competitivo es el mercado de remesas en el país de origen específico". No se puede, con los datos actuales, seguir citando un número único para "Western Union en Bolivia" — hace falta un muestreo más sistemático (múltiples orígenes, montos y fechas) antes de usar esta cifra para cualquier conclusión firme.

---

## 4. Botsuana y Lesotho hacia un tercer destino (EEUU): el patrón no es tan simple como "Sudáfrica es cara"

### 4.1 Metodología

La ronda anterior encontró que, una vez corregidos los márgenes, Lesotho mostraba una diferencia real por destino (Sudáfrica caro, Reino Unido barato) mientras que Botsuana no (ambos destinos casi iguales, ~9.6%). Para entender mejor esta diferencia, se agregó un tercer destino — Estados Unidos — a ambos países, con el mismo monto (200,000 unidades de moneda local) usado en el resto del proyecto.

### 4.2 Resultados

| País | Destino | Comisión | Costo real |
|---|---|---|---|
| Botsuana | Reino Unido | 18,182 BWP | 9.64% |
| Botsuana | Sudáfrica | 9,524 BWP | 9.63% |
| Botsuana | **EEUU** | 3,922 BWP | **7.91%** |
| Lesotho | Reino Unido | 850 LSL | ~1.2-1.3% |
| Lesotho | **EEUU** | 3,922 LSL | **3.18%** |
| Lesotho | Sudáfrica | 10,427 LSL | 5.21% |

### 4.3 Interpretación

**Lesotho muestra un gradiente limpio de tres niveles**: Reino Unido (más barato) < EEUU (intermedio) < Sudáfrica (más caro) — 1.2%, 3.18% y 5.21% respectivamente. Este es el patrón más consistente con la idea de "el destino Sudáfrica tiene un recargo estructural" que se venía explorando desde v22.

**Pero Botsuana muestra un patrón distinto**: EEUU (7.91%) es notablemente más barato que Reino Unido y Sudáfrica, que están prácticamente empatados como los destinos más caros (9.63-9.64%). Si la teoría fuera "Sudáfrica siempre tiene un recargo", Botsuana→Sudáfrica debería destacarse como el más caro de los tres — y no lo hace; está empatado con Reino Unido, mientras que EEUU es el que se despega, siendo más barato.

**Conclusión honesta:** no hay una regla consistente entre países sobre qué destino resulta más barato en Mukuru. Lesotho y Botsuana — dos países vecinos, ambos pequeños, ambos dependientes económicamente de Sudáfrica — muestran jerarquías de destino completamente distintas entre sí. Esto sugiere que el costo de cada corredor específico responde a decisiones comerciales puntuales de Mukuru (quizás relacionadas con el volumen de remesas en cada ruta, la infraestructura de pago disponible, o acuerdos con socios locales en cada país receptor) más que a un patrón geográfico o cambiario generalizable. La hipótesis del "recargo hacia Sudáfrica", planteada como posible explicación general en v22-v23, queda **descartada como regla universal** — aunque sigue siendo válida como observación específica de Lesotho.

---

## 5. Rwanda: séptimo país de Mukuru — y una búsqueda sin éxito fuera de África

### 5.1 Metodología

Se buscó ampliar la muestra de países de Mukuru más allá del clúster ya conocido (África austral y oriental), probando países fuera de África: Pakistán→Reino Unido y Filipinas→Reino Unido, ninguno con Mukuru entre los proveedores. También se probó Tanzania→Reino Unido y Senegal→Francia (dentro de África, pero fuera del clúster ya mapeado), tampoco con éxito. Finalmente se probó Rwanda→Reino Unido.

### 5.2 Resultado

Rwanda→Reino Unido (200,000 RWF): comisión 5,143 RWF, tasa aplicada 0.000478, tasa media 0.000503, "5.05% peor que el tipo de cambio medio", recibe 93.14 GBP. Verificado vía `go.monito.com/mukuru` — único proveedor.

Costo real recalculado: tipo de cambio medio puro habría dado 200,000 × 0.000503 = 100.6 GBP; recibe 93.14 GBP. Costo real = (100.6−93.14)/100.6 = **7.42%**.

### 5.3 Interpretación

Rwanda es el séptimo país de Mukuru confirmado en el proyecto, con un costo real (7.42%) en el rango medio del grupo — más barato que Kenia (8.43-9.85%) y Botsuana/Uganda (7.52-9.64%), pero más caro que Sudáfrica (1.86-3.27%) y la mayoría de los destinos de Lesotho. Sigue sin encontrarse evidencia de que Mukuru opere como proveedor de origen fuera de África subsahariana dentro de la cobertura de Monito — los siete países confirmados hasta ahora (Sudáfrica, Kenia, Zambia, Botsuana, Lesotho, Uganda, Rwanda) están todos en esa región. Esto no significa necesariamente que Mukuru no opere en otros mercados en la realidad — como ya se vio con Namibia (Sección 4 de v23), la ausencia en Monito puede reflejar un vacío de cobertura del agregador, no de Mukuru como empresa.

---

## 6. Western Union en Bolivia: dos orígenes más amplían el rango a 0.62%-9.16%

### 6.1 Resultados

| Origen | Monto | Comisión | Costo real |
|---|---|---|---|
| Argentina | 500,000 ARS | 25,000 ARS (cash pickup) | **9.16%** |
| Brasil | 2,000 BRL | 30.00 BRL | **3.62%** |

**Argentina→Bolivia**: tasa aplicada 0.007682, tasa media 0.008034, recibe 3,649 BOB (cash pickup). Costo real = (500,000×0.008034 − 3,649) / (500,000×0.008034) = (4,017.0−3,649)/4,017.0 = 9.16%.

**Brasil→Bolivia**: tasa aplicada 2.3330, tasa media 2.3844, recibe 4,596 BOB. Costo real = (2,000×2.3844 − 4,596)/(2,000×2.3844) = (4,768.8−4,596)/4,768.8 = 3.62%.

Ambos verificados vía `go.monito.com/western-union`.

### 6.2 El rango completo, con cinco orígenes

| Origen | Costo real |
|---|---|
| EEUU | 0.62% – 1.35% |
| España | 2.04% – 2.14% |
| Brasil | 3.62% |
| Italia | 6.35% |
| **Argentina** | **9.16%** |

### 6.3 Interpretación

El hallazgo más llamativo es que **Argentina→Bolivia (9.16%) es más caro que el propio rango de Argentina para sí misma como destino** (5.12-5.35%, el otro extremo de la comparación Chile/Argentina original). Es decir, enviar dinero DESDE Argentina hacia Bolivia cuesta más, proporcionalmente, que enviar dinero HACIA Argentina desde Chile o España. Esto podría reflejar que Argentina, como origen, tiene un mercado de remesas salientes hacia países vecinos mucho menos desarrollado/competitivo que su mercado de remesas entrantes (mucho mayor en volumen, dada la diáspora argentina).

Con cinco orígenes y un rango de 0.62% a 9.16% — más de 8 puntos porcentuales de diferencia —, queda completamente descartado seguir citando un "margen de Western Union en Bolivia" como si fuera un número único. La variable que más parece importar no es el destino (Bolivia) sino el mercado de origen específico, lo cual es coherente con lo que reveló también la Sección 3 de esta misma ronda.

---

## 7. Chile y Argentina desde un nuevo origen: Chile confirma estabilidad, Argentina se topa con un problema ya conocido

### 7.1 Chile desde Italia: confirma el rango original

Italia→Chile (1,000 EUR): comisión regular 1.99 EUR, tasa aplicada 1071, tasa media 1087, recibe (regular) 1,068,802 CLP. Costo real = (1,000×1087 − 1,068,802)/(1,000×1087) = (1,087,000−1,068,802)/1,087,000 = **1.67%**.

Este valor está cerca del rango ya establecido para Chile (1.37-1.40%, presumiblemente medido desde otros orígenes en rondas anteriores) — una diferencia de apenas un cuarto de punto porcentual. **Esto confirma que el margen de Western Union en Chile es razonablemente estable entre orígenes**, a diferencia de lo que se encontró para Bolivia en las Secciones 3 y 6. Es una buena noticia para la robustez del hallazgo original del proyecto (Chile/Argentina como comparación controlada limpia).

### 7.2 Argentina desde Italia: el problema del "margen negativo" reaparece

Italia→Argentina (1,000 EUR): tasa aplicada (tanto promocional como regular) 1850 ARS/EUR, tasa "media" mostrada por Monito: 1752 ARS/EUR. Con comisión regular de 35 EUR, el destinatario recibe 1,785,638 ARS.

Aplicando la fórmula de costo real: 1,000×1752 = 1,752,000 ARS de valor a tipo de cambio medio puro, pero el destinatario recibe **1,785,638 ARS — más de lo que el tipo de cambio "medio" indicaría**, lo cual da un costo real negativo (imposible de interpretar como "más barato que el mercado" de forma literal).

Esto es el mismo fenómeno de "margen negativo" ya identificado y documentado en una ronda muy anterior del proyecto (ver plan de rondas previas, tarea "investigar a fondo el patrón de margen negativo"): la tasa "mid-market" que XE/Monito reporta para el peso argentino no necesariamente refleja la tasa a la que el dinero es realmente convertible, dado el sistema cambiario argentino con múltiples tasas (oficial, financiera, blue, etc.) que ha existido en distintas formas durante años. Por esta razón, **no es posible aplicar la fórmula de costo real de forma confiable a corredores en pesos argentinos** sin antes resolver qué tasa de referencia usar — un problema estructural de la fuente de datos, no del método de cálculo en sí. Se documenta esto como recordatorio, no como hallazgo nuevo, y significa que el rango "5.12-5.35%" citado para Argentina en el proyecto debe leerse con esta salvedad en mente.

---

## 8. Tabla consolidada — 37 países/casos

*(Rwanda es el único país nuevo esta ronda — fila #37. Se actualizan además las celdas de Kenia, Botsuana, Lesotho y Bolivia con las cifras corregidas y los nuevos destinos/orígenes probados en ambas rondas de este archivo.)*

| # | País/caso | Dato/margen actualizado (costo real, fórmula corregida donde aplica) | Nota |
|---|---|---|---|
| 37 | Rwanda | Mukuru: 7.42% (200,000 RWF → Reino Unido) | Séptimo país de Mukuru, nuevo esta ronda — Sección 5 |
| — | Kenia | Mukuru: 8.43% (EEUU) – 8.64% (Reino Unido) – 9.85% (Alemania) | Corregido en la ronda anterior — Sección 1. Cifras previas (4.01%-6.84%) subestimaban el costo real |
| — | Kenia (Skrill) | 2.51% (Alemania, 200,000 KES) — sin cambios | Skrill no necesita corrección — Sección 2 |
| — | Botsuana | Mukuru: 7.91% (EEUU) – 9.63% (Sudáfrica) – 9.64% (Reino Unido) | Sección 4 |
| — | Lesotho | Mukuru: ~1.2-1.3% (Reino Unido) – 3.18% (EEUU) – 5.21% (Sudáfrica) | Sección 4; gradiente consistente de tres niveles |
| — | Bolivia | WU, cinco orígenes: 0.62-1.35% (EEUU) – 2.04-2.14% (España) – 3.62% (Brasil) – 6.35% (Italia) – 9.16% (Argentina) | Secciones 3 y 6; rango de más de 8 puntos porcentuales, sin número representativo único |
| — | Chile | WU: 1.37-1.40% (orígenes previos) – 1.67% (Italia, nuevo esta ronda) | Sección 7; confirma estabilidad entre orígenes, a diferencia de Bolivia |
| — | Argentina | WU: 5.12-5.35% (rango citado en el proyecto) — **con salvedad**: la tasa "media" del peso argentino no es confiable como referencia (ver Sección 7.2) | Sección 7; no recalculado con la fórmula de costo real por el problema de la tasa mid-market oficial vs. real |

---

## 9. Plan sugerido para la próxima ronda

1. ~~Buscar un séptimo país de Mukuru~~ — **Completado esta ronda con Rwanda** (7.42% hacia Reino Unido). Se buscó también fuera de África (Pakistán, Filipinas) sin éxito — el clúster de Mukuru sigue confinado a África subsahariana oriental/austral dentro de la cobertura de Monito.
2. ~~Ampliar el muestreo de Western Union en Bolivia~~ — **Completado esta ronda con Argentina y Brasil.** El rango se amplió a 0.62%-9.16% — con cinco orígenes tan dispares, queda descartado definitivamente citar un número único para Bolivia.
3. ~~Revisar si Argentina y Chile tienen el mismo problema de variabilidad por origen~~ — **Completado esta ronda.** Chile se confirma estable (1.67% desde Italia, cerca del rango 1.37-1.40%). Argentina no pudo verificarse limpiamente por el problema ya conocido de la tasa "mid-market" oficial vs. la tasa realmente disponible — ver Sección 7.2.
4. **PRIORIDAD ALTA, pendiente de rondas anteriores — recalcular con la fórmula correcta todos los márgenes de Mukuru publicados en v20-v22** que aún no pasaron por la auditoría (Kenia a otros montos de v21, y cualquier otra cifra histórica). Zambia y Uganda ya fueron confirmados como correctamente calculados en la segunda ronda de v23, así que ese ítem del plan anterior queda resuelto.
5. **Buscar un patrón que explique por qué Lesotho tiene un gradiente de destino limpio y Botsuana no** — sigue sin explicación; sería valioso investigar si Mukuru tiene distintos socios de pago/agentes según el país receptor.
6. **Resolver la referencia de tasa "mid-market" para el peso argentino** antes de poder aplicar la fórmula de costo real a cualquier corredor en ARS — esto afecta no solo a la comparación Western Union sino a cualquier futuro corredor en pesos argentinos que se quiera auditar con la misma fórmula.
7. **Considerar si vale la pena seguir ampliando el muestreo de Bolivia** o si, dada la variabilidad ya observada, es más productivo aceptar que no hay un "margen de Bolivia" único y cerrar esa línea de investigación con esa conclusión.
8. **Recordatorio de carga a Supabase:** Rwanda (esta ronda) y todas las cifras de Kenia/Botsuana/Lesotho ya están calculadas con la fórmula correcta y son aptas para carga. Bolivia y Argentina requieren las salvedades documentadas en este archivo antes de cargarse.
9. Sigue en pie la sugerencia de consolidar el hilo completo (37 países/casos) en un documento de referencia independiente.


---

## research-findings-2026-09-03-v25-addendum.md

<!-- Contenido verbatim del research entregado por el usuario -->

# Research findings — 2026-09-03 (v25 addendum)

> **Documento nuevo — para cargar DESPUÉS de v16-v24.** Este archivo confirma en vivo, con datos frescos de Monito, dos correcciones que en el instructivo de carga (`INSTRUCTIVO-carga-v16-a-v24.md`) habían quedado marcadas como "recálculo de escritorio, pendiente de verificación": el "santo grial" original Western Union Chile/Argentina (v16) y la supuesta exención de Skrill en Kenia (v24). **Ambas correcciones ahora están confirmadas con mediciones en vivo, con el tipo de cambio medio leído directamente en pantalla — ya no son estimaciones.** Además suma un país nuevo (Tanzania) y una ronda de búsqueda de candidatos nuevos, en su mayoría negativa.

---

## 0. Resumen de esta ronda

- **Confirmado en vivo: el margen histórico de Western Union Chile→España (1.37-1.40%) y Argentina→EEUU (5.12-5.35%) — citado sin cambios desde v16 durante 8 rondas — subestima el costo real.** El costo real medido ahora, con el tipo de cambio medio que Monito muestra directamente (no derivado): **Chile→España ≈3.25%** y **Argentina→EEUU ≈10.10%** — en ambos casos, aproximadamente el doble de la cifra histórica. Ver Sección 1.
- **Confirmado en vivo: Skrill en Kenia NO está exenta de la corrección metodológica**, contra lo que decía v24. Los dos corredores originales y más citados (Kenia→Reino Unido, Kenia→EEUU) cobran una comisión fija real y su costo real es de **7.73%-8.28%**, no el 5.99%-7.37% que muestra Monito. La "exención" de v24 se probó solo en un corredor con comisión $0 (Kenia→Alemania) y no se puede generalizar. Ver Sección 2.
- **Tanzania se suma como país nuevo con cobertura activa** — OFX, el mismo tipo de proveedor "de relleno" que en Egipto/Sri Lanka/Pakistán/México, con comisión $0 y margen 8.21% hacia Reino Unido. Ver Sección 3.
- **Ronda de búsqueda de países candidatos, mayormente negativa**: Myanmar, Laos, Bangladesh, Vietnam, Paraguay, Mongolia y Camboya no tienen ningún proveedor en Monito en su moneda local. Además se identificó un patrón nuevo: **algunos países no tienen moneda local disponible en Monito en absoluto** — Zimbabue y la República Democrática del Congo aparecen únicamente en USD (economías dolarizadas de facto), y Sudán del Sur aparece en GBP por defecto — estos casos quedan fuera del alcance del hilo "moneda volátil → margen" porque no hay margen cambiario que medir en su propia moneda. Ver Sección 4.

---

## 1. Western Union Chile→España y Argentina→EEUU: confirmación en vivo de la corrección al "santo grial" original

### 1.1 Por qué se repitió esta medición

El instructivo de carga (armado en la ronda anterior) detectó, releyendo los datos crudos ya publicados en v16, que el mismo sesgo de subestimación de costo (comisión fija no incluida en el "% peor que el tipo de cambio medio" de Monito) parecía afectar también a la comparación fundacional del proyecto: Western Union Chile vs. Argentina. Esa detección fue un recálculo de escritorio con el tipo de cambio medio aproximado a partir del propio porcentaje sesgado — no una medición nueva. Esta ronda se repitió la medición en vivo para confirmarlo con datos limpios.

### 1.2 Chile→España, Western Union — resultado en vivo

Corredor probado: 100.000 CLP → España, con el mismo monto que v16.

| Dato | Valor |
|---|---|
| Tipo de cambio medio (mostrado directamente por Monito, fuente XE.com) | 1 CLP = 0,000919 EUR |
| Proveedor | Western Union |
| Comisión | 2.100 CLP (idéntica a la de v16) |
| Tipo de cambio aplicado | 0,000908 |
| Recibido | 88,91 EUR |
| % mostrado por Monito ("peor que el tipo medio") | 1,09% |
| **Costo real (fórmula corregida)** | **1 − 88,91/(100.000×0,000919) = 3,25%** |

**El costo real es prácticamente el triple del que muestra Monito, y confirma con datos frescos el recálculo preliminar del instructivo (~3,45% con los datos de v16).** La comisión de Western Union en este corredor se mantuvo estable en 2.100 CLP desde v16 hasta hoy.

### 1.3 Argentina→EEUU, Western Union — resultado en vivo

Corredor probado: 100.000 ARS → EEUU, con el mismo monto que v16. **Los datos crudos resultaron ser prácticamente idénticos a los de v16** (mismo tipo de cambio aplicado, misma comisión, mismo monto recibido) — es decir, Monito le sigue mostrando a los usuarios una medición que no se actualizó en el tiempo transcurrido desde v16.

| Dato | Valor |
|---|---|
| Tipo de cambio medio (mostrado directamente por Monito, fuente XE.com) | 1 ARS = 0,000662 USD |
| Proveedor | Western Union |
| Comisión | 5.000 ARS (5%) |
| Tipo de cambio aplicado | 0,000627 |
| Recibido | 59,52 USD |
| % mostrado por Monito | 5,35% |
| **Costo real (fórmula corregida)** | **1 − 59,52/(100.000×0,000662) = 10,10%** |

**El costo real casi duplica el 5,35% publicado**, confirmando con precisión el recálculo preliminar del instructivo (~10,1%-10,2%).

### 1.4 Verificación cruzada con Global66 (comisión $0) — validación interna del método

En el mismo corredor Argentina→EEUU, Monito también mostró a Global66 (comisión FREE, tipo de cambio 0,000627 — idéntico al de Western Union, recibido 62,72 USD, 5,24% mostrado). Como la comisión es $0, la fórmula corregida no debería moverle el número:

```
1 − 62,72/(100.000×0,000662) = 5,26%
```

**5,26% calculado vs. 5,24% mostrado por Monito — coinciden casi exactamente (diferencia de redondeo).** Esto es una validación interna fuerte: confirma que la fórmula funciona correctamente y que el tipo de cambio medio de 0,000662 que muestra Monito para el ARS es internamente consistente entre los dos proveedores del mismo corredor, no un artefacto de un solo dato.

### 1.5 Nota sobre la confiabilidad de la tasa media del ARS

Esta medición en particular pasó la prueba de consistencia interna de la Sección 1.4, así que se trata como confiable **para este corredor específico**. Esto no resuelve el problema estructural más amplio documentado en rondas anteriores (v24 §7.2): en otros corredores con origen Argentina, la tasa "media" de Monito puede llevar a resultados sin sentido (costo real negativo). La recomendación de la Sección 5 del instructivo (no generalizar ningún resultado en ARS sin volver a verificar caso por caso) sigue vigente — esta medición puntual está confirmada, pero no debe tomarse como que "el problema del ARS está resuelto" en general.

### 1.6 Actualización de estado para el instructivo de carga

**Estos dos valores dejan de ser "preliminares, pendientes de recalculo confirmado" y pasan a ser CONFIRMADOS.** Actualizar la Sección 3.1 del instructivo:

| Corredor | Valor histórico (v16-v24, con sesgo) | Costo real confirmado |
|---|---|---|
| Chile→España, WU | 1,37%-1,40% | **3,25%** |
| Argentina→EEUU, WU | 5,12%-5,35% | **10,10%** |

---

## 2. Skrill en Kenia: confirmación en vivo de que la "exención" de v24 no es general

### 2.1 Kenia→Reino Unido, Skrill — resultado en vivo

| Dato | Valor |
|---|---|
| Tipo de cambio medio (Monito, en vivo) | 1 KES = 0,005723 GBP |
| Comisión | 635 KES (misma que en v19/v20) |
| Tipo de cambio aplicado | 0,005386 |
| Recibido | 171,09 GBP |
| % mostrado por Monito | 5,99% (el tipo de cambio se movió desde v19/v20, cuando mostraba 6,81%) |
| **Costo real (fórmula corregida)** | **1 − 171,09/(32.400×0,005723) = 7,73%** |

### 2.2 Kenia→EEUU, Skrill — resultado en vivo

| Dato | Valor |
|---|---|
| Tipo de cambio medio (Monito, en vivo) | 1 KES = 0,007726 USD |
| Comisión | 495 KES (misma que en v19) |
| Tipo de cambio aplicado | 0,007157 |
| Recibido | 354,31 USD |
| % mostrado por Monito | 7,37% |
| **Costo real (fórmula corregida)** | **1 − 354,31/(50.000×0,007726) = 8,28%** |

### 2.3 Interpretación

En ambos corredores, la comisión de Skrill (635 KES y 495 KES) es idéntica a la de v19/v20 — no cambió. Lo que cambió es el tipo de cambio de mercado, y por eso el % que muestra Monito bajó (de 6,81% a 5,99%, de 7,4% a 7,37%) — pero **el costo real, una vez corregido, es más alto que ambos números mostrados, tanto los históricos como los actuales**: ~7,7%-8,3% real, en la misma familia de magnitud que Mukuru en los mismos corredores kenianos (8,4%-8,6%, ver instructivo Sección 2).

**Conclusión confirmada:** la exención de v24 fue un error de generalización, no un error de cálculo — el único corredor probado ahí (Kenia→Alemania, 200.000 KES) genuinamente tiene comisión $0 y no necesita corrección, pero eso no dice nada sobre los otros dos corredores de Skrill en Kenia, que sí tienen comisión fija y sí estaban subestimados.

### 2.4 Actualización de estado para el instructivo de carga

Actualizar la Sección 3.2 del instructivo — estos valores pasan de "preliminar" a **CONFIRMADO**:

| Corredor | Valor mostrado por Monito (histórico y actual) | Costo real confirmado |
|---|---|---|
| Kenia→Reino Unido, Skrill | 6,81% (v19/v20) / 5,99% (hoy) | **7,73%** (hoy) |
| Kenia→EEUU, Skrill | 7,4% (v19) / 7,37% (hoy) | **8,28%** (hoy) |
| Kenia→Alemania, Skrill | 2,51% | 2,51% — sin cambios, comisión $0 confirmada (v24) |

---

## 3. Tanzania: nuevo país con cobertura activa (octavo país "de relleno" del proyecto, vía OFX)

Corredor probado: Tanzania→Reino Unido, 500.000 TZS.

| Dato | Valor |
|---|---|
| Proveedor | OFX (mismo bróker "de relleno" que en Egipto, Sri Lanka, Pakistán, México — v18) |
| Comisión | Gratis |
| Tipo de cambio medio | 1 TZS = 0,000280 GBP |
| Tipo de cambio aplicado | 0,000257 |
| Recibido | 128,50 GBP |
| % mostrado por Monito | 8,21% peor que el tipo medio |
| **Costo real** | **8,21% — coincide exactamente con lo mostrado, porque la comisión es $0** |

Tanzania se suma al grupo de países donde OFX es el único proveedor disponible ("de relleno"), con un margen notablemente alto (8,21%) — de hecho el más alto del grupo OFX medido hasta ahora (Egipto 4,14%-7,54%, Pakistán/Sri Lanka de rondas anteriores, México 2,5%-4,04% dependiente del monto). Como con el resto de corredores de OFX, este dato es seguro de cargar tal cual porque la comisión es $0 — no necesita la corrección de la Sección 1 del instructivo.

**Nota:** solo se encontró cobertura hacia Reino Unido — no se probó aún hacia otros destinos (EEUU, Alemania) para ver si el patrón "mismo proveedor, mismo origen, distinto destino" se repite como en Egipto/Kenia. Queda como ítem de plan.

---

## 4. Búsqueda de nuevos países candidatos: mayormente cobertura cero, y un patrón nuevo (países "dolarizados de facto")

### 4.1 Cobertura cero confirmada (sin ningún proveedor en su moneda local)

| País | Moneda | Corredor probado | Resultado |
|---|---|---|---|
| Myanmar | MMK | →Reino Unido y →EEUU | Sin proveedores en ninguno de los dos destinos |
| Laos | LAK | →EEUU | Sin proveedores |
| Bangladesh | BDT | →Reino Unido y →EEUU | Sin proveedores en ninguno de los dos destinos |
| Vietnam | VND | →Reino Unido | Sin proveedores |
| Paraguay | PYG | →España y →EEUU | Sin proveedores en ninguno de los dos destinos |
| Mongolia | MNT | →Reino Unido | Sin proveedores — ni siquiera hay tipo de cambio medio disponible para el par |
| Camboya | KHR | →EEUU | Sin proveedores |

Mecanismo probable, consistente con el patrón ya documentado del proyecto: son economías con controles de capital fuertes (Myanmar, bajo régimen militar desde el golpe de 2021 y sancionado internacionalmente), mercados de remesas dominados por operadores informales/regionales que Monito no indexa (el sudeste asiático en general — Laos, Vietnam, Camboya — tiene un mercado de remesas muy fragmentado, poco cubierto por los comparadores web occidentales que arma Monito), o simplemente volumen de búsquedas insuficiente para que Monito les asigne cobertura (Paraguay, Mongolia).

### 4.2 Patrón nuevo: países sin moneda local disponible en Monito ("dolarización de facto" en el sistema del comparador)

Un hallazgo distinto a la cobertura cero: al buscar Zimbabue, Monito **no ofrece ninguna moneda zimbabuense como opción** (ni el dólar zimbabuense ZWL ni el ZiG, la moneda introducida en 2024) — el selector de país asigna automáticamente **USD** como la única moneda de origen disponible. Lo mismo ocurre con la **República Democrática del Congo** (asigna USD, no el franco congoleño CDF). **Sudán del Sur** es un caso más raro todavía: el selector le asigna **GBP** por defecto, sin ninguna opción de libra sursudanesa (SSP).

**Por qué esto importa para el proyecto:** estos tres países tienen algunas de las historias monetarias más extremas del planeta (Zimbabue con la hiperinflación más famosa de la historia reciente; el Congo con una crisis cambiaria crónica; Sudán del Sur con una libra que perdió la enorme mayoría de su valor desde la independencia) — serían candidatos obvios para el hilo "moneda volátil → margen". **Pero no se puede medir un margen cambiario en un país donde Monito no ofrece la moneda local como opción de envío** — la comparación que arma la plataforma para esos tres países es, en la práctica, una comparación en USD o GBP entre países que ya usan esa moneda, no una comparación de conversión de moneda volátil a moneda estable. Quedan fuera del alcance de este hilo de investigación, no por falta de proveedores, sino porque la pregunta que el proyecto busca responder no aplica ahí.

**Recomendación:** no cargar Zimbabue/Congo (RDC)/Sudán del Sur en ninguna tabla de "margen por país de moneda volátil" — no hay margen cambiario que atribuirles con los datos disponibles en Monito.

---

## 5. Tabla consolidada — actualización de esta ronda

*(Solo se listan los cambios de esta ronda. Para la tabla completa de 37 países/casos ver v24 §8, con las correcciones de v23 §10 y de este archivo aplicadas encima.)*

| # | País/caso | Dato/margen actualizado | Nota |
|---|---|---|---|
| 38 | Tanzania | OFX: 8.21% (Reino Unido, 500.000 TZS) | País nuevo esta ronda — Sección 3 |
| — | Chile (WU) | Costo real confirmado en vivo: **3.25%** (antes 1.37-1.40% mostrado por Monito) | Sección 1.2 — corrección CONFIRMADA, ya no preliminar |
| — | Argentina (WU) | Costo real confirmado en vivo: **10.10%** (antes 5.12-5.35% mostrado por Monito) | Sección 1.3 — corrección CONFIRMADA, con salvedad de alcance (Sección 1.5) |
| — | Kenia (Skrill, Reino Unido) | Costo real confirmado en vivo: **7.73%** | Sección 2.1 — corrección CONFIRMADA, no exenta |
| — | Kenia (Skrill, EEUU) | Costo real confirmado en vivo: **8.28%** | Sección 2.2 — corrección CONFIRMADA, no exenta |
| — | Zimbabue, Congo (RDC), Sudán del Sur | Fuera de alcance — sin moneda local disponible en Monito | Sección 4.2 — no cargar como países del hilo |
| — | Myanmar, Laos, Bangladesh, Vietnam, Paraguay, Mongolia, Camboya | Cobertura cero confirmada | Sección 4.1 |

---

## 6. Plan sugerido para la próxima ronda

1. **Actualizar el instructivo de carga** (`INSTRUCTIVO-carga-v16-a-v24.md`) con las confirmaciones de las Secciones 1 y 2 de este archivo — los dos casos que estaban "pendientes de recálculo confirmado" ya están confirmados, y deberían pasar a la tabla maestra de correcciones (Sección 2 del instructivo) en vez de a la sección de casos preliminares.
2. **Probar Tanzania hacia otros destinos** (EEUU, Alemania) para ver si el patrón "mismo proveedor, mismo origen, distinto destino" se repite, como con Egipto y Kenia.
3. **Revisar si el mismo patrón de "país sin moneda local disponible" de la Sección 4.2 aplica a otros países con dolarización de facto** — candidatos: Ecuador (ya dolarizado formalmente, esperado), El Salvador (dolarizado formalmente, esperado), Panamá (dolarizado formalmente, esperado) — estos son casos esperados y no aportarían nada nuevo, pero convendría revisar países con dolarización *informal* pero no oficial (Líbano ya se sabe que tiene cobertura cero por la sanción regulatoria, no por esto; Venezuela también cobertura cero por sanciones OFAC — pero valdría la pena revisar si además tiene este problema de moneda no disponible una vez que la cobertura se restablezca).
4. **Ampliar la búsqueda de países candidatos más allá del sudeste asiático y Sudamérica** — esta ronda fue mayormente negativa en esas dos regiones; probar Asia Central (Uzbekistán, Kazajistán ya se sabe que existe como opción de país — no se probó como origen con moneda volátil) y el Cáucaso (Armenia, Georgia).
5. Sigue en pie la sugerencia de consolidar el hilo completo en un documento de referencia independiente — con la corrección del "santo grial" original confirmada esta ronda, ese documento de referencia ahora tendría que reescribir la conclusión central del proyecto (la brecha Chile/Argentina sigue siendo real y grande, pero las magnitudes absolutas cambian sustancialmente respecto a lo que se citó desde v16).
6. **Recordatorio de carga a Supabase:** Tanzania (esta ronda) es apta para carga directa. Las correcciones de Chile/Argentina/Skrill-Kenia ya están confirmadas y deberían sobrescribir cualquier valor viejo ya cargado de v16 o v19/v20. Zimbabue/Congo/Sudán del Sur no deberían cargarse como países del hilo de moneda volátil.

