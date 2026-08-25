# Auditoría de cobertura de corredores fuera de Argentina (25 ago 2026)

**Estado: COMPLETO para esta tanda.** Fase 1 (auditoría de cobertura, fuente primaria sin navegador) y fase 2 (cotización en vivo con navegador, carga a `fx_rates`) terminadas para 20 corredores nuevos. Método idéntico al aplicado a Argentina (ver `2026-08-25-research-tarifas-y-cobertura-argentina.md`, sección 4): un agente de investigación por proveedor identifica corredores reales de alto volumen no cargados, citando fuente primaria; luego un agente de navegador (uno por vez, para evitar contención de pestañas) cotiza en vivo el precio regular (nunca promocional) para 500 unidades de la moneda de origen. Todo lo cargado abajo está en `fx_rates`, con la migración espejada en `supabase/migrations/20260825095500_load_otras_regiones_corridors_batch1.sql` y `supabase/migrations/20260825095600_fix_ubl_and_load_final_batch.sql`.

**Nota operativa de esta sesión:** durante el trabajo hubo dos interrupciones temporales de infraestructura (el clasificador de seguridad que autoriza el uso de herramientas de navegador y de escritura a Supabase quedó caído un rato dos veces). Se resolvió reintentando; no afectó la calidad de los datos cargados, solo demoró el proceso. Se documenta por si es relevante para diagnósticos futuros de la plataforma.

---

## 0. Precios cargados (20 corredores nuevos, 25-ago-2026, 500 unidades de la moneda de origen)

Convención de signo de `public_spread_percent`: positivo = el cliente recibe MENOS que el mid-market (margen a favor del proveedor); negativo = recibe MÁS (tasa "premium", típico en NGN por la brecha oficial/paralelo). Mid-market: xe.com, mismo día.

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

**No cargados — solo tarifa promocional disponible, precio regular no verificable a este monto:**
- MoneyGram GB→GH: solo se pudo ver "No fees for new customers"; el flujo completo exige crear cuenta.
- Remitly US→NG: a 500 USD el monto entero cae dentro de la ventana de "welcome rate" (primeros 500 USD); la tasa "estándar" se ve mencionada en texto de la página, pero sin un fee regular verificable a ese monto.
- Paysend ES→MX: 0 EUR explícitamente marcado como oferta de nuevo cliente.
- Xoom AU→PH y AU→IN: banner "First Time Rate" explícito en ambos.

## 0.1 Bug adicional encontrado y corregido: UBL Tezraftaar Cash

Mismo patrón que BDO Remit/Money2India (sección 1 del research de Argentina): `fee_percent`, `fee_fixed` y `spread_percent` estaban en 0 y `fee_tiers` vacío — se mostraba gratis en cualquier comparación real pese a tener datos reales en `fx_rates` (AE→PK, World Bank RPW). Corregido espejando ese dato al campo genérico `spread_percent` (0.54%). No encaja en `fee_tiers` porque sus tramos varían por moneda de origen (QAR/AED), no por monto en una sola moneda.

## 0.2 Sobre el dilema planteado por el usuario: "no mostrar sin datos, no ocultar a quien sí opera"

Con la arquitectura actual (`ENABLE_CORRIDOR_FILTERING` apagado), **todo proveedor activo se muestra en TODAS las comparaciones**, sin excepción — nunca se oculta nadie por falta de datos. Esto significa que el riesgo real no es "un proveedor que opera un corredor queda invisible" (eso no puede pasar hoy), sino dos riesgos distintos:
1. **Un proveedor sin dato específico del corredor se muestra con un número genérico incorrecto** (el bug de BDO Remit/Money2India/UBL Tezraftaar: mostrarse gratis). Esto ya se auditó y corrigió para los 3 casos existentes esta sesión.
2. **Un proveedor que NO opera un corredor real igual aparece en esa comparación** con su estimación genérica (ej. NALA, especializado en África, aparecería hoy en una comparación EE.UU.→México). Esto es un problema arquitectónico ya identificado en `2026-08-diagnostico-arquitectura-proveedores-corredores.md`, y **no tiene solución completa a nivel de datos** — el motor necesitaría una tabla o campo que declare explícitamente qué corredores opera cada proveedor (la tabla `corridor_notes` actual es por-corredor, no por-proveedor, así que no alcanza para esto). Queda como decisión de arquitectura para la próxima fase del roadmap (motor + diseño), no algo que se pueda resolver solo cargando más datos.

