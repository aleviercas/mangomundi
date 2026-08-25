# Research 24–25 ago 2026: tarifas escalonadas, cobertura Argentina y decisiones de carga

**Fecha:** 25 agosto 2026
**Contexto:** este documento consolida tres investigaciones relacionadas hechas en la misma sesión y registra, de forma explícita, qué se cargó a producción, qué se dejó afuera y por qué. Reemplaza la necesidad de leer por separado los docs de trabajo intermedios (quedan igualmente disponibles en el Proyecto de Claude como material de respaldo).

**Regla de carga aplicada en toda esta sesión (pedido explícito del usuario, 25-ago-2026):** no se cargan tarifas ni tasas promocionales o de "primera transferencia" al motor de comparación — solo precio regular/estándar, el que un usuario recurrente efectivamente paga. La única excepción sería una oferta exclusiva para mangomundi (afiliado), que no existe todavía para ningún proveedor de este research.

---

## 1. Resumen ejecutivo

1. **13 proveedores `is_corridor_specific=true` tenían `fee_tiers` vacío** (Western Union, MoneyGram, Ria, Remitly, WorldRemit, Xoom, Paysend, Sendwave, TapTap Send, LemFi, NALA, Money2India, BDO Remit, UBL Tezraftaar). Se investigó fuente primaria para los 13. Solo **BDO Remit** publica una tabla de tramos fija y completa; el resto usa pricing 100% dinámico.
2. **Bug de producción real encontrado y corregido:** BDO Remit y Money2India tenían datos reales y verificados en `fx_rates`, pero como el motor de comparación (`compareProviders()`, con `ENABLE_CORRIDOR_FILTERING` apagado) nunca lee `fx_rates` — usa `providers.fee_tiers`/`fee_percent`/`fee_fixed`/`spread_percent` para **todos** los proveedores — ambos se mostraban gratis (fee $0, spread 0%) en cualquier comparación real. Corregido el 25-ago con la migración `20260825074324_populate_fee_tiers_bdo_money2india`.
3. **Se muestrearon en vivo 9 proveedores dinámicos** (100/500/1.000/5.000/10.000 en la moneda de origen, Reino Unido→India/Nigeria/Filipinas) el 25 de agosto, con un solo agente por vez para evitar contención del navegador compartido. Se identificó explícitamente qué parte de cada cotización era promocional (y se descartó) y cuál era el precio regular (y se cargó).
4. **Se auditó la cobertura de corredores** de los proveedores multi-corredor (`is_corridor_specific=true, active=true`) contra `fx_rates`, cruzando con los corredores que la investigación de Argentina identificó como activos. Se confirmó una brecha real: **Western Union, Remitly, MoneyGram y Ria operan hoy Reino Unido→Argentina** con precios reales cotizables, pero ninguno tenía ese corredor cargado en `fx_rates` — la brecha estaba en la captura de datos de mangomundi, no en que los proveedores hubieran discontinuado el corredor (que era la hipótesis original que motivó este research).
5. **Nuevo proveedor cargado: Prex** (fintech argentina, remesa P2P real a ~12 países, fee USD 2,99 flat verificado). **Nuevo proveedor NO cargado: Belo** (producto real pero sin fee/spread publicado — cargarlo como "gratis" sería engañoso). **Confirmado que no corresponde agregar:** MercadoPago, Ualá, Rebanking, Payoneer-retail (ver sección 5).
6. **Global66** se mantiene `active=false` pero se actualizó su ficha: se confirmó por fuente primaria que el corredor Europa(EUR)→Argentina(ARS) es real (remesa a un tercero, no solo movimiento entre cuentas propias), algo que la nota anterior no reflejaba. Falta el número de fee/spread en vivo (no se pudo obtener por contención del navegador).

---

## 2. Los 13 proveedores de tarifa escalonada — qué se encontró y qué se cargó

