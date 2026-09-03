# Ajustes · ronda 2 · fidelidad visual

La ronda 1 arregló la estructura. Esta es sobre **cómo se ve**: fondo, radios, bordes, iconos, copy de botones y qué se muestra en cada pantalla.

Método: abrí `design/Mangomundi 4 - Final.dc.html` al lado del sitio, en la misma ventana, y compará pantalla contra pantalla. Cada valor de este documento sale de ahí y está escrito inline. **Ante cualquier duda, manda el archivo de diseño.**

---

## 0 · Las constantes · esto primero

Casi todas las diferencias que se ven vienen de acá. Definilas una vez y muchas cosas se acomodan solas.

### Color

```
Papel      #FBF8F4   fondo de página y del área del comparador
Blanco     #FFFFFF   tarjetas, filas de resultado, bandas de contenido
Arena      #F5EFE8   fondos secundarios: chips, banda del blog, cuadro del swap
Tinta      #241C16   texto principal, botones oscuros, sello
Mango      #EE5B3E   CTA principal, borde del ganador, acentos
Mango osc. #C2410C   enlaces y texto de acento sobre claro
Mango clar.#FF8A6B   naranja SOLO sobre fondo oscuro
Secundario #6B5F55   texto de apoyo y etiquetas chicas
Tenue      #8A7C6E   notas al pie, texto de menor jerarquía
Verde      #1F7A5A   estados correctos, «Live», ahorro
Borde      #EBE3D9   bordes de tarjeta
Borde 2    #E5DCD1   bordes de campo de formulario
Oscuro     #120E0B   banda oscura a sangre
Oscuro 2   #1B1510   footer
```

El fondo de la página **no es blanco**: es `#FBF8F4`. Eso es lo que hace que las tarjetas blancas se lean como tarjetas. Hoy el sitio es blanco sobre blanco y por eso todo parece plano.

### Forma

```
Tarjetas y filas de resultado    radio 18px
Bandas y contenedores grandes    radio 20px
Botones y campos                 radio 12px
Chips y pastillas de filtro      radio 10px
Etiquetas chicas (badges)        radio 6px
```

### Borde y sombra

Nada de sombras difusas por todos lados. Solo dos:

- Tarjetas normales: `1px solid #EBE3D9`, **sin sombra**.
- Fila ganadora: `1.5px solid #EE5B3E` + `0 14px 34px -22px rgba(238,91,62,.55)`.
- Tarjeta de búsqueda: `1px solid #EBE3D9` + `0 14px 36px -22px rgba(60,40,30,.4)`.

### Iconografía

Trazo `2px`, `stroke-linecap:round`, `stroke-linejoin:round`, tamaño 13–18px según contexto, color heredado. Nada de iconos rellenos salvo la estrella de rating (`#F59E0B`) y la de Trustpilot (`#1F7A5A`). Si la librería actual trae iconos más gruesos o rellenos, ajustá el `stroke-width` a 2 y quitá los `fill`.

El icono de intercambio de monedas es específico: dos flechas horizontales opuestas, dentro de un cuadrado de **46×46 radio 12px con fondo `#F5EFE8` y trazo `#EE5B3E`**. Hoy se ve como un botón chico neutro.

---

## 1 · El botón dice «Compare»

- Sin resultados: **«Compare»** · 16px peso 700 · alto 58px · fondo `#EE5B3E` · radio 12px · sombra `0 10px 24px -12px rgba(238,91,62,.8)`.
- Con resultados: **«Update»** · alto 52px, misma forma.

Hoy dice «Search». No es lo mismo: buscar es lo que hacés en Google, comparar es el producto. Es además la palabra del h1.

Los campos del buscador van a **58px de alto** sin resultados y 52px con resultados, borde `1.5px #E5DCD1`, fondo `#fff`, radio 12px. El importe se escribe en **25px peso 700 tabular**; el país·moneda al lado, en 14,5px peso 700, separado por un borde vertical de 1px.

---

## 2 · La pantalla de resultados no muestra la home

Es la diferencia más grande. Cuando hay resultados, la página es **header + banda de búsqueda + rail y resultados + footer**. Nada más.

Hoy debajo de los resultados siguen apareciendo «3 steps», la banda oscura, el widget, negocio, contacto y blog. Eso convierte una pantalla de decisión en un folleto: el usuario que está comparando 52 precios no quiere leer el manifiesto.

Concretamente, cuando `hasResult` es verdadero:

- Se ocultan: How it works, banda oscura, Widget, For business, Contact, Blog.
- Se conserva: el footer completo.
- Se conserva también la línea de upsell a Business al pie de los resultados — esa sí pertenece a la decisión.

La banda de búsqueda con resultados se compacta: conmutador + tipo de cambio en una línea de 14px de padding vertical, los campos abajo, y debajo los chips de moneda alterna. Sin el h1 ni el subtítulo, que solo viven en la pantalla inicial.

---

## 3 · Anatomía de la fila · medidas exactas

