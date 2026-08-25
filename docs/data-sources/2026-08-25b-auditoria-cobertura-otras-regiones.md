# Auditoría de cobertura de corredores fuera de Argentina (25 ago 2026)

**Estado: 45 corredores nuevos cargados en 5 tandas, cortado por cuota de la sesión — ver sección 0.3.** Fase 1 (auditoría de cobertura, fuente primaria sin navegador) completa para 11 proveedores. Fase 2 (cotización en vivo con navegador, carga a `fx_rates`) hecha en 5 tandas dentro de esta misma ronda: tanda 1 (17 corredores), tanda 2 (15 corredores más, + Remitly), tanda 3 (5 pares prioritarios de nicho), tanda 4 (re-verificación de los 5 corredores `sin_confirmar` de tandas anteriores — 2 pasan a confirmado, uno con corrección de dato), y tanda 5 (8 pares prioritarios adicionales de nicho). Método idéntico al aplicado a Argentina (ver `2026-08-25-research-tarifas-y-cobertura-argentina.md`, sección 4): un agente de investigación por proveedor identifica corredores reales de alto volumen no cargados, citando fuente primaria; luego un agente de navegador (uno por vez, para evitar contención de pestañas) cotiza en vivo el precio regular (nunca promocional) para 500 (o 1000-2000, cuando el monto menor caía en ventana promocional) unidades de la moneda de origen. Todo lo cargado está en `fx_rates`, con la migración espejada en `supabase/migrations/20260825095500_load_otras_regiones_corridors_batch1.sql`, `20260825095600_fix_ubl_and_load_final_batch.sql`, `20260825100000_load_otras_regiones_corridors_batch2.sql`, `20260825100100_load_otras_regiones_corridors_batch3_nicho.sql`, `20260825100200_reverify_sin_confirmar_batch4.sql` y `20260825100300_load_otras_regiones_corridors_batch5_nicho2.sql`.

**Nota operativa de esta sesión:** durante el trabajo hubo dos interrupciones temporales de infraestructura (el clasificador de seguridad que autoriza el uso de herramientas de navegador y de escritura a Supabase quedó caído un rato dos veces). Se resolvió reintentando; no afectó la calidad de los datos cargados, solo demoró el proceso. Se documenta por si es relevante para diagnósticos futuros de la plataforma.

---

## 0. Precios cargados (45 corredores nuevos, 25-ago-2026, 500-2000 unidades de la moneda de origen)

Convención de signo de `public_spread_percent`: positivo = el cliente recibe MENOS que el mid-market (margen a favor del proveedor); negativo = recibe MÁS (tasa "premium", típico en NGN por la brecha oficial/paralelo). Mid-market: xe.com, mismo día.

### Tanda 1

