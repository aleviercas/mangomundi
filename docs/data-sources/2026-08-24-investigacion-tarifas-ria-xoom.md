# Investigación de tarifas reales: Ria Money Transfer vs. Xoom (PayPal)

**Fecha de investigación:** 2026-08-24
**Método:** Consulta directa a fuentes primarias (sitio oficial y cotizador en vivo de cada proveedor). No se usaron agregadores de terceros.
**Corredores de referencia usados:** Reino Unido → México (GBP→MXN) y Estados Unidos → México (USD→MXN).

**Nota de estado (añadida 25-ago-2026, auditoría de documentación vs. Supabase):** este fue el research exploratorio inicial que motivó el uso posterior de "un solo agente de navegador por vez" en el resto de la sesión (ver el bug de secuestro de pestaña descrito abajo). De sus tres hallazgos de precio:
- **Ria GB→MX** (fee 2.90 GBP, tasa 23.04) — **cargado a `fx_rates` el 25-ago** (migración `20260825232229_load_ria_gb_mx_gap_from_docs_audit.sql`), marcado `sin_confirmar` por la antigüedad del dato relativa al resto de la ronda.
- **Ria US→MX** (fee 1.99 USD, tasa 16.59) — **superado**: `fx_rates` ya tiene una carga más reciente de otra ronda de esta sesión (fee 0, tasa 17.0211, `confirmado_activo`). No se sobrescribe; se documenta la discrepancia para que una futura sesión decida si vale la pena reconciliar/reverificar en vivo.
- **Xoom GB→MX** (fee no obtenido por el bug de redirección) — **superado**: `fx_rates` ya tiene una carga más reciente de otra ronda de esta sesión (fee 2.99 GBP, tasa 22.3822, `confirmado_activo`).

## Resumen ejecutivo

Ninguno de los dos proveedores publica una **tabla de tarifas fija por tramo de monto** (fee schedule) de acceso público. Ambos usan **pricing dinámico**: el fee y el tipo de cambio se calculan en tiempo real según monto, corredor, método de pago y método de cobro, y solo se conocen usando el cotizador ("get a quote") de cada sitio. Esto está confirmado con texto explícito de cada proveedor (citado abajo), no es una inferencia.

**Limitación metodológica importante:** durante la sesión de research, tanto `riamoneytransfer.com` como `xoom.com` mostraron un comportamiento anómalo: al hacer clic dentro de la calculadora de cotización (en el campo de monto de Ria, y en el enlace "Show Fees" de Xoom), el navegador fue redirigido íntegramente a sitios de competidores no relacionados (lemfi.com, paysend.com, remitly.com, westernunion.com) — 5 de 5 intentos de clic terminaron en ese secuestro de pestaña. Esto impidió muestrear múltiples montos (100/500/1,000/5,000/10,000) de forma interactiva como se planeó originalmente. Se reporta como hallazgo en sí mismo (posible ad/malware en la cadena publicitaria de esas páginas) y limita la muestra a los montos que cada calculadora mostraba **por defecto al cargar la página**, antes de cualquier clic. **Esta observación fue la causa directa de la regla adoptada para el resto de la sesión: correr agentes que tocan el navegador compartido de a uno por vez.**

---

## 1. Ria Money Transfer

