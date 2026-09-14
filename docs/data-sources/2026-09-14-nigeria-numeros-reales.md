# Nigeria — números reales de hoy, confirmado con detalle operativo importante — 2026-09-14

> Sigue a `2026-09-13-correccion-georgia-moldavia-nigeria.md`, que confirmó Nigeria
> como candidato fuerte pero solo con un ejemplo ilustrativo de un tercero
> (monica.cash). Acá van los números reales de hoy, de fuente oficial + agregador
> P2P, más un detalle operativo que cualquier implementación futura necesita saber.

---

## 1. Los números de hoy (14-sep-2026)

| Fuente | Tasa | Fecha/hora |
|---|---|---|
| **CBN oficial (NFEM)** | ₦1.326,84/USD | Hoy, apertura de semana |
| Paralelo/mercado negro (cash, BDC) | ₦1.380 compra / ₦1.390 venta | Hoy |
| **Cripto P2P (USDT, promedio agregado)** | ₦1.384/USDT | Hoy, en vivo (`p2p.army`) |

```
brecha oficial vs. paralelo (cash) = (1.390-1.326,84)/1.326,84 = 4,76%
brecha oficial vs. cripto P2P      = (1.384-1.326,84)/1.326,84 = 4,31%
```

**Más chica que el "10-20%" citado por la fuente comercial de la ronda anterior**
(monica.cash, que vende conversión USDT→Naira, así que tiene incentivo a mostrar
la brecha más favorable posible) — pero sigue siendo una brecha real, positiva y
significativa, confirmada con fuente oficial (CBN) + un agregador neutral de
mercado (P2P Army, no un solo exchange). Recomiendo usar esta cifra (~4,3-4,8%)
como referencia, no el 10-20% de la ronda anterior.

## 2. Detalle operativo importante: Binance específicamente no sirve para Nigeria

Al consultar `p2p.army` para NGN, encontré algo crítico para cualquier
implementación futura: **Binance P2P muestra actividad CERO para NGN hoy** (0
anuncios, $0 de volumen) — confirma que Binance efectivamente se retiró/fue
restringido del mercado P2P nigeriano (consistente con el episodio de 2024 donde
el CBN detuvo ejecutivos de Binance).

**La liquidez real hoy está en otras plataformas**: Bybit P2P (36,7M de volumen en
anuncios), Gate P2P, Bitget P2P, MEXC P2P, OKX P2P — en ese orden de volumen. Si en
algún momento se integra una fuente automática para NGN (misma lógica que la
arquitectura de fuentes documentada el 11-sep), **Binance NO es la fuente correcta
para este país específico** — haría falta usar Bybit u otro agregador, a
diferencia de Venezuela donde Binance sí es la plataforma dominante.

## 3. Conclusión

Nigeria queda confirmado como el tercer candidato fuerte (junto a Venezuela y
Argentina), con:
- Brecha real y documentada (~4,3-4,8% hoy, fuente oficial CBN + agregador P2P
  neutral).
- Precedente institucional fuerte (el banco central peleó activamente contra
  Binance P2P en 2024).
- Una salvedad operativa clave: la fuente de datos para este país específico debe
  ser Bybit u otro agregador, no Binance directamente.

---

## 4. Estado de esta sesión

Solo investigación — no se cargó nada a Supabase (sigue pendiente la decisión de
esquema para representar cripto, documentada el 13-sep). Los tres candidatos
confirmados con evidencia real (Venezuela, Argentina, Nigeria) están listos para
cuando se implemente esa decisión.
