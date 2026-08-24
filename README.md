# Mangomundi

A web application built with [TanStack Start](https://tanstack.com/start), React, TypeScript and [Supabase](https://supabase.com/), bundled with [Vite](https://vitejs.dev/) and run with [Bun](https://bun.sh/).

> **New to this repo (including a fresh Claude session)?** Read
> [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) first — product context,
> data model, sprint status and where everything else lives. `ale.md` has the
> UI/SEO changelog.

## Prerequisites

- [Bun](https://bun.sh/) (used as the package manager and runtime)

## Getting started

```bash
# Install dependencies
bun install

# Copy the example environment file and fill in your values
cp .env.example .env

# Start the dev server
bun run dev
```

The app runs on the Vite dev server. Open the URL printed in the terminal.

## Backend

The app uses a self-managed [Supabase](https://supabase.com/) project (Postgres + Auth)
hosted in our own organisation (region `eu-west-1`). Database schema is versioned in
`supabase/migrations/` and applied with the Supabase CLI:

```bash
# Apply all migrations to the linked project (use the IPv4 transaction pooler URI
# from the dashboard → Connect → Transaction pooler if your network lacks IPv6)
supabase db push --db-url "<transaction-pooler-connection-string>"
```

There are no storage buckets or edge functions — it is plain Postgres with row-level
security. The project URL, project ID, and API keys live in the Supabase dashboard
under **Settings → API**; never commit them.

## Environment variables

The following variables are required (see `.env.example`). Copy the real values from
the Supabase dashboard (**Settings → API** and **Settings → Database**) — do **not**
commit them:

| Variable                        | Description                                            |
| ------------------------------- | ----------------------------------------------------- |
| `SUPABASE_URL`                  | Supabase project URL (server)                         |
| `SUPABASE_PROJECT_ID`           | Supabase project ID (server)                          |
| `SUPABASE_PUBLISHABLE_KEY`      | Supabase publishable/anon key (server)                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role key — admin, bypasses RLS. **Server only** |
| `VITE_SUPABASE_URL`             | Supabase project URL (client)                         |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ID (client)                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key (client)                |

## Scripts

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `bun run dev`           | Start the development server                 |
| `bun run build`         | Build for production                         |
| `bun run preview`       | Preview the production build                 |
| `bun run lint`          | Run ESLint                                   |
| `bun run format`        | Format the codebase with Prettier            |
| `bun run i18n:validate` | Validate i18n translation files              |
| `bun run e2e`           | Run Playwright end-to-end tests              |

## Internationalization (i18n)

The UI ships in 20 languages, auto-detected by geography (Vercel's
`x-vercel-ip-country` header → `COUNTRY_TO_LANG`), with `?lang=xx` as the
explicit override (persisted to localStorage). English is the source of truth
and the global fallback. SEO surfaces per-language URLs via `hreflang`
alternates and the sitemap.

**Adding or changing UI copy:**

1. Add the key + English value to the EN dict in `src/lib/i18n.tsx` (and the
   Spanish value to the ES block — the two hand-maintained locales).
2. Run `OPENROUTER_API_KEY=… bun run scripts/translate.ts` to AI-fill the key
   in the other 18 locale files (`scripts/translations/*.json`). The script is
   incremental: it only translates missing keys plus anything in the pending
   ledger (`scripts/translations/.pending.json`, keys whose translation failed
   and were written as EN placeholders — retried automatically on later runs).
   Use `--retranslate-identical` to also re-queue values identical to EN.
3. The strict validator (`bun run i18n:check`, part of `prebuild`) fails the
   build if any key is missing/empty in any locale; the report
   (`i18n-errors.log`) also counts values identical to EN per language as a
   translation-quality warning.

Blog content is published in **en/es/pt** (see `scripts/blog-publish.ts`).

## Project structure

```
src/
├── components/    # Reusable UI components
├── config/        # App configuration
├── hooks/         # Custom React hooks
├── integrations/  # Third-party integrations (e.g. Supabase)
├── lib/           # Shared utilities
├── routes/        # TanStack Router routes
├── sections/      # Page sections
├── services/      # Data/services layer
└── styles.css     # Global styles
```

## Deployment

The app is a server-rendered TanStack Start application, built with Vite and
[Nitro](https://nitro.build/). Nitro auto-detects the deploy target from the
environment, so the same `bun run build` works everywhere:

- **Vercel** (primary target): Nitro detects the `VERCEL` env var and emits a
  [Build Output API v3](https://vercel.com/docs/build-output-api/v3) bundle under
  `.vercel/output/` — no `vercel.json` needed. Configure the Vercel project with
  **Node 22.x**, install command `bun install`, and build command `bun run build`.
- **Local / other Node hosts**: the default `node-server` preset writes a
  standalone server to `.output/`; run it with `node .output/server/index.mjs`.

> Requires Node.js 20.19+ / 22.12+ (Nitro's config loader needs `node:util.parseEnv`).
> The local machine's Node may be older — Vercel uses 22.x.
