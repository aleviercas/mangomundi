# Mangomundi — Research de tarifas escalonadas: 13 proveedores corridor-specific

**Fecha:** 24 agosto 2026 (actualizado 25 agosto 2026 — muestreo en vivo completo de los 9 proveedores dinámicos restantes)
**Alcance:** los proveedores con `is_corridor_specific = true` y `fee_tiers: []` vacío al inicio de este research (Western Union, MoneyGram, Ria, Remitly, WorldRemit, Xoom, Paysend, Sendwave, TapTap Send, LemFi, NALA, Money2India, BDO Remit, UBL Tezraftaar).

**Metodología:** fuente primaria únicamente (sitio oficial / centro de ayuda / PDF propio del proveedor, nunca agregadores de terceros). El 24 de agosto, 5 agentes corriendo en simultáneo tuvieron un incidente real de navegador (contención de recursos → pestañas con contenido cruzado) que impidió el muestreo interactivo de cotizadores para la mayoría de los proveedores dinámicos; los agentes descartaron explícitamente cualquier dato no verificable en vez de arriesgar una cifra incorrecta. El 25 de agosto, con la extensión de Chrome reconectada y corriendo **un solo agente por vez** (sin contención), se completó el muestreo sistemático de los 5 montos pedidos (100/500/1.000/5.000/10.000) para los 9 proveedores que quedaban pendientes.

---

## Resumen ejecutivo

**Hallazgo principal:** de los 13-14 proveedores, **solo BDO Remit publica una tabla de tarifas fija y completa por tramo de monto**. El resto usa pricing 100% dinámico (cotizador JS). Con el muestreo completo del 25 de agosto, ese pricing dinámico resultó ser, en la práctica, **plano dentro del rango 100–10.000** en casi todos los casos — ni la tasa ni el fee escalonan con el monto para la mayoría, con dos excepciones reales (Western Union y WorldRemit, ver más abajo).

**Hallazgo nuevo relevante:** varios proveedores especializados en Nigeria (TapTap Send, Sendwave) y en general LemFi ofrecen una tasa de cambio **mejor que el mid-market interbancario** (spread negativo, entre -2% y +3%) — no es un error, es la brecha conocida entre el tipo de cambio oficial/interbancario y el paralelo de esas monedas, que estos proveedores aprovechan para ofrecer tasas "premium" financiadas por otras vías.

| # | Proveedor | ¿Tabla de tramos publicada? | ¿Escalona con el monto (100-10.000)? | Dato más sólido |
|---|---|---|---|---|
| 1 | Western Union | No | **Sí** — la tasa salta en un escalón entre 500 y 1.000 GBP (131.99→130.43); fee siempre 0 | Muestreo completo 25 ago, UK→India |
| 2 | MoneyGram | No | Solo por promoción — tasa "1ª transferencia" con techo entre 1.000-5.000 GBP, después vuelve a ~mid-market | Muestreo completo 25 ago, UK→India |
| 3 | Ria Money Transfer | No | No (tasa normal plana ~130.21 en todo el rango; solo la promo de bienvenida varía) | Muestreo completo 25 ago, UK→India. Tope real del corredor: **8.000 GBP** |
| 4 | Xoom | Parcial (tabla de fee=$0 por condición) | Sí, leve — fee $1.99 baja a $0 desde 1.000 GBP, tasa mejora ligeramente | Muestreo completo 25 ago, UK→India |
| 5 | Remitly | No | No (fee 1.99 y tasa 130.25 planos en todo el rango, tasa "everyday") | Muestreo completo 25 ago, UK→India |
| 6 | WorldRemit | No | **Sí** — fee 1.99 baja a 0 desde 1.000 GBP, con leve mejora de tasa en el mismo salto | Muestreo completo 25 ago, UK→India |
| 7 | Paysend | No | No (fee 0 y tasa 84.18 planos) | Muestreo completo 25 ago, UK→Filipinas |
| 8 | TapTap Send | No | No (fee 0 y tasa 1.875 planos, mejor que mid-market) | Muestreo completo 25 ago, UK→Nigeria |
| 9 | Sendwave | No | No (fee 0 y tasa 1.881,88 planos, mejor que mid-market) | Muestreo completo 25 ago, UK→Nigeria |
| 10 | LemFi | No | No (fee 0 y tasa 1.895 planos, mejor que mid-market) | Muestreo completo 25 ago, UK→Nigeria |
| 11 | NALA | Parcial | N/A (varía por país destino, no por monto) | Fee plano USD/GBP/EUR 5.99 a Uganda/Tanzania, ya cargado en `fx_rates` |
| 12 | Money2India | Parcial (1 umbral) | Sí, un solo salto ($4→$0 en $1.000) | Ya en `fx_rates`, **ahora también en `providers.fee_tiers`** |
| 13 | BDO Remit (USA) | **Sí, completa** | Sí, 6 tramos reales | Ya en `fx_rates`, **ahora también en `providers.fee_tiers`** |
| — | UBL Tezraftaar Cash | Parcial (por país origen) | Sí, pero en moneda local (QAR/AED) | Ya en `fx_rates` (AE→PK) |

