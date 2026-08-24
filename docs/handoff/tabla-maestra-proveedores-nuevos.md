# mangomundi — Tabla maestra de proveedores nuevos por corredor (consolidado)

> Este documento consolida la investigación original (archivo subido por Alejandro)
> más lo confirmado en esta sesión con fuentes en vivo. Ningún dato está inventado —
> todo lo marcado "sin confirmar" es exactamente eso. Fuente principal: la mejor
> disponible para cada caso, priorizando la base del Banco Mundial cuando aplica.

## Hallazgo clave de esta sesión

**World Bank Remittance Prices Worldwide (RPW)** — `remittanceprices.worldbank.org`
— es una base pública oficial que cubre **365 corredores, de 48 países emisores a
105 receptores**, actualizada trimestralmente desde 2009, con metodología
documentada y estandarizada:

- Comisión (moneda local + USD), en dos montos de referencia por corredor
- Margen de tipo de cambio (%) — calculado contra la tasa de mercado real, no estimado
- Costo total (%) y en moneda
- Velocidad estandarizada (categorías fijas: menos de 1hr / mismo día / día siguiente / 2 días / 3-5 días)
- Método de cobro, cobertura de red de envío y de cobro
- Tipo de firma (Money Transfer Operator / Bank / Post office)

Esto resuelve gran parte del problema de "cómo conseguir rates/velocidad" para
corredores donde no hay API pública de un proveedor específico — no reemplaza
tener afiliado, pero sí da un dato real, verificable y no inventado para mostrar
en el comparador.

**Limitación:** no da links de afiliado. Alejandro gestiona el outreach directo
para los candidatos que valga la pena sumar.

**Criterio de carga acordado:** se cargan TODAS las firmas encontradas al catálogo,
pero el comparador solo debe mostrar las que (a) tengan datos reales cargados y
(b) operen en el corredor/monto seleccionado por el usuario — mismo patrón que ya
usa el resto del sitio (afiliado sin link → botón CTA desaparece; acá, proveedor
sin dato de corredor → no aparece en ese corredor).

---

## Corredor: UAE → India (el más grande del mundo, $137B/año, 19% desde UAE/Golfo)

Fuente: World Bank RPW, dato Q3 2025 (recolectado 15-22 ago 2025), monto de
referencia AED 735 / USD 200.

| Firma | Tipo | Comisión | Margen FX | Costo total | Velocidad | ¿Ya en mangomundi? | Afiliado |
|---|---|---|---|---|---|---|---|
| Emirates NBD | Banco | 0 AED | 0.77% | 0.77% | 3-5 días | No | Sin confirmar — banco, poco probable |
| Remitly | MTO | 5.00 AED | 0.36% | 1.04% | <1hr | **Sí** | Ya activo |
| DirectRemit (NBD) | Banco | 0 AED | 1.11% | 1.11% | 2 días | No | Sin confirmar — banco, poco probable |
| Western Union | MTO | 7.88 AED | 0.52% | 1.59% | <1hr | No | Sin confirmar |
| Lari | MTO | 10.50 AED | 0.20% | 1.63% | 2 días | No | Sin confirmar |
| Al Ansari | MTO | 10.50 AED | 0.40% | 1.83% | 2 días | No | **Confirmado sin afiliado publisher** (ver investigación en vivo) |
| MoneyGram | MTO | 15.75 AED | 0.34% | 2.48% | <1hr | **Sí** | Ya activo |
| GCC Exchange | MTO | 15.75 AED | 0.37% | 2.51% | <1hr | No | Sin confirmar |
| Wall St Exchange | MTO | 17.00 AED | 0.37% | 2.68% | <1hr / 2 días | No | Sin confirmar |
| Al Fardan Exchange | MTO | 19.50 AED | 0.56% | 3.21% | mismo día / 2 días | No | Sin confirmar |
| Dubai Islamic Bank | Banco | 63.00 AED | 3.11% | 11.68% | 2 días | No | Descartar — carísimo, banco |
| ADCB | Banco | 126.00 AED | 3.92% | 21.06% | mismo día | No | Descartar — carísimo, banco |

