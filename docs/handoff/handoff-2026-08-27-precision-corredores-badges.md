# mangomundi — Handoff 27-ago-2026: precisión de corredores + badges de confianza

> Continúa (no reemplaza) `docs/handoff/handoff-2026-08-25-fix-ci-y-otras-regiones.md`,
> que sigue vigente para el research de las 3 regiones nuevas (Fase 2 pendiente) y las
> notas operativas de CI. Este handoff cubre el diagnóstico y plan de esta sesión
> (27-ago), pedido directo de Alejandro: optimizar el motor de búsqueda para que
> muestre proveedores y tarifas reales a cualquier corredor, no solo Argentina.

**Repo:** `aleviercas/mangomundi` (main). **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Estado:** diagnóstico completo y plan acordado con Alejandro. **Nada de esto está
implementado todavía** — es el trabajo a ejecutar en esta sesión de Code.

---

## 1. Pedido original

Alejandro reportó, conociendo el mercado argentino:
- **Revolut aparece en GB→AR** pero él no puede enviar pesos argentinos con Revolut.
- **Money2India aparece en comparaciones de Argentina**, lo cual no tiene sentido (es
  un producto de ICICI Bank específico para remesas a India).
- Faltan fintechs argentinas que él esperaría ver.
- Pedido explícito, ya charlado en sesiones anteriores: notas de "última actualización",
  "restricciones" o "precio sin confirmar" por fila, y que las tarifas con fee cero
  **promocional** se muestren pero aclaradas como tales.

Objetivo de fondo: que cualquier persona o empresa que entre a comparar vea proveedores
y tarifas **reales** — no que la ausencia de un filtro haga aparecer productos que no
operan esa ruta, ni que un fallback genérico se presente como si fuera un dato
verificado de esa ruta específica.

---

## 2. Diagnóstico confirmado (queries reales a Supabase, 27-ago)

### 2.1 Money2India / BDO Remit / UBL Tezraftaar / Prex — bug real, confirmado

Los 4 son marcas de **un solo mercado** (Tipo A, `is_corridor_specific=true`), pero
`ENABLE_CORRIDOR_FILTERING` está apagado en producción (default documentado en
`PROJECT-STATE.md` sección 3), así que **ningún filtro de corredor corre hoy**. Cada
uno usa su `fee_tiers` genérico (poblado desde su único corredor real) para *cualquier*
corredor que se le pida — incluida Argentina.

Confirmado con SQL: de los proveedores Tipo A activos, exactamente estos 3 tienen
**una sola** `receiving_country` en `fx_rates` (el resto — WorldRemit, Ria, Remitly,
MoneyGram, Western Union, Xoom, Paysend, LemFi, NALA, Sendwave, TapTap Send — son MTOs
de red amplia con 4+ países, no aplica el mismo problema):

| Proveedor | Corredor real único |
|---|---|
| `money2india` | `US-IN` |
| `bdo-remit` | `US-PH` |
| `ubl-tezraftaar` | `AE-PK` |

`prex` tiene **cero filas en `fx_rates`** (su data vive solo en `fee_tiers`/notas) y su
corredor real es el inverso — sale de Argentina, no entra —, según sus propias notas:
`AR-US, AR-DE, AR-ES, AR-FR, AR-IT, AR-PT, AR-MX, AR-BR, AR-CO, AR-BO, AR-PY, AR-VE` +
`AR-PE, AR-CL, AR-UY` (estos 3 últimos, "Prex a Prex", instantáneo).

### 2.2 Revolut / ARS — no es lo mismo que 2.1

Research hecho (web, 27-ago): Revolut **sí publica** páginas de "enviar dinero a
Argentina" (GBP/EUR/USD → cuenta ARS por SWIFT) — a diferencia de Money2India, no es
un producto que estructuralmente no pueda operar la ruta.
Fuente: revolut.com/money-transfer/send-money-to-argentina/ (revisado 27-ago-2026).

El problema real es otro: **no hay ninguna fila real en `fx_rates` para Revolut→ARS**,
y Argentina tiene un régimen cambiario dual (oficial vs. paralelo/MEP) donde el spread
global genérico de Revolut (0.5%) casi seguro no representa la ruta real. Hoy el motor
no distingue "dato verificado" de "fallback genérico" — los muestra idénticos, sin
ninguna marca.

### 2.3 Hallazgo mayor — no es solo Argentina