---

## 1. Ya cargado en producción (25 ago 2026)

**BDO Remit** y **Money2India** tenían su dato real ya verificado en `fx_rates` desde una investigación anterior, pero `providers.fee_tiers` (el campo que el motor de comparación realmente usa mientras `ENABLE_CORRIDOR_FILTERING` está apagado) estaba vacío — mostraban fee $0 y spread 0% en cualquier comparación real. Se corrigió con la migración `20260825074324_populate_fee_tiers_bdo_money2india`, espejando exactamente el dato ya citado (PDF oficial BDO / World Bank RPW), sin inventar ningún número nuevo.

`UBL Tezraftaar` y `NALA` se dejaron fuera a propósito: sus tarifas varían por país de origen (moneda distinta, QAR/AED) o por país de destino (no por monto), y `fee_tiers` solo modela tramos por monto en una sola moneda implícita — forzarlos ahí sería representarlos mal.

## 2. Muestreo en vivo de los 9 proveedores dinámicos (25 ago 2026) — completo

Metodología: cotizador pre-login de cada sitio, un agente por vez (sin contención), 5 montos (100/500/1.000/5.000/10.000) en la moneda de origen, verificando tras cada cambio que la pantalla realmente recalculó. Mid-market de referencia: xe.com, mismo día.

### 2.1 Western Union — Reino Unido → India (GBP→INR)
Mid-market: 1 GBP = 130.5051 INR (25 ago, 07:57 UTC)

| Monto | Fee | Tasa ofrecida | Spread | Método |
|---|---|---|---|---|
| 100 | 0.00 | 131.9910 | -1.14% | Tarjeta débito/crédito → banco |
| 500 | 0.00 | 131.9910 | -1.14% | ídem |
| 1.000 | 0.00 | 130.4310 | +0.06% | ídem |
| 5.000 | 0.00 | 130.4310 | +0.06% | Transferencia instantánea (tarjeta ya no disponible sobre £4.150) |
| 10.000 | 0.00 | 130.4310 | +0.06% | ídem |

Fee siempre 0; todo el margen está en la tasa, que da un salto discreto entre 500 y 1.000 GBP (posible tasa promocional para montos chicos).

### 2.2 MoneyGram — Reino Unido → India (GBP→INR)
Mismo mid-market que 2.1. Checkout completo exige crear cuenta; datos del calculador público.

| Monto | Fee | Tasa (promo 1ª transferencia) | Spread |
|---|---|---|---|
| 100–1.000 | 0.00 (promo) | 132.0635 | -1.19% |
| 5.000–10.000 | 0.00 | 130.3758 | +0.10% |

Letra chica: "Pricing effective for first online transfer only... Some receive countries are not eligible for $0 fee and exchange rate promos."

### 2.3 Ria Money Transfer — Reino Unido → India (GBP→INR)
Mid-market: 1 GBP = 130.50964 INR (25 ago, 08:04 UTC). **Tope real del corredor: 8.000 GBP** (10.000 fue rechazado).

| Monto | Fee normal | Tasa normal | Spread |
|---|---|---|---|
| 100–500 | 1.50 | 130.21 | 0.23% |
| 1.000 | 2.00 | 130.21 | 0.23% |
| 5.000 | 6.00 | 130.21 | 0.23% |
| 8.000 (máximo) | 10.00 | 130.21 | 0.23% |

(Existe además una tasa promo de 1ª transferencia, 132.21, no representativa de uso recurrente.)

