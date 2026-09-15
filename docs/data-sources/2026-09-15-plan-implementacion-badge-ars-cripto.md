# Plan de implementación — badge promocional, referencia ARS, puente cripto
### 2026-09-15 — consolidado de todo lo investigado esta semana, anclado al código real

> Este plan revisó el código real (`src/lib/fx.functions.ts`, `src/sections/ComparatorSection.tsx`,
> `src/config/providers.config.ts`, `src/services/providers/fxProviders.ts`) antes de proponer
> nada — dos de las tres líneas resultaron ser mucho más chicas de lo que parecían, y una
> asunción de research anterior quedó corregida.

---

## 1. Badge promocional — corrección importante, ya está construido

**Hallazgo al revisar el código**: el badge promocional **ya existe y funciona correctamente**
(`ComparatorSection.tsx` líneas ~5653-5676) — se renderiza con ícono Sparkle y el prefijo
`comparator.badge.promoPrefix`, como una línea de footer separada del precio principal. El
ranking (`fx.functions.ts` línea 958: `rows.sort((a, b) => b.received - a.received)`) ya usa
`received`, que se calcula de `spread`/`fee` regulares — **nunca de una tasa promocional**.
Es decir: la Opción A que quedó definida el 13-sep **ya está implementada en código**, no hace
falta escribir nada nuevo ahí.

**Lo que sí falta**: `promo_text` es un campo a nivel `providers` (no por corredor) y está
**vacío en los 66 proveedores** (`select count(promo_text) from providers` → 0). Esto es
trabajo de datos, no de código.

### 1.1 Qué cargar

Con la investigación de esta semana ya tenemos el texto exacto para los casos confirmados:

| Proveedor | Texto sugerido |
|---|---|
| `remitly` | "Primera transferencia (hasta USD 1.000): sin comisión" |
| `moneygram` | "Primera transferencia online: tasa preferencial" (confirmado en ES→MA, ES→AR) |
| `dahabshiil` | "Primera transferencia: sin comisión" |

**Antes de cargar**: verificar que el texto sea genérico y no dependa del corredor específico
(dado que el campo es a nivel proveedor) — los tres casos de arriba ya cumplen esto según lo
investigado, la promo aplica igual en todos los corredores del proveedor.

### 1.2 Orden de ejecución

1. Migración simple: `UPDATE providers SET promo_text = '...' WHERE slug IN (...)`.
2. Verificar visualmente en preview que el badge aparece correcto.
3. **Listo** — no hay trabajo de componente/lógica pendiente.

---

## 2. Referencia ARS — dolarapi.com → api.argentinadatos.com

**Hallazgo al revisar el código**: no existe ningún pipeline automatizado que llame a
`dolarapi.com` hoy — el grep completo del repo solo encuentra la URL en comentarios de
migraciones SQL (research manual de esta semana), nunca en código de aplicación. **Frankfurter
sí está integrado como un `FxProvider` real** (`src/services/providers/fxProviders.ts`,
registrado en `src/config/providers.config.ts` con prioridad/fallback chain documentada).

### 2.1 El patrón a seguir

`api.argentinadatos.com` debería agregarse siguiendo el **mismo patrón exacto** que
`frankfurterProvider`:

- Nueva entrada en `FX_PROVIDERS` (`providers.config.ts`): `key: "argentinadatos"`,
  `healthCheckUrl: "https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial"`, sin
  `requiresEnv` (API pública, sin key).
- Nuevo objeto `argentinaDatosProvider: FxProvider` en `fxProviders.ts`, calcado de
  `frankfurterProvider` pero parseando la respuesta de ArgentinaDatos (array de
  `{casa, compra, venta, fecha}`, no el formato de Frankfurter).
- **Prioridad**: solo debería activarse para pares que involucren ARS específicamente (no es
  un proveedor genérico como Frankfurter) — revisar cómo el resto del fallback chain
  discrimina por par de monedas antes de decidir dónde entra en la cadena.

