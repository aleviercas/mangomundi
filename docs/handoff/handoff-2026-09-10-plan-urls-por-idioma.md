# Plan: URLs propias por idioma (¿reemplazar `?lang=`?)

Fecha: 2026-09-10. Sólo análisis y plan — sin ningún cambio de código.
Responde a la pregunta de Ale: "¿los artículos del blog deberían tener una
dirección distinta por idioma, o está bien como está?".

## Resumen ejecutivo

Está más grande de lo que parecía al principio. No es "agregarle un
`/es/` adelante a las rutas del blog" — hay dos hallazgos de arquitectura
que cambian el tamaño real del proyecto:

1. **El selector de idioma de hoy no toca la URL en absoluto.** Es estado de
   cliente puro (`localStorage` + React context) — el `?lang=` sólo existe
   para el primer render del servidor y para las etiquetas hreflang que lee
   Google, nunca para lo que hace un usuario real tocando el dropdown.
   Migrar a URLs por idioma no es "agregar un segmento a la ruta" — es
   invertir el modelo entero: la URL pasa de ser un reflejo opcional (para
   crawlers) a ser la fuente de verdad real del idioma.
2. **La URL limpia (sin `?lang=`) hoy es polimórfica** — el mismo
   `mangomundi.com/` sirve contenido distinto según la IP/Accept-Language de
   quien la pide, mientras se autocanonicaliza a sí misma sin importar qué
   versión sirvió. Es exactamente el antipatrón que la propia documentación
   de Google nombra explícitamente, más allá de la recomendación general de
   subdirectorios vs. parámetros (ver §2).

La escala tampoco es sólo el blog: **~337 páginas indexables × 20 idiomas ≈
6.740 variantes de URL** ya dependen de este esquema hoy (23 posts, 309
corredores, y 5 páginas estáticas — cada una con hreflang completo a los 20
idiomas).

Con todo eso en la mesa, más abajo van 3 opciones de alcance con una
recomendación concreta (§5), y el plan detallado paso a paso de la opción
recomendada (§6).

---

## 1. Cómo funciona hoy, en detalle (código real)

### El idioma vive en React state, no en la URL

`I18nProvider` (`src/lib/i18n.tsx`) guarda el idioma en un `useState`
local. Al montar, decide el idioma con esta prioridad:

1. `?lang=` explícito en la URL (si está) — máxima prioridad.
2. `localStorage` (elección previa del usuario en ese navegador).
3. `initialLang` que vino del servidor (geo-IP/Accept-Language — ver §2).
4. `navigator.language` del browser.
5. `"en"` si nada de lo anterior aplicó.

### El selector de idioma (`LangSwitcher.tsx`) no navega a ningún lado

```ts
const pick = (code: Lang) => {
  setLang(code);   // sólo cambia el estado de React + localStorage
  setOpen(false);
};
```

Nunca llama a `navigate()`. Si un usuario real está en `/blog/mi-post` y
cambia el idioma a francés con el dropdown, la página se re-renderiza en
francés — **pero la URL sigue siendo exactamente `/blog/mi-post`, sin
`?lang=fr`**. Si esa persona copia el link y se lo manda a alguien, la otra
persona no recibe francés — recibe lo que le toque por *su propia*
geo-IP/Accept-Language, no lo que el primero eligió. El `?lang=` de hoy
existe, casi exclusivamente, para que Google encuentre y indexe cada
versión de idioma vía las etiquetas hreflang — no para la experiencia real
de compartir/navegar de una persona.

---

## 2. La URL limpia es polimórfica — el antipatrón que Google nombra directamente

`getInitialLang()` (`src/lib/geo.functions.ts`), que decide qué idioma
renderiza el servidor cuando NO hay `?lang=` explícito, en este orden:

1. País detectado por geo-IP → mapeado a idioma.
2. `Accept-Language` del navegador.
3. `"en"`.

