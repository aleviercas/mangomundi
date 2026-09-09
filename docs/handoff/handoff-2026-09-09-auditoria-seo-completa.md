# Auditoría SEO completa — mangomundi (rama `kayakclone`)

Fecha: 2026-09-09.
Alcance: auditoría técnica de SEO sobre el código real de la rama `kayakclone`
(`aleviercas/mangomundi`), leyendo `robots.txt`, `sitemap.xml`, cada `head()`
de ruta, `src/config/site.ts`, `src/lib/i18n.tsx` (SEO_META / ROUTE_SEO) y los
componentes que renderizan `<h1>`/`<img>`, más un mapeo completo de todos los
links internos (`to="..."`) de `src/` y una serie de consultas de
**solo lectura** contra la base real de Supabase (proyecto `mangomundi`,
`ttqalbexpquzobrdyvgx`) para verificar con datos reales dos hipótesis que
de otra forma hubieran quedado como especulación. No se corrió Lighthouse/PSI
ni se golpeó el sitio en producción — todo lo de acá está verificado leyendo
el código fuente o consultando la base directamente, con cita de archivo y
línea, o de tabla/columna. Esto es una foto de un momento; antes de tocar
nada, re-leer los archivos citados por si ya cambiaron.

## Resumen ejecutivo

La base técnica es sólida — mejor que la de la mayoría de sitios de este
tamaño: canonical + hreflang correctos y consistentes (incluyendo el fix
reciente de "Duplicate, Google chose different canonical than user" en GSC),
JSON-LD real (Organization, WebSite, Article, FAQPage) en home y blog,
`display=optional` en fonts para no repetir el CLS/FOUT que ya se corrigió,
redirects para cada URL legacy en vez de 404s, y un `robots.txt` que bloquea
bots de entrenamiento de IA sin tocar Googlebot/Bingbot (decisión ya
documentada y correcta).

Dicho eso, encontré **14 puntos concretos y accionables** a lo largo de tres
pasadas. El más importante, con diferencia, no es un bug puntual sino un
problema de arquitectura (§14): **la home y `/business` nunca navegan hacia
`/send/:corridor`**, que es la única página del sitio realmente construida
para SEO por corredor — están desconectadas entre sí, así que la inmensa
mayoría de comparaciones reales que la gente hace nunca generan una URL
indexable propia. Después de eso, 4 más son de prioridad alta porque le
cuestan indexación/ranking real hoy mismo, no solo "buenas prácticas":

1. **El sitemap le falta la mitad del sitio** — no lista `/about`,
   `/business`, `/widget` ni ninguna página `/send/:corridor` (§1).
2. **Los redirects de páginas legacy son 307 (temporales), no 301** — Google
   no consolida el link equity ni deja de re-chequear la URL vieja (§2).
3. **La meta description en español tiene un typo de encoding** ("Comparã"
   en vez de "Compará") — se muestra tal cual en el snippet de Google para
   toda página en español que no tenga su propia description (§3).
4. **`/send/:corridor` genera contenido 100% idéntico bajo 2-3 URLs
   distintas** (código de país vs. de moneda, y mayúsculas vs. minúsculas),
   y cada una se autocanonicaliza en vez de apuntar a una sola forma
   canónica (§13).
5. **La home y `/business` nunca llevan a `/send/:corridor`** — cada
   comparación real queda atrapada en parámetros de query sobre `/` o
   `/business`, que se autocanonicalizan hacia la página vacía. La página
   que sí está armada para indexar por corredor existe, funciona, y no
   recibe tráfico real del flujo de búsqueda (§14).

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

## Segunda pasada (mismo día) — páginas huérfanas y contenido duplicado

A pedido explícito de Ale, esta segunda pasada se enfocó en una pregunta
puntual: ¿quedaron páginas sin uso que estén afectando el SEO? Metodología:
un mapeo completo de todos los `to="..."` de todo `src/` (para saber, con
certeza, qué rutas están genuinamente linkeadas desde algún lado del sitio),
más una consulta de solo-lectura contra la base real de Supabase
(`mangomundi`, proyecto `ttqalbexpquzobrdyvgx`) para verificar una hipótesis
sobre contenido duplicado del blog. Nada de esto tocó código ni datos —todo
lectura.

### 8. Confirmado: 7 rutas sin ningún link interno (prioridad — ya cubierta en §2)

