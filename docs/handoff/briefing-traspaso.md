# mangomundi — Briefing de traspaso (estado completo del proyecto)

> Documento de handoff. Adjuntar este archivo junto con
> `mangomundi-tabla-maestra-proveedores-nuevos.md`,
> `mangomundi-arquitectura-corredor-proveedores.md` y `catalogo_mundial_final.csv`
> al iniciar una conversación nueva. Con estos 4 archivos, un Claude nuevo tiene
> el contexto completo sin necesitar la transcripción de la sesión original.

---

## 1. Qué es mangomundi

Plataforma multilingüe de comparación de proveedores de remesas/FX con agente
AI. Objetivo: comparaciones precisas por corredor, con tarifas y afiliados
reales, monetización por afiliados donde exista.

**Stack:** TanStack Start, React 19, Bun, Vite 7, Supabase (PostgreSQL),
Tailwind v4, shadcn/ui
**Repo:** `aleviercas/mangomundi` (GitHub, público), deploy a Vercel desde `main`
**Supabase project_id:** `ttqalbexpquzobrdyvgx`
**Proveedores activos hoy:** 33 filas en `providers` (30 activas), mostradas
hoy de forma imprecisa en todas las rutas — este es el problema que se está
resolviendo (ver documento de arquitectura).

---

## 2. Estado — Blog multilingüe (COMPLETADO en esta sesión)

Se escribieron y cargaron **3 temas nuevos**, cada uno en **20 idiomas** (60
filas totales, `published = true`, ya visible en el sitio):

| slug | Tema | Audiencia |
|---|---|---|
| `kenya-mobile-money-remittance-fees` | Remesas a M-Pesa/Airtel Money en Kenia | retail |
| `us-philippines-ofw-remittance-guide` | EEUU→Filipinas, familias OFW | retail |
| `small-ecommerce-overseas-supplier-payments` | Pago a proveedores en el exterior | business |

Con esto, el sitio tiene **23 temas de blog × 20 idiomas** publicados en total
(20 preexistentes + estos 3). Método usado: escribir en inglés, traducir en
tandas de 4-5 idiomas, cargar con SQL `ON CONFLICT DO UPDATE`, verificar con
`SELECT count(DISTINCT locale)`. **No queda nada pendiente del blog.**

---

## 3. Estado — Arquitectura de proveedores por corredor (EN CURSO, es la prioridad)

**Ver los dos documentos dedicados** — no repito el detalle acá, solo el resumen:

- `mangomundi-tabla-maestra-proveedores-nuevos.md`: investigación de
  proveedores nuevos por corredor (UAE→India, UK/EEUU→Nigeria, EEUU→Vietnam,
  AU→Filipinas), con estado de afiliado por candidato y fuente de datos.
- `mangomundi-arquitectura-corredor-proveedores.md`: diagnóstico técnico
  (verificado contra el código real y el schema real de Supabase), modelo de
  datos propuesto, regla de convivencia/precedencia, y **runbook de 7 pasos
  listo para ejecutar**.

**Lo más importante para no perder:**
- El problema real: `compareProviders` en `fx.functions.ts` filtra solo por
  `active` + `segment`, sin filtro de corredor. La tabla `fx_rates` ya existe
  con el schema casi perfecto para resolverlo, pero tiene **0 filas**.
- Regla de precedencia acordada: dato de corredor específico (`fx_rates`) >
  tier por monto (`fee_tiers`) > número plano global (comportamiento actual).
- Candidatos con afiliado confirmado o muy probable: **Sendwave** (mismo grupo
  que WorldRemit, ya afiliado activo — contactar para ver si el acuerdo ya lo
  cubre) y **Paysend** (afiliado publisher real confirmado).
- Walmart2World **no es un proveedor independiente** — es MoneyGram/Ria con
  pricing especial de Walmart, no se puede sumar como candidato propio.
- Próxima acción concreta: el runbook de la sección 9 del documento de
  arquitectura, empezando por la migración SQL aditiva.

---

## 4. Estado — UI del comparador y scoring (de sesiones previas, ya en producción)

