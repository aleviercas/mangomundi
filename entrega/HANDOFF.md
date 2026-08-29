# Mangomundi — handoff de diseño a Claude Code

Rediseño de la home, el comparador, el modo Business y el widget, más la identidad de marca.
Repo: `aleviercas/mangomundi`, rama `main`. Copy en inglés: el diccionario EN de `src/lib/i18n.tsx` es la fuente de verdad.

## Archivos de diseño en este proyecto

| Archivo | Qué es |
| --- | --- |
| `Mangomundi 4 - Final.dc.html` | **La referencia a implementar.** Las cuatro pantallas dibujadas: home antes de comparar, home con resultados, modo Business, y mobile + widget |
| `Mangomundi 6 - Marca y assets.dc.html` | Las mesas de trabajo de las que salieron los PNG: favicons, tarjeta social, avatar y firma, cada uno a su tamaño de exportación |
| `Mangomundi 5 - Wordmark.dc.html` | Opcional. Cómo se llegó al logotipo: alternativas, especificación y usos incorrectos. Útil si alguien discute una decisión |
| `public/brand/` | Los archivos que van a producción: PNG, `signature.html`, `manifest.json` |
| `public/refs/` | Material histórico del proceso (el icono mm original, las referencias de logo). **No va al sitio** |

Un `.dc.html` es una página HTML normal: se abre con doble clic en cualquier navegador, sin servidor ni build. Abrila y mirá el markup — **cada color, tamaño, espaciado y radio está escrito inline y es literal**, así que se leen los valores exactos sin resolver ningún token ni variable.

---

## 1 · Identidad

**Tipografía de marca:** Rubik 700 minúsculas, tracking `-0.025em`.
**Wordmark:** «mango» en tinta + «mundi» en naranja; «ango» y «undi» en **Rubik Italic 700**. Las dos emes siempre rectas.

> Ojo: es cursiva *verdadera* (`font-style: italic` con la familia Italic cargada), no `transform: skewX()`. Si se aplican las dos, las colas quedan doblemente inclinadas.

**Icono:** una sola `m` de Rubik 700 partida por un hilo diagonal que nace en el vértice del valle —la muesca entre los dos lomos— y baja al mismo ángulo que la cursiva. Izquierda tinta, derecha naranja.

**Regla de tamaño:** bicolor solo de 18px para arriba. Por debajo, una tinta (`#241C16`), porque `#EE5B3E` sobre blanco da 3,4:1.
**Sobre fondo oscuro:** el naranja pasa a `#FF8A6B`.
**Bajo 24px:** va el sello (cuadro tinta, letra en negativo), nunca la eme suelta.

```
Tinta        #241C16
Mango        #EE5B3E
Mango claro  #FF8A6B   (solo sobre oscuro)
Arena        #F5EFE8
Papel        #FBF8F4
Verde ok     #1F7A5A
Texto sec.   #6B5F55   (mínimo para texto chico: 6,3:1)
Bordes       #EBE3D9 · #E5DCD1
```

Fuentes: **Rubik** (marca e interfaz de marca), **Bricolage Grotesque** (titulares y cifras), **Manrope** (texto de interfaz).

### Assets · `public/brand/`

| Archivo | Uso |
| --- | --- |
| `favicon-16.png`, `favicon-32.png`, `favicon-64.png` | pestaña; armar el `.ico` con los tres |
| `apple-touch-icon.png` (180) | iOS |
| `icon-512.png` | PWA / maskable |
| `og-card.png` (1200×630) | `og:image` y `twitter:image` |
| `avatar.png` (400×400) | perfiles sociales |
| `signature-logo.png` (528×104 @2x) | firma de correo, se muestra a 264×52 · **fondo blanco horneado** |
| `signature-logo-dark.png` (528×104 @2x) | la misma, sobre tinta, para clientes en modo oscuro |
| `signature.html` | firma lista para pegar en Gmail/Outlook, con `<picture>` |
| `manifest.json` | manifest de PWA |

```html
<link rel="icon" href="/brand/favicon-32.png" sizes="32x32">
<link rel="icon" href="/brand/favicon-16.png" sizes="16x16">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
<link rel="manifest" href="/brand/manifest.json">
<meta name="theme-color" content="#241C16">
<meta property="og:image" content="https://mangomundi.com/brand/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
```

Los PNG están renderizados con Rubik, que es lo que va a producción hasta que exista el SVG trazado. Cuando esté, se regeneran los mismos archivos con los mismos nombres y medidas.

### Nada de logos transparentes en correo

