# comparadolar.ar/remesas — resuelve el corredor EEUU→Argentina con 9 proveedores nuevos — 2026-09-18

> Sigue directamente a la corrección de datos que trajo el usuario (una síntesis
> de IA sobre comisiones de Prex, verificada contra la fuente oficial en el
> camino). Buscando un proveedor mencionado ahí (Fiwind) encontré algo mucho más
> valioso: un comparador neutral de terceros específicamente para remesas
> entrantes a Argentina.

---

## 1. La fuente: comparadolar.ar/remesas

Comparador en vivo, construido sobre **"Dolarito vía ArgentinaDatos"** — la misma
fuente que ya recomendé el 11-sep como reemplazo de `dolarapi.com` para la
referencia ARS del proyecto. Simula un cobro de USD 1.000 y muestra, por
proveedor: fee de "recibir pagos", tipo de cambio de venta en vivo, y el monto
final en ARS ("Te quedan").

**Verificación matemática antes de confiar en la fuente**: recalculé
`(1000 × (1−fee%)) × vende_a` (o `(1000−fee_fijo) × vende_a` para el único caso
de fee fijo) contra las 9 filas — coincide exacto o con redondeo menor de
centavos en todas. Alta confianza.

## 2. Lo que se cargó

9 filas nuevas, corredor EEUU→Argentina (`to_currency=ARS`, no una stablecoin —
ver Sección 3 sobre esta decisión):

| Proveedor | Fee | Vende a | Nota |
|---|---|---|---|
| ARQ (nuevo) | USD 3 flat | 1.589,43 | El más caro en fee fijo, pero el mejor tipo de cambio |
| Cocos (nuevo) | 0.5% | 1.586,00 | |
| **Belo** | 0.5% + extra sin especificar | 1.585,86 | Primera vez que Belo entra a `providers` — toda la investigación previa (13-sep) quedó solo en docs, nunca se cargó como proveedor real |
| **Global66** | 0% | 1.577,19 | Corredor nuevo (EEUU→AR) para un proveedor que ya existía; cross-valida contra las mediciones directas del 11-sep (rango 1.574,97-1.630,93) |
| Takenos (nuevo) | 0% | 1.570,53 | |
| AstroPay (nuevo) | 1% | 1.568,73 | |
| Wallbit (nuevo) | 0% | 1.564,40 | |
| Ripio (nuevo) | 1.5% | 1.560,93 | |
| **Lemon** | 2% (efectivo) | 1.539,04 | Difiere del 1.5%+USD12 de `help.lemon.me` (13-sep) — probablemente esta cifra ya es el costo total efectivo, no solo el fee de depósito; ambas quedan documentadas, no se descarta ninguna |

Todas `sin_confirmar` — es una foto de un agregador de terceros, no una medición
directa en cada sitio, mismo criterio de cautela que el resto del proyecto.

## 3. Cómo se resolvió (parcialmente) el bloqueo de esquema del 16-sep

El 16-sep documenté que cargar filas cripto con `to_currency='USDT'/'USDC'`
rompería la búsqueda de corredores (que filtra por país, no por moneda). Acá se
resolvió de otra forma: **se cargó con `to_currency='ARS'`**, tratando el paso
intermedio por stablecoin (cuando el proveedor lo usa, ej. Belo) como un detalle
de implementación plegado en la tasa efectiva final. Esto encaja perfectamente en
el esquema actual — es un corredor EEUU→Argentina como cualquier otro.

**Lo que se pierde con este enfoque**: el usuario no ve que el dinero pasa por
USDT/USDC en el camino — solo ve el resultado final en ARS. Sigue siendo una
limitación real si en algún momento se quiere mostrar la stablecoin explícitamente
(como pedía la propuesta del 13-sep) — pero para el objetivo inmediato de "tener
datos reales y utilizables sin romper nada", esto funciona hoy.

## 4. Discrepancia encontrada en el contenido que trajiste (Prex)

Al verificar la síntesis de IA sobre comisiones de Prex contra la fuente oficial
(`prexcard.com.ar/legales-y-tarifas/comisiones`), encontré un error: el retiro en
cajero del exterior es **USD 5 + IVA** según la fuente oficial, no USD 3 como
decía el contenido pegado. Todo lo demás (transferencia Prex-a-Prex internacional
USD 0,82+IVA, transferencias al exterior USD 2,99) se confirmó correcto. La fuente
oficial no repite la distinción "gratis en pesos" que sí aparecía en la página de
marketing de Prex — queda sin resolver esa discrepancia específica, no se asumió
ninguna de las dos versiones como definitiva.

---

## 5. Estado de esta sesión

`fx_rates`: +9 filas (EEUU→Argentina). `providers`: +8 (belo, lemon, arq, cocos,
takenos, wallbit, astropay, ripio). Todas `sin_confirmar`. Prex sigue sin una
fila USD cargada — la calculadora sigue sin poder medirse en vivo, pero ahora hay
9 alternativas reales para ese mismo corredor mientras tanto.