```
┌─ tarjeta blanca · radio 18 · padding 16px 19px · borde 1px #EBE3D9 ───────┐
│  [logo 76×30]  Nombre 15px/700        FEE      RATE     DELIVERY  PAYOUT │
│                ★ 4.3 on Trustpilot    3.45     24.09    Hours     Bank   │
│                · Regulated 11,5px                                        │
│                                                     THEY RECEIVE         │
│                                                     24,009 MXN  ← 28px   │
│                                                     −215 MXN vs best     │
│                                                     [ Go to X ↗ ] 44px   │
├─ separador 1px #F5EFE8 · margen 10px ────────────────────────────────────┤
│  ⏱ Estimated · 28 Aug, 09:41  ·  Affiliate link          Fee breakdown   │
└──────────────────────────────────────────────────────────────────────────┘
```

- Retícula: `224px | 1fr | 204px`, `gap: 18px`, `align-items:center`.
- Las cuatro métricas: grid de 4 columnas iguales, `gap: 10px`. Etiqueta 10,5px/700/`.06em`/mayúsculas/`#6B5F55`; valor 14,5px/600 tabular.
- «THEY RECEIVE» misma etiqueta, cifra **Bricolage 28px peso 800**, `-0.03em`, y la moneda al lado en 12,5px peso 700 `#6B5F55`.
- Delta: 12px peso 700 tabular. Ganador: «the most we found» en `#1F7A5A`. Resto: `−X MXN vs best` en `#6B5F55`.
- Pie: 11,5px peso 600, con el reloj de 12px al lado del sello. «Fee breakdown» a la derecha en `#C2410C` peso 700.
- Separación entre filas: `gap: 11px`. No hay líneas divisorias entre tarjetas.

---

## 4 · Blog

Hoy es una sección grande con título de 40px, tres tarjetas altas con bajada larga y un botón «View all posts».

En el diseño es una **banda compacta al pie**, sobre fondo arena `#F5EFE8`, con borde superior:

- Título «From the blog» · 19px peso 800 · a la izquierda.
- «All articles ↗» · 13px peso 700 · a la derecha, a la misma altura.
- Tres tarjetas blancas, radio 14px, padding 15px 17px, con **solo dos elementos**: la línea `26 AUG 2026 · 6 MIN` en 10,5px/700/mayúsculas/`#6B5F55`, y el título en Bricolage 16,5px peso 800, `-0.02em`. Sin bajada, sin «Read more».

El blog es SEO y prueba de vida, no la mitad de la home. Un título bien escrito ya dice si vale la pena entrar.

---

## 5 · Banda oscura

`#120E0B` a sangre, con la foto `about-coins-globe.jpg` al 55% de opacidad alineada a la derecha, y encima un degradado `linear-gradient(90deg,#120E0B 12%,rgba(18,14,11,.82) 46%,rgba(18,14,11,.25) 100%)`.

Retícula `1fr 340px`: a la izquierda el texto, a la derecha las **cuatro cifras en dos columnas**, cada una en un cuadro de `rgba(255,255,255,.08)` con borde `rgba(255,255,255,.14)`, radio 14px, padding 14px. Cifra en Bricolage 26px peso 800.

Los dos botones: «Read our method» en `#EE5B3E` y «About us» con borde `1.5px rgba(255,255,255,.28)`, los dos de 44px y radio 12px.

---

## 6 · Rail izquierdo · detalles

- Ancho **268px**, `gap: 13px` entre las cuatro tarjetas.
- Filtros: tarjeta blanca radio 18px. Cada opción es una fila de 38px, radio 10px, con el conteo alineado a la derecha en 11,5px `#8A7C6E`. Activa: borde `1.5px #241C16` + fondo `#F5EFE8`. Inactiva: borde `1px #E5DCD1` + fondo blanco.
- «Exclusive rates only» activa va en naranja: borde `1.5px #EE5B3E`, fondo `#FDE9E4`, texto `#C2410C`.
- Separadores internos entre grupos: `1px solid #F2EBE3` con 13px arriba y abajo.
- Agente: fondo `#241C16`, radio 18px, padding 16px 17px.
- Alerta de tasa: foto de 104px arriba a sangre dentro de la tarjeta (`border-radius:18px; overflow:hidden`), y el contenido debajo con 13px 15px de padding.

---

## 7 · Header

- Alto **66px**, fondo blanco, borde inferior `1px #EBE3D9`, padding lateral 30px.
- Nav: 14px peso 600 `#6B5F55`, `gap: 26px`. Orden: How it works · For business · Widget · Blog · About.
- Selector de idioma: pastilla con borde `1px #E5DCD1`, radio 20px, padding 6px 12px, con la bandera y el código en 13px.
- Wordmark a la izquierda: icono 34px + palabra 24px, `gap: 11px`.

---

## Cómo verificar

Para cada pantalla, abrí el `.dc.html` y el sitio uno al lado del otro al mismo ancho. Si algo se ve distinto y no está en esta lista, **el archivo de diseño manda**: inspeccioná el elemento ahí y copiá el valor.

Tres preguntas que resuelven la mayoría de las diferencias que quedan:

1. ¿El fondo de esta zona es `#FBF8F4` o blanco?
2. ¿Este radio es 18, 12 o 10?
3. ¿Este texto chico es 10,5px en mayúsculas con `.06em`, o es texto normal?