### 2.2 Nota importante para quien implemente esto

`api.argentinadatos.com` tiene **múltiples "casas"** (`oficial`, `blue`, `cripto`, `mep`,
`ccl`, `mayorista`) — no una sola tasa. Cuál usar depende del contexto:
- Para el comparador normal (remesas via canales regulados): probablemente `oficial` o
  `mayorista`.
- Para la referencia del puente cripto (Sección 3): `cripto`, específicamente.

**No mezclar las dos** — es la misma distinción que ya hicimos toda la semana entre tasa
regular y tasa promocional, aplicada acá a "qué tipo de dólar es la referencia correcta para
cada propósito".

---

## 3. Puente cripto — el trabajo más grande, en 3 fases

### 3.1 Lo que el código ya soporta sin cambios

El filtro de método de entrega (`DeliveryMethod` en `ComparatorSection.tsx`, línea ~125) ya
es exactamente la arquitectura que propuse el 13-sep — un tipo unión con un mapa de
predicados:

```ts
type DeliveryMethod = "bank_transfer" | "cash_pickup" | "card_payout" | "broker";
const DELIVERY_METHOD_PREDICATES: Record<DeliveryMethod, (r) => boolean> = {
  bank_transfer: (r) => r.bank_transfer_available === true,
  cash_pickup: (r) => r.cash_pickup_available === true,
  card_payout: (r) => r.card_payout_available === true,
  broker: (r) => r.provider_type === "broker",
};
```