| Proveedor | Corredor | Tasa | Fee | Spread | Estado | Nota |
|---|---|---|---|---|---|---|
| Western Union | ES→MX | 19.3811 (EUR→MXN) | 0.00 EUR | +2.03% | confirmado | — |
| Western Union | KW→IN | 308.5104 (KWD→INR) | 1.25 KWD | +0.59% | sin confirmar | Checkout completo dio error técnico repetido; re-intentado en tanda 4, mismo error a 300 y 500 KWD — no depende del monto |
| Western Union | QA→IN | 26.1377 (QAR→INR) | 0.00 QAR | +0.57% | confirmado | Verificado en flujo completo de checkout |
| MoneyGram | US→NG | 1381.66 (USD→NGN) | 0.99 USD | −2.50% | confirmado | Tasa "regular" mostrada junto a la promocional tachada |
| WorldRemit | US→IN | 95.0866 (USD→INR) | 0.99 USD | +0.35% | confirmado | — |
| WorldRemit | GB→PK | 370.86 (GBP→PKR) | 0.00 GBP | +1.92% | sin confirmar | Re-verificado en tanda 4: ningún rótulo textual "regular/standard" en el sitio, sigue sin confirmación positiva (solo ausencia de banner de promo) |
| Ria | US→PH | 61.275 (USD→PHP) | 0.90 USD | +0.63% | confirmado | Tasa regular tachada junto a la promocional |
| Ria | GB→PH | 84.030918 (GBP→PHP) | **1.99 GBP (corregido en tanda 4, ver nota)** | +0.15% | confirmado | Ver corrección en tanda 4 más abajo — el fee 0 original era promocional sin límite de monto |
| Paysend | US→MX | 16.7525 (USD→MXN) | 0.99 USD | +1.15% | confirmado | — |
| Xoom | GB→MX | 22.3822 (GBP→MXN) | 2.99 GBP | +3.19% | confirmado | "Best Xoom Rate", banco/débito |
| Xoom | GB→PH | 81.9466 (GBP→PHP) | 0.99 GBP | +2.63% | confirmado | Billetera móvil (más barato) |
| Xoom | CA→PH | 43.5816 (CAD→PHP) | 0.00 CAD | +2.27% | confirmado | Confirmado en tanda 4 vía T&C de Xoom (promo limitada a fondeo en USD y residentes de EE.UU., Canadá queda fuera por diseño) |
| Xoom | CA→IN | 68.0114 (CAD→INR) | 0.00 CAD | +1.57% | confirmado | "Best Xoom Rate" confirmado |
| NALA | GB→NG | 1885.05 (GBP→NGN) | 0.00 GBP | −2.65% | sin confirmar | Re-verificado en tanda 4: "Compare rates" existe para Nigeria pero no desglosa fee; confirmado que NALA nunca desglosa fee en ningún corredor (diseño del sitio, no hueco de investigación) |
| TapTap Send | GB→IN | 130.000 (GBP→INR) | 0.99 GBP | −0.03% | confirmado | Corredor nuevo (India no estaba cargado para ningún país emisor) |
| Sendwave | US→IN | 95.412 (USD→INR) | 3.99 USD | +0.01% | confirmado | Fee tiered (1.99 a 100 USD, 3.99 a 500 USD) — no plano |
| LemFi | GB→IN | 129.9 (GBP→INR) | 1.25 GBP | +0.05% | confirmado | Corredor nuevo (India no estaba cargado para ningún país emisor) |

### Tanda 2

| Proveedor | Corredor | Tasa | Fee | Spread | Estado | Nota |
|---|---|---|---|---|---|---|
| Western Union | FR→CI | 655.9570 (EUR→XOF) | 5.99 EUR | 0.00% | confirmado | XOF fijado a EUR (peg del franco CFA) |
| Western Union | FR→BJ | 655.9570 (EUR→XOF) | 6.99 EUR | 0.00% | confirmado | Mismo peg que CI |
| Western Union | IT→EC | 1.1562 (EUR→USD) | 4.99 EUR | +0.93% | confirmado | Cash pickup; fee regular tachado junto al promo (100% OFF) |
| Western Union | IT→PE | 3.9575 (EUR→PEN) | 3.99 EUR | −1.04% | confirmado | Cash pickup; mismo patrón de tachado |
| MoneyGram | DE→PL | 4.22 (EUR→PLN) | 3.99 EUR | +2.04% | confirmado | Banner explícito "first transfer"; se cargó el valor regular tachado |
| Remitly | US→NG | 1374.67 (USD→NGN) | 0.00 USD | −1.98% | confirmado | "Standard rate" explícito, probado a 1000 y 2000 USD |
| Remitly | CA→NG | 993.74 (CAD→NGN) | 0.00 CAD | −2.13% | confirmado | "Standard rate" explícito a 1000 CAD |
| Remitly | CA→GH | 7.9851 (CAD→GHS) | 0.00 CAD | +1.19% | confirmado | Etiquetado "Everyday rate" |
| Ria | ES→PH | 71.60 (EUR→PHP) | 3.00 EUR | +0.48% | confirmado | Tasa/fee regulares tachados junto a la promo |
| Ria | IT→PH | 71.15 (EUR→PHP) | 1.00 EUR | +1.10% | confirmado | Ídem |
| Paysend | US→PH | 61.7076 (USD→PHP) | 2.66 USD | −0.07% | confirmado | Sin banner promocional |
| Paysend | US→IN | 95.3984 (USD→INR) | 2.66 USD | +0.02% | confirmado | Sin banner promocional |
| Paysend | GB→IN | 130.1438 (GBP→INR) | 0.00 GBP | −0.14% | confirmado | Fee 0 constante entre montos (no es promo) |
| Paysend | GB→PK | 377.8061 (GBP→PKR) | 0.00 GBP | +0.13% | confirmado | Ídem |
| Xoom | US→PH | 59.7465 (USD→PHP) | 0.00 USD | +3.11% | confirmado | Entrega "Bank Deposit" sin etiqueta "First Time Rate" |