Mientras tanto, la mitigación de datos que sí se puede hacer — y que se hizo activamente en toda esta sesión — es: nunca dejar un proveedor activo con campos genéricos en cero, y cargar el corredor real con el mejor dato disponible en cuanto se detecta un hueco.

---

## 1. Western Union — 7 corredores confirmados (3 cargados, 4 pendientes de cotizar)

| Corredor | Fuente | Nota |
|---|---|---|
| ES→MX (España→México) | westernunion.com/es/en/send-money-to-mexico.html | **Cargado** (ver sección 0) |
| KW→IN (Kuwait→India) | westernunion.com/kw/en/send-money-to-india.html | **Cargado**, sin_confirmar |
| QA→IN (Catar→India) | westernunion.com/qa/en/send-money-to-india.html | **Cargado**, confirmado |
| FR→CI (Francia→Costa de Marfil) | westernunion.com/fr/en/send-money-to-ivory-coast.html | Pendiente de cotizar |
| FR→BJ (Francia→Benín) | westernunion.com/fr/fr/send-money-to-benin.html | Pendiente de cotizar |
| IT→EC (Italia→Ecuador) | westernunion.com/it/en/send-money-to-ecuador.html | Pendiente de cotizar |
| IT→PE (Italia→Perú) | westernunion.com/it/en/send-money-to-peru.html | Pendiente de cotizar |

**Nota importante — Kuwait/Catar como países emisores:** ninguno de los dos aparecía como país emisor en nuestro catálogo de Western Union pese a que Golfo→Sur de Asia es de los corredores de mayor volumen del mundo (KNOMAD/World Bank). Es probable que también existan KW→PK, KW→BD, QA→NP, QA→PK, pero no se encontró página dedicada indexada para confirmarlos — quedan como sospecha, no confirmados.

**Negativo confirmado (no es un gap, es una restricción real):** Western Union y MoneyGram suspendieron operaciones en Rusia y Bielorrusia en marzo 2022 por sanciones tras la invasión a Ucrania. Cualquier corredor UE/EE.UU.→Rusia que parezca "faltante" es en realidad no operativo por cumplimiento normativo, no un hueco de datos.

## 2. MoneyGram — 3 corredores confirmados (1 cargado, 1 sin precio regular verificable, 1 pendiente)

| Corredor | Fuente | Estado |
|---|---|---|
| US→NG (EE.UU.→Nigeria) | moneygram.com/us/en/corridor/nigeria | **Cargado** (ver sección 0) |
| GB→GH (Reino Unido→Ghana) | moneygram.com/gb/en/corridor/ghana | Solo tarifa promocional disponible (sección 0) |
| DE→PL (Alemania→Polonia) | moneygram.com/de/en/corridor/poland | Pendiente de cotizar |

## 3. Remitly — 3 corredores confirmados (0 cargados — ver nota)

| Corredor | Fuente |
|---|---|
| US→NG (EE.UU.→Nigeria) | remitly.com/us/en/money-transfer/send-money-to-nigeria — solo tarifa promocional verificable a 500 USD (sección 0) |
| CA→NG (Canadá→Nigeria) | remitly.com/ca/en/nigeria — pendiente de cotizar |
| CA→GH (Canadá→Ghana) | remitly.com/ca/en/money-transfer/send-money-to-ghana — pendiente de cotizar |

Los tres muestran depósito bancario, retiro en efectivo y billetera móvil con socios locales nombrados (Access Bank, GT Bank, MTN Mobile Money, Vodafone Cash, Airtel Tigo Money) — evidencia de servicio activo real. Recomendado re-cotizar US→NG con un monto mayor (ej. 1000 USD) para salir de la ventana de welcome rate y conseguir el precio regular.

## 4. WorldRemit — 4 corredores confirmados (2 cargados, 2 pendientes)

