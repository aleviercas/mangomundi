import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider, SEO_META, useI18n } from "@/lib/i18n";
import { ComingSoonProvider } from "@/components/ComingSoonModal";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">{t("errors.notFound.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("errors.notFound.body")}
        </p>
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
      const { getInitialLang } = await import("@/lib/geo.functions");
      const initialLang = await getInitialLang();
      return { initialLang };
    } catch {
      return { initialLang: "en" as const };
    }
  },
  head: ({ loaderData }) => {
    const seo = SEO_META[loaderData?.initialLang ?? "en"] ?? SEO_META.en;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#E9EDF3" },
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "author", content: "mangomundi" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "/og-image.png" },
        { property: "og:site_name", content: "mangomundi" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@mangomundi" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: "/og-image.png" },
        { title: "Mangomundi" },
        { property: "og:title", content: "Mangomundi" },
        { name: "twitter:title", content: "Mangomundi" },
        { name: "description", content: "Intelligent currency exchange decisions" },
        { property: "og:description", content: "Intelligent currency exchange decisions" },
        { name: "twitter:description", content: "Intelligent currency exchange decisions" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@200;300;400;500;600;700&display=swap" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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

