# Research findings — 2026-09-09 (v26)

> **Continúa el hilo "moneda volátil → margen de remesas"**, retomando el plan sugerido en
> `research-findings-2026-09-03-v25-addendum.md` Sección 6 y en
> `CONCLUSIONES-moneda-volatil-margen-v16-v25.md` Sección 10. **Esta ronda NO cargó nada a
> Supabase** — es investigación pura, igual que v16-v25. Arrancó desde una sesión de chat
> sin browser interactivo y, a mitad de ronda, se conectó TinyFish (agente de browsing) para
> destrabar las mediciones en vivo. Ver Sección 4 para el detalle de qué se pudo medir con
> cada herramienta.

---

## 0. Resumen de esta ronda

- **Tanzania → otros destinos: medido en vivo.** OFX mantiene un margen inusualmente
  estable entre destinos (8.07%-8.21%, comisión $0 en los tres). Apto para carga directa.
  Ver Sección 1.
- **Asia Central/Cáucaso: los datos ya cargados son placeholders genéricos sin auditar**
  (spreads redondos de 2%/2.5% repetidos en corredores sin relación), y **varios de esos
  corredores ya no tienen ningún proveedor visible en Monito hoy** (Rusia como destino:
  cobertura cero total; Georgia→Turquía: cobertura cero; Kazajistán como origen: error
  consistente, posible país no soportado). Esto no confirma que el dato cargado esté mal,
  pero sí que **no se puede verificar con la misma herramienta que usó el resto del
  proyecto**. Ver Sección 2.
- **Venezuela: medido en vivo, y aparece el mismo problema que el ARS, más marcado.** El
  tipo de cambio que aplica el único proveedor disponible (Remitly) es *mejor* que el
  "tipo de cambio medio" que muestra Monito — la fórmula de costo real daría un resultado
  negativo sin sentido, igual que ya pasó con corredores puntuales del ARS. No es un dato
  cargable todavía. Ver Sección 3.

---

## 1. Tanzania → otros destinos (EEUU, Alemania) — medido en vivo

### 1.1 Por qué hizo falta browser interactivo

Se intentó primero reproducir esto con `web_fetch` sobre las páginas públicas de tasas de
OFX. No sirvió: `ofx.com/en-us/exchange-rates/tzs/` solo expone la **tasa Market/Interbank**
de referencia — la propia página lo dice explícitamente: *"The amounts above are calculated
using the Market (Interbank) rate and are not indicative of OFX Customer Rates. Simply
register or log in for OFX Customer Rates."* La tasa real de cliente está detrás de un
login, y no hay forma de leerla con una herramienta de solo lectura de páginas estáticas.

Igual que en v16-v25, la vía que sí funciona es Monito (tarjetas de comparación con tasa
aplicada + tasa media, sin necesitar cuenta) — pero es una calculadora interactiva que
necesita cargar un monto/corredor y esperar el render. Eso requirió conectar TinyFish (el
agente de browsing) a mitad de esta ronda.

### 1.2 Medición: 500.000 TZS → EEUU y → Alemania, vía OFX

| Corredor | Comisión | Tipo aplicado | Tipo medio (Monito) | Recibido | % mostrado por Monito | Costo real |
|---|---|---|---|---|---|---|
| Tanzania→Reino Unido (v25, ya cargado) | $0 | — | — | — | 8.21% | 8.21% |
| Tanzania→EEUU (esta ronda) | $0 | 0.000348 USD/TZS | 0.000379 USD/TZS | 174.00 USD | 8.07% | ≈8.18% |
| Tanzania→Alemania (esta ronda) | $0 | 0.000299 EUR/TZS | 0.000326 EUR/TZS | 149.50 EUR | 8.14% | ≈8.28% |

**Apto para carga directa** — comisión $0 en los tres casos, no necesita la corrección de
la Sección 2 del instructivo (el % que muestra Monito ya es el costo real).

**Patrón nuevo, distinto al de Egipto:** en Egipto el margen de OFX varía fuerte según
destino (4.14%-7.54%, casi el doble entre extremos — v16-v18). En Tanzania el margen es
**notablemente estable entre los tres destinos** (8.07%-8.21%, un rango de apenas 0.14pp) —
sugiere que OFX le aplica a Tanzania un margen de "país de origen" más que un margen de
"ruta específica". Es un dato cualitativo nuevo que no estaba en el proyecto hasta ahora,
y que podría valer la pena as verificar en otros países de OFX (¿Egipto es la excepción o
Tanzania lo es?).

