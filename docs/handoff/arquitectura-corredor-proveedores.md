# mangomundi — Arquitectura para cobertura de proveedores por corredor

> Análisis de arquitectura de software, producto y UX. Basado en inspección directa
> del schema real de Supabase y del código actual en `origin/main` (no en
> suposiciones) — todos los hallazgos de este documento están verificados contra
> la base de datos y el repositorio en el momento de escribir esto.

---

## 1. Diagnóstico — por qué pasa esto hoy

Verifiqué el código exacto de `compareProviders` en `src/lib/fx.functions.ts`:

```ts
const { data: providers, error } = await supabaseAdmin
  .from("providers")
  .select("*")
  .eq("active", true)
  .in("segment", [data.segment, "both"]);
```

**La consulta filtra solo por `active` y `segment` (retail/business). No hay
ningún filtro por corredor, país o moneda.** Todo proveedor activo del segmento
correcto entra en la comparación, sin importar si opera esa ruta.

Después, `resolveTier(p, data.amount)` calcula la comisión/margen a partir de:
- `fee_tiers` (jsonb) del proveedor — tramos **por monto**, no por corredor, o
- si no hay tiers, los campos planos `fee_percent` / `fee_fixed` / `spread_percent`
  de la fila del proveedor — **un solo número global, usado para cualquier ruta**

**Confirmé además que ya existen dos piezas de infraestructura pensadas para
resolver esto, pero nunca se completaron:**

| Pieza | Estado real |
|---|---|
| `providers.supported_corridors` (array) | Existe en el schema, pero es `NULL` en las 33 filas. No se usa en ningún lugar del código (`grep` sobre `fx.functions.ts` no encuentra referencias). |
| Tabla `fx_rates` | Existe con **casi el schema perfecto** para esto: `provider_slug`, `sending_country`, `receiving_country`, `from_currency`, `to_currency`, `rate`, `fee`, `public_spread_percent`, `min_amount`, `max_amount`, `affiliate_url_template`. **Tiene 0 filas.** |

Conclusión: el problema no es que falte diseñar la solución — es que la pieza
de datos correcta (`fx_rates`) nunca se pobló, y el código de comparación nunca
se conectó a ella. Esto es una ventaja: no hace falta una migración grande de
schema, hace falta **cargar datos y cablear una consulta**.

---

## 2. Principio de diseño — no todos los proveedores son iguales

Antes de tocar código, hay una distinción de producto que hay que resolver
primero, o el fix va a romper algo que hoy funciona bien:

Revisé `provider_type` (columna ya poblada) y encontré dos familias reales:

**Tipo A — Operadores de corredor específico ("app" en su mayoría, MTOs
clásicos):** WorldRemit, Remitly, MoneyGram, Sendwave, Paysend, Ria, Xoom,
TapTap Send, LemFi, NALA, Small World, Azimo, Zing. Estos **solo operan
corredores concretos** — un usuario en Portugal no puede usar TapTap Send para
mandar a Japón. Para estos, la regla correcta es: **sin fila en `fx_rates` para
ese corredor exacto → no se muestra**.

**Tipo B — Plataformas multi-moneda de alcance amplio ("broker"/bancos +
Wise/Revolut/Airwallex/OFX/etc.):** Wise, OFX, Moneycorp, CurrencyFair, Revolut,
Airwallex, TorFX, Currencies Direct, CAB Payments, HSBC, Chase, Santander,
Payoneer, Skrill, TransferGo, XE, Instarem. Estos operan sobre infraestructura
bancaria/SWIFT y **por diseño cubren casi cualquier par de monedas** — no tiene
sentido (ni es viable mantenerlo) cargar una fila de `fx_rates` por cada
corredor posible para Wise.

**Implicación directa:** aplicar la regla "sin fila en fx_rates → ocultar" a
TODOS los proveedores por igual **ocultaría a Wise** (tu afiliado más fuerte)
de cualquier corredor que todavía no cargaste manualmente. Eso sería peor que
el problema actual. La arquitectura tiene que tratar ambos tipos distinto.

---

## 3. Modelo de datos propuesto

### 3.1 Ampliar `fx_rates` (no crear una tabla nueva — ya existe la correcta)

Faltan columnas para que `fx_rates` pueda absorber los datos que ya
investigamos (World Bank RPW + tu tabla de DeepSeek):

