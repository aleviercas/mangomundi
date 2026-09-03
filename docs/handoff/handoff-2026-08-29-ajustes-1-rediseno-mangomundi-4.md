# Handoff — "Mangomundi 4", ronda de ajustes 1 (29-ago-2026)

> Estado: **los 8 pasos de `design/AJUSTES-1.md` están completos**, en
> `claude/reorganizar-entrega-rediseno-za6gmc` (la misma rama del rediseño
> original — todavía no mergeada a `main`, nada de esto está LIVE). Este
> documento continúa
> [`docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md`](./handoff-2026-08-29-rediseno-mangomundi-4.md)
> (léelo primero si no tenés ese contexto) — ahí quedó "las 6 decisiones de
> producto están hechas"; acá es el siguiente tramo, los ajustes de diseño
> pixel-a-pixel sobre lo ya implementado.

## 1. Qué es `design/AJUSTES-1.md`

Alejandro subió un segundo documento después del handoff original: no pide
features nuevas, pide **llevar lo ya construido a la fidelidad exacta del
mockup** (`design/Mangomundi 4 - Final.dc.html`) — tipografía, jerarquía de
la tabla de resultados, y dos piezas que el handoff original describía pero
nunca se habían construido (la sección de corredores exclusivos y el
preview real del widget). Trae un "Orden sugerido" explícito al final, que
se siguió al pie de la letra, un commit por paso:

1. **A · Tipografía** — commit `4d7d9a6`
2. **C1 + C3 · sacar encabezado, limpiar sello** — commit `4e15c73`
3. **C2 · los tres botones de orden** — commit `06aab33`
4. **B · h1 del hero + enlace de cambio local** — commit `974d6f1`
5. **C4 + D · detalles de fila + agente IA** — commits `48cb7e4` (C4) y
   `82faeb4` (D, más grande de lo que el doc dejaba ver — ver §3 abajo)
6. **F + G · copy de banda oscura + "For business"** — commit `828140f`
7. **E · sección "Today's routes, already priced"** — commit `4b6e23a`
8. **H · preview del widget con resultado real** — commit `02f72d5`

## 2. Principio que gobernó cada paso

El mismo de siempre en este proyecto — **nunca inventar datos** — aplicado
puntualmente varias veces donde el mockup usa un número o una afirmación
que la demo estática del `.dc.html` puede sostener pero un resultado real
no siempre puede:

- **C2** (los 3 botones grandes): el hint "Under 10 min" del botón
  "Fastest" es literal en el mockup, pero un proveedor más rápido real
  puede tardar horas o días. La cifra se calcula de verdad
  (`formatDeliverySpeed`, la misma función que ya usa la fila), el hint
  queda genérico ("Fastest option").
- **C4**: el delta reusa el mismo formato pero real; el regulador muestra
  `row.regulator` de verdad (p.ej. "FCA") en vez del "Regulated" literal
  del mockup.
- **F**: "Providers" se queda en "50+" — no existe un conteo real de
  proveedores TOTALES en el servidor (`getProviderCounts` solo da
  retail/business por separado, sumarlos duplicaría los "both"). El 4.6 de
  Trustpilot reusa el mismo número ya usado en `comparator.trustpilot.rated`
  — no es un dato nuevo inventado para la tarjeta.
- **E**: la sección entera se diseñó alrededor de esto — ver §4.

## 3. Lo más grande de esta ronda — D (reskin oscuro del agente IA)

El documento lo presentaba como "las preguntas del agente están truncadas"
— una lista de chips a una sola columna. Al mirar el mockup con cuidado, esa
lista vive dentro de una tarjeta **completa** con fondo `#241C16` (no el
tema claro del sitio), y los colores exactos que pedía (`rgba(255,255,255,.07)`
para los chips) solo tienen sentido sobre un fondo oscuro. Se paró la
implementación y se confirmó el alcance real con Alejandro antes de tocar
nada — eligió el reskin completo, fiel al mockup, no el recorte mínimo.

