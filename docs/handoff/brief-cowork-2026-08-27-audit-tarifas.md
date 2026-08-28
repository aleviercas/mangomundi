# mangomundi — Brief para Cowork: auditoría de tarifas + research Fase 2

> Contexto completo en `docs/PROJECT-STATE.md` (leer primero) y
> `docs/handoff/handoff-2026-08-27-precision-corredores-badges.md`. Este brief es
> solo la porción de trabajo que le toca a esta sesión: **investigar y cargar
> tarifas reales, sin contaminación promocional, para todos los corredores
> posibles.**

**Repo:** `aleviercas/mangomundi` (main). **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Necesitás:** conector de Supabase + conector de GitHub + browser real (muchas
tarifas son calculadoras dinámicas que no se ven con fetch estático).

---

## 1. La tarea, en una frase

Recorrer `fx_rates` y sumar corredores nuevos, verificando que ningún fee/spread
cargado sea en realidad una promoción temporal ("primera transferencia gratis",
"tipo de cambio de bienvenida", etc.) disfrazada de precio regular.

## 2. Por qué esto importa — el patrón que ya encontramos

El 27-ago se detectó que Western Union GB→AR tenía cargado un fee de **0.00 GBP**
como precio regular confirmado. Investigando con una fuente independiente
(wise.com/ar/blog/western-union-comision-argentina, dato de la calculadora
oficial de WU) se confirmó que el fee real para esa combinación (billetera Pago
Fácil) es **3.99 EUR**, no cero. El patrón: **casi todos los proveedores en ese
mismo corredor** (MoneyGram, Remitly, Ria) tuvieron que excluir explícitamente
una promo de "primera transferencia" con fee 0 al investigar el 25-ago — Western
Union tiene el mismo tipo de promo publicada en su sitio ("$0 de tarifa en tu
primer envío"). Se bajó a `sin_confirmar` (migración `20260827150835`), no se
inventó un número de reemplazo.

**Esto probablemente no es un caso aislado.** Cualquier fee que quedó en 0.00 o
en un número sospechosamente redondo/bajo merece el mismo tratamiento: buscar
una fuente independiente (blogs de Wise sobre comisiones de cada proveedor son
buena fuente cruzada, hay uno por proveedor+país) y confirmar si es precio
regular o promo mal capturada.

## 3. Regla de carga — no negociable, ya causó incidentes cuando no se siguió

- **Fee Y spread/margen de cambio, los dos, cada uno con fuente citable.** Nunca
  cargar solo uno.
- **Nunca precio promocional o "de bienvenida"/"primera transferencia" como
  precio regular.** Si el sitio del proveedor solo muestra el promocional
  claramente marcado como tal, buscar el regular en otra fuente o dejar
  `sin_confirmar` con nota explicando qué se encontró.
- Si no se puede confirmar con certeza: cargar como `verified_status =
  'sin_confirmar'`, nunca adivinar ni interpolar.
- Citar fuente real en `data_source` (URL + qué se vio + fecha) en cada fila.
- **Migraciones:** después de aplicar con `apply_migration`, llamar
  `list_migrations` y usar la versión real devuelta como nombre de archivo al
  mirrorear a `supabase/migrations/` en GitHub — nunca fabricar el timestamp.
  Esto causó un incidente de CI real el 25-ago, no es una formalidad.
- **Coordinación:** puede haber otra sesión (Code, u otra ventana de este chat)
  tocando la misma base en paralelo — no hay entorno de staging separado. Antes
  de una tanda grande de escritura, es buena idea confirmar con Alejandro que no
  hay otra sesión escribiendo sobre el mismo proveedor/corredor al mismo tiempo.

## 4. Estado actual — qué ya está hecho (no repetir)

- `supported_corridors` (lista blanca) ya cargado para las 4 marcas de un solo
  mercado: `money2india` (`US-IN`), `bdo-remit` (`US-PH`), `ubl-tezraftaar`
  (`AE-PK`), `prex` (15 corredores de salida desde AR). Migraciones
  `20260827144109` y su mirror en git ya están en `main`.
- GB→AR tiene 5 proveedores con dato real verificado (MoneyGram, Remitly, Ria,
  Western Union — este último ahora `sin_confirmar`, ver arriba —, Wise).
- Remitly ES→AR: fee regular confirmado en **2.49 EUR** (fuente:
  remitly.com/es/es/currency-converter/eur-to-ars-rate, texto estático no
  promocional, fetch 27-ago). **Falta el spread/margen** — el calculador
  dinámico no devuelve el número sin JS, necesita browser real. No cargar la
  fila hasta tener el spread también.

## 5. Qué falta — en orden sugerido de prioridad

### 5.1 Barrido de fees sospechosos (prioridad alta, empezar acá)
Revisar cada fila de `fx_rates` con fee = 0 o con un valor que se vea
inusualmente bajo comparado con otros proveedores del mismo corredor. Para cada
una: buscar una fuente independiente (blog de comisiones de Wise para ese
proveedor+país suele existir y es buena referencia cruzada), confirmar si es
precio regular o promo. Bajar a `sin_confirmar` con nota si hay duda razonable,
igual que se hizo con Western Union.

### 5.2 Completar Argentina (continuación directa de lo que se venía haciendo)
- MoneyGram ES→AR — no revisado todavía.
- Remitly ES→AR — falta el spread (ver sección 4).
- Global66/Belo — fee sin confirmar, pendiente de research desde cero.

### 5.3 Fase 2 heredada del 25-ago — sin cambios, sigue 100% vigente
- Golfo→Sur de Asia/Filipinas (el corredor de mayor volumen del mundo, más
  alto impacto de todo lo pendiente).
- Ucrania/Moldavia.
- Sudeste Asiático.
- MoneyGram→Bulgaria — necesita browser real, el sitio bloquea fetch estático
  (anti-bot).
- Los 4 corredores marcados `sin_confirmar` estructural (ver
  `docs/data-sources/` para el detalle exacto).
- Matrices incompletas de TapTap Send, Sendwave, LemFi, NALA.

## 6. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Índice general del proyecto | `docs/PROJECT-STATE.md` |
| Handoff de precisión de corredores (27-ago) | `docs/handoff/handoff-2026-08-27-precision-corredores-badges.md` |
| Handoff de CI + otras regiones (25-ago) | `docs/handoff/handoff-2026-08-25-fix-ci-y-otras-regiones.md` |
| Research crudo por región | `docs/data-sources/` |
| Criterios de inclusión / regla de carga completa | `docs/PROJECT-STATE.md` sección 5.3 |