Grep de cada `to="/..."` en todo `src/**/*.tsx` y `src/**/*.ts` da como único
set de rutas genuinamente linkeadas desde algún lado del sitio:

```
/, /about, /blog, /blog/$slug, /business, /legal, /send/$corridor, /widget
```

`/compare`, `/pricing`, `/features`, `/platform`, `/insurance`, `/contact` y
`/fx-tool` no aparecen ni una vez como destino de un `<Link>` en ningún
componente. Esto no es nuevo — ya estaban señaladas en §2 por el tema
307/301 — pero ahora está confirmado con certeza que además de tener el
status code incorrecto, son genuinamente huérfanas: nada en el código les
apunta, sólo sobreviven como redirect para bookmarks/backlinks viejos.

### 9. `public/brand/signature.html` — página estática pública sin ningún link ni valor de SEO (prioridad baja)

Es una firma de email en HTML (para pegar en el cliente de correo), pero
vive dentro de `public/`, que es exactamente la carpeta que Vite copia tal
cual a la raíz del sitio servido. Eso la hace una página real, pública y
crawleable en `https://mangomundi.com/brand/signature.html` — sin un solo
link interno, sin contenido relevante para búsqueda. Bajo riesgo real (no
va a rankear ni a dañar nada), pero es candidata a bloquear vía
`robots.txt` (`Disallow: /brand/`) o simplemente sacarla de `public/` y
servirla de otra forma si todavía se usa para armar firmas.

### 10. `fo-verify.html` en la raíz del repo — probablemente ya no se sirve, pero hay que confirmarlo antes de tocar nada (prioridad baja)

Vive en la raíz del repo (no dentro de `public/`), y `vite.config.ts` no
pisa `publicDir` — con la config default de Vite, un archivo ahí **no**
debería llegar al build de producción. Coincide con el comentario de
"Option 1: meta tag" que ya vimos en `index.tsx` (verificación de FlexOffers
por meta tag, no por archivo) — probablemente es un resabio de cuando se
probó el método de verificación por archivo antes de decidirse por el meta
tag. No confirmé esto contra el deploy real de Vercel — antes de borrarlo,
alguien debería verificar que efectivamente no responde en producción (por
si hay algún `vercel.json`/build step que sí lo copie, o por si FlexOffers
todavía lo necesita).

### 11. `/admin/i18n-status` — bien protegida por `noindex`, pero sin defensa en profundidad en `robots.txt` (prioridad baja)

Ya tiene `<meta name="robots" content="noindex, nofollow">` en su `head()`
y no está linkeada desde ningún lado público — no es un problema de
indexación real. Lo único que le falta para estar "por las dudas" del todo
cubierta es que `robots.txt` no la excluye explícitamente (hoy sólo lista
disallows para bots de IA/scraping, nada para `/admin`). No es urgente:
un `noindex` bien puesto ya resuelve el 100% del riesgo de indexación para
cualquier crawler que respete la meta tag.

### 12. Descartado: contenido duplicado del blog por fallback de idioma

Antes de escribir esto pensé que podía haber un problema real: `getBlogPost`
(`src/lib/blog.functions.ts`) cae al contenido en inglés cuando no existe
traducción para el idioma pedido, y cada URL (`/blog/:slug?lang=xx`) se
autocanonicaliza a sí misma (no al inglés) — en teoría, esa combinación
podría generar N URLs con contenido idéntico, cada una insistiendo en que
*ella* es la canónica.

**Verificado contra la base real y descartado.** Consulta a
`blog_posts` (proyecto Supabase `mangomundi`): los 23 posts publicados
tienen sus 20 locales completos (460 filas, ninguna faltante), y comparé
`content_md` (hash + longitud) entre idiomas de un post al azar
(`comparar-proveedores-remesas-latinoamerica`): las 20 filas tienen hash
distinto y longitud distinta — son traducciones reales, no el mismo texto
en inglés repetido bajo otro `locale`. El fallback en el código es una red
de seguridad para el día que se publique un post sin traducir todavía, pero
hoy no se está usando en la práctica. Sin acción pendiente aquí — lo dejo
escrito para que la próxima auditoría no tenga que volver a chequearlo
mientras la cobertura de traducciones se mantenga en 20/20.