Un PNG con fondo transparente desaparece cuando el cliente pinta el mensaje en modo oscuro: las letras en tinta quedan sobre negro y ningún cliente de correo recolorea imágenes. Por eso los dos archivos de firma llevan el **fondo horneado** —blanco y tinta— y son rectángulos a sangre, sin esquinas redondeadas (una esquina redonda necesita transparencia y devuelve el problema). Apple Mail, Mail de iOS y Outlook para Mac eligen la variante oscura con `prefers-color-scheme` dentro de un `<picture>`; el resto se queda con la clara del `<img>`, que funciona siempre.

El favicon, el avatar y la tarjeta social ya llevan su fondo horneado, así que no tienen este problema.

### Assets legacy · dar de baja

Al publicar los nuevos, retirar del repo el icono **mm** de dos emes y `src/assets/mango-logo.svg`.

`public/brand/` contiene **solo** lo que va a producción. El material del proceso —el icono mm original y las dos referencias de logo que se exploraron— está separado en `public/refs/` y no se sube al sitio; existe porque los archivos de diseño 3 y 5 lo muestran a propósito, como registro de cómo se llegó al logo actual. La especificación es este documento y el bloque «La marca completa» del archivo 5.

---

## 2 · Arquitectura de la home

Cambio de fondo: **quién sos** (particular o empresa) y **qué querés hacer** (mandar afuera o cambiar divisa local) son dos preguntas distintas y se resuelven distinto.

- **Individual / Business** es un conmutador de dos opciones arriba del buscador, con Individual por defecto. Va **antes** de comparar porque el inventario de proveedores es otro: 52 proveedores retail contra 14 brokers. Al lado, en gris, la línea que lo hace visible: «52 providers · retail rates» ↔ «14 brokers · negotiated rates».
- **Cambio local** no es una pestaña: es un enlace discreto a la derecha del conmutador —«Exchanging currency inside one country? ↗»— que lleva a `/exchange`, con su propio buscador (país, tengo, quiero) y su forma de liquidación.

### Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | home + comparador retail |
| `/send/:from-:to` | ruta resuelta, p. ej. `/send/gb-mx` |
| `/exchange/:country/:from-:to` | cambio local, p. ej. `/exchange/ar/usd-ars` |
| `/business` | igual que la home con el conmutador en Business |

Son tres intenciones de búsqueda con volumen distinto («send money to mexico», «dólar hoy argentina», «fx broker for payroll»). Compartiendo una sola URL, Google indexa una y las otras dos no existen. El estado vive en la URL, no solo en React.

### Buscador

Dos campos unificados **país · moneda** (no cuatro campos separados) más importe y botón:

```
[ You send: 1,000 | 🇬🇧 United Kingdom · GBP ▾ ]  ⇄  [ They receive: 🇲🇽 Mexico · MXN ▾ ]  [ Compare ]
```

Cada campo abre un popover de dos paneles: países a la izquierda, monedas de ese país a la derecha. Elegir país preselecciona su moneda local; cambiar la moneda no toca el país. Debajo, chips con las monedas habituales de ese país + «All 100 ▾» — es el atajo para el 10% que quiere otra moneda sin abrir el popover.

En el estado inicial la moneda de destino está deshabilitada hasta que hay país: es la única dependencia real entre campos. País y moneda vienen geodetectados, así que se puede apretar Compare sin tocar nada.

### Titular · no tocar sin medir

`h1` = **«Compare exchange rates and transfer fees»** (conserva la keyword de `home.hero.titlePre` + `titleAccent` y suma «transfer fees»).
Subtítulo = «Who delivers more of your money? Real rates and total fees, side by side, updated every minute. No sign-up.»

El subtítulo **no** dice cuántos proveedores hay: ese número cambia y una cifra que envejece en el primer pliegue es una promesa rota. El conteo vive en la tabla («of 52 providers»), donde se actualiza con los datos.

Los otros dos titulares del repo se conservan tal cual —«3 steps to a better exchange rate», «Financial intelligence for every currency decision»—: ya están traducidos a 20 idiomas y reescribirlos cuesta 20 traducciones por título.

---

## 3 · Comparador · `src/sections/ComparatorSection.tsx`

### Rail izquierdo, 268px

En vertical y en este orden: **Filtros → Agente IA → Alerta de tasa → Trustpilot**.

El agente sale de `fixed right-0 top-1/2 z-[60]`. Ya no flota ni tapa filas: es una caja oscura en el rail, siempre visible. Dentro van la lectura del corredor, cuatro preguntas sugeridas —las mismas acciones locales que ya resuelve `AiCopilot.tsx`, cero tokens— y el input libre.

