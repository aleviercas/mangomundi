import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider, SEO_META, RTL_LANGS, SUPPORTED_LANGS, useI18n, type Lang } from "@/lib/i18n";
import { ComingSoonProvider } from "@/components/ComingSoonModal";
import { ALL_FLAG_URLS } from "@/components/ui/FlagIcon";

import { SITE_URL, GA4_MEASUREMENT_ID, GTM_CONTAINER_ID } from "@/config/site";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
          {t("errors.notFound.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.notFound.body")}</p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("errors.notFound.cta")}
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {t("errorBoundary.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errorBoundary.description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("errorBoundary.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
          >
            {t("errorBoundary.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

// 2026-09-16 — misma lógica pura que geo.functions.ts's getInitialLang(),
// duplicada acá a propósito (no importada) para que RootShell (más abajo)
// pueda llamarla de forma 100% sincrónica sin arrastrar el resto de
// geo.functions.ts (con exports server-only vía createServerFn) al bundle
// de cliente. Ver el comentario grande de RootShell sobre por qué esto
// tiene que ser sincrónico y no venir del loader asíncrono de la raíz.
// 2026-09-19 — el prefijo de path es la fuente de verdad para las 8 rutas
// migradas (search.lang ahí siempre redirige antes de llegar a este punto,
// ver el comentario grande de RootShell), pero /embed NO tiene ni puede
// tener su propio `{-$lang}` — legítimamente sigue usando `?lang=` como su
// mecanismo real (ver detectEmbedLang() en geo.functions.ts) y nunca
// redirige. Encontrado en vivo: `/embed?lang=ar` mandaba `<html
// lang="en">` porque esta función sólo miraba el path. `searchStr` es la
// query string cruda (con el `?` inicial si existe, o vacía) — se parsea
// acá en vez de depender de un `search` ya tipado, porque la ruta raíz no
// tiene su propio `validateSearch`.
function getInitialLangSync(pathname: string, searchStr: string): Lang {
  const seg = pathname.split("/")[1]?.toLowerCase();
  if (seg && (SUPPORTED_LANGS as string[]).includes(seg)) return seg as Lang;
  try {
    const q = new URLSearchParams(searchStr).get("lang")?.toLowerCase();
    if (q && (SUPPORTED_LANGS as string[]).includes(q)) return q as Lang;
  } catch {
    // ignore
  }
  return "en";
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ location }) => {
    try {
      const { getVisitorGeo } = await import("@/lib/geo.functions");
      const initialLang = getInitialLangSync(location.pathname, location.searchStr ?? "");
      const geo = await getVisitorGeo();
      return { initialLang, geoCountry: geo.country, geoCurrency: geo.currency };
    } catch {
      return { initialLang: "en" as const, geoCountry: "GB", geoCurrency: "GBP" };
    }
  },
  head: ({ loaderData }) => {
    // 2026-09-19 — este `seo` (title/description/og:*/twitter:*) es sólo
    // el FALLBACK genérico — cada una de las 8 rutas migradas ya vuelve a
    // definir title/description/og:title/og:description en su propio
    // head() (leyendo `params.lang` directo, no `loaderData`), y esas
    // sí ganan en el merge final. `loaderData?.initialLang` alcanza para
    // las rutas que NO tienen ese override (/admin, /embed, los redirects
    // legacy) porque ninguna de ellas depende de que esto sea exacto por
    // idioma — no intentar "arreglar" esto para que sea sincrónico como
    // RootShell: acá `match.pathname` siempre es "/" (el match de la
    // propia ruta raíz, nunca la URL completa resuelta del hijo) — no hay
    // forma de que la raíz sepa el idioma del hijo por este camino. Ver
    // el hallazgo de twitter:title/twitter:description en
    // docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md — el fix
    // real fue agregar esas dos claves al head() de cada ruta migrada,
    // no acá.
    const seo = SEO_META[loaderData?.initialLang ?? "en"] ?? SEO_META.en;
    // Absolute URL — social crawlers (WhatsApp/X/LinkedIn/Facebook) reject
    // relative og:image paths, so the card would never render.
    const ogImage = `${SITE_URL}/brand/og-card.png`;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#241C16" },
        // 2026-09-02 feedback — anti-scraping measure for the rate/corridor
        // data, without touching SEO: no `name: "robots"` tag here on
        // purpose (its absence already means the default index/follow,
        // same as before — Google/Bing keep full access). "noai"/
        // "noimageai" is a separate, narrower signal some publishers use
        // (the Spawning.ai do-not-train convention) asking AI trainers
        // specifically not to use this page's content for training —
        // informal, not universally honored, but a real signal alongside
        // robots.txt's per-bot Disallow rules (see public/robots.txt).
        { name: "robots", content: "noai, noimageai" },
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "author", content: "Mangomundi" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Mangomundi — compare currency exchange rates" },
        { property: "og:site_name", content: "Mangomundi" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@mangomundi" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        // mangomundi brand favicon set (design/HANDOFF.md §1) — PNG icons only,
        // no legacy .ico or android-chrome-* fallbacks.
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/brand/favicon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/brand/favicon-16.png" },
        { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
        { rel: "manifest", href: "/brand/manifest.json" },
        // 2026-09-09/10/11 font-loading fix — full history in
        // src/styles.css's @font-face comment. Final state (2026-09-11):
        // body text and headings use the system font stack (no download,
        // no fallback→webfont swap possible at all); only the brand
        // wordmark (Rubik, design/HANDOFF.md §1) is still self-hosted, so
        // it's the only face preloaded here.
        {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          href: "/fonts/rubik-700.woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          href: "/fonts/rubik-700-italic.woff2",
          crossOrigin: "anonymous",
        },
        // 2026-08-31 feedback (twice), still reported 2026-09-01 after
        // switching from a JS idle-callback warm-up to `<link
        // rel="prefetch">` — the flags kept popping in late regardless.
        // `prefetch`'s own spec behavior is the reason: browsers treat it
        // as "fetch this only once the page is otherwise idle" (often
        // deferred past onload, sometimes past several seconds of network
        // quiet), not "fetch this soon at low priority" — a real person
        // opening the country dropdown within the first second or two of
        // landing can easily open it before a single prefetch has fired.
        // `preload` + `fetchPriority: "low"` is the fix for that specific
        // gap: still discovered by the preload scanner while parsing this
        // HTML (same as before), but scheduled as a normal load-time fetch
        // instead of being deferred to idle — just at the bottom of the
        // priority queue, so critical resources (fonts, hero, JS/CSS) still
        // win the bandwidth first. ~270 SVGs / ~2.7MB total is real weight
        // to add to page load even at low priority, which is exactly why
        // this couldn't just be `preload` at default/high priority instead.
        ...ALL_FLAG_URLS.map(
          (href) => ({ rel: "preload", href, as: "image", fetchPriority: "low" }) as const,
        ),
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// GA4 gtag.js — production only, so local `bun run dev` / Claude sessions
// don't pollute real analytics with test traffic.
//
// Deliberately rendered as plain JSX inside RootShell below, NOT through
// routeOptions.head()'s `scripts` field. TanStack Router has an open bug
// (github.com/TanStack/router issues #7104 and #6569) where head-managed
// <script> tags get duplicated or dropped during client hydration. Plain
// JSX in the component tree goes through React's normal (well-tested)
// hydration path instead, avoiding it entirely.
function GoogleAnalytics() {
  if (!import.meta.env.PROD) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_MEASUREMENT_ID}');`,
        }}
      />
    </>
  );
}

// Google Tag Manager — same rationale and gating as GoogleAnalytics above:
// plain JSX inside RootShell (not routeOptions.head()'s `scripts` field) to
// avoid TanStack Router's script duplication/drop bug on hydration
// (github.com/TanStack/router issues #7104 and #6569), and production-only
// so local `bun run dev` / Claude sessions don't pollute real analytics.
function GoogleTagManager() {
  if (!import.meta.env.PROD) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
      }}
    />
  );
}