El lookup a `fx_rates` real (en `compareProviders`, `src/lib/fx.functions.ts`) está
gateado detrás de `ENABLE_CORRIDOR_FILTERING`. Con el flag apagado (default en
producción), **todo el research de corredores cargado en las últimas sesiones no se
usa en producción** — ej. Wise tiene una fila real GB→AR (fee 8.53 GBP, spread 0.01%,
investigada 25-ago) pero producción le sigue aplicando su `fee_tiers` genérico global.
Esto es independiente del bug de Argentina y aplica a **todos** los ~248 corredores
cargados en `fx_rates` (754 filas). Arreglarlo es puro upside, sin trade-off.

### 2.4 Blast radius — quién aparece hoy en ARS sin dato real

Query ejecutada (27-ago) sobre proveedores activos, segmento retail/both, sin fila en
`fx_rates` con `to_currency='ARS'`:

**Con dato real verificado (5):** MoneyGram, Remitly, Ria, Western Union, Wise —
investigados 25-ago con fuente citada. (Además `binance-pay`, con dato pero
`sin_confirmar`.)

**Sin dato real, mostrando fallback genérico como si fuera de Argentina (18):**
Revolut, Chase, HSBC, Santander, Currencies Direct, TorFX, CurrencyFair, Instarem,
Skrill, TransferGo, XE, Atlantic Money (Tipo B — brokers/bancos de cobertura amplia);
más BDO Remit, Money2India, UBL Tezraftaar, Prex (Tipo A de un solo mercado — ver 2.1);
más WorldRemit, Xoom, Paysend, LemFi, NALA, Sendwave, TapTap Send (Tipo A de red
amplia — capaz sí operan otras rutas no cargadas, no es el mismo caso que los 4
anteriores).

---

## 3. Plan acordado con Alejandro — a implementar en esta sesión

**No hacer:** esconder de golpe a los 18 de la lista de 2.4. Alejandro pidió
explícitamente mostrar a todos los proveedores que operan + notas de transparencia,
no ocultar más. La distinción correcta es entre "no opera esta ruta" (2.1, ocultar) y
"opera pero no tenemos dato verificado de esta ruta" (2.2/Tipo B, mostrar con badge).

### 3.1 Desacoplar el uso de `fx_rates` real del flag `ENABLE_CORRIDOR_FILTERING`

En `compareProviders`: el lookup a `fx_rates` (y a `corridor_notes`) debe correr
siempre que `sendingCountry`/`receivingCountry` estén presentes y no haya
`currencyOverridden` — independiente del flag. Dato real siempre gana cuando existe,
para cualquier proveedor. El flag sigue controlando *solo* el comportamiento de
exclusión dura de corredor-específicos sin dato (que en 3.2 se reemplaza por un
mecanismo más quirúrgico, ver abajo) — no hace falta tocar/prender el flag para este
fix.

### 3.2 `supported_corridors` como lista blanca para marcas de un solo mercado

La columna `providers.supported_corridors` (`text[]`, ya existe en el schema, vacía en
las 63 filas) pasa a ser lista blanca estricta, formato `"SENDING-RECEIVING"`:

```sql
update providers set supported_corridors = array['US-IN'] where slug = 'money2india';
update providers set supported_corridors = array['US-PH'] where slug = 'bdo-remit';
update providers set supported_corridors = array['AE-PK'] where slug = 'ubl-tezraftaar';
update providers set supported_corridors = array[
  'AR-US','AR-DE','AR-ES','AR-FR','AR-IT','AR-PT','AR-MX','AR-BR','AR-CO','AR-BO',
  'AR-PY','AR-VE','AR-PE','AR-CL','AR-UY'
] where slug = 'prex';
```

Lógica nueva en `eligibleProviders` (`fx.functions.ts`): si un proveedor tiene
`supported_corridors` no nulo/no vacío, solo es elegible cuando
`${sendingCountry}-${receivingCountry}` está en esa lista — **independiente del flag**,
y sin tocar a ningún otro proveedor (los MTOs de red amplia sin `supported_corridors`
poblado siguen con el comportamiento actual, cero regresión).

### 3.3 Badges de confianza en la UI — datos ya calculados, solo falta renderizar

`ComparisonRow` ya trae `has_corridor_data`, `corridor_data_source`,
`corridor_data_collected_at` (y `verified_status` de `fx_rates` se puede sumar
fácil al select/interfaz — hoy no viaja). Nada de esto se renderiza hoy en
`ProviderRow` (`src/sections/ComparatorSection.tsx`). Agregar:

