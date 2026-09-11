# Continuación de research — 2026-09-10 (ronda 2)

> Sigue directamente a `2026-09-10-research-venezuela-asia-central-profundizacion.md`.
> Revisa tres pendientes de la lista "on the horizon": recálculo de corredores ARS,
> el outlier de Prex Venezuela, y los corredores marcados como faltantes (Golfo→Sur de
> Asia/Filipinas, Bulgaria).

---

## 1. Recálculo de corredores ARS contra dolarapi.com — verificado, NO urgente

Se midió la brecha oficial/blue del ARS en vivo (`dolarapi.com/v1/dolares/oficial` y
`/blue`, 2026-09-10): oficial venta 1.530, blue venta 1.540 — **brecha de apenas
0.65%**. Confirma la evaluación que ya tenía el plan de implementación anterior: el
efecto de recalcular los corredores ARS ya cargados (Chile→España, Argentina→EEUU,
Bolivia×5) sería mínimo hoy. **No se tocó ninguna fila** — se deja como estaba, con la
brecha real documentada acá para la próxima vez que se revise.

Nota aparte: se confirmó que el endpoint agregado `dolarapi.com/v1/dolares` devuelve
datos desactualizados (fecha de julio) mientras que los endpoints específicos por casa
(`/v1/dolares/oficial`, `/v1/dolares/blue`) sí están frescos (fecha de septiembre) — un
bug de caché del lado de la fuente, no del proyecto. **Usar siempre los endpoints
específicos, no el agregado**, en cualquier research futuro con esta fuente.

## 2. Prex Argentina→Venezuela — resuelto: mismo problema que Remitly, en la dirección opuesta

La fila de Prex ARS→VES (cargada 2026-09-02) tenía un spread de 3.86% — muy por debajo
del resto de corredores de Prex (7.86%-11.81%), marcada `sin_confirmar` en su momento
por esa razón. La sospecha original apuntaba a un error de medición; la razón real es
la misma que resolvió Venezuela hoy: **el 3.86% se había calculado contra el
mid-market de XE, que para VES sigue el oficial, no el paralelo.**

Recalculado contra el cruce correcto (ARS "blue" / VES "paralelo", ambos
`dolarapi.com`):

```
cross_correcto = ves_paralelo / ars_blue = 945.976898 / 1540 = 0.614271 VES/ARS
margen = (0.614271 - 0.50846) / 0.614271 = 17.23%
```

**Invierte la conclusión por completo**: de "el corredor más barato de Prex" a **el
más caro**, por un margen amplio. Actualizado en Supabase — la tasa aplicada
(0.50846) sigue siendo la del 2-sep (no remedida en vivo hoy), por eso se mantiene
`sin_confirmar` en vez de subir a `confirmado_activo` como sí se hizo con Remitly
(que tuvo medición del mismo día). Recomendación para la próxima ronda: remedir en
vivo la calculadora de Prex para este corredor específico.

## 3. Golfo→Sur de Asia/Filipinas — verificado: ya está bien cubierto

Este ítem figuraba como "pendiente" en la lista de research futuro, pero al
verificar contra la base de datos **ya hay ~65 filas** cubriendo AE/SA/KW/QA/BH/OM
como origen hacia IN/PK/BD/NP/LK/PH, con múltiples proveedores (Al Ansari, Remitly,
Western Union, Wise, MoneyGram, y varios más). **No se investigó nada nuevo acá** —
la nota "pendiente" en la memoria del proyecto estaba desactualizada; se corrige acá
para que ninguna sesión futura pierda tiempo re-investigando algo que ya está hecho.

## 4. Bulgaria (BGN) — llenado el vacío confirmado

Verificado: cero filas con `to_currency='BGN'` antes de esta sesión — vacío genuino,
no solo una nota vieja. `monito.com/send-money/germany/bulgaria/eur/bgn` da una
tarjeta en vivo con **Dahabshiil** (proveedor nuevo para el proyecto, agregado con el
mismo patrón mínimo ya usado para SBI Remit/Lulu Money):

| | Promocional (1ª transferencia) | **Regular** |
|---|---|---|
| Fee | 0 EUR | **1.99 EUR** |
| Tasa | 1.9409 | 1.9409 (igual) |
| Recibe | 194.09 BGN | **190.23 BGN** |

Se cargó solo la línea **regular** (misma política que Venezuela). A diferencia de
ARS/VES, **BGN no necesita la corrección oficial/paralelo**: el lev búlgaro está bajo
caja de conversión fija al euro desde 1997 (1 EUR = 1,95583 BGN estatutario), y el
mid-market de XE que usa Monito (1,9558) coincide casi exacto con esa paridad legal —
no hay divergencia oficial/paralelo que corregir en este caso particular.

**Nota importante**: BGN, al ser una paridad fija dura, **no encaja en la tesis
central del proyecto** ("moneda volátil → margen alto") — se cargó por completitud de
cobertura (estaba explícitamente marcado como vacío pendiente), no como evidencia a
favor ni en contra de la hipótesis.

---

## 5. Estado de Supabase al cierre de esta ronda

- `fx_rates`: 923 filas (922→923, +1 fila de Bulgaria; Prex VES fue UPDATE, no INSERT).
- `providers`: 66 (65→66, +1 Dahabshiil).
- Ninguna fila existente se sobrescribió sin dejar constancia explícita del motivo
  del cambio en `data_source`.