**Además (investigado directamente, fuera de RPW):**

| Firma | Estado | Datos disponibles |
|---|---|---|
| Aspora (ex Vance) | UAE·UK·EEUU·Europa → India + Filipinas | **Fuente propia sólida:** calculadora pública (`get.aspora.com`), blog con cifras concretas (comisión fija $2.99 EEUU / £3 Reino Unido, tasa "Google-matching"), regulado (FCA, FINTRAC, FinCEN, Banco Central UAE vía Lulu Exchange). **Sin afiliado publisher confirmado** — solo referidos usuario-a-usuario |
| Hubpay | UAE → India/Pakistán, licenciado ADGM | Real, con "Rate Finder" propio en su app — dato conseguible pero no verificado en RPW todavía. **Sin afiliado publisher** (solo referidos) |
| e& money | Brazo digital de e& (telco) | Real, cotizado en comparativas de prensa (Gulf News). No verificado en RPW. Afiliado muy improbable (producto de telco) |
| Payit | Wallet de First Abu Dhabi Bank | Real, calculadora propia con tasa en vivo. Afiliado muy improbable (producto de banco) |

---

## Corredor: UK → Nigeria

Fuente: World Bank RPW, dato Q3 2025 (recolectado 8-22 ago 2025), monto de
referencia GBP 120 / USD 200.

| Firma | Tipo | Comisión | Margen FX | Costo total | Velocidad | ¿Ya en mangomundi? | Afiliado |
|---|---|---|---|---|---|---|---|
| Sendwave | MTO | 0 GBP | -0.12% a 0.01% | -0.12% a 0.01% | <1hr a día siguiente | No | Sin confirmar — **candidato fuerte, cobertura alta** |
| Remitly | MTO | 0 GBP | 0.25% | 0.25% | <1hr | **Sí** | Ya activo |
| WorldRemit | MTO | 0 GBP | 0.28% | 0.28% | 2 días | **Sí** | Ya activo |
| MoneyGram | MTO | 0-4.99 GBP | 0.03-0.32% | 0.03-4.48% | <1hr a 3-5 días | **Sí** | Ya activo |
| Paysend | MTO | 0 GBP | 0.64% | 0.64% | día siguiente | No | Sin confirmar — **candidato, cobertura alta** |
| CashMinute | MTO | 0 GBP | 1.01% | 1.01% | <1hr | No | Sin confirmar — jugador chico/nicho |
| Ria | MTO | 1.99 GBP | 0.00% | 1.66% | <1hr | No | Sin confirmar — margen 0% es notable |
| Post Office UK vía Western Union | Oficina postal | 1.90 GBP | 1.16% | 2.74% | <1hr | No | Descartar — canal de distribución de WU, no proveedor propio |
| Western Union | MTO | 0.99-4.99 GBP | 2.18% | 3.01-7.61% | <1hr | No | Sin confirmar |

---

## Estado actualizado de los candidatos de la investigación original

