# Plan de implementación — research "moneda volátil → margen de remesas"
### Consolidado 2026-09-09, listo para ejecutar cuando se confirme

## Nota de estado (agregada al cargar este documento al repo, 2026-09-09)

Este plan se ejecutó parcialmente por la sesión que subió estos 4 archivos al repo:

- **Sección 1, filas #1 y #2 (Tanzania→EEUU y Tanzania→Alemania, OFX, comisión $0):
  YA CARGADAS a `fx_rates`** (`ttqalbexpquzobrdyvgx`), migración
  `load_v26_tanzania_ofx_corridors`, 2026-09-09. `fx_rates` pasó de 920 a 922 filas —
  solo INSERT, no se tocó ninguna fila existente.
- **Sección 1, fila #3 (Venezuela/Remitly): NO cargada.** Sigue pendiente la decisión de
  producto que este mismo documento pide (¿spread negativo tal cual o "sin margen visible
  en este canal"?) — además hay un conflicto directo con la fila Remitly USD→VES ya
  cargada (World Bank RPW Q3 2025, spread 3%, `confirmado_activo`): cargar el número de
  v26 significaría reemplazar un valor confirmado por uno derivado y de signo opuesto, no
  sumar una fila nueva. Necesita confirmación explícita de Alejandro antes de tocarse.
- **Sección 2 (Asia Central/Cáucaso): sin cambios**, tal como recomienda el propio
  documento — no hay fuente medible hoy.
- El resto de este documento queda igual, como registro de lo que se decidió y por qué.

---


> Este documento junta tres piezas producidas en esta ronda de research y define,
> corredor por corredor, **qué cargar a Supabase, qué no cargar todavía, y qué documentar
> en el repo** — sin ejecutar nada. Es el punto de partida para la sesión que finalmente
> tenga red habilitada hacia GitHub y confirme el scope de escritura del PAT.

**Piezas de esta ronda:**
1. `RECONCILIACION-fx-rates-vs-research-2026-09-09.md` — auditoría de las 24 filas ya
   cargadas de research anterior (v16-v25). **Conclusión: ninguna necesita corrección.**
2. `research-findings-2026-09-09-v26.md` — research nuevo (Tanzania, Asia Central/Cáucaso,
   Venezuela, corrección metodológica ARS/VES vía dolarapi.com).
3. Este documento — el plan de acción.

---

## 1. Qué SÍ está listo para cargar a Supabase

| # | Corredor | Proveedor | Fee | Spread a cargar | Costo real | Fuente |
|---|---|---|---|---|---|---|
| 1 | Tanzania→EEUU | OFX | $0 | 8.07% | 8.07% (comisión $0) | Monito, 2026-09-09, esta ronda |
| 2 | Tanzania→Alemania | OFX | $0 | 8.14% | 8.14% (comisión $0) | Monito, 2026-09-09, esta ronda |
| 3 | Estados Unidos→Venezuela | Remitly | $0 (débito) | **recalcular contra dólar paralelo, no el "tipo medio" de Monito** — ver Sección 3 del research v26 (da ≈ -0.45%, no el -14% que muestra Monito) | ≈ -0.45% (con nota metodológica de qué tasa se usó) | Monito + `ve.dolarapi.com`, 2026-09-09 |

**Antes de cargar el #3:** confirmar con un segundo momento de medición (Monito puede
actualizar sus datos) y decidir si el spread negativo se carga tal cual o se trata como
"proveedor sin margen visible en este canal" — es una decisión de producto, no solo de
datos, porque un spread negativo puede verse raro en la UI aunque sea matemáticamente
correcto.

## 2. Qué NO está listo — necesita otra ronda antes de tocar Supabase

