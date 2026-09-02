# Ajustes · ronda 3 · las píldoras de monedas y las páginas de confianza

Dos cosas que se definieron en el diseño y no llegaron al código. La primera es una pieza de la arquitectura del comparador, no un adorno. La segunda es la razón de ser de dos botones que hoy no llevan a ningún lado.

---

## A · Las píldoras de monedas

Verifiqué el branch: no existe nada. Falta la mitad de cómo resolvimos el buscador.

### Por qué existen

El campo unificado **«United Kingdom · GBP»** resuelve el 90% de los casos con dos controles en vez de cuatro. Pero deja un caso afuera: quien quiere mandar **EUR desde Reino Unido**, o que le paguen en **USD en México**. Sin las píldoras, ese usuario tiene que abrir el popover, ir al panel de monedas y buscar — justo el paso que el campo unificado venía a eliminar.

Las píldoras son el atajo: **cambian solo la moneda, nunca el país**. Es lo que hace que país y moneda estén desacoplados sin mostrar cuatro campos.

### Estado inicial · sin resultados

Debajo de la tarjeta de búsqueda, en una sola fila que envuelve:

```
Send in another currency   [GBP]  [EUR]  [USD]  [All 100 ▾]
·  the destination currency unlocks once you pick a country
```

- Etiqueta: 12px peso 700 `#6B5F55`.
- Píldora: alto 32px, padding lateral 12px, radio 9px, 12,5px.
  - **Activa** — borde `1.5px #241C16`, fondo `#F5EFE8`, texto `#241C16`, peso 700.
  - **Inactiva** — borde `1px #E5DCD1`, fondo `#fff`, texto `#5C5147`, peso 600.
  - **«All 100 ▾»** — borde `1px dashed #DCD1C4`, sin fondo, texto `#6B5F55`. Abre el panel completo de monedas.
- La nota final en 12px `#8A7C6E`.

Las monedas que se ofrecen son **las plausibles del país elegido**, no una lista fija: su moneda local primero y después las que circulan ahí de hecho. Reino Unido: GBP, EUR, USD. México: MXN, USD. Argentina: ARS, USD, EUR. Tres o cuatro como máximo — pasado eso, «All 100».

### Estado con resultados

La fila pasa al lado de destino, porque ahí la pregunta ya no es en qué mandás sino en qué cobran:

```
Receive in another currency   [MXN]  [USD]  [All 100 ▾]        Exchanging currency inside one country? ↗
```

Mismas medidas, 30px de alto en vez de 32. El enlace de cambio local va a la derecha de la misma fila, 12,5px peso 700 `#C2410C`.

### Reglas de comportamiento

1. Elegir un **país** preselecciona su moneda local y reconstruye las píldoras de ese lado.
2. Tocar una **píldora** cambia la moneda y **no toca el país**.
3. La píldora activa siempre refleja lo que muestra el campo unificado, y al revés: son el mismo estado, dos controles.
4. Mientras no haya país de destino, la fila de destino está **deshabilitada** con la nota que lo explica. Es la única dependencia real entre campos.
5. Cambiar de moneda dispara la comparación igual que cambiar de país — no hace falta volver a apretar el botón.

---

## B · Las páginas de confianza

En la banda oscura agregué dos botones: **«Read our method»** y **«About us»**. No eran decorativos: la banda afirma que las comisiones existen y que nunca cambian el ranking, y una afirmación así necesita dónde comprobarse. Se decidió que eso vive en **páginas propias**, no en un acordeón ni en un modal — porque son las páginas que un periodista, un partner o un usuario desconfiado va a linkear, y necesitan URL.

Hoy «Read our method» no lleva a ningún lado. **Regla: ningún botón sin destino.** Se resuelve creando las páginas, no borrando los botones.

### Las dos páginas

**`/about`** — la que ya existe como sección en la home, promovida a página. El manifiesto, las cifras y el equipo si lo hay. La sección de la home se queda como está y su botón apunta acá.

**`/how-we-make-money`** — la más importante y la que no existe. No hay que escribirla de cero: el texto ya está en el repo, repartido en las claves legales y de descargo de `i18n.tsx`. Se trata de juntarlo en una página que responda cuatro preguntas, en este orden:

1. **Cómo se gana el dinero.** Algunos proveedores pagan una comisión cuando abrís una cuenta desde mangomundi.
2. **Qué no cambia esa comisión.** El orden de la tabla. Explicar que el ranking sale de tasa, comisión total y tiempo de entrega, y que la comisión no entra en el cálculo.
3. **Cómo se marca.** Todo enlace de afiliado dice «Affiliate link» al pie de su fila.
4. **De dónde salen los precios.** Datos públicos de cada proveedor, con qué frecuencia se actualizan, y por qué algunas filas dicen «Estimated» en vez de «Live».

El punto 4 es el que convierte la página en algo útil: es la explicación del sello que aparece en cada fila.

### Dónde se enlaza

La misma página se referencia desde tres lugares que ya existen en el diseño:

| Lugar | Texto del enlace |
| --- | --- |
| Banda oscura | «Read our method» |
| Rail izquierdo, tarjeta de Trustpilot | «How we make money» |
| Footer, columna Company | «How we make money» |

### El mapa de páginas completo

Para que quede en un solo lugar, esto es lo que el diseño asume que existe:

```
/                          home + comparador retail
/send/:from-:to            ruta resuelta            ✔ hecho
/business                  conmutador en Business   ✔ hecho, falta el enlace en el nav
/exchange/...              cambio local             ✖ pantalla sin diseñar
/about                     manifiesto               ← promover la sección de la home
/how-we-make-money         transparencia            ← nueva, con texto que ya existe
/widget                    embed                    ✔
/blog, /blog/:slug         ✔
/terms /privacy /risk      ✔
```

Nav del header: **How it works · For business · Widget · Blog · About**. Hoy «For business» no apunta a `/business` — es un arreglo de una línea.

Footer en tres columnas:

- **Product** — Comparator · Local exchange · Widget · Rate alerts
- **Company** — About · For business · How we make money · Contact
- **Legal** — Terms · Privacy · Risk notice

Mientras `/exchange` no exista, «Local exchange» sale del footer y el enlace del comparador se oculta. Un enlace muerto cuesta más credibilidad que una función que todavía no anunciás.