Es decir: `mangomundi.com/` sirve contenido en español a alguien con IP de
España, en francés a alguien con IP de Francia, y así — **la misma URL,
sin cambiar, autocanonicalizada a sí misma**. La [guía oficial de Google
sobre sitios multilingües](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
lo dice de forma explícita y específica, más allá de la recomendación
general de subdirectorios: *"Google recommends using different URLs for
each language version of a page rather than using cookies or browser
settings to adjust the content language on the page."* — eso es
literalmente lo que hace `getInitialLang()`.

En la práctica esto no rompe la experiencia de un usuario real (cada uno
recibe su idioma correcto vía SSR, no es un bug de cara al visitante) —
pero sí ensucia la señal que recibe Google: Googlebot rastrea casi siempre
desde IPs/Accept-Language en inglés, así que la URL limpia que Google
indexa y cachea como "la" versión de esa página es casi siempre la
inglesa — sin que el propio canonical/hreflang de esa URL lo declare en
ningún lado como "esto es específicamente la versión en inglés".

---

## 3. Lo que ya está bien — no hay que rehacerlo

Vale aclarar esto antes de seguir, porque no es que todo esté mal: el
canonical de cada variante `?lang=xx` apunta a sí misma (no a una URL
compartida), el hreflang está completo y correcto en cada una de las ~337
páginas, y ya se verificó con datos reales que las traducciones del blog
son genuinas (no un fallback a inglés repetido — ver
`docs/handoff/handoff-2026-09-09-auditoria-seo-completa.md` §12). El
problema no es la calidad de la implementación dentro del esquema elegido
— es el esquema en sí (query param en vez de URL propia), y el hecho de que
ni siquiera el propio selector de idioma lo usa para navegar.

---

## 4. Qué exigiría técnicamente migrar a URLs por idioma

Independientemente del alcance (sólo blog vs. todo el sitio), estas piezas
cambian sí o sí:

1. **Reestructurar el routing de TanStack Start.** Es ruteo basado en
   archivos — pasar de `/blog/$slug` a algo como `/$lang/blog/$slug` (o
   `/blog/$lang/$slug`) implica mover archivos de ruta a una carpeta
   `$lang/`, no sólo agregar un parámetro. Hay que decidir además si el
   idioma default (inglés) vive sin prefijo (`/blog/...`) o con prefijo
   como todos los demás (`/en/blog/...`) — lo primero es más amigable para
   no perder el ranking ya acumulado en las URLs actuales, lo segundo es
   más consistente/simple de implementar.
2. **Invertir el modelo de `I18nProvider`.** Hoy el idioma es estado de
   cliente que opcionalmente se refleja en la URL. Tiene que pasar a ser
   *derivado* de la URL (leído del segmento de path en cada request/
   navegación), con el selector de idioma (`LangSwitcher.tsx`) navegando de
   verdad (`navigate({ to: mismo path, params: { lang: nuevo } })`) en vez
   de sólo `setLang()`.
3. **Redirects reales desde cada `?lang=xx` existente hacia su nueva URL.**
   No es opcional — sin esto se pierde cualquier señal/ranking que Google
   ya haya acumulado sobre esas ~6.740 variantes actuales. Necesita un
   mapeo completo, no un redirect genérico.
4. **Regenerar `hreflangLinks()`/`selfCanonical()`** (`src/config/site.ts`)
   para construir URLs con el nuevo esquema de path en vez de query param
   — son los dos puntos centrales que ya reusa cada ruta, así que el
   cambio en sí es acotado, pero todo lo que depende de ellos (8 archivos
   de ruta) hay que volver a verificar.
5. **Sitemap** (`sitemap[.]xml.ts`) — mismo criterio, cambia cómo arma las
   URLs de cada alternate.
6. **Decidir qué pasa con la URL limpia (sin idioma).** Si se resuelve el
   problema de §2 de raíz, la URL sin prefijo debería dejar de
   autodeterminar idioma por geo-IP y en cambio redirigir (302, no 301 —
   es una decisión de la sesión/visita, no una URL movida permanentemente)
   a la URL con el prefijo de idioma detectado la primera vez que alguien
   la visita, guardando la elección para la próxima. Es un cambio de
   comportamiento real para cualquiera que hoy llega a `mangomundi.com/` a
   secas.

---

## 5. Tres opciones de alcance, con recomendación

### Opción A — Piloto acotado, sólo blog (`/blog/:lang/:slug` o similar)

Ataca directamente lo que preguntaste. Menor superficie (23 posts × 20
idiomas = 460 URLs a migrar, no las ~6.740 del sitio entero), menor riesgo,
sirve como prueba real antes de comprometerse a más. **Contra:** crea una
inconsistencia real con el resto del sitio (blog con URL propia por
idioma, comparador/`/business`/etc. con `?lang=`) — una de las
recomendaciones más repetidas en cualquier guía de SEO multilenguaje es
justamente mantener un único esquema consistente en todo el sitio. También
no resuelve el problema de fondo de §2 en el resto del sitio.

### Opción B — Todo el sitio de una

Resuelve el problema de raíz en todas partes y mantiene consistencia.
**Contra:** ~6.740 URLs a redirigir correctamente, reestructuración de
ruteo mucho más invasiva (toca las 9 familias de rutas, no sólo el blog),
y el mayor riesgo real de cualquier migración de URLs a gran escala: una
migración mal hecha (redirects incompletos, hreflang desalineado durante
la transición) es de las formas más comunes de perder tráfico orgánico de
golpe — no es un riesgo teórico, es el motivo por el que Google mismo
recomienda migraciones de dominio/estructura por etapas y con monitoreo
activo de Search Console.

### Opción C — No migrar la URL todavía; arreglar primero el gap más barato

Antes de tocar la estructura de URLs, arreglar que **el selector de idioma
al menos actualice `?lang=` al cambiar de idioma** (`navigate({ search:
{ lang } })` en `pick()`, sin tocar el ruteo de archivos en absoluto). Es
un cambio chico, de bajo riesgo, que ya resuelve la parte más molesta del
gap del §1 (compartir un link hoy comparte el idioma equivocado) sin
comprometerse todavía a la reestructuración grande. No resuelve §2 ni la
recomendación de Google de usar subdirectorios — es una mejora intermedia,
no la solución final.

### Recomendación

**Empezar por la Opción C ahora** (bajo riesgo, cierra el bug más visible
de inmediato — ✅ **implementado el 10-sep**, ver §6), y planificar la
**Opción B como iniciativa aparte, no apurada** — full-site, no sólo blog,
justamente para no introducir la inconsistencia de la Opción A. La razón
para no recomendar A ni B *ahora mismo*: los tres hallazgos grandes de la
auditoría anterior (sitemap, redirects, conectar el comparador a
`/send/:corridor`) recién se implementaron esta semana — tiene sentido
dejar que esos cambios asienten y se puedan medir en Search Console antes
de superponer una migración de URLs mucho más grande y de mayor riesgo
sobre el mismo sitio.

Si igual se quiere priorizar el blog específicamente por ser donde más
pesa la búsqueda orgánica por palabra clave en cada idioma, la Opción A es
defendible como excepción consciente y documentada (no accidental) — pero
que sea una decisión explícita, sabiendo que introduce esa inconsistencia
a propósito.

---

## 6. Plan detallado — Opción C ✅ implementado (10-sep)

1. `LangSwitcher.tsx`: `pick()` pasa de `setLang(code)` a navegar
   (`navigate({ search: (prev) => ({ ...prev, lang: code === "en" ?
   undefined : code }) })`) manteniendo el path actual — funciona en
   cualquier ruta porque todas ya tienen `lang` en su `searchSchema`.
   `setLang(code)` se mantiene además (no se saca), para que el estado de
   React se actualice al toque sin esperar el roundtrip de navegación.
2. Verificar que esto no rompe rutas que hoy no tienen `?lang=` en su
   `searchSchema` de forma explícita (ya se revisó en §1 de este documento
   — las 8 rutas con SEO ya lo tienen).
3. `tsc --noEmit` + `vite build` antes de commitear, mismo criterio de
   siempre.
4. No hace falta redirect ni migración de URLs existentes — este cambio no
   mueve ninguna URL, sólo hace que las nuevas navegaciones del selector
   escriban la que ya existía.

**Nota (10-sep, segunda vuelta):** superado por la Opción B completa (ver
§6.5 más abajo) — `LangSwitcher.tsx` ya no escribe `?lang=`, navega
directo a la URL con prefijo de idioma real.

## 6.5. Revisión posterior a la implementación de la Opción B (13-sep) — 4 hallazgos reales

Después de implementar y pushear la Opción B completa, una revisión
adicional (sin ningún pedido puntual, sólo "¿se puede mejorar algo?")
encontró 4 problemas reales, no cosméticos:

1. **`/widget` se había quedado a medio migrar.** Su `head()` todavía leía
   `match.search.lang` (el esquema viejo) en vez de `params.lang`, y le
   faltaba el `beforeLoad` de validación/redirect que sí tienen las otras
   7 rutas. Confirmado (no sólo sospechado): `/es/widget` estaba generando
   un `<link rel="canonical">` apuntando al inglés en vez de a sí mismo.
2. **Las URLs con mayúsculas en el idioma no se normalizaban.** `/ES/about`
   tiraba directo a la versión sin prefijo (perdiendo el idioma) en vez de
   a `/es/about`. Corregido con el mismo criterio que ya se usaba para los
   slugs de corredor (`GB-MX` → `gb-mx`).
3. **`/embed` (el widget para terceros, `widget.js`) perdió su
   autodetección de idioma por geo-IP.** `getInitialLang()` simplificado en
   la Opción B (§2 de este documento) ahora sólo mira `?lang=` explícito —
   correcto para las 8 páginas indexables (era el antipatrón), pero
   `data-lang="auto"` es el default documentado del widget (`widget.js`,
   `data-lang`), que deliberadamente NO manda `?lang=` para que se
   autodetecte. Con el simplificado, todo widget "auto" quedaba en inglés
   sin importar el visitante real. **Esta no es la misma situación que las
   8 páginas migradas**: `/embed` ya es `noindex, nofollow` (nunca lo
   indexa Google), así que autodetectar el idioma de una calculadora
   embebida no es el antipatrón de "misma URL indexable, contenido
   distinto" — es personalización legítima de una herramienta. Restaurada
   la detección geo-IP/Accept-Language sólo para esta ruta
   (`detectEmbedLang()` en `geo.functions.ts`, con un comentario grande
   explicando por qué es la excepción y no una regresión de la Opción B), *aplicada* vía un
   nuevo `I18nOverride` (`i18n.tsx`) que fuerza el idioma sólo para el
   subárbol de `/embed`, sin tocar el `I18nProvider` global que usa el
   resto del sitio.
4. **Consecuencia del punto 3: `<html lang>`/`dir` no seguían al idioma
   detectado dentro de `/embed`.** `I18nOverride` corrige el texto (`t()`)
   pero el `I18nProvider` de afuera (montado en `__root.tsx`, fuera de
   cualquier `{-$lang}`) seguía viendo `initialLang: "en"` para `/embed` —
   inofensivo para idiomas LTR, pero un widget "auto" detectado en árabe o
   urdu quedaba con texto RTL bajo un documento marcado `dir="ltr"`,
   rompiendo el layout visualmente. Agregado un efecto en el propio
   `I18nOverride` que corrige `document.documentElement.lang`/`dir` para
   ese subárbol específicamente. De paso, encontrado un bug preexistente
   —no introducido por esta migración— mientras se tocaba esto: `RTL_LANGS`
   sólo incluía `"ar"`, sin `"ur"` (urdu, que también se escribe de derecha
   a izquierda y es uno de los 20 idiomas soportados del sitio) — corregido
   en el mismo cambio, junto con `__root.tsx`'s `<html dir>` (comparaba
   sólo contra `"ar"` en vez de usar `RTL_LANGS`).

