# mangomundi — estado del proyecto (para cualquier Claude nuevo)

> Punto de entrada único. Si estás por trabajar en este repo y no tenés el
> contexto de sesiones anteriores, leé este documento primero — resume todo
> lo que hay que saber sin necesitar la conversación original. Los documentos
> de investigación completos (verbatim, tal cual los escribió/subió Alejandro
> o una sesión anterior) están en `docs/handoff/` y `docs/multi-criteria-ranking/`;
> este archivo es el índice y el resumen ejecutivo, se actualiza cada vez que
> se cierra un sprint o se toma una decisión de arquitectura importante.

## 1. Qué es mangomundi

Plataforma multilingüe (20 idiomas) de comparación de proveedores de
remesas/FX con agente AI integrado. Objetivo: comparaciones **precisas por
corredor** (país origen → país destino), con tarifas y datos reales — nunca
inventados —, monetización por afiliados donde exista.

- **Stack:** TanStack Start, React 19, Bun, Vite 7, Supabase (PostgreSQL),
  Tailwind v4, shadcn/ui, cmdk. Deploy en Vercel (Nitro, target auto-detectado).
- **Repo:** `aleviercas/mangomundi` (GitHub, público). `main` es producción.
- **Supabase `project_id`:** `ttqalbexpquzobrdyvgx` (región `eu-west-1`).
- **i18n:** inglés inline en `src/lib/i18n.tsx` (fuente de verdad) + 19 idiomas
  en `scripts/translations/<lang>.json`. Gate estricto en el prebuild
  (`bun run i18n:check`) — ninguna key puede faltar en ningún idioma.

## 2. Principios de trabajo (no negociables)

- **Nunca inventar datos.** Todo dato de tarifa/tasa/trust que se carga a
  Supabase necesita una fuente citable (`data_source`, `data_collected_at`).
  Lo "sin confirmar" queda marcado como tal, nunca se muestra como hecho
  verificado.
- Cuando un dato no existe para un proveedor/corredor, el motor de scoring
  (`src/lib/scoring.functions.ts`) lo trata como **neutral (0.5)**, no como
  penalización — no hay apuro en completar el 100% de todo antes de activar
  algo.
- Migraciones **aditivas únicamente** contra producción compartida (Supabase
  es la misma base para todas las ramas — no hay entorno de staging separado).
- Antes de cargar SQL generado con datos de texto libre, escapar comillas
  simples (`'` → `''`) siempre por código, nunca a mano.

## 3. Modelo de datos: `providers` vs `fx_rates`

**El problema que se resolvió (sprint ago 2026):** `compareProviders`
(`src/lib/fx.functions.ts`) filtraba solo por `active` + `segment`, sin
ningún filtro de corredor — cualquier proveedor activo aparecía en cualquier
comparación, usando un número de comisión/margen **plano y global**
(`fee_percent`/`fee_fixed`/`spread_percent` en `providers`, o `fee_tiers`
jsonb por tramo de monto), sin importar si ese proveedor realmente opera esa
ruta.

**Dos familias de proveedores** (columna `providers.is_corridor_specific`):

- **Tipo A — corridor-specific (`is_corridor_specific = true`):** MTOs
  clásicos que solo operan corredores concretos (WorldRemit, Remitly,
  MoneyGram, Sendwave, Paysend, Ria, Xoom, TapTap Send, LemFi, NALA, Small
  World, bancos/exchanges regionales del Golfo, etc.). Regla: **sin fila en
  `fx_rates` para ese corredor exacto → no se muestra**.
- **Tipo B — cobertura amplia (`is_corridor_specific = false`):** brokers
  multi-moneda sobre infraestructura SWIFT (Wise, OFX, Revolut, Airwallex,
  Moneycorp, CurrencyFair, TorFX, Currencies Direct, CAB Payments, HSBC,
  Chase, Santander, Payoneer, Skrill, TransferGo, XE, Instarem). Por diseño
  cubren casi cualquier par de monedas — nunca se ocultan por falta de fila en
  `fx_rates`, siguen usando `fee_tiers`/campos planos.

**Regla de precedencia** (implementada en `compareProviders`):

```
SI existe fila en fx_rates para (proveedor, corredor exacto, monto en tier)
  → usar fx_rates (fee, spread, speed) — gana siempre
SINO SI el proveedor es Tipo B (o tiene fee_tiers propio)
  → usar fee_tiers / campos planos (comportamiento histórico)
SINO (Tipo A sin fila de corredor)
  → no se muestra en ese corredor
```

