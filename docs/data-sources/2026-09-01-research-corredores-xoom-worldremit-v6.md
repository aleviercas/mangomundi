# mangomundi — Research para completar cobertura de proveedores (v6, consolidado)

> **Nota de estado (añadida 2-sep-2026, al exportar este research a
> Supabase):** de los hallazgos de este archivo:
> - **Xoom GB→Filipinas** (spread real ~2,89%, sin marca promocional): ya
>   existía en `fx_rates` una carga previa (25-ago-2026) de este mismo
>   corredor — rate 81.9466, fee 0.99, `confirmado_activo`. Esta nueva
>   medición (rate 81.9956, sin fee separado — método de cobro distinto,
>   probablemente billetera móvil vs. el banco/débito de la carga previa)
>   es consistente (diferencia <0.1% en la tasa) y **corrobora** que el dato
>   ya cargado no es promocional. No se sobrescribe — el valor existente
>   sigue siendo `confirmado_activo` y esta medición queda documentada acá
>   como la segunda muestra que la Sección 1.1 pedía antes de confiar en el
>   dato.
> - **WorldRemit GB→Filipinas** (cotización pública contaminada con tarifa
>   promocional "First Transfer Rate"): esto es un **hallazgo
>   metodológico**, no un dato de tarifa — no se carga nada a `fx_rates` por
>   esto. Point de atención para el futuro: las filas de WorldRemit
>   GBP→INR ya cargadas (25-ago-2026, `worldremit.com, cotizador sin
>   login`, `confirmado_activo`) **no documentan explícitamente** haber
>   descartado una tarifa promocional (a diferencia de las filas de Xoom de
>   la misma fecha, que sí lo dicen) — dado este hallazgo, esas dos filas
>   quedan marcadas aquí como **candidatas a re-verificación** en una
>   próxima sesión con acceso a browser en vivo. No se tocó su
>   `verified_status` en esta sesión por no tener forma de confirmar en vivo
>   si están o no contaminadas.
> - Todo lo demás de este archivo (Prex, MoneyGram ES→AR, Global66) sigue
>   sin cambios — ver Sección 3.

> **Este archivo reemplaza a `research-findings-2026-09-01-v5.md`.** Todo lo
> de v5 sigue acá, más una ronda adicional de verificación con browser real
> sobre Xoom y WorldRemit. Entregar solo este archivo — v5 queda obsoleto.

**Repo:** `aleviercas/mangomundi`. **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Fecha de investigación:** 1-sep-2026. **Fecha de export a Supabase:** 2-sep-2026.

---

## 0. Lo nuevo de esta ronda

1. **Xoom GB→Filipinas: primer dato limpio (no promocional) de un proveedor
   "amplio".** Fee $0, spread real ~2,89% vs. mid-market. A diferencia de
   Prex, Remitly y WorldRemit, esta cotización de Xoom **no tenía ninguna
   marca de "primera transferencia" ni promoción** — parece ser el precio
   regular. Ver Sección 1.1.
2. **WorldRemit confirma el mismo patrón de contaminación promocional que
   Remitly y el viejo caso de WU GB→AR.** La cotización pública de
   worldremit.com también viene marcada "First Transfer Rate 🎉" — no es la
   tarifa regular. Ver Sección 1.2. Esto generaliza el riesgo: **cualquier
   cotización pública de estos 3 proveedores (Remitly, WorldRemit, y
   probablemente otros) que no diga explícitamente "existing customer" hay
   que asumirla promocional hasta confirmar lo contrario.**
3. Prex: no se consiguieron corredores nuevos esta ronda — la calculadora
   mostró un popup de descarga de app que interrumpió la sesión de medición
   varias veces. Sigue en 2 corredores confirmados (US, ES) de los 15 del
   whitelist.
4. Remitly ES→AR y MoneyGram ES→AR: sin cambios, se reintentó Remitly con un
   monto de €5.000 (por encima del tope promocional de €1.000) para ver si
   mostraba una tarifa mixta/regular — el widget se queda anclado en la
   tarjeta promocional de €1.000 sin importar el monto ingresado. Confirmado
   bloqueado con este método.

---

## 1. Verificaciones con browser real

### 1.1 — Xoom GB→Filipinas: dato limpio

`xoom.com/philippines/send-money` mostró, sin necesidad de login ni tocar
nada (cotización por defecto de la página):

> Envío: £350 GBP → Recibe: ₱28.698,45 PHP · "Best Xoom Rate": 1 GBP =
> 81,9956 PHP · Sin línea de fee separada (350 × 81,9956 = 28.698,45 exacto,
> o sea el fee ya está adentro del margen cambiario, consistente con su
> propio texto: "We make money on the exchange rate").

Mid-market de referencia (xe.com, mismo momento): 1 GBP = 84,4339 PHP.
**Spread real: (84,4339-81,9956)/84,4339 ≈ 2,89%.**