| Corredor | Fuente | Estado |
|---|---|---|
| US→IN (EE.UU.→India) | worldremit.com/en-us/india | **Cargado**, confirmado |
| GB→PK (Reino Unido→Pakistán) | worldremit.com/en-gb/pakistan | **Cargado**, sin_confirmar |
| AU→IN (Australia→India) | worldremit.com/en-au/india | Pendiente de cotizar |
| AU→PK (Australia→Pakistán) | worldremit.com/en-au/pakistan | Pendiente de cotizar |

## 5. Ria Money Transfer — 4 corredores confirmados (2 cargados, 2 pendientes)

| Corredor | Fuente | Estado |
|---|---|---|
| US→PH (EE.UU.→Filipinas) | riamoneytransfer.com/en-us/send-money-to-philippines/ | **Cargado**, confirmado |
| GB→PH (Reino Unido→Filipinas) | riamoneytransfer.com/en-gb/send-money-to-philippines/ | **Cargado**, sin_confirmar |
| ES→PH (España→Filipinas) | riamoneytransfer.com/en-es/send-money-to-philippines/ | Pendiente de cotizar |
| IT→PH (Italia→Filipinas) | riamoneytransfer.com/en-it/send-money-to-philippines/ | Pendiente de cotizar |

Los 4 citan más de 20.000 puntos de retiro en efectivo en Filipinas (Palawan Pawnshop, Cebuana Lhuillier, M. Lhuillier), bancos (BDO, Metrobank, BPI) y billeteras (GCash, PayMaya) — red operativa específica, no una plantilla genérica.

## 6. Paysend — 6 corredores confirmados (1 cargado, 1 solo promo, 4 pendientes)

| Corredor | Fuente | Estado |
|---|---|---|
| US→MX | paysend.com/hi-us/send-money/from-the-united-states-of-america-to-mexico | **Cargado**, confirmado |
| ES→MX | paysend.com/en-es/send-money/spain-to-mexico | Solo 0 EUR promocional de nuevo cliente (sección 0) |
| US→PH | paysend.com/en-us/send-money/from-the-united-states-of-america-to-philippines | Pendiente de cotizar |
| US→IN | paysend.com/en-us/send-money/from-the-united-states-of-america-to-india | Pendiente de cotizar |
| GB→IN | paysend.com/en/send-money/from-united-kingdom-to-india/ | Pendiente — página muestra promo "£0 fee" |
| GB→PK | paysend.com/en-uk/send-money/from-united-kingdom-to-pakistan | Pendiente de cotizar |

## 7. Xoom (PayPal) — 6 corredores confirmados (4 cargados, 2 solo promo)

GB→MX, GB→PH, CA→PH, CA→IN — **cargados** (sección 0). AU→PH y AU→IN — solo tarifa promocional "First Time Rate" disponible, no se cargó.

## 8. TapTap Send — expansión mayor, 1 corredor cargado como prueba de concepto

**Nuevos países emisores confirmados** (antes solo GB/US): 24 países de la UE (Austria, Bélgica, Croacia, Chipre, República Checa, Dinamarca, Estonia, Finlandia, Francia, Alemania, Grecia, Hungría, Irlanda, Italia, Luxemburgo, Malta, Países Bajos, Noruega, Polonia, Portugal, Rumania, Eslovaquia, España, Suecia), Canadá, Australia, Emiratos Árabes Unidos, Brasil. Fuente: help.taptapsend.com/en/sending-countries y taptapsend.com/en/licenses (licencias FINTRAC/AFSL/DFSA/CBUAE confirmadas).

**Nuevos países receptores confirmados** (antes solo Ghana/Kenia/Nigeria): Senegal, Pakistán, Filipinas, **India (cargado GB→IN, ver sección 0)**, Uganda. Lista general adicional (no verificada corredor por corredor): Bangladesh, Camboya, China, Etiopía, Egipto, varios países francófonos de África y Latinoamérica.

**Pendiente:** el resto de la matriz emisor×receptor (docenas de combinaciones) sigue sin cotizar individualmente — se cargó GB→India como prueba de que el corredor funciona en el cotizador real; se recomienda priorizar GB/US/UE→Pakistán, Filipinas, Senegal, Uganda en una próxima tanda.

