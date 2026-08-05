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
