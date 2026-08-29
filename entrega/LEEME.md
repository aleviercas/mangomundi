# Entrega · mangomundi

Todo lo que hace falta para implementar el rediseño. Está armado con la misma
estructura que tiene que quedar en el repo, así que se copia tal cual.

```
entrega/
├── HANDOFF.md              ← la especificación. Empezá por acá
├── COMO-IMPLEMENTAR.md     ← el paso a paso con Claude Code, y el prompt para pegar
├── design/                 → copiar a  <repo>/design/
│   ├── Mangomundi 4 - Final.dc.html          el plano: las cuatro pantallas
│   ├── Mangomundi 6 - Marca y assets.dc.html las mesas de trabajo de los assets
│   ├── Mangomundi 5 - Wordmark.dc.html       opcional: cómo se llegó al logo
│   ├── support.js                            hace falta para que abran bien
│   └── public/                               imágenes que usan los planos
└── public/brand/           → copiar a  <repo>/public/brand/
    ├── favicon-16.png · favicon-32.png · favicon-64.png
    ├── apple-touch-icon.png · icon-512.png
    ├── og-card.png · avatar.png
    ├── signature-logo.png · signature-logo-dark.png
    ├── signature.html
    └── manifest.json
```

## Los tres archivos `.dc.html`

Son **páginas HTML normales**: doble clic y se abren en cualquier navegador, sin
servidor ni instalación. No son código para pegar en el repo — son el plano.
Todo está escrito inline y con valores literales, así que Claude Code lee la
medida exacta sin resolver variables ni tokens.

Dejalos dentro de `design/` con la carpeta `public/` que los acompaña: si se
mueven sueltos, pierden las imágenes.

## En dos comandos

Desde la raíz de tu copia local de `mangomundi`:

```bash
cp -r entrega/design            ./design
cp -r entrega/public/brand      ./public/brand
cp    entrega/HANDOFF.md        ./design/
cp    entrega/COMO-IMPLEMENTAR.md ./design/
```

Después abrí Claude Code en la raíz del repo y seguí `COMO-IMPLEMENTAR.md`.

`design/` es documentación: puede quedar en el repo o vivir fuera, como prefieras.
`public/brand/` sí se publica — son los archivos que el sitio sirve.
