# mangomundi — Investigación: pago a tarjeta (card payout) por proveedor

> Origen: evaluando el filtro de "Bank account / Cash / Card / Broker" que
> usa Monito (screenshot de referencia del usuario) para ver si vale la pena
> sumarlo a mangomundi. De los 4, **Cash** ya lo tenemos (`cash_pickup_available`,
> Fase 1) y **Broker** ya lo tenemos (`provider_type`). Esta investigación
> cubre el que faltaba: **Card** (pago directo a una tarjeta de débito/crédito
> del destinatario — Visa Direct y similares). "Bank account" no se investigó
> proveedor por proveedor porque es el método casi universal de la industria;
> se propone asumirlo `true` por defecto salvo evidencia de lo contrario (ver
> nota al final).

## Metodología

Igual que Fase 1 (`scoring-data-findings.md`): solo se anota lo que dice la
fuente directa del proveedor (help center / blog propio), nunca se inventa.
"NO" significa "no encontré evidencia de que lo ofrezcan como método de
**entrega** al destinatario" — la tarjeta como método de **pago** (cómo vos
financiás el envío) es un concepto distinto y no cuenta acá.

## Resultado: 11 de 26 sí ofrecen card payout

| Proveedor | slug | Card payout | Fuente / nota |
|---|---|:---:|---|
| Remitly | `remitly` | **SÍ** | "Debit Card Deposit" — tarjeta Visa (una fuente menciona también Mastercard) emitida por banco compatible |
| Revolut | `revolut` | **SÍ** | "Card transfer" — a tarjeta Visa/Mastercard de terceros, 100+ países |
| Western Union | `western-union` | **SÍ** | Debit card payout + "Visa Direct" |
| MoneyGram | `moneygram` | **SÍ** | "Debit Card Deposit" explícito |
| Xoom (PayPal) | `xoom` | **SÍ** | "Debit Card Deposit" vía Visa Direct, confirmado en 25 países |
| Ria Money Transfer | `ria` | **SÍ** | "Visa Direct" — tarjeta débito Visa |
| Instarem | `instarem` | **SÍ** | "Bank Card"/"Debit Card" listados como payout method, varía por país |
| TransferGo | `transfergo` | **SÍ** | Envío a tarjeta débito/crédito en 32 países |
| Paysend | `paysend` | **SÍ** | Producto core es card-to-card (Visa Direct) |
| Skrill | `skrill` | **SÍ** | Bank account, Visa/Mastercard o mobile wallet según país |
| Payoneer | `payoneer` | **SÍ** (caso especial) | No es "push a cualquier tarjeta" — es su propia Payoneer Prepaid Mastercard como método de cobro |
| Wise | `wise` | NO | Entrega a cuenta bancaria (account details) o a su propia Wise card; sin push a tarjeta de un tercero |
| WorldRemit | `worldremit` | NO | 4 métodos confirmados: cash pickup, bank transfer, mobile money, WorldRemit Wallet/airtime |
| Airwallex | `airwallex` | NO | B2B — bank transfer/SWIFT y wallets digitales |
| Atlantic Money | `atlantic-money` | NO | Solo cuenta bancaria, confirmado explícito |
| OFX | `ofx` | NO | Solo cuenta bancaria — broker |
| XE Money Transfer | `xe` | NO | Bank account + cash pickup + mobile wallet; "debit card" ahí es método de pago, no de entrega |
| Currencies Direct | `currencies-direct` | NO | Solo cuenta bancaria, confirmado explícito ("no card payout") — broker |
| TorFX | `torfx` | NO | Solo cuenta bancaria, confirmado explícito — broker |
| Moneycorp | `moneycorp` | NO | Solo cuenta bancaria, confirmado — broker |
| Convera | `western-union-business` | NO | Enfoque B2B, sin evidencia de card payout — broker |
| CurrencyFair | `currencyfair` | NO | Solo cuenta bancaria, confirmado explícito |
| Sendwave | `sendwave` | NO | Mobile wallet + bank account + cash pickup; tarjeta es solo funding |
| LemFi | `lemfi` | NO | Bank deposit + mobile money + LemFi wallet |
| NALA | `nala` | NO | Mobile wallet + bank account; tarjeta es solo funding |
| TapTap Send | `taptap-send` | NO | Bank deposit + mobile money; tarjeta es solo funding |

**No investigados** (mismo criterio de alcance que Fase 1 — bancos
agregados sin programa de afiliados, o institucional puro): Chase, HSBC,
Santander, CAB Payments. **Inactivos, no aplica**: Azimo, Zing, Small World FS.

## Hallazgo no buscado: correlaciona 100% con "broker"

