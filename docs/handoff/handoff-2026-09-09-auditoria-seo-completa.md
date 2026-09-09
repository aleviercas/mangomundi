# Auditoría SEO completa — mangomundi (rama `kayakclone`)

Fecha: 2026-09-09.
Alcance: auditoría técnica de SEO sobre el código real de la rama `kayakclone`
(`aleviercas/mangomundi`), leyendo `robots.txt`, `sitemap.xml`, cada `head()`
de ruta, `src/config/site.ts`, `src/lib/i18n.tsx` (SEO_META / ROUTE_SEO) y los
componentes que renderizan `<h1>`/`<img>`. No se corrió Lighthouse/PSI ni se
golpeó el sitio en producción — todo lo de acá está verificado leyendo el
código fuente, con cita de archivo y línea. Esto es una foto de un momento;
antes de tocar nada, re-leer los archivos citados por si ya cambiaron.

## Resumen ejecutivo

La base técnica es sólida — mejor que la de la mayoría de sitios de este
tamaño: canonical + hreflang correctos y consistentes (incluyendo el fix
reciente de "Duplicate, Google chose different canonical than user" en GSC),
JSON-LD real (Organization, WebSite, Article, FAQPage) en home y blog,
`display=optional` en fonts para no repetir el CLS/FOUT que ya se corrigió,
redirects para cada URL legacy en vez de 404s, y un `robots.txt` que bloquea
bots de entrenamiento de IA sin tocar Googlebot/Bingbot (decisión ya
documentada y correcta).

Dicho eso, encontré **7 problemas concretos y accionables**, de los cuales 3
son de prioridad alta porque le cuestan indexación/ranking real hoy mismo, no
solo "buenas prácticas":

1. **El sitemap le falta la mitad del sitio** — no lista `/about`,
   `/business`, `/widget` ni ninguna página `/send/:corridor` (§1).
2. **Los redirects de páginas legacy son 307 (temporales), no 301** — Google
   no consolida el link equity ni deja de re-chequear la URL vieja (§2).
3. **La meta description en español tiene un typo de encoding** ("Comparã"
   en vez de "Compará") — se muestra tal cual en el snippet de Google para
   toda página en español que no tenga su propia description (§3).

El resto son mejoras reales pero de impacto menor: `/business` no tiene SEO
localizado (§4), el `<h1>` es idéntico en home/business/cada corridor sin
mencionar el corredor específico (§5), las miniaturas del listado del blog
no llevan `alt` descriptivo (§6), y `llms.txt` quedó desactualizado respecto
a la arquitectura de páginas actual (§7).

---

## 1. Sitemap incompleto (prioridad alta)

**Archivo:** `src/routes/sitemap[.]xml.ts`

El sitemap generado dinámicamente sólo incluye:

```
/
/blog
/blog/:slug (uno por post publicado)
/legal
```

Rutas reales, indexables, con su propio `head()` (title/description/canonical/
hreflang) que **no están**:

