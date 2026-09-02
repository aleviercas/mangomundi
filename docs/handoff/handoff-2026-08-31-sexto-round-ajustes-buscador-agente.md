# mangomundi — Handoff 31-ago-2026: sexto round de ajustes (buscador en una línea, agente junto a Today's routes, Trustpilot real)

> Cubre el traspaso entre dos sesiones de Claude Code trabajando en simultáneo
> sobre el mismo rediseño. El trabajo descripto acá quedó consolidado en la
> rama `claude/coordinar-trabajo-simultaneo-y85idz` (antes vivía en
> `claude/reorganizar-entrega-rediseno-za6gmc`, que quedó congelada — ver nota
> al tope de `docs/PROJECT-STATE.md`).

**Repo:** `aleviercas/mangomundi`. **Último commit de este round:** `237ffbe`
(arriba de `23c5032`). **Estado:** cerrado y pusheado, nada a medio commitear.

---

## 1. Qué se hizo en este round

Ajustes de diseño contra `design/Mangomundi 4 - Final.dc.html`, pedido cerrado
completo antes de la pausa (no quedó nada a mitad de camino):

- **Footer:** nota legal consolidada (`footer.legalNote`) reemplazando los dos
  párrafos que estaban debajo de los resultados.
- **Fila de resultados:** "They receive" → "Receive"; se sacó el chip "Check
  for exclusive rate"; la nota de "Affiliate link" ahora dice "Affiliate link
  · with exclusive rates" (al lado de la fecha); se sacó "Fee breakdown"
  (abría el chat con una respuesta enlatada, no un desglose real).
- **Píldoras de moneda eliminadas por completo.** El buscador (home, no
  embebido) queda en una sola línea: monto+moneda origen, país origen, swap,
  país destino, moneda destino, CTA — con fallback a columna única debajo del
  breakpoint `@4xl`. Los country pickers ya no muestran el código de moneda
  (redundante, la moneda tiene su propio campo — prop nueva `hideSecondary`
  en `Combobox`/`CountryCombobox`).
- **Agente IA:** el trigger colapsado (pre-búsqueda, desktop ≥lg) se portalea
  dentro de la fila de "Today's routes" en vez del tab flotante.
- **Today's routes:** bajado de 6 a 4 tarjetas para dar lugar al trigger del
  agente en esa misma fila. Este número se movió 4→6→4 en rondas sucesivas
  por pedidos explícitos y contradictorios de Alejandro — no es un bug, es la
  resolución del último pedido.
- **Trustpilot:** se sacó la píldora custom "Check our rating" y se volvió al
  embed real (`<TrustBox/>`, el mismo componente que ya usaba `ContactSection`)
  en la card del rail y en Today's routes.
- **i18n:** backfill/limpieza en los 19 idiomas + `.pending.json` por cada key
  tocada o eliminada esta ronda.

## 2. Validado vs. no validado

Verificado en este sandbox (sin renderer real): `tsc`, `eslint`, `prettier`,
`i18n:check` limpios, y smoke test vía `curl` al SSR de `/business`, `/embed`,
`/about`, `/widget` (`/` da 500 en este sandbox por falta de Supabase
configurado — no es regresión de este round).

**Nada quedó a medio codear, pero ningún cambio visual de esta sesión se vio
en un browser real.** Puntualmente sin validar:

- El breakpoint `@4xl` de la fila única del buscador es una decisión sin
  validar contra el ancho real de la card, sobre todo en modo `compact`
  (cuando comparte fila con el rail de resultados).
- El rail de resultados (`FiltersCard`, `RateAlertCard`, `TrustpilotCard`,
  `BusinessRequestPanel`) — incluido el cambio de Trustpilot ahí — no se pudo
  ejercitar en absoluto: solo renderiza cuando existe `result`, y sin Supabase
  configurado acá nunca se llega a ese estado. Se verificó por lectura de
  código + que `<TrustBox/>` ya funciona en SSR en otro lado (`ContactSection`
  en `/about`), no en el rail mismo.
- La fila de "Today's routes" con el agente al lado tampoco se vio armada en
  vivo (depende de datos reales de Supabase).

## 3. Bugs conocidos sin arreglar

Ninguno detectado y dejado sin resolver. Sí un gap deliberado: los dos textos
EN reescritos esta ronda (`comparator.row.labelReceive`,
`comparator.row.affiliateLink`) se cambiaron solo en la fuente EN — las
traducciones a los 19 idiomas van a seguir mostrando la versión vieja hasta
que se corra traducción real (`scripts/translate.ts`) para esas dos keys.

## 4. Próximos pasos sugeridos

Nada en cola — se cerró todo lo pedido explícitamente. Prioridad sugerida
para la siguiente sesión:

1. Ver esto en un browser real, sobre todo el buscador en una línea y el
   agente al lado de Today's routes (los dos puntos de mayor riesgo visual
   sin validar).
2. Correr traducción real (`scripts/translate.ts`) para las dos keys EN
   mencionadas en la sección 3.

## 5. Decisiones tomadas que no estaban documentadas

- **Widget embebido deliberadamente sin tocar** en el rediseño del buscador
  (sigue siendo una sola fila con píldoras de moneda tipo bandera+código):
  el mockup literal ("Widget · sin scroll", líneas 726-786 del `.dc.html`) no
  muestra nombre de país ni selector de moneda separado — ese bloque del
  mockup manda por sobre la consistencia con el resto del rediseño.
- **"Fee breakdown" se sacó del todo** (no se relabeled) — se consideró más
  confuso que útil.
- **Trustpilot: reversión explícita de una decisión de la misma sesión.**
  Se había sacado `<TrustBox/>` del rail por ser semánticamente "dejanos una
  reseña" y no "mostrános tu rating"; Alejandro pidió expresamente volver al
  embed real, y eso pisa el razonamiento anterior.
