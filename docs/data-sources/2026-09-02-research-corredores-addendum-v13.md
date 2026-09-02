# Research corredores — addendum v13 (2026-09-02)

## Nota de estado (agregada al cargar este documento al repo)

Este archivo es el research entregado por el usuario como
`researchfindings20260902v13addendum.md` (ADDENDUM #7 / v13 del research
de corredores) — el más corto de la serie, una sola ronda, subido en el
mismo momento que **v12** (`researchfindings20260902v12addendum.md`) y
procesado junto con él como una única sesión de carga. A diferencia de
v9-v11 (donde cada archivo corregía al anterior), v13 **no corrige nada
de v12 ni de v11** — abre un país de origen completamente nuevo (China)
sin tocar ningún hallazgo previo. **Se cargaron 2 filas nuevas en
`fx_rates`**, en migración `20260902150500_load_v13_corridor_rates.sql`
(migración separada de la de v12 para mantener el mapeo 1 archivo de
research → 1 migración usado en v8-v11).

### Lo que se cargó a Supabase (2 filas nuevas, 0 filas tocadas/borradas)

- **China→Filipinas, Wise** (`sin_confirmar`): fee explícito 27,38 CNY,
  tipo de cambio aplicado 9,3178 CNY/PHP — verificado aritméticamente en
  el propio research contra el monto final mostrado. Confirma, en un país
  nuevo, el patrón ya establecido de Wise en el proyecto (sin margen
  oculto en el tipo de cambio, todo el costo va en el fee declarado;
  `public_spread_percent = 0`). Primera fila del proyecto con **China
  como país de origen** (antes solo aparecía como destino, en filas
  CA-CN/JP-CN/KR-CN/US-CN de una carga genérica anterior). Cero filas
  previas para este corredor exacto.
- **China→Pakistán, OFX** (`sin_confirmar`): sin fee, tipo de cambio
  aplicado 39,3105 CNY/PKR vs. mid-market 41,2656 (ambos dados
  explícitamente por el research, con el monto final coincidiendo exacto
  con la aritmética). Margen 4,74%. Se cargó **con la advertencia de la
  propia fuente incluida en el comentario de la fila**: Monito muestra
  solo "5 comparaciones en los últimos 3 meses" para este corredor — el
  volumen de uso más bajo de cualquier corredor cargado hasta ahora en el
  proyecto. A diferencia del dato de Corea del Sur descartado en v12
  (Sección 6.2, ver ese documento), acá el research da una tasa y un fee
  explícitos verificables con aritmética exacta, no solo el badge de
  porcentaje de Monito — por eso se decidió cargar esta cifra (con la
  advertencia de volumen bajo documentada) mientras que la de Corea del
  Sur se dejó solo documentada.

### Contexto no cargado a `fx_rates` (hallazgo regulatorio, no un dato de tarifa)

**Sección 1.2 — controles de capital en China (cuota SAFE de ~USD
50.000/año):** el research encuentra, con dos fuentes independientes
adicionales (Bloomberg 2-jun-2026 y un blog legal sobre endurecimiento
del control de cambios desde el 1-ene-2026), que la cobertura delgada de
Monito para China (1 solo proveedor por corredor, igual que Corea del
Sur) tiene una explicación regulatoria real y verificable — a diferencia
de Corea del Sur, donde la cobertura delgada quedó sin explicar en v12.
Es un hallazgo de contexto valioso (explica por qué casi ningún proveedor
de remesas de consumo masivo opera transferencias salientes personales
desde China) pero no es un dato cargable a `fx_rates` — no hay tabla ni
campo para "cuota regulatoria anual de origen" en el esquema actual. El
propio research recomienda que, si se quiere profundizar remesas
salientes de China, la vía correcta sea investigar directamente canales
bancarios institucionales sujetos a la cuota SAFE — un producto distinto
al resto del proyecto (apps de remesas de consumo masivo), posiblemente
fuera de alcance. Se deja documentado como contexto para una decisión
futura, no como un pendiente de carga.

### Candidatos evaluados que no están en `providers`

Ninguno — los dos proveedores mencionados en este archivo (Wise, OFX) ya
existen en `providers`.

### Duplicado/discrepancias a señalar explícitamente

Ninguna — China es un país de origen completamente nuevo para el
proyecto (cero filas previas con China como `sending_country` en toda la
base), así que ninguna de las 2 filas de esta ronda choca con estado
existente.

---

A continuación, el contenido completo del research tal como fue
entregado.

---

# mangomundi — Research, ADDENDUM #7 (v13) — China como origen: cobertura delgada por controles de capital, no por falta de datos