```sql
ALTER TABLE fx_rates
  ADD COLUMN IF NOT EXISTS speed_hours_approx numeric,
  ADD COLUMN IF NOT EXISTS speed_display text,
  ADD COLUMN IF NOT EXISTS data_source text,
  ADD COLUMN IF NOT EXISTS data_collected_at date,
  ADD COLUMN IF NOT EXISTS verified_status text DEFAULT 'sin_confirmar';
  -- verified_status: 'confirmado_activo' | 'sin_confirmar' | 'confirmado_no' | 'banco_excluido'

-- Único por proveedor + corredor + tramo de monto, para permitir tiers
-- (igual que fee_tiers ya hace a nivel de producto)
CREATE UNIQUE INDEX IF NOT EXISTS fx_rates_provider_corridor_tier
  ON fx_rates (provider_slug, sending_country, receiving_country, COALESCE(min_amount, 0));
```

`is_local_fx` (ya existe) puede usarse exactamente para marcar Tipo A
(`is_local_fx = true`, corredor-específico) vs Tipo B (`false` o directamente
sin filas — se resuelve por `fee_tiers` como hoy).

### 3.2 Carga desde las dos fuentes que ya tenemos

Tu CSV (`catalogo_mundial_final.csv`, 684 filas, 37 proveedores, 219 corredores)
y toda la investigación de esta sesión (Sendwave, Paysend, Aspora, InstaReM,
iRemit, etc. con fuente documentada) mapean 1:1 a este schema. Antes de cargar,
hay que:

1. **Arreglar el encoding** — el CSV tiene doble-encoding UTF-8 (`SÃ­` en vez de
   `Sí`). Se corrige con `.encode('latin1').decode('utf-8')` en Python, lo
   verifiqué sobre el archivo real.
2. **Mapear `provider` del CSV a `providers.slug`** — algunos ya coinciden
   (Sendwave, Paysend, Ria, MoneyGram, Remitly, Wise, WorldRemit, Xoom→xoom,
   InstaReM→instarem), otros son proveedores nuevos que primero necesitan una
   fila en `providers` (Aspora, iRemit, Al Ansari, GCC Exchange, etc.) antes de
   poder referenciarlos desde `fx_rates` (FK implícita por slug).
3. **Traducir `commission_amount` + `fx_margin_percent` al mismo cálculo que ya
   usa `resolveTier()`** — mapean directo a `fee` y `public_spread_percent`,
   no hace falta reinventar la fórmula.

### 3.3 Qué hacer con `supported_corridors`

Dejarlo como **caché denormalizado derivado**, no como fuente de verdad: un
trigger o job que, cada vez que cambia `fx_rates`, recalcula el array de
`"XX-YY"` para ese proveedor. Sirve para checks rápidos de "¿este proveedor
tiene algún corredor cargado?" sin hacer un JOIN, útil en listados
administrativos, pero **la comparación real siempre debe consultar `fx_rates`
directamente**, nunca este array.

---

## 4. Capa de consulta — cambio concreto en `compareProviders`

Después de traer `providers` (como hoy), agregar una segunda consulta y un
merge:

```ts
// 1. Traer providers Tipo A con fila real para este corredor exacto
const { data: corridorRates } = await supabaseAdmin
  .from("fx_rates")
  .select("*")
  .eq("sending_country", data.sendingCountry)   // o from_currency, según cómo quede resuelto el corredor
  .eq("receiving_country", data.receivingCountry)
  .lte("min_amount", data.amount)
  .or(`max_amount.is.null,max_amount.gte.${data.amount}`);

const ratesByProvider = new Map(corridorRates?.map(r => [r.provider_slug, r]) ?? []);

// 2. Filtrar: Tipo A sin fila → afuera. Tipo B → se queda (usa fee_tiers como hoy)
const eligible = (providers as Provider[]).filter((p) => {
  const isTypeA = TYPE_A_SLUGS.has(p.slug); // o mejor: columna is_corridor_specific en providers
  if (!isTypeA) return true; // Tipo B, alcance amplio, sigue como está hoy
  return ratesByProvider.has(p.slug);        // Tipo A, exige dato real del corredor
});

// 3. Si hay fila de fx_rates, usarla en vez de fee_tiers/flat fields
const rows = eligible.map((p) => {
  const corridorRate = ratesByProvider.get(p.slug);
  const tier = corridorRate
    ? { fee_fixed: corridorRate.fee, fee_percent: 0, spread_percent: corridorRate.public_spread_percent }
    : resolveTier(p, data.amount); // Tipo B sin dato de corredor: fallback actual
  // ... resto del cálculo igual que hoy
});
```