---

## 2. Asia Central y Cáucaso — placeholders sin auditar, y varios corredores sin cobertura hoy

### 2.1 Lo que ya está cargado en Supabase

| Origen | Destino | Proveedor | Fee | Spread cargado | Fuente |
|---|---|---|---|---|---|
| Armenia (AM) | Rusia (RU) | western-union | 500 | 2.5% | World Bank RPW Q3 2025 |
| Armenia (AM) | Rusia (RU) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise (2026-09-02) |
| Azerbaiyán (AZ) | Turquía (TR) | western-union | 5 | 2.5% | World Bank RPW Q3 2025 |
| Azerbaiyán (AZ) | Turquía (TR) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise |
| Georgia (GE) | Turquía (TR) | western-union | 5 | 2.5% | World Bank RPW Q3 2025 |
| Georgia (GE) | Turquía (TR) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise |
| Kazajistán (KZ) | Rusia (RU) | western-union | 500 | 2% | World Bank RPW Q3 2025 |
| Kazajistán (KZ) | Rusia (RU) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise |
| Kazajistán (KZ) | Uzbekistán (UZ) | western-union | 500 | 2% | World Bank RPW Q3 2025 |
| Kazajistán (KZ) | Uzbekistán (UZ) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise |
| Kazajistán (KZ) | Uzbekistán (UZ) | paysend | 0 | 1.5% | Direct research Aug 2025 (paysend.com) |
| Uzbekistán (UZ) | Rusia (RU) | western-union | 5000 | 2.5% | World Bank RPW Q3 2025 |
| Uzbekistán (UZ) | Rusia (RU) | wise | 0 | 0% | RPW, corregido a 0% por patrón Wise |

Los spreads de Western Union en toda la región son **2% o 2.5%, siempre un número redondo
repetido** en corredores sin relación entre sí — no se parece a ninguna medición viva del
proyecto (todas dieron números específicos con decimales irregulares: 3.25%, 7.73%, 5.10%).
Es la firma de un **valor de relleno genérico del batch original de RPW Q3 2025**, no de la
metodología de costo real de la Sección 2 del instructivo. La corrección de Wise a 0% en
toda la región (2026-09-02) tampoco está verificada corredor por corredor — se apoya en un
patrón confirmado en un corredor completamente distinto (China→Filipinas, v13).

### 2.2 Intento de medición en vivo — resultado: cobertura cero en 2 de 2 corredores probados

Con TinyFish se intentó verificar en vivo dos de las filas ya cargadas:

- **Armenia→Rusia y Georgia→Rusia:** Monito devuelve, sin excepciones, *"We couldn't find
  any providers who'd transfer to Russia in Russian rubles (RUB)"*. Rusia como destino
  **no tiene ningún proveedor visible en Monito hoy**.
- **Georgia→Turquía:** mismo resultado — *"We couldn't find any providers who'd transfer to
  Turkey in Turkish liras (TRY)"*.