> **Documento nuevo — no reemplaza a v6, v7, v8, v9, v10, v11, v12 ni a
> `research-findings-2026-09-01.md`.** El usuario avisó que ya está
> cargando v12 a Supabase vía otra sesión de Claude. Este es un noveno
> archivo con **solo lo nuevo de esta ronda**. Para el panorama completo
> hacen falta los 9 juntos.
>
> **Contexto importante para quien cargue este archivo a Supabase:** el
> archivo v11 (Sección 31) documentó una corrección metodológica
> importante sobre tasas promocionales de Monito.com — ver ese archivo
> para el detalle. Este archivo (v13) sigue la misma metodología
> corregida desde el inicio para los datos nuevos (usar el monto bajo/
> real cuando Monito muestra dos).
>
> **Primera versión.** Se abrió **China como país de origen nuevo para
> el proyecto** vía Monito, y se encontró un hallazgo distinto a los de
> Nueva Zelanda/Hong Kong/Japón: la cobertura es muy delgada (1 solo
> proveedor por corredor, igual que Corea del Sur) — pero, a diferencia
> de Corea del Sur, **hay evidencia independiente y verificable de que
> esto refleja un límite regulatorio real (controles de capital), no
> solo una laguna de datos de Monito.** Ver Sección 1.

Repo: `aleviercas/mangomundi` · Supabase project_id: `ttqalbexpquzobrdyvgx`
Fecha: 2026-09-02 (continuación de v6-v12, mismo día)

---

## 0. Lo nuevo de esta ronda (resumen)

1. **China abierta como país de origen, con cobertura muy delgada en
   Monito (1 proveedor por corredor)** en los dos corredores probados
   (China→Filipinas: Wise; China→Pakistán: OFX). Ver Sección 1.1.
2. **A diferencia de Corea del Sur (v12, Sección 6.2), la cobertura
   delgada de China tiene una explicación verificada e independiente:
   China limita las transferencias personales al exterior a
   aproximadamente USD 50.000 anuales por individuo, con permiso
   obligatorio de la Administración Estatal de Divisas (SAFE) para
   montos mayores** — un control de capital real, no un problema de
   Monito. Esto probablemente explica por qué casi ningún proveedor de
   remesas de consumo masivo opera transferencias salientes de China.
   Ver Sección 1.2.
3. **Wise en China→Filipinas confirma, una vez más, que aplica el tipo
   de cambio mid-market real** (sin margen oculto, solo el fee
   explícito) — coherente con el patrón ya documentado de Wise en el
   proyecto. Ver Sección 1.3.

---

## 1. China — nueva región de origen, cobertura delgada pero por una razón distinta a Corea del Sur

### 1.1 Los dos corredores probados

| Corredor | Proveedor único | Datos | Costo real |
|---|---|---|---|
| China→Filipinas | Wise | Fee 27,38 CNY, tipo de cambio 9,3178, 9.063 PHP de 1.000 CNY | ~0% (tipo de cambio = mid-market, solo el fee explícito) |
| China→Pakistán | OFX | Sin fee, tipo de cambio 39,3105 (mid-market 41,2656), 786.210 PKR de 20.000 CNY, solo 5 comparaciones en 3 meses | ~4,74% |

Ambos corredores muestran **un solo proveedor comparable** en Monito —
igual que Corea del Sur (v12, Sección 6.2) y muy por debajo de los
5-20 proveedores encontrados en Canadá, Australia, Nueva Zelanda, Hong
Kong y Japón. El corredor China→Pakistán, además, tiene un volumen de
uso extremadamente bajo según el propio Monito ("5 comparaciones en los
últimos 3 meses", contra cientos o miles en los demás corredores
abiertos este proyecto).

Ambos datos son limpios (sin insignia promocional, un solo monto cada
uno), así que no hay corrección que aplicar por el problema de doble
monto — el costo real calculado coincide de cerca con la insignia de
Monito en ambos casos.

### 1.2 Por qué la cobertura es delgada: una hipótesis verificada, a diferencia de Corea del Sur