**Nota de implementación:** conviene agregar una columna real
`is_corridor_specific boolean` a `providers` en vez de mantener una lista
hardcodeada de slugs en el código — más mantenible cuando sumes proveedores
nuevos (lo marcás una vez al cargar el proveedor, no tocás código cada vez).

---

## 5. Convivencia de datos — qué gana cuando hay conflicto

Esta es la pregunta central antes de implementar, y la verifiqué con números reales.

**Magnitud real del solapamiento:** de las 684 filas del CSV, **633 (92%) corresponden
a proveedores que ya están activos hoy** con precio plano en `providers`
(Wise 212 corredores, Western Union 181, Remitly 86, MoneyGram 74, WorldRemit 38,
Ria 32, Sendwave 4, Paysend 3, Xoom 2, Instarem 1). Solo 51 filas (8%) son
proveedores genuinamente nuevos. **La convivencia con el dato plano actual es
el caso principal, no el excepcional** — hay que resolverlo bien.

**Evidencia de que importa — comparé número plano actual vs. dato real de corredor:**

| Proveedor | `spread_percent` plano (usado hoy, cualquier corredor) | Dato real de corredor investigado | Diferencia |
|---|---|---|---|
| WorldRemit | 1.80% | UK→Nigeria: 0.28% / EEUU→Nigeria: -0.49% (favorable) | El número plano sobreestima el costo real ~6x |
| Sendwave | 2.50% | UK→Nigeria: -0.12% a 0.01% | El número plano sobreestima el costo real drásticamente |
| MoneyGram | 2.20% | UAE→India: 0.34% | El número plano sobreestima ~6x |
| Ria | 2.00% | AU→Filipinas: 0.12% | El número plano sobreestima ~16x |
| Xoom | 1.90% (spread) | EEUU→Vietnam: 0% margen | El número plano no refleja el corredor real |

Conclusión: los números planos actuales son estimaciones genéricas
conservadoras, no datos verificados por corredor. Activar `fx_rates` va a
**mejorar visiblemente** lo que se muestra para estos proveedores en los
corredores que carguemos — es un cambio esperado y positivo, no un bug, pero
vale la pena anticiparlo así internamente para que no se lea como una
inconsistencia rara al lanzar.

### Regla de precedencia (a implementar tal cual)

```
SI existe fila en fx_rates para (proveedor, corredor exacto, monto dentro del tier)
  → usar fx_rates (fee, spread, speed) — gana siempre
SINO SI el proveedor es Tipo B (alcance amplio) o tiene fee_tiers propio
  → usar fee_tiers / campos planos de providers (comportamiento actual, sin cambios)
SINO (proveedor Tipo A sin fila de corredor)
  → no se muestra en ese corredor
```

Es una regla de "más específico gana" — corredor exacto > tier por monto >
plano global. Documentar esto como comentario explícito en `resolveTier()` o
en la función que la reemplace, para que quede claro por qué un número
"bajó" respecto a lo que mostraba antes.

### Duplicados dentro de `fx_rates` mismo (CSV vs. investigación de esta sesión)

Ambas fuentes citan `World Bank RPW Q3 2025` como origen — es esperable que
coincidan en la mayoría de los casos (confirmé esto directamente: mis propios
hallazgos para Wise y Walmart2World en EEUU→Vietnam coinciden con las filas
del CSV para ese mismo corredor). Para cuando no coincidan exactamente:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS fx_rates_provider_corridor_tier
  ON fx_rates (provider_slug, sending_country, receiving_country, COALESCE(min_amount, 0));