**No cargados en tanda 2 — se probaron múltiples montos/métodos y persistió el banner promocional en todos:**
- WorldRemit AU→IN: probado a 1000/2000/9990 AUD, siempre "First Transfer Rate", sin tasa regular visible sin login.
- WorldRemit AU→PK: mismo resultado, probado además con Cash Pickup y Mobile Money (a diferencia de GB→PK, cambiar de método no sacó el banner en este par).

### Tanda 3 (pares prioritarios de nicho)

| Proveedor | Corredor | Tasa | Fee | Spread | Estado | Nota |
|---|---|---|---|---|---|---|
| TapTap Send | GB→PK | 378.200 (GBP→PKR) | 0.00 GBP | +0.03% | confirmado | Sin banner promocional |
| TapTap Send | GB→PH | 83.800 (GBP→PHP) | 0.00 GBP (desde) | +0.43% | confirmado | Fee "from £0.00*", variable por método de entrega en checkout real |
| Sendwave | CA→IN | 68.640 (CAD→INR) | 1.99 CAD | +0.66% | confirmado | Sin rótulo "Intro Rate Discount" |
| Sendwave | FR→IN | 110.925 (EUR→INR) | 0.99 EUR | +0.31% | confirmado | Ídem |
| NALA | GB→GH | 15.26 (GBP→GHS) | 0.00 GBP | −0.38% | confirmado | Confirmado vía su propia pestaña "Compare rates" (tasa de mercado corriente, no promo aislada) |

**Nota:** se intentó también LemFi GB→NG en esta tanda, pero **ya existía** en `fx_rates` (cargado en una tanda anterior de esta misma sesión, con dos filas por escalón de monto). Se descartó ese insert para no duplicar.

### Tanda 4 (re-verificación de corredores `sin_confirmar`)

Se probó un enfoque distinto al que había fallado antes para los 5 corredores `sin_confirmar` acumulados hasta la tanda 3. Resultado: 2 pasan a confirmado (uno con corrección de dato), 3 siguen sin_confirmar por motivos estructurales del sitio (no por falta de intento).

| Corredor | Qué se probó distinto | Resultado |
|---|---|---|
| Western Union KW→IN | Checkout completo de nuevo + monto distinto (300 KWD) | **Sigue sin_confirmar.** Mismo error técnico reproducible a 300 y 500 KWD — no depende del monto, es un problema del sitio para este corredor. |
| WorldRemit GB→PK | Búsqueda de rótulo textual "Everyday/Standard rate" + método Mobile Money | **Sigue sin_confirmar.** Cash Pickup y Mobile Money no muestran el banner de promo de Bank Transfer, pero no existe ningún rótulo textual positivo de "regular" en el sitio — solo ausencia de promo, no confirmación. |
| Ria GB→PH | Monto más alto (2.000 GBP) + lectura de T&C de la promo | **Confirmado_activo, con corrección de dato.** El fee 0 GBP persistió incluso a 2.000 GBP — los T&C (riamoneytransfer.com/en-gb/promo/) confirman que es promo de bienvenida SIN límite de monto, no condición estándar. **El fee regular real es 1.99 GBP** (tachado junto al promocional). La tasa (84.030918) sí se confirmó regular. Dato corregido en `fx_rates`. |
| Xoom CA→PH | Lectura de T&C de la promo de Xoom | **Confirmado_activo.** Los T&C (xoom.com/legal/xoom-new-user-promo) excluyen explícitamente fondeo no-USD y limitan la promo a residentes de EE.UU. — Canadá queda fuera por diseño. Tasa ya cargada (43.5816) confirmada sin cambios. |
| NALA GB→NG | Verificación de "Compare rates" para Nigeria + búsqueda de página de fees dedicada | **Sigue sin_confirmar.** "Compare rates" existe mostrando el monto final recibido pero sin línea de fee separada; no existe página de fees dedicada en el sitio — NALA nunca desglosa su fee en ningún corredor, confirmado como diseño consistente, no un hueco de esta investigación puntual. |

### Tanda 5 (pares prioritarios adicionales de nicho)