### ¿Tabla fija publicada?
**No.** Fuente primaria: [Ria Help Center — "How our fees and exchange rates work"](https://help.riamoneytransfer.com/hc/en-us/articles/4407752015249-How-our-fees-and-exchange-rates-work) (consultado 2026-08-24).

Cita textual: *"Fees are part of your total transfer cost. They depend on: Amount you send, Country you send to, Payment method (card, bank, cash), Delivery method (bank, cash pickup, mobile wallet)."* y *"Fees change by size"*. Sobre el tipo de cambio: *"Google shows the market rate. We add a small markup to cover our costs."* — confirma que el spread cambiario es parte del modelo de negocio, sin cifra fija publicada.

Sobre variación por método: *"In some countries, fees vary by payment method. Where they do, card fees are often higher than bank transfer fees. Debit card fees are usually lower than credit card fees. In other countries, all payment methods have the same fee."* → **Sí varía por método de pago/cobro**, mencionado explícitamente por el proveedor, pero de forma variable por país (no cuantificado).

### Muestra del cotizador en vivo (no es tabla oficial — un punto por corredor, monto por defecto de carga)

| Corredor | Monto enviado | Método de pago → cobro | Fee estándar mostrado | Tipo de cambio ofrecido | Fee promo 1ª transferencia | Tasa mid-market del día | Spread cambiario implícito |
|---|---|---|---|---|---|---|---|
| GB → MX | £100.00 GBP | Credit card → Bank | **£2.90** | 1 GBP = **23.040000 MXN** | £0 (código HELLORIA) | 1 GBP = 23.08010 MXN (xe.com, 23-ago 16:52 UTC) | ≈ 0.17% |
| US → MX | $100.00 USD | Bank → Bank | **$1.99** | 1 USD = **16.59 MXN** | $0 fee, tasa promo 17.2533 MXN | 1 USD = 16.9661 MXN (xe.com, 24-ago 17:12 UTC) | ≈ 2.22% |

Costo efectivo aproximado (fee + spread, sobre el monto enviado) en esta muestra puntual:
- GB→MX £100, tarjeta→banco: ≈ 2.9% (fee) + 0.17% (spread) ≈ **3.1% total**
- US→MX $100, banco→banco: ≈ 1.99% (fee) + 2.22% (spread) ≈ **4.2% total**

**URLs exactas consultadas:**
- https://www.riamoneytransfer.com/en-gb/send-money-to-mexico/ (cotizador GB→MX)
- https://www.riamoneytransfer.com/en-us/send-money-to-mexico/ (cotizador US→MX)

No se pudo obtener el fee/tasa en 500, 1,000, 5,000 y 10,000 por el problema de redirección descrito arriba. El valor de $100/£100 es el monto que la página carga por defecto, capturado **antes** de cualquier clic en el widget.

### Variación por método de pago/cobro
Confirmado por el propio Ria (cita arriba) que el fee puede variar por método de pago (tarjeta vs. banco vs. efectivo) y de cobro (banco, retiro en efectivo, billetera móvil), aunque no en todos los países. En la muestra tomada, el default de Ria GB era "Credit card → Bank" y el de Ria US era "Bank → Bank" (defaults distintos por mercado); no se pudo comparar tarjeta vs. banco en el mismo corredor por la limitación de interacción.

---

## 2. Xoom (PayPal)

### ¿Tabla fija publicada?
**No hay tabla de fees por tramo de monto**, pero sí existe una **tabla publicada de condiciones para fee = $0** por país/corredor (distinto de una fee schedule completa: solo indica cuándo el fee es cero, no cuál es el fee fuera de esas condiciones).

Fuente primaria: [Xoom Help Center — "What are the fees to use Xoom?"](https://help.xoom.com/s/article/how-much-does-it-cost-to-send-with-xoom?language=en_US) — el fee depende de: *"Transaction type", "Your payment method and what currency you pay with", "The amount of the transaction", "Which country the transaction is going to", "Which currency you select for the other person to receive"*. El artículo remite al cotizador: *"Click Show Fees to check the fees for each payment method."*

Tabla de condiciones $0-fee para **México**, fuente primaria: [xoom.com/legal/xoom-transfer-fees](https://www.xoom.com/legal/xoom-transfer-fees) (sin fecha de última actualización visible en la página; consultado 2026-08-24):

| Moneda enviada | Monto | Método de pago | Método de cobro | Fee |
|---|---|---|---|---|
| USD | Cualquiera | PYUSD (stablecoin) | Todos | $0 |
| USD | Cualquiera | Saldo de PayPal | Cuenta bancaria, tarjeta débito o billetera móvil | $0 |
| USD | **$6,000 o más** | Cuenta bancaria o tarjeta débito | Cuenta bancaria | $0 |
| CAD | $500–$2,999.99 | Cuenta bancaria | Tarjeta débito | $0 |
| CAD | $250–$1,999.99 | Cuenta bancaria | Billetera móvil | $0 |
| CAD | $250–$9,999.99 | Cuenta bancaria | Cuenta bancaria | $0 |
| CAD | $1,000–$5,999.99 | Cuenta bancaria | Retiro en efectivo | $0 |
| CAD | Menos de $2,000 | Saldo de PayPal | Billetera móvil | $0 |
| CAD | Menos de $3,000 | Saldo de PayPal | Tarjeta débito | $0 |
| CAD | Menos de $6,000 | Saldo de PayPal | Retiro en efectivo | $0 |
| CAD | Menos de $10,000 | Saldo de PayPal | Cuenta bancaria | $0 |

Esto confirma que **fuera de estas condiciones, el fee es positivo y no está publicado** — solo se conoce vía cotizador. También confirma que el fee varía tanto por **método de pago** (PYUSD, saldo PayPal, tarjeta débito, cuenta bancaria) como por **método de cobro** (cuenta bancaria, tarjeta débito, billetera móvil, efectivo).

### Muestra del cotizador en vivo

| Corredor | Monto enviado (default de carga) | Recibe | Tipo de cambio ofrecido | Fee | Tasa mid-market del día | Spread cambiario implícito |
|---|---|---|---|---|---|---|
| GB → MX | £350.00 GBP | 7,835.00 MXN | 1 GBP = **22.3860 MXN** ("Best Xoom Rate") | No obtenido (bloqueado por redirección al hacer clic en "Show Fees") | 1 GBP = 23.08010 MXN (xe.com) | ≈ 3.01% |

**URL exacta consultada:** https://www.xoom.com/mexico/send-money

Cita textual de la propia página del cotizador sobre cómo gana dinero: *"We make money on the exchange rate. The currency conversion spread varies per transaction and refreshes frequently. We round to the nearest whole peso."* — confirma en fuente primaria que el margen cambiario es variable y no está fijado.

No fue posible obtener el fee explícito en este corredor ni muestrear otros montos (100/500/1,000/5,000/10,000) porque el clic en "Show Fees" (necesario para revelar el fee) disparó el mismo secuestro de pestaña hacia paysend.com.

### Variación por método de pago/cobro
Confirmado explícitamente por Xoom (cita arriba) y por la tabla de condiciones $0-fee: el fee varía por método de pago (PYUSD, saldo PayPal, tarjeta débito/crédito, cuenta bancaria) y por método de cobro (banco, tarjeta débito, billetera móvil, efectivo).

---

## 3. Tipos de cambio mid-market usados para calcular spread

| Par | Tasa mid-market | Fuente | Fecha/hora |
|---|---|---|---|
| GBP/MXN | 23.08009729 | xe.com | 2026-08-23, 16:52 UTC |
| USD/MXN | 16.9661 | xe.com | 2026-08-24, 17:12 UTC |

---

## 4. Qué NO se pudo verificar (declarado explícitamente, sin inventar)

- Fee de Xoom en el corredor GB→MX (bloqueado por redirección al interactuar con el cotizador) — posteriormente obtenido en otra ronda de esta sesión (ver nota de estado al inicio).
- Fee/tasa de Ria y Xoom en montos distintos al default de carga de página (100 GBP/USD para Ria; 350 GBP para Xoom) — no se pudo cambiar el monto de forma confiable por el secuestro de pestaña.
- Comparación directa tarjeta vs. banco en el mismo corredor para ambos proveedores.
- Si el comportamiento de redirección es un problema del entorno de navegación usado en esta sesión o un problema real de esas páginas — no se puede afirmar cuál, solo que ocurrió de forma consistente y reproducible en ambos sitios.
