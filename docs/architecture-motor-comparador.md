# mangomundi — Arquitectura del motor de comparación: proveedores y corredores

> Documento definitivo (27-ago-2026, sesión Cowork). Cierra el tema abierto
> en `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`
> (que queda como registro histórico del diagnóstico original) y en
> `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md` (auditoría de
> tarifas de la misma sesión). Este es el documento a leer para entender
> **cómo decide `compareProviders` qué proveedor mostrar y con qué tarifa**,
> de punta a punta. Se actualiza cada vez que cambia esa lógica — no hace
> falta releer el historial de diagnóstico para entender el estado actual.

## 1. Las dos preguntas que resuelve el motor

Para cada comparación (corredor origen→destino, monto, moneda), el motor
responde dos preguntas independientes:

1. **¿Este proveedor puede aparecer acá?** (elegibilidad — sección 2)
2. **Si aparece, ¿con qué fee/spread?** (resolución de tarifa — sección 3)

Ambas viven en `compareProviders` (`src/lib/fx.functions.ts`). El resto de
este documento asume ese archivo como referencia de código; los números de
línea no se citan a propósito porque cambian con cada commit — los nombres
de función/variable no.

## 2. Elegibilidad: dos capas independientes

### Capa 1 — `supported_corridors` (whitelist estructural, SIEMPRE activa)

Para el puñado de proveedores que son **estructuralmente de un solo mercado**
— un producto de remesas de un banco (Money2India/ICICI, BDO Remit, UBL
Tezraftaar) o una fintech regional que solo opera desde un país (Prex,
Argentina) — `providers.supported_corridors` es una lista explícita de pares
`"ORIGEN-DESTINO"` (ISO-3166 de 2 letras, ej. `"US-IN"`). Si está poblada,
el proveedor **solo** puede aparecer en esos corredores exactos, sin
excepción — este chequeo corre **antes** y **fuera** de cualquier feature
flag, porque no es un dato en proceso de carga: es un hecho estructural del
negocio (Money2India no tiene sucursal en Argentina, punto).

Antes del 27-ago-2026 esta columna existía en la tabla pero **no se
consultaba en ningún lado del código** — de ahí el bug reportado por
Alejandro: Money2India (whitelisteado solo para `US-IN`) aparecía en
comparaciones de Argentina, porque cualquier proveedor `is_corridor_specific`
sin fila exacta en `fx_rates` caía en la rama "hueco no documentado → mostrar
igual" (pensada para MTOs de cobertura amplia, sección 2 capa 2) — una rama
que nunca debió aplicarse a proveedores de un solo mercado. Corregido en el
commit `3b99216` (ver `git log -- src/lib/fx.functions.ts`).

**Proveedores con `supported_corridors` poblado hoy** (los únicos afectados
por esta capa; cualquier proveedor nuevo de un solo mercado debe sumarse
acá):

| Proveedor | Corredores | Fuente del alta |
|---|---|---|
| `money2india` | `US-IN` | World Bank RPW + money2india.com/us/faq |
| `bdo-remit` | `US-PH` | PDF oficial BDO (may 2026) |
| `ubl-tezraftaar` | `AE-PK` | World Bank RPW (ago 2025) |
| `prex` | `AR-US`, `AR-DE`, `AR-ES`, `AR-FR`, `AR-IT`, `AR-PT`, `AR-MX`, `AR-BR`, `AR-CO`, `AR-BO`, `AR-PY`, `AR-VE`, `AR-PE`, `AR-CL`, `AR-UY` | prexcard.com.ar (transferencias + centro de ayuda), verificado 25-ago-2026 |

El resto de los ~43 proveedores Tipo A (`is_corridor_specific=true`) tienen
`supported_corridors` en `null` a propósito — son MTOs de red amplia
(WorldRemit, Remitly, MoneyGram, Sendwave, TapTap Send, LemFi, Ria, Xoom,
Paysend, NALA, Small World...) que operan cientos de corredores reales; no
tiene sentido ni es viable mantener una whitelist exhaustiva para ellos. Para
esos, la elegibilidad la decide la capa 2.

### Capa 2 — `ENABLE_CORRIDOR_FILTERING` + `fx_rates`/`corridor_notes` (staged rollout)

Para todo proveedor Tipo A **sin** `supported_corridors` poblado, la lógica
depende del feature flag `ENABLE_CORRIDOR_FILTERING` (env var, default
`false`):

