import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider, SEO_META, useI18n } from "@/lib/i18n";
import { ComingSoonProvider } from "@/components/ComingSoonModal";

import { SITE_URL } from "@/config/site";
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const { getInitialLang, getVisitorGeo, getExplicitLangParam } = await import(
        "@/lib/geo.functions"
      );
      const [initialLang, geo, explicitLang] = await Promise.all([
        getInitialLang(),
        getVisitorGeo(),
        getExplicitLangParam(),
      ]);
      return { initialLang, geoCountry: geo.country, geoCurrency: geo.currency, explicitLang };
    } catch {
      return { initialLang: "en" as const, geoCountry: "GB", geoCurrency: "GBP", explicitLang: null };
    }
  },
  head: ({ loaderData }) => {
    const seo = SEO_META[loaderData?.initialLang ?? "en"] ?? SEO_META.en;
    // Absolute URL — social crawlers (WhatsApp/X/LinkedIn/Facebook) reject
    // relative og:image paths, so the card would never render.
    const ogImage = `${SITE_URL}/og-image.png`;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#E9EDF3" },
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
        // New mm favicon set. PNG icons are preferred by modern browsers; the
        // .ico is the legacy fallback for /favicon.ico requests.
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/icon-16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-chrome-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/android-chrome-512x512.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@200;300;400;500;600;700&display=swap",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Render the geo-detected language on the SSR document itself so crawlers
  // and assistive tech see the right lang before hydration (the I18nProvider
  // effect keeps it in sync client-side afterwards).
  const loaderData = Route.useLoaderData();
  const initialLang = loaderData?.initialLang ?? "en";
  return (
    <html lang={initialLang} dir={initialLang === "ar" ? "rtl" : undefined}>
      <head>
        <HeadContent />
      </head>
      <body>
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

  return (
    <div key={lang} className="relative z-10 flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
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
          <div className="min-h-screen bg-[#fcfcfc]">
            <LangKeyedShell />
          </div>
        </ComingSoonProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
