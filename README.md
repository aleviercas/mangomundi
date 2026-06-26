# Mangomundi

A web application built with [TanStack Start](https://tanstack.com/start), React, TypeScript and [Supabase](https://supabase.com/), bundled with [Vite](https://vitejs.dev/) and run with [Bun](https://bun.sh/).

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

## Environment variables

The following variables are required (see `.env.example`):

| Variable                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `SUPABASE_URL`                 | Supabase project URL (server)        |
| `SUPABASE_PROJECT_ID`          | Supabase project ID (server)         |
| `SUPABASE_PUBLISHABLE_KEY`     | Supabase publishable/anon key (server) |
| `VITE_SUPABASE_URL`            | Supabase project URL (client)        |
| `VITE_SUPABASE_PROJECT_ID`     | Supabase project ID (client)         |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Supabase publishable/anon key (client) |

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

The project is configured for deployment on Vercel (`vercel.json`) and Cloudflare (`wrangler.jsonc`).