`FloatingAgent` (dentro de `ComparatorSection.tsx`, usado tanto flotante
como acoplado en el rail) quedó con fondo `#241C16`/texto `#F1EBE4` en:
header, cajas de bienvenida/upsell, burbujas de chat (markdown vía
`prose-invert` de `@tailwindcss/typography`, no recoloreado a mano),
composer (pastilla blanca + botón de enviar naranja `#EE5B3E`), y las
preguntas sugeridas de `AiCopilot.tsx` — una por línea, ancho completo,
flecha `→` en `#FF8A6B`. `AiCopilot` se reskineó directo (no se agregó una
prop de variante) porque solo se usa dentro de este panel, ya oscuro.

## 4. E — la única pieza nueva de peso

"Today's routes, already priced" no existía. El mockup usa 6 pares
hardcodeados; no había ninguna fuente real de "corredores con tarifa
exclusiva" en el backend, y este sandbox no tiene credenciales de Supabase
para escribir y probar una query nueva contra datos reales. Se confirmó con
Alejandro el enfoque antes de construir: **reusar `compareProviders`** (el
mismo server fn que ya usa todo el sitio) sobre una lista candidata fija de
8 pares de moneda, en vez de escribir lógica de query nueva sin poder
verificarla.

- **`getExclusiveCorridors`** (`src/lib/fx.functions.ts`) — llama a
  `compareProviders` directo, server-a-server (TanStack Start permite esto
  sin round-trip HTTP), para cada candidato con `amount=1000`. Un candidato
  solo entra si la fila que **gana** (mayor `received`) es la que tiene
  `has_exclusive_deal` — no alcanza con que algún proveedor del corredor
  tenga oferta exclusiva en algún lugar de la lista.
- **`TodaysRoutesSection.tsx`** (+ `useExclusiveCorridors`, hook con React
  Query) — debajo del comparador solo mientras no hay búsqueda (mismo
  `hasResult` que ya usa el hero). Rotación "en cada visita": offset
  aleatorio sobre la lista real calificada, recalculado en cada carga de
  página. Si ningún candidato califica hoy, la sección no se renderiza —
  no hay versión honesta de "acá hay una tarifa exclusiva" cuando no la
  hay.
- **No se pudo probar en vivo** — mismo motivo de siempre, sin Supabase en
  este sandbox. Verificado por tipos (`tsc` confirma que la llamada directa
  a `compareProviders` compila) y un render con datos mockeados
  (`renderToStaticMarkup`, scaffolding descartado después).

**Primera sesión con credenciales de Supabase o preview de Vercel:**
cargar la home sin búsqueda y confirmar que la sección aparece con corredores
reales — es la pieza menos verificable de todo este documento.

## 5. Hallazgos menores que valen la pena anotar