Los 4 quedaron corregidos y verificados (`tsc --noEmit` + `vite build`
limpios) en la misma sesión que los encontró.



1. `LangSwitcher.tsx`: `pick()` pasa de `setLang(code)` a navegar
   (`navigate({ search: (prev) => ({ ...prev, lang: code === "en" ?
   undefined : code }) })`) manteniendo el path actual — funciona en
   cualquier ruta porque todas ya tienen `lang` en su `searchSchema`.
   `setLang(code)` se mantiene además (no se saca), para que el estado de
   React se actualice al toque sin esperar el roundtrip de navegación.
2. Verificar que esto no rompe rutas que hoy no tienen `?lang=` en su
   `searchSchema` de forma explícita (ya se revisó en §1 de este documento
   — las 8 rutas con SEO ya lo tienen).
3. `tsc --noEmit` + `vite build` antes de commitear, mismo criterio de
   siempre.
4. No hace falta redirect ni migración de URLs existentes — este cambio no
   mueve ninguna URL, sólo hace que las nuevas navegaciones del selector
   escriban la que ya existía.

**Cómo quedó implementado:** `useNavigate()` genérico (el mismo hook de
router-wide, no atado a una ruta puntual, ya que `LangSwitcher` vive en
`Header`/`Footer` y se monta en TODAS las rutas del sitio vía
`__root.tsx`). Tuvo el mismo problema de tipos ya documentado en
`ComparatorSection.tsx` (TypeScript infiere el tipo del root "/" al no
haber un `from` puntual, y ese tipo no acepta `lang` como key arbitraria)
— resuelto con un cast documentado, ya que en runtime es seguro: las 8
rutas con SEO ya tienen `lang` en su `searchSchema`, y cualquier ruta sin
`validateSearch` (como `/admin/i18n-status`) simplemente no valida el
parámetro, sin romperse. `replace: true` — es una preferencia, no
contenido nuevo, no debería llenar el historial de navegación.