- **Kazajistán como país de origen** (probado hacia Uzbekistán y hacia Alemania): en vez de
  un mensaje de "sin proveedores", ambos intentos devolvieron un error de ejecución sin
  llegar a renderizar resultados — señal distinta, posiblemente Kazajistán ya no está en la
  lista de países de origen que soporta el selector actual de Monito. **No confirmado del
  todo** (un error de automatización no es lo mismo que un mensaje explícito de "no
  disponible"); queda para reintentar antes de sacar una conclusión firme.

**Esto no dice que las filas cargadas en Supabase estén mal** — dice que **no se pueden
verificar ni refutar con la misma herramienta que usó el resto del proyecto, en este
momento**. Vale la pena dejarlo anotado para quien decida si esas filas necesitan
re-auditarse por otra vía (otro comparador, o contacto directo con los proveedores).

### 2.3 Recomendación para la próxima ronda

1. Buscar un comparador alternativo a Monito para la región (o contactar directamente a
   Western Union/Wise) ya que Monito parece haber perdido cobertura de RUB como destino y
   de Kazajistán como origen — probablemente por el mismo tipo de de-risking/sanciones que
   ya afecta a otros corredores del proyecto (Sección 7 de las conclusiones v16-v25).
2. Si se encuentra otra vía de medición, confirmar o refutar tanto los "2%/2.5% parejos" de
   Western Union como el "0% asumido" de Wise para al menos un corredor real de la región.
3. Explorar direcciones no probadas todavía: Kazajistán/Uzbekistán como países *receptores*
   de remesas desde Rusia (dirección inversa a lo ya cargado, y con más volumen real de
   remesas que la dirección actual).

---

## 3. Venezuela — de "cobertura cero por sanciones" a "medido, pero con alarma metodológica"

### 3.1 Qué cambió desde el cierre del proyecto

Al cierre de v25 (2026-09-03), el documento de conclusiones registraba a Venezuela como
cobertura cero por sanciones OFAC, "recién levantadas al momento del cierre del proyecto".
Una búsqueda de esta ronda (fuente: riotimesonline.com, 15-abr-2026) agregó contexto: OFAC
emitió una licencia el 15 de abril de 2026 que cubre transferencias en dólares, banca
corresponsal, procesamiento de pagos, envío y recepción de remesas, desembolsos de sueldos
y pensiones, transacciones de billeteras digitales, y participación en mercados de cambio —
para cuatro instituciones nombradas explícitamente: Banco Central de Venezuela, Banco de
Venezuela, Banco Digital de los Trabajadores y Banco del Tesoro. Venezuela cerró 2025 cerca
de 500% de inflación y la tasa siguió subiendo en 2026, con algunos economistas advirtiendo
sobre un posible regreso a la hiperinflación.

Con TinyFish se confirmó además que **VES sí está disponible como moneda nativa** en el
selector de Monito para Venezuela (a diferencia de Zimbabue/Congo/Sudán del Sur, que fuerzan
USD/GBP — Sección 4.2 de v25). Venezuela no cae en ese mecanismo de "moneda no disponible".

### 3.2 Medición en vivo: 200 USD → Venezuela (VES)

| Dato | Valor |
|---|---|
| Proveedor (único disponible en esta ruta) | Remitly |
| Comisión | 0 USD (débito/transferencia bancaria) / 4 USD (tarjeta de crédito) |
| Tipo de cambio aplicado | 1 USD = 930.19 VES |
| Tipo de cambio "medio" que muestra Monito | 1 USD = 815.72 VES |
| Recibido (débito/transferencia) | 186.038 VES |
| % que muestra Monito | **14.03% MEJOR que el tipo medio** (no peor) |

### 3.3 Por qué esto es una alarma metodológica, no un dato bueno para cargar

El tipo de cambio que Remitly aplica (930,19 VES/USD) es *más alto* que el "tipo de cambio
medio" de referencia que usa Monito (815,72 VES/USD) — el proveedor está pagando más
bolívares por dólar que el supuesto "promedio de mercado". Es el mismo síntoma que el
instructivo ya documentó para el ARS (Sección 6): cuando un país tiene un régimen de tipo
de cambio dual/paralelo, la tasa "media" que usan Monito/XE puede estar anclada a una tasa
oficial artificialmente distinta de la que efectivamente opera el mercado. Acá el efecto es
más fuerte que en cualquier corredor de ARS visto hasta ahora — la fórmula de costo real
daría un "costo negativo" de -14%, en vez del margen alto que la hiperinflación venezolana
haría esperar.

**No se debe tratar esto como un dato cargable todavía.** Antes de confiar en cualquier
número de Venezuela hace falta la misma verificación de consistencia interna que validó el
dato de Argentina→EEUU en v25 §1.4 (comparar contra un segundo proveedor de comisión $0 en
el mismo corredor) — acá apareció **un solo proveedor**, así que esa verificación cruzada
todavía no se puede hacer con lo que ofrece Monito hoy para esta ruta específica.

### 3.4 Recomendación para la próxima ronda

1. Repetir la búsqueda en otro momento / con otro monto, a ver si aparece un segundo
   proveedor que permita la verificación cruzada.
2. Si persiste un solo proveedor, buscar una referencia de tipo de cambio paralelo
   venezolano independiente de Monito (ej. algún tipo de referencia tipo "DolarToday" u
   otra fuente pública) para tener con qué contrastar.
3. Documentar esto como una instancia más, y más extrema, del "problema estructural de
   referencia cambiaria en países con régimen dual" — no es exclusivo del ARS.

---

## 4. Nota metodológica sobre esta sesión

Esta ronda empezó sin browser interactivo — pudo usar `web_search`/`web_fetch` (páginas
estáticas, World Bank RPW, sitios de proveedores) y consultas directas a Supabase, pero no
podía manejar calculadoras que requieren cargar un monto y esperar que rendericen un
resultado (Monito, la vista de cliente logueado de OFX). A mitad de ronda se conectó
TinyFish (agente de browsing), lo que permitió completar las mediciones de Tanzania y
Venezuela, y confirmar la falta de cobertura actual en varios corredores de Asia
Central/Cáucaso.

**No se ejecutó ningún `execute_sql`/`apply_migration` de escritura en Supabase durante
esta ronda** — solo lectura para verificar qué ya estaba cargado (Sección 2.1). No se tocó
`kayakclone` ni ningún archivo del repo — sigue sin haber acceso a GitHub desde esta sesión.

---

## 5. Resolución del problema estructural ARS/VES — con dolarapi.com

### 5.1 El hallazgo

El "tipo de cambio medio" que muestra Monito para ARS y VES **está anclado al tipo de
cambio oficial**, no al tipo de cambio paralelo/de mercado real — en países con régimen de
cambio dual, esto produce exactamente el tipo de resultado sin sentido que el instructivo
ya advertía para el ARS (Sección 6) y que esta ronda encontró de forma extrema con
Venezuela (Sección 3): un "costo negativo" del -14%.

Se encontró una fuente pública, gratuita, sin autenticación, con datos en tiempo real que
resuelve esto: **dolarapi.com** (proyecto open source, agrega BCV/Yadio para Venezuela y
DolarHoy/Ámbito Financiero para Argentina). Cubre Argentina, Chile, Venezuela, Uruguay,
México, Bolivia, Brasil y Colombia — con subdominios regionales (`ve.dolarapi.com`,
`cl.dolarapi.com`, etc.) y sin necesidad de API key.

### 5.2 Verificación con los datos de Venezuela de esta misma ronda (Sección 3.2)

```
GET https://ve.dolarapi.com/v1/dolares  (consultado 2026-09-09)
[
  { "fuente": "oficial",  "promedio": 820.10 },
  { "fuente": "paralelo", "promedio": 926.01 }
]
```

- El "tipo de cambio medio" que mostró Monito (815.72 VES/USD) está **a 0.5% del oficial
  BCV (820.10)** — confirma que Monito usa la referencia oficial, no la de mercado real.
- La tasa que aplicó Remitly (930.19 VES/USD) está **a 0.5% del paralelo (926.01)** — el
  proveedor está cotizando cerca del valor de mercado real, no "regalando" nada.

**Recalculando el costo real contra la referencia correcta (paralelo, no oficial):**

```
costo_real = 1 − 186.038 / (200 × 926.013) = 1 − 186.038/185.203 = −0.45%
```

De -14% "sin sentido" pasa a **-0.45%**, un número creíble (Remitly cotizando prácticamente
a la par del mercado paralelo, sin margen visible en este canal específico). **Esto sí es
cargable** — pero como spread ligeramente negativo/neutro con nota metodológica explícita
de qué referencia se usó, no como el -14% original.

### 5.3 Corrección retroactiva sugerida (no aplicada — solo research)

El mismo sesgo puede estar afectando, en menor magnitud, los corredores de ARS ya cargados.
Con los datos en vivo de esta ronda:

```
GET https://dolarapi.com/v1/dolares  (consultado 2026-09-09)
oficial: compra 1480 / venta 1530  (mid ≈ 1505)
blue:    compra 1525 / venta 1545  (mid ≈ 1535)
mayorista: compra 1503 / venta 1512 (mid ≈ 1507.5)
```

El "tipo medio" implícito en la medición de WU AR→US de v25 (≈1510.6 ARS/USD, derivado de
`rate`/`tipo_medio` cargados) está mucho más cerca de **oficial/mayorista** (~1505-1507.5)
que de **blue** (~1535) — mismo patrón que Venezuela, con una brecha oficial/blue mucho más
angosta hoy (~2%) que la brecha oficial/paralelo de Venezuela (~13%). Por eso el efecto en
el costo real cargado de Argentina es menor, pero **no es cero** — vale la pena recalcular
los corredores ARS ya cargados contra `dolarapi.com` antes de darlos por definitivos.

### 5.4 Recomendación operativa (para cuando se implemente)

1. **Para cualquier corredor con origen o destino en Argentina o Venezuela, usar
   `dolarapi.com`/`ve.dolarapi.com` como fuente de tipo de cambio de referencia — no el
   "tipo medio" que muestra Monito.** Documentar en `data_source` qué tasa exacta
   (oficial/blue/paralelo/mayorista, con timestamp) se usó como referencia.
2. Este mismo patrón vale la pena chequearlo para los otros 6 países que cubre dolarapi.com
   (Chile, Uruguay, México, Bolivia, Brasil, Colombia) si en algún momento se cargan
   corredores con esos orígenes.
3. Esta fuente ya está referenciada en `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`
   del repo (Sección 4.2) como solución propuesta para el mismo problema — vale la pena que
   el archivo consolidado de esta investigación la cite cruzada con ese documento.

---

## 6. Asia Central/Cáucaso — por qué Monito no tiene cobertura: se identificó la causa raíz

Después de confirmar (Sección 4'.2-4'.4, y una tercera confirmación de Kazajistán-origen con
error consistente en 3 de 3 intentos) que Monito no tiene ningún proveedor para Rusia como
destino ni para Kazajistán como origen, se investigó **por qué**.

### 6.1 El motivo no es que falte data — es que se está siguiendo el proveedor equivocado

Monito es un comparador centrado en proveedores occidentales (Western Union, Wise, Remitly,
OFX, etc.). Pero el mercado real de remesas Rusia↔Asia Central/Cáucaso está dominado por
sistemas nativos de la CEI (Comunidad de Estados Independientes) — **Zolotaya Korona
(KoronaPay), Unistream, Contact** — que juntos cubrían más del 70% del mercado ya antes de
2022, y ganaron participación después porque Visa/Mastercard suspendieron operaciones en
Rusia y las redes occidentales de remesas se retiraron del corredor. Monito, como
comparador occidental, simplemente no indexa estos proveedores para esta ruta — por eso
devuelve "sin proveedores", no porque no haya mercado.

### 6.2 Pero ni siquiera el proveedor nativo está disponible hoy

Se intentó verificar directamente con KoronaPay (koronapay.com) — el jugador dominante de
la región. **El sitio muestra un aviso de que Koronapay Europe Limited está en proceso de
retiro voluntario de su autorización regulatoria y ya no ofrece transferencias nuevas.**
No hay calculadora disponible, no hay forma de medir un margen ahí tampoco.

Esto se suma a otro hallazgo de contexto (Sección 2023, RFE/RL): bancos de Kazajistán,
Kirguistán, Uzbekistán, Tayikistán, Armenia y Georgia **suspendieron cooperación con
Unistream** por presión de sanciones sobre bancos corresponsales — es decir, incluso los
canales CEI nativos vienen sufriendo su propia disrupción, no solo los occidentales.

### 6.3 Conclusión para el proyecto

El corredor Rusia↔Asia Central/Cáucaso está en un estado de disrupción activa por los dos
lados: los proveedores occidentales que el proyecto normalmente audita (y que Monito
indexa) no operan ahí, y el proveedor nativo dominante de la región está cerrando su
operación regulada internacional justo en este momento. **No hay, hoy, ninguna fuente
digital verificable desde afuera de Rusia para medir el margen real de este corredor** con
la metodología que usa el resto del proyecto. Las remesas probablemente siguen fluyendo por
canales informales, en efectivo, o por apps que solo operan dentro de Rusia y no son
verificables desde acá.

**Recomendación:** dejar esta región marcada explícitamente como "cobertura no verificable
por disrupción de mercado" en vez de seguir insistiendo con Monito — es un mecanismo
distinto a "cobertura cero por sanciones formales" (Líbano, Venezuela pre-abril 2026) o
"mercado informal no indexado" (Sección 7 de las conclusiones v16-v25): acá el mercado
formal existe pero está en transición activa y ningún comparador externo lo captura bien
en este momento.