Es bastante mejor que Prex (~10%) y da una primera pista de que el
spread de proveedores "amplios" establecidos (Xoom es de PayPal) puede rondar
el 2-3% en corredores de alto volumen — útil como punto de comparación para
cuando se evalúen otros datos "estimados" en la base.

**No tenía ninguna marca de promoción visible** — a diferencia de Remitly y
WorldRemit en las pruebas de esta sesión. Vale la pena confirmarlo con una
segunda medición en otro corredor antes de asumir que Xoom nunca usa tarifas
promocionales en su cotizador público.

### 1.2 — WorldRemit GB→Filipinas: mismo patrón de contaminación que Remitly

`worldremit.com/en/philippines` mostró:

> "First Transfer Rate 🎉" · 1 GBP = 84,5267 PHP · Fee: 0 GBP · Total a
> pagar: 1.000 GBP.

Comparado con el mid-market (84,4339 PHP) — otra vez, **la tasa "promocional"
es mejor que el mid-market**, confirmando que es un enganche para clientes
nuevos, no el precio real y recurrente. No se encontró una forma de ver la
tarifa regular en la página pública sin iniciar sesión con una cuenta
existente.

**Esto importa más allá de este corredor puntual:** ya son 3 proveedores
donde se confirmó el mismo patrón (WU GB→AR en la fase 1 original del
proyecto, Remitly ES→AR en v4, y ahora WorldRemit GB→PH). La regla práctica
para cualquier research futuro: **si una cotización pública dice "welcome",
"first transfer", "new customer" o trae un emoji/banner de bienvenida, no es
la tarifa regular — no cargar ese número sin buscar explícitamente la versión
para clientes existentes.**

---

## 2. Todo lo heredado de v5 sigue vigente sin cambios

Ver v5 (fusionado, no se repite): las 4 decisiones resueltas (Prex con nota,
`supported_sending_countries` confirmado, 7 proveedores informativos sin
link, Zing descontinuado), Prex AR→US y AR→España con spread ~10-11%,
programas de afiliados de los 8 cripto/telco/banco, y todo lo de v1-v4
(Ucrania, Golfo, Sudáfrica, CAB Payments, TapTap Send, Pangea/Kabayan/Aspora,
Moneycorp, Global66, `corridor_notes`, footprint de envío).

---

## 3. Plan priorizado — estado actual

### Tier 0, 3, 4, 5 — sin cambios de v5

### Tier 1 — Listo para migrar
Todo lo de v5 + **Xoom GB→Filipinas con spread real ~2,89%** (parece dato
regular, no promocional — igual conviene una segunda muestra antes de subirlo
a `confirmado_activo`). **Actualización 2-sep:** esa segunda muestra ya
existe (carga previa del 25-ago, ver nota de estado arriba) — el dato está
corroborado, no hace falta ninguna acción adicional.

### Tier 2 — Necesita browser real (lo que sigue bloqueado)
- MoneyGram ES→AR: sin cambios, sigue sin calculadora pública. **Ver el
  addendum v7 — se encontró el método, ejecución pendiente.**
- Remitly ES→AR regular: confirmado que ni con montos grandes (€5.000) se
  sale de la tarjeta promocional en la página pública — descartar este
  método, haría falta una cuenta real logueada.
- WorldRemit: **ahora confirmado contaminado con tarifa promocional**, mismo
  problema que Remitly — cualquier corredor de WorldRemit que se quiera
  cargar necesita buscar explícitamente la tarifa de cliente existente, no
  la que aparece por defecto.
- Global66 EUR→ARS: sin reintentar esta ronda.
- Prex: quedan 13 de 15 corredores del whitelist sin medir — la calculadora
  tiene un popup de descarga de app que interrumpe la sesión seguido, hace
  que sea lento medir uno por uno.

---

## 4. Resumen ejecutivo

**Nuevo dato limpio:** Xoom GB→Filipinas, spread ~2,89%, sin marca de
promoción.

**Nuevo hallazgo de patrón (no es un dato, es una alerta metodológica):**
WorldRemit se suma a la lista de proveedores cuya cotización pública por
defecto es promocional — junto con Remitly y el WU GB→AR original. Cualquier
carga futura de estos 3 proveedores desde su cotizador público tiene que
verificar explícitamente que no diga "primera vez"/"welcome"/"nuevo cliente".

**Sigue bloqueado, sin cambios:** MoneyGram ES→AR (ver addendum v7 — método
encontrado, ejecución pendiente), Remitly ES→AR regular (confirmado que ni
con montos grandes se resuelve), Global66 EUR→ARS (no reintentado), 13
corredores de Prex restantes.

---

## 5. Metodología

Igual que v4/v5 (browser real vía el puente al dispositivo). El mid-market de
referencia para Xoom/WorldRemit GBP-PHP viene de xe.com al mismo momento de
cada medición. Nada inventado.