| Candidato | Corredor | Afiliado publisher | Datos de tarifas | Recomendación |
|---|---|---|---|---|
| Vance/Aspora | UAE/UK/EEUU/Europa → India, Filipinas | **Confirmado: NO, solo referidos** | **Sí, fuente propia sólida** | Sumar al catálogo con datos propios; Alejandro gestiona outreach por si hay programa no público |
| Al Ansari Exchange | UAE → India/Pakistán/Filipinas | **Confirmado: NO** (ni Wise lo rastrea) | **Sí, vía RPW** | Sumar con datos RPW |
| Hubpay | UAE → India/Pakistán | **Confirmado: NO, solo referidos** | Sí, vía app propia (no verificado en RPW aún) | Sumar, verificar RPW en próxima ronda |
| e& money | UAE (super app) | Sin confirmar, improbable | Sí, vía prensa | Baja prioridad — producto de telco |
| Payit | UAE (wallet FAB) | Sin confirmar, improbable | Sí, calculadora propia | Baja prioridad — producto de banco |
| ARQ Finance | EEUU → México/Filipinas/LatAm | **Confirmado: NO, solo referidos** | No verificado | Baja prioridad sin afiliado ni dato confirmado |
| Rocket Remit | Australia → 55+ países | **Sin afiliado encontrado** | No verificado en RPW todavía | Revisar RPW para corredores AU→Pakistán/Filipinas/Nigeria en próxima ronda |
| CadRemit | Norteamérica/Europa → Nigeria | No investigado esta sesión | No investigado | Pendiente |
| Ogvio | El Salvador | Dato débil (una sola mención dudosa) | No investigado | **Descartar** |
| Sendwave | UK → Nigeria (nuevo, no estaba en lista original) | **Confirmado: SÍ** — subsidiaria de Zepz (mismo grupo que WorldRemit, ya activo); WorldRemit dice tener "144 payout partners across WorldRemit and SendWave"; también en FlexOffers (cuenta declinada) y MyLead | **Sí, vía RPW** | **Prioridad máxima** — contactar directo al equipo de afiliados de WorldRemit para preguntar si cubre Sendwave también |
| Paysend | UK → Nigeria (nuevo) | **Confirmado: SÍ** — programa de afiliados real vía redes de terceros (no solo referidos) | **Sí, vía RPW** | **Candidato fuerte** — fintech establecida (UK, 2017, 5M+ clientes, 150+ países), aplicar a su afiliado directo |

---

## Corredor: EE.UU. → Vietnam

Fuente: World Bank RPW, dato Q3 2025 (recolectado 13-20 ago 2025), monto de
referencia USD 200. Mostrando la mejor opción de instrumento de pago por firma.

| Firma | Tipo | Comisión | Margen FX | Costo total | Velocidad | ¿Ya en mangomundi? | Nota |
|---|---|---|---|---|---|---|---|
| **Walmart2World** | Banco | **$0.00** | **0.00%** | **0.00%** | <1hr | No | **Candidato destacado** — comisión y margen cero al monto de referencia. Producto de Walmart, operado en alianza con Ria |
| Wise | MTO | $3.21 | 0.00% | 1.61% | mismo día | **Sí** | Ya activo |
| Xoom (PayPal) | MTO | $8.88 | 0.00% | 4.44% | mismo día | No | Sin confirmar — marca reconocida (PayPal) |
| MoneyGram | MTO | $5.99 | 0.00% | 3.00% | <1hr | **Sí** | Ya activo |
| Ria | MTO | $0.90 | 1.65% | 2.10% | 3-5 días | No | Sin confirmar |
| Pangea | MTO | $4.95 | 0.63% | 3.11% | 2 días | No | Sin confirmar — especialista en el corredor |
| Western Union | MTO | $3.99 | 2.31% | 4.31% | 3-5 días | No | Sin confirmar |
| Wells Fargo | Banco | $12.00 | 0.00% | 6.00% | 2 días | No | Descartar — banco, caro |
| Citibank | Banco | $35.00 | 0.00% | 17.50% | 2 días | No | Descartar — muy caro |

**Hallazgo destacado:** Walmart2World (Ria + red de tiendas Walmart) aparece con
comisión y margen cero al monto de referencia — vale la pena investigar más a
fondo en la próxima ronda (afiliado, otros corredores donde opera, condiciones
a montos mayores).

---

## Corredor: EE.UU. → Nigeria

Fuente: World Bank RPW, dato Q3 2025 (recolectado 8-20 ago 2025), monto de
referencia USD 200. Mejor instrumento de pago por firma.

