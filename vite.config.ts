import { defineConfig, loadEnv, type PluginOption } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Hand-rolled config that replaces the former @lovable.dev/vite-tanstack-config
// wrapper. It wires the same underlying plugins (TanStack Start, Nitro, React,
// Tailwind, tsconfig paths) directly, with no Lovable- or Cloudflare-specific
// pieces. Deploy target is Nitro-driven: `node-server` locally, auto-detected
// `vercel` on Vercel (via the VERCEL env var, override with NITRO_PRESET).
export default defineConfig(async ({ command, mode }) => {
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
    plugins.push(nitro());
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
