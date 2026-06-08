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
import { I18nProvider } from "@/lib/i18n";
import { ComingSoonProvider } from "@/components/ComingSoonModal";
import { ChatWidget } from "@/components/ChatWidget";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
      { title: "mangoglobal | AI Agent for Global FX" },
      { name: "description", content: "Intelligent decisions for Retail Remittances and Corporate Treasury" },
      { name: "author", content: "mangoglobal" },
      { property: "og:title", content: "mangoglobal | AI Agent for Global FX" },
      { property: "og:description", content: "Intelligent decisions for Retail Remittances and Corporate Treasury" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@mangoglobal" },
      { name: "twitter:title", content: "mangoglobal | AI Agent for Global FX" },
      { name: "twitter:description", content: "Intelligent decisions for Retail Remittances and Corporate Treasury" },
      { property: "og:image", content: "https://mangoglobal.lovable.app/__l5e/assets-v1/8c1a6993-3dd3-49eb-a873-c466dbc18004/og-image.png" },
      { name: "twitter:image", content: "https://mangoglobal.lovable.app/__l5e/assets-v1/8c1a6993-3dd3-49eb-a873-c466dbc18004/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@200;300;400;500;600;700&display=swap" },
    ],
  }),
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { initialLang } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLang={initialLang}>
        <ComingSoonProvider>
          {/* Technical grid background — global, sutil */}
          <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F8FAFC]">
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-200/20 to-transparent blur-[120px]" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-16">
              <Outlet />
            </main>
            <Footer />
          </div>
          <ChatWidget />
        </ComingSoonProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

