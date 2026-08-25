# Auditoría de cobertura de corredores fuera de Argentina (25 ago 2026)

**Estado: 37 corredores nuevos cargados en 3 tandas, cortado por cuota de la sesión — ver sección 0.3.** Fase 1 (auditoría de cobertura, fuente primaria sin navegador) completa para 11 proveedores. Fase 2 (cotización en vivo con navegador, carga a `fx_rates`) hecha en 3 tandas dentro de esta misma ronda: tanda 1 (17 corredores, WU/MoneyGram/WorldRemit/Ria/Paysend/Xoom/NALA/TapTap/Sendwave/LemFi), tanda 2 (15 corredores más, mismos proveedores + Remitly), y tanda 3 (5 pares prioritarios de TapTap Send/Sendwave/NALA). Método idéntico al aplicado a Argentina (ver `2026-08-25-research-tarifas-y-cobertura-argentina.md`, sección 4): un agente de investigación por proveedor identifica corredores reales de alto volumen no cargados, citando fuente primaria; luego un agente de navegador (uno por vez, para evitar contención de pestañas) cotiza en vivo el precio regular (nunca promocional) para 500 (o 1000, cuando 500 caía en ventana promocional) unidades de la moneda de origen. Todo lo cargado está en `fx_rates`, con la migración espejada en `supabase/migrations/20260825095500_load_otras_regiones_corridors_batch1.sql`, `20260825095600_fix_ubl_and_load_final_batch.sql`, `20260825100000_load_otras_regiones_corridors_batch2.sql` y `20260825100100_load_otras_regiones_corridors_batch3_nicho.sql`.

**Nota operativa de esta sesión:** durante el trabajo hubo dos interrupciones temporales de infraestructura (el clasificador de seguridad que autoriza el uso de herramientas de navegador y de escritura a Supabase quedó caído un rato dos veces). Se resolvió reintentando; no afectó la calidad de los datos cargados, solo demoró el proceso. Se documenta por si es relevante para diagnósticos futuros de la plataforma.

---

## 0. Precios cargados (37 corredores nuevos, 25-ago-2026, 500-1000 unidades de la moneda de origen)

Convención de signo de `public_spread_percent`: positivo = el cliente recibe MENOS que el mid-market (margen a favor del proveedor); negativo = recibe MÁS (tasa "premium", típico en NGN por la brecha oficial/paralelo). Mid-market: xe.com, mismo día.

### Tanda 1

| Proveedor | Corredor | Tasa | Fee | Spread | Estado | Nota |
|---|---|---|---|---|---|---|
| Western Union | ES→MX | 19.3811 (EUR→MXN) | 0.00 EUR | +2.03% | confirmado | — |
| Western Union | KW→IN | 308.5104 (KWD→INR) | 1.25 KWD | +0.59% | sin confirmar | Checkout completo dio error técnico repetido; tasa tomada del widget de home |
| Western Union | QA→IN | 26.1377 (QAR→INR) | 0.00 QAR | +0.57% | confirmado | Verificado en flujo completo de checkout |
| MoneyGram | US→NG | 1381.66 (USD→NGN) | 0.99 USD | −2.50% | confirmado | Tasa "regular" mostrada junto a la promocional tachada |
| WorldRemit | US→IN | 95.0866 (USD→INR) | 0.99 USD | +0.35% | confirmado | — |
| WorldRemit | GB→PK | 370.86 (GBP→PKR) | 0.00 GBP | +1.92% | sin confirmar | Solo vía método "Cash Pickup"; "Bank Transfer" mostraba tasa promocional |
| Ria | US→PH | 61.275 (USD→PHP) | 0.90 USD | +0.63% | confirmado | Tasa regular tachada junto a la promocional |
| Ria | GB→PH | 84.030918 (GBP→PHP) | 0.00 GBP | +0.15% | sin confirmar | Tasa regular, pero el fee 0 podría seguir siendo la exención promocional |
| Paysend | US→MX | 16.7525 (USD→MXN) | 0.99 USD | +1.15% | confirmado | — |
| Xoom | GB→MX | 22.3822 (GBP→MXN) | 2.99 GBP | +3.19% | confirmado | "Best Xoom Rate", banco/débito |
| Xoom | GB→PH | 81.9466 (GBP→PHP) | 0.99 GBP | +2.63% | confirmado | Billetera móvil (más barato) |
| Xoom | CA→PH | 43.5816 (CAD→PHP) | 0.00 CAD | +2.27% | sin confirmar | No se pudo confirmar rótulo regular/promo para este par |
| Xoom | CA→IN | 68.0114 (CAD→INR) | 0.00 CAD | +1.57% | confirmado | "Best Xoom Rate" confirmado |
| NALA | GB→NG | 1885.05 (GBP→NGN) | 0.00 GBP | −2.65% | sin confirmar | Fee no desglosado por separado; URL de corredor directo dio 404 |
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

