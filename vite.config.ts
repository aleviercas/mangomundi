import { defineConfig, loadEnv, type PluginOption, type UserConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Hand-rolled config that replaces the former @lovable.dev/vite-tanstack-config
// wrapper. It wires the same underlying plugins (TanStack Start, Nitro, React,
// Tailwind, tsconfig paths) directly, with no Lovable- or Cloudflare-specific
// pieces. Deploy target is Nitro-driven: `node-server` locally, auto-detected
// `vercel` on Vercel (via the VERCEL env var, override with NITRO_PRESET).
export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const isDevBuild = command === "build" && mode === "development";

  // Mirror Vite's client-only VITE_* exposure into every environment (client +
  // SSR/Nitro server) so server code can read import.meta.env.VITE_* too.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // Route the SSR server entry through src/server.ts (branded error wrapper).
      server: { entry: "server" },
    }),
  ];

  // Nitro produces the deployable server output; it only runs on build.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        // Default Vercel function duration (10-15s unconfigured) is shorter
        // than the AI chat endpoint's worst-case failover chain. Raising it
        // to 60s (safe on both Hobby and Pro w/ Fluid Compute, which this
        // preset uses by default) lets our own graceful timeouts/fallbacks
        // run to completion instead of the platform killing the function
        // first and showing Vercel's generic crash page.
        vercel: {
          functions: { maxDuration: 60 },
        },
      }),
    );
  }

  plugins.push(viteReact());

  return {
    define,
    // Client-scoped NODE_ENV for dev builds so React DevTools gets dev react-dom;
    // a global flip would emit jsxDEV that the react-server SSR runtime can't load.
    ...(isDevBuild
      ? {
          environments: {
            client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
          },
          esbuild: { keepNames: true },
        }
      : {}),
    // TanStack Start already code-splits per route (blog, legal, embed…
    // each land well under the default 500kB warning on their own); the one
    // chunk that trips it is the home route itself — ComparatorSection.tsx
    // (2000+ lines: the live comparator table, the floating AI copilot,
    // ReactMarkdown) plus the i18n dictionary loaded at the root for every
    // route. Raised with headroom above its current ~2.5MB so the build log
    // stops warning about that known, accepted chunk, while still catching
    // a real regression if it grows further. Shrinking it for real would
    // mean lazy-loading the AI chat panel/ReactMarkdown and splitting the
    // i18n dictionary per-locale — a separate, bigger refactor.
    build: {
      chunkSizeWarningLimit: 3000,
      // flag-icons ships ~250 country flags, most under Vite's default 4KB
      // inline threshold — base64-inlining them all into the CSS is what
      // ballooned styles.css to ~550kB (measured on a real Vercel build),
      // which is render-blocking on every page since it's one global
      // @import. Excluding just this package's assets from inlining lets
      // the browser fetch each flag as its own small, cacheable file,
      // on-demand, exactly when a `fi-xx` class actually needs to paint —
      // native lazy-loading, not custom async code, and no risk of ever
      // going stale as currencies.ts/countries.ts change (unlike a curated
      // CSS subset would be). Every other asset in the app keeps Vite's
      // normal default behavior (`undefined` here falls back to it) — this
      // targets flag-icons specifically, nothing else.
      assetsInlineLimit: (filePath) => (filePath.includes("flag-icons") ? false : undefined),
    },
    // Match dev and build CSS pipelines (Lightning CSS in both).
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: { host: "::", port: 8080 },
    plugins,
  };
});