*(Nota aparte, no es un problema de SEO: al comparar las longitudes entre
idiomas de ese mismo post noté que francés/japonés/chino salen notablemente
más cortos — 2.100–2.960 caracteres — contra 8.000+ en inglés/español/
alemán/portugués/ruso/italiano. Puede ser sólo que esos idiomas son más
compactos por naturaleza, o puede ser que esas traducciones se hicieron con
menos detalle. No lo puedo distinguir sin leer el contenido real, y es un
tema de profundidad/calidad editorial, no técnico — lo señalo para quien
maneje el contenido, no como hallazgo de esta auditoría.)*

### 13. Confirmado y nuevo: `/send/:corridor` genera contenido 100% idéntico bajo varias URLs distintas, cada una autocanonicalizándose (prioridad alta)

Este es el hallazgo más importante de esta segunda pasada.

`parseCorridor()` (`src/routes/send.$corridor.tsx`) acepta tanto códigos de
país (`GB`, `MX`) como códigos de moneda (`GBP`, `MXN`) en cada mitad del
slug, vía `resolveRouteCode()` (`src/lib/countries.ts`). Para un país cuya
moneda no comparte con nadie más en el mapa (como Gran Bretaña/GBP o
México/MXN), **el código de país y el código de moneda resuelven al mismo
`origin`/`destination`**, vía `primaryCountryForCurrency()`:

- `/send/gb-mx` → `parseCorridor` → `{ origin: "GB", destination: "MX", from: "GBP", to: "MXN" }`
- `/send/gbp-mxn` → mismo resultado exacto: `{ origin: "GB", destination: "MX", from: "GBP", to: "MXN" }`

Página resultante: mismo `<title>`, misma `<meta name="description">`, mismo
`<h1>`, mismos resultados del comparador — **son la misma página**. Pero el
`canonical` de cada una se calcula así (línea 48 de `send.$corridor.tsx`):

```ts
const path = `/send/${params.corridor}`;   // el slug CRUDO de la URL, sin normalizar
const canonical = selfCanonical(path, match.search.lang);
```

Es decir, cada variante se autocanonicaliza a sí misma en vez de apuntar a
una única forma canónica del corredor. Y no es sólo la variante
país-vs-moneda: `parseCorridor` hace `.toLowerCase()` **para parsear**, pero
esa normalización nunca se propaga al `path` del canonical — así que
`/send/GB-MX` (mayúsculas) es una tercera URL distinta, con su propio
canonical autoreferenciado, para el mismo contenido exacto.

Esto no es hipotético — **ya está confirmado como comportamiento esperado
en el propio historial del proyecto**, sólo que evaluado como éxito de QA
en su momento, sin la lectura de SEO: `docs/handoff/handoff-2026-08-29-rediseno-mangomundi-4.md`
(línea ~291) documenta explícitamente que se probó
`/send/gb-mx`, `/send/gbp-mxn` y `/send/GB-MX` y "funcionando igual" — que
en ese momento se leyó como "el parseo es robusto", correctamente, pero es
exactamente la definición de contenido duplicado bajo URLs distintas vista
desde SEO.

**Impacto:** cualquier corredor cuyo país y moneda resuelvan al mismo lugar
(el caso común — GB/GBP, US/USD para USD-only si no hay ambigüedad, MX/MXN,
etc.) tiene como mínimo 3 URLs indexables con contenido idéntico y sin un
canonical real entre ellas. Si alguna vez se linkea internamente o
externamente con una ortografía distinta a la que usa
`TodaysRoutesSection.tsx` (que no confirmé cuál usa, país o moneda), Google
puede terminar indexando y compitiendo por ranking entre 2-3 URLs del sitio
para la misma búsqueda, en vez de consolidar señales en una sola.

*(No confirmé, y queda como pregunta abierta para cuando se toque este
código: si dos países distintos que comparten la misma moneda —por ejemplo,
varios países de la eurozona con EUR— producen o no contenido casi
idéntico entre sí más allá del código de país mostrado. Es una pregunta
relacionada pero más amplia que la de arriba, que sí quedó 100% confirmada
con el código y con el historial del proyecto.)*

