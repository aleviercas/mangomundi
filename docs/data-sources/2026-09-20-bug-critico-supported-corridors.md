# Bug crítico: proveedores acotados apareciendo en corredores ajenos — 2026-09-20

> El usuario detectó en producción que Belo y Cocos aparecían en Reino
> Unido→Angola — un corredor que jamás investigamos para esos proveedores.
> Investigación inmediata confirmó un bug real de integridad de datos, no un
> falso positivo.

---

## 1. Causa raíz confirmada

`fx.functions.ts` línea 812:

```ts
if (p.is_corridor_specific && p.supported_corridors && p.supported_corridors.length > 0) {
  return p.supported_corridors.includes(`${data.sendingCountry}-${data.receivingCountry}`);
}
```

El whitelist **solo se aplica si `supported_corridors` está poblado**.
`is_corridor_specific=true` por sí solo, sin el array, no restringe nada — el
proveedor cae al comportamiento de "red amplia" por defecto.

## 2. Alcance real: 41 proveedores afectados, no solo 2

Los 9 proveedores que cargué el 18-sep (comparadolar.ar, corredor EEUU→Argentina)
tenían exactamente este problema: `is_corridor_specific=true`,
`supported_corridors=null`. Auditando el resto de la base encontré **41
proveedores en total** con la misma combinación.

## 3. Arreglado: 38 de 41

- **9 proveedores del 18-sep** (belo, lemon, arq, cocos, takenos, wallbit,
  astropay, ripio) → `supported_corridors=['US-AR']`.
- **Global66** → se listaron los 5 corredores reales que tiene (no solo el
  nuevo), para no romper los que ya andaban bien: `AR-ES, AR-IT, AR-GB, GB-AR,
  US-AR`.
- **29 proveedores más** (Dahabshiil, LemFi, Lulu Money, NALA, Mukuru, y 24 más
  — la mayoría cambistas regionales de EAU/India/África) → restringidos a
  **exactamente** los corredores que ya tienen como filas reales en
  `fx_rates`, sin inventar ninguno nuevo.

## 4. Sin arreglar, con razón documentada

- **azimo, iremit, zing** — cero filas en `fx_rates`. No hay evidencia de qué
  corredores cubren realmente, así que no se puede restringir con confianza
  sin investigarlos primero.
- **western-union, moneygram, ria, remitly, worldremit, xoom, paysend,
  sendwave, taptap-send** — estos SÍ son redes genuinamente amplias (cientos
  de corredores reales). El flag `is_corridor_specific=true` en ellos parece
  un error de modelado (probablemente debería ser `false`), pero como no
  causan fuga activa hoy (sin `supported_corridors`, el código ya los trata
  como amplios), no era parte del problema urgente — queda como recomendación
  para revisar en otra sesión.

## 5. Diferenciación de moneda/método de pago para proveedores cripto — gap confirmado, no resuelto todavía

Revisando los 9 proveedores cripto encontré que **los tres métodos de entrega
(`bank_transfer_available`, `cash_pickup_available`, `card_payout_available`)
están en `null`** para todos — no encajan en ninguna categoría existente. Esto
confirma, con datos reales, la necesidad ya planteada el 16 y 19-sep: agregar
un método de entrega "cripto" (código nuevo, `DeliveryMethod` +
`DELIVERY_METHOD_PREDICATES`) y un campo de etiqueta (`settlement_asset` o
similar) para diferenciar USDT de USDC. **No lo implementé en esta sesión** —
sigue siendo un cambio de código que necesita una sesión con capacidad de
preview/testing, no algo para tocar a ciegas.

---

## 6. Estado de esta sesión

Dos migraciones aplicadas, ambas solo `UPDATE` sobre `providers.supported_corridors`
— cero filas de `fx_rates` tocadas, cero datos inventados. 38 de 41 proveedores
con el bug quedaron corregidos.
