# Verificación: ¿una tasa investigada en una moneda se reusa para otra? — 2026-09-17

> Responde una pregunta de arquitectura: si investigo un corredor en una moneda
> específica (ej. Alemania→Argentina en EUR), ¿el sistema la reutiliza/convierte
> si alguien quiere enviar otra moneda distinta? Verificado leyendo el código real
> y cruzando contra los 925 registros cargados — no una suposición.

---

## 1. Cómo funciona en el código (`fx.functions.ts`)

Cada fila de `fx_rates` está atada a un par de países (`sending_country`,
`receiving_country`), y el país determina una única moneda estándar
(`localCurrency()`, basado en el paquete ISO `country-to-currency` — un país, una
moneda, sin ambigüedad).

Cuando el usuario elige una moneda **distinta** a la moneda estándar de ese país
(`currencyOverridden = true`, línea ~712) pasan dos cosas, ambas conservadoras:

1. **La búsqueda de `fx_rates` para ese corredor se salta por completo** (línea
   736: `if (!currencyOverridden && ...)`) — el dato investigado NUNCA se
   reutiliza ni se reconvierte para la moneda distinta.
2. **Los proveedores de un solo mercado/moneda quedan excluidos directamente**
   (Sendwave, WorldRemit, MoneyGram, etc. — líneas 813/819) — no se los muestra
   con un número que no les corresponde.

Lo único que queda visible en ese caso son los proveedores de cobertura amplia
(Wise, brokers, bancos), y esos usan su tarifa genérica (`resolveTier`), **no** el
dato específico investigado.

**Conclusión: el sistema nunca reconvierte ni reutiliza mal una tasa investigada
en otra moneda — directamente deja de usarla.** Es un diseño conservador: prefiere
mostrar menos (o una estimación genérica) antes que mostrar un número
investigado para la moneda equivocada.

## 2. Verificado contra los datos reales — cero inconsistencias

```sql
select sending_country, count(distinct from_currency)
from fx_rates group by sending_country having count(distinct from_currency) > 1;
-- 0 filas

select receiving_country, count(distinct to_currency)
from fx_rates group by receiving_country having count(distinct to_currency) > 1;
-- 0 filas
```

En los 925 registros cargados, **ningún país tiene más de una moneda asociada**
en ninguno de los dos lados (origen o destino) — cada corredor investigado usa
consistentemente la moneda estándar ISO de ese país. Spot-check contra 20 países
(incluyendo AR, VE, US, GB, DE, NG, TR, EG, PK, IN) confirma que coincide
exactamente con lo que `localCurrency()` esperaría.

## 3. Qué significa esto en la práctica

- No hay riesgo de que un dato investigado en EUR se muestre como si fuera para
  USD, o viceversa — el propio diseño lo previene, no depende de que quien carga
  los datos "se acuerde" de hacerlo bien.
- Si algún día se quiere soportar el caso "cuenta multi-moneda" (alguien en
  Alemania que quiere enviar USD en vez de EUR, un caso real para Wise/Revolut),
  ya está contemplado: cae a la tarifa genérica del proveedor, no a un error ni a
  un número investigado mal aplicado.

---

## 4. Estado de esta sesión

Solo verificación de arquitectura y datos — no se tocó código ni Supabase.