| Proveedor | Corredor | Tasa | Fee | Spread | Estado | Nota |
|---|---|---|---|---|---|---|
| LemFi | GB→PK | 378.41 (GBP→PKR) | 0.00 GBP | −0.03% | sin confirmar | Fee pasa de 0.99 GBP (100 GBP) a 0.00 GBP (500 GBP) sin etiqueta que aclare si es tramo estándar o promo "envía más, paga menos" |
| LemFi | GB→PH | 83.8 (GBP→PHP) | 1.00 GBP | +0.43% | confirmado | Sin banner promocional |
| Sendwave | GB→IN | 129.655 (GBP→INR) | 0.99 GBP | +0.24% | confirmado | Se verificó que el rótulo "Intro Rate Discount" (presente en su corredor GB→PH) está ausente para India |
| NALA | GB→IN | 129.900 (GBP→INR) | 0.00 GBP | +0.05% | confirmado | Sin fee explícito (diseño consistente del sitio), sin banner promocional |
| NALA | GB→PK | 377.809 (GBP→PKR) | 0.00 GBP | +0.13% | confirmado | Ídem |
| NALA | GB→PH | 83.482 (GBP→PHP) | 0.00 GBP | +0.80% | confirmado | Ídem |
| TapTap Send | FR→SN | 655.957 (EUR→XOF) | 0.00 EUR | 0.00% | confirmado | Etiqueta "No transfer fees"; XOF fijado a EUR (peg CFA) |
| TapTap Send | GB→UG | 5030.000 (GBP→UGX) | 0.00 GBP | +1.11% | confirmado | Etiqueta "No transfer fees", sin banner promocional |

## 0.1 Bug adicional encontrado y corregido: UBL Tezraftaar Cash

Mismo patrón que BDO Remit/Money2India (sección 1 del research de Argentina): `fee_percent`, `fee_fixed` y `spread_percent` estaban en 0 y `fee_tiers` vacío — se mostraba gratis en cualquier comparación real pese a tener datos reales en `fx_rates` (AE→PK, World Bank RPW). Corregido espejando ese dato al campo genérico `spread_percent` (0.54%). No encaja en `fee_tiers` porque sus tramos varían por moneda de origen (QAR/AED), no por monto en una sola moneda.

## 0.2 Sobre el dilema planteado por el usuario: "no mostrar sin datos, no ocultar a quien sí opera"

Con la arquitectura actual (`ENABLE_CORRIDOR_FILTERING` apagado), **todo proveedor activo se muestra en TODAS las comparaciones**, sin excepción — nunca se oculta nadie por falta de datos. Esto significa que el riesgo real no es "un proveedor que opera un corredor queda invisible" (eso no puede pasar hoy), sino dos riesgos distintos:
1. **Un proveedor sin dato específico del corredor se muestra con un número genérico incorrecto** (el bug de BDO Remit/Money2India/UBL Tezraftaar: mostrarse gratis). Esto ya se auditó y corrigió para los 3 casos existentes esta sesión.
2. **Un proveedor que NO opera un corredor real igual aparece en esa comparación** con su estimación genérica (ej. NALA, especializado en África, aparecería hoy en una comparación EE.UU.→México). Esto es un problema arquitectónico ya identificado en `2026-08-diagnostico-arquitectura-proveedores-corredores.md`, y **no tiene solución completa a nivel de datos** — el motor necesitaría una tabla o campo que declare explícitamente qué corredores opera cada proveedor (la tabla `corridor_notes` actual es por-corredor, no por-proveedor, así que no alcanza para esto). Queda como decisión de arquitectura para la próxima fase del roadmap (motor + diseño), no algo que se pueda resolver solo cargando más datos.

Mientras tanto, la mitigación de datos que sí se puede hacer — y que se hizo activamente en toda esta sesión — es: nunca dejar un proveedor activo con campos genéricos en cero, y cargar el corredor real con el mejor dato disponible en cuanto se detecta un hueco.

## 0.3 Corte por cuota de sesión

El usuario señaló que quedaba con cuota semanal limitada. Se decidió en conjunto priorizar cobertura por volumen de búsqueda esperado en vez de agotar cada matriz de expansión por completo. Con eso se completaron las tandas 1-5 (45 corredores nuevos cargados, más 2 correcciones de dato en corredores ya existentes) y se dejó explícitamente pendiente para la próxima sesión/ronda: el resto de los corredores "sin resolver" en las secciones 1-7 de abajo, la expansión completa de las matrices de TapTap Send/Sendwave/LemFi/NALA (secciones 8-11), la re-verificación de los 4 corredores `sin_confirmar` restantes, y la extensión de la auditoría a regiones nuevas — todo listado en "Próximos pasos" al final de este documento. Nada de lo ya cargado se pierde entre sesiones: vive en Supabase y en este repositorio.

