# Cómo llevar esto al repo con Claude Code

Yo diseño y puedo **leer** `aleviercas/mangomundi`, pero no escribo en el repo: no hago commits ni abro pull requests. El puente es este paquete. Son quince minutos de preparación.

## 1 · Qué son estos archivos

Un **`.dc.html`** es una página HTML normal: doble clic y se abre en cualquier navegador, sin servidor ni build. No es código para copiar y pegar al repo — es el plano. Todo está escrito inline y con valores literales, así que se leen las medidas exactas sin resolver variables.

Del proyecto de diseño necesitás cuatro cosas:

```
HANDOFF.md                              la especificación, en palabras
Mangomundi 4 - Final.dc.html            el plano: las cuatro pantallas dibujadas
Mangomundi 6 - Marca y assets.dc.html   las mesas de trabajo de las que salieron los PNG
public/brand/                           los archivos que van al sitio
```

`Mangomundi 5 - Wordmark.dc.html` es opcional: explica por qué el logo es así, sirve si alguien discute una decisión. `public/refs/` es material del proceso y **no se sube**.

## 2 · Ponerlos en el repo

En tu copia local de mangomundi:

```bash
mkdir -p design public/brand
cp HANDOFF.md design/
cp "Mangomundi 4 - Final.dc.html" design/
cp "Mangomundi 6 - Marca y assets.dc.html" design/
cp -r brand/* public/brand/          # los PNG, signature.html, manifest.json
```

Los `.dc.html` van en `design/` para que Claude Code los lea y los pueda inspeccionar: **cada color, tamaño y espaciado está inline y es literal**, no hay tokens que resolver. En `public/brand/` solo entra lo que va al sitio.

## 3 · El prompt para arrancar

Abrí Claude Code en la raíz del repo y pegá esto:

> Leé `design/HANDOFF.md` completo antes de escribir código. Es la especificación de un rediseño de la home, el comparador, el modo Business y el widget, más una identidad de marca nueva.
>
> La referencia visual es `design/Mangomundi 4 - Final.dc.html`: abrilo y leé el markup. Cada valor está inline y es literal — copiá los valores exactos, no los aproximes ni los conviertas a tokens propios.
>
> Antes de tocar nada, explorá `src/` y decime en qué archivos vive cada cosa que el handoff pide cambiar, y qué te parece riesgoso. No empieces a implementar hasta que te lo confirme.
>
> Después vamos por el orden del punto 7 del handoff, un paso por vez, un commit por paso. Respetá lo que ya existe: el diccionario de `src/lib/i18n.tsx` es la fuente de verdad del copy, y todo texto nuevo entra ahí, en inglés, con su clave.

Ese último párrafo importa: sin él, Claude Code tiende a hacer los siete pasos de una y termina con un diff imposible de revisar.

## 4 · Los siete pasos, uno por uno

El orden del handoff está pensado para que cada paso se pueda mirar en el navegador antes de seguir:

1. Assets de marca y `<head>` — media hora, sin dependencias, y ya ves el favicon nuevo.
2. Wordmark e icono en `Header.tsx` y el footer.
3. Buscador: campos país·moneda y conmutador Individual/Business.
4. Comparador: rail izquierdo, tres botones de orden, etiquetas de fila, «Estimated · fecha».
5. Rutas `/send`, `/exchange`, `/business` con el estado en la URL.
6. Fotografía y secciones institucionales.
7. Widget.

Del 1 al 2 es cosmético y de bajo riesgo. El 3 y el 5 son los que tocan lógica: ahí conviene ir más despacio y revisar el diff.

Para cada paso alcanza con:

> Hacé el paso N. Cuando termines, mostrame qué archivos tocaste y por qué.

## 5 · Cuando algo no cierre

Dos reglas que ahorran vueltas:

- **Ante una duda de medida, el `.dc.html` manda.** Si Claude Code propone «un espaciado más armónico» o «un color del sistema», pedile el valor del archivo de diseño.
- **Si el handoff y el repo se contradicen**, no adivines: es una decisión de producto. Anotala y me la traés — probablemente sea algo que no vimos.

## 6 · Lo que todavía no está diseñado

No se lo pidas a Claude Code, porque lo va a inventar:

- Estados de **carga**, **sin resultados** y **error** del comparador.
- La pantalla `/exchange` completa — está resuelto el modelo y el punto de entrada, no la pantalla.
- El **SVG trazado** del logo. Hasta que exista, los PNG con Rubik son válidos en producción.

Cuando quieras, los diseño acá y te paso el mismo tipo de paquete.