function GoogleTagManagerNoScript() {
  if (!import.meta.env.PROD) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}

// Trustpilot TrustBox bootstrap — same rationale as GoogleAnalytics/
// GoogleTagManager above: plain JSX inside RootShell, not routeOptions.
// head()'s `scripts` field, to avoid TanStack Router's known script
// duplication/drop bug on hydration (issues #7104 / #6569). Loaded once,
// site-wide, since any page could render a <TrustBox /> widget (see
// components/TrustBox.tsx) and the bootstrap script is what makes those
// divs actually render — without it they'd just show the plain fallback
// link. Production-only, matching the other third-party scripts here.
function TrustpilotBootstrap() {
  if (!import.meta.env.PROD) return null;
  return <script async src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" />;
}

function RootShell({ children }: { children: React.ReactNode }) {
  // 2026-09-16 — verificación en vivo (servidor real) encontró que leer
  // `initialLang` del loaderData de la ruta raíz (más abajo, para
  // el resto del árbol vía I18nProvider) daba SIEMPRE "en" acá arriba,
  // incluso pidiendo /ar/legal. Causa: el loader de la raíz espera
  // `getVisitorGeo()` (una llamada real) antes de resolver — con SSR por
  // streaming, React ya mandó la etiqueta `<html>` de apertura al stream
  // ANTES de que esa promesa resuelva, usando el valor default ("en") que
  // `loaderData?.initialLang ?? "en"` daba en ese instante. Una vez que
  // el `<html>` de apertura ya salió por el stream, no hay forma de
  // corregirlo retroactivamente.
  //
  // El fix real: calcular esto ACÁ, sincrónico, a partir del pathname
  // actual del router (disponible de inmediato, sin esperar ningún
  // loader) — ya no necesita ninguna llamada de servidor desde que
  // `getInitialLang()` (geo.functions.ts) pasó a ser lógica pura de
  // string sobre el path. `useRouterState` da el pathname ya resuelto en
  // el primer render del servidor, sin el delay de `getVisitorGeo()`.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr ?? "" });
  const initialLang = getInitialLangSync(pathname, searchStr);
  return (
    <html lang={initialLang} dir={RTL_LANGS.includes(initialLang) ? "rtl" : undefined}>
      <head>
        <GoogleTagManager />
        <HeadContent />
        <GoogleAnalytics />
        <TrustpilotBootstrap />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function LangKeyedShell() {
  const { lang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The embeddable widget (/embed) renders bare — no site chrome — so it drops
  // cleanly into a third-party iframe. All providers still wrap it (above).
  if (pathname === "/embed") {
    return (
      <div key={lang}>
        <Outlet />
      </div>
    );
  }

  // 2026-09-01 feedback — "la sección de business sigue quedando mucho
  // espacio en blanco": this container used to force `min-h-screen` +
  // `flex-col` so a short page's <Footer> still landed at the bottom of
  // the viewport instead of right after the content. That's exactly what
  // was producing the huge empty cream gap the user kept flagging on
  // `/business` (and `/about`) — real content there is shorter than a
  // typical viewport, so the footer got pushed ~250-300px down to sit at
  // the viewport edge. Dropping the forced min-height lets the footer sit
  // directly under whatever content each page actually has, which is the
  // normal pattern for a marketing site (the footer isn't meant to be
  // glued to the viewport bottom, just to end the page). Long pages (home)
  // are unaffected since their content already exceeds any viewport height.
  // 2026-09-04 feedback (ronda 8) — "el mangomundi ai cuando se despliega
  // no tendria que tapar lo del fondo, igual que como hace kayak": este
  // `id` es el gancho que FloatingAgent (ComparatorSection.tsx) usa para
  // togglear `.ai-panel-open` por DOM directo cuando el panel abre/cierra
  // — Header, este `<main>`/Outlet y ComparatorSection son hermanos sin
  // padre en común que los una a los tres (mismo motivo por el que los
  // triggers colapsados viajan por portal a `#header-ai-slot`/
  // `#header-ai-slot-mobile` en vez de props). La regla real
  // (padding-left + transición, sólo desde `sm:`) vive en styles.css junto
  // a `#page-main` — acá sólo el id que la engancha.
  return (
    <div key={lang} className="relative z-10 flex flex-col">
      <Header />
      {/* `pt-[66px]` fijo pasa a `pt-[var(--header-h)]` (ver el comment de
          esa custom property en styles.css `:root`) — Header.tsx puede
          medir más de 66px una vez que la barra de búsqueda del comparador
          se le porta adentro (ronda 8), y este padding es lo que evita que
          el contenido de la página arranque tapado debajo del header fijo. */}
      <main id="page-main" className="pt-[var(--header-h)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { initialLang } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLang={initialLang}>
        <ComingSoonProvider>
          {/* 2026-09-01 feedback — "revisar los colores... hay tonos del
              fondo diferentes" vs. design/Mangomundi 4 - Final.dc.html: the
              mockup's page background is #FBF8F4 (a warm cream, already
              `--background` in styles.css) — this wrapper had its own
              hardcoded #fcfcfc (near-white) instead of the token, so every
              section that relies on inheriting the page background instead
              of setting its own (TodaysRoutesSection among them) rendered
              paler than the mockup everywhere at once. */}
          <div className="bg-background">
            <LangKeyedShell />
          </div>
          <SpeedInsights />
        </ComingSoonProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