---

## 1. Western Union — 7 corredores confirmados (7 cargados, 1 sin_confirmar)

| Corredor | Fuente | Nota |
|---|---|---|
| ES→MX (España→México) | westernunion.com/es/en/send-money-to-mexico.html | **Cargado**, confirmado |
| KW→IN (Kuwait→India) | westernunion.com/kw/en/send-money-to-india.html | **Cargado**, sin_confirmar (error técnico reproducible en checkout, no depende del monto) |
| QA→IN (Catar→India) | westernunion.com/qa/en/send-money-to-india.html | **Cargado**, confirmado |
| FR→CI (Francia→Costa de Marfil) | westernunion.com/fr/en/send-money-to-ivory-coast.html | **Cargado**, confirmado |
| FR→BJ (Francia→Benín) | westernunion.com/fr/fr/send-money-to-benin.html | **Cargado**, confirmado |
| IT→EC (Italia→Ecuador) | westernunion.com/it/en/send-money-to-ecuador.html | **Cargado**, confirmado |
| IT→PE (Italia→Perú) | westernunion.com/it/en/send-money-to-peru.html | **Cargado**, confirmado |

**Nota importante — Kuwait/Catar como países emisores:** ninguno de los dos aparecía como país emisor en nuestro catálogo de Western Union pese a que Golfo→Sur de Asia es de los corredores de mayor volumen del mundo (KNOMAD/World Bank). Es probable que también existan KW→PK, KW→BD, QA→NP, QA→PK, pero no se encontró página dedicada indexada para confirmarlos — quedan como sospecha, no confirmados.

**Negativo confirmado (no es un gap, es una restricción real):** Western Union y MoneyGram suspendieron operaciones en Rusia y Bielorrusia en marzo 2022 por sanciones tras la invasión a Ucrania. Cualquier corredor UE/EE.UU.→Rusia que parezca "faltante" es en realidad no operativo por cumplimiento normativo, no un hueco de datos.

## 2. MoneyGram — 3 corredores confirmados (2 cargados, 1 solo promo)

| Corredor | Fuente | Estado |
|---|---|---|
| US→NG (EE.UU.→Nigeria) | moneygram.com/us/en/corridor/nigeria | **Cargado**, confirmado |
| DE→PL (Alemania→Polonia) | moneygram.com/de/en/corridor/poland | **Cargado**, confirmado |
| GB→GH (Reino Unido→Ghana) | moneygram.com/gb/en/corridor/ghana | Solo tarifa promocional disponible; flujo completo exige crear cuenta — sin resolver |

## 3. Remitly — 3 corredores confirmados (3 cargados)

| Corredor | Fuente | Estado |
|---|---|---|
| CA→NG (Canadá→Nigeria) | remitly.com/ca/en/nigeria | **Cargado**, confirmado |
| CA→GH (Canadá→Ghana) | remitly.com/ca/en/money-transfer/send-money-to-ghana | **Cargado**, confirmado |
| US→NG (EE.UU.→Nigeria) | remitly.com/us/en/money-transfer/send-money-to-nigeria | **Cargado**, confirmado — se resolvió probando 1000/2000 USD, el disclaimer explícito de "Standard rate" confirmó la tasa regular |

Los tres muestran depósito bancario, retiro en efectivo y billetera móvil con socios locales nombrados (Access Bank, GT Bank, MTN Mobile Money, Vodafone Cash, Airtel Tigo Money) — evidencia de servicio activo real.

## 4. WorldRemit — 4 corredores confirmados (2 cargados, 2 no cargables por promo persistente)

| Corredor | Fuente | Estado |
|---|---|---|
| US→IN (EE.UU.→India) | worldremit.com/en-us/india | **Cargado**, confirmado |
| GB→PK (Reino Unido→Pakistán) | worldremit.com/en-gb/pakistan | **Cargado**, sin_confirmar (re-verificado en tanda 4, sigue sin rótulo positivo de "regular") |
| AU→IN (Australia→India) | worldremit.com/en-au/india | Probado a 3 montos y 2 métodos, banner promocional persistente en todos — no cargado |
| AU→PK (Australia→Pakistán) | worldremit.com/en-au/pakistan | Probado a 3 montos y 3 métodos de entrega, banner promocional persistente en todos — no cargado |