**Nota:** se intentó también LemFi GB→NG en esta tanda, pero **ya existía** en `fx_rates` (cargado en una tanda anterior de esta misma sesión, con dos filas por escalón de monto). Se descartó ese insert para no duplicar — queda pendiente elegir un corredor LemFi genuinamente nuevo (candidatos: GB→PK, GB→PH) para la próxima tanda.

## 0.1 Bug adicional encontrado y corregido: UBL Tezraftaar Cash

Mismo patrón que BDO Remit/Money2India (sección 1 del research de Argentina): `fee_percent`, `fee_fixed` y `spread_percent` estaban en 0 y `fee_tiers` vacío — se mostraba gratis en cualquier comparación real pese a tener datos reales en `fx_rates` (AE→PK, World Bank RPW). Corregido espejando ese dato al campo genérico `spread_percent` (0.54%). No encaja en `fee_tiers` porque sus tramos varían por moneda de origen (QAR/AED), no por monto en una sola moneda.

## 0.2 Sobre el dilema planteado por el usuario: "no mostrar sin datos, no ocultar a quien sí opera"

Con la arquitectura actual (`ENABLE_CORRIDOR_FILTERING` apagado), **todo proveedor activo se muestra en TODAS las comparaciones**, sin excepción — nunca se oculta nadie por falta de datos. Esto significa que el riesgo real no es "un proveedor que opera un corredor queda invisible" (eso no puede pasar hoy), sino dos riesgos distintos:
1. **Un proveedor sin dato específico del corredor se muestra con un número genérico incorrecto** (el bug de BDO Remit/Money2India/UBL Tezraftaar: mostrarse gratis). Esto ya se auditó y corrigió para los 3 casos existentes esta sesión.
2. **Un proveedor que NO opera un corredor real igual aparece en esa comparación** con su estimación genérica (ej. NALA, especializado en África, aparecería hoy en una comparación EE.UU.→México). Esto es un problema arquitectónico ya identificado en `2026-08-diagnostico-arquitectura-proveedores-corredores.md`, y **no tiene solución completa a nivel de datos** — el motor necesitaría una tabla o campo que declare explícitamente qué corredores opera cada proveedor (la tabla `corridor_notes` actual es por-corredor, no por-proveedor, así que no alcanza para esto). Queda como decisión de arquitectura para la próxima fase del roadmap (motor + diseño), no algo que se pueda resolver solo cargando más datos.

Mientras tanto, la mitigación de datos que sí se puede hacer — y que se hizo activamente en toda esta sesión — es: nunca dejar un proveedor activo con campos genéricos en cero, y cargar el corredor real con el mejor dato disponible en cuanto se detecta un hueco.

## 0.3 Corte por cuota de sesión