```
flag apagado
  → el proveedor se muestra en cualquier corredor (comportamiento histórico
    pre-refactor, usa fee_tiers/campos planos siempre)

flag encendido
  → existe fila fx_rates para (proveedor, corredor exacto)?
      SÍ → se muestra, con esa fila (gana siempre sobre fee_tiers)
      NO → existe fila en corridor_notes para ese corredor? (hueco
           documentado — sanciones, o corredor dominado por un
           especialista fuera del catálogo)
             SÍ → NO se muestra (exclusión dura, el hueco es real y conocido)
             NO → SÍ se muestra, usando fee_tiers/campos planos como
                  estimación, marcado has_corridor_data:false (el hueco es
                  indocumentado — el proveedor probablemente opera esa ruta
                  en la realidad, solo que no tenemos el dato exacto todavía)
```

Este flag sigue sin poder confirmarse desde esta sesión — **no hay ninguna
herramienta de Vercel disponible acá que lea o escriba env vars** (se
revisaron todas las tools del MCP de Vercel: `list_projects`, `get_project`,
`get_project_deployment_protection`, `get_runtime_logs`, las de agent-run,
`list_toolbar_threads`, las de dominios/compra, `deploy_to_vercel`,
`create_git_project` — ninguna expone env vars). **Acción pendiente de
Alejandro:** confirmar en Vercel → Settings → Environment Variables si
`ENABLE_CORRIDOR_FILTERING=true` está seteado en producción.

**Importante:** el fix de la capa 1 (`supported_corridors`) funciona **sin
importar el valor de este flag** — es la razón de diseño para hacerlo
incondicional. El bug de Money2India/Prex quedaba resuelto pusheando el
código, sin depender de ninguna variable de entorno.

### Capa 0 — moneda distinta a la local del país (`currencyOverridden`)

Chequeo previo a ambas capas, sin cambios en esta sesión (documentado acá
por completitud): si el usuario eligió una moneda distinta a la moneda local
del país de origen/destino (caso "vivo en UK pero tengo cuenta en EUR"), se
excluyen todos los proveedores `is_corridor_specific` — no pueden operar en
una moneda que no sea la local del país, solo los brokers de cobertura
amplia (Tipo B: Wise, OFX, Revolut, etc.) sirven ese caso.

## 3. Resolución de fee/spread — precedencia

Sin cambios respecto al diseño original, documentado acá para que este
archivo sea autosuficiente:

```
1. Fila exacta en fx_rates (proveedor, corredor, monto dentro del tier)
   → gana siempre. has_corridor_data: true.
2. fee_tiers (jsonb por tramo de monto) en providers, si existe
   → resolveTier() elige el tramo que matchea el monto.
3. Campos planos (fee_percent/fee_fixed/spread_percent) en providers
   → fallback final, siempre existe (default 0 si no se cargó nada).
```

Cuando se usa 2 o 3 para un proveedor Tipo A sin fila de corredor exacta
(rama "hueco indocumentado → mostrar igual" de la sección 2), el número
mostrado es una **estimación** (la tarifa genérica del proveedor, no medida
específicamente para ese corredor) — `has_corridor_data:false` es la señal
que el frontend debería usar para badgear la fila como "no verificado para
esta ruta exacta" en vez de presentarlo como precio confirmado. Esto es
exactamente el mecanismo que resuelve el pedido de Alejandro del 27-ago
("en caso de que no consigas la tarifa exacta, pone la tarifa de ese
proveedor en otro corredor") — ya estaba implementado antes de esta sesión;
lo que faltaba era que no se aplicara a proveedores de un solo mercado
(sección 2, capa 1).

**Pendiente de verificar (no bloqueante):** que el componente de UI
(`ComparatorSection.tsx` u otro que consuma `ComparisonRow`) efectivamente
lea `has_corridor_data` y muestre el badge de "estimado" — no se auditó el
lado del frontend en esta sesión, solo el server function.

## 4. Reglas de integridad de datos (sin cambios, repetidas acá por ser el
   corazón de todo lo demás)

- **Nunca inventar.** Todo fee/spread cargado necesita `data_source` +
  `data_collected_at` citables. Si falta cualquiera de los dos,
  `verified_status='sin_confirmar'` — nunca se completa "a ojo".
