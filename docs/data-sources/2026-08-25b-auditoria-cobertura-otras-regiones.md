# Auditoría de cobertura de corredores fuera de Argentina (25 ago 2026)

**Estado: EN PROGRESO.** Este documento cubre la fase 1 (auditoría de cobertura — qué corredores reales le faltan a cada proveedor) del research pedido para "otras regiones", extendiendo el mismo método aplicado a Argentina (ver `2026-08-25-research-tarifas-y-cobertura-argentina.md`, sección 4). La fase 2 (cotización en vivo de cada corredor confirmado, carga a `fx_rates`) está bloqueada temporalmente por una interrupción de la herramienta de automatización de navegador de esta sesión — se retoma y este documento se actualiza en cuanto se resuelva. Hasta entonces, todo lo de abajo es "corredor confirmado por fuente primaria, precio pendiente de cotizar" — nada de esto se cargó todavía a `fx_rates` ni a los campos genéricos de `providers`.

**Método:** para cada proveedor multi-corredor activo (`is_corridor_specific=true, active=true`), se le pasó a un agente de investigación (sin herramientas de navegador, solo WebFetch/WebSearch sobre fuente primaria) la lista completa de corredores ya cargados en nuestra base, pidiéndole que identifique corredores reales de alto volumen que el proveedor efectivamente opera hoy pero que no están en la lista. Se exigió cita de fuente primaria (página oficial del proveedor) y fecha de acceso para cada hallazgo.

---

## 1. Western Union — 7 corredores confirmados, no cargados

| Corredor | Fuente | Nota |
|---|---|---|
| ES→MX (España→México) | westernunion.com/es/en/send-money-to-mexico.html | Página dedicada, efectivo/banco/billetera/tarjeta |
| FR→CI (Francia→Costa de Marfil) | westernunion.com/fr/en/send-money-to-ivory-coast.html | Página dedicada, efectivo/billetera/online |
| FR→BJ (Francia→Benín) | westernunion.com/fr/fr/send-money-to-benin.html | Página dedicada (locale francés) |
| KW→IN (Kuwait→India) | westernunion.com/kw/en/send-money-to-india.html | Banco + 123.000+ puntos de retiro en efectivo en India; fee desde 1 KWD online |
| QA→IN (Catar→India) | westernunion.com/qa/en/send-money-to-india.html | Fee 15 QAR online mencionado en la página |
| IT→EC (Italia→Ecuador) | westernunion.com/it/en/send-money-to-ecuador.html | Página dedicada, flujo activo |
| IT→PE (Italia→Perú) | westernunion.com/it/en/send-money-to-peru.html | Página dedicada, flujo activo |

**Nota importante — Kuwait/Catar como países emisores:** ninguno de los dos aparecía como país emisor en nuestro catálogo de Western Union pese a que Golfo→Sur de Asia es de los corredores de mayor volumen del mundo (KNOMAD/World Bank). Es probable que también existan KW→PK, KW→BD, QA→NP, QA→PK, pero no se encontró página dedicada indexada para confirmarlos — quedan como sospecha, no confirmados.

**Negativo confirmado (no es un gap, es una restricción real):** Western Union y MoneyGram suspendieron operaciones en Rusia y Bielorrusia en marzo 2022 por sanciones tras la invasión a Ucrania (fuente: comunicado corporativo de WU del 10-mar-2022; cobertura de prensa sobre MoneyGram). Cualquier corredor UE/EE.UU.→Rusia que parezca "faltante" es en realidad un corredor no operativo por cumplimiento normativo, no un hueco de datos — no debe tratarse como pendiente de carga.

## 2. MoneyGram — 3 corredores confirmados, no cargados

| Corredor | Fuente | Nota |
|---|---|---|
| GB→GH (Reino Unido→Ghana) | moneygram.com/gb/en/corridor/ghana | Página dedicada |
| US→NG (EE.UU.→Nigeria) | moneygram.com/us/en/corridor/nigeria | Página dedicada, lenguaje promocional visible (aparte del precio regular) |
| DE→PL (Alemania→Polonia) | moneygram.com/de/en/corridor/poland | Página dedicada |

## 3. Remitly — 3 corredores confirmados, no cargados

| Corredor | Fuente |
|---|---|
| US→NG (EE.UU.→Nigeria) | remitly.com/us/en/money-transfer/send-money-to-nigeria |
| CA→NG (Canadá→Nigeria) | remitly.com/ca/en/nigeria |
| CA→GH (Canadá→Ghana) | remitly.com/ca/en/money-transfer/send-money-to-ghana |

