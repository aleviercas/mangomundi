# Global66 — datos en vivo vía capturas de pantalla del usuario — 2026-09-11

> Complementa `2026-09-11-fintechs-argentinas-remesas-entrantes.md` (que dejaba a
> Global66 inactivo por falta de una medición en vivo) y
> `2026-09-11-puentes-cripto-multi-corredor.md` (Venezuela/USDT). El browsing
> automático fue cancelado por el usuario; en su lugar, proporcionó 8 capturas de
> pantalla reales de la calculadora de global66.com, más 2 capturas de la cobertura
> de países (Personas: 70+, Business: 50+).

---

## 1. Corredores fiat — cargados, Global66 reactivado

| Corredor | Fee | Tasa aplicada | Margen (ver nota de referencia) |
|---|---|---|---|
| AR→ES (salida) | 0 ARS | 1 EUR = 1.932,23 ARS | 5.90% |
| AR→IT (salida, reutiliza AR→ES) | 0 ARS | igual | 5.90% |
| AR→GB (salida) | 0 ARS | 1 GBP = 2.250,90 ARS | 6.02% |
| **GB→AR (ENTRADA)** | 4,01 GBP (5.49%) | 1 GBP = 2.067,38 ARS | **7.97%** |

`providers.active` para Global66 pasa a `true` — ya había suficiente evidencia
directa y confirmada para dejar de estar oculto en el comparador.

## 2. Hallazgo metodológico importante: el "blue" de dolarapi.com está desactualizado

Al recalcular estos márgenes noté algo que afecta a **todo el proyecto**, no solo a
Global66: `dolarapi.com/v1/dolares/blue`, consultado en vivo hoy (11-sep-2026),
devuelve `fechaActualizacion: 2026-09-05` — **6 días de atraso**. Las propias
cotizaciones de Global66 para comprar/vender USDT contra ARS (1.631,12 al vender,
1.575,15 al comprar) implican un dólar blue real hoy más cerca de **1.603** —
notablemente por encima de los 1.540 que muestra dolarapi.

**Usé un valor de compromiso (1.571,5, punto medio) para todos los cálculos de esta
sesión, documentado explícitamente como provisorio en cada fila.** Esto también
pone en duda la precisión de varios recálculos ARS ya hechos esta semana (Prex
Venezuela del 10-sep, por ejemplo, usó blue=1.540) — no los alcancé a revisar de
nuevo con esta nota, queda para la próxima ronda.

**Recomendación**: antes de la próxima ronda de research con ARS, conseguir una
fuente de blue genuinamente en vivo (o confirmar con vos si tenés una preferida) en
vez de seguir confiando en el endpoint de dolarapi.com sin verificar la fecha cada
vez.

## 3. Cripto: USDT casi gratis, USDC y GBP caros — el hallazgo más fuerte de hoy

Las capturas también muestran que **Global66 ofrece conversión directa a USDT y
USDC** (compra y venta), un tercer proveedor con puente cripto además de
Belo/Lemon. Los números de ENTRADA (relevantes para remesas hacia Argentina):

| Activo enviado | Fee | Costo real estimado |
|---|---|---|
| **USDT → ARS** | 0.31 USDT (**0.30%**) | **≈0.07%** |
| USDC → ARS | 4.23 USDC (5.79%) | ≈5.59% |
| GBP → ARS | 4.01 GBP (5.49%) | ≈7.97% |

**USDT es prácticamente gratis comparado con cualquier otra opción — casi 100 veces
más barato que GBP.** Esto es consistente con y refuerza el hallazgo de ayer sobre
Venezuela (90% de remesas vía USDT) — Global66 parece tener una política de fees
deliberadamente mínima para USDT específicamente, probablemente porque es el activo
con más liquidez P2P en Argentina también.

**No cargado a `fx_rates`** — mismo problema estructural ya documentado para
Belo/Lemon: el destinatario recibe una stablecoin, no ARS directamente en la mayoría
de los flujos reales, y el esquema actual no representa eso. Los números crudos
(reales, de fuente primaria, sin ambigüedad promocional) quedan documentados acá
para cuando se tome la decisión de esquema.

## 4. Cobertura de países — Venezuela confirmado para Personas

Las dos capturas de cobertura confirman:
- **Personas** (individuos): 70+ países, **incluye Venezuela explícitamente** — no
  investigado todavía si el corredor Venezuela tiene el mismo problema de
  calculadora JS que bloqueó Argentina, o si es medible. Candidato fuerte para la
  próxima ronda, dado el hallazgo del 90% USDT de ayer.
- **Business**: 50+ países, lista distinta y más chica, sin Venezuela — cobertura
  separada de la de Personas, no intercambiables.

---

## 5. Estado de esta sesión

- `fx_rates`: 923→925 (+2, AR→GB y GB→AR; AR→ES/IT fueron UPDATE).
- `providers`: Global66 pasa a `active=true`.
- Nada cripto cargado — pendiente de la decisión de esquema (ver Sección 3 de
  `2026-09-11-fintechs-argentinas-remesas-entrantes.md`).
- Nota de staleness de dolarapi.com blue: documentada, no resuelta — afecta
  potencialmente otros recálculos ARS de esta semana.