Cuando se encontró cobertura delgada en Corea del Sur (v12, Sección
6.2), no se pudo determinar si la causa era una limitación de datos de
Monito o algo estructural del mercado — quedó como una pregunta
abierta. Para China, en cambio, hay una explicación verificable con una
fuente independiente: **Wikipedia, citando la normativa de la
Administración Estatal de Divisas (SAFE) china, indica que un
individuo puede transferir alrededor de USD 50.000 en moneda extranjera
por año, y que montos mayores requieren un permiso explícito de SAFE**
(fuente: Wikipedia, "Capital controls in China", sección sobre límites
a individuos). Esto es un control de capital real y activo, no una
regla en desuso — la búsqueda también encontró cobertura de prensa de
2026 (Bloomberg, "How China's Wealthy Move Money Overseas Despite a
Strict Annual $50,000 Limit", 2 de junio de 2026) confirmando que el
límite sigue vigente y sigue siendo una restricción real que la gente
busca maneras de sortear, y un blog legal (sinoblawg.com) que reporta
que China está **endureciendo aún más el control de cambios a partir
del 1 de enero de 2026** — es decir, la tendencia regulatoria va hacia
más restricción, no menos.

**Implicación para el proyecto:** la cobertura delgada de China en
Monito probablemente no es un problema de la fuente de datos, sino un
reflejo fiel de la realidad — hay muy pocos proveedores de remesas de
consumo masivo (tipo Remitly, MoneyGram, Wise personal) que ofrezcan
transferencias salientes personales desde China, precisamente porque el
mercado está fuertemente restringido por el gobierno chino. Esto es
distinto de Corea del Sur, donde no hay evidencia de una restricción
regulatoria equivalente y la cobertura delgada podría deberse
simplemente a que Monito tiene menos acuerdos comerciales con
proveedores en ese país. **Recomendación: si se quiere profundizar
remesas salientes de China, la vía correcta no es buscar más
proveedores en Monito (probablemente no existen para el consumidor
masivo), sino investigar directamente los canales institucionales/
bancarios sujetos a la cuota de SAFE, que es un producto distinto al
que cubre el resto del proyecto.**

### 1.3 Wise reconfirma su patrón de tipo de cambio mid-market real

En China→Filipinas, Wise cobra un fee explícito (27,38 CNY sobre 1.000
CNY, ~2,7%) pero aplica un tipo de cambio prácticamente idéntico al
mid-market (verificación: (1.000 - 27,38) CNY × 9,3178 = 9.061,98 PHP,
contra los 9.063 PHP mostrados — la diferencia es solo redondeo). Esto
confirma, en un país más, el patrón ya documentado en el proyecto de
que Wise no aplica margen oculto en el tipo de cambio, solo su fee
declarado — a diferencia de la mayoría de los demás proveedores
medidos.

---

## 2. Plan sugerido para la próxima ronda

1. La línea de "payroll internacional" sigue cerrada (heredado de v11,
   Sección 3).
2. El patrón "bancos tradicionales caros" sigue confirmado y cerrado
   (heredado de v11).
3. **Mukuru**, **Lulu Money**, **Xoom** y **TransferGo** siguen
   catalogados como proveedores de margen fuertemente variable.
4. **InstaReM** tiene 9 corredores medidos (-0,43% a 1,30%) — dado por
   cerrado como caso de referencia.
5. ~~Abrir China vía Monito.~~ **Hecho en la Sección 1** — cobertura
   delgada, pero con una explicación verificada (controles de capital,
   cuota SAFE de USD 50.000/año), a diferencia de la cobertura delgada
   sin explicar de Corea del Sur.
6. **Nuevo pendiente, baja prioridad:** si se quiere profundizar remesas
   salientes de China más allá de Wise/OFX, investigar directamente los
   canales bancarios institucionales sujetos a la cuota SAFE — un
   producto distinto al resto del proyecto (retail remittance apps),
   posiblemente fuera de alcance.
7. **Nuevo pendiente:** aplicar la misma pregunta ("¿la cobertura
   delgada refleja una restricción regulatoria real?") retroactivamente
   a Corea del Sur — buscar si Corea del Sur tiene alguna restricción de
   cambio de divisas para individuos que explique su cobertura delgada,
   o si de verdad es solo una laguna de datos de Monito.
8. Sigue sin identificarse una vía nueva para profundizar SBI Remit o
   Taptap Send — pendiente de baja prioridad.
9. **Recordatorio para la carga a Supabase:** este archivo (v13) debe
   leerse junto con v11 (Sección 31, corrección metodológica) y v12
   (auditoría retroactiva + regiones nuevas) — juntos documentan el
   estado completo de la metodología corregida y las regiones abiertas
   esta sesión (Nueva Zelanda, Hong Kong, Corea del Sur, Japón, China).
10. Posibles candidatos de región nueva para una próxima ronda: México
    (como origen hacia Centroamérica), o profundizar más corredores
    dentro de las regiones ya abiertas en vez de seguir sumando países
    nuevos con cobertura cada vez más marginal.