- **H — el bloque de invitación del widget ya existía.** El documento
  describía "el bloque de invitación al pie, que hoy no está" — pero
  `CompactResultsList` ya lo tenía, construido en la ronda anterior
  (decisión #3 del handoff original), con el conteo real
  (`result.rows.length`), no un número inventado. El documento describía un
  estado del código anterior a ese trabajo. Lo único que hacía falta para
  H era que el **preview** mostrara un resultado real en vez del estado
  vacío — se logró con un prop nuevo `previewDestination` en
  `EmbedComparator`, seteado solo desde el preview de la home (la ruta real
  `/embed` sigue arrancando vacía si el embebedor no configuró un destino).
- **G — `/business` no tenía ningún link apuntándole.** La ruta existía
  desde la ronda anterior (Fase B de rutas) pero nada en la nav ni en el
  contenido de la home enlazaba a ella. El botón nuevo "Get business
  quotes" de `BusinessSection.tsx` es el primer link real.
- **B — el enlace "Exchanging currency inside one country? ↗" no tiene
  destino.** No existe pantalla `/exchange` (el handoff original ya lo
  reconocía como no diseñado). Se implementó como `<button>` inerte, sin
  navegación — no un `<a href="#">`, que en producción haría scroll-to-top
  al clickear y se leería como un link roto. Confirmado con Alejandro antes
  de implementar.
- **C4 — "Sponsored offer" no estaba gateado por `row.sponsored`.** El
  badge esquina que el documento describe (y que ahora es texto de pie de
  fila, "Affiliate link") seguía usando `row.has_exclusive_deal` como
  trigger, no el campo `sponsored` real que existe en el schema pero nunca
  se conectó a nada. Se mantuvo el mismo trigger (`has_exclusive_deal`) —
  cambiar a qué flag cuenta como "sponsored" es una decisión de producto
  aparte, no algo para decidir de paso en un ajuste de presentación.

## 6. i18n de toda esta ronda

Mismo mecanismo que la ronda anterior: cada key nueva se agrega primero en
inglés y se propaga como **placeholder EN** (no traducción real) a los 19
`scripts/translations/<lang>.json` + `.pending.json`. Cuando el paso
**cambiaba el texto de una key ya traducida** (no una key nueva) — el h1 del
hero, la neutralidad, el título de "For business", el CTA "Talk to us" — se
tocó **solo el inglés**; las otras 19 (y el overlay a mano en español
dentro de `i18n.tsx`) se dejaron con el string viejo, sin re-traducir sin
revisión (decisión #8 de la ronda anterior, se siguió aplicando acá).

Un par de veces un cambio dejó una key sin ningún uso (`home.hero.titlePre`/
`titleAccent` consolidadas en `home.hero.headline`; `home.stats.founded`
al sacar "2026 Founded"; `comparator.badge.sponsored` y
`comparator.table.reviews` al restylear la fila) — se **eliminaron** del
inglés + los 19 idiomas + el ledger, en vez de dejarlas huérfanas.

## 7. Verificación hecha en cada paso

`tsc --noEmit` limpio, `eslint` sin errores nuevos (mismo único error
preexistente en `i18n.tsx` ~línea 3600, `react-hooks/rules-of-hooks` sobre
un `useRouterState` envuelto a propósito en `try/catch`, no relacionado),
`I18N_STRICT=1 npx tsx scripts/i18n-validate.ts` en verde después de cada
key nueva/eliminada, y — para cada componente tocado — un render real vía
`renderToStaticMarkup` con datos mock (temporalmente exportando el
componente/función si no lo estaba, agregando el alias `@` a
`vitest.config.ts`, corriendo el test, y revirtiendo todo el scaffolding
antes de commitear). Confirmado en cada paso que `git status --short` no
mostraba nada suelto antes de `git add`.

**Nada de esto se pudo probar contra Supabase real** — mismo límite de
siempre en este sandbox. `getExclusiveCorridors` en particular es la pieza
más grande sin verificación end-to-end.

## 8. Cómo seguir

1. Leer `docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md` primero
   si no se leyó todavía (contexto de la ronda anterior).
2. Este documento cubre `design/AJUSTES-1.md` completo — no debería quedar
   nada pendiente de ese archivo específico.
3. Antes de mergear a `main`: cargar la home con credenciales de Supabase
   reales (o un preview de Vercel) y mirar, en este orden — es lo menos
   verificado de esta rama entera:
   - La sección E (`TodaysRoutesSection`) — ¿aparecen corredores reales?
   - El rail (§3.10 del handoff anterior) con un resultado real.
   - El panel del agente IA oscuro (§3 de este documento) con una
     conversación real — el `prose-invert` del markdown y el contraste de
     las burbujas nunca se vieron en un navegador real.
4. **Actualizar este archivo** (o agregar uno nuevo con fecha) si aparece
   otro documento de ajustes — mismo mecanismo que `docs/PROJECT-STATE.md`.