**Acción sugerida (para cuando se implemente, no ahora):** normalizar el
`path` usado para el `canonical` a una única forma por corredor (por
ejemplo, siempre país-país en minúsculas, usando `parsed.origin`/
`parsed.destination` en vez de `params.corridor` crudo) — así todas las
variantes de ortografía de un mismo corredor declaran la misma URL como
canónica, sin necesidad de tocar el parseo ni las redirecciones existentes.

---

## Tercera pasada — ¿el comparador debería llevar a otra página al mostrar resultados? (prioridad alta, el hallazgo más importante de toda la auditoría)

Pregunta original de Ale: "cuando comparás y se muestran los resultados, ¿no
debería ser otra página? ¿como lo hace kayak?". Investigué el flujo
completo (home, `/business`, `/send/:corridor`, y el propio
`ComparatorSection.tsx`) para responder con evidencia, no con intuición.

### Cómo funciona hoy, en el código

El sitio tiene, sin saberlo del todo a sí mismo, **dos sistemas distintos
para lo mismo**, construidos en fases separadas y nunca conectados entre
sí:

**Fase A — `/` y `/business` (donde la gente realmente busca):**
`ComparatorSection.tsx` reporta su estado (moneda, monto, países,
segmento) hacia arriba, debounced 300ms, y tanto `index.tsx` como
`business.tsx` lo escriben a la URL así:

```ts
navigate({ search: (prev) => ({ ...prev, from, to, amount, origin, destination }), replace: true });
```

- `replace: true` → nunca se crea una entrada nueva en el historial del
  navegador. Buscás GBP→MXN, cambiás a EUR→ARS, cambiás el monto: todo
  pisa la misma entrada. **El botón "atrás" del navegador nunca te saca de
  `/`** — no hay "volver al buscador" porque nunca saliste de ahí.
- La ruta nunca cambia — sigue siendo `/` (o `/business`) sin importar qué
  tan específica sea la comparación.
- Y lo más importante para SEO: el `canonical` de `/` **ignora por
  completo** `from`/`to`/`amount`/`origin`/`destination` — siempre apunta a
  la `/` limpia (esto ya lo vimos como algo positivo en la primera pasada,
  para evitar miles de home duplicadas por combinación de parámetros — y
  sigue siendo correcto para ese propósito). Pero la consecuencia es que
  **cada comparación real que alguien hace en la home le está diciendo
  activamente a Google "ignorá esto, es la misma página de siempre"** — el
  contenido más específico y valioso (una comparación real GBP→MXN) queda
  con cero posibilidad de indexarse por sí mismo, para siempre.

**Fase B — `/send/:corridor` (la página que sí está armada para SEO):**
tiene todo lo que le falta a la Fase A — `<title>`/description/canonical
dinámicos por corredor, JSON-LD-ready, hreflang. El propio comentario del
código lo dice: *"Unlike '/' and '/business' (query-string sync), this
route's corridor lives in the PATH"*. Cambiar de país navega (con
`replace: true` también, pero cambiando efectivamente de ruta) a un
`/send/:corridor` **nuevo**:

```ts
const nextCorridor = `${q.sendingCountry.toLowerCase()}-${q.receivingCountry.toLowerCase()}`;
navigate({ to: "/send/$corridor", params: { corridor: nextCorridor }, replace: true });
```

(Dato interesante para el hallazgo §13: acá mismo se ve cuál es la única
forma "canónica" que el propio código genera siempre — país-país en
minúsculas. Es la pista más fuerte de cuál debería ser la única forma
válida del canonical de esa ruta.)

### El problema real: estos dos sistemas nunca se tocan entre sí

`/send/:corridor` existe, funciona, y tiene SEO propio — **pero nada en
`/` ni en `/business` navega ahí jamás**. Alguien que entra a la home,
busca "cuánto sale mandar plata de UK a México", completa el formulario y
ve resultados reales... se queda en `/?from=GBP&to=MXN&amount=1000&origin=GB&destination=MX`
para siempre. Nunca llega a `/send/gb-mx`, que es la única URL del sitio
diseñada para que ESA búsqueda específica pueda rankear en Google.

`/send/:corridor` sólo se visita hoy por:
- las 4 tarjetas rotativas de `TodaysRoutesSection.tsx` en la home, o
- un link compartido/bookmark directo, o
- (eventualmente) un post del blog que la mencione.

Es decir: la página con más potencial de SEO del sitio está construida y
funcionando, pero **desconectada del flujo real de búsqueda** — la
inmensa mayoría de comparaciones que la gente hace en la home nunca
generan una URL indexable propia.