Los 6 proveedores con `provider_type = 'broker'` en la base (OFX, Currencies
Direct, TorFX, Moneycorp, Convera, y Atlantic Money que aún no tiene
`provider_type` cargado) dieron **0% card payout** — todos entregan
exclusivamente a cuenta bancaria. Tiene sentido: un broker de FX está armado
para transferencias grandes banco-a-banco, no para casos de uso tipo
remesa chica a una tarjeta. Esto valida que el filtro "Broker" de Monito
tiene una señal real detrás, no es solo cosmético.

## Sobre "Bank account" (no investigado individualmente)

Transferencia a cuenta bancaria es el método base de facto en toda la
industria — de los 26 proveedores de esta tabla, ninguna fuente consultada
sugirió que alguno **no** lo ofrezca. Se propone cargarlo `true` por
defecto para los 26 activos no-bancarios, salvo que en el futuro aparezca
evidencia de un caso particular (ej. un proveedor 100% mobile-money-only en
ciertos corredores).

## Próximo paso

Generar el `UPDATE` SQL con un nuevo campo (ej. `card_payout_available
boolean`) para los 26 proveedores de la tabla de arriba. **No se corre
nada contra producción hasta que Alejandro lo apruebe explícitamente**
— mismo criterio que Fase 1.

---

## Actualización: cash pickup — cierre de los 17 casos sin confirmar

El campo `cash_pickup_available` (Fase 1) había quedado en `null` para 17
proveedores activos no-bancarios — nunca investigados individualmente. El
tile "Cash" del filtro de método de entrega los trataba como "no" por
default, lo cual subestimaba el dato real. Cerrado con fuente directa por
proveedor:

| Proveedor | slug | Cash pickup | Fuente / nota |
|---|---|:---:|---|
| Instarem | `instarem` | **SÍ** | "Cash pickup" listado explícitamente entre sus payout methods |
| TransferGo | `transfergo` | **SÍ** | "cash payouts" confirmado como opción de entrega |
| Ria Money Transfer | `ria` | **SÍ** | "cash pickup at a nearby location" confirmado |
| Paysend | `paysend` | **SÍ** | Cash pickup confirmado, disponible en países seleccionados |
| TapTap Send | `taptap-send` | **SÍ** | Confirmado — disponible en mercados selectos (ej. Bangladesh vía bancos socios). Cierra el "no confirmado todavía" que había quedado abierto en Fase 1 |
| Wise | `wise` | NO | Confirmado explícito: "Wise's delivery options are limited to bank accounts only... won't be able to collect in cash with Wise" |
| Revolut | `revolut` | NO | Confirmado explícito: "Revolut does not offer cash pickup or mobile wallet delivery" (como *sender*, que es el caso relevante acá) |
| Skrill | `skrill` | NO | Confirmado explícito: "no physical agent network and no cash pickup option" |
| Currencies Direct | `currencies-direct` | NO | Ya confirmado en la investigación de card payout ("no cash pickup, no M-Pesa, no GCash") |
| TorFX | `torfx` | NO | Ídem — "no cash pickup, no M-Pesa, no GCash" |
| CurrencyFair | `currencyfair` | NO | Ídem — "does not offer... cash pickup" |
| Atlantic Money | `atlantic-money` | NO | Entrega solo a cuenta bancaria, sin mención de cash en ninguna fuente |
| LemFi | `lemfi` | NO | Confirmado explícito: "does not currently offer cash pickup or home delivery" |
| Payoneer | `payoneer` | NO | Sin evidencia de cash pickup en ninguna fuente — es tarjeta prepaga + banco |
| NALA | `nala` | NO | Sin evidencia de cash pickup — solo mobile wallet + cuenta bancaria |

### Casos con matiz — Moneycorp y Airwallex

**Moneycorp** (`moneycorp`) — Alejandro señaló que sabe que Moneycorp
ofrece cash para business. Investigado a fondo, pero lo único que aparece
sobre "cash" en Moneycorp es un servicio **completamente distinto**:
Moneycorp Bank (US) participa del programa "Foreign Bank International
Cash Services" de la Reserva Federal, proveyendo **billetes físicos al
por mayor a otras instituciones financieras** (un servicio de tesorería
banco-a-banco, no algo que un remitente use para que su destinatario
retire efectivo). No encontré ninguna fuente que describa un "cash pickup"
tipo Western Union para el producto de transferencias de Moneycorp — al
contrario, la investigación de card payout ya había confirmado que entrega
"solo a cuenta bancaria". Cargado como `false` por ahora, pero si tenés un
link/fuente concreta del servicio que tenías en mente, lo corrijo altiro —
puede que sea justamente ese servicio de tesorería de billetes, que es
real pero no aplica al caso de uso del comparador.

**Airwallex** (`airwallex`) — mencionado en una fuente como disponible
"para regiones no bancarizadas... vía Western Union", pero como
integración/partnership de terceros, no como feature nativo confirmado de
Airwallex. Dado que es una plataforma B2B de tesorería (no remesas
consumer), cargado como `false` con menor certeza que el resto — señal más
débil que las demás filas de esta tabla.
