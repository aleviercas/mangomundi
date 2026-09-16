# Implementación — estado real (revisado contra el código) — 2026-09-16

> Empezó a implementar el plan del 15-sep. Dos piezas quedaron listas y verificadas
> (typecheck + lint limpios). La tercera (puente cripto) reveló un problema de
> arquitectura real al revisar el código — no se fuerza nada que no vaya a
> funcionar de verdad.

---

## 1. Badge promocional — implementado y verificado

`providers.promo_text` cargado para `remitly`, `moneygram`, `dahabshiil` (migración
`load_promo_text_confirmed_providers`). El código que lo renderiza ya existía y
está correcto — confirmado leyendo `ComparatorSection.tsx` línea ~5669 (badge con
ícono Sparkle, prefijo `t("comparator.badge.promoPrefix")`="Promo:") y
`fx.functions.ts` línea ~958 (`rows.sort((a,b)=>b.received-a.received)`, que usa
la tasa regular, nunca promocional). **Listo — nada más que hacer acá.**

Limitación documentada en la migración: `promo_text` es un campo de texto simple
sin variante por idioma (a diferencia del resto de la copy, que pasa por `t()`)
— se cargó en español. Si en algún momento importa que respete el idioma activo,
hace falta una columna JSONB por-locale — fuera de alcance de esta carga.

## 2. Referencia cripto ARS — utilidad aislada, construida y verificada

Nuevo archivo `src/services/providers/argentinaDatosCripto.ts` — una función
`fetchCriptoArsRate()` que llama a `api.argentinadatos.com/v1/cotizaciones/dolares/cripto`
y devuelve `{compra, venta, fecha}`. `npm run typecheck` y `npx eslint` sobre el
archivo, ambos limpios.

**Decisión de diseño importante, distinta de lo que decía el plan del 15-sep**: NO
se agregó como una entrada más en `FX_PROVIDERS` (`providers.config.ts`). Al leer
`fxProviders.ts` con cuidado, cada provider ahí devuelve un **mapa completo de
todas las monedas** y el factory los usa como reemplazo total unos de otros en caso
de falla (`rate_cache` es una sola fila global). ArgentinaDatos solo conoce ARS —
si alguna vez se volviera el proveedor activo en esa cadena, rompería el cálculo de
cualquier corredor que no sea ARS. Por eso quedó como una función aislada,
consumida solo por la feature de cripto, nunca por el cálculo general del
comparador.

**Lo que falta**: esta función existe pero **todavía no está conectada a ninguna
UI** — ver Sección 3.

## 3. Puente cripto — bloqueado, con una razón concreta (no una excusa)

Antes de tocar `ComparatorSection.tsx` revisé el tipo real de los datos que fluyen
por el comparador, y encontré dos cosas que el plan del 15-sep no había
contemplado:

### 3.1 `ComparisonRow` no tiene `to_currency`

La moneda de destino (`quote`) se fija **una sola vez por consulta completa**
(`ComparisonResult.quote`, `fx.functions.ts` línea ~205), no por fila. Esto
significa que "cripto como filtro de método de entrega" (la propuesta del 13-sep)
**no puede funcionar como filtro dentro de la misma lista** — una fila en USDT
necesita su propia consulta (quote=USDT), no puede convivir filtrada dentro de una
consulta cuyo `quote` ya es ARS.

### 3.2 La búsqueda de corredor no usa `to_currency` en absoluto

Peor todavía: la consulta real a `fx_rates` (`fx.functions.ts` línea ~740) filtra
solo por `sending_country` + `receiving_country` — **`to_currency`/`from_currency`
son campos descriptivos, no la clave de búsqueda**. Si hoy cargara una fila cripto
con, por ejemplo, `sending_country='US'`, `receiving_country='AR'`, esa fila
**aparecería mezclada en cualquier consulta normal EEUU→Argentina** — y como el
cálculo de `received` no distingue qué moneda es `to_currency`, mostraría un monto
calculado con una tasa USD→USDT como si fuera USD→ARS. Sería un número real pero
mal etiquetado, mostrado al usuario como si fuera pesos cuando en realidad
representa otra cosa.

### 3.3 Por qué no lo forcé

Cargar datos cripto a `fx_rates` tal como está el esquema hoy habría producido un
bug real y silencioso (montos mostrados con la moneda equivocada), exactamente el
tipo de error que esta semana entera de research trató de evitar (nunca mostrar un
número con más confianza de la que tiene). Necesita, como mínimo, uno de estos dos
cambios reales de arquitectura antes de cargar cualquier dato:

- Una columna/flag nueva (ej. `is_crypto_bridge boolean`) que la UI chequee
  explícitamente para tomar una ruta de render distinta (mostrar el monto en la
  stablecoin, no en `to_currency`), en vez de asumir que toda fila de un corredor
  se muestra igual.
- O una consulta/ruta completamente separada para la vista cripto, que nunca
  comparta la query de `sending_country`+`receiving_country` con el resto del
  comparador.

Esto es trabajo de diseño de esquema + código que necesita poder probarse
visualmente (dev server, preview) — no algo para escribir a ciegas en una sesión
de research/chat sin esa capacidad.

---

## 4. Qué hacer en la próxima sesión (idealmente Código, con preview)

1. Decidir entre las dos opciones de la Sección 3.3 (columna nueva vs. ruta
   separada) — recomendación: la ruta separada es más segura (cero riesgo de que
   una fila cripto aparezca sin querer en una consulta normal), pero más trabajo.
2. Recién ahí cargar los datos ya medidos (Global66 ARS↔USDT/USDC del 11-sep,
   Lemon Argentina, Belo Venezuela) — los números ya están, solo falta dónde
   guardarlos de forma segura.
3. Conectar `fetchCriptoArsRate()` (ya construida) a la UI para la línea "≈ X ARS
   al tipo de hoy".
4. Todavía falta identificar proveedor específico para Nigeria/Turquía/Egipto
   antes de que esos países puedan sumarse (ver research del 14 y 16-sep).

---

## 5. Estado de esta sesión

Implementado y verificado (typecheck + lint limpios):
- `providers.promo_text` cargado para 3 proveedores.
- `src/services/providers/argentinaDatosCripto.ts` — nuevo archivo, aislado, sin
  tocar la cadena de FX_PROVIDERS existente.

No implementado, con razón documentada:
- Filtro de método de entrega "crypto" en `ComparatorSection.tsx` — no se tocó,
  porque el diseño tal como estaba planteado el 13-sep no es compatible con cómo
  el código real arma las consultas (Sección 3).
