# mangomundi — Handoff 25-ago-2026: fix de CI, auditoría "otras regiones" y research pendiente

> Este documento continúa (no reemplaza) `docs/handoff/briefing-traspaso.md`, que
> sigue teniendo vigente la sección de principios de trabajo (sección 7 de ese
> doc), el estado de afiliados y la estrategia de redes. Este handoff cubre
> específicamente el trabajo de investigación/carga de corredores de la ronda
> "otras regiones" (24-25 ago 2026) y el fix de CI resuelto en esta sesión.

**Repo:** `aleviercas/mangomundi` (main). **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Regla de carga vigente en todo este trabajo:** solo precio regular/estándar —
nunca promocional ni de "primera transferencia" — con fuente primaria citada y
fecha de acceso. Nunca inventar números. Toda migración aplicada a Supabase se
espeja como archivo `.sql` en `supabase/migrations/` **usando la versión real
que Supabase asigna** (ver sección 1, es el error que causó el incidente de CI).

---

## 1. Incidente de CI "Supabase Preview" — RESUELTO

**Síntoma reportado por el usuario:** el check de GitHub Actions "Supabase
Preview" fallaba con `Remote migration versions not found in local migrations
directory.`

**Causa raíz:** `mcp__Supabase__apply_migration` asigna la `version` real de
cada migración según el timestamp en que efectivamente se aplica en Supabase —
el parámetro `name` que uno pasa es solo una etiqueta, no controla la versión.
Durante la ronda "otras regiones" (25-ago), varias migraciones se espejaron a
GitHub usando **timestamps inventados/secuenciales** (`20260825095600`,
`20260825100000`, `20260825100100`, `20260825100200`, `20260825100300`) en vez
de consultar la versión real. El check de CI compara el historial de
migraciones aplicadas en remoto (`supabase migration list` / equivalente)
contra los archivos locales por nombre de archivo — al no coincidir, falla.

**Fix aplicado (este handoff, 25-ago):**
1. Se obtuvo el historial real vía `mcp__Supabase__list_migrations` y se comparó
   contra el directorio `supabase/migrations/` en GitHub.
2. Se crearon 6 archivos nuevos con las versiones reales correctas (incluyendo
   separar un archivo que combinaba 2 migraciones remotas distintas en 2
   archivos, uno por versión real): `20260825182755_load_otras_regiones_corridors_batch_final.sql`,
   `20260825182812_fix_ubl_tezraftaar_generic_fields.sql`,
   `20260825191629_load_otras_regiones_corridors_batch2.sql`,
   `20260825193454_load_otras_regiones_corridors_batch3_nicho.sql`,
   `20260825200312_reverify_sin_confirmar_batch4.sql`,
   `20260825201303_load_otras_regiones_corridors_batch5_nicho2.sql`.
3. Los 5 archivos viejos con timestamp inventado se reemplazaron por un
   comentario "tombstone" (no se pudo usar `delete_file`: **no existe esa
   herramienta en el servidor MCP de GitHub conectado a este dispositivo** —
   solo hay `create_or_update_file`/`push_files`). Esto evita que un futuro
   `supabase db push` reintente aplicar SQL de datos bajo una versión fantasma.
4. **Verificación cruzada final (25-ago, tras el fix):** se volvió a llamar
   `list_migrations` después de subir los tombstones y **las 5 versiones viejas
   inventadas aparecieron también en el historial remoto** (con nombre
   coincidiendo con el commit de cada tombstone). La lectura más probable es
   que el workflow de CI corre `supabase db push` automáticamente en cada push
   a `main`, y al pushear los archivos (tanto los originales con SQL real como
   luego los tombstones) los aplicó como migraciones nuevas bajo esos
   timestamps de archivo. Como el SQL original ya estaba aplicado (constraint
   `fx_rates_provider_corridor_tier`), un reintento de las filas ya existentes
   debería fallar por conflicto — pero los INSERT llevaban `on conflict ...
   do nothing` en algunos casos y no en otros; **no se pudo confirmar con
   certeza si hubo algún efecto secundario real en datos durante esas
   aplicaciones automáticas pasadas** (no se detectaron filas duplicadas al
   auditar, pero no se hizo una auditoría exhaustiva fila por fila de los 45
   corredores). Punto a vigilar, no bloqueante.
5. **Estado final confirmado por comparación directa:** las 35 versiones que
   devuelve `list_migrations` tienen hoy un archivo local con el mismo prefijo
   de timestamp, y viceversa. El error específico reportado ("remote no
   encontrado en local") debería estar resuelto.

**Lo que falta para cerrar esto del todo (no se pudo hacer desde este entorno):**
- **No hay forma de confirmar que el check de GitHub Actions realmente pasa**
  en el próximo run — no hay `gh` CLI ni credenciales de push en el contenedor
  cloud, y el servidor MCP de GitHub no tiene herramienta para leer el estado
  de workflow runs (`get_pull_request_status` no aplica porque se pushea
  directo a `main`, no hay PR). **Pedirle al usuario que revise el tab
  "Actions" del repo en GitHub** (o el link de Supabase del error original)
  después de este commit para confirmar visualmente que el check quedó verde.
- Si sigue fallando, sospechar primero de la hipótesis del punto 4 (CI corre
  `db push` automático) — en ese caso el problema real podría ser que el
  workflow intenta aplicar migraciones que ya fueron aplicadas manualmente vía
  MCP y choca con el historial, no con archivos faltantes. Leer el YAML del
  workflow (`.github/workflows/*.yml` — no se pudo leer desde acá, dio "Not
  Found" con `get_file_contents`; puede ser un problema de permisos del token
  del device bridge, o el path/nombre exacto es distinto) para confirmar qué
  comando corre exactamente.

---

## 2. Auditoría "documentación investigada → cargada en GitHub" — COMPLETADA

Se comparó cada doc del proyecto de Claude (`claude/*.md`, 10 documentos)
contra `docs/data-sources/` en GitHub. Resultado: **9 de 10 ya estaban
espejados** (a veces consolidados varios docs de proyecto en un solo archivo de
GitHub más prolijo). El único gap real encontrado:

- `claude/investigacion-tarifas-ria-xoom-2026-08-24.md` (research exploratorio
  Ria/Xoom, corredor GB/US→México, 24-ago) **no estaba mirroreado**. Se creó
  `docs/data-sources/2026-08-24-investigacion-tarifas-ria-xoom.md` con una nota
  de estado agregada explicando qué de sus 3 hallazgos sigue vigente.
- Al revisar ese gap, se encontró que **Ria GB→MX nunca se había cargado a
  `fx_rates`** (Ria US→MX y Xoom GB→MX sí, con valores más recientes de otra
  ronda). Se cargó vía migración `20260825232229_load_ria_gb_mx_gap_from_docs_audit.sql`,
  marcada `sin_confirmar` por la antigüedad relativa del dato (23-ago vs. el
  resto de la ronda del 25-ago).

**Mapa de correspondencia final (proyecto → GitHub):**

| Doc del proyecto Claude | Archivo en `docs/data-sources/` |
|---|---|
| `research-tarifas-escalonadas-13-proveedores.md` | `2026-08-25-research-tarifas-y-cobertura-argentina.md` |
| `cotizacion-uk-argentina-5-proveedores-2026-08-25.md` | ídem (consolidado) |
| `investigacion-global66-argentina-2026-08-25.md` | ídem (consolidado) |
| `investigacion-tarifas-ria-xoom-2026-08-24.md` | `2026-08-24-investigacion-tarifas-ria-xoom.md` (nuevo, este handoff) |
| `diagnostico-arquitectura-proveedores-corredores.md` | `2026-08-diagnostico-arquitectura-proveedores-corredores.md` |
| `auditoria-cobertura-otras-regiones-2026-08-25.md` | `2026-08-25b-auditoria-cobertura-otras-regiones.md` |
| `re-verificacion-5-corredores-sin-confirmar-2026-08-25.md` | ídem (tanda 4, consolidado) |
| `investigacion-sudeste-asiatico-2026-08-25.md` | `2026-08-25c-auditoria-cobertura-otras-regiones-fase1.md` |
| `investigacion-medio-oriente-golfo-2026-08-25.md` | ídem (consolidado) |
| `investigacion-europa-del-este-2026-08-25.md` | ídem (consolidado) |
| `reverificacion-europa-del-este-ria-moneygram-2026-08-25.md` (nuevo, este handoff) | referenciado en el mismo archivo, contenido inline |

---

## 3. Investigación "a mitad de camino" — Europa del Este, CERRADA

Los 4 casos puntuales que habían quedado sin confirmar por límite de sesión de
WebFetch en la ronda anterior:

- **Ria → Bulgaria: CONFIRMADO**, corredor real y activo (cash pickup 6.000+
  ubicaciones, banco, billetera ePay.bg).
- **Ria → Serbia: CONFIRMADO**, corredor real y activo (cash pickup 2.900+
  ubicaciones vía varios bancos/partners, banco).
- **Ria → Bosnia: CONFIRMADO**, corredor real (cash pickup 100+ ubicaciones,
  banco; detalle de partners más limitado que BG/RS).
- **MoneyGram → Bulgaria: NO confirmado por fuente primaria directa** — bloqueo
  anti-bot persistente en las 4 URLs probadas. Evidencia indirecta fuerte
  (sitio localizado indexado, agentes reales en ciudades búlgaras, artículos de
  ayuda específicos) pero sin lectura de contenido primario. **Recomendado
  cerrar con navegador real (Chrome tool) en vez de WebFetch/WebSearch antes de
  cargar cualquier precio de este corredor.**

Además, el cross-check pendiente sobre **WorldRemit ausente de Europa del
Este** (la investigación había marcado esto como "verificar si contradice algo
ya cargado") se resolvió por SQL directo: `fx_rates` tiene **cero filas** de
WorldRemit hacia cualquier país de Europa del Este. No había conflicto — el
hallazgo negativo queda confirmado y cerrado, no se necesita corrección.

Detalle completo en `docs/data-sources/2026-08-25c-auditoria-cobertura-otras-regiones-fase1.md`
(sección 3, actualizada) y en el proyecto de Claude,
`claude/reverificacion-europa-del-este-ria-moneygram-2026-08-25.md`.

---

## 4. Qué quedó cargado en `fx_rates` — resumen acumulado de toda la ronda "otras regiones"

- **Tanda 1** (batch1, ya en sesión previa): 17 corredores.
- **Tanda 2** (batch2): 15 corredores — WU (FR→CI, FR→BJ, IT→EC, IT→PE),
  MoneyGram (DE→PL), Remitly (US→NG, CA→NG, CA→GH), Ria (ES→PH, IT→PH),
  Paysend (US→PH, US→IN, GB→IN, GB→PK), Xoom (US→PH).
- **Tanda 3** (batch3_nicho): 5 corredores — TapTap Send (GB→PK, GB→PH),
  Sendwave (CA→IN, FR→IN), NALA (GB→GH).
- **Tanda 4** (reverify_sin_confirmar): 0 corredores nuevos, 2 correcciones —
  Ria GB→PH (fee corregido de promo a regular) y Xoom CA→PH (confirmado
  regular, sin cambio de valor).
- **Tanda 5** (batch5_nicho2): 8 corredores — LemFi (GB→PK sin_confirmar,
  GB→PH), Sendwave (GB→IN), NALA (GB→IN, GB→PK, GB→PH), TapTap Send (FR→SN,
  GB→UG).
- **Este handoff:** 1 corredor — Ria GB→MX (gap de auditoría de documentación).

**Total: 46 corredores nuevos + 2 correcciones**, todos con fuente primaria
citada, fecha de acceso, y distinción explícita promo-vs-regular documentada
en el `data_source` de cada fila.

**Fase 1 (solo cobertura, sin pricing) completada para 3 regiones nuevas**
— Sudeste Asiático, Medio Oriente/Golfo, Europa del Este — con **cero
corredores de precio cargados todavía**: toda esa investigación identificó
qué corredores existen, no cuánto cuestan. Ver sección 5.

---

## 5. Pendientes — lista completa, priorizada

### 5.1 Prioridad alta (impacto directo en precisión del comparador)

1. **Confirmar visualmente que el check "Supabase Preview" de GitHub Actions
   pasa** en el próximo run (ver sección 1 — no se pudo verificar desde este
   entorno).
2. **Fase 2 (cotización en vivo con navegador) para las 3 regiones nuevas**
   — Sudeste Asiático, Medio Oriente/Golfo, Europa del Este — no tiene ningún
   precio cargado todavía, solo cobertura confirmada. Prioridad sugerida por
   volumen real:
   - Golfo→Sur de Asia/Filipinas (el corredor de remesas de mayor volumen del
     mundo): EAU→Pakistán/Filipinas/Bangladesh, Arabia Saudita→Filipinas.
   - Ucrania/Moldavia (volumen humanitario alto desde 2022): Western Union,
     Remitly, MoneyGram, Xoom, Paysend hacia UA/MD.
   - Sudeste Asiático: Arabia Saudita→Indonesia (WU), Tailandia→Myanmar (WU).
3. **MoneyGram→Bulgaria**: cerrar con navegador real (Chrome tool) antes de
   intentar cargar un precio — WebFetch/WebSearch quedaron bloqueados por
   anti-bot (sección 3).
4. **Corredores España→Argentina para Remitly y MoneyGram** (`ES->AR`) —
   detectados como huecos probables en la auditoría de Argentina de esta
   sesión (alta demanda esperable por la diáspora argentina en España), no
   confirmados todavía.

### 5.2 Prioridad media

5. **Global66** (`active=false`): corredor EUR→ARS confirmado como real pero
   sin cifra de fee/spread — falta cotizar en vivo sin contención de navegador.
6. **Belo**: producto real de remesa P2P desde Argentina a ~50 países, pero sin
   fee/spread publicado — necesita cotización logueada o contacto directo con
   el proveedor antes de decidir si se carga.
7. **4 corredores que siguen `sin_confirmar` tras dos rondas de
   re-verificación**, cada uno con motivo estructural documentado (no es
   pereza de investigación, es limitación real del sitio del proveedor):
   - Western Union KW→IN — error técnico reproducible en el cotizador.
   - WorldRemit GB→PK — no existe una etiqueta positiva de "precio regular"
     para distinguirlo de posible promo.
   - NALA GB→NG — el proveedor nunca desglosa el fee por diseño (todo vía spread).
   - LemFi GB→PK — tramo de fee ambiguo (0.99→0.00 GBP) sin etiqueta que
     aclare si es escalón estándar o promo "envía más, paga menos".
8. **MoneyGram GB→GH y Paysend ES→MX**: bloqueados por promos que exigen login
   para ver el precio regular.
9. **WorldRemit AU→IN y AU→PK**: bloqueados por banners promocionales
   persistentes que no se pudieron descartar con certeza.
10. **Expandir las matrices de TapTap Send/Sendwave/LemFi/NALA** — se cargó
    solo un puñado de pares prioritarios por corredor de nicho; las matrices
    completas documentadas en `2026-08-25b-auditoria-cobertura-otras-regiones.md`
    son mucho más grandes.

### 5.3 Prioridad baja / arquitectural (explícitamente diferido por el usuario)

11. **Decisión de arquitectura sobre exclusión proveedor-por-corredor**
    (activar `ENABLE_CORRIDOR_FILTERING` o un mecanismo equivalente) — el
    usuario pidió explícitamente dejar esto para la fase de "diseño +
    arquitectura" del roadmap, no tocarlo ahora. Ver
    `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`
    y `docs/handoff/arquitectura-corredor-proveedores.md` para el diagnóstico
    y runbook ya escritos.
12. **Auditoría de cobertura del mismo nivel de detalle que Argentina** para
    regiones aún no tocadas más allá de las 3 nuevas de esta sesión (p. ej.
    África más allá de los corredores ya cargados, resto de Latinoamérica).
13. Pendientes de afiliados y redes sociales — sin cambios, ver
    `docs/handoff/briefing-traspaso.md` secciones 5 y 6 (siguen vigentes tal cual).

---

## 6. Notas operativas para la próxima sesión

- **Nunca fabricar el timestamp de un archivo de migración espejado.** Siempre
  llamar `mcp__Supabase__list_migrations` después de `apply_migration` y usar
  la `version` real que devuelve como nombre de archivo. Este fue el origen
  exacto del incidente de la sección 1.
- **Un solo agente con herramientas de Chrome a la vez** — el navegador
  compartido tiene un bug de contaminación cruzada de pestañas confirmado
  reproduciblemente (ver `claude/investigacion-tarifas-ria-xoom-2026-08-24.md`,
  sección de limitación metodológica). Agentes de solo investigación
  (WebSearch/WebFetch, sin Chrome) sí pueden correr en paralelo sin problema.
- **No existe herramienta `delete_file` en el servidor MCP de GitHub conectado**
  — para "borrar" contenido de un archivo, sobreescribirlo con
  `create_or_update_file` (tombstone/comentario), nunca dejarlo con SQL real
  si ya no debe ejecutarse.
- El contenedor cloud no tiene `gh` CLI ni credenciales de push directas — todo
  el trabajo de GitHub pasa por `mcp__remote-devices__github__*` (device
  bridge). Si ese bridge no está disponible en una sesión futura, no hay forma
  de escribir a GitHub desde ahí.
- Regla de carga (repetida porque es la más importante): **nunca cargar precio
  promocional o de primera transferencia** — solo el que paga un usuario
  recurrente. Cuando un proveedor no distingue claramente promo vs. regular,
  cargar como `sin_confirmar` en vez de adivinar.
