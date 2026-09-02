# Ajustes · ronda 1

La arquitectura llegó bien: conmutador Individual/Business, campos país·moneda, rail izquierdo, rutas, upsell estable. Lo que falta es la **capa de diseño**: tipografía, jerarquía de la tabla y dos secciones que no se construyeron.

Referencia para cada medida: `design/Mangomundi 4 - Final.dc.html`. Todo está inline y es literal.

---

## A · Tipografía · es el ajuste que más cambia la página

Hoy el sitio carga **Sora + Manrope + Rubik 700**. Falta la tipografía de titulares y cifras del diseño: **Bricolage Grotesque**. Sora se da de baja.

| Rol | Fuente | Uso |
| --- | --- | --- |
| Titulares y cifras | **Bricolage Grotesque** 700/800 | h1, h2, títulos de sección, el importe que recibe cada proveedor, las cifras de la banda oscura, el tipo de cambio del header |
| Interfaz | **Manrope** 400–800 | todo el resto: etiquetas, texto de fila, botones, párrafos |
| Marca | **Rubik** 700 + Italic 700 | **solo** el wordmark y el icono. Nunca en interfaz |
| — | ~~Sora~~ | retirar del proyecto |

```
Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800
```

Reglas que van con el cambio:

- Titulares grandes: `letter-spacing: -0.03em`; el h1 a `-0.035em`. Bricolage sin tracking negativo se ve suelta.
- **Toda cifra** —importes, tasas, comisiones, deltas— con `font-variant-numeric: tabular-nums`. Sin eso las columnas bailan al actualizar.
- Cifra grande de cada fila: 28px, peso 800, `line-height: 1.1`.

---

## B · Hero · falta el h1

La página abre directo en el buscador. Arriba tiene que ir, centrado, sobre fondo blanco:

- **h1** — «Compare exchange rates and transfer fees» · 44px, peso 800, `-0.035em`
- **Subtítulo** — «Who delivers more of your money? Real rates and total fees, side by side, updated every minute. No sign-up.» · 17px, `#6B5F55`

Es la pieza de SEO del rediseño: sin el h1 la página no compite por su término principal.

Falta también, a la derecha del conmutador Individual/Business: el enlace **«Exchanging currency inside one country? ↗»** · 13px, peso 700, `#C2410C`.

---

## C · Tabla de resultados · tres cambios de fondo

### C1 · Sacar la fila de encabezados

Hoy hay una fila «YOUR RESULTS · TOTAL FEE · EXCHANGE RATE · SPEED · RECIPIENT GETS» arriba de todo. Eso se elimina.

Cada métrica lleva **su etiqueta chica dentro de su propia fila**, encima del valor: 10,5px, peso 700, `letter-spacing:.06em`, mayúsculas, `#6B5F55`. Las cuatro son FEE · RATE · DELIVERY · PAYOUT, y THEY RECEIVE sobre la cifra grande.

Por qué: con encabezado, el ojo tiene que subir a la cabecera y volver por cada fila. Con la etiqueta en la fila, cada tarjeta se lee sola — y es lo que hace que funcione en mobile sin una tabla aparte.

Retícula de la fila: `224px | 1fr | 204px`. Las cuatro métricas van en el centro, en un grid de 4 columnas iguales.

### C2 · Los tres botones de orden

Hoy son cuatro pastillas chicas: «Smart · Receive · Speed · More criteria». Van reemplazadas por **tres botones grandes**, uno al lado del otro, ocupando el ancho de la columna de resultados:

| Etiqueta | Hint (arriba a la derecha) | Cifra | Sub |
| --- | --- | --- | --- |
| Recommended | Best balance | mejor importe | «DZD · TapTap Send» |
| Receive more | Highest payout | el máximo | «DZD · the max» |
| Fastest | Under 10 min | «Minutes» | el proveedor más rápido |

78px de alto mínimo, borde `1.5px #EE5B3E` + sombra en el activo, `1px #EBE3D9` en el resto. La cifra en Bricolage 20px peso 800.

La cifra es lo importante: un botón de orden que dice cuánto se gana al usarlo se toca; una pastilla que dice «Smart» no se toca. Los nombres actuales tampoco dicen nada — «Smart» no le promete nada a nadie.

«More criteria» ya no va acá: sus tres grupos viven en el rail izquierdo, que ya está hecho.

### C3 · El sello de precio

Hoy cada fila tiene dos cosas: una pastilla naranja «Estimated price — not verified for this route» y un «Estimated: 28 Jan 2026». Las dos se reemplazan por **una sola línea**, en el pie de la fila, sin fondo ni pastilla:

- Verificado: `⏱ Live · 28 Aug, 09:41` en `#1F7A5A`
- Estimado: `⏱ Estimated · 28 Aug, 09:41` en `#6B5F55`

11,5px, peso 600. Nada más. Una advertencia naranja en cada fila deja de ser una advertencia: se vuelve papel tapiz, y encima le pone un color de alarma a la mitad de la tabla.

