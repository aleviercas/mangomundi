# Venezuela y Asia Central/Cáucaso — profundización 2026-09-10

> Continuación directa de `2026-09-09-research-v26-tanzania-venezuela-asia-central.md`.
> Ese research dejó dos líneas abiertas: Venezuela con una cifra sospechosa de ser
> promocional, y Asia Central/Cáucaso sin ninguna fuente medible. Esta sesión resuelve
> la primera y profundiza la segunda con un hallazgo negativo concreto.

---

## 1. Venezuela — resuelto: la fila vieja Y la recalculada de v26 eran ambas la tasa promocional

### 1.1 El hallazgo

Remitly (el único proveedor con presencia en el corredor EEUU→Venezuela) tiene una
tasa "welcome rate" de primera transferencia — fee $0, tasa de cambio igual o mejor
que el mid-market — que aplica a **cualquier corredor** de Remitly, no solo Venezuela
(confirmado en MXN, INR, VND, EUR y corroborado independientemente por
`wise.com/us/blog/remitly-fees`). La promoción tiene un tope explícito: **los primeros
1.000 USD enviados**.

Esto significa que **dos números ya cargados o propuestos para esta fila eran la
misma tasa promocional, no la regular**:

- La fila original en `fx_rates` (fee $0, spread 3%, fuente World Bank RPW Q3 2025,
  `confirmado_activo`) — coincide exactamente con la firma de la promo (fee $0).
- El recálculo del research v26 (−0.45%, también con fee $0) — mismo problema, solo
  que corregido contra el dólar paralelo en vez del oficial. La corrección de
  referencia cambiaria fue correcta; el dato de entrada (la tasa promocional) no.

Downgradeada a `sin_confirmar` el 2026-09-10 (migración
`downgrade_remitly_ves_suspect_promo_fee`), sin cargar ningún número nuevo hasta
conseguir una medición genuina de la tasa regular.

### 1.2 La medición regular, resuelta el mismo día

`monito.com/send-money/united-states/venezuela/usd/ves` muestra **las dos líneas en
la misma tarjeta** para un envío de 100 USD:

| | Promocional (1ª transferencia) | **Regular** |
|---|---|---|
| Fee | 0 USD | **1.99 USD** |
| Tasa | 931.48 VES/USD | **904.35 VES/USD** |
| Recibe | 93.148 VES | **88.635 VES** |

La línea regular es un dato primario real, no una aproximación — viene explícitamente
etiquetada como tal por el propio proveedor vía Monito, la misma fuente que el
research original.

### 1.3 El mismo problema metodológico del ARS, confirmado también para VES

El "mid-market" que la tarjeta de Monito muestra (821.6859 VES/USD, fuente XE) es
prácticamente idéntico al tipo **oficial** de `ve.dolarapi.com` (820.1018) — no al
paralelo (945.976898, mismo momento). Usar ese "mid-market" como referencia da un
margen de −7.87% (negativo, sin sentido) para la tasa regular; usar el paralelo da
**+6.30%**, positivo y coherente con el resto de corredores de Remitly ya cargados en
el proyecto.

```
costo_real = 1 − recibido/(monto × tipo_cambio_medio)
           = 1 − 88.635/(100 × 945.976898)  = 6.30%   (vs. paralelo — correcto)
           = 1 − 88.635/(100 × 821.6859)    = −7.87%  (vs. XE/oficial — engañoso)
```

**Cargado a Supabase** (migración `load_remitly_ves_regular_rate_via_dolarapi_paralelo`,
2026-09-10): fee 1.99, rate 904.35, `public_spread_percent` 6.30%,
`verified_status='confirmado_activo'`. Resuelve la marca de "necesita re-medición"
dejada por el downgrade de la mañana.

### 1.4 Nota para la próxima auditoría de Bolivia/Argentina

El mismo patrón (Monito muestra promo y regular en la misma tarjeta cuando el
proveedor tiene esa política) puede estar presente en otras filas de este proyecto
que se cargaron mirando solo un monto. Vale la pena, en la próxima ronda grande,
revisar específicamente si algún otro `fee=0` "sospechoso" de un proveedor que sí
tiene política de primera-transferencia (Remitly, MoneyGram ya tiene 2 casos
documentados) esconde el mismo problema.

---

## 2. Asia Central/Cáucaso — profundizado: no es solo falta de cobertura de Monito

### 2.1 KoronaPay Europe — confirmado el cierre completo, no solo "en proceso"

El research v26 (2026-09-09) encontró que KoronaPay Europe estaba retirando su
autorización regulatoria. Una búsqueda de seguimiento el mismo período confirma que
el cierre **ya se completó**: transferencias nuevas no disponibles desde agosto de
2026, cese permanente de operaciones por sanciones de la UE — incluyendo la
suspensión específica hacia Georgia (confirmada por fuente independiente, civil.ge,
24-jul-2026) tras las sanciones de la UE contra Zolotaya Korona.

### 2.2 Intento de alternativa: Profee — no sirve para el corredor real

Se identificó **Profee** (EMI regulada por el Banco Central de Chipre, transferencias
tarjeta-a-tarjeta) como alternativa potencial: su propio sitio lista Uzbekistán,
Kazajistán, Georgia, Armenia, Kirguistán y Azerbaiyán entre sus destinos.

**Pero Profee no soporta Rusia como país de origen.** Se verificó directamente: la URL
`profee.com/send-money/from-russia-to-uzbekistan` **redirige automáticamente** a
`from-finland-to-uzbekistan` — el sitio ni siquiera muestra un error, simplemente
sustituye el origen por otro país sin avisar. Esto confirma con evidencia directa (no
solo ausencia de datos) que el patrón es estructural: **ningún fintech occidental
licenciado indexado por Monito, ni Profee como alternativa nativa-CEI con sede en la
UE, permite originar transferencias desde Rusia** — el país de origen real de la
inmensa mayoría de remesas hacia esta región (trabajadores migrantes).

### 2.3 Conclusión actualizada

La recomendación del research v26 ("marcar como cobertura no verificable por
disrupción de mercado, no seguir insistiendo con Monito") se sostiene y se refuerza:
no es que falte investigar más proveedores occidentales — es que **la exclusión de
Rusia como origen es sistemática entre los proveedores licenciados/indexados
occidentales**, confirmada ahora con una prueba directa (el redirect de Profee), no
solo con ausencia de resultados. Medir este corredor requeriría acceso a
proveedores nativos rusos/CEI (Zolotaya Korona previo al cierre, Unistream, Contact)
que no están indexados por ningún comparador occidental y cuyo acceso via scraping
plantea sus propias preguntas de viabilidad — fuera del alcance de la metodología de
este proyecto tal como está definida hoy.

**No se cargó ningún dato a Supabase para esta región** — no hay ninguna cifra
confiable con la cual hacerlo, consistente con el principio del proyecto de nunca
inventar un número donde no hay fuente real.

---

## 3. Estado de esta sesión

- Venezuela: **resuelto**, dato regular cargado y confirmado (`confirmado_activo`,
  6.30%).
- Asia Central/Cáucaso: **no resuelto, pero con un hallazgo negativo concreto y
  accionable** documentado — no seguir insistiendo con proveedores occidentales
  indexados por comparadores hasta que cambie el panorama regulatorio de Rusia, o
  hasta que se decida explícitamente investigar proveedores nativos CEI fuera de la
  metodología actual.
- `fx_rates`: 922 filas, sin cambios de conteo esta sesión (solo UPDATE de la fila de
  Venezuela).
