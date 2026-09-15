# Cuba resuelto (fuente limpia encontrada), Turquía/Egipto inconclusos — 2026-09-14

> Sigue investigando pendientes: Cuba (bloqueado el 11-sep por `eltoque.com`) y dos
> candidatos nuevos del ángulo cripto (Turquía, Egipto) que no habían sido
> verificados todavía.

---

## 1. Cuba — resuelto, con una fuente mucho mejor que la que fallamos antes

`eltoque.com` me había bloqueado el acceso el 11-sep. Al buscar de nuevo encontré
que **varias fuentes daban números muy distintos para el mismo día** (490, 687,
694 CUP el 14-sep según distintos posts de redes sociales) — en vez de elegir uno
al azar, busqué la fuente más confiable: **CiberCuba** (medio digital real, no un
agregador de redes sociales), que publica un artículo diario con **oficial e
informal juntos, explícitamente comparados**.

**Hoy (14-sep-2026)**:
- Oficial (Banco Central de Cuba, Segmento III): **655 CUP/USD**
- Informal (calle): **694 CUP/USD**
- Brecha real: **5,95%**

El propio artículo da la tendencia: 664 CUP hace un mes, 683 hace una semana, 694
hoy — **~4,5% de devaluación mensual**, una moneda que se mueve rápido.

### Qué hice con la fila existente

La fila de Western Union EEUU→Cuba tenía `rate=628`, `verified_status=confirmado_activo`,
pero con fecha del **23-ago-2026** — más de 3 semanas vieja en una moneda que se
devalúa ~4,5% mensual. **La bajé a `sin_confirmar`** — mismo criterio que ya usamos
con Prex Argentina→Venezuela el 10-sep: tener una referencia fresca no alcanza si
la tasa aplicada del proveedor es vieja, hacen falta las dos cosas frescas para
recalcular con confianza. No inventé un número nuevo — dejé la nota clara de qué
falta (una cotización nueva de Western Union) para la próxima ronda.

## 2. Turquía y Egipto — investigación inconclusa, no forcé una conclusión

Intenté verificar estos dos con la misma metodología que Nigeria/Georgia/Moldavia/
Pakistán, pero los datos encontrados fueron inconsistentes entre sí (fechas
mezcladas, algunas de abril 2026, cruces TRY-EGP en vez de contra USD) y no llegué
a un número limpio y confiable de hoy para ninguno de los dos.

Lo que sí puedo decir con relativa confianza: **ambas son monedas de flotación
libre con alta inflación** (no tienen un tipo de cambio oficial fijo separado del
mercado, a diferencia de Nigeria/Venezuela/Argentina/Cuba) — el patrón esperado es
más parecido a Pakistán/Georgia/Moldavia (sin brecha de arbitraje real) que a los
casos fuertes. Pero esto es una hipótesis razonable, no una verificación
confirmada — si en algún momento importa resolverlo con precisión, hace falta una
sesión con browser real (mismo problema que tuvimos con Global66) para conseguir
una cotización P2P limpia de hoy.

## 3. Lista actualizada de casos con brecha confirmada

| País | Estado |
|---|---|
| Venezuela | Confirmado, 3 fuentes independientes |
| Argentina | Confirmado, datos reales (Global66) |
| Nigeria | Confirmado, ~4,3-4,8% hoy (CBN + P2P) |
| **Cuba** | **Confirmado, 5,95% hoy (CiberCuba) — pero la fila de WU necesita remedición** |
| Georgia, Moldavia, Pakistán | Descartados — sin brecha real |
| Turquía, Egipto | Inconcluso — necesita browser real para resolver |

---

## 4. Estado de esta sesión

`fx_rates`: sin cambio de conteo (1 UPDATE — downgrade de la fila de Cuba, no
INSERT). Cuba se suma a la lista de casos con brecha real confirmada, aunque el
canal específico (cripto vs. cash callejero) todavía no está diferenciado para
este país — no encontré evidencia de una historia USDT-dominante como Venezuela.
