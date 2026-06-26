# mangomundi → GitHub + Vercel migration plan

Migrating mangomundi off Lovable. Decisions locked in:
- **AI:** Lovable AI Gateway → **OpenRouter** (keeps multi-provider failover)
- **Hosting:** Cloudflare Workers → **Vercel (SSR)**
- **Backend:** **New Supabase project in our own org** + migrate schema & data (no storage buckets, no edge functions to port)

Progress legend: ⬜ todo · 🔄 in progress · ✅ done

---

## Lovable lock-in surface (analysis)

| # | Layer | Lovable-specific piece | Files |
|---|-------|------------------------|-------|
| 1 | Build tooling | `@lovable.dev/vite-tanstack-config` (wraps tanstackStart, react, tailwind, tsconfig-paths, **Cloudflare build plugin**, Lovable `componentTagger`, env injection, `@` alias) | `vite.config.ts`, `bunfig.toml`, `.lovable/` |
| 2 | Hosting | Built for Cloudflare Workers; `vercel.json` is a wrong SPA rewrite | `wrangler.jsonc`, `vercel.json`, `src/server.ts`, `@cloudflare/vite-plugin` |
| 3 | AI | `https://ai.gateway.lovable.dev` + `LOVABLE_API_KEY` | `aiOrchestrator.ts`, `agent.functions.ts`, `fx.functions.ts`, `scripts/translate.ts` |
| 4 | Backend | Supabase project `eajhhrlhbuzpqiazlmkw` owned by Lovable Cloud. 10 tables + RLS + auth. No storage, no edge fns | `supabase/`, `src/integrations/supabase/` |
| 5 | URLs | `mangomundi.lovable.app` in SEO/og/sitemap/robots (9 files) | routes + `public/robots.txt` |

---

## Phase 0 — Prep & safety net ✅
- [x] GitHub: already at `aleviercas/mangomundi`, `main` in sync (0 ahead/0 behind). **Note:** repo is PUBLIC and owned by `aleviercas` (we have WRITE) — recommend owner sets it private.
- [x] Security check: `.env` was committed in history (commits `e6caf6b`, `9c000ab`) and repo is public, BUT only public-by-design values leaked (Supabase URL/project-id + anon `PUBLISHABLE_KEY`). Service-role key and `LOVABLE_API_KEY` were never committed. Old anon key gets retired in Phase 1 anyway. No history rewrite needed.
- [x] Snapshot: **skipped** by decision — little/no prod data; all 12 schema migrations live in `supabase/migrations/`. No data rollback.
- [x] Secrets to re-provision later: `LOVABLE_API_KEY`→`OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, 6× `SUPABASE_*`/`VITE_SUPABASE_*`, optional FX keys.

## Phase 1 — Own the Supabase backend ✅
- [x] New Supabase project created in our org: ref `ttqalbexpquzobrdyvgx`, region `eu-west-1`, URL `https://ttqalbexpquzobrdyvgx.supabase.co`
- [x] Applied all 12 migrations via `supabase db push` over the IPv4 transaction pooler (direct conn is IPv6-only; network lacks IPv6)
- [x] Data restore: **skipped** (no data worth keeping)
- [x] `auth.users` migration: **skipped** (no users to carry over)
- [x] Updated `supabase/config.toml` `project_id` → new ref
- [x] Updated `.env` (URL, project-id, anon key, **+ new `SUPABASE_SERVICE_ROLE_KEY`**) and `.env.example` (added service-role var)
- [x] Verified: all 10 tables return HTTP 200 via REST; dry-run reports "up to date"
- ⚠️ TODO (security): rotate DB password + service-role key after migration — they passed through chat. Low risk on empty project.
- Supabase CLI installed as standalone binary at `…/scratchpad/supabase` (brew build failed on outdated Xcode)

## Phase 2 — AI: Lovable Gateway → OpenRouter ✅
- [x] Swapped gateway URL → `https://openrouter.ai/api/v1/chat/completions` and key `LOVABLE_API_KEY`→`OPENROUTER_API_KEY` in:
  - `src/services/providers/aiOrchestrator.ts` (orchestrator failover path)
  - `src/lib/agent.functions.ts` (chat agent)
  - `src/lib/fx.functions.ts` (×2 — aiRecommend + chatAboutRecommendation)
  - `scripts/translate.ts` (also replaced Lovable-specific `Lovable-API-Key`/`X-Lovable-AIG-SDK` headers with `Authorization: Bearer`)
