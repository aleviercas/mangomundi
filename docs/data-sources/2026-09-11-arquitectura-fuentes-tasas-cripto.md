# Cómo obtener tasas cripto (USDT/USDC) — arquitectura de fuentes — 2026-09-11/12

> Responde directamente: "¿cómo vamos a obtener la rate de cripto, si la de las
> monedas viene de fuentes vinculadas vía API (Frankfurter, etc.)?". Investigué las
> opciones reales. Hay dos capas distintas del problema, y cada una tiene una
> respuesta distinta.

---

## 1. El problema tiene dos capas, no una

Cuando alguien recibe una remesa en USDT/USDC, hay dos tasas en juego:

1. **La paridad global de la stablecoin contra el dólar** (¿1 USDT vale exactamente
   1,00 USD, o 0,999?) — esto es igual en todo el mundo, no depende del país.
2. **La prima/descuento local del mercado P2P** (¿cuántos VES/ARS te dan por ese
   USDT en el mercado paralelo de ese país específico?) — esto es lo que realmente
   importa para la tesis del proyecto, y es distinto en cada país.

Frankfurter (y las demás "open rates" que ya usamos) resuelven bien el problema de
tipo de cambio fiat-a-fiat estándar, pero **no tienen ningún concepto de mercado
P2P local** — no es que falten cripto, es que ese tipo de dato no existe en una
fuente de tipo de cambio de banco central. Necesitamos una fuente distinta para
cada capa.

## 2. Capa 1 — paridad global de la stablecoin: resuelto, es fácil

**CoinGecko** (`api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd`)
— gratis, sin API key, documentada oficialmente, 30 llamadas/min en el tier
gratuito. Da la paridad real de USDT/USDC contra USD (típicamente 0,998-1,001, casi
siempre estable). Esta parte es tan simple como Frankfurter — no hay drama acá.

## 3. Capa 2 — prima P2P local: acá está la decisión real

### 3.1 Para Argentina — buena noticia, ya existe la fuente correcta

Mientras investigaba esto encontré que **`api.argentinadatos.com`** (la API detrás
del paquete Python `argendolar`) ya trackea el "dólar cripto" como una categoría
propia, al mismo nivel que blue/oficial/MEP/CCL — **no es algo que tengamos que
armar nosotros, ya es una categoría estándar del ecosistema de datos argentino**.

Verificado en vivo (11/12-sep-2026): serie histórica completa desde 2011,
actualizada a hoy mismo:

| Categoría | Compra | Venta | Fecha |
|---|---|---|---|
| oficial | 1.485 | 1.535 | 2026-09-10/11 |
| blue | 1.525 | 1.545 | 2026-09-12 |
| **cripto** | **1.583,99** | **1.590,51** | **2026-09-11** |

**Esto también resuelve el problema de staleness que encontré ayer** con
`dolarapi.com` (que mostraba `fechaActualizacion` de hace 6 días) —
`api.argentinadatos.com` está genuinamente al día. Recomiendo migrar la referencia
ARS del proyecto de `dolarapi.com` a `api.argentinadatos.com` — misma familia de
fuente (dato público argentino, sin costo, sin key), pero más fresca y con la
categoría "cripto" ya lista para lo que necesitamos.

### 3.2 Para Venezuela y el resto de LatAm — no hay un "Frankfurter cripto" hecho y derecho

Acá no encontré un equivalente tan limpio. Las opciones reales, de más a menos
"oficial":

| Opción | Qué es | Pros | Contras |
|---|---|---|---|
| **Endpoint no-oficial de Binance P2P** (`p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`) | El endpoint interno que usa la propia web de Binance | Gratis, es la fuente primaria real (lo usan `usdt.com.ve`, `p2p.army` y prácticamente todos los trackers que existen) | **No documentado oficialmente** por Binance — podría cambiar de formato o cortarse sin aviso. Zona gris de ToS para poll automático de alta frecuencia |
| **"LatAm P2P Data"** (servicio de terceros, descubierto en un post técnico) | API paga que envuelve el mismo endpoint de Binance para 15 monedas de LatAm (incluye ARS, VES, BOB, COP, etc.), USD 0,002/llamada | Ya resuelto, cubre exactamente los países del proyecto | Proveedor chico/nuevo (un solo mantenedor, pago solo con cripto vía protocolo x402) — no hay due diligence hecha todavía, riesgo de que desaparezca |
| Scrapers pagos tipo Apify (`Argentina Dollar Scraper`, etc.) | Scraping empaquetado como servicio | Fácil de integrar, output normalizado | Cuesta dinero por resultado, sigue siendo scraping por debajo — mismo riesgo de fragilidad que hacerlo nosotros |
| MCP servers de terceros (`latam-data-mcp`, `latam_pulse`, encontrados en el registro de PyPI/Glama) | Servidores MCP ya armados con este tipo de datos | Se conectarían directo al ecosistema de herramientas de Claude, cero código nuestro | No evaluados todavía — no sé si son confiables, activamente mantenidos, ni quién está detrás |

### 3.3 Mi recomendación concreta

1. **Ya mismo**: migrar la referencia ARS de `dolarapi.com` a
   `api.argentinadatos.com` — mejora inmediata, misma categoría de fuente (gratis,
   pública, sin key), resuelve el problema de staleness Y nos da la categoría
   "cripto" lista.
2. **Corto plazo, para Venezuela/otros países**: usar el endpoint no-oficial de
   Binance P2P como fuente primaria (es lo que usa toda la industria de trackers
   igual), pero con diseño defensivo — cachear agresivamente, tener un fallback
   (ej. a `ve.dolarapi.com` paralelo si Binance falla), y no depender de él para
   nada crítico sin monitoreo.
3. **Para evaluar, no urgente**: probar los MCP servers de terceros
   (`latam-data-mcp` en particular, que ya menciona "Argentina's blue rate"
   explícitamente) como una capa más simple que integrar el scraping nosotros
   mismos — si son confiables, nos ahorran mantener esta lógica.

No recomiendo pagar por "LatAm P2P Data" todavía — es un proveedor muy nuevo y chico
para depender de él en producción sin más validación.

---

## 4. Estado de esta sesión

Solo investigación — no se cargó nada a Supabase ni se cambió código. Esto es una
decisión de arquitectura de datos, no un hallazgo de tarifa puntual: dejo la
recomendación de la Sección 3.3 para que la evalúes antes de que cualquier sesión
(de research o de código) empiece a integrar esto de forma permanente.