El usuario señaló que quedaba con cuota semanal limitada. Se decidió en conjunto priorizar cobertura por volumen de búsqueda esperado en vez de agotar cada matriz de expansión por completo. Con eso se completaron las tandas 1-3 (37 corredores nuevos cargados) y se dejó explícitamente pendiente para la próxima sesión/ronda: el resto de los corredores "pendiente de cotizar" en las secciones 1-7 de abajo, la expansión completa de las matrices de TapTap Send/Sendwave/LemFi/NALA (secciones 8-11), la re-verificación de los corredores `sin_confirmar`, y la extensión de la auditoría a regiones nuevas — todo listado en "Próximos pasos" al final de este documento. Nada de lo ya cargado se pierde entre sesiones: vive en Supabase y en este repositorio.

---

## 1. Western Union — 7 corredores confirmados (7 cargados)

| Corredor | Fuente | Nota |
|---|---|---|
| ES→MX (España→México) | westernunion.com/es/en/send-money-to-mexico.html | **Cargado**, confirmado |
| KW→IN (Kuwait→India) | westernunion.com/kw/en/send-money-to-india.html | **Cargado**, sin_confirmar |
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

## 3. Remitly — 3 corredores confirmados (2 cargados, 1 solo promo)

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
| GB→PK (Reino Unido→Pakistán) | worldremit.com/en-gb/pakistan | **Cargado**, sin_confirmar |
| AU→IN (Australia→India) | worldremit.com/en-au/india | Probado a 3 montos y 2 métodos, banner promocional persistente en todos — no cargado |
| AU→PK (Australia→Pakistán) | worldremit.com/en-au/pakistan | Probado a 3 montos y 3 métodos de entrega, banner promocional persistente en todos — no cargado |

## 5. Ria Money Transfer — 4 corredores confirmados (4 cargados)

| Corredor | Fuente | Estado |
|---|---|---|
| US→PH (EE.UU.→Filipinas) | riamoneytransfer.com/en-us/send-money-to-philippines/ | **Cargado**, confirmado |
| GB→PH (Reino Unido→Filipinas) | riamoneytransfer.com/en-gb/send-money-to-philippines/ | **Cargado**, sin_confirmar |
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

GB→MX, GB→PH, CA→PH, CA→IN, **US→PH (nuevo en esta ronda, confirmado vía opción "Bank Deposit" sin etiqueta de promo)** — cargados. AU→PH y AU→IN — solo tarifa promocional "First Time Rate" disponible, no se cargó.

## 8. TapTap Send — expansión mayor, 3 corredores cargados (de docenas posibles)

**Nuevos países emisores confirmados** (antes solo GB/US): 24 países de la UE (Austria, Bélgica, Croacia, Chipre, República Checa, Dinamarca, Estonia, Finlandia, Francia, Alemania, Grecia, Hungría, Irlanda, Italia, Luxemburgo, Malta, Países Bajos, Noruega, Polonia, Portugal, Rumania, Eslovaquia, España, Suecia), Canadá, Australia, Emiratos Árabes Unidos, Brasil. Fuente: help.taptapsend.com/en/sending-countries y taptapsend.com/en/licenses (licencias FINTRAC/AFSL/DFSA/CBUAE confirmadas).

**Nuevos países receptores confirmados** (antes solo Ghana/Kenia/Nigeria): Senegal, Pakistán (**cargado GB→PK**), Filipinas (**cargado GB→PH**), India (**cargado GB→IN**), Uganda. Lista general adicional (no verificada corredor por corredor): Bangladesh, Camboya, China, Etiopía, Egipto, varios países francófonos de África y Latinoamérica.

**Pendiente:** el resto de la matriz emisor×receptor (docenas de combinaciones) sigue sin cotizar individualmente — se recomienda priorizar US/UE→Senegal, Uganda en una próxima tanda.

## 9. Sendwave — expansión confirmada, 3 corredores cargados

**Nuevos emisores confirmados:** Canadá, Francia, Italia, España, Irlanda. Bélgica/Alemania/Portugal con confianza menor (aparecen en página general, no confirmados por corredor).

**Nuevos receptores confirmados:** India (**cargado US→IN, CA→IN, FR→IN**), Uganda, Tanzania, Filipinas (Senegal y Liberia con confianza menor).