- [x] Added `X-Title: mangomundi` header on all calls (OpenRouter attribution; optional)
- [x] Updated `ENV_PLACEHOLDERS`/doc comments in `providers.config.ts`, translate.ts header, and `.env.example` (`OPENROUTER_API_KEY`)
- [x] Verified: zero `LOVABLE_API_KEY` / `ai.gateway.lovable` references remain in `src`/`scripts`
- [x] `OPENROUTER_API_KEY` added to local `.env` (gitignored). Key verified live; `is_free_tier: true`, $0 credits.
- [x] **Switched to free (`:free`) models** to avoid charges (rate-limited ~50 req/day per account until $10+ credits, then ~1000/day; prompts may be logged). Smoke-tested all candidates against the live API:
  - ✅ `openai/gpt-oss-120b:free` — reliable, clean output, good multilingual (ES/PT/EN). **Primary** for the failover chain AND both single-model paths (chat agent, translate script).
  - Fallbacks: `nvidia/nemotron-3-super-120b-a12b:free` (works but leaks reasoning text — last-resort only), `openai/gpt-oss-20b:free`.
  - ❌ Rejected: `qwen/qwen3-next-80b-a3b-instruct:free` and `meta-llama/llama-3.3-70b-instruct:free` — free endpoints consistently returned "Provider returned error".
- Note: free-tier rate limits are **account-wide**, so the failover chain mainly guards transient provider errors, not quota. Upgrade path to paid models (e.g. `anthropic/claude-haiku-4-5`) documented in `providers.config.ts`.
- Note: OpenRouter is OpenAI-compatible, so `{choices:[{message:{content}}]}` parsing and 402/429 handling are unchanged.
- ⚠️ **TODO:** rotate this OpenRouter key before go-live (it passed through chat); add the production key to Vercel in Phase 4.

## Phase 3 — Build & hosting: Cloudflare → Vercel SSR ✅
- [x] Replaced `@lovable.dev/vite-tanstack-config` with a hand-rolled `vite.config.ts` wiring the underlying plugins directly: `tailwindcss`, `tsConfigPaths`, `tanstackStart` (importProtection + `server.entry: "server"`), `nitro` (build-only), `viteReact`. Replicated VITE_* env `define` injection, `@`→`src` alias, React/Query dedupe, lightningcss CSS transformer, optimizeDeps.
- [x] `src/server.ts` **kept as-is** — it's a standard web `fetch` handler wrapping TanStack Start's server entry (runs on Nitro/h3 under any preset, incl. Vercel). The `env`/`ctx` params are passed through; verified no Cloudflare/Workers-specific code in it or the error libs.
- [x] Removed Cloudflare: deleted `wrangler.jsonc`, dropped `@cloudflare/vite-plugin` dependency.
- [x] Deleted the SPA-rewrite `vercel.json` (harmful for SSR). Nitro's Vercel preset emits the correct Build Output API v3 — no `vercel.json` needed.
- [x] Emptied `bunfig.toml` `minimumReleaseAgeExcludes`; deleted `.lovable/`. (`.fallow/` is already gitignored; its `cache.bin` is local-only.)
- [x] Added `lightningcss` as an explicit devDependency (was transitive via the Lovable package).
- [x] Added `.vercel` to `.gitignore`.
- [x] **Verified locally** (under bun runtime, since local Node is 20.11 < required 20.19):
  - `bun run build` → succeeds (i18n validate + vite/nitro build).
  - Default preset → `.output/` node-server bundle; `VERCEL=1`/`NITRO_PRESET=vercel` → `.vercel/output/` Build Output API v3 (asset caching + `/__server.func` SSR fallback). **Vercel auto-detection via the `VERCEL` env var works** — no explicit preset config needed.
  - Runtime SSR smoke test: `GET /`, `/pricing`, `/sitemap.xml` all return HTTP 200; `/` renders 26 KB of real HTML (stylesheet links, not the error page).
- ⚠️ **Vercel project settings (Phase 4):** Node **22.x**, install `bun install`, build `bun run build`. The old local Node (20.11) hits Vite/Nitro version requirements — Vercel's 22.x avoids this. (Optional: install `dotenv` if ever building on Node < 20.12.)
- Note: generated artifacts (`src/routeTree.gen.ts`, `i18n-errors.*`) regenerate on every build and were reverted to keep the commit focused.

## Phase 4 — Vercel project & env vars ⬜
- [ ] Import GitHub repo into Vercel
- [ ] Set env vars (Prod + Preview): Supabase (6) + `OPENROUTER_API_KEY` + optional FX keys
- [ ] Update "Connect Supabase in Lovable Cloud" error strings in 3 integration files

## Phase 5 — Domain & SEO cleanup ⬜
- [ ] Replace `https://mangomundi.lovable.app` → prod domain / `SITE_URL` across 9 files
- [ ] Point custom domain at Vercel

## Phase 6 — Verify ⬜
- [ ] `bun run build` locally with new config
- [ ] `bun run e2e` + `bun run i18n:check`
- [ ] Vercel preview: AI chat, FX quotes, lead forms, auth login, SSR, sitemap/robots