### C4 · Detalles de la fila

- **Delta:** el formato es `−6,271 DZD vs best`, no `-6.271`. Sin «vs best» el número no se entiende. En el ganador va «the most we found», en verde.
- **Sponsored:** hoy hay una etiqueta verde «Sponsored offer» sobre casi todas las filas, arriba y con peso. Va al **pie de la fila**, junto al sello, como texto de 11,5px sin fondo: «Affiliate link». La neutralidad se declara una vez, arriba de la lista («Affiliate links are labelled. Ranking never depends on them.»), no seis veces con color.
- **Payout:** hoy los métodos aparecen como pastillas debajo del nombre del proveedor. Es una de las cuatro métricas: va en la columna PAYOUT, como texto («Bank», «Cash»), no como chips.
- **CTA:** «Go to TapTap Send ↗» — 44px de alto, lleno en el ganador, contorno en el resto.
- **Nombre + rating:** 15px peso 700, y debajo `★ 4.3 on Trustpilot · Regulated` en 11,5px. Sin cantidad de reseñas.

---

## D · Agente IA · las preguntas están truncadas

En el rail se ven chips cortados («Run a…», «Wha…», «Ho…»). Las preguntas sugeridas van **una por línea, a ancho completo**, con la flecha a la derecha:

```
Why does Wise win?              →
Break down the fees             →
Cash pickup in Algeria?         →
Report a missing route          →
```

Cada una: `padding 9px 11px`, radio 10px, fondo `rgba(255,255,255,.07)`, borde `rgba(255,255,255,.12)`, texto 12px peso 600 `#F1EBE4`. Arriba, la lectura del corredor en su propia caja. Abajo, el input libre y la línea «Answers come from the loaded comparison. It never favours a provider that pays us more.»

Media pregunta legible no invita a nada; el chip truncado hace que el agente parezca roto.

---

## E · Falta la sección «Today's routes, already priced»

No se construyó. Va **debajo del comparador cuando no hay búsqueda**, y es la que hace que la home tenga contenido indexable y precio visible sin que el usuario escriba nada.

Cuatro tarjetas en fila, solo de corredores **con tarifa exclusiva**, rotando en cada visita:

```
🇬🇧 GBP → 🇲🇽 MXN
[ EXCLUSIVE RATE ]
BEST OF 52 · 1,000 GBP
24,009 MXN            [logo]  +901 vs worst
```

Título: «Today's routes, already priced». Bajada: «Routes where a partner gives us an exclusive rate — rotating on every visit. Prices are the best of all providers, updated 2 min ago.» A la derecha, el chip verde «Rated 4.6 on Trustpilot».

---

## F · Banda oscura · las cifras

Hoy dice `2026 Founded · 150+ Countries · 100+ Currencies · 50+ Global providers`. Van estas cuatro:

```
150+  Countries
100+  Currencies
52    Providers        ← del conteo real, no escrito en el copy
4.6   on Trustpilot    ← en verde #4ADE80
```

«2026 Founded» sale: en una marca nueva, la fecha de fundación es un argumento en contra. Y el Trustpilot entra porque es el único dato de confianza de terceros que tenés.

---

## G · Banda «For business» · copy

Hoy: «Institutional & Partnership Inquiries», con dos tarjetas de tesorería. Es lenguaje de banco.

Va: **«Payroll or supplier payments? Different brokers, different rates.»** Bajada: «14 FX brokers quote settlement terms, minimum amounts and contract type. Same neutrality, applied to volume.» Botones: «Get business quotes» (relleno tinta) y «Talk to us» (contorno).

La foto a 300px a la izquierda, dentro de una tarjeta con borde y radio 20px, no flotando a la derecha.

---

## H · Widget

En la sección «mangomundi on your website» el preview muestra el estado vacío con «Select…». Debería mostrar **un resultado real** —es la demo del producto— y, sobre todo, el bloque de invitación al pie, que hoy no está:

```
48 more providers on mangomundi
Cash pickup, card payout, exclusive rates and the AI agent for this exact route.
[ Compare all 52 ↗ ]
```

Ese bloque es la razón de existir del widget. Sin él, el widget regala precio y no devuelve tráfico.

---

## Orden sugerido

1. **A · tipografía** — es un cambio de dos variables de fuente y transforma la página entera. Empezá acá.
2. **C1 + C3** — sacar la fila de encabezados y limpiar el sello. Cambia la densidad de la tabla más que cualquier otra cosa.
3. **C2** — los tres botones grandes.
4. **B** — el h1 y el enlace de cambio local.
5. **C4 + D** — detalles de fila y las preguntas del agente.
6. **F + G** — copy de las dos bandas. Media hora.
7. **E** — la sección de corredores exclusivos (la única pieza nueva de peso).
8. **H** — el widget.

Del 1 al 6 es CSS y copy: se puede hacer en una sesión y se ve en cada paso.
