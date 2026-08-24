# Mangomundi — Diagnóstico y arquitectura de datos de proveedores/corredores

**Fecha:** 24 agosto 2026
**Alcance:** auditoría del código (`aleviercas/mangomundi`) + datos (Supabase `ttqalbexpquzobrdyvgx`) + research externo sobre fuentes de datos de remesas/FX.

---

## 1. Resumen ejecutivo

El caso puntual que reportaste (Western Union UK→Argentina desaparecido) **tiene una causa exacta y verificable en el código y en los datos** — no es un bug al azar, es una consecuencia directa y previsible de cómo se integraron los datos del World Bank. Lo diagnostiqué con evidencia (sección 2).

La causa raíz de fondo: el motor pasó de un modelo "todo proveedor cubre todo corredor con una tarifa genérica" (impreciso pero con cobertura 100%) a un modelo "un proveedor tipo Western Union/MoneyGram/Ria solo aparece si hay una fila exacta de datos para ESE corredor específico" (preciso pero con cobertura limitada a lo que ya se cargó a mano). El World Bank cubre **367 corredores fijos, elegidos por volumen** — de un universo de miles de rutas reales — y UK→Argentina no es uno de ellos. El resultado: para cualquier corredor fuera de esos 367 (o de las ~140 filas cargadas por research manual), los especialistas en remesas simplemente no aparecen, aunque sí operen esa ruta en la vida real.

La buena noticia es que el equipo (vos + un agente anterior de Claude Code) ya construyó la mitad de la solución: hay un feature flag (`ENABLE_CORRIDOR_FILTERING`), un campo `is_corridor_specific` por proveedor, y hasta una tabla `corridor_notes` pensada exactamente para documentar huecos de cobertura (sanciones, proveedor faltante). Lo que falta es (a) que un corredor sin datos no signifique "proveedor invisible" sino "dato marcado como no verificado", (b) conectar `corridor_notes` a la UI/consulta real (hoy no se usa en ningún lado del código), y (c) una fuente de datos viva que no dependa de investigar corredor por corredor a mano.

También encontré algo con mucho potencial para el objetivo de "mejor comparador del mundo": **Wise publica una Comparison API** — una API pensada específicamente para comparadores como mangomundi, que devuelve tarifas y spreads de Wise Y de sus competidores, actualizada aproximadamente cada hora, para transferencias banco-a-banco. Es el tipo de fuente que podría reemplazar buena parte del trabajo manual de "Direct research Aug 2026" que hoy se hace uno por uno.

---

## 2. Diagnóstico confirmado — por qué desapareció Western Union en UK→Argentina

**Evidencia, paso a paso:**

1. En `providers`, Western Union tiene `is_corridor_specific: true`. Esto significa (según el propio comentario del código en `fx.functions.ts`): *"solo se muestra cuando `fx_rates` tiene una fila para la ruta exacta"*.
2. En `fx_rates` hay 754 filas, pero **cero** filas con `sending_country='GB' AND receiving_country='AR'` — de ningún proveedor, no solo de Western Union. El corredor UK→Argentina no existe en la base hoy, punto.
3. El motor de comparación (`compareProviders` en `src/lib/fx.functions.ts`) hace esto exactamente:
   ```ts
   const eligibleProviders = ENABLE_CORRIDOR_FILTERING
     ? providers.filter(p => !p.is_corridor_specific || corridorRates.has(p.slug))
     : providers;
   ```
   Si `is_corridor_specific` es `true` y no hay fila en `fx_rates` para ese corredor exacto, **el proveedor se excluye del resultado por completo** — no se degrada a una tarifa genérica, desaparece.