### 2.4 Xoom — Reino Unido → India (GBP→INR)
Sin login necesario para cotizar.

| Monto | Fee (banco/tarjeta) | Fee (efectivo) | Tasa | Spread |
|---|---|---|---|---|
| 100–500 | 1.99 | 3.99 | 128.8888 | 1.24% |
| 1.000 | 0.00 | 3.99 | 129.1473 | 1.04% |
| 5.000–10.000 | 0.00 | 3.99 | 129.2507 | 0.96% |

### 2.5 Remitly — Reino Unido → India (GBP→INR)
Mid-market: 1 GBP = 130.519 INR (25 ago, 02:05 UTC). Tasa "everyday" plana en los 5 montos: fee 1.99, tasa 130.25 (spread 0.206%). Existe una "welcome rate" promocional (tope 1.000 GBP) descartada por no ser representativa de uso recurrente.

### 2.6 WorldRemit — Reino Unido → India (GBP→INR)
Mismo mid-market que 2.5.

| Monto | Fee | Tasa | Spread |
|---|---|---|---|
| 100–500 | 1.99 | 129.4864 | 0.791% |
| 1.000–10.000 | 0.00 | 129.6822 | 0.641% |

### 2.7 Paysend — Reino Unido → Filipinas (GBP→PHP)
Mid-market: 84.1927 PHP. Plano en los 5 montos: fee 0.00, tasa 84.1796 (spread 0.016% — inusualmente ajustado, probable recargo oculto post-login no verificable).

### 2.8 TapTap Send — Reino Unido → Nigeria (GBP→NGN)
Mid-market: 1.836.7546 NGN. Plano: fee 0, tasa 1.875,000 (spread -2.08%, mejor que mid-market).

### 2.9 Sendwave — Reino Unido → Nigeria (GBP→NGN)
Mismo mid-market que 2.8. Plano: fee 0.00, tasa 1.881,879 (spread -2.46%). **Anomalía detectada y descartada:** pegar el monto de una vez (en vez de tipearlo dígito por dígito) produjo dos lecturas erróneas del campo "reciben" — no se reportaron, se repitió la medición con resultados consistentes. Puede ser un bug real del widget de Sendwave, vale la pena que lo sepas de cara a la experiencia de usuarios reales.

### 2.10 LemFi — Reino Unido → Nigeria (GBP→NGN)
Mid-market: 1.836.7546 NGN. Plano: fee 0, tasa 1.895 (spread +3.17%, mejor que mid-market). Calculadora de marketing simplificada — no expone método de pago/cobro, cálculo client-side sin llamadas de red por monto.

---

## 3. Por qué esto NO se cargó en `fee_tiers`

Todos los números de la sección 2 son **muestras de un cotizador en un momento dado**, no tablas oficiales publicadas — así lo confirmaron los propios proveedores por escrito (WU, MoneyGram, WorldRemit: "el precio varía por transacción"). Varias de las tasas observadas son explícitamente promocionales ("first transfer", "welcome rate"), pueden cambiar sin aviso, y ya son casi 24-48hs viejas para cuando esto se lea. Cargarlas en `providers.fee_tiers` como si fueran una tabla estable sería exactamente el tipo de error que este research nació para evitar (la cifra incorrecta de Western Union que motivó todo esto).

**Mi recomendación:** dejar los valores planos actuales de `providers` (que ya son estimaciones genéricas razonables, no ceros) sin tocar para estos 9-10 proveedores, y usar esta sección como referencia/auditoría — por ejemplo, para detectar si en el futuro una tasa observada se desvía mucho de la estimación genérica. Si preferís cargar algo igual (aun sabiendo que es una foto del 25/08 y no una tabla estable), decímelo y lo hago — pero quería que la decisión fuera tuya con el contexto completo, no una que tomara solo porque dijiste "cargar todo".

## Fuentes

- `claude/investigacion-tarifas-ria-xoom-2026-08-24.md` (research original Ria/Xoom, 24 ago)
- Sección 10 de `claude/diagnostico-arquitectura-proveedores-corredores.md` (research original WU/MoneyGram, 24 ago)
- Este documento consolida todo: hallazgos del 24 ago + el muestreo en vivo completo del 25 ago (secciones 1 y 2).
