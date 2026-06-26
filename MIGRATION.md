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
- ⚠️ **TODO before go-live:** add real `OPENROUTER_API_KEY` to local `.env` and Vercel. App still needs the key to work.
- ⚠️ **Model slugs:** `providers.config.ts` uses `google/gemini-3-flash-preview`, `google/gemini-2.5-flash`, `openai/gpt-5-mini`; `agent.functions.ts` + `translate.ts` hardcode `google/gemini-3-flash-preview`. OpenRouter uses the same `provider/model` convention, but **each slug must be confirmed against https://openrouter.ai/models** — the orchestrator path fails over if one 404s, but the single-model chat/translate paths do not. Test once the key is added.
- Note: OpenRouter is OpenAI-compatible, so the `{choices:[{message:{content}}]}` parsing and 402/429 handling are unchanged.

## Phase 3 — Build & hosting: Cloudflare → Vercel SSR ⬜
- [ ] Replace `@lovable.dev/vite-tanstack-config` with hand-rolled `vite.config.ts` (tanstackStart w/ Nitro **vercel** preset, react, tailwind, tsconfig-paths)
- [ ] Remove Cloudflare: delete `wrangler.jsonc`, drop `@cloudflare/vite-plugin`, rework `src/server.ts` error wrapper for Nitro/Vercel
- [ ] Replace `vercel.json` with TanStack Start Vercel output config
- [ ] Remove Lovable entry in `bunfig.toml`; delete `.lovable/` and `.fallow/`
- [ ] Confirm Bun-package-manager + Node-runtime on Vercel; set build cmd

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