4. De los 754 registros de `fx_rates`, **611 (81%) vienen de "World Bank RPW Q3 2025"**. El resto son investigaciones manuales puntuales ("Direct research Aug 2026...") hechas corredor por corredor.
5. Confirmé en la fuente oficial que el World Bank Remittance Prices Worldwide (RPW) **no intenta cubrir todos los corredores posibles** — cubre exactamente **367 corredores fijos, de 48 países emisores a 105 receptores**, elegidos por volumen de remesas, no por cobertura universal. UK→Argentina no está entre los que trackea (Argentina recibe sus corredores trackeados por el Bank principalmente desde España/Italia/EE.UU., no desde UK).
6. Dato de contexto: Western Union **sí opera activamente** ese corredor — tiene página propia (`westernunion.com/gb/en/send-money-to-argentina.html`). El proveedor real existe; el dato de precio en la base, no.
7. **Confirmación adicional, directa en la fuente del Banco Mundial**: la página del propio corredor en el sitio de RPW (`remittanceprices.worldbank.org/corridor/United-Kingdom/Argentina`) devuelve una tabla vacía — "Total Average First Quarter 1970", todo en 0.00 — que es literalmente el placeholder que usa su sistema cuando no hay datos cargados para ese corredor. Es la prueba más directa posible de que el Banco Mundial nunca trackeó esta ruta.

### ⚠️ Corrección sobre una cifra que se había pasado antes

El dato de *"Western Union, $0 de comisión hasta USD 50.000"* que se pasó en la primera versión de este análisis **está mal y se retira**. Vino de un agregador de terceros (remitanalyst.com) que — al revisarlo de nuevo — describe esa cifra en dólares (USD), consistente con pricing de EE.UU., no con el corredor GBP→ARS real. Es exactamente el tipo de error que pasa cuando se cita una fuente secundaria en vez de la fuente primaria del proveedor — y es la razón por la que la arquitectura propuesta (sección 5) insiste en citar siempre la fuente primaria con fecha, nunca un agregador sin verificar contra el sitio real.

Fuimos directo a las dos páginas oficiales de Western Union UK (`send-money-to-argentina.html` y `money-transfer-fees.html`) y **ninguna publica una tarifa fija** — WU calcula el fee y el margen de cambio de forma dinámica según monto/método, solo visible dentro de su cotizador. Lo único verificable con fuente directa y citable hoy:

| Dato | Valor confirmado | Fuente |
|---|---|---|
| Tope transferencia bancaria online | £50.000 | westernunion.com/gb/en/send-money-to-argentina.html (agosto 2026) |
| Tope tarjeta débito/crédito → cuenta bancaria | £4.000 | ídem |
| Tope retiro en efectivo en tienda | £5.000 | ídem |
| Tope retiro en efectivo online | £4.000 | ídem |
| Velocidad retiro en efectivo | "arrive in minutes" | ídem |
| Velocidad transferencia bancaria | "0-4 business days" | ídem |
| Fee exacto y margen de cambio | **no publicado** — solo vía cotizador interactivo por transacción | ídem |

Esto en sí mismo es un dato importante para la arquitectura: **WU (y varios de los MTOs grandes) no publican una tarifa única por corredor** — la tarifa depende del monto exacto. El research manual "corredor por corredor" que se venía haciendo probablemente tiene que capturar esto por rango de monto (como ya hace `fee_tiers`/`min_amount`/`max_amount` en el esquema), no como un número fijo — y cualquier research futuro debería anotar explícitamente si el número viene del sitio del proveedor mismo o de un agregador, para poder auditar casos como este.

**Conclusión:** no es un bug de matching ni un error de carga — es que el sistema, tal como está diseñado hoy, **trata "no tengo el dato" como "el proveedor no existe en esta ruta"**, en vez de "no verificado todavía". Y como el World Bank cubre menos del 10% del universo real de corredores relevantes, esto le va a pasar a más rutas además de UK→Argentina — cualquier corredor que no sea top-volumen global va a perder a sus especialistas de remesas (WU, MoneyGram, Ria, Remitly, WorldRemit, Xoom, Paysend...) y solo va a mostrar a las plataformas de cobertura amplia (Wise, Revolut, brokers, bancos), que sí usan una tarifa genérica y por eso nunca desaparecen.

