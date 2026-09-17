# Nigeria — proveedor identificado: Monica (no era solo una fuente, es el producto) — 2026-09-17

> Resuelve el gap que quedó documentado el 15-sep ("tenemos la tasa, no sabemos qué
> app usa la gente"). Hallazgo curioso: **la fuente que vengo citando como blog
> informativo desde el 14-sep (`monica.cash`) es en realidad la propia app** — no
> un tercero neutral, es marketing de producto. Se trata igual, con el mismo
> escepticismo que el resto de la semana, pero el hallazgo del producto en sí es
> real y verificable.

---

## 1. Qué es Monica

- App real, en Google Play (4.5★) y App Store (4.6★) — no solo una web.
- Dice tener 500.000+ usuarios, cumplimiento alineado a SEC.
- Producto: el receptor en Nigeria se registra (BVN o NIN + selfie, ~4 min),
  recibe una dirección USDT permanente (recomienda red TRC-20, fee de red ~USD 1),
  y retira a cualquier banco nigeriano (Opay, Kuda, GTBank, Zenith) en menos de 60
  segundos.

## 2. Estructura de costo (según el propio producto — marketing, tratar con cautela)

- Fee de red: ~USD 1 (variable según congestión de la red TRC-20, no fijo de
  verdad).
- Comisión de plataforma/conversión/retiro: **0%**, según ellos.
- Tasa de conversión: "tasa de mercado en vivo de USDT/NGN", mostrada antes de
  confirmar.

**Mismo criterio de escepticismo que ya aplicamos a MoneyGram/Remitly toda la
semana**: esto es lo que el propio producto dice de sí mismo, no una medición
independiente. Pero la estructura (fee de red + 0% de plataforma) es coherente con
el patrón ya confirmado independientemente en Argentina (Global66: 0.30% de fee
para USDT) y Venezuela (Binance P2P: spread propio de apenas 0.075%) — no es una
afirmación aislada o inverosímil, encaja con todo lo demás medido esta semana.

## 3. Confirmación regulatoria útil, independiente del marketing

El artículo cita el marco legal real: **el Banco Central de Nigeria revirtió su
restricción bancaria de 2021 en diciembre de 2023**, y la Comisión de Valores (SEC)
emitió un marco de "Proveedor de Servicios de Activos Virtuales" (VASP) con
licencias provisorias a exchanges nigerianos desde agosto de 2024. Esto es
verificable independientemente del marketing de Monica — confirma que recibir y
convertir stablecoins es legal en Nigeria hoy, contexto regulatorio útil más allá
de esta app específica.

## 4. Qué falta antes de cargar algo

- **Medición independiente real** — todo lo de arriba viene del propio producto.
  Antes de cargar a Supabase, falta lo mismo que con Belo/Lemon: una medición en
  vivo (screenshot del usuario, o browser real) del monto exacto que se recibe,
  no solo la promesa de marketing.
- Sigue bloqueado por el mismo problema de esquema documentado el 16-sep — aunque
  ahora se identificó el proveedor, cargar la fila todavía requeriría resolver
  primero cómo representar el puente cripto sin romper las consultas normales de
  `fx_rates`.

## 5. Turquía y Egipto — siguen sin proveedor identificado

No se investigó esta ronda — queda pendiente para la próxima.

---

## 6. Estado de esta sesión

Solo investigación — no se cargó nada a Supabase. Nigeria pasa de "sin proveedor
identificado" a "proveedor identificado (Monica), pendiente de medición
independiente" — un paso de avance real, no completo.
