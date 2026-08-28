# mangomundi — Handoff 27-ago-2026 (sesión Cowork): auditoría de tarifas

> Ejecuta el brief `docs/handoff/brief-cowork-2026-08-27-audit-tarifas.md`. Continúa
> el patrón detectado con Western Union GB→AR (migración `20260827150835`, sigue
> vigente `docs/handoff/handoff-2026-08-27-precision-corredores-badges.md`).

**Repo:** `aleviercas/mangomundi` (main). **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Migración aplicada y mirroreada:** `20260827193538_downgrade_lemfi_remitly_suspect_promo_fees.sql`.

---

## 1. Resultado del barrido de fees sospechosos (sección 5.1 del brief)

Se revisaron las 111 filas con `fee = 0` (o `< 1`) cuya fuente **no** es World Bank
RPW (las de World Bank se consideran de menor riesgo — es una encuesta
independiente a proveedores, no la calculadora propia del proveedor). De esas 111,
la gran mayoría ya tenían nota explícita de exclusión de promo/welcome rate de
sesiones anteriores (ej. Remitly CA-NG/CA-GH, Western Union QA-IN, TapTap Send
FR-SN, Xoom varios corredores) — no se tocaron.

**Bajadas a `sin_confirmar` esta sesión (16 filas):**

- **LemFi (6 filas):** CA-NG, GB-GH, GB-KE, GB-NG (dos filas — ver duplicado abajo),
  US-NG. Todas cargadas con fee=0 y fuente genérica "Direct research Aug 2026
  (lemfi.com, aggregator reviews)" sin nota de verificación de promo. Evidencia
  encontrada: `support.lemfi.com/hc/en-us/articles/45776845553809` ("What fees
  will I pay?") dice textualmente *"the first transfer to a new country is
  typically free, subsequent transfers may attract fees"* — mismo patrón que WU
  GB-AR.
  - **Duplicado sin resolver:** hay DOS filas para LemFi GB-NG (una con spread 1.0
    fuente genérica, otra con spread -3.17 medida en calculadora real a 500 GBP) —
    ambas bajadas a `sin_confirmar` por prudencia, ninguna se borró. Próxima sesión:
    re-verificar con navegador real y quedarse con una sola fila.
- **Remitly (10 filas):** AU-ID, CA-HT, HK-ID, IT-BD, IT-PH, JP-BR, KR-TH, MY-BD,
  QA-NP, US-ET. Mismo patrón — fuente genérica "aggregator reviews" o "Direct
  research Aug 2025 (remitly.com)" sin verificación directa de la calculadora por
  corredor. Remitly SÍ distingue "everyday rate" de "welcome rate" en su sitio
  (confirmado en otras filas ya cargadas de esta misma tabla, ej. CA-NG/CA-GH/
  US-NG, que sí tienen la nota de exclusión) — pero estas 10 no fueron verificadas
  con esa metodología.

**Revisadas y confirmadas SIN cambios (fee=0 es precio regular, no promo):**

- **TapTap Send** (GB-GH, GB-KE, GB-NG, US-GH, US-KE, US-NG): confirmado vía
  `taptapsend.com/en/send-money-to/ghana` — "no fee" es política permanente
  explícita ("we have no plans to introduce transfer fees"), sin lenguaje de
  promo/bienvenida.
- **WorldRemit GB-IN**: confirmado que el £0 en depósito bancario es la tarifa
  regular (con markup de tipo de cambio ~1%, no oculto), la promo de bienvenida
  (código `3FREE`) es un beneficio adicional separado, no la tarifa base mostrada.
- **Sendwave** (GB-GH, US-GH, US-KE): el fee=0/bajo bajo cierto monto es un rasgo
  estructural de su modelo de negocio ("small-send specialist"), no encontrado
  ningún indicio de que el default mostrado sea una tasa de bienvenida — a
  diferencia de LemFi/Remitly, sus promos son códigos de crédito adicionales
  ($10-30), no una tasa base inflada.

**Cambio de estado global:** `confirmado_activo` 765→749, `sin_confirmar` 56→72
(total `fx_rates` sin cambios, 821 filas — no se agregaron ni borraron filas).

---

## 2. Sección 5.2 — Argentina: resultado negativo, documentado (nada inventado)

- **MoneyGram ES→AR:** no se pudo confirmar. La calculadora en vivo de
  moneygram.com devuelve 403 (bloqueo anti-bot, mismo patrón ya documentado para
  MoneyGram→Bulgaria). Ningún blog independiente (wise.com, remesas.com) cubre
  esta ruta con cifras concretas. **Sigue sin cargar** — no se inventó ningún
  número.
- **Remitly ES→AR — spread:** sigue sin poder completarse. La página
  `remitly.com/es/es/currency-converter/eur-to-ars-rate` solo muestra la tasa de
  **bienvenida** (1.814,90 ARS/EUR, primeros €1.000, comisión 0€) — confirma que
  el fee regular de 2,49€ ya cargado es correcto (la propia página lo dice: "la
  comisión para todas las transferencias es 2,49€"), pero no expone la tasa
  regular/spread para transferencias posteriores sin sesión de usuario real.
  **Necesita navegador real** (Chrome tool, no disponible en esta sesión) —
  bloqueado, igual que estaba.
- **Global66 / Belo:** investigados desde cero. Ambos son **billeteras
  multi-moneda**, no productos de remesa clásicos: el dinero llega en USD/EUR
  (Global66: cuenta IBAN/US) o USDC (Belo), y la conversión a ARS es **opcional y
  a iniciativa del usuario**, no automática. Ninguno de los dos publica un
  fee+spread concreto para esa conversión opcional — Global66 solo confirma "ACH
  gratis, wire $10" para la recepción (no la conversión a ARS), Belo dice "bajas
  comisiones según método" sin cifra. **No calificarían como fila de `fx_rates`
  tal como está modelada la tabla** (from_currency→ARS con fee+spread fijo) sin
  inventar un número — quedan sin cargar. Si Alejandro quiere insistir, la vía
  que funcionó antes es delegar a Claude in Chrome desde su máquina para probar
  la conversión real dentro de la app.

---

## 3. Coordinación (sección 3 del brief)

Confirmado con Alejandro antes de escribir: ninguna otra sesión estaba tocando
`fx_rates`/`providers` en paralelo. Vía libre, sin incidentes de coordinación.

---

## 4. Notas operativas — sin incidentes

Migración aplicada con `apply_migration`, después `list_migrations` para el
timestamp real (`20260827193538`) y mirroreada a
`supabase/migrations/20260827193538_downgrade_lemfi_remitly_suspect_promo_fees.sql`
en GitHub — sin fabricar el nombre, siguiendo la regla de la sección 3 del brief.

---

## 5. Qué queda pendiente para la próxima sesión

1. **Resolver el duplicado LemFi GB-NG** (dos filas, ver sección 1) con navegador
   real.
2. **Re-verificar con navegador real** las 16 filas bajadas a `sin_confirmar` hoy
   (LemFi ×6, Remitly ×10) — esta sesión no tuvo Chrome/browser tool disponible
   (`Browser extension is not connected`), todo el research fue vía WebSearch/
   WebFetch, que no puede ejecutar las calculadoras dinámicas de LemFi/Remitly
   con sesión de "usuario no nuevo".
3. **MoneyGram ES→AR y Remitly ES→AR (spread)** siguen bloqueados — necesitan
   navegador real (mismo patrón que MoneyGram→Bulgaria).
4. **Fase 2 heredada (sección 6 del brief) — sin cambios, sigue 100% vigente:**
   Golfo→Sur de Asia/Filipinas, Ucrania/Moldavia, Sudeste Asiático, las matrices
   de TapTap Send/Sendwave/LemFi/NALA, los 4 corredores `sin_confirmar`
   estructurales.
5. **Resto del barrido de sección 5.1:** las ~267 filas restantes con fee bajo/0
   sourced desde World Bank RPW no se revisaron esta sesión (se consideró menor
   riesgo por ser fuente independiente, no la calculadora propia del proveedor) —
   si aparece tiempo, vale la pena un muestreo aleatorio para confirmar que ese
   supuesto es correcto.

---

## 6. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Brief original de esta sesión | `docs/handoff/brief-cowork-2026-08-27-audit-tarifas.md` |
| Índice general del proyecto | `docs/PROJECT-STATE.md` |
| Handoff anterior (precisión de corredores + badges) | `docs/handoff/handoff-2026-08-27-precision-corredores-badges.md` |
| Migración de esta sesión | `supabase/migrations/20260827193538_downgrade_lemfi_remitly_suspect_promo_fees.sql` |