## 5. Ria Money Transfer — 4 corredores confirmados (4 cargados)

| Corredor | Fuente | Estado |
|---|---|---|
| US→PH (EE.UU.→Filipinas) | riamoneytransfer.com/en-us/send-money-to-philippines/ | **Cargado**, confirmado |
| GB→PH (Reino Unido→Filipinas) | riamoneytransfer.com/en-gb/send-money-to-philippines/ | **Cargado**, confirmado (corregido en tanda 4: fee real 1.99 GBP, el 0 original era promo sin límite de monto) |
| ES→PH (España→Filipinas) | riamoneytransfer.com/en-es/send-money-to-philippines/ | **Cargado**, confirmado |
| IT→PH (Italia→Filipinas) | riamoneytransfer.com/en-it/send-money-to-philippines/ | **Cargado**, confirmado |

Los 4 citan más de 20.000 puntos de retiro en efectivo en Filipinas (Palawan Pawnshop, Cebuana Lhuillier, M. Lhuillier), bancos (BDO, Metrobank, BPI) y billeteras (GCash, PayMaya) — red operativa específica, no una plantilla genérica.

## 6. Paysend — 6 corredores confirmados (5 cargados, 1 solo promo)

| Corredor | Fuente | Estado |
|---|---|---|
| US→MX | paysend.com/hi-us/send-money/from-the-united-states-of-america-to-mexico | **Cargado**, confirmado |
| US→PH | paysend.com/en-us/send-money/from-the-united-states-of-america-to-philippines | **Cargado**, confirmado |
| US→IN | paysend.com/en-us/send-money/from-the-united-states-of-america-to-india | **Cargado**, confirmado |
| GB→IN | paysend.com/en/send-money/from-united-kingdom-to-india/ | **Cargado**, confirmado — el fee 0 GBP resultó ser condición estándar del corredor, no promo |
| GB→PK | paysend.com/en-uk/send-money/from-united-kingdom-to-pakistan | **Cargado**, confirmado |
| ES→MX | paysend.com/en-es/send-money/spain-to-mexico | Solo 0 EUR promocional de nuevo cliente — sin resolver |

## 7. Xoom (PayPal) — 7 corredores confirmados (5 cargados, 2 solo promo)

GB→MX, GB→PH, CA→PH (confirmado en tanda 4), CA→IN, US→PH — cargados, todos confirmado_activo. AU→PH y AU→IN — solo tarifa promocional "First Time Rate" disponible, no se cargó.

## 8. TapTap Send — expansión mayor, 5 corredores cargados (de docenas posibles)

**Nuevos países emisores confirmados** (antes solo GB/US): 24 países de la UE (Austria, Bélgica, Croacia, Chipre, República Checa, Dinamarca, Estonia, Finlandia, Francia, Alemania, Grecia, Hungría, Irlanda, Italia, Luxemburgo, Malta, Países Bajos, Noruega, Polonia, Portugal, Rumania, Eslovaquia, España, Suecia), Canadá, Australia, Emiratos Árabes Unidos, Brasil. Fuente: help.taptapsend.com/en/sending-countries y taptapsend.com/en/licenses (licencias FINTRAC/AFSL/DFSA/CBUAE confirmadas).

**Nuevos países receptores confirmados** (antes solo Ghana/Kenia/Nigeria): Senegal (**cargado FR→SN**), Pakistán (**cargado GB→PK**), Filipinas (**cargado GB→PH**), India (**cargado GB→IN**), Uganda (**cargado GB→UG**). Lista general adicional (no verificada corredor por corredor): Bangladesh, Camboya, China, Etiopía, Egipto, varios países francófonos de África y Latinoamérica.

**Pendiente:** el resto de la matriz emisor×receptor (docenas de combinaciones) sigue sin cotizar individualmente.

## 9. Sendwave — expansión confirmada, 4 corredores cargados

**Nuevos emisores confirmados:** Canadá, Francia, Italia, España, Irlanda. Bélgica/Alemania/Portugal con confianza menor (aparecen en página general, no confirmados por corredor).

**Nuevos receptores confirmados:** India (**cargado US→IN, CA→IN, FR→IN, GB→IN**), Uganda, Tanzania, Filipinas (Senegal y Liberia con confianza menor).

**Negativo confirmado:** Vietnam y Tailandia figuran como "Coming soon" en la ficha de Google Play — no operativos, no cargar.

