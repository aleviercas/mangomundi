# Ajustes · ronda 4 · dónde vive cada contenido

Decisiones de ubicación. Nada de esto es texto nuevo: es contenido que ya existe y hay que mover al lugar donde hace su trabajo.

---

## 1 · `/about` · misión y visión

La página propia se arma con el **about original**: misión, visión, por qué existe mangomundi, el origen. Ese texto ya está escrito y hoy vive comprimido en la home.

Lo que **no** va acá: las cifras de cobertura. Una página de misión que abre con números se lee como un pitch de inversores; el usuario que entra a `/about` quiere saber quién está del otro lado, no cuántos países cubrís.

Estructura sugerida, con lo que ya existe:

1. Titular de misión — el que ya usa la sección actual.
2. El texto de visión, en dos o tres párrafos.
3. Cómo funciona el negocio en una línea, con enlace a `/how-we-make-money`.
4. Contacto al pie.

En la home, la sección se queda: es el resumen, y su botón «About us» lleva a esta página.

---

## 2 · La banda oscura se queda con el market coverage

Confirmado: las cifras de cobertura viven en **«Neutral by design»**, la banda oscura de la home. Es su lugar natural — la banda hace una afirmación de neutralidad y las cifras son la prueba de escala que la respalda.

```
150+  Countries
100+  Currencies
52    Providers        ← del conteo real
4.6   on Trustpilot
```

Nada más en esa banda: el texto de neutralidad a la izquierda, los cuatro cuadros a la derecha, y los dos botones. No se le agregan cifras nuevas con el tiempo — cuatro es el máximo que se lee de un vistazo.

---

## 3 · Treasury Operations y FX & Payment Partnerships van a `/business`

**No van en «Read our method».** Esa página es la de transparencia: explica cómo se gana el dinero y por qué eso no mueve el ranking. Meterle dos bloques de venta institucional la contamina — el lector llega buscando una respuesta incómoda y se encuentra con una propuesta comercial. Es exactamente la señal contraria a la que la página tiene que dar.

Su lugar es **`/business`**, debajo del formulario de cotización, como respuesta a «¿esto es para mí?»:

```
/business
├─ Conmutador en Business + formulario de cotización
├─ Tabla de brokers                    ← pendiente de datos
├─ "Two ways we work with companies"
│   ├─ Treasury Operations
│   └─ FX & Payment Partnerships
└─ Contacto directo del equipo de negocio
```

Las dos tarjetas van tal cual están escritas, en una fila de dos columnas, con el mismo tratamiento visual que el resto: fondo blanco, borde `1px #EBE3D9`, radio 18px, título 16,5px peso 800 y texto 14px `#6B5F55`.

El orden importa: primero la herramienta que resuelve algo hoy (la cotización), después a quién le sirve. Al revés, la página se lee como un folleto y el formulario queda escondido.

### La banda de negocio de la home se simplifica

Con las dos tarjetas mudadas, en la home queda solo el gancho:

- Titular: «Payroll or supplier payments? Different brokers, different rates.»
- Bajada: «14 FX brokers quote settlement terms, minimum amounts and contract type. Same neutrality, applied to volume.»
- Botones: «Get business quotes» → `/business` · «Talk to us» → contacto.
- Foto a 300px a la izquierda, dentro de la tarjeta.

Una banda de home tiene que hacer una sola pregunta y ofrecer un solo camino. El detalle de a quién le sirve se lee después de hacer clic.

---

## 4 · Resumen del reparto

| Contenido | Dónde vive ahora |
| --- | --- |
| Misión y visión (about original) | `/about` — página propia |
| Resumen de neutralidad + market coverage | Banda oscura de la home |
| Treasury Operations · FX & Payment Partnerships | `/business`, debajo del formulario |
| Gancho de negocio (titular + 2 botones) | Banda de negocio de la home |
| Comisiones, ranking, origen de los precios, sello Live/Estimated | `/how-we-make-money` |

La regla que ordena todo esto: **cada página responde una sola pregunta**. `/about` responde «quiénes son», `/business` responde «sirve para mi empresa», `/how-we-make-money` responde «por qué te creo». Cuando una página responde dos, la segunda no se lee.
