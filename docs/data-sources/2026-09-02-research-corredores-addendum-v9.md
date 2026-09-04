# mangomundi — Research, ADDENDUM #3 (v9) — brokers business, TransferGo/Skrill en vivo, corredores nuevos

> **Nota de estado (añadida 2-sep-2026, al exportar este research a
> Supabase):**
> - **TransferGo, Reino Unido→Polonia** (Sección 9.1): **cargado a
>   `fx_rates`** (migración `load_transfergo_instarem_corridor_rates_research_v9`)
>   — rate 5,03 PLN/GBP, fee 0, `verified_status='confirmado_activo'`. Es
>   la primera fila corridor-specific de TransferGo (antes solo tenía el
>   `spread_percent` genérico plano de `providers`).
> - **TransferGo, Alemania→Ucrania** (Sección 8.2): **cargado**, pero como
>   `sin_confirmar` — es una medición real (margen 1,84%), no inventada,
>   pero el propio addendum advierte que es 5 veces más alto que el
>   corredor UK→Polonia medido el mismo día, así que se marca explícitamente
>   como no representativo del resto de los corredores de TransferGo (ver
>   la nota de la fila en `data_source`).
> - **InstaReM, Reino Unido→India** (Sección 10.3): **cargado a
>   `fx_rates`** — rate 127,828 INR/GBP, fee 0, `verified_status=
>   'confirmado_activo'`. Es la tasa **regular** (no la promocional de
>   bienvenida que esta ronda descubrió que InstaReM también tiene).
> - **Skrill — hallazgo importante, NO cargado a `fx_rates`.** El
>   `spread_percent` genérico ya cargado en `providers` (4,5%) casi
>   seguro representa el producto equivocado: la billetera general de
>   Skrill (hasta 4,99% de markup), no `transfers.skrill.com` (el producto
>   de remesas real, con margen 0,69% según World Bank — Sección 3.2,
>   reconfirmado por 6 fuentes independientes en total a lo largo de v8 y
>   v9). No se corrigió el `spread_percent` genérico de `providers` porque
>   cambiarlo de 4,5% a ~0,69% es un cambio de pricing grande que afecta
>   TODOS los corredores de Skrill, no solo uno — decisión para el usuario,
>   no algo para cambiar unilateralmente. Tampoco se cargó una fila
>   corridor-specific (Alemania→India) porque no hay un monto de fee en
>   moneda real citado en ninguna de las dos rondas de research, solo el
>   margen (0,69%) y el costo total (1,35%) — cargar un fee inventado para
>   despejar la diferencia habría sido fabricar un dato. **Queda como
>   decisión abierta**, ver Sección 3.2 de este documento.
> - **CAB Payments** (Sección 9.4): **NO cargado.** Los take rates reales
>   de su reporte financiero (0,07% G10 / 0,31% mercados emergentes) son
>   el margen que gana como proveedor **mayorista/institucional**, casi
>   seguro no comparable al costo que pagaría un usuario final — el propio
>   addendum pide explícitamente no cargarlo como `spread_percent`
>   consumer-facing. El `spread_percent` genérico ya cargado (0,6%) se deja
>   sin tocar.
> - **MoneyGram Rumania→Moldavia** (Sección 9.2): **NO cargado.** La única
>   cotización conseguida es promocional ("sin comisión para clientes
>   nuevos") y además resultó ~4,65% peor que mid-market — ni siquiera es
>   una promo atractiva, y de todos modos la regla del proyecto es no
>   cargar tarifas promocionales como estándar. La tasa regular sigue sin
>   poder conseguirse sin cuenta (cerrado definitivamente, ver Secciones
>   10.2, 11.2 y 12.3).
> - **Ria — discrepancia detectada, documentada, NO sobrescrita.** Los 3
>   corredores que esta ronda midió vía World Bank (Sección 11.1) ya
>   existían en `fx_rates` con otros números: Estados Unidos→México (v9:
>   1,24% vs. la fila ya cargada: 1,8%) y España→Colombia (v9: 1,44% vs.
>   la fila ya cargada: 0%) no coinciden; Estados Unidos→Nigeria sí
>   coincide casi exacto (v9: 0,76-1,00% vs. la fila ya cargada: 0,76%).
>   Ninguna fila existente se tocó — ambas fuentes dicen ser "World Bank
>   RPW Q3 2025", así que la discrepancia probablemente viene de que RPW
>   suele listar varias filas/métodos por corredor y cada research pudo
>   haber tomado una fila distinta de esa misma tabla, no un error de
>   ninguna de las dos mediciones. Se documenta acá en vez de reconciliar
>   a ciegas.
> - **RemitBee, SBI Remit, Global66 (2% estimado), Metro Remittance, PNB
>   Global Remit, Sikhona Money Transfers:** **ninguno se agregó a
>   `providers`.** Son candidatos o estimaciones de esta ronda (research
>   v9 los marca explícitamente como "evaluar antes de sumarlos" o
>   "sin confirmar"), documentados como informativos más abajo — decisión
>   de catálogo pendiente del usuario, no tomada unilateralmente acá.
> - **Xoom:** **sin cambios en `fx_rates`.** El addendum advierte no
>   extrapolar el margen de un corredor de Xoom a otros — pero todas las
>   filas de Xoom ya cargadas en la base son mediciones directas
>   corredor por corredor (CA-IN, CA-PH, GB-IN ×3, GB-MX, GB-PH, US-IN,
>   US-PH, US-VN), nunca un solo número extrapolado a todos — así que la
>   recomendación de este addendum ya se cumple en la práctica, sin
>   necesidad de tocar nada.
> - **Payoneer, OFX, Airwallex** (Sección 2, brokers business): los
>   valores ya cargados en `providers.spread_percent` (0,5% / 0,6% / 0,5%)
>   ya coinciden con lo que esta ronda confirma como públicamente citable
>   — sin cambios. **Moneycorp, Convera, CAB Payments confirmados sin
>   ningún rango público** — refuerza (no cambia) la decisión de
>   arquitectura `business_broker_rate_tiers` ya implementada este mismo
>   día (ver `docs/data-sources/2026-09-02-research-corredores-addendum-v8.md`).
> - **Azimo:** ya está `active=false` con nota explicando la adquisición
>   por Papaya — no silencioso, el pedido de la Sección 1.1 ya está
>   efectivamente cumplido, sin cambios necesarios.
> - **Zing (HSBC):** la sugerencia de reclasificar de Tipo A a Tipo B
>   (Sección 1.1) es una decisión de modelado de datos, no un hecho para
>   cargar — queda abierta para el usuario, sin cambios en `providers`.

> **Documento nuevo, no reemplaza a v6, v7, v8 ni a `research-findings-2026-09-01.md`.**
> Los 4 ya los subiste al otro Claude para cargar — este es un quinto
> archivo con **solo lo nuevo de esta ronda**, para no reabrir ni reeditar
> nada de lo que ya entregaste. Para tener el panorama completo hacen falta
> los 5 juntos.
>
> **Actualizado el mismo día, seis veces.** Primera versión: Secciones 1-7
> (análisis consolidado de gaps, transparencia de brokers business,
> TransferGo/Skrill en vivo, RemitMoney/iRemit/Chipper Cash resueltos,
> InstaReM/RemitBee como candidatos nuevos, alerta inicial sobre Xoom).
> Segunda actualización: Sección 8 — profundización de los 6 pendientes
> (Xoom confirmado como altamente variable por corredor y método, mismo
> patrón encontrado en TransferGo, InstaReM evaluado como candidato fuerte,
> SBI Remit con primer dato real -y desfavorable-, Romania→Moldova y
> Singapore→Vietnam con más contexto pero todavía sin cifra exacta).
> Tercera actualización: Sección 9 — cierre de los 6 pendientes que
> quedaban. TransferGo medido en un segundo corredor (UK→Polonia, ~0,35%
> de margen — confirma que varía fuerte por corredor), MoneyGram
> Rumania→Moldavia medido en vivo con un hallazgo que rompe el patrón
> esperado (promocional + fee cero mostró ser una oferta cara, ~4,65% peor
> que mid-market), Wise Singapur→Vietnam cerrado por patrón consistente de
> la empresa, y CAB Payments resuelto con take rates reales de su propio
> reporte financiero (0,07%-0,31% según tipo de moneda).
> Cuarta actualización: Sección 10 — SBI Remit confirmado como un tercer
> caso del mismo patrón de margen variable por corredor (carísimo en
> Filipinas/Brasil, el más barato en China), InstaReM y RemitBee
> verificados en vivo con cotizaciones propias (ambos con mecanismo de
> tasa promocional de bienvenida — uno no detectado antes en InstaReM),
> y el intento de conseguir la tasa regular de MoneyGram Rumania→Moldavia
> que no prosperó (calculadora de solo lectura en esa página específica).
> **Quinta actualización: Sección 11 — se testeó la hipótesis de "margen
> variable" contra Ria y MoneyGram, que ya están cargados en la base
> real** (no solo candidatos nuevos). Resultado matizado: Ria varía poco
> (banda razonable, 0,76%-1,44%), MoneyGram varía fuerte pero de forma
> predecible por método de pago (no tanto por corredor) — ninguno de los
> dos llega al nivel de imprevisibilidad de Xoom/TransferGo/SBI Remit.
> Se cerró definitivamente el intento de conseguir la tasa regular de
> MoneyGram Rumania→Moldavia (queda igual que Remitly/WorldRemit: solo
> accesible con cuenta) y se reconfirmó por tercera vez que el fee de
> Skrill de 2,99%/3,99% es de la billetera, no del producto de transfers.
> **Sexta actualización: Sección 12 — cambio de método, pedido explícito
> del usuario: en vez de calculadoras oficiales, buscar en blogs, reviews
> y foros las 4 tasas que quedaban sin poder conseguirse por vía oficial.**
> Resultado mixto: para Global66 apareció un primer número concreto
> (margen máximo declarado del 2%, de un sitio de reviews, no verificado
> en vivo, pero la mejor estimación disponible dado que la calculadora del
> sitio está rota). Para Skrill, 3 fuentes independientes más (blogs de
> terceros) confirman el 3,99%-4,99%, pero **ninguna distingue el producto
> de Money Transfer de la billetera** — refuerza que el 0,69% de World
> Bank sigue siendo el único dato específico del producto correcto. Para
> Remitly/WorldRemit y MoneyGram Rumania→Moldavia (tasas regulares), la
> búsqueda por blogs/foros/reviews **no encontró ningún número nuevo**
> (Reddit sin resultados relevantes, Trustpilot bloquea el acceso
> automatizado) — quedan cerrados como estructuralmente inalcanzables sin
> una cuenta real logueada, confirmado ahora también por esta vía.
>
> **Nada de esto fue cargado a Supabase.** Solo research + análisis. Cero
> `apply_migration`, cero `execute_sql` de escritura, cero commits.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha de investigación:** 2-sep-2026. **Fecha de export a Supabase:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Análisis consolidado de "qué falta", esta vez sobre los 5 documentos
   juntos** (no solo v8) — ver Sección 1. La novedad principal: el research
   de brokers business quedó más claro — algunos son opacos por diseño
   (Moneycorp, Convera, CAB Payments no publican ningún número), y otros sí
   dan un rango o cifra concreta (Airwallex, OFX, Payoneer).
2. **Business brokers, pricing por moneda:** confirmado que Moneycorp,
   Convera y CAB Payments **no publican ningún margen ni rango
   numérico** — es pricing negociado caso por caso, no hay una fuente
   pública citable. Payoneer sí: ~0,5% de markup para la mayoría de
   clientes US. Ver Sección 2.
3. **TransferGo, primer dato en vivo:** Alemania→Ucrania (EUR→UAH), margen
   real ~1,84% — más alto que el "desde 0,5%" que publicitan, probablemente
   por ser UAH una moneda con controles de cambio. Ver Sección 3.1.
4. **Skrill — aclarado un malentendido importante:** el margen de 4,99% que
   aparece en reviews de terceros es de la **billetera general** de Skrill
   (pagos online, recargas), NO del producto de transferencias
   (`transfers.skrill.com`), que es el que mide World Bank y da 0,69% de
   margen. Son dos productos distintos con el mismo nombre — no confundir
   al cargar. Ver Sección 3.2.
5. **Romania→Moldova y Singapore→Vietnam: confirmado que el panel de World
   Bank está genuinamente vacío** (fecha placeholder "First Quarter 1970"),
   no es un problema de la herramienta ni de cómo until ahora se buscó. Hay
   que buscar estos dos corredores por otra vía si se quieren completar.
   Ver Sección 4.
6. **RemitMoney (el 0,00% sospechoso de la ronda anterior) — identificado:**
   es un producto de **Axis Bank** (banco grande de India), no una fintech
   chica. Rating de Trustpilot 2,3/5 con reportes de fondos demorados. El
   "0% fee" es real como promoción bancaria, pero la calidad de servicio es
   mala — no recomendable como alternativa a destacar. Ver Sección 5.1.
7. **iRemit y Chipper Cash — cerrados con datos reales** (antes "sin
   resultado"): iRemit tiene fee ~2x más caro que Wise y margen que varía
   fuerte por moneda (-1,34% a +1,91%); Chipper Cash sigue sin publicar
   ningún número, confirmado de nuevo. Ver Sección 5.2 y 5.3.
8. **2 corredores nuevos + 2 candidatos fuertes:** Australia→Filipinas y
   Canadá→Filipinas, de donde salen **InstaReM** (fintech establecida del
   grupo Nium) y **RemitBee** (fintech canadiense) como candidatos nuevos.
   Ver Sección 6.
9. **⚠️ Alerta de consistencia sobre Xoom:** en Canadá→Filipinas, Xoom da
   0,58% de costo total con margen **negativo** (-0,42%) — muy distinto de
   los ~2,8-3,1% que veníamos confirmando en 4 mediciones anteriores
   (GB-PH, GB-MX, US-CO). Esto debilita la conclusión anterior de "Xoom ≈
   3% en todos lados" — parece que el margen de Xoom varía bastante más por
   corredor de lo que se pensaba. Ver Sección 6.3, con recomendación de no
   tratar el "~3%" como una constante de la empresa.

**Segunda ronda del mismo día (Sección 8), profundizando los 6 puntos
pendientes de la Sección 7:**

10. **Xoom: la alerta se confirma y se agrava.** Con 2 corredores más
    (US→Filipinas: 3,49%-9,99% según método de pago/entrega; Canadá→India:
    1,75%-3,88%), queda claro que no es un caso aislado de Canadá→
    Filipinas — Xoom varía muchísimo por corredor Y por método dentro del
    mismo corredor. Recomendación firme: nunca extrapolar un spread de
    Xoom medido en un corredor a otro. Ver Sección 8.1.
11. **TransferGo: mismo patrón que Xoom.** No pude cambiar el corredor de
    la calculadora en vivo (posible bug del propio sitio, no de la
    herramienta), pero comparando mi medición de Alemania→Ucrania (~1,84%
    de margen) contra un dato ya existente de Polonia→Ucrania (0,10-0,23%,
    de `research-findings-2026-09-01.md`), la diferencia es de 8 a 18
    veces para el mismo país receptor. Mismo consejo que para Xoom: no
    asumir un margen uniforme entre corredores. Ver Sección 8.2.
12. **InstaReM evaluado a fondo — candidato fuerte:** fee 0,25%-1,00%,
    margen cambiario "zero-margin" en varias monedas (consistente con el
    0,09% medido en Australia→Filipinas), parte del grupo Nium (empresa de
    infraestructura de pagos consolidada). Perfil similar a Wise. Ver
    Sección 8.3.
13. **SBI Remit: primer dato real, y no es bueno.** Un ejemplo concreto en
    JPY→PHP muestra que el destinatario recibe ~2,25% menos con SBI Remit
    que con Wise — bastante peor que Brastel Remit (0,24% de margen en el
    mismo país, JPY→VND). Ya no es "sin dato", es "dato desfavorable". Ver
    Sección 8.5.
14. **Romania→Moldova y Singapore→Vietnam: más contexto, todavía sin
    cifra exacta.** Confirmado que TransferGo y MoneyGram operan
    Romania→Moldova, y que Wise cotiza un fee explícito (7,15-7,31 SGD)
    para Singapur→Vietnam sin publicar el margen. Monito.com bloqueó el
    scraping (403) en ambos intentos. Ver Sección 8.6.

**Tercera ronda del mismo día (Sección 9), cerrando los 6 pendientes que
quedaban después de la Sección 8:**

15. **TransferGo, segundo corredor real: UK→Polonia, ~0,35% de margen.**
    Encontré el patrón correcto (páginas dedicadas por país destino, la
    calculadora de la home tiene un bug confirmado por el propio sitio).
    Confirma con datos duros la hipótesis de la ronda anterior: en su
    corredor insignia el margen es chico y cumple lo publicitado (~0,35%
    vs. el "desde 0,5%"); en Alemania→Ucrania es 5 veces más alto (~1,84%).
    Ver Sección 9.1.
16. **MoneyGram Rumania→Moldavia, medido en vivo — hallazgo que rompe el
    patrón esperado.** 100 RON → 18,14 EUR con comisión en cero
    ("promoción para clientes nuevos"), pero la tasa de cambio resultó
    ~4,65% peor que mid-market. Es la primera vez en todo el proyecto que
    una oferta "fee cero + promocional" resulta ser mala para el cliente —
    hasta ahora siempre habían sido fee cero Y mejor tasa juntos. Ver
    Sección 9.2.
17. **Wise Singapur→Vietnam:** cerrado por el patrón 100% consistente de
    la empresa en todo el proyecto (margen ~0% en todos los corredores
    medidos) — no hace falta seguir midiéndolo corredor por corredor como
    a Xoom/TransferGo. Fee: 7,15-7,31 SGD según método. Ver Sección 9.3.
18. **CAB Payments — resuelto con datos reales.** Su reporte financiero
    FY25 (cotiza en la bolsa de Londres) publica take rates reales: 0,07%
    en monedas mayores, 0,31% en mercados emergentes. Importante: es su
    margen como proveedor mayorista/institucional, probablemente no
    comparable al costo que pagaría un usuario final — documentar con ese
    caveat, no cargar directo como spread consumer-facing. Ver Sección 9.4.
19. Barrido adicional (India→Nepal, Sudáfrica→Nigeria): sin candidatos
    fuertes nuevos — India→Nepal está dominado por bancos indios, y en
    Sudáfrica→Nigeria apareció un nombre nuevo (Sikhona Money Transfers)
    pero con costo alto, no destaca. Ver Sección 9.5.

**Cuarta ronda del mismo día (Sección 10):**

20. **SBI Remit: tercer proveedor confirmado con margen altamente variable
    por corredor.** Carísimo en Japón→Filipinas y Japón→Brasil (7,4% de
    costo total, peor que Wise y que Brastel Remit), pero **la opción más
    barata** en Japón→China (0,86% de margen, mejor que Western Union,
    Seven Bank, MoneyGram y JRF). Se suma a Xoom y TransferGo — ya son 3
    casos del mismo patrón, que empieza a verse como la norma para
    proveedores "amplios", no la excepción. Ver Sección 10.1.
21. **InstaReM verificado en vivo (Reino Unido→India): margen ~0,31%**,
    consistente con el dato de World Bank de la ronda anterior. Corrección
    importante: **sí tiene mecanismo de tasa promocional de bienvenida**
    (no detectado en la evaluación anterior) — pero su tasa regular ya es
    competitiva por sí sola, no depende de la promoción. Ver Sección 10.3.
22. **RemitBee verificado en vivo (Canadá→India): margen regular ~0,47%**,
    con la tasa promocional (~3,93% mejor que mid-market, primera
    transferencia gratis) mostrada al mismo tiempo en la página — mismo
    mecanismo transparente que vimos en MoneyGram España→Marruecos. Acá
    la promoción sí es una oferta genuinamente buena, a diferencia del
    caso raro de Rumania→Moldavia. Ver Sección 10.4.
23. MoneyGram Rumania→Moldavia: la tasa regular sigue sin conseguirse — el
    campo de monto de esa página no es editable. Skrill Money Transfer:
    sin calculadora pública, no se pudo verificar en vivo. Ver Secciones
    10.2 y 10.5.

**Quinta ronda del mismo día (Sección 11):**

24. **Se probó la hipótesis de "margen variable por corredor" contra Ria y
    MoneyGram — los dos proveedores grandes que ya están completamente
    cargados en mangomundi**, no solo candidatos nuevos. Resultado: Ria
    varía poco (0,76%-1,44% en 3 corredores, banda razonable). MoneyGram
    varía fuerte, pero el driver principal es el **método de pago/entrega**
    (tarjeta/internet ≈ 0% o negativo, efectivo/agente más caro), no tanto
    el corredor en sí — un patrón más fácil de modelar que el de Xoom. Ver
    Sección 11.1.
25. Cerrado definitivamente: la tasa regular de MoneyGram Rumania→Moldavia
    no se puede conseguir sin cuenta (mismo límite que Remitly/WorldRemit
    ES→AR). Reconfirmado por tercera vez que el 2,99%/3,99% de fees de
    Skrill es de la billetera general, no del producto de Money Transfer.
    Ver Secciones 11.2 y 11.3.

**Sexta ronda del mismo día (Sección 12) — cambio de método a pedido del
usuario: blogs, reviews y foros en vez de calculadoras oficiales:**

26. **Global66: primer número concreto encontrado en todo el proyecto** —
    un sitio de reviews (tiempofinanciero.com.ar) declara un margen
    cambiario máximo del 2% y comisión cero en operaciones que involucran
    pesos argentinos. No es un dato verificado en vivo (la calculadora
    del propio sitio sigue rota), pero es la mejor estimación disponible
    y puede cargarse como estimado/no verificado. Ver Sección 12.1.
27. **Skrill: 3 fuentes de terceros más (blogs, no la propia Skrill)
    confirman el rango 3,99%-4,99%**, pero ninguna distingue el producto
    de Money Transfer de la billetera general — todas conflacionan ambos
    productos. Esto refuerza (con 3 fuentes externas más, sumadas a las 3
    internas de rondas anteriores) que el 0,69% de World Bank sigue siendo
    el único número específico del producto correcto conocido. Ver
    Sección 12.2.
28. **Remitly/WorldRemit (tasa regular ES→AR) y MoneyGram Rumania→Moldavia
    (tasa regular): la búsqueda por blogs/foros/reviews no encontró
    ningún número nuevo.** Reddit sin resultados relevantes en ninguna de
    las búsquedas probadas; los sitios de reviews con más potencial
    (Trustpilot) bloquean el fetch automatizado (403). Ambos pendientes
    quedan cerrados definitivamente como estructuralmente inalcanzables
    sin cuenta real logueada — ahora confirmado también por esta vía
    alternativa, no solo por la vía de calculadoras oficiales. Ver
    Sección 12.3.

---

## 1. Análisis consolidado: qué falta, mirando los 5 documentos juntos

Repasando v6, v7, v8 y `research-findings-2026-09-01.md` en conjunto (no
solo v8, que era mi foco hasta ahora), esto es lo que queda genuinamente
abierto:

### 1.1 Decisiones de producto/arquitectura (no son research, son tuyas)

- **Spread variable por moneda en brokers business** (originado en
  `research-findings-2026-09-01.md` Sección 5, retomado en v8 Sección
  13.1): ¿vale la pena modelar un campo de "tier de moneda" o una tabla de
  tiers en vez de `spread_percent` plano? Esta ronda lo confirma con más
  fuerza — ver Sección 2 de este documento: para varios proveedores (
  Moneycorp, Convera, CAB Payments) **ni siquiera hay un rango público que
  cargar** — es un límite estructural, no solo de granularidad.
- **Azimo:** dar de baja explícitamente con nota (cerró operaciones), no
  dejar solo `active=false` silencioso.
- **Zing (HSBC):** evaluar recategorizar de Tipo A (corridor-specific) a
  Tipo B (multi-moneda amplio) — hoy puede estar mal clasificado.

### 1.2 Research que sigue genuinamente pendiente

- **Romania→Moldova, Singapore→Vietnam:** sin dato en World Bank (confirmado
  vacío, no reintentar por esa vía — ver Sección 4). Si se quiere estos
  corredores, hay que ir proveedor por proveedor a sus propios sitios.
- **SBI Remit (Japón):** sigue sin ningún número usable en ninguna fuente
  revisada hasta ahora.
- **Global66 con cotización real:** después de 5 intentos con 2
  herramientas de browser distintas, recomendado cerrar salvo que alguien
  lo saque de la app.
- **Remitly/WorldRemit ES→AR, tasa regular (no promocional):** requiere
  cuenta logueada — no lo puede hacer esta sesión.
- **Nombres nuevos de esta ronda sin evaluación profunda todavía:**
  InstaReM, RemitBee, Metro Remittance, PNB Global Remit (ver Sección 6).

### 1.3 Lo que ya está genuinamente completo (no reinvertir tiempo ahí)

Golfo (6 casas de cambio + 24 corredores), Ucrania (huecos de PL-UA/DE-UA
para proveedores ya activos), la mayoría de LatAm/Caribe, India, Colombia,
México, Nigeria, y el mapa de proveedores inactivos (Azimo confirmado
cerrado, iRemit ahora con datos reales, Zing con nota de reclasificación).

---

## 2. Business brokers: pricing por moneda — resultado más claro de lo esperado

Fuentes revisadas: reviews de Wise sobre cada proveedor, guías de terceros,
y el "Financial Services Guide" de Convera (documento regulatorio propio,
el más explícito de los tres).

| Proveedor | ¿Publica rango o cifra? | Detalle |
|---|---|---|
| **Airwallex** | Sí (ya documentado en `research-findings-2026-09-01.md`) | Rango 0,5%-1% |
| **OFX** | Sí (ya documentado) | Rango 0,4%-2%, más ancho para pares exóticos |
| **Payoneer** | Sí, cifra concreta | ~0,5% de markup para la mayoría de clientes US, varía por tipo de transacción |
| **Moneycorp** | **No** | Solo dice "los pares menos comunes pueden tener spreads más anchos" y "transferencias grandes consiguen mejores spreads" — sin ningún número |
| **Convera** | **No** | Su propio Financial Services Guide dice que el margen "varía según el monto, la moneda, el costo del crédito, la probabilidad de cambios en la tasa, y las tasas de interés diferenciales" — reconoce explícitamente que no hay una cifra fija |
| **CAB Payments** | **No** | No se encontró ninguna fuente (propia ni de terceros) con cifras concretas — es un proveedor mayorista/infraestructura, no consumer-facing, lo cual puede explicar la falta de transparencia pública |

**Conclusión práctica:** de los 6 brokers business + `both`-segment
originales, la mitad (Airwallex, OFX, Payoneer) tiene algo público que se
podría cargar como rango o número aproximado; la otra mitad (Moneycorp,
Convera, CAB Payments) **no tiene ninguna fuente pública citable**, ni
siquiera un rango — cargar cualquier número ahí sería inventar. Esto
refuerza que la decisión de arquitectura (Sección 1.1) es más urgente que
seguir buscando: no es que falte investigar más, es que para 3 de 6
proveedores el dato simplemente no existe públicamente.

---

## 3. TransferGo y Skrill — verificación en vivo

### 3.1 TransferGo — primera medición real

`transfergo.com` cargó automáticamente una cotización por defecto
(Alemania→Ucrania, sin login):

> 1 EUR = 50,63 UAH · Comisión: gratis (0,00 EUR)

Mid-market de referencia (xe.com, mismo momento): 1 EUR = 51,5812 UAH.
**Margen real: (51,5812-50,63)/51,5812 ≈ 1,84%.**

Esto es bastante más alto que el "desde 0,5%" que TransferGo publicita en
su página de precios — consistente con el patrón ya visto varias veces en
el proyecto de que las monedas con controles de cambio (UAH en este caso)
tienden a tener spreads más anchos que los que aparecen en la letra chica
de marketing. **Recomendación:** antes de cargar TransferGo con
`verified_status='confirmado'`, medir al menos un corredor más líquido
(ej. Reino Unido→Polonia, el corredor "insignia" de la empresa) para ver si
ahí sí se acerca al 0,5% publicitado, o si el margen real siempre corre
más alto que lo anunciado.

### 3.2 Skrill — dos productos distintos, no confundir

Al buscar "Skrill fees" aparecen números muy distintos según la fuente, y
la razón es que **Skrill tiene dos productos con pricing completamente
diferente**:

| Producto | Margen / fee | Fuente |
|---|---|---|
| **Skrill billetera general** (pagos online, Skrill-to-Skrill, recargas de tarjeta) | Hasta 4,99% de markup + fees adicionales de 1-7,5% según la operación | Wise (`wise.com/gb/blog/skrill-money-transfer`) |
| **Skrill Money Transfer** (`transfers.skrill.com`, el producto dedicado a remesas) | Sin fee por transferencia bancaria; margen no publicado en cifra propia, pero World Bank mide **0,69% de margen, 1,35% de costo total** para Alemania→India | Sitio propio de Skrill + World Bank RPW |

**Esto es importante para la carga de datos:** si `providers` tiene o llega
a tener una fila de "Skrill", tiene que quedar clarísimo a cuál de los dos
productos corresponde — son números completamente distintos (0,69% vs.
hasta 4,99%+). El producto relevante para comparación de remesas es
`transfers.skrill.com`, no la billetera general.

---

## 4. Romania→Moldova y Singapore→Vietnam — confirmado que no hay dato

Reintenté ambos corredores en World Bank RPW. Los dos devuelven **todos los
campos en 0,00 con fecha placeholder "First Quarter 1970"** — es la forma
que tiene el sitio de decir "no hay datos cargados para este corredor
específico", no un error de la búsqueda ni de la herramienta. Ya se había
documentado esto mismo en `research-findings-2026-09-01.md` Sección 3; esta
ronda lo reconfirma. **Si se quieren estos dos corredores, la única vía que
queda es ir directo a los sitios de proveedores individuales** (Wise,
TransferGo, Western Union, etc.) — no hay atajo vía World Bank.

---

## 5. Pendientes sueltos, resueltos

### 5.1 RemitMoney — resuelto: es Axis Bank, con problemas de calidad de servicio

El "0,00% de costo total" de Alemania→India que había quedado marcado como
sospechoso en el v8 (Sección 14.7) tiene explicación: **RemitMoney es un
producto de Axis Bank** (uno de los bancos privados grandes de India), no
una fintech independiente. Opera desde EE.UU., Eurozona, EAU y Suiza hacia
India, con "cero comisión de transferencia" como estrategia real (no un
artefacto de la muestra). Pero: **rating de Trustpilot 2,3/5 sobre 281
reviews**, con reportes recurrentes de fondos demorados hasta un mes y
soporte que no responde. **Recomendación:** no destacar como alternativa
recomendable pese al 0% de fee — la propuesta de valor real (costo) es
buena pero el riesgo operativo (demoras, soporte) es alto.

### 5.2 iRemit — resuelto con datos reales

- Markup promedio "0,017% mejor que mid-market", pero con **variación
  fuerte por moneda**: de -1,34% (CAD) a +1,91% (GBP) para el corredor a
  Filipinas.
- Fees por transferencia: CAD 6,50-12,00 según método/región, USD 8-9,
  aprox. S$4-5 desde Singapur — **roughly el doble de lo que cobra Wise**
  en comparaciones directas (ej. CAD 1.000 a Filipinas: 19,90 CAD iRemit
  vs. 9,64 CAD Wise).
- **Contraste con World Bank:** en Australia→Filipinas (Sección 6), iRemit
  aparece con margen **negativo** (-3,5%, mejor que mid-market) en varios
  métodos — inconsistente con el panorama de arriba (fees altos, markup
  variable). Puede ser que iRemit tenga estructuras de precio muy distintas
  por país de origen (Australia vs. Canadá), o que alguna de las dos
  fuentes esté midiendo algo específico (un método de pago barato, o una
  promoción). **No cargar un número único de iRemit sin especificar
  claramente el corredor y método** — es un proveedor con mucha variación.

### 5.3 Chipper Cash — sigue sin dato público

Reconfirmado: ningún fee ni margen se publica en ningún lado revisado
(sitio propio, blogs de terceros). El propio texto de Chipper Cash dice
que hay que comparar la cotización de la app contra el mid-market en el
momento — no hay tabla fija. Sin cambios respecto a lo ya documentado en
`research-findings-2026-09-01.md`.

---

## 6. Corredores nuevos: Australia→Filipinas y Canadá→Filipinas

### 6.1 Australia→Filipinas (200 AUD, Q3 2025)

| Proveedor | Costo total | Margen |
|---|---|---|
| iRemit (banco, call center) | 0,48% | -3,52% |
| iRemit (banco, agente) | 0,49% | -3,51% |
| **InstaReM** (internet) | 0,76% | 0,09% |
| MoneyGram (débito) | 0,87% | 0,12% |
| Wise (banco) | 1,05% | 0,01% |
| Remitly | 2,16% | — |
| WorldRemit | 2,14-2,23% | — |
| Western Union | 2,58-3,77% | — |

**InstaReM** es candidato nuevo real y sólido — fintech del grupo Nium
(bien establecida, opera en varios países de Asia-Pacífico), con margen
casi tan bueno como Wise (0,09% vs. 0,01%).

### 6.2 Canadá→Filipinas (500 CAD, Q3 2025)

| Proveedor | Costo total | Margen |
|---|---|---|
| Xoom | 0,58% | -0,42% |
| WorldRemit | 1,42% | 0,42% |
| MoneyGram | 1,86% | 0,11% |
| Wise | 1,90% | 0,08% |
| Royal Bank of Canada | 2,10% | 2,10% |
| **RemitBee** (efectivo) | 2,14% | 0,64% |
| **RemitBee** (banco) | 2,32% | 0,82% |
| Ria | 2,60% | 0,85% |
| Western Union | 2,82% | 0,82% |
| Remitly | 3,32% | 0,82% |
| **Metro Remittance** | 3,97-5,07% | -0,03 a 0,27% |
| iRemit | 5,03-6,03% | 0,03% |
| ScotiaBank | 5,73% | 2,23% |
| **PNB Global Remit** | 5,15-6,65% | -0,35% |

**RemitBee** es candidato nuevo — fintech canadiense, precio medio (mejor
que Ria/WU/Remitly, peor que Wise/Xoom). Metro Remittance y PNB Global
Remit aparecen pero con costos altos, no destacan como candidatos
prioritarios.

### 6.3 ⚠️ Alerta: Xoom no es tan consistente entre corredores como se pensaba

Hasta la ronda anterior, con 4 mediciones (GB→Filipinas 2,89%, GB→México
3,07%, US→Colombia 2,79% vía RPW, y una repetición de GB→Filipinas vía RPW
2,81%) se había concluido que **Xoom tiene un spread real estable de
~2,8-3,1%**, tratable casi como una constante de la empresa.

Este dato de Canadá→Filipinas lo contradice: **0,58% de costo total, margen
negativo (-0,42%)** — muchísimo mejor que el rango anterior, y de hecho
mejor que mid-market. Esto puede deberse a:
- Un producto/promoción específica de Canadá que no está en otros países.
- Que el margen de Xoom varíe mucho más por corredor de lo asumido (más
  parecido a un banco/casa de cambio tradicional que a un proveedor con
  spread fijo tipo Wise).
- Una particularidad de la muestra de World Bank en este corredor puntual.

**Recomendación:** bajar la confianza en "Xoom ≈ 3%" como número universal.
Si se carga Xoom a `fx_rates`, hacerlo corredor por corredor con
`verified_status` específico de cada medición, no extrapolar el ~3% a
corredores no medidos.

---

## 7. Plan actualizado — pendientes para la próxima ronda

1. Decisión de arquitectura para spread variable de brokers business —
   ahora con evidencia más fuerte de que 3 de 6 proveedores no tienen
   ningún dato público (Sección 2).
2. Medir TransferGo en un corredor líquido (Reino Unido→Polonia) para
   contrastar con el 1,84% medido en Alemania→Ucrania.
3. Evaluar en detalle InstaReM y RemitBee (candidatos fuertes de esta
   ronda) antes de sumarlos a la base.
4. Revisar la carga de Xoom existente — con el hallazgo de la Sección 6.3,
   puede convenir marcar corredores no medidos directamente como
   `sin_confirmar` en vez de asumir el ~3%.
5. SBI Remit sigue sin dato — considerar cerrarlo como "solo informativo"
   igual que Bitso/Strike, salvo que aparezca una fuente nueva.
6. Romania→Moldova y Singapore→Vietnam: si importan, requieren research
   proveedor por proveedor (no hay atajo vía World Bank).

---

## 8. Segunda ronda del mismo día — profundizando los 6 pendientes de la Sección 7

### 8.1 Xoom — confirmado: el margen varía muchísimo más de lo que se pensaba

Con 2 corredores más (Estados Unidos→Filipinas y Canadá→India, ambos vía
World Bank Q3 2025), el patrón de la Sección 6.3 queda mucho más claro —
y peor de lo que parecía:

| Corredor | Costo total | Margen cambiario |
|---|---|---|
| GB→Filipinas | 2,89% (medido) / 2,81% (RPW) | ~2,8% |
| GB→México | 3,07% (medido) | ~3,07% |
| US→Colombia | 2,79% (RPW) | ~2,79% |
| **CA→Filipinas** | **0,58%** | **-0,42%** |
| **US→Filipinas** | **3,49% a 9,99%** (según método) | **0,00% a 4,49%** (según método) |
| **CA→India** | 1,75% (banco) / 3,88% (tarjeta) | 1,75% |

**Conclusión reforzada:** Xoom no tiene un spread "de empresa" estable.
Varía por corredor (de -0,42% a 4,49%) Y por método de pago/entrega dentro
del mismo corredor (US→Filipinas solo, va de 3,49% a 9,99% de costo total
según cómo se pague). Esto es un hallazgo más fuerte que la alerta de la
ronda anterior — **no es una excepción puntual de Canadá→Filipinas, es el
patrón real de Xoom.** Recomendación firme: nunca cargar un spread de Xoom
sin especificar corredor + método de pago + método de entrega exactos, y
no reusar el número de un corredor para estimar otro.

### 8.2 TransferGo — segundo intento de medición en vivo, con un hallazgo distinto

Intenté cambiar el corredor de la calculadora en vivo (de Alemania→Ucrania
a Reino Unido→Polonia) usando los selectores de moneda del sitio. **No lo
conseguí** — los clics en las opciones de moneda no actualizaban el
resultado mostrado (siguió clavado en "EUR 1 = UAH 50,62", prácticamente
idéntico a la medición anterior de 50,63). Puede ser un bug real del
calculador (el propio sitio muestra un aviso: *"This amount placeholder is
shown due to an error in the calculator"* — o sea, el error es de ellos,
no de la herramienta de browser) o una limitación de automatización.

**Pero encontré algo mejor que repetir la medición:** `research-findings-
2026-09-01.md` (Sección 3) ya tenía un dato de World Bank para TransferGo
en **Polonia→Ucrania: margen 0,10-0,23%** — un corredor con el mismo país
receptor (Ucrania) pero diferente país emisor. Comparado con mi medición en
vivo de **Alemania→Ucrania: margen ~1,84%**, la diferencia es enorme (8-18
veces más alto) para el mismo país receptor. Esto sugiere que, igual que
con Xoom, **el margen de TransferGo depende mucho del corredor específico
emisor→receptor**, no solo de la moneda receptora — probablemente por
diferencias en el volumen/liquidez de cada corredor (Polonia→Ucrania debe
ser un corredor de altísimo volumen para TransferGo, dada la diáspora
ucraniana en Polonia; Alemania→Ucrania menos). **No tratar el margen de
TransferGo como uniforme entre corredores**, mismo criterio que para Xoom.

Confirmé además que Wise no tiene datos propios de TransferGo ("no tenemos
información confiable de este proveedor") — sigue sin haber una fuente
de terceros que llene este hueco, solo mediciones directas.

### 8.3 InstaReM — evaluación completa, candidato sólido

- **Fee:** 0,25%-1,00% según destino y método, a veces exonerado en montos
  grandes o corredores específicos.
- **Margen cambiario:** la empresa dice ofrecer **"zero-margin FX"** para
  ciertas monedas (tasas de Reuters, sin markup) — consistente con el dato
  de World Bank de esta misma ronda (0,09% en Australia→Filipinas, casi
  igual a Wise en ese corredor).
- Pertenece al grupo **Nium** (empresa de infraestructura de pagos bien
  establecida, no una startup nueva) — buena señal de solidez.
- No se encontró mecanismo de tasa promocional tipo "bienvenida" — el único
  incentivo encontrado es un código de cupón de un comparador de terceros
  (USD 10 de bono), no una tasa de cambio inflada.

**Evaluación: candidato fuerte, de perfil similar a Wise** (fee chico +
margen mínimo, sin contaminación promocional). Recomendado para sumar a la
base si se sigue esta línea.

### 8.4 RemitBee — evaluación parcial, sin nueva información más allá de World Bank

Ningún comparador de terceros revisado (remitrate.com, finder.com) publica
fee o margen concretos — todos dicen "varía por corredor" y remiten a
revisar en el checkout. El único dato numérico real sigue siendo el de
World Bank de la ronda anterior (Canadá→Filipinas: costo total 2,14-2,32%,
margen 0,64-0,82%). **Evaluación: candidato de precio medio, no
particularmente competitivo** (peor que Wise/Xoom/MoneyGram/WorldRemit en
ese mismo corredor, mejor que Ria/WU/Remitly) — no es prioritario, pero es
una fintech canadiense real y activa, sin señales de alerta.

### 8.5 SBI Remit — por fin, un dato real (aunque desfavorable)

Una fuente en japonés (blog oficial de Wise Japón) trae una comparación
directa con ejemplo concreto, envío de ¥100.000 a Filipinas:

| Proveedor | Tasa (JPY→PHP) | El destinatario recibe |
|---|---|---|
| SBI Remit | 1 JPY = 0,47295 PHP | 46.632 PHP |
| Wise | 1 JPY = 0,48149 PHP | 47.704 PHP |

**Diferencia: el destinatario recibe ~2,25% menos con SBI Remit que con
Wise** — implica un margen de SBI Remit notablemente más alto que Wise en
este corredor (JPY→PHP). Contraste directo con Brastel Remit (0,24% de
margen en JPY→VND, Sección 14.6 de v8) — **SBI Remit parece ser bastante
menos competitivo que Brastel Remit**, pese a ser una marca más grande y
conocida en Japón. **Ya no es "sin dato" — ahora es "dato desfavorable",
margen implícito ~2%+**, aunque específico de este corredor puntual
(JPY→PHP) y no confirmado en otros.

### 8.6 Romania→Moldova y Singapore→Vietnam — siguen sin cifra concreta, pero con más contexto

- **Romania→Moldova:** confirmado que **TransferGo y MoneyGram sí operan
  este corredor** (ambos tienen páginas dedicadas a Moldova), pero ninguna
  de sus páginas públicas muestra un fee o margen específico sin cargar la
  calculadora real — algo que no se pudo hacer esta ronda (ver 8.2, el
  calculador de TransferGo no respondió a los cambios de corredor).
- **Singapur→Vietnam:** Wise sí cotiza fee explícito: **7,15-7,31 SGD**
  según método de pago (7,15 con saldo de cuenta Wise, 7,31 con
  transferencia bancaria, 63,18 con tarjeta de débito — la tarjeta sale
  carísima). El margen cambiario no se cuantifica en la página, pero dado
  el patrón consistente de Wise en todo el proyecto (~0-0,1% de margen en
  casi todos los corredores medidos hasta ahora), es razonable asumir algo
  similar acá, aunque **no está confirmado con un número propio**.
- **Monito.com** (agregador que hubiera sido útil para ambos corredores)
  devolvió error 403 en los dos intentos — bloqueando scraping automatizado.
  No vale la pena reintentar por esa vía.

**Conclusión para estos dos corredores:** siguen sin poder cargarse con
`verified_status='confirmado'` — lo que se consiguió es confirmar qué
proveedores SÍ operan ahí (para no asumir que no existen), pero no las
cifras exactas. Requieren una medición en vivo con browser real contra la
calculadora de cada proveedor (Wise para Singapur→Vietnam sería el más
fácil de completar, ya tiene el fee — solo falta el margen).

### 8.7 Resumen de esta segunda ronda

El hallazgo más importante no es sobre un proveedor puntual — es un
**patrón que se repite**: tanto Xoom (Sección 8.1) como TransferGo
(Sección 8.2) muestran variación enorme de margen entre corredores, mucho
más de lo que el proyecto había asumido hasta ahora al tratar a un
proveedor como si tuviera "un" spread. **Recomendación general para la
carga de datos:** para proveedores de tipo "amplio" (no corridor-specific
declarado, pero con comportamiento de precio variable como Xoom y
TransferGo), conviene revisar si corresponde bajarles la confianza de
`verified_status` en corredores no medidos directamente, en vez de asumir
que un solo corredor medido representa a todos los demás.

---

## 9. Tercera ronda del mismo día — cierre de los 6 pendientes restantes

### 9.1 TransferGo, segundo corredor conseguido — confirma la hipótesis de la Sección 8.2

Encontré el patrón correcto: TransferGo tiene páginas propias por país
destino (`transfergo.com/en/send-money-to-{país}`), y ahí la calculadora
**sí funciona** (a diferencia de la calculadora genérica de la home, que
tiene un bug confirmado por el propio sitio). Con eso medí Reino
Unido→Polonia, el corredor "insignia" de la empresa:

> GBP 1 = PLN 5,03 · Comisión: gratis (0,00 GBP)

Mid-market de referencia (xe.com): 1 GBP = 5,04741 PLN. **Margen real:
(5,04741-5,03)/5,04741 ≈ 0,35%** — de hecho mejor que el "desde 0,5%" que
publicitan.

**Comparación directa, ahora con 2 corredores reales:**

| Corredor | Margen medido |
|---|---|
| Reino Unido→Polonia (corredor insignia) | ~0,35% |
| Alemania→Ucrania | ~1,84% |

Esto **confirma exactamente la hipótesis de la Sección 8.2**: el margen de
TransferGo no es uniforme, varía mucho según qué tan grande/líquido es el
corredor para ellos. En su corredor de mayor volumen (UK-Polonia, dada la
enorme diáspora polaca en Reino Unido) el margen es chico y cumple lo
publicitado; en un corredor más chico con una moneda de controles de
cambio (Alemania-Ucrania) el margen es 5 veces más alto. **Recomendación
actualizada:** si se carga TransferGo, usar `verified_status='confirmado'`
solo para UK→Polonia específicamente, y `sin_confirmar`/estimado para el
resto — mismo criterio que ya se venía aplicando a Xoom.

### 9.2 MoneyGram Rumania→Moldavia — medido, y con un hallazgo que rompe el patrón esperado

Usando el mismo truco que funcionó para España (`moneygram.com/ro/en` +
`/corridor/moldova`), conseguí una cotización real y en vivo:

> Envío: 100,00 RON → Recibe: 18,14 EUR · Tasa: 1 RON = 0,18 EUR (redondeada) ·
> Comisión: 10,00 RON tachada → **0,00 RON** · Banner: "No fees for new
> customers"

Mid-market de referencia (xe.com): 1 RON = 0,190258 EUR. **Margen real:
(0,190258-0,1814)/0,190258 ≈ 4,65% en contra del cliente.**

**Esto es distinto a todos los casos promocionales anteriores del
proyecto.** Hasta ahora, cada vez que vimos una oferta "para clientes
nuevos" (Remitly, WorldRemit, MoneyGram España→Marruecos, Félix Pago), el
mecanismo era: comisión en cero **y** tasa de cambio mejor que mid-market
— ambas cosas juntas hacían la oferta atractiva de verdad. Acá la comisión
está en cero, pero **la tasa de cambio es mucho peor que mid-market**
(4,65% peor) — es decir, MoneyGram compensa la "comisión gratis" subiendo
el margen cambiario escondido. El resultado neto para el cliente nuevo es
significativamente peor que mid-market, pese al banner de "sin comisión".

**Por qué importa:** confirma, con un caso muy claro, algo que se venía
sospechando pero no se había visto tan marcado — que "fee = 0" y
"promocional" **no implican automáticamente una mejor oferta**. Hay que
mirar siempre los dos números juntos (fee Y tasa), nunca uno solo.
**No cargar este número de MoneyGram RO→MD como algo bueno** — si se
carga, tiene que quedar claro que es una oferta cara pese al fee en cero.

### 9.3 Wise Singapur→Vietnam — cerrado por inferencia de patrón, no por número explícito

La página de conversor de Wise no publica un margen propio (por diseño:
Wise no aplica markup a la tasa, es su propuesta de valor central — "no
sneaky mark-up to hide the fees"). No hay una cifra nueva que reportar más
allá del fee ya conseguido la ronda anterior (7,15-7,31 SGD según método).
Dado el patrón 100% consistente de Wise en **todos** los corredores
medidos en este proyecto hasta ahora (márgenes de 0,00% a 0,08%), se puede
dar este corredor por **cerrado con alta confianza**: fee 7,15-7,31 SGD,
margen ~0%. No hace falta seguir midiendo Wise corredor por corredor como
si fuera Xoom o TransferGo — acá el comportamiento sí es consistente.

### 9.4 CAB Payments — resuelto con datos reales de su propio reporte financiero

Cambio importante respecto a la Sección 2: donde decía "no se encontró
ninguna fuente pública", ahora sí hay una — **CAB Payments Holdings cotiza
en la bolsa de Londres y publica resultados anuales con take rates
reales**, del reporte FY25 (marzo 2026):

| Segmento | Take rate 2025 | Take rate 2024 |
|---|---|---|
| Monedas G10 (mayores) | 0,07% | 0,06% |
| Mercados emergentes | 0,31% | 0,29% |
| Combinado | 0,15% | 0,14% |

**Caveat importante antes de cargar esto:** este take rate es el margen
que CAB Payments gana como **proveedor mayorista/institucional** (su
negocio es correspondencia bancaria y liquidez para otras empresas
financieras, no atención directa al público). Es casi seguro que **no es
comparable al margen que pagaría un usuario final de mangomundi** — un
cliente institucional grande con volumen no paga lo mismo que una persona
enviando una remesa individual. Documentar esto como "el costo mayorista
de base de CAB Payments", útil como referencia de la estructura de costos
de la industria, pero no cargar directamente como si fuera un
`spread_percent` consumer-facing.

### 9.5 Barrido adicional de corredores — sin candidatos nuevos fuertes

India→Nepal (dominado por bancos indios — Punjab & Sind Bank, SBI-Nepal
Express Remit, Punjab National Bank, Bank of India, Bank of Baroda, State
Bank of India, ICICI Money2World — sin fintechs dedicadas, corredor barato
en el extremo bajo por ser un corredor bancario maduro con tratado de
frontera abierta) y Sudáfrica→Nigeria (Mama Money sigue siendo la opción
más barata a 3,46%; apareció un nombre nuevo, **Sikhona Money Transfers**,
pero con costo alto — 7,40% — no destaca como candidato) no arrojaron
candidatos fuertes nuevos. Se documenta para no reintentar estos dos
corredores en vano — ya están efectivamente cubiertos por lo que hay.

### 9.6 Resumen de esta tercera ronda

El hallazgo más valioso de las tres rondas de hoy juntas es metodológico,
no un proveedor puntual: **dos proveedores "amplios" (Xoom, TransferGo)
confirmaron que su margen varía fuerte por corredor específico**, y
**MoneyGram mostró un caso donde "promocional + fee cero" resultó ser una
oferta cara** (rompiendo el patrón asumido hasta ahora de que promocional
siempre es favorable). Ambos hallazgos apuntan en la misma dirección:
**cargar un solo número por proveedor y asumir que representa a todos sus
corredores es un riesgo real de sobre-simplificación** — hay que preferir
mediciones específicas por corredor, con `verified_status` reflejando
exactamente qué se midió y qué no.

---

## 10. Cuarta ronda del mismo día — SBI Remit con más contexto, y 2 candidatos verificados en vivo

### 10.1 SBI Remit — el mismo patrón de variación por corredor, ahora confirmado también acá

Sumé 2 corredores más de World Bank (Japón→Brasil y Japón→China) al dato
de Japón→Filipinas de la ronda anterior:

| Corredor | Costo total SBI Remit | Margen SBI Remit | ¿Cómo se compara? |
|---|---|---|---|
| Japón→Filipinas | (implícito ~2,25% peor que Wise) | — | Notablemente peor que Wise |
| Japón→Brasil | 7,40-7,42% | 1,52-1,54% | Peor que Wise (2,36%) y que Brastel Remit (6,45%) |
| **Japón→China** | **1,96-3,57%** | **0,86%** | **Mejor que Western Union, Seven Bank, MoneyGram y JRF** — la opción más barata del corredor |

**Esto cambia la conclusión de la Sección 8.5.** No es que "SBI Remit sea
malo" en general — es el mismo patrón que ya vimos con Xoom y TransferGo:
**su competitividad varía fuerte según el país de destino.** Es cara en
Filipinas y Brasil, pero es la opción más barata en el corredor a China.
Japón→Perú se reintentó pero el panel de World Bank está vacío para ese
corredor (mismo problema de siempre — "First Quarter 1970" — no es la
herramienta). **Recomendación:** si se carga SBI Remit, hacerlo corredor
por corredor, nunca con un número único — cuarto proveedor (junto a Xoom,
TransferGo, y ahora SBI Remit) donde este patrón se confirma.

### 10.2 MoneyGram Rumania→Moldavia — la tasa regular sigue sin poder verse

Intenté cambiar el monto de la calculadora en la página de corredor
(a 5.000 RON, para ver si por encima del tope promocional aparecía la
tasa regular, como pasó con el ejemplo de España→Marruecos donde el sitio
mostraba ambas tasas lado a lado). **No se pudo** — el campo de monto en
esta página específica resultó no ser editable (a diferencia del
calculador completo de España→Marruecos, este es un widget de vista previa
más simple, de solo lectura para el monto). La tasa regular de
Rumania→Moldavia sigue sin conseguirse — mismo tipo de límite que Remitly/
WorldRemit (necesita cuenta), aunque acá ni siquiera está claro que el
sitio la muestre sin loguearse en ningún escenario.

### 10.3 InstaReM — verificado en vivo, con una corrección importante a la Sección 8.3

Medí Reino Unido→India en vivo (`instarem.com`, sin login):

> 1.000 GBP → 127.828 INR · Tasa: 1 GBP = 127,3159 INR (monto chico) / ~127,828
> efectivo para 1.000 GBP · Comisión: 0 GBP (transferencia bancaria)

Mid-market de referencia (xe.com): 1 GBP = 128,2247 INR. **Margen real
para 1.000 GBP: (128,2247-127,828)/128,2247 ≈ 0,31%.** Consistente con el
0,09% medido en Australia→Filipinas la ronda anterior — confirma que
InstaReM es un candidato genuinamente competitivo, en la liga de Wise.

**Corrección a la Sección 8.3:** ahí decía "no se encontró mecanismo de
tasa promocional tipo bienvenida" — **eso estaba incompleto.** La página
en vivo muestra un banner: *"Making your first transfer? Get a special FX
rate + zero fees! Send between GBP 1 and GBP 1.500 today."* — **InstaReM sí
tiene un mecanismo promocional de primera transferencia**, igual que
Remitly/WorldRemit/RemitBee. La buena noticia es que, a diferencia de esos
casos, **la tasa "regular" que medí acá (sin activar la promoción) ya es
competitiva por sí sola** (0,31% de margen) — no depende de la promoción
para ser una buena opción. Pero para cargar el dato correcto a
`fx_rates`, hay que asegurarse de que sea la tasa regular y no la
promocional de bienvenida.

### 10.4 RemitBee — verificado en vivo, con las dos tasas visibles al mismo tiempo

Medí Canadá→India en vivo (`remitbee.com`, sin login) — y acá la página sí
mostró **ambas tasas simultáneamente**, con el mismo mecanismo transparente
que vimos en MoneyGram España→Marruecos:

| | Tasa (1 CAD =) | Etiqueta |
|---|---|---|
| Regular | 67,8791 INR | (implícita, sin etiqueta) |
| 🎁 Promocional | 70,8791 INR | "Promotional rate" + "Free first transfer" |

Mid-market de referencia (xe.com): 1 CAD = 68,1988 INR.

- **Margen regular: (68,1988-67,8791)/68,1988 ≈ 0,47%** — buen dato,
  consistente con el rango ya visto en World Bank para RemitBee
  (Canadá→Filipinas: 0,64-0,82% de margen). RemitBee confirma ser un
  candidato de precio medio-bueno, no tan agresivo como Wise/InstaReM pero
  razonable.
- **Tasa promocional: ~3,93% mejor que mid-market**, con primera
  transferencia sin comisión — un ejemplo más, bien limpio, del mecanismo
  promocional "de manual" (fee cero + tasa mejor, las dos cosas juntas) —
  a diferencia del caso raro de MoneyGram Rumania→Moldavia (Sección 9.2),
  acá SÍ es una oferta genuinamente buena para el cliente nuevo.

### 10.5 Skrill Money Transfer — sin cotización en vivo posible

`transfers.skrill.com` no tiene un calculador público visible sin
registrarse — solo contenido de marketing. No se pudo verificar el 0,69%
de margen de World Bank con una medición propia esta ronda. Se mantiene el
dato de la Sección 3.2 (0,69% margen, 1,35% costo total, Alemania→India)
como la mejor fuente disponible.

### 10.6 Resumen de esta cuarta ronda

Dos cosas importantes: **(1)** SBI Remit se suma a la lista de proveedores
con margen altamente variable por corredor (junto a Xoom y TransferGo) —
ya son 3 casos confirmados del mismo patrón, lo cual lo convierte en una
regla general a tener en cuenta para cualquier proveedor "amplio" del
proyecto, no una excepción. **(2)** InstaReM y RemitBee quedaron
verificados en vivo con datos propios (no solo de World Bank) — ambos
confirman ser candidatos reales y razonablemente competitivos, y ambos
resultaron tener mecanismo de tasa promocional de bienvenida (uno no
detectado antes, en el caso de InstaReM) — hay que tener cuidado de cargar
la tasa regular y no la promocional para los dos.

---

## 11. Quinta ronda del mismo día — testeando la hipótesis en Ria y MoneyGram, proveedores que YA están cargados

### 11.1 Ria y MoneyGram: variables, pero de una forma distinta a Xoom/TransferGo/SBI Remit

Hasta acá el patrón de "margen variable" se había confirmado en 3
proveedores que en general se cargan con un solo número (Xoom, TransferGo,
SBI Remit). Faltaba testear si esto también aplica a los 2 proveedores más
grandes y ya completamente cargados en la base — Ria y MoneyGram — porque
si les pasa lo mismo, el impacto práctico es mucho mayor.

**Ria**, en 3 corredores (World Bank, Q3 2025):

| Corredor | Margen |
|---|---|
| US→México | 1,24% |
| US→Nigeria | 0,76-1,00% |
| España→Colombia | 1,44% |

Rango: 0,76%-1,44% — varía, pero dentro de una banda razonable (menos de
2x de diferencia entre el mínimo y el máximo). **Mucho menos dramático que
Xoom (de -0,42% a 4,49%, más de 10x de rango).**

**MoneyGram**, en los mismos 3 corredores:

| Corredor / método | Margen |
|---|---|
| US→México (cuenta bancaria) | 0,76% |
| US→Nigeria (tarjeta de débito) | **-0,28%** |
| US→Nigeria (tarjeta de débito, monto mayor) | 0,01% |
| España→Colombia (efectivo, agente) | -0,03% |
| España→Colombia (tarjeta, internet) | -0,05% a -0,06% |

**Acá el patrón es distinto: no varía tanto por corredor como por MÉTODO
DE PAGO.** Los métodos de tarjeta/internet de MoneyGram consistentemente
dan márgenes cercanos a cero o negativos (mejores que mid-market), mientras
que efectivo/agente es más caro. Esto es un hallazgo más específico y
accionable que "varía por corredor" — **para MoneyGram, lo que hay que
fijar al cargar el dato no es tanto el corredor sino el método de pago y
entrega exactos.**

**Conclusión combinada:** Ria parece razonablemente estable (variación
moderada, se podría tratar con un rango tipo Airwallex/OFX en vez de un
número fijo). MoneyGram varía fuerte pero de forma predecible (por
método de pago, no tanto por corredor) — más fácil de modelar que Xoom.
Ninguno de los dos llega al nivel de imprevisibilidad de Xoom/TransferGo/
SBI Remit, que son los que de verdad ameritan `verified_status` corredor
por corredor.

---

## 12. Sexta ronda del mismo día — cambio de método: blogs, reviews y foros en vez de calculadoras oficiales

Pedido explícito del usuario esta ronda: en vez de seguir insistiendo con
calculadoras oficiales (que ya demostraron sus límites: geo-bloqueo,
requerir cuenta, calculadoras rotas o de solo lectura), buscar en blogs,
comentarios y sitios de reviews las tasas que quedaban sin poder
conseguirse por la vía oficial. Los 4 pendientes que se atacaron: (a)
Remitly/WorldRemit España→Argentina, tasa regular (no promocional); (b)
Global66, cualquier cotización real; (c) MoneyGram Rumania→Moldavia, tasa
regular; (d) Skrill Money Transfer, fee/margen exacto del producto
correcto.

### 12.1 Global66 — primer número concreto de todo el proyecto para este proveedor

Búsqueda de foros/reviews en español (`Global66 Argentina foro comentarios
tasa cambio opinion`). Tres resultados de interés:

- **`tiempofinanciero.com.ar`** (sitio de reviews de billeteras virtuales
  argentinas): declara que Global66 cobra **un margen cambiario máximo del
  2%** sobre la tasa, y que las operaciones que involucran pesos
  argentinos tienen **comisión de intercambio cero** (aunque esto último
  es ambiguo — puede referirse solo a la comisión fija, no al spread
  cambiario, que seguiría existiendo dentro de ese 2% máximo declarado).
- **`blog.remesas.com`** (nota de reviews genérica): sin cifras
  específicas para Argentina — solo testimonios cualitativos tipo "el
  tipo de cambio real, sin cuentos" y comparaciones informales con
  Remitly/Western Union, sin números. Los ejemplos concretos que da son
  de Colombia, Perú, Chile, Ecuador y Brasil, no Argentina.
- Búsqueda directa en Reddit (`site:reddit.com Global66 Argentina`, ya
  intentada en la ronda anterior): sin resultados relevantes, confirmado
  de nuevo.

**Conclusión:** el 2% máximo declarado por tiempofinanciero.com.ar es la
**primera cifra concreta que aparece para Global66 en todo el proyecto**,
después de que la calculadora del propio sitio se confirmara rota por 3
vías distintas (páginas de conversión, sub-páginas de corredor específico,
y ahora esta ronda también sus páginas `/precio/`). No es un dato
verificado en vivo ni de fuente oficial — es la estimación de un sitio de
reviews de terceros — así que si se carga a la base debería ir con
`verified_status: estimado` o equivalente, dejando claro que es un techo
declarado (2%) y no un margen medido.

### 12.2 Skrill — 3 fuentes de terceros más, mismo problema de siempre (no distinguen el producto correcto)

Búsqueda (`Skrill Money Transfer reddit fee percentage real experience`) y
fetch de 3 páginas:

- **`wise.com/gb/blog/skrill-money-transfer`** (blog de Wise, un
  competidor — fuente independiente de Skrill): "Skrill international
  transfers have a mark-up of 4.99% per transaction" y "For any
  transactions involving a currency conversion, Skrill adds a fee of
  3.99% to its exchange rates" — sin distinguir wallet vs. transfer
  dedicado.
- **`transferfees.io/skrill-fee-calculator`**: "exchange rate mark-up is
  up to 4.99%" (varía por país — 3,99% en EEUU/Alemania, 4,99% en
  Reino Unido/India) y fee de envío "free by bank transfer, up to 1% by
  debit card... up to 2.99% by credit card". Tampoco distingue producto.
- **`idealremit.com`** (review dedicada a Skrill): "el margen sobre tipo
  de cambio se ubica entre 3,99% y 4,99% sobre la tasa mid-market" —
  confirma explícitamente que la nota **no distingue** wallet de Money
  Transfer, tratándolos como un servicio único.

**Conclusión:** con esto son ya 6 fuentes independientes en total a lo
largo del proyecto (3 páginas propias de Skrill en rondas anteriores + 3
blogs de terceros esta ronda) que reportan el 2,99%-4,99% **sin nunca
aislar el producto `transfers.skrill.com`**. Esto no es una casualidad de
búsqueda — es evidencia acumulada de que el mercado (reviews, comparadores,
blogs) simplemente no diferencia los dos productos de Skrill, algo que
solo se pudo resolver antes navegando directamente al calculador de
`transfers.skrill.com` y viendo el dato de World Bank (0,69%, Alemania→
India). **Ese 0,69% sigue siendo el único número confiable y específico
del producto correcto** — no apareció nada mejor ni por esta vía.

### 12.3 Remitly/WorldRemit y MoneyGram Rumania→Moldavia — sin números nuevos, cerrados por esta vía también

Para estos dos pendientes se probaron varias búsquedas:

- `site:reddit.com Remitly Argentina transferencia` y
  `site:reddit.com Global66 Argentina` (ronda anterior): sin resultados.
- `"remitly" argentina tasa "segundo envio" OR "cliente recurrente" 2026`:
  sin resultados directamente útiles — no aparecieron testimonios con
  cifras.
- `worldremit "existing customer rate" reddit complaint worse` y
  `Trustpilot WorldRemit review "exchange rate" existing customer worse`:
  devolvieron enlaces a Trustpilot, BBB, Resolver UK, SmartCustomer,
  PissedConsumer, ComplaintsBoard, us-reviews.com — pero **Trustpilot
  bloquea el fetch automatizado con error 403** (confirmado al intentarlo
  directamente), y una revisión previa (Sección 3, addendum v8) ya había
  encontrado que Wise documentó explícitamente que Remitly retiene la
  tasa regular hasta mitad de la transacción — confirma estructuralmente
  por qué no hay número público, no solo que sea difícil de encontrar.
- `PissedConsumer Remitly "exchange rate" second transfer complaint`:
  devolvió reseñas de Remitly en Pissed Consumer, pero sobre demoras y
  problemas de servicio, no sobre cifras de tasa de cambio específicas.

**Conclusión:** ninguna búsqueda por blogs, foros o reviews produjo un
número utilizable para estos dos pendientes. Se confirma con esto, por una
vía completamente distinta a los intentos anteriores (calculadoras
oficiales, cuentas, geolocalización), que **ambas tasas regulares son
estructuralmente no públicas** — no es que falte buscar más, es que
Remitly/WorldRemit y MoneyGram no las exponen fuera de una sesión logueada
con cuenta real. Dado que esta sesión tiene la regla de no loguearse en
cuentas ni usar credenciales, **estos dos pendientes quedan cerrados
definitivamente** salvo que el usuario consiga el dato por su cuenta
(por ejemplo, con una captura de pantalla de su propia cuenta).

### 12.4 Resumen de esta sexta ronda

Balance de la ronda: 1 de 4 pendientes con progreso real (Global66, primer
número del proyecto, aunque no verificado en vivo), 1 de 4 con
confirmación reforzada de un límite ya conocido (Skrill — 6 fuentes
independientes coinciden en que nadie distingue el producto correcto), y 2
de 4 cerrados definitivamente sin número (Remitly/WorldRemit y MoneyGram
RO-MD), con evidencia acumulada de que son estructuralmente inalcanzables
sin cuenta. **Con esto se agota razonablemente la vía de blogs/foros/
reviews para los pendientes de esta lista** — seguir insistiendo por este
camino específico no parece que vaya a producir más resultados; el research
de esta línea de pendientes está, en la práctica, tan completo como puede
estar sin acceso a una cuenta real.

### 11.2 MoneyGram Rumania→Moldavia — la tasa regular queda confirmada como inalcanzable sin cuenta

Último intento: revisé si el link "Send money online" del corredor llevaba
a un flujo de cotización más completo. Lleva a una página genérica de
producto (`/ro/en/send-and-receive/money-transfers-online`), no a una
calculadora del corredor específico. El único camino que queda para
avanzar (crear cuenta) está fuera de las reglas de esta sesión. **Se cierra
este pendiente en el mismo estado que Remitly/WorldRemit ES→AR: la tasa
regular solo la puede conseguir alguien con una cuenta real.**

### 11.3 Skrill — confirmado (otra vez) que el 2,99%/3,99% es de la billetera, no del transfer

La página de fees de Skrill (`skrill.com/en/siteinformation/fees/`)
confirma de nuevo que el 2,99% (fee de envío) + 3,99% (fee de conversión)
son específicamente para transferencias **Skrill-to-Skrill** (la
billetera) — no para el producto de Money Transfer. Esto refuerza, con una
tercera fuente independiente, la separación ya documentada en la Sección
3.2. No hay una fuente pública con el fee explícito del producto de
transferencias — el dato de World Bank (0,69% margen) sigue siendo el
mejor disponible.

### 11.4 Resumen de esta quinta ronda

El aporte más importante: probar la hipótesis de "margen variable" contra
proveedores que **ya están cargados en la base real de mangomundi** (Ria,
MoneyGram), no solo contra candidatos nuevos. El resultado es matizado —
sí varían, pero no todos de la misma manera ni al mismo nivel. Esto da una
recomendación más precisa que "desconfiar de todo": **Xoom, TransferGo y
SBI Remit necesitan verified_status por corredor específico; MoneyGram
necesita distinguir por método de pago/entrega; Ria puede tratarse con un
rango moderado; Wise sigue siendo el más consistente de todos** (margen
~0% en cada medición del proyecto hasta ahora, sin excepciones).