-- Upsert: la carga más reciente siempre gana (last-write-wins),
-- data_collected_at queda como registro de cuál es más fresca
INSERT INTO fx_rates (...) VALUES (...)
ON CONFLICT (provider_slug, sending_country, receiving_country, COALESCE(min_amount,0))
DO UPDATE SET fee = EXCLUDED.fee, public_spread_percent = EXCLUDED.public_spread_percent,
              speed_hours_approx = EXCLUDED.speed_hours_approx, data_source = EXCLUDED.data_source,
              data_collected_at = EXCLUDED.data_collected_at, updated_at = now();
```

Orden de carga sugerido para mañana: **primero el CSV** (base amplia, 684 filas)
**y después los hallazgos verificados en vivo de esta sesión** (Sendwave/Paysend
afiliado, Walmart2World reclasificado, Rocket Remit con dato real de AU→Filipinas,
iRemit/InstaReM) — así lo más verificado queda como último-escrito y gana.

---

## 6. Actualización periódica — la pregunta del API

Investigué si existe una API formal para esto. Resultado honesto:

- **World Bank RPW** (`remittanceprices.worldbank.org`) es un portal Drupal,
  no encontré una API REST documentada específicamente para este dataset en
  esta sesión — sí existe el **World Bank Open Data / DataBank API** general,
  que en algunos casos expone datasets del Banco Mundial vía API; **valdría la
  pena verificar puntualmente si RPW está indexado ahí** antes de asumir que
  hay que scrapear manualmente cada trimestre. Esto queda como tarea de
  verificación, no lo doy por confirmado.
- **Los proveedores individuales** (MoneyGram, Wise, etc.) no tienen APIs
  públicas de tarifas para terceros — ya lo confirmamos en la investigación de
  candidatos.
- **Mecanismo realista para ahora:** RPW se actualiza trimestralmente (lo
  confirmé — Q3 2025 con fecha de recolección específica). Un proceso manual o
  semi-automatizado cada trimestre — mismo patrón que ya usás para
  `trust_score` (`trust_score_checked_at`, ya existe en el schema) — es
  consistente con cómo mangomundi ya maneja datos que no tienen fuente en vivo.

**Propuesta concreta:** un script (Python, como los que ya usamos para el
blog) que:
1. Lee el CSV maestro (evolución de `catalogo_mundial_final.csv`, ampliado con
   cada ronda de investigación)
2. Genera el SQL de upsert a `fx_rates` con `ON CONFLICT` sobre el índice único
   propuesto en 3.1
3. Se corre manualmente cada vez que se investiga un corredor nuevo o cada
   trimestre cuando RPW actualiza — mismo ritmo operativo que ya tenés.

---

## 7. Plan de rollout sin romper lo que funciona

1. **Migración aditiva únicamente** — agregar columnas a `fx_rates`, ningún
   `DROP` ni `ALTER` destructivo sobre `providers`. Cero riesgo para lo que ya
   anda.
2. **Cargar datos primero, activar el filtro después** — poblar `fx_rates`
   completo para los corredores ya investigados (UAE→India, UK/EEUU→Nigeria,
   EEUU→Vietnam, AU→Filipinas) antes de tocar `compareProviders`. Así se puede
   verificar con datos reales en Supabase antes de que afecte producción.
3. **Feature flag temporal** — envolver el nuevo filtro en una env var
   (`ENABLE_CORRIDOR_FILTERING`) para poder activar/desactivar sin deploy, y
   comparar el comportamiento viejo vs nuevo lado a lado antes de eliminar el
   flag.
4. **Corredores sin ningún dato Tipo A cargado** — con el fix activo, esos
   corredores mostrarán únicamente los Tipo B (Wise, OFX, etc.), que es
   **más preciso que hoy** (hoy muestran también MTOs Tipo A que no operan ahí),
   aunque la lista se vea más corta hasta que se cargue ese corredor
   específico. Esto es el comportamiento correcto, pero vale la pena
   comunicarlo así internamente para que no se lea como una regresión.

---

## 8. UX / producto — comunicar la certeza del dato

Con este cambio, el comparador pasa de "mostrar todo siempre" a "mostrar lo
confirmado para esta ruta". Sugerencias de producto, no solo de datos:

- **Badge de frescura del dato** en cada fila con `fx_rates`: algo como
  "Datos: Banco Mundial, ago 2025" (usando `data_source` + `data_collected_at`)
  — refuerza confianza, coherente con la transparencia que ya es un valor del
  producto (recordá que ya sacaron `most_transparent` del scoring por falta de
  fuente documentada — esto es la misma disciplina aplicada a datos de
  corredor).
- **Estado "sin datos para esta ruta todavía"** en vez de simplemente no
  mostrar nada, si un corredor queda con pocos o ningún resultado Tipo A —
  mejor UX que una lista vacía sin explicación, y reutiliza el patrón que ya
  existe para "missing corridor" (`MasterRateStore.logMissing`), que además ya
  sirve como señal de qué corredores investigar después.
- **No mezclar "sin confirmar" con "confirmado"** en el mismo nivel visual —
  los proveedores con `verified_status = 'sin_confirmar'` (candidatos como los
  de esta investigación, antes de tener afiliado) probablemente no deberían
  mostrarse en el comparador público todavía, solo quedar cargados en el
  catálogo interno hasta pasar a `confirmado_activo`.

---

## 9. Runbook concreto para mañana (orden de ejecución)

Nota de dependencias: verifiqué que `fx_rates.provider_slug` **no tiene foreign
key real** hacia `providers.slug` — es una referencia blanda. El orden de abajo
es el recomendado (para que nada quede huérfano sin logo/afiliado al mostrarse),
pero no hay riesgo de error de base de datos si se hace fuera de orden.

**Paso 1 — Migración aditiva (sección 3.1).** Cero riesgo, no toca nada
existente. Correr primero, antes de cualquier carga de datos.

**Paso 2 — Dar de alta los ~15 proveedores genuinamente nuevos** (Aspora,
iRemit, Al Ansari, GCC Exchange, Wall St Exchange, Al Fardan, Hubpay, e& money,
Payit, CashMinute, Pangea, OrbitRemit — la lista completa de "Tipo/Confirmado"
está en `mangomundi-tabla-maestra-proveedores-nuevos.md`), con
`affiliate_url = ''` donde no haya confirmado, mismo patrón que el resto del
catálogo. Esto es solo el 8% del CSV (51 de 684 filas) — la mayoría del
trabajo de mañana es el paso 3, no este.

**Paso 3 — Cargar `fx_rates`, en dos tandas y en este orden:**
  1. El CSV completo (684 filas, arreglando encoding con `.encode('latin1').decode('utf-8')`
     y mapeando `provider` → `slug` — la sección 5 de este documento tiene la
     regla de qué gana si hay conflicto)
  2. Encima, los hallazgos verificados en vivo de esta sesión (UAE→India,
     UK/EEUU→Nigeria, EEUU→Vietnam, AU→Filipinas — ya estructurados en la tabla
     maestra) — esto sobreescribe con el dato más verificado donde se solape

**Paso 4 — Agregar columna `is_corridor_specific` a `providers`** y clasificar
los 33 proveedores actuales según la sección 2 (Tipo A vs Tipo B) — es un
UPDATE simple, no migración de schema compleja.

**Paso 5 — Cambio de código en `compareProviders`** (sección 4), detrás de un
feature flag (`ENABLE_CORRIDOR_FILTERING`). No mergear a producción todavía.

**Paso 6 — Verificar en Supabase / staging** con el flag activado: comparar
antes/después para 2-3 corredores conocidos (ej. UAE→India, UK→Nigeria) y
confirmar que el listado de proveedores y los números coinciden con lo que
está en la tabla maestra.

**Paso 7 — Activar el flag en producción**, monitorear, y recién ahí sacar el
flag del código si todo se ve bien.

**Pendiente, no bloqueante para mañana:** verificar si existe API de World
Bank DataBank para RPW específicamente (sección 6) — mejoraría el proceso de
actualización trimestral a futuro, pero no es necesario para arrancar con lo
ya investigado.

---

## Documentos relacionados de esta investigación

- `mangomundi-tabla-maestra-proveedores-nuevos.md` — detalle completo por
  corredor de todo lo investigado (UAE→India, UK/EEUU→Nigeria, EEUU→Vietnam,
  AU→Filipinas), estado de afiliado por candidato, y qué quedó pendiente de
  verificar (Egipto/Guatemala/El Salvador, más corredores de Sendwave/Paysend)
- `catalogo_mundial_final.csv` (subido por Alejandro) — 684 filas, 37
  proveedores, 219 corredores, misma fuente (World Bank RPW Q3 2025)
