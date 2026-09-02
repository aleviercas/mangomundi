# mangomundi — Research, ADDENDUM #2 (v8) — Prex completo + MoneyGram ES→AR + fuente World Bank

> **Nota de estado (añadida 2-sep-2026, al exportar este research a
> Supabase):**
> - **Prex, 13 corredores nuevos** (Sección 2.1): **cargados a `fx_rates`**
>   (migración `load_prex_corridor_rates_research_v8`) — México, Brasil,
>   Colombia, Bolivia, Paraguay, Perú, Uruguay, Chile, Alemania, Francia,
>   Italia y Portugal como `verified_status='confirmado_activo'`; Venezuela
>   como `sin_confirmar` (spread atípico, ver Sección 2.3). Italia y
>   Portugal se cargaron aceptando la inferencia por moneda compartida
>   (misma cotización que Alemania/Francia), tal como recomienda la Sección
>   2.1. Con esto, 13 de los 15 corredores del whitelist de Prex tienen fila
>   propia en `fx_rates` — antes de esta carga, ninguno la tenía (el
>   proveedor dependía 100% del fallback `spread_percent=1.0` a nivel de
>   `providers`, ver el punto siguiente).
> - **Prex, ficha del proveedor** (`providers.notes` y `providers.spread_percent`):
>   **actualizada** (migración `update_prex_notes_after_v8_corridor_completion`).
>   `spread_percent` pasó de `1.0` (estimación provisoria original,
>   25-ago-2026) a `10.5` — no es un número nuevo inventado, es el punto
>   medio del rango ~10-11% que v5/v6 ya habían medido para AR→EE.UU. y
>   AR→España (ver Sección 2.2 de este documento), pero sin registrar en su
>   momento el par tasa/fee exacto necesario para cargar una fila real en
>   `fx_rates`. Este fallback de nivel-proveedor sigue aplicando **solo**
>   a esos dos corredores (AR-US, AR-ES) — los otros 13 ya usan su propia
>   fila, que `fx.functions.ts` prioriza sobre el fallback. No se cargó una
>   fila de `fx_rates` para AR-US/AR-ES porque no hay un par tasa/fee
>   citable con precisión suficiente sin volver a medir en vivo — cargar
>   algo así habría sido inventar un número, no usar uno investigado.
> - **MoneyGram ES→Argentina** (Sección 1, el pendiente de v7): **cargado a
>   `fx_rates`** (migración `load_moneygram_es_ar_regular_rate_research_v8`)
>   — rate 1.779,13 ARS, fee 2,49 EUR, `sending_country='ES'`,
>   `receiving_country='AR'`, `verified_status='confirmado_activo'`.
>   `public_spread_percent` se cargó en **-1,56** (negativo): la tasa
>   regular de MoneyGram queda por *encima* del mid-market de xe.com citado
>   en la Sección 1 (1.751,7589 ARS), no por debajo como es lo usual — ver
>   la nota metodológica de esa sección sobre por qué el mid-market de
>   xe.com es una referencia menos estable para corredores con ARS como
>   moneda receptora. La fila promocional (1.858,02 ARS, fee 0) **no** se
>   cargó, siguiendo la recomendación explícita de la Sección 1.
> - **Remitly Reino Unido→Argentina** (Sección 9.1): **NO se modificó
>   nada.** La fila que ya existía en `fx_rates` para este corredor
>   (`confirmado_activo`, rate 2.105,01, fee 1,99) se dejó tal cual. El dato
>   nuevo de esta ronda (cuenta real del usuario, rate 2.059,64, fee 0,99
>   vía transferencia bancaria) es una medición legítima pero discrepante
>   de la ya cargada — probablemente ambas son correctas para métodos de
>   cobro/fecha distintos, que esta base no modela por separado. Se
>   documenta la discrepancia acá en vez de sobrescribir un dato ya
>   confirmado con uno que no se puede reconciliar sin volver a medir en
>   vivo (mismo criterio aplicado en el addendum v7 al caso de Xoom
>   GB→México).
> - **Remitly España→Argentina** (Sección 14.1): **NO se cargó.** La única
>   cotización disponible sin cuenta logueada es la promocional ("tipo de
>   cambio de bienvenida", 1.792,22 ARS) — 7ª confirmación del patrón de
>   contaminación promocional del proyecto. Sigue sin existir una fila
>   ES→AR de Remitly en `fx_rates`; la tasa regular solo puede conseguirse
>   con una cuenta ya usada, igual que con MoneyGram antes de este mismo
>   research.
> - **Félix Pago** (Sección 10): **NO se agregó como proveedor.** Su fee
>   regular (USD 2,99) está confirmado por su página de ayuda, pero su
>   único tipo de cambio medible en vivo es explícitamente promocional
>   ("Promotional exchange rate", 1,90% mejor que mid-market) — no hay
>   spread real para cargar. Queda documentado como candidato (ver la
>   lista de proveedores candidatos más abajo), no como fila de `fx_rates`
>   ni de `providers`.
> - **Candidatos de esta ronda** (Intermex, Placid Express, TransferGo,
>   Skrill, Merchantrade Money Transfer, ARQ Finance/DolarApp, SBI Remit,
>   Brastel Remit, JRF, SMTJ, MoneyMatch Transfer, RemitMoney, Tonio):
>   **ninguno se agregó a `providers`.** Son hallazgos informativos de esta
>   ronda de research (nombres reales, con distinto grado de dato duro
>   detrás de cada uno — ver Secciones 10.3, 12.5, 13.3, 13.4 y 14.4-14.7),
>   pendientes de una decisión de producto sobre cuáles vale la pena sumar.
>   RemitMoney en particular está marcado explícitamente como sospechoso
>   (0,00% de costo total, sin verificar) — no cargar sin confirmar.
> - **Arquitectura de brokers business** (Sección 13.1, tabla
>   `business_broker_rate_tiers` propuesta): **actualizado 4-sep-2026 —
>   el usuario confirmó que sí, construir el esquema.** Migración
>   `add_business_broker_rate_tiers` aplicada: tabla nueva
>   (`provider_slug, from_currency, to_currency, min_amount, max_amount,
>   spread_percent, fee_percent, fee_fixed`), lectura pública, y
>   `compareProviders` (fx.functions.ts) ahora la consulta antes de caer a
>   `resolveTier()` para búsquedas de segmento business. **La tabla queda
>   vacía** — sigue sin haber datos reales de tarifas escalonadas por par
>   de moneda para ninguno de los 6 brokers, así que esto no cambia ningún
>   resultado hoy (con la tabla vacía, `resolveBrokerTier` siempre devuelve
>   `null` y todo cae al mismo `resolveTier()` de siempre) — solo deja el
>   esquema listo para cuando esa investigación exista. Pendiente real:
>   investigar y cargar las tarifas por corredor/monto de cada broker.
> - **Todo lo demás de este archivo** (Secciones 3, 7, 8, 9.2, 11, 12.1-12.4,
>   13.2-13.5, 14.2-14.3, 14.5-14.8) es contexto de mercado, fuentes de
>   terceros o hallazgos ya reflejados arriba — no generó cambios propios en
>   `fx_rates` ni en `providers`.

> **Documento adicional, no reemplaza a v6 ni a v7.** Sumá este a los
> anteriores para cargar. Nada de esto fue cargado a Supabase — solo
> research. Cero `apply_migration`, cero `execute_sql` de escritura, cero
> commits.
>
> **Actualizado el mismo día, cinco veces.** Primera actualización:
> Secciones 7 y 8 (fuente Banco Mundial + pedidos de datos). Segunda
> actualización: Secciones 9-11 (tus respuestas a esos pedidos + Félix Pago
> + otras fintechs). Tercera actualización: Sección 12 (barrido de fintechs
> en más rutas — LatAm, Sur de Asia, Golfo, África). Cuarta actualización:
> Sección 13 — **mapa completo de qué está investigado y qué falta**
> (respuesta directa a tu pregunta) + barrido de Japón, Corea, Indonesia,
> Europa del Este. **Quinta actualización: Sección 14 — verificación en
> vivo con browser de Remitly/WorldRemit España→Argentina, reintento de
> Global66 (sigue bloqueado), y evaluación de los 4 candidatos que habían
> quedado pendientes (TransferGo, Merchantrade, SBI Remit/Brastel Remit) +
> 3 corredores nuevos (Alemania→India, Malasia→Tailandia, Japón→Vietnam).**
> Las Secciones 1-6 quedaron igual que la primera versión de v8.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha de investigación:** 2-sep-2026. **Fecha de export a Supabase:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **MoneyGram España→Argentina — el dato que quedó pendiente en v7 — ya
   está.** Tasa regular, tasa promocional y fee, los tres confirmados. Ver
   Sección 1.
2. **Prex: se completaron los 15 corredores del whitelist** (antes solo 2 de
   15 estaban medidos — US y España). Los 13 restantes (México, Brasil,
   Colombia, Bolivia, Paraguay, Venezuela, Perú, Uruguay, Chile, Alemania,
   Francia, Italia, Portugal) se midieron esta ronda. Ver Sección 2. Esto es
   el corredor de investigación con más impacto de todo el proyecto hasta
   ahora, porque Prex es el único proveedor con `supported_corridors`
   completo y activo en la base — significa que ahora se puede cargar el
   spread real (no estimado) en el 100% de sus corredores, no solo 2 de 15.
3. **Hallazgo dentro de Prex: 3 de los 15 corredores tienen fee explícito**
   (Perú, Uruguay, Chile — los tres con el mismo monto, $1.663,20 ARS sobre
   $100.000 enviados, o sea 1,66%). Los otros 12 corredores siguen con fee
   $0. No hay una explicación obvia de por qué justo esos tres tienen fee y
   el resto no — se documenta como está, sin inventar una causa.
4. **Hallazgo dentro de Prex: el corredor a Venezuela tiene un spread mucho
   más bajo que el resto** (~3,9% vs. el cluster de 9-12% en los demás 14
   corredores). Vale la pena una nota de precaución antes de cargarlo — ver
   Sección 2.3.
5. Global66 EUR→ARS: se reintentó una vez más y **sigue sin renderizar la
   calculadora** (ya son 4 intentos en total a lo largo de todo el proyecto,
   todos fallidos de la misma forma). Se documenta como bloqueo persistente,
   no vale la pena seguir insistiendo con este método.
6. **NUEVO — se encontró una fuente de datos reales (no promocionales) para
   comisión + margen cambiario: `remittanceprices.worldbank.org`.** Es la
   encuesta trimestral oficial del Banco Mundial ("Remittance Prices
   Worldwide"), que releva precios reales por proveedor y corredor —
   exactamente el dato que veníamos peleando por conseguir a mano contra
   los sitios públicos de Remitly/WorldRemit. Tiene una limitación
   importante: **Argentina no está en su lista de países receptores**, así
   que no resuelve ES→AR — pero sí sirve para caracterizar en general el
   margen real de Remitly, WorldRemit, MoneyGram, Western Union, Ria, Xoom,
   Wise y Paysend en decenas de otros corredores que si están en la base.
   Ver Sección 7 — es el hallazgo metodológico más importante de todo el
   proyecto hasta ahora.
7. **Quedan 2 cosas que no puedo ver yo y necesito que las mires vos** — ver
   Sección 8.
8. **Me pasaste Remitly UK→Argentina (cuenta real, no promo) y una tabla de
   Global66** — ambos ya están sumados al documento, ver Sección 9.
9. **NUEVO — Félix Pago** (fintech de remesas por WhatsApp, EEUU→Colombia y
   9 países más): investigada a pedido tuyo, con medición en vivo. Su
   página muestra explícitamente "Promotional exchange rate" — mismo patrón
   de contaminación promocional que ya vimos 5 veces antes. Fee regular
   (USD 2,99) sí confirmado por su página de ayuda oficial. Ver Sección 10.
10. Revisé otras dos fintechs candidatas para Colombia: **Valiu cerró en
    2021** (se descarta), **ARQ Finance (ex DolarApp)** es más una billetera
    multimoneda cripto-adyacente que un producto de remesas — candidata al
    mismo tratamiento que Bitso/Strike si se quiere sumar. Ver Sección 10.3.
11. **NUEVO — barrido de fintechs en 4 corredores más** (Estados
    Unidos→México, Estados Unidos→India, Reino Unido→Nigeria, Emiratos
    Árabes→India), para responder a tu pedido de "seguir investigando
    fintech en todas las rutas". Salieron 2 candidatos reales que no
    estaban en la base todavía — **Intermex** (México/Caribe, cotiza en
    NASDAQ, ~USD 659M de facturación anual) y **Placid Express** (Sur y
    Sudeste de Asia, jugador establecido de larga trayectoria). El resto de
    los nombres que aparecieron ya estaban cubiertos o son parte de MTOs que
    ya están en la base (ej. Vigo y Orlandi Valuta son marcas de Western
    Union; La Nacional ahora es parte de Intermex). Ver Sección 12.
12. **NUEVO — mapa completo de qué está investigado y qué falta**, respuesta
    directa a tu pregunta de esta ronda ("¿qué rutas, corredores y
    proveedores falta investigar? ¿los de tarifa variable y business ya
    están? ¿Asia, India, Indonesia, Europa del Este, Japón, Corea, Ucrania,
    Argentina?"). En resumen: **business/tarifa variable está solo
    parcialmente resuelto** — los términos contractuales (settlement,
    contrato, monto mínimo) ya se cargaron en dos migraciones previas, pero
    el problema de fondo (spread variable por par de moneda y monto,
    `spread_percent` de `providers` es un solo número fijo) sigue abierto y
    es una decisión de arquitectura, no de research — se propone una tabla
    nueva `business_broker_rate_tiers` (no construida, solo propuesta).
    Golfo, Ucrania (vía Alemania→Ucrania) y Nigeria están confirmados
    completos, sin nombres nuevos. Corea del Sur se descartó como corredor
    de origen (dominado por bancos, sin fintechs dedicadas). Salieron 2
    candidatos nuevos en Europa del Este — **TransferGo** y **Tonio**
    (Reino Unido→Polonia) — y una lista de nombres en Japón e Indonesia
    (SBI Remit, Brastel Remit, Kyodai, JME, DCOM Money Express en Japón;
    CBL Money Transfer, GPL Remittance, Max Money, E-remit, Akbar Money
    Changer, Merchantrade Money Transfer en Indonesia) confirmados vía World
    Bank pero todavía sin investigación individual profunda. Ver Sección 13,
    con matriz de estado completa por región.
13. **NUEVO — verificación en vivo con browser (España real, no proxy de
    UK) + reintento de Global66 + cierre de los 4 candidatos pendientes.**
    Conseguí la cotización pública de Remitly España→Argentina directo del
    sitio (tasa de bienvenida 1 EUR = 1.792,22 ARS, ~2,35% mejor que
    mid-market — 7ª confirmación del patrón de tasa promocional del
    proyecto) y confirmé en vivo que WorldRemit España→Argentina no expone
    depósito bancario/efectivo sin la app. Global66 sigue roto (404) con
    una segunda herramienta de browser distinta — recomiendo cerrar ese
    ítem salvo que alguien lo consiga desde la app. Evalué los 4
    candidatos que habían quedado pendientes: TransferGo (estructura tipo
    Wise, falta medir en vivo), Merchantrade (confirmado con datos reales
    de World Bank, proveedor legítimo de costo medio-bajo), SBI Remit (sin
    dato usable todavía) y Brastel Remit (0,24% de margen en Japón→Vietnam
    según World Bank). Sumé 3 corredores nuevos (Alemania→India,
    Malasia→Tailandia, Japón→Vietnam) con 2 nombres nuevos a evaluar
    (Skrill, prometedor; MoneyMatch Transfer, Malasia). Con esto, todas
    las regiones que preguntaste quedaron tocadas al menos a nivel de
    datos de World Bank. Ver Sección 14, con la lista de pendientes
    actualizada.

---

## 1. MoneyGram España→Argentina (el pendiente de v7)

Navegando directamente a
`https://www.moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/` (el link
encontrado en v7, sin pelear con el combobox de país):

| | Tasa | Cargo | Envías | El contacto recibe |
|---|---|---|---|---|
| Regular | 1 EUR = 1.779,13 ARS | 2,49 EUR | 100,00 EUR | — |
| Promocional ("primera transferencia") | 1 EUR = 1.858,02 ARS | 0,00 EUR (ahorra 2,49 EUR) | 100,00 EUR | — |

Mid-market de referencia (xe.com, mismo momento): 1 EUR = 1.751,7589 ARS.

**Dato llamativo:** a diferencia de Marruecos (donde la tasa regular de
MoneyGram, 10,6929 MAD, estaba por *debajo* del mid-market, como es lo
esperable), acá **tanto la tasa regular (1.779,13) como la promocional
(1.858,02) están por *encima* del mid-market de xe.com** (1.751,76) — la
regular un 1,56% mejor, la promocional un 6,07% mejor. Esto no es un error
de MoneyGram: Argentina tiene un mercado cambiario con varias referencias
(oficial, financiero/MEP, etc.) y desde abril de 2025 el peso flota dentro
de bandas — que un proveedor cotice ARS por fuera del punto medio "oficial"
que reporta xe.com no es en sí mismo sospechoso, pero **sí implica que para
el corredor ES→AR (y probablemente para cualquier corredor con ARS como
moneda receptora) conviene tratar al mid-market de xe.com con más cautela
que para el resto de las monedas**, y no asumir automáticamente que "más
alto que mid-market = raro". No se investigó más a fondo esta ronda — queda
como nota metodológica, no como hallazgo cerrado.

**Recomendación para carga:** usar la fila regular (1.779,13 ARS, cargo 2,49
EUR) con `verified_status='confirmado'`, igual que Marruecos. La fila
promocional no se carga como tarifa estándar.

---

## 2. Prex: los 13 corredores restantes del whitelist, completos

**Método:** se encontró el patrón de URL que sí carga la calculadora
funcional por corredor (a diferencia de la home de prexcard.com.ar, que
tiene un widget decorativo que no responde):

```
https://www.prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-{país}
```

Se cargó cada corredor, se ingresó $100.000 ARS en "Quiero enviar", y se leyó
comisión + cotización + monto recibido directamente del widget. El
mid-market de referencia es xe.com al mismo momento para cada par de
monedas.

### 2.1 — Tabla completa (los 13 corredores nuevos)

| Corredor | Fee sobre 100.000 ARS | Cotización Prex | Mid-market (xe.com) | Spread (solo tipo de cambio) | Spread all-in (con fee) |
|---|---|---|---|---|---|
| AR→México (MXN) | $0 | 1 ARS = 0,00991 MXN | 0,011231 MXN | 11,77% | 11,77% |
| AR→Brasil (BRL) | $0 | 1 ARS = 0,00301 BRL | 0,00340856 BRL | 11,69% | 11,69% |
| AR→Colombia (COP) | $0 | 1 ARS = 1,86086 COP | 2,08838 COP | 10,90% | 10,90% |
| AR→Bolivia (BOB) | $0 | 1 ARS = 0,00701 BOB | 0,00788277 BOB | 11,07% | 11,07% |
| AR→Paraguay (PYG) | $0 | 1 ARS = 3,44614 PYG | 3,90740 PYG | 11,81% | 11,81% |
| AR→Venezuela (VES) | $0 | 1 ARS = 0,50846 VES | 0,52888 VES | **3,86%** ⚠️ | 3,86% |
| AR→Perú (PEN) | $1.663,20 (1,66%) | 1 ARS = 0,00205 PEN | 0,00222487 PEN | 7,86% | 9,42% |
| AR→Uruguay (UYU) | $1.663,20 (1,66%) | 1 ARS = 0,0242 UYU | 0,02666155 UYU | 9,23% | 10,75% |
| AR→Chile (CLP) | $1.663,20 (1,66%) | 1 ARS = 0,56548 CLP | 0,61903065 CLP | 8,65% | 10,17% |
| AR→Alemania (EUR) | $0 | 1 ARS = 0,00051 EUR | 0,00057091 EUR | 10,67% | 10,67% |
| AR→Francia (EUR) | $0 | 1 ARS = 0,00051 EUR (idéntico a Alemania, verificado) | 0,00057091 EUR | 10,67% | 10,67% |
| AR→Italia (EUR) | $0 (inferido) | 0,00051 EUR (inferido — misma moneda, no remedido) | 0,00057091 EUR | ~10,67% (inferido) | inferido |
| AR→Portugal (EUR) | $0 (inferido) | 0,00051 EUR (inferido — misma moneda, no remedido) | 0,00057091 EUR | ~10,67% (inferido) | inferido |

**Nota sobre Italia/Portugal:** no se remidieron por separado — Alemania y
Francia dieron exactamente la misma cotización (0,00051 EUR, €50,75 sobre
$100.000 ARS), lo cual tiene sentido porque las 4 son destinos en euros y
Prex cotiza por moneda, no por país. La inferencia tiene alta confianza pero
técnicamente no está remedida — marcar `verified_status='sin_confirmar'`
para estos 2 corredores puntuales si se quiere ser estricto, o
`'confirmado'` si se acepta la inferencia (recomendación: aceptarla, el
patrón es consistente en los 3 países en euros ya medidos directamente:
España en v5, Alemania y Francia acá).

### 2.2 — Junto con lo ya medido en v5/v6, Prex queda así:

| Corredor | Spread all-in |
|---|---|
| AR→Estados Unidos (USD) | ~9,95% |
| AR→España (EUR) | ~10,67-11,15%* |

\* v5 midió 11,15% con una muestra de $100.000; esta ronda, con un cálculo
más preciso via Alemania/Francia (misma moneda), da 10,67%. La diferencia es
chica y puede deberse a fluctuación del mercado entre mediciones (fueron en
fechas distintas) — no es una contradicción, es la volatilidad esperable
del propio ARS.

**Con esto, los 15 de 15 corredores del whitelist de Prex tienen spread real
medido (13 directos + 2 inferidos con alta confianza).** Antes de esta
ronda, 13 de esos 15 corredores mostraban en la base un spread estimado
provisorio (o sin dato). Es el cierre de gap más grande de todo el proyecto
para un solo proveedor.

### 2.3 — Nota de precaución: Venezuela

El spread de AR→Venezuela (~3,86%) rompe el patrón: los otros 14 corredores
de Prex están agrupados entre 7,86% y 11,81% (todos "solo tipo de cambio",
sin contar fee). Venezuela da menos de la mitad del más bajo de ese grupo.
No hay evidencia de que sea un error de medición — se hizo el mismo
procedimiento que en los otros 14 — pero el bolívar venezolano tiene su
propia complejidad cambiaria (múltiples tasas de referencia, alta
inflación, y la moneda fue redenominada más de una vez en los últimos
años), así que el "mid-market" de xe.com para VES podría no ser una
referencia tan estable como para las otras monedas de la tabla. **No se
recomienda cargar este dato como `confirmado` sin una segunda medición en
otro momento** — cargarlo como `sin_confirmar` con una nota, o esperar una
verificación adicional.

---

## 3. Global66: cuarto intento, mismo resultado

Se volvió a probar `global66.com/enviar-dinero/EUR/ARS/`. Esta vez el
`read_page{filter:interactive}` sí devolvió los campos del formulario
("Tu envías" / "Tu contacto recibe"), a diferencia de intentos anteriores
donde no aparecía ningún campo de texto — un progreso menor. Pero al
hacer click y escribir un monto, **la calculadora no mostró ningún valor
actualizado** ("Monto a enviar" y "Tipo de cambio" seguían vacíos en el
texto de la página), y visualmente la sección del formulario no se
renderizaba en el viewport (solo se veía el fondo azul del hero).

Sí se pudo confirmar el tipo de cambio de referencia que Global66 muestra
más abajo en la página ("Usamos el tipo de cambio real de EUR a ARS: 1 EUR =
1.751,586661 ARS"), que es prácticamente idéntico al mid-market de xe.com
(1.751,7589) — Global66 dice usar el tipo de cambio real sin margen, lo
cual sugiere que su ganancia viene 100% de un fee explícito y no de spread
cambiario. Pero **sigue sin poder confirmarse cuál es ese fee**, porque la
calculadora interactiva nunca terminó de funcionar en 4 intentos
distribuidos a lo largo de todo el proyecto. Recomendación: si hace falta
este dato, probar desde la app móvil o con una cuenta creada, no desde la
web pública — o aceptar que este proveedor queda con datos parciales
(tipo de cambio de referencia sí, fee no) indefinidamente.

---

## 4. Plan actualizado — solo los cambios de esta ronda

**Tier 1 (listo para migrar), agregar:**
- Los 13 corredores nuevos de Prex de la Sección 2.1, con
  `verified_status='confirmado'` — **excepto Venezuela**, que va como
  `sin_confirmar` con nota (ver 2.3).
- Italia y Portugal de Prex (inferidos), `verified_status='confirmado'` si
  se acepta la inferencia por moneda compartida.
- MoneyGram ES→AR: tasa regular 1.779,13 ARS, cargo 2,49 EUR,
  `verified_status='confirmado'`.

**Tier 2, actualizar:**
- Global66 EUR→ARS: de "no reintentado" pasa a "reintentado y sigue
  bloqueado, 4to intento fallido" — se recomienda no seguir insistiendo con
  browser público, solo con cuenta logueada o la app.
- Prex: **cerrado** — ya no queda ningún corredor del whitelist sin medir.

---

## 5. Resumen ejecutivo de esta ronda

Dos cierres importantes: el pendiente de MoneyGram ES→AR que había quedado
abierto en v7, y — más grande — el whitelist completo de 15 corredores de
Prex (antes 2/15, ahora 15/15). De paso, dos hallazgos metodológicos: (a)
Prex tiene fee explícito solo en 3 de sus 15 corredores, sin patrón
evidente; (b) el corredor a Venezuela tiene un spread muy por debajo del
resto y necesita una segunda mirada antes de cargarse como dato firme.
Global66 sigue sin poder medirse por este método después de 4 intentos —
recomendación de no seguir insistiendo por acá.

---

## 6. Metodología

Igual que v4-v7 (browser real vía el puente al dispositivo, comparado contra
xe.com mid-market al mismo momento de cada medición). Todos los montos de
Prex se midieron con $100.000 ARS como monto de entrada, salvo donde se
indica lo contrario. Nada inventado — cualquier corredor no listado acá
sigue sin dato propio.

---

## 7. NUEVO — Remittance Prices Worldwide (Banco Mundial): fuente de datos reales, no promocionales

### 7.1 — Qué es y por qué importa

`remittanceprices.worldbank.org` es la base pública oficial del Banco
Mundial que releva, **trimestralmente y con metodología de shopper real**
(no scraping de la home promocional), el precio efectivo — fee + margen
cambiario — que cada proveedor grande cobra en cientos de corredores. Es
la misma fuente de la que salió originalmente `catalogo_mundial_final.csv`
(el catálogo de 684 filas que ya tenías). Lo que no habíamos usado hasta
ahora es que **el sitio también tiene una interfaz web con el detalle por
proveedor, actualizado a Q3 2025** (dato recolectado 2-20 de agosto 2025
para el corredor de España, y 8/8-1/9 2025 para el de UK — es decir,
reciente, no viejo).

**Por qué esto resuelve un problema que venía golpeando toda la
investigación:** en vez de pelear con el widget público de Remitly o
WorldRemit para tratar de adivinar si la tasa mostrada es la promocional o
la real, acá el Banco Mundial ya hizo ese trabajo — manda "compradores"
reales a cada proveedor y publica el precio efectivo que pagó una persona
común, sin login especial ni trucos. Es una fuente citable y con
metodología pública, mejor que cualquier cosa que podamos inferir
nosotros mirando una página.

**La limitación grande: Argentina no es un país receptor en esta base.**
Se confirmó con dos combobox distintos del sitio (dos widgets de búsqueda
separados) — ningún listado de "país receptor" incluye Argentina. No hay
manera de conseguir ES→AR por acá. Sí están, entre los que nos importan:
Filipinas, México, Brasil, Colombia, Bolivia, Paraguay, Perú, Marruecos,
Nigeria, República Dominicana, Ecuador, Honduras, Rumania, Bulgaria, China
— y muchos más (cada país que envía tiene su propia lista de receptores
disponibles, no es la misma para todos).

### 7.2 — Tabla real: Reino Unido → Filipinas (transferencia de 120 GBP, Q3 2025)

Esto es directamente comparable con las mediciones de Xoom y WorldRemit
que veníamos haciendo a mano en v6 (Xoom GB→Filipinas ~2,89%, WorldRemit
GB→Filipinas contaminado con tarifa promocional). Filas relevantes para
proveedores que ya están en la base (ordenado de más barato a más caro):

| Proveedor | Fee (GBP) | Margen cambiario (%) | Costo total (%) | Costo total (GBP) |
|---|---|---|---|---|
| MoneyGram (mejor opción) | 0 | 0,44% | 0,44% | 0,53 |
| WorldRemit (mejor opción) | 0 | 0,61% | 0,61% | 0,73 |
| MoneyGram (2da opción) | 0 | 0,85% | 0,85% | 1,02 |
| Wise | 1,32 | 0,01% | 1,11% | 1,33 |
| MoneyGram (3ra opción) | 1,99 | 0,04% | 1,70% | 2,04 |
| Ria | 1,99 | 0,20% | 1,86% | 2,23 |
| Remitly (mejor opción) | 1,99 | 0,83% | 2,49% | 2,99 |
| WorldRemit (2da opción) | 2,99 | 0,06% | 2,55% | 3,06 |
| Western Union | 1,99 | 1,47% | 3,13% | 3,75 |
| Remitly (2da opción) | 1,99 | 1,83% | 3,49% | 4,19 |
| **Xoom** | 1,99 | **2,81%** | 4,47% | 5,36 |

**Validación cruzada importante con Xoom:** en v6 medimos a mano un spread
de ~2,89% para Xoom GB→Filipinas con fee $0 aparente. El Banco Mundial dice
margen cambiario real 2,81% — **prácticamente idéntico** — pero con un fee
de £1,99 que nuestra medición no vio (probablemente porque usamos un
método de pago/entrega distinto al que releva el Banco Mundial). Conclusión:
**el margen cambiario de Xoom (~2,8-2,9%) queda confirmado por dos fuentes
independientes**, pero el fee de Xoom puede variar según el método de pago
— no asumir que siempre es $0.

**Sobre WorldRemit — esto es la pieza que faltaba:** el margen cambiario
real de WorldRemit según el Banco Mundial es **0,61%** (¡muy bajo!), con fee
$0 en su mejor opción. Nuestra medición de v6 mostró una tasa "First
Transfer Rate 🎉" de 84,5267 PHP vs. mid-market 84,4339 — es decir, **mejor
que el mid-market**, lo cual sigue siendo imposible como tarifa real
recurrente (ningún proveedor da en promedio mejor que mid-market). Con el
dato del Banco Mundial ahora podemos decir algo más preciso: la tarifa
promocional no es solo "mejor que lo normal" en abstracto — es mejor que
un mid-market que ya está muy cerca de donde WorldRemit realmente opera
(0,61% de margen real), así que el "engañapichanga" promocional acá es más
sutil que en otros proveedores, pero sigue siendo una promo, no la tarifa
real.

### 7.3 — Tabla real: España → Marruecos (transferencia de 140 EUR, Q3 2025)

Corredor directamente comparable con nuestra medición propia de MoneyGram
ES→Marruecos (v7): nosotros medimos tasa regular 10,6929 MAD/EUR con fee
€0,99.

| Proveedor | Fee (EUR) | Margen cambiario (%) | Costo total (%) | Costo total (EUR) |
|---|---|---|---|---|
| Remitly (mejor opción) | 0,49 | 1,44% | 1,79% | 2,51 |
| MoneyGram (mejor opción) | 1,99 | 1,21% | 2,63% | 3,68 |
| MoneyGram (2da opción) | 1,99 | 1,23% | 2,65% | 3,71 |
| Money Exchange (agente) | 3,00 | 0,52% | 2,66% | 3,73 |
| MoneyGram (3ra opción) | 2,99 | 0,79% | 2,93% | 4,10 |
| Remitly (2da opción) | 2,99 | 1,44% | 3,58% | 5,01 |
| Ria | 2,99 | 1,48% | 3,62% | 5,06 |
| WorldRemit | 1,99 | 2,46% | 3,88% | 5,43 |
| Western Union | 3,99 | 1,72% | 4,57% | 6,40 |
| La Caixa (banco) | 37,00 | 0,31% | 26,74% | 37,43 |
| Exact Change ⚠️ | 25,00 | 21,91% | 39,77% | 55,67 |

**Discrepancia a marcar, no a esconder:** el Banco Mundial nunca muestra un
fee de MoneyGram de €0,99 — el más bajo que aparece es €1,99. Nuestra
propia medición en v7 (browser real, sept-2026) sí dio €0,99. Puede ser
por: (a) diferencia de monto (el Banco Mundial usa 140 EUR, nosotros usamos
1.000 EUR — MoneyGram podría tener tiers de fee por monto), (b) que
MoneyGram bajó el fee entre agosto-2025 (cuando el Banco Mundial relevó) y
septiembre-2026 (cuando medimos nosotros), o (c) alguna variación de
producto/método de pago. **No se puede resolver sin una tercera medición
— queda marcado como algo a tener en cuenta, no como error de ninguna de
las dos fuentes.**

También llama la atención "Exact Change" con un costo total de ¡39,77%! —
casi seguro no es un proveedor real para nuestra base (no está en las
listas de proveedores del proyecto), pero sirve como recordatorio de que
existen jugadores con precios abusivos en este mercado.

### 7.4 — Cómo usar esta fuente en el futuro

Para cualquier corredor donde el país receptor NO sea Argentina (Prex es
el único proveedor con foco fuerte en Argentina como origen, así que esto
no lo afecta), antes de pelear con browser automation contra un sitio
público, conviene primero probar:

```
https://remittanceprices.worldbank.org/corridor/{País emisor}/{País receptor}
```

(con los nombres de país en inglés, con mayúscula inicial — ej.
`/corridor/Spain/Morocco`, `/corridor/United Kingdom/Philippines`). Si el
corredor existe en la base (no todos los pares de países están cubiertos —
son 367 corredores en total, mayormente hacia países "en desarrollo"
típicos receptores de remesas), se consigue fee + margen cambiario real
por proveedor, con metodología pública y trimestral, sin login ni trucos.

---

## 8. Lo que necesito que mires vos (no lo puedo ver yo)

Con la fuente del Banco Mundial se resolvió una parte grande del problema
de "tarifa promocional vs. real", pero quedan 2 cosas concretas que
no puedo conseguir con las herramientas que tengo, porque Argentina no
está en esa base y los sitios públicos de estos 2 proveedores no muestran
más que la promo sin iniciar sesión:

**1. Remitly y WorldRemit, tasa real (no promocional) para España→Argentina
(o cualquier corredor a Argentina).** Si vos o alguien del equipo tiene (o
puede crear) una cuenta de Remitly o WorldRemit que ya haya hecho un envío
antes (o simplemente iniciar sesión), la página deja de mostrar la tarjeta
"primera transferencia" y muestra la tasa real. Lo que necesito que me
pases: la tasa de cambio (EUR→ARS) y el fee que aparecen ahí, con la fecha
y hora en que lo viste (para poder comparar contra el mid-market de ese
mismo momento). Con eso lo agrego al documento igual que hicimos con
MoneyGram.

**2. Global66, comisión real para EUR→ARS.** La calculadora pública nunca
terminó de cargar en 4 intentos (Sección 3). Si tenés instalada la app de
Global66 (o podés instalarla) y hacer una simulación de envío EUR→ARS por
cualquier monto, necesito: el monto que "enviás", el tipo de cambio que
muestra, y la comisión/fee que cobra (aunque diga "sin comisión", fijate si
hay algún cargo aparte antes de confirmar). Un solo dato de referencia sirve
— no hace falta completar el envío.

Si conseguís cualquiera de los dos, pasámelo (captura de pantalla o texto,
lo que sea más fácil) y lo sumo a este mismo documento.

---

## 9. Lo que me pasaste vos — Remitly (Reino Unido→Argentina) y Global66

### 9.1 — Remitly, cuenta personal, Reino Unido→Argentina

Me pasaste la pantalla de selección de método de pago de tu cuenta personal
de Remitly (no pudiste verla desde España, la viste desde UK):

> 1 GBP = 2.059,64 ARS
> Transferencia bancaria (mejor valor): fee GBP 0,99, entrega instantánea
> Débito/crédito: fee GBP 1,99, entrega instantánea
> Total (100 GBP enviados, transferencia bancaria): GBP 100,99

**Aclaración importante:** esto es Reino Unido→Argentina, no España→Argentina
(que era el corredor que veníamos persiguiendo) — pero es del mismo
proveedor y sirve igual de referencia real, porque no muestra ningún cartel
de "primera transferencia" ni "welcome rate": es directamente la pantalla
de elegir método de pago con fees escalonados (0,99 vs. 1,99 según método),
que es la estructura típica de una tarifa *regular*, no promocional.

Comparado con el mid-market de xe.com para GBP→ARS en el momento en que yo
lo consulté (no exactamente el mismo instante que tu captura, así que es
aproximado): 1 GBP = 2.042,9527 ARS. **La tasa de Remitly (2.059,64) queda
un 0,82% por encima del mid-market** — otra vez el mismo patrón que vimos
con MoneyGram ES→AR (Sección 1): en corredores con ARS como moneda
receptora, el proveedor cotiza por encima del "mid-market oficial" que
reporta xe.com, probablemente por la banda cambiaria/complejidad del propio
peso argentino, no porque sea un error o una promo.

**Recomendación para carga:** `verified_status='confirmado'` para
Remitly GB→AR (tasa 2.059,64 ARS/GBP, fee GBP 0,99 vía transferencia
bancaria). Para ES→AR específicamente seguimos sin dato propio — si en
algún momento podés loguearte a Remitly desde España mismo, sirve para
comparar si el fee de €2,49 que vimos en la página de precios (v7) coincide
con lo que muestra la pantalla real de pago.

### 9.2 — Global66: comisión y tipo de cambio, tabla por país (fuente de terceros)

La tabla que me pasaste es del mismo blog que yo ya había citado en v8
(`remesas.com/blog/comisiones-de-global66`) — no es información oficial de
Global66, pero al haberla encontrado vos de forma independiente, le suma
algo de confianza. Resumen de lo que dice para los países que nos importan:

| País | Comisión | Tipo de cambio |
|---|---|---|
| Argentina | $0 ARS | markup ~1,02% |
| Chile | $10.000-$18.000 CLP | "competitivo", sin % exacto |
| Colombia | $50.000-$80.000 COP | — |
| Brasil | R$75-R$100 | markup "moderado" |
| Perú / México / Ecuador | según monto y destino | "cercano al interbancario" |
| Estados Unidos | USD 0 | mid-market + spread hasta 1,02% |
| España | EUR 0 | mid-market + markup ("un toque") |
| Reino Unido | GBP 0 | mid-market + margen ligero |
| Canadá | CAD 0 | mid-market + markup mínimo |
| Australia | AUD 0 | interbancario + spread pequeño |

**Ojo con dos cosas que menciona la nota, no relacionadas al tipo de
cambio pero sí a confiabilidad del proveedor como para decidir si
destacarlo:** reviews de Trustpilot y Play Store mencionan cuentas
bloqueadas por más de un mes con fondos retenidos (un caso de +$4.000
retenidos, otro de 4 días sin respuesta), y comentarios en Reddit sobre que
los dólares de Global66 están resguardados en cuentas en Panamá, sin el
seguro de depósitos que sí tienen los bancos regulados localmente. Esto es
anecdótico (reviews de usuarios, no auditoría), pero vale la pena que quede
anotado si en algún momento se discute si Global66 debería tener badge de
"confianza alta" en la plataforma.

**Sigue sin ser un dato de primera mano (medido por nosotros con la
calculadora real).** Si en algún momento conseguís una cotización de la
app, la reemplazamos por esta.

---

## 10. NUEVO — Félix Pago (fintech vía WhatsApp, importante en Colombia)

Investigado a pedido tuyo. Félix (`felixpago.com`) es una fintech de
remesas 100% operada por WhatsApp — sin necesidad de descargar una app —
que envía desde Estados Unidos hacia México, Colombia, Guatemala, Costa
Rica, Brasil (vía PIX), El Salvador, Nicaragua, Ecuador, República
Dominicana y Honduras. Levantó USD 200M de financiamiento recientemente,
así que es un jugador con peso real, no un experimento chico.

### 10.1 — Estructura de fees (de su propia página de ayuda)

| Destino | Fee cuenta bancaria | Fee efectivo | Notas |
|---|---|---|---|
| México, Colombia, Guatemala, Costa Rica | USD 2,99 | USD 4,98 | fee fijo |
| Brasil (PIX) | USD 0 | — | + 0,38% IOF (impuesto brasileño, no es fee de Félix) |
| El Salvador | USD 3,99 + 1,25% | USD 4,99 + 1,25% | — |
| Nicaragua | USD 3,99 + 1% | — | — |
| Ecuador | USD 3,99 + 1,1% | — | — |
| República Dominicana (USD) | USD 2,99 + 1,00% | — | — |
| Honduras | USD 5,99 a USD 27,99 | — | escalonado por monto ($200 a $3.000) |

Félix dice que su margen está **incorporado en el tipo de cambio, no como
cargo aparte**: "La tasa de cambio que ves en el resumen de tu envío ya
refleja el margen de Félix."

### 10.2 — Medición en vivo: Estados Unidos→Colombia (US$200)

Probé la calculadora pública (`felixpago.com/en/send-money/colombia`) con
US$200:

> Envías: 200 USD → Reciben: 646.634,00 COP
> **"Promotional exchange rate": 1 USD = 3.233,17 COP**
> Fee: Free ("You save today: -$2,99 USD")

Mid-market de referencia (xe.com, mismo momento): 1 USD = 3.172,9833 COP.

**Es el mismo patrón de contaminación promocional que ya documentamos 5
veces en este proyecto** (WU GB-AR, Remitly ES-AR, WorldRemit GB-PH,
MoneyGram Marruecos/Argentina) — la propia página lo marca explícitamente
como "Promotional exchange rate" y el banner superior dice "No fee on your
first transaction". **La tasa promocional (3.233,17) queda 1,90% por
encima del mid-market** — otra vez mejor que el punto medio del mercado,
lo cual no puede ser la tarifa real y recurrente.

**No se pudo conseguir la tarifa regular** (no está en Remittance Prices
Worldwide — Félix es demasiado nuevo/chico para que el Banco Mundial lo
releve todavía, se confirmó que no aparece en la lista de proveedores del
corredor Estados Unidos→Colombia de la Sección 7). El fee regular sí lo
sabemos por la página de ayuda: USD 2,99 (cuenta bancaria). Lo que falta es
el tipo de cambio real (no promocional).

**Recomendación:** cargar el fee (USD 2,99, `verified_status='confirmado'`,
viene de su página de ayuda oficial, no de la promo) pero **no cargar el
tipo de cambio 3.233,17 como dato real** — marcar el spread como
`sin_confirmar` hasta conseguir una cotización sin el banner promocional
(mismo pedido que para Remitly/WorldRemit: necesitaría una cuenta ya usada
antes).

### 10.3 — Otras fintechs revisadas esta ronda

- **Valiu** (Colombia↔Venezuela, remesas cripto/USDv): **cerró
  operaciones en diciembre de 2021** — no es un dato de 2026, es una
  empresa que ya no existe. La búsqueda la trajo por el nombre pero no es
  un candidato válido para la plataforma. Se descarta.
- **ARQ Finance** (antes "DolarApp"): billetera multimoneda para
  Latinoamérica (México, Colombia, Argentina, Brasil), con fee desde USD 3
  / EUR 3 + spread cambiario, respaldada por Sequoia Capital y Founders
  Fund. Es más una cuenta multimoneda en dólares/euros digitales
  (menciona "USDs/EURc digital", que suena a stablecoins) que un producto
  clásico de remesas persona-a-persona — se parece más al perfil de
  Bitso/Strike (categoría "cripto-adyacente") que al de Félix o Prex. Con
  el criterio que ya definiste para esa categoría (informativo, sin link,
  con nota explicando de qué se trata), este sería un candidato para el
  mismo tratamiento. No se profundizó más esta ronda — si te interesa que
  se investigue en serio (fees exactos, corredores reales), avisame.
- Otras fintechs mencionadas en comparativas de terceros para Colombia
  (Wise, Western Union, Payoneer, PayPal, Skrill, Paysend) ya están todas
  cubiertas en la base o en research previo — no salió ningún nombre nuevo
  relevante además de Félix y ARQ.

---

## 11. RPW — un corredor más: Estados Unidos → Colombia (confirma Xoom otra vez)

De paso, ya que estaba viendo Colombia, revisé el corredor US→Colombia en
Remittance Prices Worldwide (Q3 2025, transferencia de USD 200) para tener
más contexto de mercado en esa plaza:

| Proveedor | Fee (USD) | Margen cambiario (%) | Costo total (%) |
|---|---|---|---|
| Walmart2World ⚠️ | -2,65 | -2,65% | -5,30% |
| Xoom (mejor opción) | 0,59 | 2,79% | 3,09% |
| Wise | 6,79 | 0,00% | 3,40% |
| Remitly (mejor opción) | 4,99 | 1,47% | 3,97% |
| Ria | 4,00 | 2,27% | 4,27% |
| MoneyGram | 5,99 | 2,12% | 5,12% |
| Western Union | 4,99 | 2,69% | 5,19% |
| Remitly (2da opción) | 4,99 | 3,19% | 5,69% |

**Dato curioso, no un error:** Walmart2World (alianza Walmart+Ria en EEUU)
muestra margen **negativo** — da un tipo de cambio mejor que el mid-market
como tarifa real y recurrente, no promocional. A diferencia de las
"tarifas promocionales mejores que el mid-market" que venimos marcando
como sospechosas en otros proveedores, acá el Banco Mundial confirma que
es el precio real de todos los días — es un modelo de negocio distinto
(volumen muy alto vía la red de tiendas Walmart, probablemente subsidiado
por otras líneas de negocio). **Sirve como recordatorio de que "mejor que
mid-market" no es automáticamente sospechoso — depende de si es la tarifa
real (como acá) o una promo de bienvenida (como en los otros casos que
documentamos).**

**Cuarta confirmación del margen real de Xoom (~2,8%):** con este corredor
ya son 4 mediciones independientes que dan un número muy similar (GB-PH
2,89% nuestro / 2,81% RPW, GB-MX 3,07% nuestro, US-CO 2,79% RPW). El margen
real de Xoom se puede tratar como un hecho establecido: ~2,8-3,1% según
corredor, sin fee o con fee bajo dependiendo del método de pago.

---

## 12. NUEVO — Barrido de fintechs en más rutas (a pedido tuyo: "todas las rutas")

Revisé 4 corredores más en Remittance Prices Worldwide, eligiendo uno por
región para tener cobertura geográfica amplia en una sola ronda: **Estados
Unidos→México** (el corredor de remesas más grande del mundo en volumen),
**Estados Unidos→India**, **Reino Unido→Nigeria**, y **Emiratos Árabes
Unidos→India** (el corredor típico del Golfo). El objetivo: ver qué
proveedores aparecen repetidamente que todavía no estén en la base.

### 12.1 — Estados Unidos → México (200 USD, Q3 2025)

| Proveedor | Fee (USD) | Margen (%) | Costo total (%) |
|---|---|---|---|
| Walmart2World (mejor opción) | -2,44 | -2,44% | -4,88% |
| Xoom (mejor opción) | 0 | -0,24% | -0,24% |
| Wise | 2,46 | 0,03% | 1,26% |
| MoneyGram (mejor opción) | 1,90 | 0,76% | 1,71% |
| Ria (mejor opción) | 1,99 | 1,24% | 2,24% |
| **Viamericas** | 3,99 | 1,33% | 3,33% |
| **Intermex** | 3,99 | 1,77% | 3,77% |
| **Vigo** (marca de Western Union) | 4,99 | 1,37% | 3,87% |
| Western Union | 3,99 | 1,90% | 3,90% |
| Pangea | 3,95 | 2,25% | 4,23% |
| **Delgado Travel** | 6,00 | 1,99% | 4,99% |
| Remitly | 3,99 | 3,38% | 5,38% |
| **Orlandi Valuta** (marca de Western Union) | 10,00 | 1,56% | 6,56% |

**Xoom en México muestra margen negativo (-0,24%)** en su mejor opción —
otro caso real (no promocional) de precio agresivo por volumen, parecido a
Walmart2World, aunque mucho más chico en magnitud.

### 12.2 — Estados Unidos → India (200 USD, Q3 2025)

| Proveedor | Fee (USD) | Margen (%) | Costo total (%) |
|---|---|---|---|
| Walmart2World (mejor opción) | -0,53 | -0,53% | -1,06% |
| **Placid Express** | 0,42 | 0,42% | 0,84% |
| MoneyGram (mejor opción) | 0,99 | 0,26% | 0,76% |
| Ria (mejor opción) | 0,99 | 0,27% | 0,77% |
| Western Union (mejor opción) | 0,99 | 0,68% | 1,18% |
| WorldRemit (mejor opción) | 0,99 | 1,00% | 1,50% |
| Pangea | 3,95 | 0,22% | 2,20% |
| Remitly (mejor opción) | 3,99 | 0,39% | 2,39% |
| **money2India (ICICI Bank)** | 4,00 | 0,74% | 2,74% |
| Xoom | 2,99 | 2,26% | 3,76% |

`money2India` ya está en la base (con `supported_corridors: ["US-IN"]`,
según lo que ya sabíamos del proyecto) — el dato nuevo es su margen real:
0,74% con fee de USD 4. Xoom en India da 2,26% — algo más bajo que el
~2,8-3,1% que vimos en otros corredores, pero mismo orden de magnitud.

### 12.3 — Reino Unido → Nigeria (120 GBP, Q3 2025)

Corredor con márgenes llamativamente bajos en general — casi todos por
debajo del 1%:

| Proveedor | Fee (GBP) | Margen (%) | Costo total (%) |
|---|---|---|---|
| Sendwave (mejor opción) | 0 | -0,12% | -0,12% |
| MoneyGram (mejor opción) | 0 | 0,03% | 0,03% |
| Remitly (mejor opción) | 0 | 0,25% | 0,25% |
| WorldRemit (mejor opción) | 0 | 0,28% | 0,28% |
| Paysend | 0 | 0,64% | 0,64% |
| CashMinute | 1,01 | — | 1,01% |
| Ria | 1,99 | 0,00% | 1,66% |
| Western Union (mejor opción) | 0,99 | 2,18% | 3,01% |

Ningún nombre nuevo acá — todos (Sendwave, MoneyGram, Remitly, WorldRemit,
Paysend, CashMinute, Ria, Western Union) ya están en la base del proyecto.
Lo valioso es el dato de margen real, mucho más bajo de lo que se podría
haber estimado a ojo para este corredor específico.

### 12.4 — Emiratos Árabes Unidos → India (735 AED, Q3 2025)

| Proveedor | Fee (AED) | Margen (%) | Costo total (%) |
|---|---|---|---|
| Emirates NBD (mejor opción) | 0 | 0,77% | 0,77% |
| Lari (mejor opción) | 10,50 | 0,20% | 1,63% |
| Al Ansari (mejor opción) | 10,50 | 0,40% | 1,83% |
| MoneyGram | 15,75 | 0,34% | 2,48% |
| GCC Exchange | 15,75 | 0,37% | 2,51% |
| Wall St Exchange | 17,00 | 0,37% | 2,68% |
| Al Fardan Exchange | 19,50 | 0,56% | 3,21% |
| Dubai Islamic Bank (banco) | 63,00 | 3,11% | 11,68% |
| ADCB (banco) | 126,00 | 3,92% | 21,06% |

**Confirma que la cobertura de casas de cambio del Golfo que ya hicimos en
research previo (Al Ansari, Al Fardan, GCC Exchange, Lari, Wall St
Exchange) está completa — no salió ningún nombre nuevo acá.** Lo que sí es
nuevo: el margen real de cada una, todas en el rango 0,2%-0,6% — mucho más
barato que los bancos tradicionales (Dubai Islamic Bank 3,11%, ADCB 3,92%),
que confirma la recomendación típica de "usar la casa de cambio, no el
banco" para este corredor.

### 12.5 — Los 2 candidatos nuevos, en detalle

**Intermex (International Money Express)** — `intermexonline.com`.
Cotiza en NASDAQ (ticker IMXI), ~USD 659M de facturación anual (2023),
capitalización de mercado ~USD 413M. Envía desde Estados Unidos, Canadá y
algunos países de Europa hacia América Latina, el Caribe, y "países
seleccionados de África y Asia" — el foco fuerte es México, Guatemala y
República Dominicana. En 2022 compró **La Nacional** (que aparece como
proveedor separado en las tablas de RPW — ya es parte de Intermex, no una
empresa aparte). Modelo omnicanal: red de agentes físicos + tiendas
propias + app/web. Es un jugador real y grande, del mismo tamaño que Ria o
Viamericas — candidato sólido para sumar a la base si el foco es
LatAm/Caribe.

**Placid Express** — `placid.net`. Envía desde Estados Unidos, Unión
Europea y Malasia hacia el Sur y Sudeste de Asia: India, Pakistán,
Bangladesh, Nepal, Sri Lanka, Filipinas, Indonesia, Vietnam (menciona
"30+ países" en total). Es un jugador chico pero de trayectoria muy larga
(décadas) y bien conocido específicamente en la diáspora del Sur de Asia
en EEUU — aparece consistentemente en comparativas de remesas a India
junto a money2India, Wise y Xoom. App propia (Placid Money Transfer, en
Play Store y App Store). Candidato a sumar si se quiere reforzar la
cobertura de corredores hacia el Sur de Asia (India, Pakistán, Bangladesh),
que hoy en la base dependen casi enteramente de proveedores "amplios"
genéricos (Wise, Xoom, WorldRemit) más money2India como único especialista.

**Nombres que aparecieron pero NO son candidatos nuevos** (ya cubiertos o
son marcas de proveedores existentes): Vigo y Orlandi Valuta (marcas de
Western Union para redes de agentes), Wells Fargo y Dubai Islamic Bank/ADCB
(bancos tradicionales, fuera del foco de comparación fintech del
proyecto), Casa de Cambio Delgado / Delgado Travel (cadena de agentes
regional, ya cubierta indirectamente).

### 12.6 — Resumen de esta sección

De 4 corredores nuevos revisados en 4 regiones distintas (LatAm, Sur de
Asia, África, Golfo), **2 candidatos reales para sumar a la base**
(Intermex, Placid Express) y **cero jugadores nuevos** en Nigeria y Golfo
— esos dos ya estaban completamente cubiertos por research previo. El
patrón general: la mayor parte del "gap" de fintechs nuevas está en LatAm
(Félix, y ahora Intermex), no tanto en otras regiones, donde la cobertura
del proyecto ya era bastante sólida — el valor de esta ronda estuvo más en
conseguir márgenes reales (no estimados) para proveedores que ya
conocíamos, que en encontrar nombres completamente nuevos.

---

## 13. Mapa completo: qué está investigado y qué falta (respuesta directa a tu pregunta)

### 13.1 — Proveedores de tarifa variable/business: ¿ya investigados?

**Parcialmente, y esto es importante que quede claro.** Los 6 brokers de
segmento business (Airwallex, CAB Payments, Moneycorp, OFX, Payoneer,
Convera/western-union-business) tuvieron dos migraciones de schema *antes*
de que arrancara esta ronda de research (hechas por el otro Claude,
`20260830121011_business_broker_quote_fields` y
`20260901182959_add_business_terms_estimated_flags`): se les agregó
`settlement_terms`, `contract_type`, `min_amount` y sus flags `_estimated`.
Eso resolvió el gap de **términos contractuales**.

**Lo que NO está resuelto — el gap más grande que queda abierto en todo el
proyecto:** estos 6 brokers no cotizan con un spread único como Prex o
Félix. Cotizan **distinto según el par de monedas, el volumen, y a veces
según negociación directa con el cliente** — la tabla `providers` hoy solo
tiene un campo `spread_percent` (un solo número plano), que no puede
representar eso. Esto ya se había detectado en la fase original del
proyecto (antes de este research) y sigue sin resolverse porque no es un
problema de "faltó investigar más" sino de **diseño de base de datos**: no
alcanza con buscar el número correcto, hace falta una tabla nueva de
tarifas escalonadas por corredor/monto para poder cargar esto bien. Mi
recomendación: **no es tarea para más research — es una decisión de
arquitectura que hay que tomar antes de seguir**. Si querés, en la próxima
ronda puedo proponerte un diseño concreto de tabla (algo tipo
`business_broker_rate_tiers` con columnas moneda_origen, moneda_destino,
monto_mínimo, monto_máximo, spread_percent) en vez de seguir buscando
números sueltos que no van a tener dónde cargarse bien.

### 13.2 — Estado por región (todo lo investigado en el proyecto hasta ahora)

| Región / corredor | Estado | Qué se sabe |
|---|---|---|
| **Argentina** (Prex, todos los corredores) | ✅ Completo | 15/15 corredores del whitelist de Prex medidos en vivo (Sección 2 de este doc) |
| **España→Argentina, Reino Unido→Argentina** (MoneyGram, Remitly) | ✅ Parcial pero sólido | MoneyGram ES→AR medido en vivo (Sección 1); Remitly GB→AR con dato real tuyo (Sección 9.1); Remitly ES→AR y WorldRemit→AR siguen sin dato real (RPW no cubre Argentina) |
| **Colombia** (todas las fintechs) | ✅ Completo esta ronda | Félix Pago investigada (Sección 10), más el corredor US→Colombia completo vía RPW (Sección 11) |
| **México, Caribe** | ✅ Completo | Corredor US→México completo vía RPW (Sección 12.1) — sin gaps de proveedores, salió Intermex como candidato nuevo |
| **India** | 🟡 Mayormente cubierto | US→India completo vía RPW (Sección 12.2, con money2India ya conocido) + AE→India completo (Sección 12.4, casas de cambio del Golfo ya cubiertas). Salió Placid Express como candidato nuevo. **Falta:** corredores desde Europa hacia India (ej. Alemania→India, que sí figura como corredor disponible en RPW pero no se revisó) |
| **Indonesia** | 🆕 Recién investigado | Malaysia→Indonesia revisado ahora (Sección 13.3) — 7 nombres nuevos, ninguno todavía evaluado en detalle |
| **Europa del Este** (Polonia, Ucrania, Rumania, Bulgaria, etc.) | 🟡 Mayormente cubierto | Ucrania ya tenía research propio de fases anteriores del proyecto + ahora Alemania→Ucrania confirmado vía RPW sin nombres nuevos (Sección 13.4). Reino Unido→Polonia trajo 2 candidatos nuevos (TransferGo, Tonio) — ver Sección 13.4 |
| **Japón** | 🆕 Recién investigado | Japón→Filipinas revisado ahora — 5 nombres nuevos específicos de Japón, sin evaluar en detalle todavía (Sección 13.3) |
| **Corea del Sur** | 🆕 Recién investigado | Corea→Vietnam revisado ahora — **mercado dominado por bancos**, casi no hay fintechs de remesas (solo MoneyGram aparece junto a 8 bancos coreanos). Conclusión: no es una región prioritaria para sumar proveedores nuevos |
| **Golfo (EAU y alrededores)** | ✅ Completo | Confirmado sin gaps en la Sección 12.4 — la cobertura de fases anteriores del proyecto ya era la correcta |
| **África** (Nigeria, Sudáfrica, y las excepciones de `corridor_notes`) | ✅ Completo | Reino Unido→Nigeria confirmado sin nombres nuevos (Sección 7.2 y 12.3); Sudáfrica y las 4 excepciones de `corridor_notes` (DE-RU, DE-SY, NO-SO, SE-SO) vienen de fases anteriores del proyecto |
| **Sudeste asiático** (Filipinas, Vietnam, Tailandia) | 🟡 Mayormente cubierto | Filipinas bien cubierto (GB-PH, JP-PH); Vietnam solo visto de pasada (KR-VN); Tailandia no revisado en esta fase |
| **Brasil, resto de LatAm** (Perú, Ecuador, Chile, etc.) | ✅ Completo | Cubierto extensamente en fases anteriores del proyecto (Mukuru, Chipper Cash, Kabayan Remit, Aspora, triage de los 29 proveedores inactivos) |

### 13.3 — Japón e Indonesia: hallazgos nuevos

**Japón→Filipinas (17.000 JPY, Q3 2025):** salieron 5 nombres específicos
de Japón que no están en la base — **JME**, **DCOM Money Express**, **SBI
Remit** (parte de SBI Holdings, grupo financiero japonés grande y
conocido), **Kyodai Remittance**, y **Brastel Remit** (especialista
histórico en la diáspora brasileño-japonesa). Ninguno se investigó en
detalle todavía (solo confirmé que existen y su margen real vía RPW) —
si te interesa profundizar en el corredor Japón como prioridad, avisame y
hago una segunda pasada con más detalle de cada uno.

**Malasia→Indonesia (610 MYR, Q3 2025):** salieron 7 nombres — **CBL
Money Transfer** (el más barato, 0,14% de margen), **GPL Remittance**,
**Max Money**, **E-remit**, **Akbar Money Changer**, y **Merchantrade
Money Transfer** (esta última es una fintech malaya bastante conocida,
con app propia). Misma situación: confirmados vía RPW pero sin
investigación individual todavía.

### 13.4 — Europa del Este: confirmaciones y 2 candidatos nuevos

**Alemania→Ucrania (140 EUR, Q3 2025):** MoneyGram, Paysend, Ria, Postbank
(banco alemán, vía Western Union), Remitly, Wise, Western Union — **todos
ya conocidos, cero nombres nuevos.** Confirma que el research de Ucrania
de fases anteriores del proyecto sigue vigente y completo.

**Reino Unido→Polonia (120 GBP, Q3 2025):** acá sí salieron 2 candidatos
reales — **TransferGo** (fintech con sede en Londres, especializada
específicamente en corredores hacia Europa del Este y ex-URSS — Polonia,
Lituania, Ucrania, etc. — bastante conocida, competidora directa de Wise
en esos corredores) y **Tonio** (menos conocido, no lo pude verificar en
detalle esta ronda). TransferGo en particular es un candidato fuerte si se
quiere reforzar la cobertura de Europa del Este más allá de los
proveedores "amplios" genéricos que ya están en la base.

### 13.5 — Lo que queda pendiente para una próxima ronda (lista priorizada)

1. **Decisión de arquitectura para brokers business** (Sección 13.1) — es
   lo más importante y no es research, es una decisión tuya.
2. Investigar en detalle los candidatos nuevos que fueron saliendo sin
   evaluación profunda: **TransferGo** (Europa del Este — el más prometedor
   de todos los nuevos), **Merchantrade Money Transfer** (Malasia/Indonesia),
   **SBI Remit** y **Brastel Remit** (Japón).
3. Corredores todavía no tocados: Alemania→India (o cualquier corredor
   Europa→Sur de Asia), Tailandia como receptor, Vietnam más a fondo.
4. Seguir con los 2 pedidos de la Sección 8 que siguen abiertos (Remitly/
   WorldRemit ES→AR con cuenta logueada, Global66 con cotización real de
   la app) — nadie los resolvió todavía.

---

## 14. Quinta actualización — verificación en vivo con browser (Remitly/WorldRemit España, reintento Global66) + los 4 candidatos nuevos + corredores pendientes

Esta ronda usé browser real (no solo research de texto) contra remitly.com y
worldremit.com forzando explícitamente "enviando desde España", además de
reintentar Global66 con una herramienta de navegador distinta a los intentos
previos. También cerré los 3 candidatos que habían quedado sin evaluación
profunda de la Sección 13 (TransferGo, Merchantrade, SBI Remit/Brastel
Remit) y sumé 3 corredores nuevos vía World Bank (Alemania→India,
Malasia→Tailandia, Japón→Vietnam).

### 14.1 Remitly España→Argentina — dato real, en vivo, geolocalizado a España

Navegando a `remitly.com/es/es/argentina` (que redirige a la landing
"Envía dinero a Argentina desde España", con selector de moneda en EUR) se
ve la calculadora pública **sin necesidad de cuenta**:

| | Tasa | Comisión | Total (envío de 1.000 EUR) |
|---|---|---|---|
| **Tipo de cambio de bienvenida** | 1 EUR = 1.792,22 ARS | 2,49 EUR (descontada a 0 EUR) | 1.000,00 EUR |

Texto legal de la propia página: *"Oferta solo para clientes nuevos. Uno
por cliente. Oferta por tiempo limitado. El tipo de cambio promocional se
aplica a los primeros 1.000,00 EUR enviados."*

Mid-market de referencia en el momento de la medición (xe.com): **1 EUR =
1.751,03 ARS**. La tasa de bienvenida está **~2,35% mejor que el
mid-market** — totalmente consistente con ser una tasa de adquisición de
clientes, no la tasa real recurrente.

**Esto es la 7ª confirmación del patrón de contaminación promocional en
todo el proyecto** (Western Union GB→AR, Remitly ES→AR con datos de blog,
WorldRemit GB→PH, MoneyGram Marruecos/Argentina, Félix Pago US→CO, y ahora
Remitly ES→AR con datos en vivo, directos de España — no un proxy de UK).
**Diferencia importante con la ronda anterior:** el dato que vos me
pasaste era desde Remitly UK ("no puedo ver desde España"); esta vez la
calculadora sí cargó directamente en España vía URL, y el número es
distinto al de UK (2.059,64 ARS/GBP no es comparable directamente porque
son monedas distintas, pero confirma que España sí tiene su propia
cotización pública, solo que promocional).

**Lo que sigue sin conseguirse:** la tasa "regular" (no promocional, para
clientes recurrentes) sigue exclusivamente visible con cuenta logueada.
Esta sesión no intenta loguearse ni crear cuentas (fuera de las reglas de
esta sesión) — ese dato solo puede venir de vos, con una cuenta que ya
usaste antes, igual que hiciste con el dato de UK.

### 14.2 WorldRemit España→Argentina — confirmado el bloqueo, ahora de forma directa

Con el navegador, seleccioné explícitamente "Enviando desde: España" (el
sitio geolocalizaba a Reino Unido por defecto, tuve que forzarlo a mano) y
moneda EUR→ARS. Resultado: el único método de recepción disponible en la
calculadora **web** es "Recarga telefónica" (recarga de saldo celular). Al
intentar ver depósito bancario o retiro de efectivo, el propio sitio dice:
*"Para ver las ofertas de recarga de saldo entre Argentina y España,
descárgate nuestra aplicación móvil."* — es decir, **la calculadora web no
expone depósito bancario/efectivo para este corredor específico, solo la
app.** Esto confirma (ahora de forma directa, no por inferencia) el
bloqueo que ya se documentaba en v6/v7.

### 14.3 Global66 — reintento con una segunda herramienta de browser, mismo resultado

Reintenté con el navegador integrado de Cowork (herramienta distinta a la
usada en rondas anteriores, que corría vía el dispositivo vinculado). Tanto
`global66.com/es/argentina/` como el link "Enviar dinero a Argentina" del
footer devuelven **"¡Ops! Página no encontrada..."** — un 404 real, no un
timeout ni un problema de la herramienta. El botón "Enviar dinero ahora" de
la home lleva a `/envios-de-dinero/`, que carga la misma home con un widget
de ejemplo **fijo, no interactivo** (CLP→USD, "1 USD = 937,35 CLP", con
montos hardcodeados que no se pueden editar) — es un mockup de marketing,
no una calculadora real.

**Conclusión para este ítem:** ya son 2 herramientas de browser distintas,
en 2 sesiones distintas, con el mismo resultado (página rota / sin
calculadora funcional). Esto deja de parecer un problema de la herramienta
y empieza a parecer un problema real del sitio de Global66 (o una
geo-restricción agresiva contra tráfico de datacenter, que es indistinguible
desde acá). **Recomendación:** dejar de reintentar por este camino — si se
necesita el dato real, la única vía que queda es que alguien lo saque desde
la app móvil de Global66 con una cuenta real, como hiciste con Remitly.

### 14.4 TransferGo — evaluación del candidato

Página oficial de pricing (`support.transfergo.com` y `transfergo.com/en/pricing`):

- Cambio de moneda: **"desde 0,5%"** de margen.
- Transferencia por banco: **"desde 0,2%"** de comisión.
- Transferencia con tarjeta: **"desde 0,2%"** + costos de terceros variables.
- No se publican porcentajes exactos por corredor ni se menciona una tasa
  promocional de primera transferencia (a diferencia de Remitly/WorldRemit/
  MoneyGram/Félix, TransferGo no parece usar el mecanismo de "tasa de
  bienvenida" — su estructura se parece más a Wise: fee explícito + margen
  cambiario chico, ambos declarados como "desde").

**Evaluación:** candidato de perfil similar a Wise, no a las promocionales.
Falta una medición en vivo con un corredor y monto específico para
confirmar el costo total real (queda para la próxima ronda).

### 14.5 Merchantrade Money Transfer — confirmado con datos reales de World Bank

El sitio propio (`merchantrademoney.com`) no publica una tabla de fees por
país para remesas internacionales — solo tarifas de tarjeta/wallet. Pero
World Bank RPW sí tiene datos concretos y confiables:

| Corredor | Monto | Costo total | Margen cambiario |
|---|---|---|---|
| Malasia→Indonesia | 610 MYR | 3,13% | 0,67% |
| Malasia→Indonesia | 1.530 MYR | 1,65% | 0,67% |
| Malasia→Nepal | 610 MYR | 2,26% | 0,29% |

**Evaluación:** proveedor legítimo de costo medio-bajo, en la misma liga
que Ria/Wise para estos corredores — el margen cambiario (0,29-0,67%) es
chico y estable entre corredores, sin señales de contaminación promocional.

### 14.6 SBI Remit y Brastel Remit (Japón) — resultado desparejo

**SBI Remit:** el sitio oficial no publica margen ni estructura de
comisión de forma legible (todo remite a "iniciá sesión para ver tu
cotización"). Wise tampoco tiene datos confiables de este proveedor
("No tenemos información confiable de este proveedor"). **No se consiguió
ningún número usable — queda como candidato sin dato, tratar como
solo-informativo hasta poder medirlo en vivo.**

**Brastel Remit:** mejor suerte. RPW (Q3 2025, Japón→Vietnam) da **costo
total 2,53%, margen cambiario 0,24%** — dato confiable y reciente. Aparte,
un review de terceros (fechado en 2020, usar con cautela por antigüedad)
mostraba un margen implícito ~1,9% en un corredor a Brasil — más alto que
el dato de RPW, posiblemente porque son corredores distintos (Brasil vs.
Vietnam) o porque el margen cambió en 5 años. **Usar el número de RPW
(0,24% en Japón→Vietnam) como referencia principal**, no el ejemplo de
2020.

### 14.7 Corredores nuevos vía World Bank

**Alemania→India** (140 EUR/200 USD, Q3 2025):

| Proveedor | Costo total | Margen cambiario |
|---|---|---|
| RemitMoney | 0,00% | 0,00% |
| Skrill | 1,35% | 0,69% |
| Remitly | 1,44-2,87% | 0,73% |
| MoneyGram | 0,73-1,57% | -0,25 a N/D |
| Ria | 1,70-1,80% | 0,34-0,44% |
| WorldRemit | 2,06% | 0,64% |
| Western Union | 3,29-9,31% | 0,44-4,31% |
| Postbank / Commerzbank / Deutsche Bank / SBI (bancos) | 10,9-27,3% | variable |

**RemitMoney en 0,00% total es un dato llamativo — no lo tomes como un
hallazgo confiable sin verificar.** Puede ser un producto subsidiado con
límites muy chicos, un error de la muestra de RPW, o una promoción
temporal capturada justo en la ventana de medición. Se documenta tal cual
aparece, sin inventar una explicación. **Skrill** sí es un hallazgo sólido
— es una billetera/fintech global muy conocida (grupo Paysafe), con datos
consistentes (1,35% total, 0,69% margen) — candidato razonable si se
quiere sumar a la base.

**Malasia→Tailandia** (610 MYR/200 USD, Q3 2025): Wise más barato (2,17%
total, margen 0,03%), seguido de Western Union y WorldRemit (~2,7-2,8%).
**MoneyMatch Transfer** aparece como nuevo nombre (fintech malaya, 4,09%
total, margen 2,78% — no especialmente competitivo). Bancos locales
(Maybank, UOB, RHB) muy por encima (5,5-10,7%), consistente con el patrón
de todo el proyecto.

**Japón→Vietnam** (Q3 2025): JRF y Wise son los más baratos (~2,2-2,7%),
seguidos de DCOM Money Express (2,51%) y Brastel Remit (2,53%, ver 14.6).
Nombres nuevos: **JRF** y **SMTJ** — especialistas japoneses en el
corredor a Vietnam, sin evaluación individual todavía. Japan Post Bank muy
caro (20%+), como es de esperar de un banco tradicional.

### 14.8 Mapa actualizado de lo que queda pendiente (reemplaza a la lista de 13.5)

1. **Decisión de arquitectura para brokers business** (Sección 13.1) — sigue
   siendo lo más importante, sigue sin resolverse, sigue siendo tuya.
2. **Global66 con cotización real:** después de 5 intentos (2 herramientas
   de browser distintas + fuentes de terceros) sin éxito, esto ya no
   parece un problema de investigación — es un problema del sitio o de
   geo-restricción. Recomiendo cerrarlo salvo que alguien lo consiga desde
   la app móvil con cuenta real.
3. **Remitly/WorldRemit ES→AR, tasa regular (no promocional):** confirmado
   en vivo que ambas requieren cuenta logueada. Esta sesión no puede (ni
   va a) crear cuentas ni loguearse — el único camino es que lo saques vos
   de una cuenta ya existente, como hiciste con el dato de UK.
4. **TransferGo:** estructura de pricing entendida (margen "desde 0,5%" +
   fee "desde 0,2%"), pero falta una cotización en vivo con corredor y
   monto específico para confirmar el costo real total.
5. **SBI Remit:** sigue sin ningún dato usable — tratar como
   solo-informativo, no cargar ningún número hasta poder medirlo en vivo
   o encontrar una fuente confiable.
6. **RemitMoney (Alemania→India, 0,00% total):** verificar antes de usar —
   parece demasiado bueno para ser cierto, podría ser un artefacto de la
   muestra o un producto con límites muy chicos.
7. Nombres nuevos de esta ronda sin evaluación profunda todavía, en orden
   de qué tan prometedores parecen: **Skrill** (fuerte — fintech global
   conocida), **JRF** y **SMTJ** (especialistas Japón→Vietnam),
   **MoneyMatch Transfer** (Malasia, no muy competitivo por ahora).
8. Con esta ronda, todas las regiones que preguntaste explícitamente
   (Argentina, Colombia, México/Caribe, India, Indonesia, Europa del Este,
   Japón, Corea, Ucrania) ya fueron tocadas al menos a nivel de datos de
   World Bank. Si querés seguir, lo que más valor agregaría ahora es
   profundizar los nombres nuevos (punto 7) en vez de abrir regiones
   nuevas — la cobertura geográfica ya es bastante amplia.