## 6.6. Verificación en vivo con un servidor real (16/17-sep) — 2 bugs más, invisibles para tsc/build

Todo lo de arriba se había verificado sólo con `tsc --noEmit`/`vite
build` (compila y tipa bien) y lectura de código — nunca con un servidor
real respondiendo requests de verdad. El 16-sep se logró levantar el
build real (`node .output/server/index.mjs`, sin acceso a Supabase/
producción — sólo localhost) y probarlo con `curl` contra ~20 rutas y
casos distintos. Encontró **2 bugs reales que ningún `tsc`/`build` podía
detectar**, los dos con la misma causa raíz:

**Causa raíz común:** con SSR por streaming, React manda la apertura de
`<html>` al navegador *antes* de que el loader asíncrono de la ruta raíz
(que espera `getVisitorGeo()`, una llamada real) termine de resolver. Todo
lo que dependía de ese loader para calcular el idioma quedaba con el
valor default ("en") en el HTML que efectivamente se manda — el loader
sí calculaba el valor correcto (confirmado con un log de diagnóstico),
pero llegaba tarde para lo que ya se había mandado por el stream.

1. **`<html lang>` siempre "en"**, incluso pidiendo `/es/legal` o
   `/ar/legal`. `getInitialLang()` pasó a ser una función pura (ya no
   `createServerFn` — el intento inicial de arreglar esto leyendo
   `getRequest()?.url` tampoco alcanzaba, por una razón relacionada: un
   `createServerFn` llamado desde el loader de la raíz se resuelve como
   una llamada RPC interna, y esa URL interna no refleja de forma
   confiable la URL de página real). `RootShell` (`__root.tsx`) ahora la
   llama sincrónicamente con `useRouterState` en vez de leer
   `loaderData.initialLang`. Confirmado en vivo: `/ar/legal` ahora manda
   `<html lang="ar" dir="rtl">`.
