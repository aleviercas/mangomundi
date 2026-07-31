# mangomundi — Fase 1: datos reales para el score multi-criterio

> Investigación en curso. Solo se cargan a Supabase los datos con fuente
> verificada — nunca se inventa un número. Cuando falta un dato, el motor de
> score (`scoring.functions.ts`) lo trata como neutral (0.5), no como
> penalización, así que no hay apuro en completar el 100% antes de activar
> el sistema.

## Metodología

- **trust_score**: rating de Trustpilot (escala 0-5), tomado directo de la
  página del proveedor en trustpilot.com o de fuentes que lo citen con
  fecha reciente (2026). Se prioriza el dato más reciente cuando hay
  variación entre fuentes.
- **review_count**: cantidad de reviews en Trustpilot al momento de la
  búsqueda (cambia constantemente, es aproximado).
- **cash_pickup_available**: si el proveedor ofrece retiro en efectivo como
  método de entrega (no solo transferencia bancaria).
- **business_focus_score**: escala 0-10, criterio editorial basado en si el
  producto está diseñado explícitamente para empresas (cuentas multi-moneda,
  tarjetas corporativas, gestión de gastos) vs. remesas P2P puras.
- **countries_covered**: países/corredores soportados, cuando el proveedor
  lo publica.

## Datos confirmados (con fuente)

| Proveedor | trust_score | review_count (aprox.) | Fuente | Notas |
|---|---|---|---|---|
| Wise | 4.3 | ~294,000 | trustpilot.com/review/wise.com (jul 2026) | "Excellent" rating, 80% 5-estrellas |
| Remitly | 4.6 | ~116,000 | trustpilot.com/review/remitly.com | cash pickup: sí (confirmado — bank deposit, cash pickup, mobile wallet, home delivery, ATM) |
| Revolut | 4.7 | ~429,000 | Trustpilot (citado desde la página de Remitly) | Rating más alto del lote investigado hasta ahora |
| Western Union | 4.3 | ~165,000 | Trustpilot (citado desde la página de Remitly) | cash pickup: sí (histórico core del negocio) |
| TapTap Send | 4.7 | ~36,000 | Trustpilot (citado desde la página de Remitly) | |
| Ria Money Transfer | 4.3 | ~36,000 | Trustpilot (citado desde la página de Remitly) | |
| WorldRemit | 4.0 | ~95,000 | Trustpilot (citado desde la página de Remitly) | cash pickup: sí |
| MoneyGram | 4.0 | ~47,000 | Trustpilot (citado desde la página de Remitly) | cash pickup: sí (core del negocio) |
| Airwallex | ~3.4–3.5 | ~2,300 | trustpilot.com/review/airwallex.com — fuentes varían entre 3.4 y 3.8 | Producto 100% business — `business_focus_score` alto (8-9/10) |

## Pendiente de investigar

Quedan sin verificar: Atlantic Money, OFX, XE Money Transfer, Currencies
Direct, TorFX, Payoneer, Moneycorp, Convera, Instarem, Xoom, Skrill, TapTap
Send (trust ya está, falta cash pickup/coverage), Sendwave, LemFi,
TransferGo, Paysend, NALA, CurrencyFair.

**Patrón recomendado para continuar:** buscar "[Proveedor] Trustpilot
rating" da casi siempre el dato de trust_score + review_count en el primer
resultado. Buscar "[Proveedor] cash pickup countries" o revisar la propia
página de "delivery methods" del proveedor para `cash_pickup_available`.

## Cuando la Fase 1 esté más completa

Generar un `UPDATE` SQL por proveedor con los campos nuevos
(`trust_score`, `review_count`, `cash_pickup_available`,
`business_focus_score`, `countries_covered`) para pegar en el editor SQL de
Supabase — mismo patrón que se usó para las 400 filas de blog.
**No se corre nada contra la base de producción hasta que Alejandro lo
apruebe explícitamente** — la rama de código no protege la base de datos,
Supabase es compartida entre ramas.
