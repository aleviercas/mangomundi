# mangomundi — Handoff 27-ago-2026 (sesión Cowork, fase 2): fix de corredores + fintechs argentinas + arquitectura definitiva

> Continúa la fase 1 de esta misma sesión
> (`docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md`), a pedido de
> Alejandro: arreglar que Money2India apareciera en corredores de Argentina,
> hacer que las fintechs argentinas aparezcan donde corresponde, y cerrar
> con un documento definitivo de arquitectura antes de pasar a la etapa de
> diseño/arquitectura general del proyecto.

**Repo:** `aleviercas/mangomundi` (main). **Supabase project_id:** `ttqalbexpquzobrdyvgx`.
**Commits de esta fase:** `3b99216` (fix del código), `7ca3bef` (doc de
arquitectura — el primer intento, commit `30ca0b9`, pusheó por error un
placeholder de shell en vez del contenido real; corregido en el siguiente
commit sin que quedara nada roto en `main` por más de un minuto).

---

## 1. El bug de Money2India — causa raíz y fix

`providers.supported_corridors` existía en la tabla (poblado para
`money2india`, `bdo-remit`, `ubl-tezraftaar`, `prex`) pero `compareProviders`
(`src/lib/fx.functions.ts`) nunca lo consultaba. Cualquier proveedor
`is_corridor_specific` sin fila exacta en `fx_rates` para el corredor pedido
caía en la rama "hueco indocumentado → mostrar igual con estimación" —
pensada para MTOs de cobertura amplia (WorldRemit, Remitly, etc.) que
plausiblemente operan rutas para las que todavía no cargamos dato, pero
aplicada por error también a proveedores que **estructuralmente no pueden**
operar fuera de su lista corta (Money2India solo existe para US→IN).

**Fix:** nueva capa de elegibilidad, incondicional (corre antes y fuera del
flag `ENABLE_CORRIDOR_FILTERING`): si un proveedor tiene
`is_corridor_specific=true` y `supported_corridors` no vacío, se restringe
exactamente a esos corredores, siempre. El resto de los ~43 proveedores Tipo
A (`supported_corridors` null) no se tocan — siguen con el comportamiento
exacto de antes.

Verificación antes de pushear (evitando repetir el incidente de truncamiento
de `PROJECT-STATE.md` de la fase 1): reconstrucción completa del archivo en
un temporal local, chequeo de balance de llaves, `tsc --noEmit` (solo errores
esperados de imports fuera de contexto del proyecto), grep del bloque nuevo,
lectura completa de las 936 líneas antes de pushear. Sha de origen confirmado
igual al fetch original justo antes de pushear (nadie más había tocado el
archivo en paralelo).

## 2. Fintechs argentinas — investigación completa (nada inventado)

Alejandro pidió específicamente esto. Resultado, contra los 4 filtros de
inclusión del proyecto:

| Fintech | Calificó | Por qué |
|---|---|---|
| **Prex** | **Sí — ya estaba cargada** | Remesa P2P real AR→15 países, fee USD 2.99 fijo (gratis en ARS), fuente prexcard.com.ar verificada 25-ago. Único dato flojo: spread 1.0% es estimación provisoria (Prex no publica margen). |
| Ualá | No | No acepta transferencias internacionales directas — sin código SWIFT (fuente: wise.com/ar, confirmado explícito). |
| Lemon Cash | No | Solo permite fondear la cuenta propia del usuario (no recibir de un tercero) — no es remesa P2P. Menciona spread pero no publica el número. |
| AstroPay | No | Lenguaje de marketing genérico ("tipo de cambio competitivo") en las 3 páginas oficiales revisadas — sin fee ni spread concreto en ninguna. |
| Global66 / Belo | No (sin cambios vs. fase 1) | Billeteras multi-moneda, conversión a ARS opcional sin fee+spread publicado. |

Detalle completo con links de fuente en `docs/architecture-motor-comparador.md`
sección 5.

**Conclusión para Alejandro:** no había (solo) un bug ocultando fintechs —
de las 5 relevantes, solo Prex tiene un producto de remesas real con datos
citables, y ya estaba cargada antes de esta sesión. Si aparece con el fix de
corredores en el sitio en vivo es la siguiente cosa a verificar (pendiente,
sección 4).

## 3. Documento de arquitectura definitivo

`docs/architecture-motor-comparador.md` — nuevo, reemplaza la necesidad de
releer el diagnóstico histórico para entender cómo funciona hoy el motor.
Cubre: las dos capas de elegibilidad (whitelist estructural + flag staged
rollout), precedencia de resolución de fee/spread, reglas de integridad de
datos, resultado de la investigación de fintechs, y una lista priorizada de
lo que queda abierto. Es la respuesta directa al pedido de Alejandro de
"terminar de definir el funcionamiento de este motor de búsqueda... así
luego podemos pasar a diseño y arquitectura".

## 4. Qué queda pendiente para la próxima sesión (en orden de impacto)

1. **Confirmar `ENABLE_CORRIDOR_FILTERING` en Vercel** — Alejandro, no hay
   tool disponible en Claude Code para leer env vars (se revisaron todas las
   del MCP de Vercel).
2. **Verificar en vivo con browser real** que Prex aparece correctamente en
   AR→exterior y que Money2India ya no aparece en corredores de Argentina —
   esta sesión no tuvo Chrome tool conectado.
3. **Confirmar el spread real de Prex** (hoy 1.0% es estimación provisoria)
   — necesita cotizar en la app real.
4. **Re-verificar con browser real** las 16 filas de LemFi/Remitly bajadas a
   `sin_confirmar` en la fase 1 + el duplicado de LemFi GB-NG.
5. **MoneyGram ES→AR y Remitly ES→AR (spread)** — siguen bloqueados,
   necesitan browser real (anti-bot / calculadora dinámica).
6. **Barrido de las ~267 filas `fee<1` sourced de World Bank RPW** — no
   revisado en ninguna sesión todavía. Demasiado grande para completar sin
   browser en una sola sesión; empezar con una muestra estratificada.
7. **Global66:** reactivar solo si aparece una fuente citable de fee+spread.
8. **Triage de los ~27 proveedores Tipo A inactivos restantes** — no tocado.

## 5. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Arquitectura definitiva del motor (elegibilidad + fee resolution) | `docs/architecture-motor-comparador.md` |
| Índice general del proyecto | `docs/PROJECT-STATE.md` |
| Handoff fase 1 de esta sesión (auditoría de tarifas) | `docs/handoff/handoff-2026-08-27-audit-tarifas-cowork.md` |
| Fix del bug de Money2India | `src/lib/fx.functions.ts` (commit `3b99216`) |