2. **El más grave: todos los links del Header/Footer en cualquier página
   `/es/...` salían SIN el prefijo** (a `/business`, `/about`, `/blog`,
   no a `/es/business`, `/es/about`) — navegar desde cualquier página en
   español a cualquier otra parte del sitio te reseteaba a inglés. Causa
   idéntica: `routeLang` en `I18nProvider` se inicializaba en `undefined`
   y sólo se corregía en un `useEffect` (`RouterStateSync`) que nunca
   corre durante SSR — recién corre después de la hidratación, en el
   navegador, cuando el HTML que ve un crawler (o alguien con JS
   deshabilitado, o el primer paint antes de hidratar) ya salió mal.
   Corregido inicializando `routeLang` sincrónicamente desde
   `router.state.location.pathname`. Confirmado en vivo: `/es/legal`
   ahora manda `href="/es/business"`, `href="/es/about"`, etc. en cada
   link del footer/header.

**Confirmado en vivo sin necesitar cambios** (ya funcionaban bien):
redirects 301 de `?lang=xx` viejo, normalización de mayúsculas en el
idioma (`/ES/legal`, `/send/GB-MX`), normalización de moneda→país en
corredores (`/es/send/gbp-mxn` → `/es/send/gb-mx`), un idioma inválido
cae a la versión sin prefijo, `/embed` devuelve `noindex` correctamente,
el sitemap genera los 20 hreflang alternates correctamente y degrada bien
(sin crashear) cuando no hay datos de Supabase, y el contenido real de
cada página (no sólo `<title>`/meta) se traduce de verdad (confirmado
leyendo el texto renderizado de `/es/about`).

