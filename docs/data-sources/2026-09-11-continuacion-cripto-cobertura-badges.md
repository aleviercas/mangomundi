# Continuación: cripto, corredores faltantes, badges — 2026-09-11 (ronda 3)

> Sigue a `2026-09-11-global66-datos-en-vivo-usuario.md`. Profundiza el canal
> cripto para Venezuela con una fuente en vivo real, hace un barrido de cobertura
> por país, y encuentra un segundo caso (Cuba) del mismo patrón oficial-vs-informal
> que venimos resolviendo desde ayer.

---

## 1. Venezuela — tercera confirmación independiente de que USDT es casi gratis

Encontré `usdt.com.ve/tasa-binance-hoy`, un tracker que se actualiza cada 5 minutos
directamente desde la API pública de Binance (metodología transparente: mediana de
las primeras 5 ofertas activas, para eliminar outliers). Estado al momento de
consultar (11-sep-2026, 21:10 UTC):

| Fuente | Tasa | Brecha vs BCV oficial |
|---|---|---|
| BCV oficial | 832,49 VES/USD | — |
| **Binance P2P (compra)** | **957,72 VES/USDT** | **15.0%** |
| Binance P2P (venta) | 957,00 VES/USDT | 14.9% |
| Bybit P2P | 955,73 VES/USDT | 14.8% |

El spread propio de Binance entre compra y venta es de apenas **0.075%**
((957,72-957,00)/957,72) — coherente con el 0.07% que ya habíamos medido para el
canal USDT de Global66 y con el rango "1-3%" que menciona Belo en su blog (ese rango
probablemente incluye el margen de vendedores P2P individuales por encima del índice
agregado, no solo el spread del propio mercado). **Tercera fuente independiente que
confirma lo mismo**: el canal cripto para Venezuela cuesta una fracción mínima de lo
que cuesta cualquier canal tradicional (Remitly regular: 6.30%, cargado ayer).

Esta fuente (`usdt.com.ve`) es candidata a reemplazar o complementar
`ve.dolarapi.com` como referencia de paralelo para VES en investigaciones futuras —
se actualiza cada 5 minutos contra cada pocas horas/días de `dolarapi.com`.

## 2. Cuba — segundo caso confirmado del mismo patrón oficial-vs-informal

La fila ya cargada de Western Union EEUU→Cuba (`data_source` original, 23-ago-2026)
ya traía una advertencia propia: *"Cuba has a large informal-market rate gap (~660+
CUP/USD) vs the official reference used here"* — una duda que nadie había resuelto
todavía.

Encontré `eltoque.com`, el equivalente cubano de `dolarapi.com` (tasa informal en
tiempo real). Según los resultados de búsqueda más recientes: **1 USD = 690,00 CUP**
en el mercado informal (vs. oficial ~120-125 CUP/USD, una brecha de más de 5 veces).

**No corregí la fila todavía** — dos razones:
1. `eltoque.com` bloqueó el acceso directo de esta sesión (bot_blocked) — solo tengo
   el número vía snippet de búsqueda, no una fuente primaria verificada de forma
   directa como hice con `dolarapi.com`/`ve.dolarapi.com`.
2. La tasa aplicada que ya está cargada (628 CUP/USD) está sorprendentemente **cerca
   del informal (690), no del oficial** — a diferencia de Venezuela/Argentina, este
   caso puede que ya esté razonablemente bien cargado y la advertencia en el
   `data_source` haya sido más una nota de cautela que un error real. No tengo el
   monto de referencia exacto usado originalmente para recalcular el fee con
   confianza.

**Recomendación**: próxima ronda, conseguir acceso a `eltoque.com` (browser real,
como con Global66) o buscar una fuente alternativa, y remedir Western Union
EEUU→Cuba en vivo antes de tocar la fila.

## 3. Barrido de cobertura por país — sin vacíos grandes nuevos

Revisé la lista completa de `receiving_country` en `fx_rates` (94 países distintos).
No encontré ningún país con volumen de remesas relevante en cero absoluto que no
estuviera ya documentado como "cobertura cero, mecanismo conocido" en
`2026-09-03-research-v16-v25-margen-moneda-volatil.md` Sección 7. Los únicos países
con cobertura muy delgada (1 fila) son casos ya explicados: franco CFA fijado al
euro (Benín, Costa de Marfil — spread ~0 es la respuesta correcta, no un vacío),
Cuba (ver Sección 2), Chile/Uruguay/Francia (cubiertos por Prex, con un solo
proveedor porque son corredores de nicho de ese proveedor específico).

## 4. Badges promocionales — no hay research nuevo que hacer acá

Esto ya quedó resuelto como decisión de producto la vuelta pasada (Opción A: precio
regular se mantiene como está, badge de promo aparte, orden no cambia). No es un
tema investigable con fuentes externas de la misma manera que los corredores — es
una decisión de diseño interno. Si querés, en la próxima ronda puedo mirar cómo lo
resuelven comparadores similares (Wise, el propio Monito) como referencia de patrón
visual, pero no hay una "respuesta correcta" externa que buscar, a diferencia de los
datos de tarifa.

---

## 5. Estado de esta sesión

No se cargó nada a Supabase en esta ronda — todo lo encontrado (Binance P2P,
El Toque) queda documentado como referencia y pista para la próxima ronda, no como
datos listos para cargar con confianza.
