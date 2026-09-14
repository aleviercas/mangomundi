# ¿Para qué países mostrar la opción cripto? — priorización — 2026-09-13

> Responde: "¿y lo podríamos mostrar para qué países?". Cruza el índice de
> adopción de cripto de Chainalysis (el estándar de la industria para medir uso
> real, no especulación) contra la cobertura tradicional que ya tiene el
> proyecto, para priorizar dónde agregar la opción cripto suma más valor.

---

## 1. Metodología

Chainalysis mide adopción "grassroots" (uso real ponderado por poder adquisitivo,
no volumen absoluto en dólares) — es la métrica correcta para esto, porque prioriza
países donde cripto resuelve un problema real de remesas/inflación, no donde hay
más trading especulativo. Crucé el top del índice 2025 contra `receiving_country`
en `fx_rates` para ver dónde la cobertura tradicional ya es fuerte y dónde cripto
llenaría un vacío real.

## 2. Tier 1 — prioridad máxima (tesis central del proyecto + cobertura tradicional débil o nula)

| País | Adopción cripto | Cobertura tradicional hoy | Por qué prioridad 1 |
|---|---|---|---|
| **Venezuela** | Top 20 global (Chainalysis), **90% de remesas reales vía USDT** (Cavecom-e) | 1 fila (Remitly, ya corregida) | Ya confirmado con 3 fuentes independientes esta semana — es el caso más fuerte del proyecto |
| **Argentina** | Top 20 global, Brasil/Argentina/Venezuela mencionados explícitamente en el reporte 2026 | Ya activado (Global66, Prex) | Ya confirmado con datos reales (Belo, Lemon, Global66) |
| **Georgia** | **#1 mundial per cápita** (Chainalysis, ranking population-adjusted) | Solo 3 filas / 3 proveedores — muy delgado | Coincide exactamente con la región que ya habíamos marcado "no medible" por la exclusión de Rusia como origen (research del 10-sep) — cripto podría ser la única vía medible acá |
| **Moldavia** | **Top 3 mundial per cápita** | **CERO filas, CERO cobertura** — vacío total que ni siquiera había detectado en el barrido anterior | Mismo caso que Georgia — región bloqueada para proveedores tradicionales, pero con adopción cripto altísima |
| **Ucrania** | Top 3 mundial per cápita | 13 filas / 5 proveedores (cobertura moderada) | Ya cubierto razonablemente en fiat, pero la adopción per cápita sugiere que cripto podría ser más representativo de cómo la gente realmente manda plata hoy |

## 3. Tier 2 — candidato fuerte (alto volumen global, remesa-específico, moneda con historia de crisis)

| País | Adopción cripto | Cobertura tradicional | Nota |
|---|---|---|---|
| Nigeria | Top mundial en casi todos los rankings citados, uso explícitamente remesa/inflación | 36 filas / 14 proveedores (ya sólida) | Ya tiene el mecanismo de "control cambiario del banco central" documentado desde el research v16-v25 — encaja perfecto con la tesis |
| Pakistán | **#3 global** en el índice 2025, ~20M usuarios, cita textual: "workers sending money from abroad rely on USDT/USDC to bypass slow banking channels and high fees" | 36 filas / 14 proveedores | Descripción casi calcada de la tesis del proyecto |
| Filipinas | 22-23% de adopción, "largely driven by remittance activity" — gran población de trabajadores migrantes (OFW) | 76 filas / 16 proveedores (la más cubierta del proyecto) | Cobertura tradicional ya excelente — cripto sería un complemento, no llenaría un vacío |

## 4. Tier 3 — secundario (adopción alta pero menos remesa-específica, o ya bien cubierto)

- **Vietnam** (16 filas): adopción altísima (~21% población) pero más ligada a comercio/gaming que a remesas puras.
- **Brasil** (9 filas): volumen absoluto enorme (USD 318.800 millones, ~1/3 de toda la actividad cripto de LatAm) pero el real no tiene la misma historia de crisis que ARS/VES.
- **Turquía** (10 filas): 25,6% de adopción, lira con historia de inestabilidad — candidato razonable para una ronda futura.
- **Egipto / Kenia**: ya bien cubiertos tradicionalmente (13 y 23 filas), adopción cripto en crecimiento en África pero sin un dato tan contundente como Venezuela/Pakistán todavía.

## 5. Recomendación de orden de implementación

1. **Venezuela + Argentina primero** — ya tenemos datos reales medidos esta semana, es lo más rápido de poner en producción.
2. **Georgia + Moldavia** — vale la pena investigar en la próxima ronda específicamente *porque* la cobertura tradicional falla ahí (confirma o refuta si cripto resuelve el vacío que dejó la exclusión de Rusia como origen).
3. **Nigeria + Pakistán** — el research de rates en sí ya está bien cubierto en fiat; agregar cripto acá es sumar una opción más, no llenar un vacío urgente.
4. El resto (Tier 3) queda para cuando haya ancho de banda, no es urgente.

---

## 6. Estado de esta sesión

Solo investigación y priorización — no se cargó nada a Supabase. Moldavia queda
identificada como un vacío de cobertura genuino (ni siquiera tradicional) que no
había salido en el barrido de países del 11-sep — vale la pena una ronda de
research tradicional ahí también, más allá de cripto.