**Observación, no un bug de esta migración:** `/widget` en español
muestra el `<title>` genérico de la home ("Mangomundi | Comparar tipos de
cambio") en vez de uno propio del widget — es el fallback ya documentado
de `getRouteSeo()` para rutas sin entrada traducida propia
(`/widget`/`/about`/`/blog`/`/legal` sólo tienen entrada en
`ROUTE_SEO_EN`), el mismo comportamiento que ya existía antes de esta
migración, sólo que ahora alcanzable por path en vez de `?lang=`. Es una
decisión de contenido/traducción, no algo que corresponda arreglar en
código sin pasar por el proceso de traducción revisada del proyecto.

**Test e2e corregido con datos reales, no adivinados:** al revisar el
markup real de `LangSwitcher.tsx` para verificar el test recién escrito,
se encontró que el selector usado (`getByRole("button", { name:
/english/i })`) no iba a funcionar — el botón trigger usa un `aria-label`
genérico ("cambiar idioma"), no el nombre del idioma actual; el texto
visible real es el código corto ("EN"/"ES") vía `<span>{current.label}</span>`,
y cada opción del dropdown (`role="option"`) muestra el nombre nativo
("Español"). Corregido con esos datos verificados. **No se pudo correr
el test de verdad**: el sandbox bloquea la descarga del navegador de
Playwright (`cdn.playwright.dev` no está en la lista de red permitida) —
selectores corregidos contra el markup real, pero sin la ejecución
end-to-end real todavía.

## 7. Plan detallado — Opción B (cuando se decida encarar, no ahora)

Fases, en orden de dependencia:

1. **Decisión de esquema exacta**: `/$lang/...` con inglés sin prefijo vs.
   con prefijo. Recomendado: inglés sin prefijo (preserva el ranking
   actual de las URLs base tal cual están hoy, que son las que más tiempo
   llevan indexadas).
2. **Reestructurar `src/routes/`** moviendo cada ruta indexable bajo el
   nuevo esquema, con el idioma leído de `params.lang` en vez de
   `search.lang`.
3. **Invertir `I18nProvider`**: idioma derivado de la ruta activa (vía
   `useParams`), no de `useState` independiente. `LangSwitcher.tsx` navega
   de verdad al elegir un idioma.
4. **Reescribir `selfCanonical()`/`hreflangLinks()`** (`src/config/site.ts`)
   para el nuevo esquema de path.
5. **Mapa completo de redirects 301** de cada `?lang=xx` existente → su
   URL nueva, por cada una de las ~6.740 combinaciones (se genera, no se
   escribe a mano — un middleware/regla que traduzca `?lang=` a la ruta
   con prefijo cubre todos los casos de una vez, no hace falta un redirect
   por URL).
6. **Sitemap** regenerado con el nuevo esquema.
7. **Rollout gradual con monitoreo activo de Search Console** — no todo de
   una: idealmente un batch de idiomas primero (ej. los que ya tienen más
   tráfico orgánico medible), confirmar que la cobertura de indexación no
   cae antes de seguir con el resto.
8. **URL limpia sin prefijo**: deja de autodetectar idioma por geo-IP;
   redirige (302) al prefijo detectado en la primera visita de cada
   sesión, sin volver a autodetectar en visitas siguientes si ya hay una
   preferencia guardada.

No se estima timeline en días/semanas acá a propósito — depende de cuánto
del trabajo se puede automatizar (sobre todo el paso 5) y no tiene sentido
comprometerse a un número sin escribir código real primero.