**Feature flag:** `ENABLE_CORRIDOR_FILTERING` (env var, default off/false).
Con el flag apagado, el comportamiento es el histórico (sin filtro de
corredor). Diseñado así a propósito para poder cargar datos y verificar en
preview sin afectar producción hasta activarlo explícitamente.

**Tabla `corridor_notes`:** documenta corredores donde a propósito **no** se
cargó cobertura (sanciones vigentes, o corredores dominados por especialistas
tipo hawala que no están en el catálogo). Ver sección 6.

## 4. Estado de los datos (última auditoría: sprint ago 2026)

- **`providers`:** 59 filas (40 Tipo A / 19 Tipo B), todas con `trust_score`
  poblado salvo CAB Payments (a propósito — es infraestructura B2B sin
  reviews de consumidor, ver `docs/multi-criteria-ranking/scoring-data-findings.md`).
- **`fx_rates`:** 745 filas, 248 corredores distintos. 100% de las 650
  combinaciones (proveedor, corredor) del catálogo maestro original
  (`docs/handoff/catalogo_mundial_final.csv`, 684 filas / World Bank RPW
  Q3 2025) están cargadas. Cero proveedor Tipo A activo sin datos.
- **`transparency_score`:** null en absolutamente todos los proveedores, a
  propósito — se sacó del motor de scoring (`most_transparent` profile
  eliminado) por no existir ninguna fuente documentada para ese número en
  todo el repo. No es un hueco a rellenar salvo que aparezca una fuente real.
- **Corredores documentados como excluidos** (`corridor_notes`): Alemania→Rusia
  y Alemania→Siria (sanciones — los proveedores grandes no operan ahí de
  forma confiable), Suecia/Noruega→Somalia (dominado por especialistas hawala
  fuera del catálogo — hace falta sumar un proveedor nuevo, no solo cargar
  tarifas).

## 5. UI del comparador — rediseño country-first (sprint ago 2026)

El picker principal pasó de **currency-first** a **country-first**: el
usuario elige país de origen/destino (`CountryCombobox`), la moneda se deriva
automáticamente (`localCurrency()`). Antes, elegir una moneda mapeaba a un
único "país primario" hardcodeado (ej. EUR → siempre Alemania), lo que hacía
irreconciliable con `fx_rates` (una moneda como EUR cubre 9+ países emisores
con tarifas reales distintas cada uno) — además de no ser cómo funciona
ningún comparador real del rubro (Remitly/WorldRemit/Western Union lideran
con país, no con moneda).

