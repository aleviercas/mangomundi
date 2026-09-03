# mangomundi — Research, ADDENDUM a v6 (v7)

> **Nota de estado (añadida 2-sep-2026, al exportar este research a
> Supabase):**
> - **MoneyGram ES→Marruecos** (Sección 2): **cargado a `fx_rates`**
>   (migración `load_moneygram_es_ma_regular_rate_research_v7`) — rate
>   10.6929 MAD, fee 0.99 EUR, `sending_country='ES'`,
>   `receiving_country='MA'`, `verified_status='confirmado_activo'`. Es una
>   fila nueva, distinta de la que ya existía para EUR→MAD desde Francia
>   (`sending_country='FR'`, World Bank RPW Q3 2025, rate 10.741729) — no la
>   reemplaza. `public_spread_percent` (1.22%) se calculó contra un tipo de
>   cambio EUR/MAD de referencia de xe.com tomado el 1-sep-2026 (10.8254),
>   ya que el archivo original no citaba un mid-market explícito para este
>   corredor. La tarifa promocional (10.9105 MAD, fee 0) **no** se cargó,
>   siguiendo la recomendación explícita de la Sección 2.
> - **Xoom GB→México** (Sección 1): **no se modificó nada** — la fila que ya
>   existía en `fx_rates` para este corredor (25-ago-2026, rate 22.3822, fee
>   2.99, `confirmado_activo`, vía banco/débito) ya estaba en el nivel de
>   confianza más alto que usa esta base (`confirmado_activo` — no existe un
>   nivel `confirmado` intermedio; el nombre de la Sección 1 se refiere al
>   mismo tier). La medición de este archivo (rate 22.2496, sin fee
>   separado — método de cobro distinto) es una muestra real pero
>   discrepante de la ya cargada (fee 0 vs. 2.99, ~0.6% de diferencia de
>   tasa) — probablemente ambas son correctas para métodos de cobro
>   distintos de Xoom, que esta base no modela por separado. Se documenta
>   la discrepancia acá en vez de sobrescribir un dato ya confirmado con uno
>   que no se puede reconciliar sin volver a medir en vivo.
> - **MoneyGram ES→Argentina** (Sección 2): sigue sin cargarse — ver el
>   "Pendiente" de esa sección, no se pudo ejecutar por una falla de
>   herramienta durante esta ronda de research (no de esta sesión).

> **Este archivo NO reemplaza a `research-findings-2026-09-01-v6.md`.** Es un
> agregado corto: vos ya le mandaste v6 al otro Claude para cargar, así que
> este archivo solo documenta **lo nuevo desde entonces** — no repite nada de
> v6. Para cargar: usar v6 + este addendum juntos. Si el otro Claude ya
> arrancó a cargar v6, esto se puede sumar como un segundo batch sin
> conflicto (son corredores/hallazgos distintos a lo que ya estaba en v6).

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha de investigación:** 1-sep-2026. **Fecha de export a Supabase:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda (resumen)

1. **Xoom GB→México: segundo dato limpio, confirma el patrón GB→Filipinas.**
   Spread ~3,07%, fee $0, sin marca promocional. Con dos corredores
   consistentes (~2,9% y ~3,1%), ya es razonable tratar a Xoom como un
   proveedor con spread real ~3% y no como "estimado". Ver Sección 1.
2. **MoneyGram: encontrado el patrón de URL que sí expone la calculadora
   pública** (`moneygram.com/mgo/{lang}/{lang}/m/envia-dinero-a-{pais}/`),
   algo que en v4/v5/v6 se había dado por bloqueado. Se demostró el
   mecanismo completo de tasa regular vs. promocional con datos reales
   (España→Marruecos), lo cual es la confirmación más clara hasta ahora de
   cómo MoneyGram contamina sus cotizaciones públicas con tarifas de
   bienvenida. Ver Sección 2.
3. **España→Argentina en MoneyGram: todavía NO se consiguió.** Se encontró
   el link directo (`.../m/envia-dinero-a-argentina/`) para intentarlo sin
   pelear con el combobox de país (que había resultado muy inestable), pero
   la herramienta de browser empezó a fallar con timeouts de servicio
   (clasificador de seguridad temporalmente no disponible) justo antes de
   poder navegar ahí, y siguió fallando en 3 reintentos espaciados. **Esto
   quedó abierto para la próxima ronda** — el link ya está listo, solo hace
   falta navegar y leer.
4. Por el mismo problema de herramienta, esta ronda no se pudo reintentar
   Prex (13 corredores pendientes) ni Global66 — quedan exactamente igual
   que en v6.

---

## 1. Xoom GB→México: segundo punto de comparación

`xoom.com/mexico/send-money` (cotización por defecto, sin login):

> Envío: £350 GBP → Recibe: $7.787,36 MXN · Tasa: 1 GBP = 22,2496 MXN · Sin
> fee separado (350 × 22,2496 = 7.787,36 exacto → fee embebido en el margen
> cambiario, igual que en el corredor GB→Filipinas).

Mid-market de referencia (mismo momento): 1 GBP = 22,9532 MXN.
**Spread real: (22,9532-22,2496)/22,9532 ≈ 3,07%.**