- `sortByScore`: "overall"/Smart usa blend ponderado; el resto de perfiles usa
  ordenamiento estricto por campo único con desempate (campo → sponsored →
  score)
- `deriveBadges` fue eliminado por completo
- Chips de orden planos: overall/fastest/most_trusted/recipient_gets_most/
  lowest_cost/best_exchange_rate
- Filtro "Exclusive rates" (chip naranja, ícono Sparkle)
- `most_transparent` fue sacado del scoring por falta de fuente documentada —
  principio a mantener: nada entra al scoring sin fuente real verificable
  (mismo criterio aplicado ahora a los datos de corredor)

---

## 5. Afiliados — estado y pendientes sueltos

**Activos hoy:** wise, airwallex, currencies-direct, torfx, moneygram, instarem
(todos con `affiliate_url` real, `has_exclusive_deal=true`, `sponsored=true`)

**Plataformas de afiliados:**
- Partnerize: `console.partnerize.com` — hello@mangomundi.com (User ID: 1011l427471)
- Impact: `app.impact.com` (Walmart está acá también, si se investiga esa vía)
- CJ Affiliate: `members.cj.com`
- Sovrn: `platform.sovrn.com`
- FlexOffers: **cuenta declinada** (#1555737) — Sendwave aparece listado ahí,
  pero esta vía específica no sirve para mangomundi

**Pendientes sin resolver (no bloqueantes, retomar cuando haya tiempo):**
1. Email a Treve Nankervis (Redpin/CurrencyDirect+TorFX) — respuesta redactada, no enviada
2. Email a Val Jagar (OFX) — respuesta corta redactada, no enviada
3. Aplicación de afiliado a Moneycorp
4. Registro de afiliado en WorldRemit
5. Integración de Trustpilot Data Solutions API (de pago, no conectada)
6. Atribución del widget por sitio embebido (Britizenship.uk pendiente)

---

## 6. Estrategia de redes sociales (definida a nivel general, sin calendario armado)

- LinkedIn → B2B (natural para posts de tesorería/pagos a proveedores)
- Facebook → retail/remesas
- Instagram → carruseles comparativos
- X → contenido corto
- **No se cerró el mecanismo de tandas** (por post nuevo, mezclado, o por
  plataforma) — quedó pausado para priorizar la arquitectura de proveedores.
  Con 23 temas ya publicados, hay inventario de sobra para arrancar cuando se
  retome.

---

## 7. Principios de trabajo a preservar (importante para cualquier Claude nuevo)

- **Nunca inventar datos** — todo lo "sin confirmar" debe quedar marcado así
  explícitamente, nunca mostrado como si fuera un hecho verificado
- **Disciplina de escape SQL:** generar el SQL siempre con la función `esc()`
  de Python (reemplaza `'` por `''`), nunca transcribir SQL a mano con
  apóstrofes — hay un historial real de fallas silenciosas por esto (batch de
  tagalo con "iba't ibang")
- SQL se carga en Supabase en chunks de 4-5 filas con `ON CONFLICT DO UPDATE`
  para upserts seguros
- Corredores se verifican con `SELECT count(DISTINCT locale)` después de cada carga
- Metodología primaria para corredores sin API en vivo: World Bank Remittance
  Prices Worldwide (`remittanceprices.worldbank.org`) — 365 corredores, 48
  países emisores, 105 receptores, actualizado trimestralmente

---

## 8. Cómo usar este traspaso

1. Al abrir la conversación nueva, subir los 4 archivos (este + los otros 3)
2. Pedirle a Claude que lea los 4 antes de arrancar
3. Si es una cuenta/Proyecto distinto, considerar además actualizar el skill
   `mangomundi` (en `/mnt/skills/user/mangomundi/SKILL.md`) con las decisiones
   de arquitectura de esta sesión, para que quede como contexto permanente que
   se activa automáticamente en cualquier chat futuro que mencione el proyecto
   — es el mecanismo más durable, mejor que depender de adjuntar archivos cada vez
