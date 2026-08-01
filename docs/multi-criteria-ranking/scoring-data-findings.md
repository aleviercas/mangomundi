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

## Datos confirmados (con fuente) — Tier 1

| Proveedor | trust_score | review_count (aprox.) | Fuente | Notas |
|---|---|---|---|---|
| Wise | 4.3 | ~294,000 | trustpilot.com/review/wise.com (jul 2026) | "Excellent" rating, 80% 5-estrellas |
| Remitly | 4.6 | ~116,000 | trustpilot.com/review/remitly.com | cash pickup: sí (bank deposit, cash pickup, mobile wallet, home delivery, ATM) |
| Revolut | 4.7 | ~429,000 | Trustpilot (citado desde la página de Remitly) | Rating más alto del lote |
| Western Union | 4.3 | ~165,000 | Trustpilot | cash pickup: sí (histórico core del negocio) |
| TapTap Send | 4.7 | ~36,000 | Trustpilot | cash pickup: no confirmado aún (mobile money/bank principalmente) |
| Ria Money Transfer | 4.3 | ~36,000 | Trustpilot | |
| WorldRemit | 4.0 | ~95,000 | Trustpilot | cash pickup: sí |
| MoneyGram | 4.0 | ~47,000 | Trustpilot | cash pickup: sí (core del negocio) |
| Airwallex | ~3.4–3.5 | ~2,300 | trustpilot.com/review/airwallex.com | business_focus_score: 8-9/10 (producto 100% business) |
| **OFX** | **4.2–4.4** (varía por fecha de fuente, uso 4.3) | ~11,000-11,400 | trustpilot.com/review/ofx.com, exiap.com, jobaroo.com (2026) | Sin cash pickup. **Especialista en transferencias grandes** (`supports_large_tickets: true`) — fundado 1998, "specializing in large transfers". Sin fee fijo, solo margen de cambio. Mobile app: 4.6 Google Play / 4.9 App Store. Cobertura: 170+ países, 50+ monedas |

## Datos confirmados — Tier 2

| Proveedor | trust_score | review_count (aprox.) | Fuente | Notas |
|---|---|---|---|---|
| **XE Money Transfer** | 4.1–4.3 (varía) | ~57,000-70,000 | moneytransfers.com, forbes.com/advisor/uk (2026) | **cash pickup: sí** (500,000+ agentes globales). Cobertura: 190-200+ países, 100-130+ monedas. Transparencia: una fuente nota que "no hace obvio que el fee está escondido en el margen de cambio" — transparency_score más bajo que OFX |
| **Currencies Direct** | 4.8–4.9 | ~17,500-19,400 | trustpilot.com/review/www.currenciesdirect.com (jul 2026) | Rating altísimo, consistente en múltiples fuentes/fechas. Broker con account manager — business_focus moderado |
| **TorFX** | 4.8–4.9 | ~8,000-10,000 | uk.trustpilot.com/review/www.torfx.com (jul 2026), topmoneycompare.co.uk | Broker especializado en transferencias grandes (`supports_large_tickets: true`). Menos competitivo para montos chicos según reviewers |
| **Payoneer** | 3.6 | no especificado (miles) | uk.trustpilot.com/review/www.payoneer.com (feb 2026) | Rating "Average", el más bajo de Tier 2 investigado. **business_focus_score alto** (8-9/10) — 100% orientado a SMBs/freelancers globales |
| **Moneycorp** | 4.7 | ~7,000 | trustpilot.com/review/www.moneycorp.com (jul 2026) | Rating "Excellent", reviews destacan servicio personalizado para transferencias grandes |
| Convera | *pendiente* | — | — | No investigado todavía |
| Instarem | 4.4 | ~7,000 | moneytransfers.com | "Excellent" rating |
| CAB Payments | N/A | — | — | Sin programa de afiliados, sin necesidad de trust_score (no es opción de comparación para retail) |

## Datos confirmados — Tier 3

| Proveedor | trust_score | review_count (aprox.) | Fuente | Notas |
|---|---|---|---|---|
| TransferGo | 4.6 | ~38,000-39,000 | trustpilot.com/review/transfergo.com (jul 2026) | |
| Paysend | 4.1–4.2 | ~41,000 | Trustpilot (citado desde página de TransferGo) | |
| CurrencyFair | 4.2–4.9 (fuentes muy dispersas — usar 4.6 de Trustpilot directo hasta confirmar) | ~8,000-12,000 | trustpilot.com (citado desde TransferGo), compareremit.com | Modelo peer-to-peer |
| Xoom, Skrill, TapTap Send (cash pickup), Sendwave, LemFi, NALA | *pendiente* | — | — | Sin investigar todavía en esta tanda |

## ⚠️ Alerta — Atlantic Money: caída fuerte y reciente en Trustpilot

Esto merece tu atención aparte de la carga de datos normal. Las fuentes más
viejas (2024) mostraban Atlantic Money con 4.1/5 en Trustpilot (pocas
reviews, ~27-160). Pero las páginas de Trustpilot más recientes que
encontré (fechadas "2 días", "hace 2 semanas" — julio 2026) muestran
**2.3 a 2.7/5, rating "Poor"**, con reviews recientes mencionando:
- Fondos retenidos por 12+ días sin explicación clara
- Baja tasa de respuesta a reviews negativas (46%)
- Un caso de usuario escalando a un ombudsman
- Son propiedad de Deel (que estaría preparando un IPO según una fuente)

**Esto no es algo que yo pueda resolver cargando un número** — es una señal
de que, antes de seguir promocionando Atlantic Money como featured/tier 1,
valdría la pena que lo revises vos mismo directo en
trustpilot.com/review/atlantic.money y decidas si lo bajás de tier o le
ponés una nota de precaución. Uso 2.5 como valor conservador (punto medio
de las fuentes más recientes) para no inflar ni hundir artificialmente el
dato, pero la decisión de tier es tuya.

## Cuando la Fase 1 esté más completa

Generar un `UPDATE` SQL por proveedor con los campos nuevos
(`trust_score`, `review_count`, `cash_pickup_available`,
`business_focus_score`, `countries_covered`) para pegar en el editor SQL de
Supabase — mismo patrón que se usó para las 400 filas de blog.
**No se corre nada contra la base de producción hasta que Alejandro lo
apruebe explícitamente** — la rama de código no protege la base de datos,
Supabase es compartida entre ramas.

## Pendiente de investigar (próxima tanda)

Convera, Xoom, Skrill (trust — ya sabíamos que probablemente no cubre
P2P), TapTap Send (cash pickup — trust ya está en 4.7), Sendwave, LemFi,
NALA. Mismo patrón de búsqueda: "[Proveedor] Trustpilot rating" suele traer
trust_score + review_count en el primer resultado; para cash pickup y
transparency_score conviene revisar la página de "delivery methods"/"fees"
del proveedor directamente.
