# Puentes cripto (USDC/USDT) en remesas — ¿existe en otros corredores? — 2026-09-11

> Responde directamente la pregunta: "¿existen opciones similares en otras rutas?".
> Sí — Venezuela es un caso todavía más fuerte que Argentina, y con una moneda
> distinta (USDT, no USDC), lo que confirma que la distinción que pediste (no
> mostrar todo como "dólares") es necesaria, no opcional.

---

## 1. Venezuela: el caso más fuerte encontrado, con una cifra enorme

**El 90% de las remesas que entran a Venezuela hoy llegan vía USDT**, según el
presidente de la Cámara Venezolana de Comercio Electrónico (Cavecom-e, declaración
de noviembre 2025, citada por BeInCrypto/Yahoo Finance) — más de 5 millones de
venezolanos (~20% de la población) usan criptoactivos para remesas y protección
contra la inflación.

La razón no es preferencia, es estructural: `belo.app` publicó un artículo dedicado
(7-sep-2026, **4 días antes de esta conversación**) explicando que **las
transferencias ACH y SEPA directamente no llegan a Venezuela** — el sistema bancario
venezolano está desconectado de la red de corresponsalía internacional. No es que el
canal cripto sea más barato y la gente lo prefiera; para la mayoría es **el único
canal verificable que funciona**.

### Las tres rutas que documenta Belo, con costos

| Ruta | Costo aproximado | Velocidad |
|---|---|---|
| **Cripto directa (USDT/TRC-20)** | <1 USD de fee de red + **1%-3% en conversión P2P** | 1-30 min |
| Plataformas puente (Payoneer, Airtm) | Variable según método | Horas a 5 días hábiles (KYC inicial) |
| Billetera internacional con envío directo (Belo) | Variable según la app del emisor | Minutos, conversión automática |

Detalle importante que confirma la tesis central del proyecto (moneda volátil →
margen alto, pero ahora en el mercado P2P, no en el bancario): Belo advierte
explícitamente **"revisar la cotización USDT/bolívar en al menos dos fuentes... los
spreads pueden variar hasta un 5% entre plataformas"** — la volatilidad de margen
que veníamos midiendo en Remitly/Western Union se traslada 1:1 al mercado P2P
cripto, con una variabilidad todavía mayor entre plataformas.

## 2. Argentina: mismo patrón, pero con USDC — confirma que la moneda SÍ importa

Ya documentado ayer (`2026-09-11-fintechs-argentinas-remesas-entrantes.md`): Belo y
Lemon en Argentina liquidan en **USDC**, no USDT. Esto confirma exactamente lo que
pediste — **no es lo mismo en todos los corredores**, y mostrarlo como "dólares"
genérico sería incorrecto en los dos sentidos: (a) esconde que es una stablecoin, no
USD real en una cuenta bancaria, y (b) esconde cuál stablecoin específica, que
importa para el usuario (USDT y USDC tienen ecosistemas, liquidez y aceptación P2P
distintos según el país).

## 3. Por qué vale la pena seguir esto — mi evaluación

Con el dato del 90%, esto deja de ser "una curiosidad de producto" y pasa a ser
potencialmente **el canal real más usado para Venezuela**, muy por encima de
Remitly/Western Union en volumen real (aunque esos sigan siendo los únicos medibles
con la metodología actual del proyecto, precios de tarjeta). Si el objetivo del
comparador es reflejar la realidad del mercado, no cubrir esto sería una laguna
grande, no chica.

**Recomendación**: sí vale la pena seguir investigando, con este alcance para la
próxima ronda:
1. Confirmar si el patrón se repite en Cuba, Nicaragua, Rusia/Bielorrusia (otros
   mercados con controles cambiarios fuertes o desconexión bancaria) — no
   investigado todavía.
2. Medir el spread P2P real (el rango "1%-5%" que dan las fuentes es un rango, no
   una cifra puntual) contra una plataforma P2P específica y verificable
   (Binance P2P es la más grande, ya la usa el mercado venezolano según las fuentes).
3. Definir el modelo de datos antes de cargar nada (ver Sección 4).

## 4. Lo que esto necesita del modelo de datos — no es solo agregar filas

Para representar esto bien (y que se muestre correctamente, con la moneda cripto
explícita como pediste, no como "dólares"), el comparador necesitaría poder
distinguir, por fila:

- **Qué stablecoin liquida** (`USDT`, `USDC`, etc.) — no asumir que es la misma en
  todos los corredores, ya está confirmado que no lo es (Argentina=USDC,
  Venezuela=USDT).
- **Que el "recibe" no es la moneda local final** — el usuario recibe la stablecoin,
  y decide después (en un paso separado, con su propio spread) si/cuándo convertir a
  moneda local. El monto final en ARS/VES no es un número fijo al momento del envío
  como en el resto del comparador — depende de cuándo el usuario convierta.
- **Que el spread de conversión final (stablecoin→moneda local) varía por
  plataforma P2P**, no es fijo por "proveedor" de la forma en que Remitly o Western
  Union tienen un spread fijo — es un mercado, no un precio publicado.

Esto es una diferencia estructural real con el resto del comparador, no solo un
detalle de UI — es la misma conclusión a la que llegué ayer con Belo/Lemon
Argentina, reforzada ahora con un caso (Venezuela) donde la escala (90% del
mercado) hace que valga la pena resolverlo en vez de dejarlo afuera.

---

## 5. Estado de esta sesión

No se cargó nada a Supabase — sigue siendo una decisión de producto (qué tan lejos
llevar el modelo de datos para representar esto bien) antes de cargar cualquier
cifra, más la investigación pendiente del punto 3.1-3.2 de la Sección 3.
