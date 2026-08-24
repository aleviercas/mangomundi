# ale — changelog de cambios (mangomundi)

Resumen de todo lo que se rediseñó/arregló en el sitio, por área. Todo lo listado
como **LIVE** está deployado y verificado en producción (mangomundi.com).

---

## 1. Home rediseñado — comparador integrado · LIVE

- El comparador dejó de vivir en `/compare` y pasó a estar **integrado en el home**.
  `/compare` y `/fx-tool` ahora **redirigen a `/`** (preservando `?lang`).
- Se consolidó en **un solo cuadro** (antes había dos: el widget del hero + un card
  "Advanced Search" separado). Hoy es un único box oscuro con inputs blancos.
- **Layout FROM → TO**: grupo "You send" (monto + moneda) + "From" (país) → flecha
  coral → "To" (país) + "You receive" (moneda) → botón Compare. Sin "Advanced
  options" (todo visible). El país deriva su moneda automáticamente.
- **Resultados en la misma página** con auto-scroll a "Your Results", encabezados de
  tabla oscuros, timestamp real por fila. Se eliminó el cuadro verde de métricas.
- **Banderas SVG** (paquete `flag-icons`) en país y moneda — las emoji no se veían en
  Windows. Se quitó la píldora Send/Receive (confundía el significado del monto).

## 2. Hero + navegación · LIVE

- Titular final: **"Smart currency exchange comparison"** (coral en "currency
  exchange"), una sola línea. Subtítulo con "…compared in real time with AI. Live
  rates, zero fees, no sign-up." Los trust points pasaron de píldoras a texto.
- **Header con navegación** real (How it works · About · Widget · Business · Contact ·
  Blog), fuente única `src/config/nav.ts` compartida por header y footer (mismo orden,
  sin "Home" — el logo cumple esa función). Nav a la derecha.

## 3. Widget embebible real ("powered by mangomundi") · LIVE

- Nuevo widget que **cualquiera puede embeber** en su sitio/app — el mismo cuadro del
  home dentro de un **iframe aislado**.
- Ruta **`/embed`** (sin header/footer, `noindex`) + **`public/widget.js`** (loader que
  inyecta el iframe con `data-currency`/`data-amount`/`data-lang`). Barra "powered by
  mangomundi" con el logo enlazado al sitio.
- La sección Widget del home muestra **preview en vivo + instrucciones reales**
  (tabs Script/iframe + botón Copy).

## 4. Secciones institucionales · LIVE

- Se separó **Business** (tesorería/partnerships) de **Contact** (email simple).
- Orden del home: comparador → How it works → About → Stats → Widget → Business →
  Contact → Blog.

## 5. How It Works reescrito · LIVE

- Los 4 pasos describían el flujo viejo (varias pantallas). Ahora reflejan el cuadro
  único: **Enter your transfer → Compare in real time → Ask the AI (optional) → Send
  with your provider**. Traducido a los 20 idiomas.

## 6. Agente IA / wizard self-serve · LIVE

- El wizard pasó de 4 botones a un **árbol completo self-serve** (responde local, sin
  gastar IA, y sin necesitar una comparación previa):
  **Run an example · What is mangomundi? · How to compare · Is it free? · Are you
  neutral? · Which providers? · How do I send money? · Break down the fees · Report a
  missing route.**
- "Run an example" **corre una comparación real** (guía al comparador sin IA). La
  grilla de preguntas **persiste** tras cada respuesta. Traducido a los 20 idiomas.

## 7. SEO — reescrito y arreglado en los 20 idiomas · LIVE

- 🐛 **Bug crítico corregido**: el `<head>` raíz tenía tags duplicados que forzaban el
  mismo título/descripción (inglés viejo) en **todas** las páginas e idiomas.
- **Títulos y descripciones por idioma reales** (`SEO_META` reescrito con el
  posicionamiento actual "Smart currency exchange comparison…") en los 20 idiomas. Se
  eliminó el código muerto (`SEO_META_TRANSLATED` / `UNIFIED_*`).
- 🐛 **og:image ahora es URL absoluta** (antes relativa → la tarjeta al compartir no
  renderizaba). + `og:image:width/height/alt`.
- 🐛 **`getInitialLang` ahora respeta `?lang=`** en el SSR → cada alternate hreflang
  sirve su propio título/descripción al crawler (verificado en/es/de/ja/ar).
- Copy institucional viejo ("decision engine / sourcing layer") refrescado.

## 8. Imágenes de marca · LIVE

- **og-image** nueva (wordmark, **1200×630**, de 1.4 MB → 643 KB) — la que se ve al
  compartir el link.
- **favicon.ico** + **apple-touch-icon** (180×180) + PNGs, con el ícono "mm", cableados
  en el `<head>`.

## 9. Blog — multilenguaje (EN PROGRESO)

- El mapeo de idiomas del blog ya cubre **los 20 idiomas** (cada nota nativa aparece en
  su mercado); SEO por nota (title/description/canonical/OG/hreflang/JSON-LD Article) ya
  estaba bien.
- **Objetivo pendiente**: traducir las **20 notas a los 20 idiomas** (viven en Supabase,
  no en el repo). Estado: **29/400** hechas (la nota `zhongxiaoqiye…` quedó en 6
  idiomas como muestra de calidad).
- **Herramientas dejadas listas**: `scripts/blog-backfill.ts` (automático, necesita una
  API key que funcione) y `scripts/blog-ingest.ts` (traducción a mano). **Cómo
  continuar: ver [`docs/blog-translation-runbook.md`](docs/blog-translation-runbook.md).**
- Bloqueo actual: OpenRouter sin crédito y la key de Gemini que se probó era un token
  efímero `AQ.` (no una `AIza…`). Con ~US$1 en OpenRouter o una `AIza…` real, el
  backfill termina todo en ~30 min.

---

## Infra / notas

- **i18n**: 20 idiomas. Fuente EN inline en `src/lib/i18n.tsx`; los otros 19 en
  `scripts/translations/<lang>.json` (sobreescriben). Gate estricto `bun run i18n:check`
  (prebuild) — toda clave EN debe existir no-vacía en los 20.
- **Deploy**: commit a `main` dispara Vercel. (Los deploys de esta serie usaron commits
  owner-authored porque Vercel bloquea commits de colaboradores sin acceso.)
- **Seguridad pendiente**: rotar las credenciales que pasaron por chat (PAT de GitHub,
  service-role de Supabase, keys de IA).