Agregar `"crypto"` acá es un cambio chico y localizado — el mismo patrón ya filtra
correctamente sin tocar la lógica de ranking (el filtro de método de entrega ya excluye del
listado por defecto todo lo que no matchea, que es exactamente el comportamiento "no
mezclar" que pedía la propuesta del 13-sep).

### 3.2 Lo que SÍ hace falta construir

1. **Predicado nuevo**: `crypto: (r) => r.to_currency === "USDT" || r.to_currency === "USDC"`
   (más simple que los otros — no necesita una columna booleana nueva, ya alcanza con el
   `to_currency` que las filas de Global66 ya usan).
2. **Entrada nueva en `DELIVERY_METHODS`**: ícono (¿`Coins` de lucide-react?) + clave i18n
   `comparator.delivery.crypto` en los 3+ idiomas.
3. **El número mostrado**: hoy `received` se muestra siempre en la moneda de destino sin
   distinguir tipo — para cripto, el monto YA está en USDT/USDC (correcto, es lo que
   `received` calcularía con las filas ya cargadas de Global66), pero falta la etiqueta
   explícita de qué stablecoin es (el propuesta del 13-sep pedía nunca decir "dólares"
   genérico) — probablemente ya funciona bien si el componente ya muestra `to_currency` junto
   al monto, pero **hay que confirmarlo visualmente en preview**, no asumirlo.
4. **La línea "≈ X ARS al tipo de hoy" (secundaria, estimada)**: esto es lo único
   genuinamente nuevo — no existe un mecanismo hoy para mostrar un segundo monto calculado en
   vivo contra una referencia distinta a la tasa de la fila. Necesita:
   - Un nuevo `FxProvider` (o extensión de uno existente) que dé la tasa "cripto" de
     ArgentinaDatos para ARS.
   - Para VES/NGN: todavía no hay un provider ni un plan concreto — ver Sección 3.4.
   - Una función de UI que tome el `received` (en USDT/USDC) y lo multiplique por esa
     referencia en vivo, mostrado con el estilo "estimado" que ya definimos (chico, con "≈").
5. **Ranking dentro de la vista cripto**: ordenar por costo de entrada (`fee_total`/`spread`
   de la fila, que ya existen) — esto no necesita nada nuevo, es el mismo `received` de
   siempre, solo que dentro de la sub-vista filtrada por `crypto`.

### 3.3 Datos que faltan cargar (antes o junto con el código)

| Corredor | Estado del dato | Qué falta |
|---|---|---|
| Global66 ARS↔USDT/USDC | **Ya medido** (11-sep, capturas del usuario) | Cargarlo a `fx_rates` — no se cargó en su momento porque el esquema no estaba listo, ahora sí |
| Belo/Lemon Argentina (USDC) | Fee conocido (Lemon: 1.5%+$12) | Falta cargar como filas de `fx_rates` |
| Belo Venezuela (USDT) | Fee conocido (<$1 red + 1-3% P2P) | Falta cargar; el "1-3%" es un rango, no un número — necesita una medición más precisa o cargarse como rango documentado |
| **Nigeria** | **Tenemos la tasa (CBN vs. Bybit/Gate), pero NO identificamos ningún proveedor/app específico que ofrezca esto como producto de remesa** | **Gap de research real — falta antes de poder cargar nada para Nigeria** (ver 3.4) |

### 3.4 Lo que falta investigar antes de poder implementar Nigeria

A diferencia de Venezuela (Belo, Lemon) y Argentina (Belo, Lemon, Global66), **nunca
identificamos qué app/fintech específica ofrece el puente cripto como producto de remesa para
Nigeria** — solo confirmamos que la brecha de tasa existe (CBN oficial vs. Bybit/Gate P2P).
Antes de poder cargar un proveedor para Nigeria hace falta una ronda de research específica:
¿qué usan los nigerianos en la práctica para esto? (candidatos obvios a investigar: Yellow
Card, Busha, otras fintechs africanas con producto de remesa cripto — no verificado todavía).

### 3.5 Fuentes de referencia en vivo — recordatorio de lo ya documentado

- ARS: `api.argentinadatos.com`, casa `cripto` (Sección 2).
- VES: Binance P2P (con diseño defensivo — cachear agresivamente, fallback a
  `ve.dolarapi.com` paralelo si falla). Ver `2026-09-11-arquitectura-fuentes-tasas-cripto.md`.
- NGN: **Bybit o Gate P2P, NO Binance** (Binance tiene 0 actividad para NGN hoy — hallazgo del
  14-sep). Necesita su propia integración, distinta a Venezuela.

---

## 4. Orden de ejecución recomendado

1. **Badge promocional** (Sección 1) — el más rápido, es una migración SQL de un párrafo.
   Se puede hacer hoy mismo.
2. **Referencia ARS** (Sección 2) — chico, sigue un patrón ya existente en el código. Mejora
   la precisión de todo lo que ya está cargado en ARS, no solo cripto.
3. **Puente cripto, fase 1: Argentina** — es el corredor con más datos ya listos (Global66
   medido, Lemon con fee conocido) y la referencia ARS ya se resuelve en el paso 2. El más
   fácil de los tres países confirmados.
4. **Puente cripto, fase 2: Venezuela** — datos de Belo ya conocidos en rango, pero necesita
   resolver la integración de Binance P2P para la referencia en vivo (más trabajo de
   integración que Argentina).
5. **Puente cripto, fase 3: Nigeria** — bloqueado hasta completar el research pendiente de la
   Sección 3.4 (qué proveedor específico investigar).

---

## 5. Preguntas abiertas para vos antes de que una sesión de Código empiece

1. ¿Confirmás el orden de la Sección 4, o preferís otro?
2. Para el rango "1-3%" de Venezuela (Belo, P2P) — ¿cargamos como rango documentado o
   preferís que se mida un número puntual primero?
3. ¿Querés que se investigue el proveedor de Nigeria (Sección 3.4) ahora, o el puente cripto
   arranca con solo Argentina+Venezuela por ahora?

---

## 6. Estado de esta sesión

Solo planificación — no se tocó código ni Supabase. Este documento es el punto de partida
para una sesión de Código (Claude Code) cuando confirmes el orden y resuelvas las preguntas
de la Sección 5.