Ya existe además una tabla `corridor_notes` con 4 casos documentados (Alemania→Rusia por sanciones, Alemania→Siria, Suecia→Somalia y Noruega→Somalia por proveedor faltante) — el patrón de "documentar el hueco en vez de dejarlo silencioso" ya está pensado, pero **no está conectado a ningún lado del código que consulté** (no aparece en `fx.functions.ts`) y no tiene una entrada para UK→Argentina todavía.

---

## 3. Qué es y qué no es el dataset del World Bank (RPW)

| | Detalle |
|---|---|
| Cobertura | 367 corredores fijos, 48 países emisores → 105 receptores. Selección por volumen/relevancia migratoria, no exhaustiva. |
| Método | Investigadores actuando como clientes ("mystery shopping") + scraping de APIs/webs de los proveedores. Se buscan proveedores que en conjunto cubran ≥80% del market share de cada corredor. |
| Frecuencia | Trimestral (el dataset cargado es "Q3 2025"; hay ediciones desde 2011). Es una foto fija — no vivo, no se actualiza sola. |
| Formato | Excel descargable, sin API pública. No hay endpoint para consumir en vivo. |
| Fortaleza | Es la fuente más citada y auditada del mundo para "cuánto cuesta mandar dinero" — buena para credibilidad/benchmarking (es literalmente el indicador SDG 10.c de la ONU para el costo de remesas). |
| Limitación clave para mangomundi | Al ser un panel fijo de 367 rutas, **cualquier corredor fuera de ese panel queda en cero** salvo que alguien lo investigue a mano — que es exactamente lo que pasó con UK→Argentina y le va a seguir pasando a cientos de rutas reales más. |