| Firma | Tipo | Comisión | Margen FX | Costo total | Velocidad | ¿Ya en mangomundi? | Nota |
|---|---|---|---|---|---|---|---|
| **Walmart2World** | Banco | **$0.00** | **-0.22%** (favorable) | **-0.22%** | <1hr | No | **2da vez con condiciones excelentes** (ya visto en EEUU→Vietnam) — candidato prioritario. Nota: solo aparece en corredores con origen EEUU (tiene sentido, es una cadena estadounidense) |
| WorldRemit | MTO | $0.00 | -0.49% (favorable) | -0.49% | 2 días | **Sí** | Ya activo |
| MoneyGram | MTO | $0.00 | 0.01% | 0.01% | <1hr | **Sí** | Ya activo |
| Remitly | MTO | $0.00 | 1.09% | 1.09% | <1hr a 3-5 días | **Sí** | Ya activo |
| Western Union | MTO | $1.99 | -0.17 a 0.33% | 0.73-2.33% | <1hr a 3-5 días | No | Sin confirmar |
| Ria | MTO | $2.90 | 0.76-1.01% | 2.26-2.45% | <1hr a 3-5 días | No | Sin confirmar |

**Confirmado:** el mismo set de firmas (WorldRemit, MoneyGram, Remitly, Ria,
Western Union) se repite en UK→Nigeria y EEUU→Nigeria — consistente con que son
los jugadores establecidos del corredor. **Walmart2World es el hallazgo real
nuevo**, con métricas mejores que los ya activos, pero limitado a corredores con
origen en EEUU.

### Actualización sobre Walmart2World — no es un proveedor independiente

Investigación adicional revela que **Walmart2World no es una empresa propia**:
es un producto de marca blanca de Walmart, operado en sociedad con **MoneyGram
y Ria** (el usuario elige cuál de los dos usar al hacer la transferencia en una
tienda Walmart o su app). Esto significa:

- No puede sumarse como "proveedor nuevo" independiente — es MoneyGram o Ria
  con el pricing especial que consiguen por el volumen de Walmart
- MoneyGram ya está activo en mangomundi; Ria no
- Walmart **sí tiene** un programa de afiliados general (`affiliates.walmart.com`,
  vía plataforma Impact — la misma que ya usás para otros afiliados), pero es
  para productos físicos de Walmart.com. **No está confirmado si las
  transferencias de dinero califican para comisión** bajo ese programa — es
  común que los afiliados excluyan servicios financieros de la comisión
- **Recomendación:** no tratar como candidato nuevo. Si interesa, lo que
  correspondería investigar es sumar **Ria** como proveedor propio (no vía
  Walmart), ya que aparece con buenos números en varios corredores (EEUU→Vietnam,
  EEUU→Nigeria, UK→Nigeria)

---

## Verificaciones adicionales (ronda 3)

| Corredor | Resultado | Conclusión |
|---|---|---|
| España→Nigeria | Solo Remitly, MoneyGram, WorldRemit (ya activos) | Sin candidatos nuevos |
| Canadá→Nigeria | Sin datos claros en el snippet disponible | Sin candidatos nuevos identificados |
| UK→Bangladesh | Costos ya competitivos (1.56%-3.13% según instrumento) | **Confirma con datos duros** la conclusión de la investigación original: corredor bien cubierto, sin necesidad urgente de candidato nuevo |
| Australia→Filipinas (Rocket Remit) | Búsqueda inconclusa — la página tiene datos pero el snippet no trajo la tabla de firmas | **Resuelto con fetch directo** — ver tabla completa abajo |

---

## Corredor: Australia → Filipinas

Fuente: World Bank RPW, dato Q3 2025 (recolectado 18 ago - 3 sep 2025), monto de
referencia AUD 200 / USD 200. Mejor instrumento de pago por firma (de las
firmas más relevantes; se omiten filas duplicadas por instrumento).