- **Patrón de contaminación promocional** (Western Union GB→AR, LemFi,
  Remitly — ver `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md`
  sección 1): las calculadoras en vivo de varios MTOs muestran por default
  una tarifa de bienvenida ("primera transferencia gratis"), fácil de
  confundir con la tarifa regular si no se verifica explícitamente que no
  hay lenguaje de promo/bienvenida en la fuente. Antes de cargar/confirmar
  un fee=0 (o sospechosamente bajo) de la calculadora propia de un
  proveedor, buscar ese lenguaje. World Bank RPW se considera de menor
  riesgo (encuesta independiente, no la calculadora propia del proveedor)
  pero no está 100% libre de este riesgo tampoco — no se hizo una
  verificación exhaustiva de las 267 filas restantes sourced ahí (ver
  sección 6).
- **Criterio de inclusión de proveedor nuevo:** los 4 filtros de la sección
  5 de `PROJECT-STATE.md` (marca propia distinguible, opera su propio envío,
  fee Y margen con fuente citable, no redundante) — sin cambios, reafirmados
  por el resultado de la investigación de fintechs argentinas (sección 5 de
  este documento).
- **Migraciones:** siempre `apply_migration` → `list_migrations` para el
  timestamp real → mirror a GitHub con ese nombre exacto, nunca fabricado
  (incidente de CI previo si se viola esta regla).

## 5. Fintechs argentinas — resultado de la investigación (27-ago-2026)

Alejandro pidió específicamente que las fintechs argentinas aparezcan en el
comparador. Estado real de cada una, contra los 4 filtros de inclusión:

- **Prex — YA CARGADO Y ACTIVO**, `is_corridor_specific=true`,
  `supported_corridors` con 15 corredores AR→exterior (tabla en sección 2).
  Fee real: USD 2.99 fijo por transferencia en USD a cuenta bancaria,
  gratis si se envía en ARS, USD 0.99 para "Prex a Prex" (Perú/Chile/
  Uruguay). Fuente: prexcard.com.ar, verificado 25-ago-2026. **Único dato
  flojo:** `spread_percent=1.0` es una estimación provisoria — Prex no
  publica su margen cambiario en ningún lado público, solo se ve al cotizar
  dentro de la app (nota explícita en `providers.notes`, no se inventó un
  número más preciso). Con el fix de esta sesión, Prex debería aparecer
  correctamente solo en sus 15 corredores AR-salida — antes del fix, si
  `ENABLE_CORRIDOR_FILTERING` estaba en `true` en producción, debería haber
  aparecido igual (no había fila en `corridor_notes` bloqueándolo); si
  Alejandro seguía sin verlo en el sitio en vivo antes de este fix, la causa
  más probable era el mismo bug de fondo pero por el lado inverso (algún otro
  proveedor Tipo A de cobertura amplia con datos de Argentina apareciendo
  encima, o un filtro de frontend no auditado en esta sesión) — vale la pena
  una verificación en vivo con browser real ahora que el fix está pusheado.
