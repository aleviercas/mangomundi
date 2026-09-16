# Turquía y Egipto — resuelto con datos limpios en vivo — 2026-09-16

> Corrige el veredicto "inconcluso" del 14-sep. Esa vez la búsqueda mezclaba fechas
> y cruces TRY-EGP en vez de USD. Esta vez conseguí XE en vivo (fecha de hoy) +
> P2P.army limpio por país, y el resultado es que **sí hay brechas reales**, aunque
> más chicas que Venezuela/Nigeria/Cuba.

---

## 1. Los números (16-sep-2026, ambas fuentes con fecha de hoy)

| País | Mid-market XE | P2P (Binance, agregado) | Brecha |
|---|---|---|---|
| **Turquía** | 48,6379 TRY/USD | 51,80 TRY/USDT | **6,50%** |
| **Egipto** | 51,7664 EGP/USD | 53,32 EGP/USDT | **3,00%** |

Turquía sorprende: **6,5% es una brecha más grande que la de Nigeria (4,3-4,8%,
confirmada el 14-sep)** — corrige mi hipótesis anterior de que, al ser monedas de
flotación libre, probablemente no tendrían una brecha explotable como Georgia/
Moldavia/Pakistán (que sí muestran solo 0,5-1,5%, el "piso" normal de fricción
P2P).

## 2. Por qué esto es distinto de Georgia/Moldavia/Pakistán pese a también ser flotación libre

Ninguno de los dos tiene un tipo de cambio oficial fijo separado del mercado (no
hay controles de capital tipo Nigeria/Venezuela) — en ese sentido siguen sin ser
"la misma historia" que esos casos. Pero a diferencia de Georgia/Moldavia/Pakistán,
**Turquía y Egipto tienen historia reciente y activa de inflación muy alta y
devaluación** (Turquía con inflación de dos dígitos sostenida por años; Egipto con
varias devaluaciones grandes, incluida la más reciente de marzo 2024) — eso genera
demanda genuina de USDT como resguardo de valor, no solo como conveniencia de
transferencia, lo que empuja el precio P2P por encima del mid-market de forma
consistente. Es una prima de demanda, no una brecha de control cambiario — pero
sigue siendo dinero real que un usuario podría ahorrarse o perder según el canal
que use.

## 3. Prioridad actualizada — Turquía sube, Egipto queda como secundario fuerte

| País | Brecha real | Prioridad |
|---|---|---|
| Venezuela | Confirmado, alto | Alta |
| Argentina | Confirmado, con datos reales | Alta |
| Nigeria | 4,3-4,8% | Alta |
| Cuba | 5,95% | Alta |
| **Turquía** | **6,50%** — la segunda brecha más grande medida esta semana | **Sube a Alta** |
| Egipto | 3,00% | Media — real pero la más chica del grupo "sí tiene brecha" |
| Georgia, Moldavia, Pakistán | <1,5% | Baja — descartados |

**Turquía pasa a la lista de candidatos fuertes**, junto a Venezuela/Argentina/
Nigeria/Cuba. Ninguno de los dos (Turquía/Egipto) tiene todavía identificado un
proveedor/app específico de remesa cripto (mismo gap que Nigeria, ver el plan de
implementación del 15-sep) — falta esa ronda de research antes de poder cargar
algo a Supabase.

---

## 4. Estado de esta sesión

Solo investigación — no se cargó nada a Supabase. Cinco países quedan confirmados
con brecha real (Venezuela, Argentina, Nigeria, Cuba, Turquía) y uno más con
brecha real pero menor (Egipto) — todos pendientes de identificar el proveedor
específico antes de poder implementarse, según lo ya documentado en el plan de
implementación.