Los tres muestran depósito bancario, retiro en efectivo y billetera móvil con socios locales nombrados (Access Bank, GT Bank, MTN Mobile Money, Vodafone Cash, Airtel Tigo Money) — evidencia de servicio activo real, no una landing genérica.

## 4. WorldRemit — 4 corredores confirmados, no cargados

| Corredor | Fuente |
|---|---|
| US→IN (EE.UU.→India) | worldremit.com/en-us/india |
| GB→PK (Reino Unido→Pakistán) | worldremit.com/en-gb/pakistan |
| AU→IN (Australia→India) | worldremit.com/en-au/india |
| AU→PK (Australia→Pakistán) | worldremit.com/en-au/pakistan |

Llamativo: WorldRemit ya cubre decenas de corredores hacia África y Filipinas, pero le faltaban India y Pakistán desde varios países emisores grandes — dos de los mercados de remesas más grandes del mundo.

## 5. Ria Money Transfer — 4 corredores confirmados, no cargados

| Corredor | Fuente |
|---|---|
| US→PH (EE.UU.→Filipinas) | riamoneytransfer.com/en-us/send-money-to-philippines/ |
| GB→PH (Reino Unido→Filipinas) | riamoneytransfer.com/en-gb/send-money-to-philippines/ |
| ES→PH (España→Filipinas) | riamoneytransfer.com/en-es/send-money-to-philippines/ |
| IT→PH (Italia→Filipinas) | riamoneytransfer.com/en-it/send-money-to-philippines/ |

Los 4 citan más de 20.000 puntos de retiro en efectivo en Filipinas (Palawan Pawnshop, Cebuana Lhuillier, M. Lhuillier), bancos (BDO, Metrobank, BPI) y billeteras (GCash, PayMaya) — red operativa específica, no una plantilla genérica. Llamativo: Filipinas (uno de los mayores receptores de remesas del mundo) no estaba en ningún corredor de Ria en nuestra base.

## 6. Paysend — 6 corredores confirmados con indicio de precio, no cargados en `fx_rates`

| Corredor | Fuente | Indicio de fee visto en la página |
|---|---|---|
| US→MX | paysend.com/hi-us/send-money/from-the-united-states-of-america-to-mexico | $0,99 mencionado en la página (no confirmado en cotizador en vivo) |
| US→PH | paysend.com/en-us/send-money/from-the-united-states-of-america-to-philippines | $5,66 mencionado en la página |
| US→IN | paysend.com/en-us/send-money/from-the-united-states-of-america-to-india | — |
| GB→IN | paysend.com/en/send-money/from-united-kingdom-to-india/ | Promo "£0 fee" visible — probablemente promocional, requiere confirmar precio regular |
| GB→PK | paysend.com/en-uk/send-money/from-united-kingdom-to-pakistan | — |
| ES→MX | paysend.com/en-es/send-money/spain-to-mexico | — |

Los fees mencionados arriba son texto de página de marketing, no una cotización en vivo confirmada con tasa de cambio — no se cargan todavía como dato verificado.

## 7. Xoom (PayPal) — 6 corredores confirmados, no cargados

GB→MX, GB→PH, CA→PH, CA→IN, AU→PH, AU→IN — todos confirmados vía las páginas de destino de xoom.com (xoom.com/mexico/send-money, /philippines/send-money, /india/send-money), que listan explícitamente los países emisores soportados. (US→PH ya debería estar cargado — verificar en la carga final.)

## 8. TapTap Send — expansión mayor no reflejada en el catálogo

**Nuevos países emisores confirmados** (antes solo GB/US): 24 países de la UE (Austria, Bélgica, Croacia, Chipre, República Checa, Dinamarca, Estonia, Finlandia, Francia, Alemania, Grecia, Hungría, Irlanda, Italia, Luxemburgo, Malta, Países Bajos, Noruega, Polonia, Portugal, Rumania, Eslovaquia, España, Suecia), Canadá, Australia, Emiratos Árabes Unidos, Brasil. Fuente: help.taptapsend.com/en/sending-countries y taptapsend.com/en/licenses (licencias FINTRAC/AFSL/DFSA/CBUAE confirmadas).

**Nuevos países receptores confirmados** (antes solo Ghana/Kenia/Nigeria): Senegal, Pakistán, Filipinas, India, Uganda — cada uno con página de corredor dedicada. Lista general adicional (no verificada corredor por corredor): Bangladesh, Camboya, China, Etiopía, Egipto, varios países francófonos de África y Latinoamérica (Argentina, Bolivia, Colombia, Rep. Dominicana, El Salvador, Guatemala, Haití, Honduras).