- **"Precio estimado — no verificado para esta ruta"** cuando `has_corridor_data===false`.
- **"Sin confirmar"** cuando `verified_status==='sin_confirmar'` (agregar el campo al
  select de `fx_rates` en `compareProviders` y al tipo `ComparisonRow`).
- **Fecha de última actualización** por fila — `corridor_data_collected_at` si hay dato
  real, o `providers.rates_last_updated` (existe en la tabla, no viaja hoy al tipo
  `Provider`/`ComparisonRow`) como fallback genérico.
- `promo_text` ya existe y viaja hasta `ComparisonRow` pero nunca se renderiza —
  win rápido: mostrarlo como nota corta cuando esté poblado. (Alcance más completo —
  precio promocional estructurado aparte del regular — es una decisión de producto
  aparte, ver sección 5.)

---

## 4. Notas operativas — no repetir el incidente de CI del 25-ago

(Heredado de `docs/handoff/handoff-2026-08-25-fix-ci-y-otras-regiones.md` sección 6,
sigue vigente al 100%, repetido acá porque es la parte más importante:)

- **Nunca fabricar el timestamp de un archivo de migración espejado.** Siempre llamar
  `list_migrations` (o el equivalente del CLI real en Code) después de aplicar, y usar
  la versión real devuelta como nombre de archivo.
- No existe `delete_file` en el servidor MCP de GitHub del device bridge — en Code con
  git real esto no debería ser un problema, pero si se termina puesheando algo mal, usar
  el mecanismo de tombstone (sobreescribir con comentario) solo como último recurso.
- Regla de carga de datos, sigue vigente: nunca precio promocional o de primera
  transferencia como precio regular; fee Y margen con fuente citable, nunca uno solo;
  si no se puede confirmar, cargar como `sin_confirmar`, nunca adivinar.

---

## 5. Abierto — pendiente de Alejandro (no bloquea empezar 3.1/3.2/3.3)

1. **Lista de fintechs argentinas** para el sentido entrante (recibir en Argentina) —
   Prex ya cubre el saliente. No hay research validado todavía de si Ualá, Belo, Lemon
   Cash, AstroPay, etc. operan como remesa entrante real o son solo billeteras
   domésticas — no cargar nada sin confirmar esto primero.
2. **Alcance del badge de promo** — ¿alcanza con mostrar el `promo_text`/nota existente
   (rápido, sección 3.3), o Alejandro quiere una segunda cifra "con promo: X" cargada
   por corredor? Esto último implica cambiar la regla vigente de "nunca cargar precio
   promocional" — confirmar antes de tocar esa regla.
3. **Confirmar en el dashboard de Vercel** el valor real actual de
   `ENABLE_CORRIDOR_FILTERING` en producción — no se pudo leer desde el chat (sin
   herramienta de env vars ahí). No bloquea 3.1/3.2 (quedan diseñados para no depender
   del flag), pero vale la pena saberlo para el research de la sección 6.

---

## 6. Research pendiente heredado — sin cambios, ver handoff del 25-ago sección 5

Sigue 100% vigente, no se tocó en esta sesión: Fase 2 (cotización en vivo) para Golfo→Sur
de Asia/Filipinas, Ucrania/Moldavia, Sudeste Asiático; MoneyGram→Bulgaria con navegador
real; ES→AR para Remitly/MoneyGram; Global66/Belo sin fee confirmado; los 4 corredores
`sin_confirmar` estructurales; matrices de TapTap Send/Sendwave/LemFi/NALA incompletas.

---

## 7. Dónde está cada cosa (recordatorio rápido, detalle completo en PROJECT-STATE.md §9)

| Qué | Dónde |
|---|---|
| Índice general del proyecto | `docs/PROJECT-STATE.md` |
| Handoff anterior (CI + otras regiones) | `docs/handoff/handoff-2026-08-25-fix-ci-y-otras-regiones.md` |
| Lógica de comparación de proveedores | `src/lib/fx.functions.ts` (`compareProviders`) |
| UI del comparador / filas de resultado | `src/sections/ComparatorSection.tsx` (`ProviderRow`) |
| Motor de scoring | `src/lib/scoring.functions.ts` |
| Runbook arquitectura corredor/proveedor | `docs/handoff/arquitectura-corredor-proveedores.md` |
| Diagnóstico previo del mismo problema de fondo | `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md` |