| Firma | Tipo | Comisión | Margen FX | Costo total | Velocidad | ¿Ya en mangomundi? | Nota |
|---|---|---|---|---|---|---|---|
| **InstaReM** | MTO | 1.34 AUD | 0.09% | **0.76%** | mismo día | No | **Candidato fuerte** — parte de Nium, fintech reconocida, muy competitivo |
| **iRemit** | MTO | 8.00 AUD | -3.52% (favorable) | **0.48-0.98%** | 2 días | No | **Candidato fuerte** — especialista en remesas a Filipinas |
| MoneyGram | MTO | 1.49 AUD | 0.12% | 0.87% | <1hr | **Sí** | Ya activo |
| Wise | MTO | 2.08 AUD | 0.01% | 1.05% | 2 días | **Sí** | Ya activo |
| Remitly | MTO | 0.00 AUD | 1.16% | 1.16% | <1hr | **Sí** | Ya activo |
| Western Union | MTO | 0.99 AUD | 0.84% | 1.34% | día siguiente | No | Sin confirmar |
| Ria | MTO | 2.89 AUD | 0.12% | 1.57% | <1hr | No | Sin confirmar |
| Orbit Remit | MTO | 4.00 AUD | 0.79% | 2.79% | 2 días | No | Sin confirmar — jugador chico |
| WorldRemit | MTO | 0.00 AUD | 2.14-2.23% | 2.14-4.46% | mismo día | **Sí** | Ya activo |
| Aussie Forex & Finance | MTO | 5.00 AUD | 0.47% | 2.97% | <1hr | No | Sin confirmar |
| Hai Ha Money Transfer | MTO | 4.00 AUD | 1.46-1.75% | 3.46-3.75% | día siguiente/2 días | No | Especialista Vietnam, no relevante para este corredor |
| Forex Australia | MTO | 8-9 AUD | 0.29-0.33% | 4.33-4.79% | mismo día/día siguiente | No | Descartar — caro |
| Jalandoni Money Changer | MTO | 9.00 AUD | 0.37% | 4.87% | día siguiente | No | Descartar — cobertura baja |
| Commonwealth Bank | Banco | 0.00 AUD | 6.49% | 6.49% | 2 días | No | Descartar — banco, muy caro |
| **Rocket Remit** | MTO | 5.00 AUD | 4.01% | **6.51%** | <1hr | No | **Reconsiderar** — a pesar de ser candidato original, en este corredor específico es de los más caros. No confirma la expectativa inicial |

**Conclusión sobre Rocket Remit:** los datos reales del Banco Mundial muestran
que, al menos en Australia→Filipinas, no es competitivo (6.51% de costo total,
similar a un banco tradicional). Esto contradice la hipótesis inicial de que
era un candidato fuerte por su alcance geográfico — el alcance no garantiza
buen precio. Recomendación: bajar prioridad, no descartar del todo (podría ser
mejor en otros corredores que no cubrió esta ronda).

**Nuevo hallazgo:** iRemit e InstaReM son mucho más prometedores que Rocket
Remit para este corredor — ambos con costos totales por debajo del 1%, mejor
que varios proveedores ya activos en mangomundi (Remitly 1.16%, MoneyGram
0.87%, WorldRemit 2.14%+).

---

## Pendiente para la próxima ronda

- **Contactar al equipo de afiliados de WorldRemit** para confirmar si el
  acuerdo existente cubre Sendwave (mismo grupo, Zepz) — es la acción de mayor
  potencial/menor esfuerzo de toda la investigación
- **Aplicar al afiliado directo de Paysend** — programa real confirmado
- Confirmar más corredores donde operan Sendwave y Paysend (probablemente
  cubren más que solo UK→Nigeria, dado que Sendwave manda desde Norteamérica,
  Europa y Asia hacia África/Asia, y Paysend cubre 150+ países)
- **España→Nigeria, Canadá→Nigeria** — verificar si aparecen firmas distintas
  a las ya vistas en UK/EEUU→Nigeria
- Confirmar Hubpay y Rocket Remit contra RPW directamente (por ahora los datos
  que tenemos de ellos vienen de sus propias apps/prensa, no de la fuente oficial)
- Corredores del Banco Mundial todavía sin tocar: Egipto, Guatemala, El Salvador,
  Bangladesh (aunque la ronda 2 de la investigación original ya concluyó que
  estos están bien cubiertos por los proveedores actuales — vale la pena una
  verificación rápida contra RPW para confirmar eso con datos duros)
- **Ria** — evaluar sumarlo como proveedor propio (no vía Walmart2World);
  aparece consistentemente en varios corredores investigados