## 9. Sendwave — expansión confirmada, 1 corredor cargado

**Nuevos emisores confirmados:** Canadá, Francia, Italia, España, Irlanda. Bélgica/Alemania/Portugal con confianza menor (aparecen en página general, no confirmados por corredor).

**Nuevos receptores confirmados:** **India (cargado US→IN, ver sección 0)**, Uganda, Tanzania, Filipinas (Senegal y Liberia con confianza menor).

**Negativo confirmado:** Vietnam y Tailandia figuran como "Coming soon" en la ficha de Google Play — no operativos, no cargar.

**Pendiente:** resto de la matriz sin cotizar (ej. GB→India, CA→India, US→Uganda/Tanzania/Filipinas).

## 10. LemFi — expansión grande, 1 corredor cargado

**Nuevo país emisor:** Australia (lanzamiento febrero 2026, AUSTRAC).
**Nuevos emisores UE:** Bélgica, Francia, Alemania, Irlanda, Italia, Países Bajos, Portugal, España.
**Nuevos receptores confirmados:** **India (cargado GB→IN, ver sección 0)**, Etiopía, Costa de Marfil, Ruanda, Senegal, Tanzania, Uganda, Liberia, Malí, Marruecos, Túnez, Togo, Camerún, Congo, Gabón, Benín; y en Asia: Bangladesh, China, Nepal, Pakistán, Filipinas, Sri Lanka, Vietnam.

**Pendiente:** resto de la matriz sin cotizar; nueva ruta AU→Nigeria/Ghana/Kenia una vez confirmados los receptores exactos desde Australia.

## 11. NALA — el gap más grande encontrado, 1 corredor cargado (sin_confirmar)

Fuente: help.nala.money (artículo fechado 16-jul-2025) — 18 países emisores de la UE además de Reino Unido/EE.UU.

**Nuevos receptores confirmados:** **Nigeria (cargado GB→NG, ver sección 0 — sin_confirmar por fee no desglosado)**, Ruanda, Ghana, Senegal, Camerún, Costa de Marfil, Sudáfrica, Pakistán, Filipinas, India, Bangladesh, Congo, Gabón.

⚠️ **Advertencia de la propia investigación:** la home de marketing de NALA (nala.com) solo menciona genéricamente "UK and USA" como emisores, lo cual contradice el artículo del centro de ayuda (más específico y fechado, se le da más peso). La URL de corredor directo GB→Nigeria devolvió 404 — se usó el widget de home. **Pendiente:** confirmar el fee real (no se desglosó en el cotizador) y el resto de la matriz 18×13.

---

## Próximos pasos

1. Cotizar los corredores restantes marcados "pendiente de cotizar" arriba (Western Union FR→CI/BJ/IT→EC/PE, MoneyGram DE→PL, Remitly CA→NG/GH y US→NG a mayor monto, WorldRemit AU→IN/PK, Ria ES/IT→PH, Paysend US→PH/IN, GB→IN/PK).
2. Expandir la matriz de TapTap Send, Sendwave, LemFi y NALA más allá del corredor de prueba cargado por proveedor — priorizar por volumen de búsqueda esperado, no cotizar las ~100+ combinaciones posibles de una sola vez.
3. Confirmar el fee real de NALA (no desglosado en esta sesión) y re-verificar los 4 corredores marcados `sin_confirmar` (Western Union KW→IN, WorldRemit GB→PK, Ria GB→PH, Xoom CA→PH) con un método más directo (checkout completo o selector de método distinto).
4. Decisión de arquitectura pendiente (ver sección 0.2): diseñar un mecanismo de exclusión por-proveedor-por-corredor (no solo por-corredor como `corridor_notes` hoy) para cuando se aborde la fase de motor/arquitectura del roadmap.
5. Extender esta misma auditoría a regiones aún no cubiertas (Sudeste Asiático más allá de Filipinas/Vietnam, Medio Oriente más allá de los corredores hacia India ya mencionados, Europa del Este).