Mismo problema, sin ninguna solución ni parcial, en `/business`: no existe
ningún equivalente de `/send/:corridor` para el segmento business —
`send.$corridor.tsx` hardcodea `segment: "retail"` siempre (ver comentario:
*"Amount/currency overrides aren't tracked here"*), así que hoy **no hay
ninguna URL indexable posible para una comparación de FX corporativo**, ni
siquiera construida y sin usar como el caso de `/`.

### Cómo lo hace kayak (el punto de comparación de Ale) y por qué importa

En kayak (y en cualquier comparador serio: Skyscanner, Google Flights,
Wise), buscar no actualiza parámetros sobre la misma página — **navega a
una URL de resultados real**, con su propio título, su propio contenido
indexable, bookmarkable, con historial de navegador coherente (289 el botón
atrás te devuelve al buscador, no te deja pegado en la página anterior de
resultados). Eso es exactamente lo que `/send/:corridor` ya hace bien — el
problema de mangomundi no es que le falte esa pieza, es que **la construyó
y la dejó sin conectar a la puerta de entrada real del sitio.**

### Cómo lo resolvería

No hace falta construir nada nuevo — hace falta conectar lo que ya existe,
en este orden (cada paso depende del anterior):

1. **Primero, arreglar §13** (normalizar el canonical de `/send/:corridor`
   a una sola forma — país-país en minúsculas, calcado de lo que el propio
   código ya usa para navegar entre corredores). Si no se arregla esto
   primero, conectar más tráfico a esa ruta multiplica el problema de
   contenido duplicado en vez de solucionarlo.
2. **Agregar soporte de `amount`/`segment` como query params en
   `send.$corridor.tsx`** — hoy los ignora por completo (siempre `amount:
   1000, segment: "retail"` fijos). Sin esto, llegar desde la home con un
   monto/segmento específico se perdería en el camino.
3. **En `index.tsx` (`/`): cuando `sendingCountry` y `receivingCountry`
   ya forman un corredor completo**, el `handleQueryChange` debería hacer
   `navigate({ to: "/send/$corridor", params: { corridor: "..." },
   search: { amount, segment, lang }, replace: false })` — con `replace:
   false` (a diferencia de todo lo demás en este sistema) **sólo para esa
   transición puntual** de `/` → `/send/:corridor`, así el botón atrás
   efectivamente te devuelve al buscador vacío, como en kayak. Una vez ahí,
   el propio `send.$corridor.tsx` ya sabe manejar todo lo que siga con su
   `replace: true` existente.
4. **Mismo cambio en `business.tsx`**, navegando a
   `/send/$corridor?segment=business` (una vez que `send.$corridor.tsx`
   sepa leer `segment` del punto 2).
5. **Sumar `/send/:corridor` al sitemap** (§1) — ahora con más razón, va a
   ser la puerta de entrada real de mucho más tráfico de búsqueda que hoy.
