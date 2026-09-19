# Íconos, arquitectura cripto, Brasil, y bug de "rutas de hoy" — 2026-09-19

> Responde cuatro pedidos de la misma consulta.

---

## 1. Íconos faltantes — resuelto, y una corrección de entendimiento

`providers.logo_emoji` **no se usa en ningún componente de la UI** (confirmado
con grep completo de `src/`) — es un campo legado. El ícono real se resuelve en
`BrandLogo.tsx`: primero busca un logo self-hosted en `/public/logos/{slug}.png`
(set curado `LOCAL_LOGOS`), si no está ahí pide el logo real a `unavatar.io`
usando el dominio de `website_url`, y si todo falla cae a iniciales en un
círculo gris — nunca un emoji inventado.

**Lo que realmente faltaba**: `website_url` vacío en 35 proveedores. Arreglados
20 con dominios verificados (búsqueda, no inventados):
- Los 6 que cargué el 18-sep (arqfinance.com, cocos.capital, takenos.com,
  wallbit.io, astropay.com, ripio.com) — de paso confirmé que
  ARQ liquida en **"USDc"/"EURc"** (su propia marca de dólar/euro digital),
  relevante para la Sección 2.
- 14 más de la lista histórica (mukuru.com, smallworldfs.com, strike.me,
  bitso.com, chippercash.com, etc.)

**Quedan 15 sin arreglar** (Al Fardan Exchange, Chaabi Cash, DirectRemit NBD, e&
money, GCC Exchange, HelloCash, Hubpay, iRemit, Kabayan Remit, Lari Exchange,
Payit, Wall St Exchange, CashMinute) — no encontré el dominio exacto con
confianza suficiente, prefiero dejarlos con iniciales antes que arriesgar un
link equivocado.

## 2. Cripto: ¿USDT/USDC como moneda del corredor era el plan?

No exactamente — y ya lo resolví de otra forma el 18-sep, con un motivo técnico
concreto.

**Tu idea** (poner USDT/USDC como `to_currency` en el corredor del país
correspondiente, en vez de la moneda fiat) **no funcionaría con el código
actual**: verifiqué que `ComparisonRow` no tiene ningún campo `to_currency` por
fila — la moneda de destino se fija **una sola vez para toda la consulta**
(`ComparisonResult.quote`). Si pusiera `to_currency='USDT'` en una fila del
corredor EEUU→Argentina, el usuario vería el número igual, pero etiquetado como
si fueran pesos — un bug real, no solo una limitación cosmética.

**Lo que sí hice** (18-sep, comparadolar.ar): cargar `to_currency='ARS'`
directamente, con el paso por USDT/USDC ya plegado en la tasa final. Esto anda
hoy, pero pierde el detalle "esto pasa por una stablecoin específica" que vos
querés mostrar.

**Para mostrar la diferencia USDT/USDC sin romper nada**, la solución correcta
es más chica de lo que pensé el 16-sep: agregar un campo nuevo, **solo para
etiqueta** (ej. `settlement_asset: 'USDT' | 'USDC' | null`), que no toca la
lógica de búsqueda ni de ranking — solo le dice a la UI "esta fila en particular,
mostrá además un cartelito con qué stablecoin es". No es la ruta de consulta
separada que planteé como la única opción el 16-sep — es más simple. Puedo
armar esto en una próxima sesión de implementación si confirmás que es el
camino que querés.

## 3. Brasil — hallazgo importante, con un matiz que corrige el titular fácil

**Resolução BCB nº 561** (Banco Central de Brasil, publicada 30-abr-2026,
**entra en vigor el 1-oct-2026** — esta semana) — muchos titulares la resumieron
como "Brasil prohíbe las stablecoins en pagos internacionales". **Eso es
impreciso**, confirmado cruzando 5+ fuentes técnicas/legales independientes
(Migalhas, ABBC, Finsiders Brasil, Lefosse, Mercgroup):

- **Lo que SÍ prohíbe**: que los proveedores de **eFX** (un servicio específico
  y licenciado — pagos/transferencias internacionales digitales, masivos, de
  bajo monto individual — ej. **Nomad, Wise, Braza Bank**) liquiden con su
  contraparte en el exterior usando activos virtuales (USDT, USDC, etc.),
  **incluso en la capa de tesorería invisible para el usuario final**. La
  liquidación debe ser vía operación de cambio tradicional o cuenta en reales
  de no residente.