Sin ninguna marca de "primera transferencia" ni promoción visible — igual
que el corredor GB→Filipinas (~2,89%). **Con dos mediciones consistentes en
corredores distintos, el spread de Xoom (~2,9-3,1%) ya se puede tratar como
un dato confiable del proveedor**, no solo un punto suelto. Recomendación:
si se carga a `fx_rates`, usar `verified_status='confirmado'` en vez de
`sin_confirmar` para estos dos corredores puntuales (GB-PH, GB-MX), y seguir
tratando el resto de los corredores de Xoom como estimado hasta medirlos.

---

## 2. MoneyGram: patrón de URL que desbloquea la calculadora pública

**Hallazgo clave:** `moneygram.com` a secas (geolocalizado a España) no
tiene calculadora — solo "Descargate la app"/"Regístrate". Pero existe un
patrón de URL de landing pages por país que sí carga una calculadora
funcional:

```
https://www.moneygram.com/mgo/es/es/m/envia-dinero-a-{pais-en-español}/
```

Confirmado funcionando para Marruecos (aunque se llegó por otro camino, vía
`/mgo/es/es/send-money/argentina` que — de forma rara — mostraba Marruecos
por defecto en vez de Argentina). Esta ronda, desde la home de
moneygram.com se encontró el link directo y correcto para Argentina:

> `https://www.moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/`

(mismo patrón debería andar para cualquier país: `.../envia-dinero-a-chile/`,
`.../envia-dinero-a-mexico/`, etc. — la home tiene los links a los ~13 países
LatAm que MoneyGram soporta desde España, todos listados al pie de página).

### Mecanismo regular vs. promocional, demostrado con datos reales (España→Marruecos)

La calculadora muestra **las dos tasas al mismo tiempo, una al lado de la
otra**, lo cual es la evidencia más clara conseguida hasta ahora de cómo
funciona la contaminación promocional:

| | Tasa | Cargo | Total que recibe (1.000 EUR) |
|---|---|---|---|
| Regular | 1 EUR = 10,6929 MAD | 0,99 EUR | 10.692,90 MAD |
| Promocional ("primera transferencia online") | 1 EUR = 10,9105 MAD | 0 EUR (ahorra 0,99 EUR) | 10.910,50 MAD |

Texto legal de la propia página: *"1. Precio aplicable únicamente a la
primera transferencia online. 2. Algunos países no pueden optar a las
promociones de tipo de cambio."*

**Esto confirma, con un caso donde MoneyGram muestra explícitamente ambos
números, exactamente el mecanismo que se venía sospechando por inferencia
en Remitly y WorldRemit** (spread mejor que mid-market + fee de $0 =
señal de promoción). Acá no hace falta inferir nada: MoneyGram lo dice con
todas las letras y muestra el tachado.

**Implicación práctica para carga de datos:** cuando se cargue MoneyGram a
`fx_rates`, la fila "regular" (10,6929 MAD, con cargo de 0,99 EUR) es la que
corresponde a `verified_status='confirmado'` para uso recurrente — la fila
promocional NO debería cargarse como tarifa estándar del proveedor.

### Pendiente: España→Argentina

No se pudo completar esta ronda por la falla de herramienta descripta en la
Sección 0. **Próximo paso concreto:** navegar a
`https://www.moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/` y leer la
tasa regular vs. promocional + cargo, igual que se hizo para Marruecos. Es
la tarea de más alta prioridad para la próxima ronda porque ya está
resuelto el "cómo" — solo falta ejecutarlo.

---

## 3. Sin cambios esta ronda (documentado en v6, no reintentado)

- Prex: siguen 13 de 15 corredores del whitelist sin medir (DE, FR, IT, PT,
  MX, BR, CO, BO, PY, VE, PE, UY, CL).
- Global66 EUR→ARS: calculadora nunca cargó en los intentos previos, no se
  reintentó esta ronda.
- Remitly ES→AR regular: sigue confirmado que no se puede ver sin cuenta
  logueada (ver v6).

---

## 4. Plan actualizado — solo los cambios

**Tier 1 (listo para migrar):**
- Xoom GB→México, spread ~3,07% — ver nota de estado arriba (no se
  modificó: la fila ya cargada está en un nivel de confianza igual o mayor
  al recomendado).
- MoneyGram ES→Marruecos: tasa regular 10,6929 MAD, cargo 0,99 EUR — **ya
  cargado**, ver nota de estado arriba. (La tasa promocional NO se cargó
  como tarifa estándar — ver nota metodológica de la Sección 2.)

**Tier 2 (necesita browser real), actualizar:**
- MoneyGram ES→AR: ya no está "bloqueado sin método" — está "método
  encontrado, ejecución pendiente por falla de herramienta". El link exacto
  para retomar está en la Sección 2.
- Todo lo demás de Tier 2 en v6 sigue igual (Prex, Global66, WorldRemit,
  Remitly).

---

## 5. Nota sobre esta ronda

La ronda de investigación pedida ("continuar con una ronda mas de
investigacion") quedó parcialmente completa: se consiguieron los dos
hallazgos de la Sección 1 y 2 antes de que la herramienta de browser
empezara a fallar de forma sostenida (3 reintentos con esperas de 15-40
segundos, todos con el mismo error de "clasificador de seguridad
temporalmente no disponible" — es un problema del lado del servicio, no del
sitio web ni de la cuenta). Cuando la herramienta se recupere, retomar
directamente por España→Argentina en MoneyGram (Sección 2) y después seguir
con los corredores de Prex pendientes.