| Corredor / línea | Por qué no está listo | Próximo paso |
|---|---|---|
| Asia Central/Cáucaso (Armenia, Georgia, Kazajistán, Uzbekistán → Rusia/Turquía) | Los datos ya cargados son placeholders genéricos (2%/2.5% parejo) sin medición viva. Al intentar verificar en vivo: Rusia como destino y Georgia→Turquía **no tienen ningún proveedor en Monito hoy**; Kazajistán como origen da error. | Buscar comparador alternativo a Monito, o contactar proveedores directo. No recomendable seguir insistiendo con Monito para esta región. |
| Corredores ARS ya cargados (WU Chile→España, Argentina→EEUU, Bolivia×5) | Probablemente tienen el mismo sesgo metodológico que Venezuela (tipo medio anclado a oficial, no a blue) — pero la brecha oficial/blue de Argentina hoy es angosta (~2%), así que el efecto es menor y no urgente. | Recalcular cada uno contra `dolarapi.com` antes de la próxima auditoría grande — no es un error que haya que corregir ya, es una mejora de precisión pendiente. |
| Venezuela — segundo proveedor | Solo apareció Remitly en la comparación. La verificación cruzada que validó Argentina→EEUU (contra Global66) no se pudo replicar acá. | Repetir la búsqueda en otro momento/monto a ver si aparece un segundo proveedor. |

## 3. Lo que NO se toca (ya está bien, o está correctamente marcado como pendiente por otra sesión)

- **Las 24 filas auditadas en `RECONCILIACION-fx-rates-vs-research-2026-09-09.md`** — ya
  están bien cargadas, con la fórmula de combinación spread+fee correcta. No requieren
  ningún UPDATE.
- **Mukuru Sudáfrica→Reino Unido** — tiene su propia nota de "auditoría futura" por
  frescura del dato fuente (v22 vs v23), no por error de cálculo. Se deja como está.

## 4. Documentación pendiente para el repo (cuando haya acceso de escritura)

1. Subir los 5 archivos de research (`INSTRUCTIVO-carga-v16-a-v24.md`,
   `CONCLUSIONES-moneda-volatil-margen-v16-v25.md`,
   `research-findings-2026-09-03-v25-addendum.md`,
   `research-findings-2026-09-09-v26.md`,
   `RECONCILIACION-fx-rates-vs-research-2026-09-09.md`) a `docs/data-sources/` — ninguno
   está en el repo hoy, todo vivió como archivos sueltos en esta conversación.
2. **Cruzar referencias con `docs/data-sources/2026-08-diagnostico-arquitectura-proveedores-corredores.md`**
   (ya en el repo) — comparte la misma tabla `fx_rates` y el mismo problema de fondo (fuentes
   de tipo de cambio confiables). Ese doc ya propone `dolarapi.com`/`esjs-dolar-api` como
   solución (Sección 4.2) — esta ronda de research es la primera vez que se usa y valida esa
   fuente en la práctica (Sección 5 de `research-findings-2026-09-09-v26.md`). Agregar un
   link en ambos documentos hacia el otro.
3. Actualizar `docs/README.md` (índice) para que estos archivos nuevos aparezcan listados —
   es la causa raíz de por qué este research quedó invisible para otras sesiones hasta hoy.

## 5. Orden de ejecución sugerido cuando haya acceso de escritura

1. `git fetch origin kayakclone` — chequear que nadie tocó `docs/` mientras tanto.
2. `git diff HEAD origin/kayakclone --stat` — si hay cambios en archivos que vamos a tocar,
   parar y avisar.
3. Commitear los 5 archivos de documentación (Sección 4) — esto no toca código ni Supabase,
   es el cambio de menor riesgo, conviene hacerlo primero y por separado.
4. Recién después, con confirmación explícita, aplicar el UPDATE de los 3 corredores listos
   (Sección 1) en Supabase vía `apply_migration` — usando el timestamp real que devuelve
   `list_migrations`, no uno fabricado (por el incidente de CI del 25/08 que ya está
   documentado en la memoria del proyecto).
5. Verificación posterior: releer las filas actualizadas y confirmar que el diff es
   exactamente lo esperado, ni más ni menos.

---

**Estado de esta sesión:** no se ejecutó ningún `execute_sql`/`apply_migration` de
escritura en Supabase, y no se pudo pushear nada al repo (red hacia GitHub sigue bloqueada
en esta conversación pese al cambio de configuración — puede necesitar una sesión nueva
para tomar efecto). Los 3 archivos de esta ronda quedan en `/mnt/user-data/outputs/` listos
para que la sesión con acceso de escritura los suba y, con tu confirmación explícita,
ejecute el plan de la Sección 5.