**Fuentes:** [Metodología RPW](https://remittanceprices.worldbank.org/methodology) · [Data download RPW](https://remittanceprices.worldbank.org/data-download) · [Reporte RPW Q3 2025](https://remittanceprices.worldbank.org/sites/default/files/2026-04/RPW_main_report_and_annex_Q325.pdf)

---

## 4. Panorama de fuentes de datos de clase mundial

| Fuente | Qué aporta | Cobertura | Costo/acceso |
|---|---|---|---|
| **World Bank RPW** (ya integrado) | Precios oficiales, citables, buena credibilidad editorial | 367 corredores fijos, trimestral | Gratis, descarga manual |
| **Wise Comparison API** (nuevo hallazgo) | Tarifas y spread de Wise **y de sus competidores**, refrescado ~cada hora, pensado específicamente para comparadores externos | No publican el número exacto de proveedores/corredores; limitado a pay-in/pay-out por transferencia bancaria (no cubre cash pickup, que es el fuerte de WU/Ria/MoneyGram) | Requiere contacto directo con Wise (`comparison@wise.com`) — no es self-serve público, hay que evaluar si aceptan partners externos como mangomundi |
| **RemitSCOPE** (Banco Mundial + CGAP/GIZ) | Agrega RPW + datos de bancos centrales + PRIME Africa; fuerte en LatAm y África | Regional (África y LatAm ya, Asia "próximamente"); explícitamente admite huecos de cobertura | Gratis, plataforma web (no confirmado si tiene API) |
| **KNOMAD / Bilateral Remittance Matrix** | Estima **volúmenes** de remesas bilaterales (no precios) — útil para priorizar qué corredores investigar primero por volumen real, no solo por lo que el WB ya trackea | Global, matriz completa país×país | Gratis, Banco Mundial |
| **APIs de FX genéricas** (Frankfurter, ExchangeRate-API, Fixer, OXR — **ya usadas en el repo**) | Tasa de mercado de referencia (mid-market), no tarifas de proveedores | Global, en vivo | Ya integradas, algunas gratis |
| **Research manual directo** (ya en uso, "Direct research Aug 2026...") | Máxima precisión cuando se hace bien, con fuente citada | No escala — es 1 corredor/proveedor por vez | Tiempo humano/IA, sin costo de licencia |
| **Sitios propios de cada proveedor** (ya usado para varios) | Fuente primaria, la más confiable | Requiere scraping/investigación por proveedor | Gratis pero manual |

**Lectura clave:** ningún dataset del mundo cubre el 100% de corredores reales con precisión verificada — ni Wise, ni el Banco Mundial, ni Monito (el comparador líder de la industria, ya usado como referencia en `docs/multi-criteria-ranking/`) resuelven esto con una sola fuente. La solución de la industria no es "encontrar la fuente perfecta", es **arquitectura de fallback en capas + transparencia sobre qué dato es de dónde** — que es exactamente el patrón que este repo ya empezó (`data_source`, `verified_status`, `data_collected_at` en `fx_rates`) pero que hoy se corta en seco cuando no hay fila.

**Fuentes:** [Wise Comparison API docs](https://docs.wise.com/api-reference/comparison) · [RemitSCOPE Methodology](https://remitscope.org/wp-content/uploads/2024/11/RemitSCOPE-Methodology-Report.pdf) · [World Bank bilateral remittance matrix](https://blogs.worldbank.org/en/peoplemove/bilateral-remittance-matrix-new)

### 4.1 Importante: qué está "conectado por API" hoy realmente

Frankfurter, ExchangeRate-API, Fixer.io, exchangeratesapi.io y Open Exchange Rates (las 5 en `src/lib/fx.functions.ts`) **solo dan la tasa de referencia del mercado interbancario** (el "mid-market rate" contra el que se mide todo lo demás). Ninguna de esas cinco sabe qué comisión o margen cobra Western Union, Wise, MoneyGram, etc. — eso es exactamente el dato que falta y que hoy se consigue solo a mano (research directo) o trimestralmente (World Bank). La Wise Comparison API es la única fuente de la lista de la sección 4 que sí devuelve precios de competidores, no solo la tasa de mercado — por eso es el hallazgo más importante.

### 4.2 Cambio de moneda dentro del mismo país (FX local) — hoy en cero, hace falta empezar de cero

El esquema de `fx_rates` **ya tiene una columna `is_local_fx boolean`** — alguien ya había anticipado este caso de uso (convertir moneda dentro de un mismo país, ej. USD↔ARS en una casa de cambio en Argentina, sin que haya ningún envío internacional de por medio). Pero hoy tiene **cero filas** — es un campo del esquema sin datos, un área completamente sin construir todavía.

Esto es un dominio de datos distinto al de remesas — cada país tiene un mercado cambiario local con su propia estructura (bancos, casas de cambio, mercado paralelo, tipos de cambio múltiples), así que no hay una fuente única global como el World Bank para esto. Para Argentina específicamente (el caso que motivó esta conversación) hay fuentes abiertas y gratuitas que ya resuelven justo este problema:

| Fuente | Qué da | Costo |
|---|---|---|
| [dolarapi.com](https://dolarapi.com/docs/argentina/) | API pública en vivo: dólar oficial, blue, MEP, CCL, tarjeta, cripto, mayorista — todos los tipos de cambio paralelos de Argentina | Gratis |
| [bluelytics.com.ar](https://bluelytics.com.ar/) | API JSON histórica + en vivo del dólar blue y oficial argentino | Gratis |
| [esjs-dolar-api](https://github.com/enzonotario/esjs-dolar-api) | La misma idea pero multi-país: Argentina, Chile, Venezuela, Uruguay, México, Bolivia, Brasil, Colombia | Gratis / open source |

Esto resuelve Argentina (y de yapa varios países de LatAm con regímenes cambiarios similares) casi gratis y en vivo. Para el resto del mundo, esto va a necesitar una investigación país por país — la mayoría de los países no tienen un "dólar blue", tienen un mercado bancario/casas de cambio más simple (ej. UK: bureaux de change como ICE, Travelex), así que la fuente y la estructura de datos van a variar mucho más que en remesas cross-border. Se marca como su propio frente de trabajo, no como algo que se resuelve con la misma receta que World Bank/Wise.

---

## 5. Arquitectura propuesta

### 5.1 Cambiar "exclusión dura" por "degradación con transparencia"

Hoy: sin fila en `fx_rates` → proveedor invisible.
Propuesta: sin fila en `fx_rates` para un proveedor `is_corridor_specific` →

1. Primero, buscar una **fila del mismo proveedor en un corredor comparable** (mismo país receptor, distinto emisor con la misma moneda — ej. si hay EUR→ARS de España para Western Union, usarla como estimado para GBP→ARS con una advertencia clara) en vez de nada.
2. Si no hay ni eso, mostrar el proveedor igual pero con un badge explícito tipo **"tarifa no verificada para esta ruta — confirmar en el sitio del proveedor"**, usando su tarifa genérica como aproximación (nunca inventando un número "verificado").
3. Nunca mezclar silenciosamente un dato estimado con uno verificado sin marcarlo — el campo `has_corridor_data` que ya existe en `ComparisonRow` es perfecto para esto, solo falta usarlo en la UI para diferenciar visualmente en vez de solo ocultar filas.

Esto es exactamente lo que ya intentó resolverse a mitad de camino con `corridor_notes` — la propuesta es generalizar ese patrón en vez de dejarlo como 4 casos manuales sueltos.

### 5.2 Conectar `corridor_notes` al motor real

Hoy esa tabla no se consulta desde `fx.functions.ts`. Propuesta: cuando `compareProviders` detecta un corredor con cobertura parcial o nula, consultar `corridor_notes` y devolver la nota al frontend (o, si no existe nota, generar automáticamente un registro en una cola de "corredores por investigar" — ver 5.4).

### 5.3 Capas de datos con prioridad explícita, no una sola fuente

```
1. Research manual verificado (data_source cita URL + fecha) — máxima confianza
2. World Bank RPW — snapshot trimestral, alta credibilidad, cobertura fija
3. Wise Comparison API (si se consigue acceso) — cobertura amplia, refresco horario, pero solo bank-to-bank
4. Tarifa genérica del proveedor (fee_percent/fee_fixed/spread_percent) — fallback, siempre marcado como estimado
```

Cada capa ya tiene su lugar natural en el esquema actual (`data_source`, `verified_status`, `is_corridor_specific`) — el trabajo es de proceso/ingesta, no de rediseñar la base desde cero.

### 5.4 Cola de "corredores faltantes" priorizada por volumen real

El código ya tiene `MasterRateStore.logMissing()` para cuando falta la tasa de cambio de mercado. Extender la misma idea a corredores de `fx_rates`: cuando un usuario busca una ruta y el resultado sale pobre (pocos o cero proveedores `is_corridor_specific`), loguearlo. Cruzar esa cola con los volúmenes de KNOMAD (sección 4) para priorizar qué investigar primero — no adivinando, sino por demanda real de la gente que usa mangomundi + volumen real de remesas mundiales.

### 5.5 Evaluar la Wise Comparison API en serio

Vale la pena escribirle a `comparison@wise.com` para entender si mangomundi califica como partner. Si da acceso, resolvería de raíz el problema de "dato desactualizado/faltante" para transferencias banco-a-banco (que son la mayoría del volumen), dejando la investigación manual solo para lo que esa API no cubre: cash pickup, mobile money, especialistas regionales (hawala, M-Pesa, etc.) — que es donde ya se venía invirtiendo research manual de todos modos.

### 5.6 Motor de búsqueda/ranking — ya está bien encaminado

`scoring.functions.ts` (sistema multi-criterio: 10 perfiles de score, normalización min-max, tie-breaks estadísticamente honestos, auditoría de Pareto-dominancia, detección de tendencia de trust score) es un diseño **sofisticado y ya de nivel "mejor del mundo"** — de hecho está mejor pensado que lo que hacen la mayoría de los comparadores públicos revisados. No se encontró nada urgente para optimizar ahí. El cuello de botella real de calidad no es el motor de ranking, es la cobertura de datos que ese motor recibe como input — un ranking perfecto sobre datos incompletos sigue dando resultados incompletos, que es exactamente el síntoma reportado.

---

## 6. Plan de acción priorizado

1. **Hecho:** research y documentación consolidados en este archivo, corrección de la cifra incorrecta de Western Union, y publicación en `docs/` del repo para que cualquier sesión de Claude con acceso lo tenga disponible sin depender de una conversación puntual.
2. **Inmediato, bajo riesgo:** cargar a mano el corredor UK→Argentina (y los corredores UK→LatAm más pedidos) para los proveedores corridor-specific relevantes, con el fee real por rango de monto (no un número fijo) y SIEMPRE citando la fuente primaria (el sitio del proveedor), nunca un agregador sin verificar.
3. **Corto plazo, cambio de código acotado:** conectar `corridor_notes` a `compareProviders` para que un corredor sin datos muestre una nota explicativa en vez de una lista vacía o incompleta sin explicación.
4. **Corto/mediano plazo:** implementar la degradación con transparencia (5.1) en vez de la exclusión dura — usa campos que ya existen (`has_corridor_data`), es más un cambio de lógica + UI que de esquema.
5. **Mediano plazo:** escribirle a Wise sobre la Comparison API; en paralelo, armar la cola de corredores faltantes priorizada por volumen (5.4) para sistematizar el research manual en vez de hacerlo reactivo a quejas de usuarios.
6. **Nuevo frente, mediano plazo:** arrancar el FX local (sección 4.2) — conectar dolarapi.com/bluelytics para Argentina como piloto (son APIs públicas, sin partnership necesario), y después decidir el orden de investigación país por país para el resto del mundo.
7. **Continuo:** seguir el patrón ya establecido en `docs/multi-criteria-ranking/` — cada dato nuevo con fuente y fecha, nunca inventado, nunca corrido contra producción sin aprobación explícita de Alejandro.

---

## 7. Qué falta confirmar antes de tocar producción

Todo lo de arriba es diagnóstico, research y documentación — no se tocó la base de Supabase, siguiendo el mismo criterio ya establecido con el agente anterior ("no se corre nada contra producción hasta que Alejandro lo apruebe explícitamente"). Antes de escribir cualquier dato nuevo en `fx_rates`/`providers` o de activar la integración con dolarapi/bluelytics en el código, falta confirmar:

- ¿Arrancar por el fix rápido de UK→Argentina y corredores UK→LatAm similares (con fuente primaria, sin la cifra incorrecta de antes)?
- ¿Escribirle a Wise (`comparison@wise.com`) para preguntar por acceso a la Comparison API, o prefiere Alejandro hacerlo directamente (a veces estas cosas avanzan más rápido con una persona real del lado del negocio)?
- Para el FX local (dólar blue/MEP/CCL): ¿se trata como una feature nueva del comparador (una pestaña separada de "conversión local" vs. "envío internacional") o como un dato más dentro del mismo flujo? Esto cambia bastante el diseño de la UI, no solo la carga de datos.
- ¿Luz verde para el cambio de código de "exclusión dura" → "degradación con transparencia", o revisarlo en una rama primero?

---

## 8. Dónde vive este documento

Este archivo (`docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`) es la fuente de verdad para este research — se actualiza in-place a medida que avanza (FX local país por país, respuesta de Wise, etc.) en vez de crear versiones sueltas, mismo criterio que ya usaban los docs de `docs/multi-criteria-ranking/`. También queda espejado en el proyecto de Claude "Mangomundi" para consulta rápida desde claude.ai.