**Prioridad sugerida para cotizar:** GB/US/UE→India, Pakistán, Filipinas, Senegal, Uganda.

## 9. Sendwave — expansión de países emisores y receptores

**Nuevos emisores confirmados:** Canadá, Francia, Italia, España, Irlanda (consistente en varias páginas de corredor). Bélgica/Alemania/Portugal aparecen en la página general de países pero no se confirmaron en páginas de corredor individuales — confianza menor, verificar antes de cargar.

**Nuevos receptores confirmados:** India, Uganda, Tanzania, Filipinas (Senegal y Liberia con confianza menor).

**Negativo confirmado:** Vietnam y Tailandia figuran como "Coming soon" en la ficha de Google Play — no operativos, no cargar.

## 10. LemFi — expansión grande (UE + Australia + docenas de receptores)

**Nuevo país emisor:** Australia (lanzamiento febrero 2026, registrado en AUSTRAC como "Pomelo Australia Pty Ltd t/a LemFi").
**Nuevos emisores UE:** Bélgica, Francia, Alemania, Irlanda, Italia, Países Bajos, Portugal, España.
**Nuevos receptores:** Etiopía, Costa de Marfil, Ruanda, Senegal, Tanzania, Uganda, Liberia, Malí, Marruecos, Túnez, Togo, Camerún, Congo, Gabón, Benín; y en Asia: Bangladesh, China, India, Nepal, Pakistán, Filipinas, Sri Lanka, Vietnam.

**Prioridad sugerida para cotizar:** GB/US→Etiopía, India, Pakistán, Filipinas; nueva ruta AU→Nigeria/Ghana/Kenia (una vez confirmados los receptores exactos desde Australia).

## 11. NALA — el gap más grande encontrado (21 emisores confirmados vs. 2 cargados)

Fuente: help.nala.money (artículo fechado 16-jul-2025) — 18 países emisores de la UE además de Reino Unido/EE.UU. (Austria, Bélgica, Chipre, Estonia, Finlandia, Francia, Alemania, Grecia, Irlanda, Italia, Letonia, Lituania, Luxemburgo, Malta, Países Bajos, Portugal, Eslovaquia, Eslovenia).

**Nuevos receptores confirmados:** Ruanda, Ghana, Nigeria, Senegal, Camerún, Costa de Marfil, Sudáfrica, Pakistán, Filipinas, India, Bangladesh, Congo, Gabón.

⚠️ **Advertencia de la propia investigación:** la home de marketing de NALA (nala.com) solo menciona genéricamente "UK and USA" como emisores, lo cual contradice el artículo del centro de ayuda (más específico y fechado, por lo que se le da más peso). Se recomienda una verificación rápida adicional en la app antes de cargar la matriz completa de 18×13 combinaciones — empezar por las de mayor valor: GB/US→Nigeria, Ghana, India, Filipinas.

---

## Próximos pasos (bloqueados temporalmente)

1. Retomar el muestreo en vivo (browser automation) apenas se resuelva la interrupción de herramienta de esta sesión, en 3-4 tandas secuenciales (un agente de navegador por vez, mismo protocolo que evitó la contención en el research de Argentina):
   - Tanda 1: Western Union (ES→MX, KW→IN, QA→IN) + MoneyGram (US→NG, GB→GH)
   - Tanda 2: Remitly (US→NG) + WorldRemit (US→IN, GB→PK) + Ria (US→PH, GB→PH)
   - Tanda 3: Paysend (US→MX, ES→MX) + Xoom (GB→MX, GB→PH, CA→PH, CA→IN, AU→PH, AU→IN)
   - Tanda 4: NALA (GB→NG, GB→PH) + TapTap Send (GB→IN, GB→PK) + Sendwave (US→IN) + LemFi (GB→IN)
2. Aplicar la misma regla de esta sesión: solo precio regular, nunca promocional (ya se detectaron promos a excluir en MoneyGram US→NG y Paysend GB→IN).
3. Cargar los resultados en `fx_rates` (nunca en los campos genéricos de `providers`, por la misma razón arquitectónica documentada en el research de Argentina) y mirrorear la migración en `supabase/migrations/`.
4. Para TapTap Send, Sendwave, LemFi y NALA: decidir si conviene cargar la expansión completa de países emisores/receptores o solo los corredores de mayor volumen — son decenas de combinaciones nuevas, no todas necesitan cotización individual si el fee es plano por proveedor (verificar caso por caso, como se hizo con Prex).
5. Extender esta misma auditoría a regiones aún no cubiertas (Sudeste Asiático más allá de Filipinas/Vietnam, Medio Oriente más allá de los corredores hacia India ya mencionados, Europa del Este).