**Caso especial — cuenta multi-moneda:** un usuario que envía desde y hacia
el mismo país pero en una moneda distinta a la local (ej. vive en UK pero
tiene cuenta Wise/Revolut en EUR) tiene una disclosure opcional ("¿necesitás
otra moneda?") que abre dos `CurrencyCombobox` independientes. Al activarse,
el servidor detecta la divergencia (`currencyOverridden` en
`fx.functions.ts`) y **excluye todos los proveedores Tipo A** — genuinamente
no pueden operar en una moneda que no sea la local del país, solo los
brokers de cobertura amplia sirven ese caso. La guardia de "mismo país =
inválido" (`sameCorridorBlocked`) respeta este caso: mismo país + moneda
distinta ya no cuenta como corredor inválido.

## 6. Sprints / prioridades (estado a la fecha)

Orden de prioridad acordado con Alejandro:

1. **Diseño premium** — no arrancado todavía.
2. **Precisión de producto/datos** (este documento) — runbook de 7 pasos
   ejecutado completo, flag `ENABLE_CORRIDOR_FILTERING` cargado y verificable
   en preview, pendiente activarlo en producción tras verificación manual.
   Investigación de corredores/proveedores faltantes: completa contra el
   catálogo original, con una pasada adicional de ~50 corredores de alto
   volumen mundial verificados y cargados (ver `git log` de la rama
   `claude/mangomundi-sprint-corridor-ui` para el detalle commit por commit).
3. **SEO / crecimiento orgánico:**
   - Interconexión del blog ("artículos relacionados") — diseñada
     (`docs/handoff/blog-articulos-relacionados.md`, taxonomía `topic_cluster`
     nivel "pillar + cluster"), implementación pendiente de confirmar si ya
     se aplicó la migración/UPDATE en Supabase.
   - Traducción del blog a 20 idiomas — en progreso, ver `ale.md` sección 9
     para el estado exacto (última cifra conocida: 29/400 filas).
   - Investigar por qué algunos posts no indexan en Google Search Console —
     **no arrancado**.
4. **Afiliados** — prioridad más baja, investigación intermitente. Ver
   sección 7.

## 7. Afiliados — estado conocido

**Activos hoy** (con `affiliate_url` real, `sponsored=true`): Wise, Airwallex,
Currencies Direct, TorFX, MoneyGram, Instarem.

**Plataformas de afiliados usadas:** Partnerize (`console.partnerize.com`),
Impact (`app.impact.com`), CJ Affiliate (`members.cj.com`), Sovrn
(`platform.sovrn.com`). FlexOffers — cuenta declinada, no sirve para este
proyecto aunque Sendwave figure ahí.

**Candidatos con afiliado confirmado o alta probabilidad, sin registrar
todavía:**
- **Sendwave** — mismo grupo que WorldRemit (Zepz), que ya tiene afiliado
  activo. Acción de mayor potencial/menor esfuerzo: preguntarle al equipo de
  afiliados de WorldRemit si el acuerdo ya cubre Sendwave.
- **Paysend** — programa de afiliados real confirmado vía redes de terceros
  (no solo referidos). Candidato fuerte para aplicar directo.

**Confirmado que NO tienen afiliado publisher (solo referidos usuario-a-usuario):**
Aspora, Al Ansari, Hubpay, ARQ Finance. Skrill tiene programa de afiliados,
pero es específicamente para la industria del gaming/depósitos de wallet, no
aplica a transferencias P2P.

**Sin confirmar todavía:** GCC Exchange, Wall St Exchange, Al Fardan
Exchange, e& money (telco, afiliado improbable), Payit (producto de banco,
afiliado improbable), CashMinute, Rocket Remit (en un corredor investigado
resultó caro — bajar prioridad, no descartar).

**Pendientes de esta línea de trabajo:** emails redactados sin enviar a
Redpin (Currencies Direct + TorFX) y a OFX; aplicación de afiliado a
Moneycorp; registro de afiliado en WorldRemit; evaluar integrar la API paga
de Trustpilot Data Solutions.

Detalle completo, corredor por corredor, en
`docs/handoff/tabla-maestra-proveedores-nuevos.md`.

## 8. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Runbook técnico original (diagnóstico, modelo de datos, plan de rollout paso a paso) | `docs/handoff/arquitectura-corredor-proveedores.md` |
| Investigación de proveedores nuevos por corredor + estado de afiliados | `docs/handoff/tabla-maestra-proveedores-nuevos.md` |
| Briefing de traspaso general (blog, redes, principios de trabajo) | `docs/handoff/briefing-traspaso.md` |
| Diseño de interconexión del blog | `docs/handoff/blog-articulos-relacionados.md` |
| Catálogo maestro original de corredores (684 filas, World Bank RPW Q3 2025) | `docs/handoff/catalogo_mundial_final.csv` |
| Metodología e investigación de `trust_score` por proveedor | `docs/multi-criteria-ranking/scoring-data-findings.md` |
| Investigación de métodos de entrega (cash pickup, etc.) | `docs/multi-criteria-ranking/delivery-methods-findings.md` |
| Runbook de traducción del blog | `docs/blog-translation-runbook.md` |
| Changelog de UI/UX/SEO del sitio (home, hero, widget, secciones institucionales) | `ale.md` (raíz del repo) |
| Lógica de comparación de proveedores + flag de corredores | `src/lib/fx.functions.ts` |
| Motor de scoring multi-criterio | `src/lib/scoring.functions.ts` |
| Sección del comparador (UI) | `src/sections/ComparatorSection.tsx` |

## 9. Cómo continuar

Si es una sesión nueva de Claude sin memoria de esta conversación: leer este
archivo primero, después `ale.md` para el estado de UI/SEO, después el
`docs/handoff/` que corresponda al tema puntual que se va a tocar. No hace
falta leer los 5 documentos de handoff completos para cambios chicos — este
índice ya resume lo esencial de cada uno.

**Actualizar este archivo** cada vez que se cierre un sprint, se cargue una
tanda grande de datos, o se tome una decisión de arquitectura — es el
mecanismo acordado para que el contexto sobreviva entre sesiones (reemplaza
depender de adjuntar archivos sueltos cada vez).