- **Ualá — investigado, NO califica.** Confirmado (wise.com/ar, ago 2026):
  Ualá Argentina **no puede recibir transferencias internacionales
  directas** — no tiene código SWIFT. La propia fuente lo dice explícito:
  *"al momento de escribir este artículo no es posible recibir
  transferencias internacionales en tu cuenta Ualá"*. No es un producto de
  remesas — no pasa el filtro 2 (opera su propio envío/recepción). Fuente:
  [wise.com/ar/blog/uala-puede-recibir-transferencias-internacionales](https://wise.com/ar/blog/uala-puede-recibir-transferencias-internacionales).
- **Lemon Cash — investigado, NO califica (mismo patrón que Global66/Belo).**
  Solo permite depositar/retirar USD desde/hacia cuentas bancarias **a
  nombre del mismo usuario** en Argentina (no recepción de un tercero desde
  el exterior) — no es un producto de remesas P2P. Sí mencionan que aplica
  spread cambiario ("conversión mediante un tipo de cambio con spread") pero
  **sin publicar el número** — cargarlo sería inventar el dato más
  importante. Fuente: [help.lemon.me/es/articles/11586417](https://help.lemon.me/es/articles/11586417-como-funcionan-las-transferencias-en-dolares-en-lemon).
- **AstroPay — investigado, NO califica por ahora.** Es el más cercano a
  calificar en discurso de marketing ("recibí dinero del exterior
  directamente en tu billetera digital") pero **ninguna página oficial
  revisada publica un fee o spread concreto** para transferencias
  internacionales de terceros hacia Argentina — solo lenguaje genérico
  ("tipo de cambio competitivo y transparente", "sin costos ocultos"). Sin
  número citable, no pasa el filtro 3. Fuentes revisadas:
  [astropay.com/es/blog/...](https://www.astropay.com/es/blog/como-enviar-y-recibir-dinero-del-exterior-en-argentina),
  [astropay.com/money-transfers](https://www.astropay.com/money-transfers),
  [astropay.com/international-transfers](https://www.astropay.com/international-transfers).
  Candidato a re-intentar si aparece una página de tarifas más concreta.
- **Global66 / Belo — sin cambios respecto al hallazgo de la sesión
  anterior** (ver `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md`
  sección 2): billeteras multi-moneda donde la conversión a ARS es opcional
  y a iniciativa del usuario, no un producto de remesa con fee+spread fijo
  publicado. Global66 sigue `active=false` en `providers`, con 4 filas
  `sin_confirmar` en `fx_rates` (AR-CO, CL-PE, ES-CO, MX-CO) sourced de forma
  genérica — mismo riesgo de contaminación promocional que LemFi/Remitly,
  no reverificado todavía.

**Conclusión:** no es que "las fintechs no aparecen" por un bug — es que,
de las 5 fintechs argentinas relevantes investigadas hasta ahora (Prex,
Ualá, Lemon Cash, AstroPay, Global66/Belo), **solo Prex tiene un producto de
remesas real con fee+spread citable**, y ya estaba cargada. Las otras 4 son
billeteras/apps domésticas sin un producto de remesa P2P con tarifa
publicada — agregarlas ahora significaría inventar el dato que las hace
comparables. Si Alejandro tiene una fuente concreta que alguna de las 4 sí
publica (una página de tarifas que esta sesión no encontró), es cuestión de
pasarla y se carga con la misma disciplina.

## 6. Qué queda abierto (para la próxima sesión, en orden de impacto)

1. **Verificar `ENABLE_CORRIDOR_FILTERING` en Vercel** (Alejandro, no hay
   tool disponible) — sección 2.
2. **Verificar en vivo (browser real) que Prex aparece correctamente** en
   comparaciones AR→exterior tras el fix — esta sesión no tuvo Chrome tool
   conectado.
3. **Confirmar el `spread_percent` real de Prex** (hoy es una estimación
   provisoria de 1.0%, documentada como tal) — necesita cotizar en la app
   real con browser.
4. **Re-verificar con browser real** las 16 filas de LemFi/Remitly bajadas a
   `sin_confirmar` el 27-ago (mismo bloqueo: WebSearch/WebFetch no pueden
   ejecutar calculadoras dinámicas con sesión de "usuario no nuevo") + el
   duplicado sin resolver de LemFi GB-NG.
5. **MoneyGram ES→AR y Remitly ES→AR (spread)** — bloqueados por
   anti-bot/calculadora dinámica, necesitan browser real.
6. **Barrido completo de las ~267 filas `fee<1` sourced de World Bank RPW**
   — no revisado en ninguna sesión hasta ahora (se asumió menor riesgo por
   ser encuesta independiente, no la calculadora propia del proveedor, pero
   ese supuesto nunca se validó con una muestra real). Es el ítem más grande
   pendiente de "terminar la investigación de tarifas para todo el mundo" —
   257 filas es demasiado para una sesión sin browser; recomendación:
   arrancar por una muestra estratificada (5-10 por región) antes de
   comprometerse a las 267 completas.
7. **Global66:** reactivar solo si aparece una fuente citable de fee+spread
   para su conversión a ARS — sigue sin encontrarse.
8. **Triage de los ~27 proveedores Tipo A inactivos restantes** (lista
   completa en el handoff de sesiones anteriores) — no tocado esta sesión,
   prioridad baja frente a lo anterior.

## 7. Cómo se prueba que este documento sigue siendo verdad

Si en algún momento el comportamiento del sitio no coincide con lo descripto
acá, el primer chequeo es siempre:

```sql
select slug, is_corridor_specific, supported_corridors
from providers
where is_corridor_specific = true and supported_corridors is not null;
```

Esa query es la fuente de verdad de la capa 1. Para la capa 2, el valor real
del flag en producción (Vercel → env vars, no accesible desde Claude Code
hoy) decide si `fx_rates`/`corridor_notes` se consultan en absoluto.