6. La home (`/`) y `/business` en su estado "sin corredor completo todavía"
   (buscando, sin haber elegido destino) quedan exactamente como están —
   ese es el comportamiento correcto de un formulario de búsqueda, no
   necesita URL propia ni indexación (kayak tampoco indexa "la home con el
   formulario a medio llenar").

### Lo que se confirmó al investigar más (ver "Cuarta pasada" más abajo)

- **Corredores sin datos reales**: confirmado y cuantificado — de ~59.000
  URLs armables por el selector de país, sólo 309 tienen datos propios en
  `fx_rates`. El resto cae a providers genéricos idénticos entre sí. **El
  filtro de sitemap del paso 5 debe limitarse a esos 309**, no es opcional.
- **La pregunta de la eurozona**: resuelta — no es un problema específico
  de compartir moneda, es el mismo fenómeno de arriba (el 99.5% de los
  corredores sin datos propios muestra providers idénticos sin importar el
  país). Confirmado con datos reales que los corredores CON fila propia sí
  son genuinamente distintos entre sí.
- **`/widget`**: confirmado, no aplica — ver más abajo.
- **`/widget` — confirmado, no aplica.** Es una página de documentación
  para desarrolladores (snippets de `<script>`/`<iframe>` para embeber el
  comparador en un sitio de terceros) — no pasa por el flujo de búsqueda
  en sí, así que este diagnóstico no le corresponde.

---

## Cuarta pasada — las dos preguntas abiertas, resueltas con datos reales

Ambas preguntas quedaron cerradas consultando el código y la base real de
Supabase (proyecto `mangomundi`, solo lectura). Terminaron siendo **la
misma causa raíz**, no dos problemas separados.

### ¿Puede `compareProviders` devolver cero resultados para algún corredor armable por URL?

**No, prácticamente nunca — pero esa no era la pregunta correcta.**

`eligibleProviders` (`src/lib/fx.functions.ts` línea ~794) incluye siempre,
sin excepción, a cualquier provider que no sea `is_corridor_specific`
(`if (!p.is_corridor_specific) return true;`). Consulté la base:

| segment | corridor-specific | genéricos (siempre elegibles) |
|---|---|---|
| retail | 17 | 6 + 7 ("both") = **13** |
| business | 0 | 6 + 7 ("both") = **13** |

O sea: **cualquier par de países válido va a mostrar como mínimo esos ~13
providers genéricos** — nunca una página en blanco. El riesgo real no es
"resultado vacío", es otro: **cuántas de esas páginas terminan siendo
contenido genérico casi idéntico entre sí**, y ahí sí hay algo concreto:

- `COUNTRY_BY_CODE` (`src/lib/countries.ts`) soporta **244 países reales**
  (los 251 territorios de `country-to-currency` menos 7 deshabitados). Eso
  da un espacio teórico de **~59.000 URLs armables** vía
  `/send/:origen-:destino` (244 × 243, sin contar mismo país).
- De ese universo, **sólo 309 corredores tienen datos reales y
  específicos** en `fx_rates` (consulta directa: `count(distinct
  sending_country || '-' || receiving_country) from fx_rates` → 309, con
  69 países de origen y 97 de destino distintos).
- Para cualquier corredor SIN fila propia en `fx_rates`, el precio que ve
  el usuario sale de `resolveTier()` (línea ~528) — que calcula
  `fee_percent`/`fee_fixed`/`spread_percent` en función de **sólo el
  monto**, sin leer el país de origen ni el de destino en ningún momento.

**Conclusión:** el 99.5% del espacio de URLs armable por el selector de
país (~58.700 de ~59.000) muestra exactamente los mismos ~13 providers con
exactamente los mismos números que cualquier otro corredor sin datos
propios que comparta la misma moneda — la única cosa que cambia entre
esas páginas es el nombre del país y la bandera. Es contenido genérico
plantillado a escala, el patrón clásico de "doorway pages" que Google
penaliza si se indexa masivamente. La respuesta a la pregunta original
("¿hay que filtrar antes de sumar corredores al sitemap?") es **sí, y por
mucho más margen del que pensaba** — de las decenas de miles de URLs
posibles, sólo unos cientos tienen contenido genuinamente único.

### ¿Dos países que comparten moneda (eurozona) generan contenido casi idéntico entre sí?

**Depende, y ahora sé exactamente de qué depende — es la misma causa raíz
de arriba, no un bug aparte de la eurozona.**

Primero confirmé que SÍ hay corredores reales donde dos o más países de la
eurozona tienen datos propios hacia el mismo destino (ej. Marruecos, con
filas propias desde BE/ES/FR/IT). Comparé los números fila por fila —
**son genuinamente distintos**, no una plantilla repetida:

| provider | BE→MA | ES→MA | FR→MA | IT→MA |
|---|---|---|---|---|
| Wise (fee) | €0.00 | €1.67 | €1.63 | €1.67 |
| Western Union (fee) | €0.90 | €1.90 | €0.90 | €1.90 |
| Ria (fee) | €1.99 | €2.90 | €1.99 | €2.90 |

`/send/be-ma` y `/send/es-ma` son páginas legítimamente distintas — no hay
ningún problema ahí. **Pero** para cualquier par de países-eurozona hacia
un destino donde NINGUNO de los dos tiene fila propia en `fx_rates` (la
inmensa mayoría, dado que sólo 309 de ~59.000 corredores tienen datos
propios), la tabla de resultados sale enteramente de `resolveTier()` —
que como ya vimos no lee el país en absoluto. Ahí sí, `/send/de-ar` y
`/send/fr-ar` (si ninguno de los dos tiene fila propia hacia Argentina)
mostrarían exactamente los mismos providers con exactamente los mismos
números.

**No es un problema específico de "comparten moneda"** — es el mismo
fenómeno de arriba, sólo que se nota más fácil en la eurozona porque ahí
hay muchos países candidatos compitiendo por la misma moneda EUR. Un
`/send/gb-ar` y un `/send/us-ar` (monedas distintas, GBP vs USD) sin datos
propios hacia Argentina también mostrarían providers idénticos en fee, sólo
que con el título/`<h1>` diciendo "GBP to ARS" vs "USD to ARS" en vez de
"EUR to ARS" repetido — la duplicación de contenido cruda es la misma, la
eurozona sólo la hace más visible porque además comparte la etiqueta de
moneda.

### Qué cambia esto en la recomendación de §1/§14

No cambia el plan de acción, lo hace más preciso: cuando se sume
`/send/:corridor` al sitemap (§1) y se conecte el flujo de búsqueda ahí
(§14), **el filtro no es opcional ni "nice to have" — es necesario para no
generar decenas de miles de páginas genéricas indexables**. Filtrar por
los 309 corredores con fila propia en `fx_rates` (la misma fuente que ya
usa `getExclusiveCorridors()`) es exactamente el criterio correcto — ya
está probado con datos reales que esos 309 sí tienen contenido
diferenciado de verdad. El resto del espacio de URLs puede seguir
existiendo y funcionando para quien llegue por un link compartido o
escriba la URL a mano (no hay que romper nada ahí), simplemente no hay que
promoverlo activamente a Google.

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
| 13 | `/send/:corridor` genera contenido idéntico bajo 3+ URLs (país vs. moneda vs. mayúsculas), cada una autocanonicalizándose | **Alta** | Bajo (normalizar el `path` del canonical) | `send.$corridor.tsx`, `countries.ts` |
| 8 | 7 rutas confirmadas sin ningún link interno (mismas del punto 2) | Alta (ya contada en #2) | — | — |
| 9 | `public/brand/signature.html` público, sin link, sin valor SEO | Baja | Trivial | `public/brand/signature.html`, `robots.txt` |
| 10 | `fo-verify.html` en la raíz — a confirmar si sigue vivo en prod antes de borrar | Baja | Trivial (una vez confirmado) | `fo-verify.html` |
| 11 | `/admin/i18n-status` sin `Disallow` explícito en `robots.txt` (ya tiene `noindex`) | Baja | Trivial | `public/robots.txt` |
| 12 | Contenido duplicado del blog por fallback de idioma | — | — | **Descartado** — verificado contra la base, no está ocurriendo |
| **14** | **La home y `/business` nunca navegan a `/send/:corridor`** — cada comparación real queda no-indexable | **Alta (la más importante)** | Medio (4 pasos encadenados, ver §14) | `index.tsx`, `business.tsx`, `send.$corridor.tsx` |

### Orden sugerido de implementación (para la próxima ronda)

Dado que varios hallazgos dependen entre sí, este es el orden que evita
rehacer trabajo:

1. **§3** — typo de encoding (trivial, sin dependencias, hacerlo ya).
2. **§2** — `statusCode: 301` en los 7 redirects (trivial, sin dependencias).
3. **§13** — normalizar el canonical de `/send/:corridor` a una sola forma
   (país-país en minúsculas). Es prerrequisito de #4.
4. **§14** — conectar `/` y `/business` a `/send/:corridor` (los 4 pasos
   del plan de §14, en su propio orden interno). El cambio de mayor impacto
   de toda la auditoría, pero necesita el #3 resuelto primero.
5. **§1** — sumar `/about`, `/business`, `/widget` y (una vez filtrados por
   datos reales, ver la nota de §14) los corredores de `/send/:corridor` al
   sitemap.
6. **§4, §5, §6, §7, §9, §10, §11** — el resto, sin orden estricto entre
   ellos, ninguno depende de los anteriores.

Ningún hallazgo de este pase requiere tocar la base de datos ni corre nada
contra producción — son todos cambios de código en la rama `kayakclone`,
verificables localmente con `bun run build` antes de subir. El punto 13 es
el único hallazgo nuevo de prioridad alta de esta segunda pasada; los
puntos 9-11 son de limpieza, bajo riesgo y bajo impacto.
