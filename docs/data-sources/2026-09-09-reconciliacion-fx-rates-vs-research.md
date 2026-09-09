# Reconciliación `fx_rates` vs. research (v16-v25) — 2026-09-09

> **Contexto:** sesión de chat (sin acceso a GitHub/repo) que audita si los 10+ corredores
> corregidos en `research-findings-*-v16` a `*-v25-addendum.md` y consolidados en
> `CONCLUSIONES-moneda-volatil-margen-v16-v25.md` / `INSTRUCTIVO-carga-v16-a-v24.md`
> ya están reflejados correctamente en Supabase (`ttqalbexpquzobrdyvgx`, tabla `fx_rates`).
>
> **Conclusión: no hace falta ninguna corrección.** Los datos ya cargados son correctos.
> Este documento existe para dejar constancia de *por qué* parecía haber un problema y
> por qué no lo hay, así ninguna sesión futura repite la misma alarma falsa.

---

## 1. La alarma falsa que casi generó un UPDATE incorrecto

Primera pasada de esta sesión: comparar `fx_rates.public_spread_percent` directamente
contra el "costo real corregido" de la Sección 2 del instructivo (ej. WU Argentina→EEUU:
DB muestra 5.35%, el research dice costo real 10.10% — casi el doble). Con esa lectura,
se armó una lista de "10 correcciones urgentes" para aplicar via `apply_migration`.

**Esa lectura era incorrecta.** `public_spread_percent` no está pensado para contener el
costo real total — contiene *solo* el componente de spread cambiario. `fee` vive en su
propia columna, y `src/lib/fx.functions.ts` (no auditado directamente en esta sesión por
falta de acceso a GitHub, pero confirmado indirectamente por los propios `data_source` de
varias filas) los combina en tiempo de cálculo. Cargar el costo real completo en
`public_spread_percent` habría hecho que la app sumara el costo del fee dos veces.

## 2. La fórmula real de carga (reconstruida desde la nota de Botsuana)

El `INSTRUCTIVO-carga-v16-a-v24.md` (Sección 2) instruye textualmente "cargar el valor de
costo real corregido" — una instrucción escrita sin ver el schema de `fx_rates`. La sesión
de Code que hizo la carga real fue más cuidadosa: en vez de volcar el costo real, despejó
qué spread, combinado multiplicativamente con el fee de esa fila, reproduce el costo real
documentado:

```
spread_a_cargar = 1 − (1 − costo_real) / (1 − fee / monto_enviado_de_referencia)
```

Esto queda explícito en el `data_source` de las 3 filas de Mukuru Botsuana (única
justificación completa dejada por escrito): *"public_spread_percent (0,60%) DERIVADO
algebraicamente de fee+costo_real... porque el 0,37% original no reproduce el 9,64%
recalculado"*.

## 3. Auditoría corredor por corredor (24 filas verificadas)

Usando el monto de referencia y el fee que cada fila documenta en su propio
`data_source`, se recalculó `spread_a_cargar` con la fórmula de la Sección 2 y se comparó
contra el valor real almacenado en `public_spread_percent`:

| Proveedor | Corredor | Spread objetivo | Spread en DB | Diferencia |
|---|---|---|---|---|
| western-union | CL→ES | 1.17% | 1.09% | 0.08pp |
| western-union | AR→US | 5.37% | 5.35% | 0.02pp |
| western-union | AR→BO | 4.38% | 4.38% | exacto |
| western-union | BR→BO | 2.15% | 2.16% | 0.01pp |
| western-union | IT→BO | 5.40% | 5.41% | 0.01pp |
| western-union | ES→BO | 1.50% | 1.50% | exacto |
| western-union | US→BO (tramo 1, 1.000 USD) | -0.77% | -0.76% | 0.01pp |
| western-union | US→BO (tramo 2, 5.000 USD) | -0.71% | -0.69% | 0.02pp |
| skrill | KE→GB | 5.88% | 5.99% | 0.11pp |
| skrill | KE→US | 7.36% | 7.37% | 0.01pp |
| mukuru | BW→GB | 0.59% | 0.60% | 0.01pp |
| mukuru | BW→US | 6.06% | 6.06% | exacto |
| mukuru | BW→ZA | 5.10% | 5.10% | exacto |
| mukuru | KE→GB | 6.81% | 6.84% | 0.03pp |
| mukuru | KE→US | 7.52% | 7.49% | 0.03pp |
| mukuru | KE→DE | 5.34% | 5.38% | 0.04pp |
| mukuru | ZA→DE | 1.44% | 1.44% | exacto |
| mukuru | ZA→GB | 2.04% | 2.06% | 0.02pp |
| mukuru | ZM→DE | 4.37% | 4.37% | exacto |
| mukuru | ZM→GB | 4.29% | 4.25% | 0.04pp |
| mukuru | ZM→US | 3.08% | 3.09% | 0.01pp |
| mukuru | LS→GB (tramo 1) | 0.90% | 0.90% | exacto |
| mukuru | LS→GB (tramo 2) | 0.98% | 0.98% | exacto |
| mukuru | LS→US | 1.24% | 1.24% | exacto |
| mukuru | LS→ZA | 0% | 0% | exacto |
| mukuru | RW→GB | 4.98% | 5.05% | 0.07pp |
| mukuru | UG→GB | ~0% | 0.01% | ~0.01pp |

**Todas las diferencias están entre 0 y 0.11 puntos porcentuales** — consistentes con
redondeo de valores intermedios documentados a pocos decimales (el "tipo de cambio medio"
citado a 6 decimales en varias notas), no con un error de carga. Ninguna mueve un badge
que se muestra redondeado a 1-2 decimales.

## 4. Otros dos ítems verificados

- **Error de identidad de proveedor (instructivo Sección 4):** la cifra "Kenia 4.01%"
  atribuida por error a Mukuru en v20-v22 (en realidad era de Skrill) **no está presente**
  en la fila actual de Mukuru KE→GB — tiene el valor correcto (6.84%). Ya corregido en
  algún momento anterior a esta sesión.
- **Sudáfrica→Reino Unido (Mukuru), auditoría pendiente ya marcada:** el propio
  `data_source` de esta fila deja constancia de que su costo_real de referencia (2.48%)
  viene de datos "heredados de v22", mientras que Sudáfrica→EEUU/Alemania del mismo
  cuadro son mediciones frescas de v23. Es una duda sobre la frescura del dato *fuente*,
  no del cálculo de `public_spread_percent` (que cierra correctamente contra el 2.48%
  documentado, diferencia de 0.02pp). **No se tocó** — queda como estaba, marcada por
  quien la cargó.

## 5. Recomendación para la próxima sesión con esta duda

Si en el futuro una sesión vuelve a comparar `public_spread_percent` contra "costo real"
esperando que sean el mismo número: **no lo son, por diseño**. Confirmar primero contra
`src/lib/fx.functions.ts` cómo se combinan `rate`, `fee` y `public_spread_percent` antes
de asumir que hay un error de carga.

## 6. Estado de esta sesión

Esta sesión de chat **no ejecutó ningún `execute_sql`/`apply_migration` de escritura** en
Supabase — todo lo de arriba es lectura y verificación. No tuvo acceso a GitHub/al repo en
ningún momento (sin conector disponible, sin red en `bash_tool`), así que tampoco escribió
nada en `kayakclone`. Este documento queda listo para commitear desde una sesión con
acceso al repo (Claude Code).