**Pendiente:** resto de la matriz sin cotizar (ej. US→Uganda/Tanzania/Filipinas, IT/ES→India).

## 10. LemFi — expansión grande, 4 corredores cargados

**Nuevo país emisor:** Australia (lanzamiento febrero 2026, AUSTRAC).
**Nuevos emisores UE:** Bélgica, Francia, Alemania, Irlanda, Italia, Países Bajos, Portugal, España.
**Nuevos receptores confirmados:** India (**cargado GB→IN**), Nigeria (**ya estaba cargado GB→NG, dos escalones de monto**), Pakistán (**cargado GB→PK, sin_confirmar — fee pasa de 0.99 a 0.00 GBP entre 100 y 500 GBP sin etiqueta que lo explique**), Filipinas (**cargado GB→PH**), Etiopía, Costa de Marfil, Ruanda, Senegal, Tanzania, Uganda, Liberia, Malí, Marruecos, Túnez, Togo, Camerún, Congo, Gabón, Benín; y en Asia: Bangladesh, China, Nepal, Sri Lanka, Vietnam.

**Pendiente:** resto de la matriz sin cotizar; nueva ruta AU→Nigeria/Ghana/Kenia una vez confirmados los receptores exactos desde Australia; aclarar si el fee 0 de GB→PK a 500 GBP es un tramo estándar (verificar en checkout logueado).

## 11. NALA — el gap más grande encontrado, 5 corredores cargados

Fuente: help.nala.money (artículo fechado 16-jul-2025) — 18 países emisores de la UE además de Reino Unido/EE.UU.

**Nuevos receptores confirmados:** Nigeria (**cargado GB→NG — sin_confirmar, NALA nunca desglosa su fee en ningún corredor, confirmado en tanda 4**), Ghana (**cargado GB→GH**), India (**cargado GB→IN**), Pakistán (**cargado GB→PK**), Filipinas (**cargado GB→PH**), Ruanda, Senegal, Camerún, Costa de Marfil, Sudáfrica, Bangladesh, Congo, Gabón.

⚠️ **Advertencia de la propia investigación:** la home de marketing de NALA (nala.com) solo menciona genéricamente "UK and USA" como emisores, lo cual contradice el artículo del centro de ayuda (más específico y fechado, se le da más peso). **Confirmado en tanda 4:** NALA nunca desglosa su fee por separado en ningún corredor — es diseño consistente del producto, no un hueco de esta investigación. **Pendiente:** el resto de la matriz 18×13.

---

## Próximos pasos

1. Cotizar los corredores restantes marcados "sin resolver": MoneyGram GB→GH y Paysend ES→MX (ambos requieren encontrar cómo ver el precio regular sin login), y WorldRemit AU→IN/AU→PK (banner promocional persistente pese a probar múltiples montos/métodos — puede requerir login o esperar a que cambie la campaña).
2. Expandir la matriz de TapTap Send, Sendwave, LemFi y NALA más allá de los corredores ya cargados (5, 4, 4 y 5 respectivamente) — priorizar por volumen de búsqueda esperado. Próximos candidatos sugeridos: TapTap US/UE→resto de Senegal/Uganda y otros receptores confirmados, Sendwave IT/ES→India y US→Uganda/Tanzania/Filipinas, LemFi resto de la matriz de países africanos confirmados, NALA resto de la matriz 18×13.
3. Re-verificar los 4 corredores que siguen `sin_confirmar` tras dos rondas de intento: Western Union KW→IN (error técnico reproducible, puede requerir contacto directo con soporte o esperar a que se resuelva del lado del sitio), WorldRemit GB→PK (sin rótulo positivo de "regular" pese a probar 3 métodos de entrega), NALA GB→NG (fee nunca desglosado, verificar si algún día el producto lo expone), LemFi GB→PK (aclarar si el fee 0 a 500 GBP es tramo estándar o promo, idealmente con checkout logueado).
4. Decisión de arquitectura pendiente (ver sección 0.2): diseñar un mecanismo de exclusión por-proveedor-por-corredor (no solo por-corredor como `corridor_notes` hoy) para cuando se aborde la fase de motor/arquitectura del roadmap.
5. Extender esta misma auditoría a regiones aún no cubiertas (Sudeste Asiático más allá de Filipinas/Vietnam, Medio Oriente más allá de los corredores hacia India ya mencionados, Europa del Este).