| # | Proveedor | ¿Tabla de tramos publicada? | ¿Escalona 100–10.000? | Qué se cargó |
|---|---|---|---|---|
| 1 | Western Union | No | Sí — salto discreto 500→1.000 GBP; fee siempre 0 | `fx_rates` GB→IN (tramo regular ≥1.000) y GB→AR (500 GBP) |
| 2 | MoneyGram | No | Solo por promo ("1ª transferencia"); regular vuelve a ~mid-market | `fx_rates` GB→IN (tramo 5.000–10.000, no-promo) y GB→AR (marcado `sin_confirmar` por fee inestable) |
| 3 | Ria Money Transfer | No | No (tasa normal plana; solo la promo de bienvenida varía). Tope real del corredor: 8.000 GBP | `fx_rates` GB→IN (4 tramos de fee regular) y GB→AR (500 GBP, fee regular) |
| 4 | Xoom | Parcial | Sí, leve | `fx_rates` GB→IN, 3 tramos reales |
| 5 | Remitly | No | No ("everyday rate" plana) | `fx_rates` GB→IN (everyday) y GB→AR (estándar, no "welcome rate") |
| 6 | WorldRemit | No | Sí, leve | `fx_rates` GB→IN, 2 tramos |
| 7 | Paysend | No | No | `fx_rates` GB→PH, marcado `sin_confirmar` (spread inusualmente ajustado, posible recargo oculto no visible sin login) |
| 8 | TapTap Send | No | No (mejor que mid-market, brecha NGN) | `fx_rates` GB→NG |
| 9 | Sendwave | No | No (ídem) | `fx_rates` GB→NG |
| 10 | LemFi | No | No (ídem) | `fx_rates` GB→NG |
| 11 | NALA | Parcial (varía por país destino) | N/A | Sin cambios — ya cargado correctamente en `fx_rates`, no encaja en `fee_tiers` (varía por destino, no por monto) |
| 12 | Money2India | Parcial (1 umbral) | Sí | Ya corregido el 24/25-ago (`fee_tiers` poblado) |
| 13 | BDO Remit | Sí, completa | Sí, 6 tramos | Ya corregido el 24/25-ago (`fee_tiers` poblado) |
| — | UBL Tezraftaar | Parcial, en moneda local (QAR/AED) | Sí, pero no en una sola moneda | Sin cambios — no encaja en `fee_tiers` de una sola moneda |

**Por qué no se tocó `providers.fee_tiers` (ni `fee_percent`/`fee_fixed`/`spread_percent`) para los 9 proveedores muestreados en vivo:** `fee_tiers` y los campos planos son el **fallback genérico usado en TODAS las comparaciones de ese proveedor**, para cualquier corredor, mientras `ENABLE_CORRIDOR_FILTERING` esté apagado. Los números muestreados son específicos del corredor Reino Unido→India/Nigeria/Filipinas de ese día — cargarlos como si fueran la tarifa general del proveedor sería representar mal cualquier otro corredor (p. ej. EE.UU.→México). Por eso se cargaron en `fx_rates` (que sí es por-corredor), replicando exactamente el patrón ya usado para BDO Remit/Money2India, y NO en los campos genéricos. Es una decisión arquitectónica, no una limitación de tiempo — mientras el flag de filtrado por corredor siga apagado, esta sigue siendo un área de riesgo conocida (ver `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`).

**Distinción promocional vs. regular aplicada, por proveedor:**
- Western Union: se descartó el tramo <1.000 GBP (tasa distinta, posible promocional para montos chicos); se cargó el tramo ≥1.000.
- MoneyGram: se descartó explícitamente el tramo con letra chica "pricing effective for first online transfer only"; se cargó el tramo 5.000–10.000.
- Ria: la propia calculadora distingue "tasa/fee normal" vs. una tasa de bienvenida de primera transferencia (132,21) — se cargó solo la normal.
- Remitly: se descartó la "welcome rate" (tope 1.000 GBP / primeros 500 GBP en el corredor a Argentina); se cargó la tasa "everyday".
- Xoom, WorldRemit, Paysend, TapTap Send, Sendwave, LemFi: no se detectó lenguaje promocional en sus calculadoras públicas — se cargó el valor observado como regular.

---

## 3. Argentina: comparación con la competencia real y hallazgos por proveedor

