# Cómo mostrar cripto en el comparador sin mezclar todo — propuesta — 2026-09-13

> Responde: "¿cómo agregaríamos cripto en los resultados del comparador para no
> mezclar todo?". Esto es diseño de producto, no research externo — pero se apoya
> en todo lo que encontramos esta semana (Belo/Lemon/Global66/Binance P2P) más un
> término y un dato de la industria que cambian cómo lo pienso.

---

## 1. Dos datos de contexto que definen el diseño

**El término correcto es "stablecoin sandwich"** (ya establecido en la industria,
ver Stripe/Crossmint/HBS): fiat → stablecoin → fiat. La remesa NUNCA es una sola
conversión con una tasa fija de punta a punta como Western Union o Wise — es dos
pasos, y el segundo (stablecoin → moneda local) el usuario lo controla y ejecuta
después, a su propio tiempo.

**Un estudio del Banco de Italia (citado ago-2026) encontró que las remesas vía
stablecoin NO tienen ventaja de costo sistemática sobre las tradicionales — el
costo total va de 0.3% a casi 9%**, el mismo rango que ya vimos en nuestra propia
investigación (Global66 USDT: 0.07% / GBP: 8%). Esto confirma que la variable
crítica es **cuándo y dónde el usuario convierte al final**, no el proveedor del
"puente" — dos personas usando el mismo Belo pueden terminar con costos muy
distintos según el momento y la plataforma P2P que elijan para el segundo paso.
**Esto es exactamente por qué no se puede tratar esto como un precio fijo.**

## 2. Principio de diseño

No forzar cripto dentro de la misma lista ordenada que hoy compara "cuánto ARS
recibís" de forma garantizada. Mezclarlos sería comparar una cifra **garantizada al
momento del envío** (Western Union, Remitly, etc.) contra una cifra que depende de
una decisión futura del usuario (cuándo convierte el stablecoin) — el mismo tipo de
error que venimos evitando toda la semana con las tasas promocionales.

## 3. Propuesta concreta de UI

### 3.1 Cripto como un método de entrega más, no una pestaña aparte

El comparador ya tiene un filtro de método de entrega (`DELIVERY_METHODS` /
`DELIVERY_METHOD_PREDICATES`, ya existente en el código). Agregar
**"Cripto (USDT/USDC)"** como una opción más ahí, al lado de "cuenta bancaria",
"efectivo", "billetera móvil" — reutiliza infraestructura que ya existe, en vez de
construir una pestaña o un modo completamente nuevo.

### 3.2 La fila de resultado, para una opción cripto

```
┌─────────────────────────────────────────────────┐
│  🟢 Belo                                          │
│  Recibís  100 USDT                                │
│           ↳ ≈ 163.400 ARS al tipo cripto de hoy   │
│             (referencia, no garantizado — variará  │
│             según cuándo/dónde lo convertís)       │
│  Costo de entrada: 1.5% + USD 12 — esto SÍ es fijo │
└─────────────────────────────────────────────────┘
```

Reglas clave:
- **El número grande y primario es el monto de la stablecoin** (100 USDT), no un
  equivalente en ARS. Es lo único que el proveedor garantiza al momento del envío.
- **La stablecoin se nombra explícitamente** (USDT o USDC) — nunca "dólares"
  genérico. Ya confirmamos que varía por proveedor/corredor (Argentina=USDC,
  Venezuela=USDT) y le importa al usuario (liquidez P2P distinta para cada una).
- El equivalente en moneda local va **abajo, más chico, explícitamente marcado como
  estimado** ("≈", "al tipo de hoy", "variará") — nunca con el mismo peso visual que
  el monto garantizado de un proveedor tradicional.
- El único número que SÍ es parte del ranking es el **costo de entrada** (fee +
  spread del puente, ej. 1.5%+$12 de Lemon, 0.30% de USDT en Global66) — es lo único
  que el proveedor controla y garantiza. El resto (conversión final) es igual para
  cualquier proveedor que use el mismo mercado P2P, así que no diferencia entre
  ellos de forma justa.

### 3.3 Badges: nada de "Mejor"/"Recibís más" calculado con el estimado

Los badges de mérito que ya definimos para el resto del comparador (`Mejor`, `Más
barato`) se calculan sobre un monto garantizado. Para cripto, esa garantía no
existe en la conversión final — así que esos badges no aplican de la misma forma.
Si querés destacar algo, un badge distinto tipo `Puente más barato` (basado en el
costo de entrada, el único dato firme) es más honesto que reusar el mismo lenguaje
que implica "esto es lo que vas a recibir seguro".

## 4. Boceto de modelo de datos (para cuando se decida implementar)

No hace falta un cambio grande de esquema — con dos ajustes alcanza:

1. **La fila de "entrada" ya funciona con el esquema actual**: `from_currency` =
   moneda de origen, `to_currency` = `'USDT'` o `'USDC'` (ya lo hicimos para las
   filas de salida de Global66) — el fee/spread cargado es el costo de entrada real
   y garantizado. Esto YA se puede cargar tal cual está el esquema hoy.
2. **Lo que NO se guarda como fila fija**: el "≈ X ARS" de la conversión final. Eso
   se calcula **en el momento de mostrarlo en pantalla**, contra la referencia
   cripto en vivo (`api.argentinadatos.com` para ARS, Binance P2P para VES/otros —
   ver `2026-09-11-arquitectura-fuentes-tasas-cripto.md`), no contra un número
   guardado en `fx_rates` que se volvería viejo al toque (el mismo problema de
   staleness que ya nos mordió esta semana con `dolarapi.com`).

Esto evita el error de fondo: guardar una "tasa cripto→ARS" en `fx_rates` como si
fuera un precio fijo de proveedor sería mentir sobre qué tan garantizado es ese
número — el dato correcto para guardar es el costo de entrada (fijo, real), y el
equivalente en moneda local se calcula al vuelo, siempre marcado como estimado.

## 5. Qué NO resuelve esta propuesta todavía

- No define el diseño visual final (colores, iconos) — eso es trabajo de diseño,
  no de research.
- No resuelve de dónde sale la referencia en vivo para países sin una fuente tan
  buena como `api.argentinadatos.com` (ver limitación ya documentada para
  Venezuela/otros en el doc de arquitectura de fuentes).
- Asume que el usuario entiende mínimamente qué es una stablecoin — si el público
  objetivo no lo tiene claro, podría hacer falta un tooltip/explicación la primera
  vez que aparece esta opción.

---

## 6. Estado de esta sesión

Propuesta de diseño únicamente — no se tocó Supabase ni código. Queda para que la
evalúes antes de pasarla a una sesión de implementación (Claude Code).