- `/about` (`src/routes/about.tsx`) — página de misión/visión, tiene SEO propio.
- `/business` (`src/routes/business.tsx`) — landing de FX corporativo, tiene SEO propio.
- `/widget` (`src/routes/widget.tsx`) — landing del widget embebible, tiene SEO propio.
- **`/send/:corridor`** (`src/routes/send.$corridor.tsx`) — la página con más
  potencial de SEO de cola larga del sitio ("compare GBP to MXN exchange
  rates", etc.), con su propio title/description/canonical/hreflang dinámico
  por corredor. Hoy sólo es descubrible por Google si alguien la linkea — y
  el único lugar que la linkea es `TodaysRoutesSection.tsx` (home), que
  muestra **como máximo 4 corredores, rotando** (`getExclusiveCorridors()` en
  `src/lib/fx.functions.ts`). Cualquier corredor que no haya salido todavía en
  esa rotación no tiene ningún link interno apuntándole — es una página
  huérfana hasta que rote (si es que existe una lista finita de corredores
  soportados; si no, ni siquiera es descubrible).

Esto es al revés de lo que uno quiere en un sitio comparador: las páginas de
corredor son justamente las que deberían indexarse rápido y de forma
completa, porque son las que capturan búsquedas tipo "send money from UK to
Mexico" / "GBP to MXN exchange rate".

**Acción sugerida:** agregar al sitemap, en orden de esfuerzo:
- `/about`, `/business`, `/widget` — trivial, son 3 entradas estáticas más
  junto a `/legal`.
- `/send/:corridor` — requiere decidir qué universo de corredores publicar
  (todos los que tienen datos reales en `providers`/`fx_rates`, probablemente
  vía el mismo query que usa `getExclusiveCorridors()`/`fx.functions.ts` pero
  sin el límite de 4 ni la rotación). Antes de listarlos hay que resolver el
  punto de canonicalización de la nota del §1.1 de abajo.

### 1.1 — Nota para cuando se amplíe el sitemap de corredores

No confirmé en este pase si `/send/gb-mx` y `/send/mx-gb` (o `/send/gbp-mxn`
vs `/send/gb-mx`) resuelven a corredores "equivalentes" pero como URLs
distintas sin canonicalizar entre sí. Si es así, publicar todos los
corredores tal cual en el sitemap crearía contenido cuasi-duplicado. Antes de
generar la lista completa, revisar `parseCorridor()` en
`send.$corridor.tsx` y decidir una sola forma canónica por par de países.

---

## 2. Redirects de páginas legacy: 307 en vez de 301 (prioridad alta)

**Archivos:** `src/routes/pricing.tsx`, `features.tsx`, `platform.tsx`,
`insurance.tsx`, `contact.tsx`, `fx-tool.tsx`, `compare.tsx`.

Los siete usan `throw redirect({ to: "/..." })` sin `statusCode`. TanStack
Router devuelve **307 (Temporary Redirect)** por default cuando no se pasa
`statusCode` explícito (default desde la v1.51.1, confirmado en el changelog
del proyecto). Los comentarios en cada uno de estos archivos dejan clarísima
la intención real — "kept as a redirect... so any old bookmark, backlink, or
previously-indexed URL doesn't 404" — que es exactamente el caso de uso de un
**301 (Moved Permanently)**, no de un 307.

La diferencia no es cosmética: un 307 le dice a Google "esto es temporal, no
dejes de considerar la URL vieja" — no consolida autoridad/backlinks hacia el
destino ni "limpia" la URL vieja del índice con la misma confianza que un
301. Si alguna de estas rutas legacy (`/pricing`, `/features`, etc.) tiene
backlinks históricos o quedó indexada de una versión anterior del sitio
(Google Search Console lo confirmaría), ese valor no se está transfiriendo
del todo a `/`.

**Acción sugerida:** agregar `statusCode: 301` en cada uno de los 7
`redirect({...})`. Es un cambio de una línea por archivo, sin riesgo.

---

## 3. Typo de encoding en la meta description en español (prioridad alta)

**Archivo:** `src/lib/i18n.tsx`, línea 3491 (`SEO_META.es.description`):

> "**Comparã** tasas de cambio, comisiones, velocidad de transferencia y
> proveedores en tiempo real. Impulsado por IA neutral."

"Comparã" no es una palabra — todo el resto del sitio en español usa voseo
correcto ("Compará", "Encontrá" — ver `home.hero.headline` línea 1028 y
`home.hero.tagline` línea 1030 en el mismo archivo, ambos con tilde correcta
"á"). Este es casi seguro un problema de encoding puntual en esa única
entrada (una "á" que se guardó/copió mal y quedó como "ã").

Este string es el `<meta name="description">` real que Google muestra en el
snippet de resultados para **cualquier página en español que no tenga su
propia description** (fallback de `getRouteSeo()`, y directamente lo que usa
la home). Un typo visible ahí, en el elemento que más se lee antes de hacer
clic, es de las cosas más baratas de arreglar con más impacto directo en CTR.

**Acción sugerida:** cambiar `"Comparã tasas de cambio..."` por `"Compará
tasas de cambio..."` en esa línea. (No lo cambié yo mismo en este pase porque
esta ronda era sólo de auditoría — lo dejo listo para la próxima ronda de
implementación, a menos que prefieras que lo corrija ahora mismo.)

---

## 4. `/business` no tiene SEO localizado (prioridad media)

**Archivo:** `src/routes/business.tsx`.

Todas las páginas "institucionales" del sitio (`/about`, `/blog`, `/legal`,
`/widget`) resuelven su title/description vía `getRouteSeo(lang, path)`
(`src/lib/i18n.tsx`), que como mínimo cae a `SEO_META[lang]` (genérico pero
traducido) si no hay una entrada específica para esa ruta en ese idioma.
`/business` es la única página real del sitio que **no pasa por ese sistema
en absoluto** — tiene su title/description hardcodeados en inglés directo
dentro de `head()`:

```ts
const title = "Business FX — compare broker rates for high-volume transfers | mangomundi";
const description = "Corporate FX brokers quote negotiated rates above retail volume...";
```

Resultado: alguien que entra a `/business?lang=es` (o cualquiera de los
otros 19 idiomas) ve el resto del sitio en español pero el `<title>` de la
pestaña y el snippet de Google en inglés siempre, sin excepción.

**Acción sugerida:** agregar `"/business"` a `ROUTE_SEO_EN` (y a los mapas de
los idiomas que quieran tener copy específica) en `src/lib/i18n.tsx`, y en
`business.tsx` reemplazar el `title`/`description` hardcodeado por
`getRouteSeo(lang, "/business")` — mismo patrón que ya usa `about.tsx`.
Requiere pasar `lang` al loader de `business.tsx` (hoy sólo trae
`corridors`), calcado del loader de `about.tsx`.

---

## 5. El `<h1>` no menciona el corredor/audiencia de la página (prioridad media)

**Archivo:** `src/sections/HeroSection.tsx` línea 87, texto en
`src/lib/i18n.tsx` clave `home.hero.headline`.

`/`, `/business` y **cualquier** `/send/:corridor` renderizan el mismo
componente (`HomePageBody` → `HeroSection`) con el mismo `<h1>` fijo:

> "Compare exchange rates and transfer fees."

Mientras tanto, el `<title>` de cada `/send/:corridor` sí es específico y
dinámico ("Compare GBP to MXN exchange rates — mangomundi", ver
`send.$corridor.tsx`). Es decir: el `<title>`/meta description de una página
de corredor mencionan el par de monedas exacto, pero el encabezado principal
visible en la página — la señal on-page más fuerte de relevancia temática
después del title — no lo menciona en absoluto. Para una estrategia de SEO de
cola larga basada en corredores (que es exactamente lo que
`send.$corridor.tsx` ya está armado para hacer), esto es dejar sobre la mesa
la señal de relevancia más barata de agregar.

**Acción sugerida:** parametrizar `HeroSection` para aceptar un headline
opcional (con fallback al genérico actual) y que `send.$corridor.tsx` le pase
algo como "Compare {from} to {to} exchange rates" (mismos `parsed.from`/
`parsed.to` que ya calcula para el `<title>`). Mismo patrón aplicable a
`/business` si se quiere un headline propio en vez del genérico de home.

---

## 6. Miniaturas del listado del blog sin `alt` descriptivo (prioridad baja)

**Archivo:** `src/routes/blog.tsx` línea 114 vs. `src/routes/blog_.$slug.tsx`
línea 450.

En la página de un post individual, la imagen de portada lleva
`alt={post.title}` (correcto). En el **listado** de `/blog`, la misma imagen
de portada (`post.cover_url`) se renderiza con `alt=""` — tratándola como
puramente decorativa, cuando en realidad es la miniatura que identifica cada
post distinto en una grilla de varios posts.

Esto no es como los otros `alt=""` del sitio (`business-person.jpg`,
`howitworks-person.jpg`, los flags de `FlagIcon.tsx`) — esos sí son
genuinamente decorativos/redundantes con texto adyacente, y `alt=""` ahí es
lo correcto. El caso del listado del blog es distinto: es contenido, no
decoración.

**Acción sugerida:** en `src/routes/blog.tsx` línea 114, cambiar `alt=""` por
`alt={post.title}` (mismo patrón que ya usa `blog_.$slug.tsx`).

---

## 7. `llms.txt` desactualizado respecto a la arquitectura real de páginas (prioridad baja)

**Archivo:** `public/llms.txt`.

Describe `/about`, `/business` y el contacto como "secciones" que viven
dentro de la home ("The comparator, how-it-works, about, business, and
contact info all live here as sections") — eso era cierto antes de que
`/about` y `/business` se promovieran a páginas propias (ver los comentarios
de `design/AJUSTES-3.md`/`AJUSTES-4.md` citados en `about.tsx`). Tampoco
menciona `/widget` (página real, con su propio `head()`) ni `/send/:corridor`
como patrón de URL.

Nota aparte, no técnica pero vale dejarla escrita: `robots.txt` (mismo
directorio) bloquea explícitamente a `ChatGPT-User`, `OAI-SearchBot` y
`PerplexityBot` — es decir, ningún crawler de los principales motores de
respuesta con IA que hoy existen va a leer `llms.txt` en la práctica. Eso es
una decisión deliberada y ya documentada (ver el comment de
`robots.txt`: proteger datos de tarifas/corredores de scraping), no un bug —
pero significa que mantener `llms.txt` al día tiene, hoy, valor casi
exclusivamente simbólico/de buena práctica, no de tráfico real medible desde
esos crawlers. Vale la pena que quien decida esto lo tenga en cuenta al
priorizar si vale la pena esta actualización ahora o dejarla para más
adelante.

**Acción sugerida (baja prioridad, sin apuro):** actualizar la sección
"Pages" de `llms.txt` para reflejar `/about`, `/business` y `/widget` como
páginas propias, y mencionar el patrón `/send/{origen}-{destino}` para las
páginas de corredor.

---

## Lo que ya está bien (para no repetir trabajo en la próxima auditoría)

- **Canonical + hreflang:** `src/config/site.ts` (`selfCanonical`,
  `hreflangLinks`) resuelve correctamente el caso "en" (fallback → URL limpia,
  nunca `?lang=en`) que había generado el error de GSC "Duplicate, Google
  chose different canonical than user" — ya corregido y con el razonamiento
  documentado in-line.
- **JSON-LD real:** `Organization` + `WebSite` en home, `Article` +
  `FAQPage` (condicional a ≥2 pares de pregunta/respuesta reales) en cada
  post de blog.
- **`/embed` correctamente `noindex, nofollow`** — es un target de iframe,
  no una página para el usuario final, y está marcado como tal.
- **Todas las rutas legacy tienen redirect** (nunca 404) — sólo falta el
  `statusCode: 301` (§2).
- **Fuentes con `display=optional`** — evita el salto de fuente visible
  reportado, sin reintroducir CLS.
- **`width`/`height` explícitos en cada `<img>`** — protege el CLS
  (Core Web Vitals) del layout shift por imágenes sin dimensiones.
- **`robots.txt` bloquea bots de entrenamiento/scraping de IA sin tocar
  Googlebot/Bingbot** — decisión explícita, correcta, y no interfiere con
  SEO tradicional.
- **`sitemap.xml` reusa el mismo `hreflangLinks()` que cada página** — ya no
  hay una segunda implementación de alternates que pueda desincronizarse
  (ver el comment del propio archivo).

---

## Plan de acción priorizado

| # | Hallazgo | Prioridad | Esfuerzo | Archivo(s) |
|---|---|---|---|---|
| 1 | Sitemap sin `/about`, `/business`, `/widget`, `/send/:corridor` | Alta | Medio (bajo para las 3 estáticas, requiere decisión de canonicalización para corredores) | `src/routes/sitemap[.]xml.ts` |
| 2 | Redirects legacy en 307 en vez de 301 | Alta | Bajo (1 línea × 7 archivos) | `pricing.tsx`, `features.tsx`, `platform.tsx`, `insurance.tsx`, `contact.tsx`, `fx-tool.tsx`, `compare.tsx` |
| 3 | Typo "Comparã" en meta description ES | Alta | Trivial (1 línea) | `src/lib/i18n.tsx:3491` |
| 4 | `/business` sin SEO localizado (title/description fijos en inglés) | Media | Bajo-Medio | `business.tsx`, `i18n.tsx` |
| 5 | `<h1>` genérico, no menciona corredor/audiencia | Media | Bajo-Medio | `HeroSection.tsx`, `send.$corridor.tsx`, `business.tsx` |
| 6 | `alt=""` en miniaturas del listado del blog | Baja | Trivial (1 línea) | `src/routes/blog.tsx:114` |
| 7 | `llms.txt` desactualizado | Baja | Bajo | `public/llms.txt` |

Ningún hallazgo de este pase requiere tocar la base de datos ni corre nada
contra producción — son todos cambios de código en la rama `kayakclone`,
verificables localmente con `bun run build` antes de subir.