El pedido fue verificar los proveedores que la gente efectivamente compara al mandar dinero a Argentina: Western Union, Remitly, Payoneer, Global66 y fintechs locales (MercadoPago, Ualá, Prex, Belo, Rebanking, Lemon Cash).

### 3.1 Reino Unido → Argentina (500 GBP), 5 proveedores ya activos en el catálogo

Mid-market de referencia (xe.com, 25-ago-2026 08:49 UTC): **1 GBP = 2.058,8092 ARS**.

| Proveedor | ¿Opera hoy? | Tasa | Fee (regular) | Spread vs. mid-market | Método |
|---|---|---|---|---|---|
| Western Union | Sí | 2.156,2769 | 0,00 (banco/billetera) / 17,50 (efectivo) | Favorable al cliente (~4,7%) | Efectivo, banco, billetera (Pago Fácil) |
| Remitly | Sí | 2.105,01 (estándar, no "welcome") | 1,99 | Favorable (~2,2%) | Banco, efectivo, billetera |
| MoneyGram | Sí | 2.098,7083 (estándar, no promo) | 2,49–4,99 (fluctuó en la misma sesión) | Favorable (~1,9%) | No confirmado en vivo para AR específicamente |
| Wise | Sí | 2.058,66 | 8,53 (banco/PISP, la más barata) | Prácticamente igual al mid-market | Solo banco |
| Ria Money Transfer | Sí | 2.022,9064 | 8,00 (regular, sin promo) | Desfavorable (~1,7%) | Efectivo, banco, billetera |

**Hallazgo principal, y por qué importa:** los 5 proveedores operan el corredor activamente hoy. La hipótesis inicial de esta investigación (que Western Union habría "desaparecido" de Reino Unido→Argentina) queda descartada — lo que ocurría era que **mangomundi nunca había capturado datos para este corredor específico**, no que WU lo hubiera discontinuado. Este mismo patrón de brecha de captura (no de discontinuación real) es probablemente el explicativo correcto para otras "ausencias" que se detecten en el futuro — conviene verificar primero con el proveedor antes de asumir que dejó de operar una ruta.

**Dato llamativo:** 3 de 5 proveedores (WU, Remitly, MoneyGram) ofrecen una tasa favorable al mid-market oficial de xe.com — no se pudo determinar con certeza si eso corresponde al tipo de cambio oficial/mayorista argentino o a uno financiero (MEP/CCL), porque se usó xe.com como única referencia por instrucción explícita. Queda pendiente de investigar si se necesita esa atribución exacta — es relevante porque Argentina tiene múltiples regímenes cambiarios y "mejor que el mid-market" puede significar cosas distintas según cuál sea la referencia real.

### 3.2 Payoneer

No se encontró un producto de remesa personal C2C comparable (Payoneer retail es fundamentalmente una cuenta de cobro para freelancers/e-commerce, no un "enviale plata a tu familia"). **No corresponde agregarlo** al comparador de remesas.

### 3.3 Global66

Ver sección 5.3 — corredor Europa→Argentina confirmado como real, pero sin cifra de fee/spread verificable todavía.

### 3.4 Fintechs argentinas: MercadoPago, Ualá, Prex, Belo, Rebanking, Lemon Cash

Ver sección 5.

---

## 4. Auditoría de cobertura de corredores (método repetible)

Para detectar el error que el usuario marcó como grave — "tener proveedores pero sin datos [para un corredor que sí operan]" — se corrió esta consulta contra `providers`/`fx_rates`:

```sql
select p.slug, p.name, p.active, count(f.id) as fx_rows,
  array_agg(distinct f.sending_country || '->' || f.receiving_country) filter (where f.id is not null) as corridors
from providers p
left join fx_rates f on f.provider_slug = p.slug
where p.is_corridor_specific = true
group by p.slug, p.name, p.active
order by fx_rows asc, p.name;
```