Filtros del rail, con conteo por opción:
- **Payout method** — Bank / Cash / Card / Broker
- **Exclusive offers** — «Exclusive rates only» (se eliminó «Hide sponsored offers»)
- **Rank by** — Trust / Fees / Rate

### Orden · tres botones grandes

Arriba de los resultados, ocupando el ancho de la columna, 78px de alto, cada uno con su cifra justificativa:

| Botón | Cifra | Sub |
| --- | --- | --- |
| Recommended | 24,009 | MXN · Wise |
| Receive more | 24,009 | MXN · the max |
| Fastest | Minutes | Remitly |

«Rank by» del rail reemplaza a estos tres mientras esté activo.

### Fila de resultado

Retícula fija `224px | 1fr | 204px`. Cada métrica lleva **su etiqueta chica en versalitas** encima del valor: FEE · RATE · DELIVERY · PAYOUT, y THEY RECEIVE sobre la cifra grande. Cifras siempre `font-variant-numeric: tabular-nums`.

- Ganador: borde `#EE5B3E`, badge y CTA lleno. El resto, borde `#EBE3D9` y CTA de contorno.
- Delta contra el mejor en cada fila: `−215 MXN vs best`.
- CTA dice a dónde lleva: «Go to Wise ↗».
- Pie de fila: **«Live · 28 Aug, 09:41»** o **«Estimated · 28 Aug, 09:41»** — el aviso largo «not verified for this exact route» se reemplaza por eso. Al lado, la nota del proveedor y «Fee breakdown» a la derecha.

### Captación a Business

Debajo de los resultados, cuando el importe supera 25.000: «Sending 25,000 GBP or more? Business brokers quote negotiated rates above 10,000 — usually 0.3–0.7% better than retail» + «See business quotes ↗». **Ofrece, no cambia el modo solo.**

---

## 4 · Modo Business · `src/components/RfqTerminal.tsx`

Con el conmutador en Business cambia el inventario, el formulario y el output.

Formulario: importe · destino · **tipo de contrato** (Spot / Forward / Option) · **frecuencia** (One-off / Monthly / Quarterly) · «Request». Cada campo con su etiqueta en versalitas arriba, dentro de su celda del grid.

Tabla de brokers: SPREAD · MINIMUM · SETTLEMENT · CONTRACTS, y a la derecha el ahorro estimado sobre el importe. Panel derecho «Your request» que acumula los brokers elegidos y termina en **un pedido de cotización, no en una tarifa**. Nota obligatoria: los spreads son indicativos; el precio vinculante llega en la cotización.

---

## 5 · Widget · `src/components/EmbedComparator.tsx`

360×540 **sin scroll y sin chevron**. Cuatro proveedores visibles: el ganador en tarjeta destacada y tres en lista compacta con su delta. Cierra con un bloque de invitación explícito —«48 more providers on mangomundi · cash pickup, card payout, exclusive rates and the AI agent for this exact route» + «Compare all 52 ↗»— y el «powered by» al pie.

---

## 6 · Fotografía

Las tres imágenes salen de `max-w-xs` (320px) al costado de secciones casi idénticas. Cada una pasa a tener un trabajo:

- `howitworks-person.jpg` → 470×340 junto a los tres pasos; en la pantalla de resultados, recortada a 104px como cabecera de la tarjeta de alertas.
- `about-coins-globe.jpg` → banda oscura a sangre detrás del manifiesto y las cifras, con degradado de 90°.
- `business-person.jpg` → banda «For business» y tarjeta «Rather talk to someone?» del modo Business.

**Ninguna aparece antes del primer resultado.** El producto es la tabla.

---

## 7 · Orden sugerido

1. Assets de marca + `<head>` (media hora, sin dependencias).
2. Wordmark e icono en `Header.tsx` y el footer.
3. Buscador: campos país·moneda y conmutador Individual/Business.
4. Comparador: rail izquierdo, tres botones de orden, etiquetas de fila, «Estimated · fecha».
5. Rutas `/send`, `/exchange`, `/business` con el estado en la URL.
6. Fotografía y secciones institucionales.
7. Widget.

## 8 · Lo que falta diseñar

- Estados de **carga**, **sin resultados** y **error** del comparador.
- La pantalla `/exchange` completa: acá están resueltos el modelo y el punto de entrada, no la pantalla.
- El **SVG trazado** del logo, con las dos costuras propias del manual de marca (terminales de las colas al ángulo del hilo; la unión «mango|mundi» con el mismo hilo). Hasta entonces, los PNG con Rubik son válidos en producción.

Ante una duda de medida, el `.dc.html` manda: está todo inline y es literal.