**Negativo confirmado:** Vietnam y Tailandia figuran como "Coming soon" en la ficha de Google Play — no operativos, no cargar.

**Pendiente:** resto de la matriz sin cotizar (ej. GB→India, US→Uganda/Tanzania/Filipinas, IT/ES→India).

## 10. LemFi — expansión grande, 2 corredores cargados

**Nuevo país emisor:** Australia (lanzamiento febrero 2026, AUSTRAC).
**Nuevos emisores UE:** Bélgica, Francia, Alemania, Irlanda, Italia, Países Bajos, Portugal, España.
**Nuevos receptores confirmados:** India (**cargado GB→IN**), Nigeria (**ya estaba cargado GB→NG de una tanda anterior de esta sesión, dos escalones de monto**), Etiopía, Costa de Marfil, Ruanda, Senegal, Tanzania, Uganda, Liberia, Malí, Marruecos, Túnez, Togo, Camerún, Congo, Gabón, Benín; y en Asia: Bangladesh, China, Nepal, Pakistán, Filipinas, Sri Lanka, Vietnam.

**Pendiente:** resto de la matriz sin cotizar — próxima prioridad sugerida GB→PK o GB→PH (intentado GB→NG en tanda 3 pero ya estaba cargado); nueva ruta AU→Nigeria/Ghana/Kenia una vez confirmados los receptores exactos desde Australia.

## 11. NALA — el gap más grande encontrado, 2 corredores cargados

Fuente: help.nala.money (artículo fechado 16-jul-2025) — 18 países emisores de la UE además de Reino Unido/EE.UU.

**Nuevos receptores confirmados:** Nigeria (**ya cargado GB→NG de tanda anterior — sin_confirmar por fee no desglosado**), Ghana (**cargado GB→GH en esta ronda, confirmado vía su propia pestaña "Compare rates"**), Ruanda, Senegal, Camerún, Costa de Marfil, Sudáfrica, Pakistán, Filipinas, India, Bangladesh, Congo, Gabón.

⚠️ **Advertencia de la propia investigación:** la home de marketing de NALA (nala.com) solo menciona genéricamente "UK and USA" como emisores, lo cual contradice el artículo del centro de ayuda (más específico y fechado, se le da más peso). **Pendiente:** confirmar el fee real de NALA GB→NG (no se desglosó en el cotizador) y el resto de la matriz 18×13.

---

## Próximos pasos

1. Cotizar los corredores restantes marcados con "sin resolver" arriba: MoneyGram GB→GH y Paysend ES→MX (ambos requieren encontrar cómo ver el precio regular sin login), y WorldRemit AU→IN/AU→PK (banner promocional persistente pese a probar múltiples montos/métodos — puede requerir login o esperar a que cambie la campaña).
2. Expandir la matriz de TapTap Send, Sendwave, LemFi y NALA más allá de los corredores de prueba ya cargados (3, 3, 2 y 2 respectivamente) — priorizar por volumen de búsqueda esperado, no cotizar las ~100+ combinaciones posibles de una sola vez. Próximos candidatos sugeridos: LemFi GB→PK/GB→PH, TapTap US/UE→Senegal/Uganda, Sendwave GB→India, NALA GB→Nigeria (fee) y GB→India/Pakistán/Filipinas.
3. Re-verificar los 4 corredores marcados `sin_confirmar` (Western Union KW→IN, WorldRemit GB→PK, Ria GB→PH, Xoom CA→PH) con un método más directo (checkout completo o selector de método distinto), más el NALA GB→NG heredado de una tanda anterior.
4. Decisión de arquitectura pendiente (ver sección 0.2): diseñar un mecanismo de exclusión por-proveedor-por-corredor (no solo por-corredor como `corridor_notes` hoy) para cuando se aborde la fase de motor/arquitectura del roadmap.
5. Extender esta misma auditoría a regiones aún no cubiertas (Sudeste Asiático más allá de Filipinas/Vietnam, Medio Oriente más allá de los corredores hacia India ya mencionados, Europa del Este).