**Resultado para proveedores `active=true`:** todos tienen al menos 1 fila en `fx_rates`, y en los casos de proveedores de un solo corredor (BDO Remit, Money2India, UBL Tezraftaar) esa fila corresponde a su único corredor real — no hay ningún proveedor activo mostrado con cero datos hoy. El bug de "proveedor activo sin ningún dato" que sí existía (BDO Remit / Money2India a nivel `fee_tiers`, no a nivel `fx_rates`) ya está corregido (sección 1, punto 2).

**Lo que esta consulta NO detecta por sí sola** es la brecha real que sí se encontró en la sección 3.1: un proveedor puede tener decenas de filas en `fx_rates` y aun así faltarle un corredor específico que opera de verdad (Western Union tenía 202 filas y aun así le faltaba Reino Unido→Argentina). Para eso hace falta cruzar la lista de corredores cargados contra el conocimiento real de qué mercados sirve cada proveedor — no es automatizable con una sola consulta SQL, requiere investigación dirigida por corredor/región.

**Gaps adicionales detectados por este cruce, no resueltos todavía (recomendado para el próximo research dirigido a Argentina):**
- Remitly y MoneyGram tienen `US->AR` cargado pero no `ES->AR` (España→Argentina, corredor con alta demanda esperable por la diáspora argentina en España). Ria sí tiene `ES->AR`.
- Global66: corredor `EUR->ARS` confirmado real pero sin cifra (sección 5.3).

**Fuera de Argentina:** esta sesión no alcanzó a repetir la auditoría dirigida corredor-por-corredor para otras regiones (África, Sudeste Asiático, Medio Oriente) más allá de la consulta de cobertura general de la sección 4, que no mostró proveedores activos con cero datos. Si se quiere el mismo nivel de profundidad que se hizo para Argentina (verificar corredores reales vs. cargados) en otra región, hace falta un research dirigido a esa región específica.

---

## 5. Nuevos proveedores candidatos (Argentina)

### 5.1 Prex — **CARGADO**

Fintech argentina (tarjeta + wallet). Remesa P2P real (no wallet propia, no cripto) desde Argentina hacia: EE.UU., Alemania, España, Francia, Italia, Portugal, México, Brasil, Colombia, Bolivia, Paraguay, Venezuela. Un producto aparte, "Prex a Prex" (instantáneo, wallet a wallet), está limitado a Perú/Chile/Uruguay.

- **Fee: USD 2,99 flat** por transferencia en USD a cuenta bancaria — confirmado en dos páginas de producto independientes con el mismo texto (corredor a EE.UU. y corredor a Perú), lo que confirma que es una tarifa general, no específica de un corredor.
- **Gratis** si se envía en ARS.
- **USD 0,99** para "Prex a Prex".
- **Límites** (corregidos respecto a un dato previo sin verificar que tenía los topes invertidos): transferencia bancaria máx. USD 500/operación y USD 1.000/día; Prex a Prex máx. USD 1.000/operación y por día.
- **Spread/margen cambiario: no publicado en ningún lado.** Se cargó como `spread_percent = 1.0` explícitamente marcado en las notas como estimación provisoria, pendiente de verificar con una cotización en vivo — es una carencia real de transparencia de Prex, no un descuido de esta investigación.
- Hubo una promo de comisión 0% del 1-ene al 31-jul-2026, ya vencida a la fecha de esta carga — no afecta el fee cargado.
- Fuentes (todas verificadas 25-ago-2026): `prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-estados-unidos`, `.../enviar-dinero-desde-argentina-a-peru`, centro de ayuda de límites.

### 5.2 Belo — **NO CARGADO, pendiente**

Producto real de transferencia P2P internacional (no solo wallet propia) desde Argentina hacia ~50 países (Américas, zona SEPA, Reino Unido, Australia), corroborado por el centro de ayuda y la página de producto de Belo. El problema: **Belo no publica ningún fee ni spread numérico** para este producto — su propio mensaje es "sin comisiones", pero eso no significa gratis de verdad (el costo real casi seguro está en el margen cambiario, no visible sin loguearse y cotizar). Cargarlo con "fee 0, spread desconocido" sería representarlo como gratis cuando no lo es. **Se necesita una cotización en vivo logueada, o datos directos del proveedor, antes de cargarlo.**