- **Lo que NO prohíbe**: comprar, vender o custodiar cripto en Brasil en
  general — eso sigue permitido, con su propio régimen (Resolução BCB 521, que
  integra activos virtuales al mercado de cambio con las mismas obligaciones de
  reporte que el sistema tradicional).
- **Por qué**: trazabilidad/AML — el Banco Central argumenta que las stablecoins
  emitidas en distintas jurisdicciones dificultan aplicar el estándar FATF y la
  Ley 9.613/98 (lavado de dinero) al nivel exigido al sistema cambiario
  tradicional.
- **A quién afecta en la práctica**: Nomad tenía un modelo documentado
  públicamente — convertir reales a stablecoin, mover los fondos por la red
  blockchain de Ripple (XRP Ledger) hasta EEUU, liquidar en cripto — más rápido
  y barato que el sistema interbancario tradicional. Braza Bank había ido más
  lejos todavía: emitió su propia stablecoin atada al real directamente en el
  XRP Ledger. Ambos modelos quedan cerrados desde octubre.

**Por qué esto importa para el proyecto**: es la primera señal regulatoria
fuerte en la dirección OPUESTA al patrón que documentamos toda la semana
(Venezuela/Argentina/Nigeria adoptando cripto para remesas) — Brasil, que tenía
1/3 de toda la actividad cripto de LatAm según research anterior, cierra
específicamente la vía de liquidación cripto para el servicio más parecido a
"puente cripto para remesas" que existía ahí. Vale la pena tenerlo presente si
alguna vez se investiga Brasil para la función cripto del comparador.

## 4. "Rutas de hoy" — diagnóstico con datos reales, causa no 100% confirmada

Encontré una sección con historial extenso de debugging real de este mismo
síntoma (comentarios fechados 30-ago, 12-sep, 13-sep en `fx.functions.ts`) — no
es un tema nuevo ni abandonado.

**Lo que verifiqué con SQL real** (no solo lectura del código): de los 19
corredores candidato (`EXCLUSIVE_CORRIDOR_CANDIDATES`), al menos **6 ya no
calificarían hoy** porque un proveedor SIN trato exclusivo ahora gana ese
corredor (con toda la data nueva cargada esta semana):
- US-MX: Xoom (spread -0.24%) le gana a Wise
- ES-CO: Global66 (spread 0.33%) le gana a Wise
- AU-ID: Remitly le gana a Wise
- CA-NG: Remitly le gana a Wise
- CA-CN: Remitly le gana a Wise (este es justo el que el propio comentario del
  código cita como ejemplo de que "Wise gana" — ya no es cierto)
- GB-PK: LemFi le gana a Wise, por muy poco (-0.03% vs 0%)

Esto **no explica por sí solo** bajar de varios a solo 1 — mi cálculo a mano
sugiere que unos 12 candidatos todavía deberían calificar. Lo más probable,
dado el historial ya documentado en el código: se combina con el problema de
timeouts de Supabase bajo ráfagas paralelas (`Promise.all` sobre ~19
candidatos simultáneos, documentado 13-sep) — el retry con backoff que ya
existe puede no alcanzar si la carga es peor que cuando se implementó.

**No pude confirmarlo 100%** sin acceso a logs de producción en vivo (Vercel/
Supabase), que esta sesión no tiene. Recomiendo: (a) refrescar la lista de
candidatos con corredores donde un proveedor exclusivo SÍ gane hoy (mismo
método que uso arriba), y (b) revisar si el timeout/retry necesita ajuste, en
una sesión con acceso a logs reales.

---

## 5. Sobre la nota de blog de Brasil

La armé y la dejo para tu revisión antes de publicarla (el blog vive en
Supabase `blog_posts`, no en archivos del repo — publicar ahí es una acción de
contenido en vivo, no solo carga de datos de research, así que prefiero que la
veas antes). Te la paso en el chat.

---

## 6. Estado de esta sesión

`providers`: 20 `website_url` completados (6 propios + 14 históricos), sin
cambios de esquema. Nada cargado a `blog_posts` todavía — draft pendiente de tu
aprobación. Nada cargado a `fx_rates` sobre Brasil (la Resolución 561 es
contexto regulatorio, no un dato de tarifa).