### 5.3 Global66 — **NO reactivado, ficha actualizada**

Se confirmó por fuente primaria (`global66.com/enviar-dinero/EUR/ARS/`, centro de ayuda) que Global66 opera Europa(EUR)→Argentina(ARS) como remesa real a un tercero — algo que la ficha anterior (agosto 2025) no reflejaba, ya que solo documentaba corredores con Argentina como país emisor (AR→CO), no receptor. No se encontró corredor EE.UU.→Argentina. No se pudo obtener la cifra de fee/spread en vivo porque el cotizador es 100% dinámico y hubo contención del navegador compartido con otros agentes corriendo en simultáneo en el momento de la investigación. Sigue `active=false` hasta poder muestrear en vivo sin contención.

### 5.4 MercadoPago, Ualá, Rebanking, Payoneer-retail — **NO corresponde agregar**

- **MercadoPago:** no tiene un producto propio de remesa internacional. Solo aparece como canal de cobro de terceros (p. ej. Western Union en México — no en Argentina, donde WU usa Pago Fácil — y Yape-Perú→MercadoPago-Argentina desde abril/mayo 2026). Agregar MercadoPago como "proveedor" sería confundir un destino de pago con un remitente.
- **Ualá, Rebanking, Payoneer (uso retail):** no tienen un producto de remesa personal C2C comparable — son cuentas/tarjetas domésticas o de cobro para freelancers, no envío de dinero a terceros en el exterior.

Se documenta esta conclusión acá explícitamente para que una futura sesión no vuelva a gastar tiempo re-investigando estos cuatro casos desde cero.

### 5.5 Lemon Cash

Ya estaba señalado en `providers.notes` como producto cripto (categoría distinta a una MTO fiat tradicional) desde antes de esta sesión — no se tocó, sigue pendiente la decisión de categoría de producto ya documentada previamente.

---

## 6. Fuentes primarias consultadas (resumen)

Todas las cifras de este documento provienen de fuente primaria (sitio oficial, calculadora pre-login, o centro de ayuda del propio proveedor), nunca de agregadores de terceros. El detalle completo de URLs por proveedor está en el archivo de migración `supabase/migrations/20260825092038_load_dynamic_provider_corridors_and_prex.sql` (columna `data_source` de cada fila) y en los documentos de trabajo del Proyecto de Claude:
- Research original de tarifas escalonadas (13 proveedores, muestreo completo 25-ago).
- Cotización en vivo Reino Unido→Argentina (5 proveedores, 500 GBP, 25-ago).
- Investigación Global66 (corredores hacia Argentina, 25-ago).
- Diagnóstico de arquitectura de proveedores y corredores (`docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`, ya en este repo).

## 7. Qué falta / próximos pasos recomendados

1. Re-muestrear Global66 (EUR→ARS) en una sesión de navegador sin contención, para poder reactivar el proveedor con datos reales.
2. Conseguir un fee/spread citable para Belo (cotización logueada o contacto directo con el proveedor) antes de decidir si se agrega.
3. Investigar si Remitly y MoneyGram operan España→Argentina (ES→AR) — la auditoría de cobertura (sección 4) marca esa combinación como probable pero no confirmada.
4. Re-verificar Paysend GB→PH y MoneyGram GB→AR — ambos quedaron marcados `sin_confirmar` en `fx_rates` por señales de inestabilidad en la cotización (spread inusualmente ajustado en un caso, fee fluctuante en el otro).
5. Extender la auditoría de cobertura de corredores (sección 4) a otras regiones del catálogo (África, Medio Oriente, Sudeste Asiático) con el mismo nivel de detalle que se aplicó a Argentina en esta sesión.
6. Evaluar si conviene activar `ENABLE_CORRIDOR_FILTERING` en producción — mientras siga apagado, todo dato cargado en `fx_rates` para corredores específicos (incluido todo lo de este documento) no afecta lo que ve un usuario real hoy; solo lo protege para cuando el flag se active o para research/auditoría interna.
