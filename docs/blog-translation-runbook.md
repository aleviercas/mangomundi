# Blog translation runbook — finish translating every post into all 20 languages

**For: a Claude Code session continuing this work.** Read this top to bottom, then
pick Method A (automated, needs a working API key) or Method B (by hand). The
goal: every published post in `blog_posts` should exist in **all 20 site
languages**, each a natively-fluent translation with the markdown preserved.

## Current state (2026-07-10)

Posts live in **Supabase** (table `blog_posts`), NOT in the repo. There are **20
distinct posts**, each currently written in ~1 language. **29 of 400** (slug ×
locale) combinations exist — **371 translations remain**.

| slug | has locales | missing |
|---|---|---|
| ai-przyszlosc-zarzadzania-ryzykiem-walutowego | pl | 19 |
| airwallex-payoneer-wise-business-hikaku | ja | 19 |
| cach-tinh-chi-phi-thuc-te-chuyen-tien-do | vi | 19 |
| comparar-proveedores-remesas-latinoamerica | es | 19 |
| costi-nascosti-pagamenti-fornitori-esteri | it | 19 |
| envoyer-argent-afrique-comparer-couts | en, es, fr | 17 |
| eu-gyeoljae-gyuje-gukgyeong-bijeuniseu | ko | 19 |
| fx-risk-management-smes-expanding-internationally | en | 19 |
| muqarana-khayarat-tahwil-alamwal-alsharq-alawsat | ar | 19 |
| negosiasi-kurs-fx-bank-panduan | id | 19 |
| optimizatsiya-oborotnogo-kapitala-transgranichnyh | ru | 19 |
| pagpapadala-pera-pilipinas-gastos-bilis | tl | 19 |
| priapthiap-app-rap-ngoen-jak-tangprathet | th | 19 |
| remittance-arthik-antorvukti-probashi-shromik | bn | 19 |
| sending-money-india-pakistan-comparison | hi | 19 |
| treasury-automatisierung-multi-currency | de, en, es | 17 |
| uluslararasi-buyume-cok-para-birimli-odeme | tr | 19 |
| venezuela-cuba-raqam-bhejna-rehnumai | ur | 19 |
| wise-vs-revolut-business-tesouraria | pt | 19 |
| zhongxiaoqiye-waihui-duichong-celue | de, es, fr, it, pt, zh | 14 |

Run this to get the **live** state at any time (see env vars below):
```bash
set -a; . ./.env; set +a
curl -s "$SUPABASE_URL/rest/v1/blog_posts?select=slug,locale&published=eq.true" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## The 20 site languages

`en es pt fr de it ru pl tr id vi ja ko zh ar hi bn ur th tl`

Conventions to respect when translating:
- **es** → Spanish, **rioplatense (Argentina)** — "vos", "compará", "fijate".
- **pt** → Portuguese (Brazil).
- **zh** → Simplified Chinese. **ar/ur** are RTL (the site handles direction; just translate).
- Keep the brand **`mangomundi`** verbatim, never translate it.

## Data model — `blog_posts`

One row per **(slug, locale)**; `UNIQUE(slug, locale)`. Columns you write:
`slug, locale, title, excerpt, content_md, cover_url, audience, vertical,
published (=true), published_at`. The listing (`/blog`) shows only posts that
have a row for the visitor's locale; the post page (`/blog/<slug>`) falls back to
`en` for direct links. So **more locales = more posts visible per market**.

`content_md` is Markdown. **Preserve ALL structure**: headings (`##`), lists,
**tables**, links, bold/italic, and any code — plus URLs, numbers and ISO
currency codes. Translate the prose only.

## Env vars (already in `.env`, gitignored)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — required for both methods.
`GEMINI_API_KEY` or `OPENROUTER_API_KEY` — only for Method A.

---

## Method A — automated (fast: ~30 min for everything)

Uses `scripts/blog-backfill.ts` — reads all posts, translates every missing
locale, upserts. **Idempotent + resumable** (existing (slug,locale) is skipped),
so just re-run if it stops.

It needs a **working translation gateway**. Two gotchas we hit:
1. **Google Gemini**: the key MUST be a permanent API key that starts with
   **`AIza…`** (from https://aistudio.google.com/apikey → "Create API key").
   Tokens starting with **`AQ.`** are *ephemeral* (~30 min TTL, Live-API scoped)
   and will fail mid-run — do NOT use those. Put it in `.env` as
   `GEMINI_API_KEY=AIza…`. The script defaults to `gemini-2.0-flash`; if that
   returns 429 "quota", the project needs a model with free-tier quota or billing
   enabled (cost for the whole job is well under US$1).
2. **OpenRouter**: `OPENROUTER_API_KEY` is present but the account had **$0
   credit** and the free models were rate-limited/unavailable. Add ~US$1 of
   credit, then point the script at OpenRouter (swap the `MODELS` array + the
   `fetch` URL/headers back to the OpenRouter shape used in
   `scripts/blog-publish.ts`) and use a cheap-good model like
   `google/gemini-2.0-flash-001` or `openai/gpt-4o-mini`.

Run:
```bash
set -a; . ./.env; set +a
bun run scripts/blog-backfill.ts --slug=<one-slug>   # validate on one post first
bun run scripts/blog-backfill.ts                     # then everything
```
Spot-check quality afterwards (open a few `/blog/<slug>?lang=xx`).

---

## Method B — by hand with Claude (no gateway, free, higher quality, slower)

This is how the first post was done. Work **one post per batch**:

1. **Fetch the source** (prefer an `en` row; else the native one):
   ```bash
   set -a; . ./.env; set +a
   curl -s "$SUPABASE_URL/rest/v1/blog_posts?slug=eq.<SLUG>&select=locale,title,excerpt,content_md" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```
2. **Translate** the `title`, `excerpt` and `content_md` into each missing locale
   yourself (Claude). Keep markdown structure, tables, `mangomundi`, numbers and
   currency codes intact. Natural, professional fintech register.
3. **Write a batch JSON** and ingest it with `scripts/blog-ingest.ts`:
   ```json
   {
     "slug": "<SLUG>",
     "translations": {
       "fr": { "title": "…", "excerpt": "…", "content_md": "…full markdown…" },
       "de": { "title": "…", "excerpt": "…", "content_md": "…" }
     }
   }
   ```
   ```bash
   set -a; . ./.env; set +a
   bun run scripts/blog-ingest.ts /tmp/batch.json
   ```
   `blog-ingest.ts` inherits `audience/vertical/cover_url/published_at` from the
   existing row and upserts each locale as `published=true` via
   `on_conflict=slug,locale` (safe to re-run).

   > JSON note: `content_md` must be a valid JSON string (escaped newlines). If
   > hand-writing JSON is fiddly, write a throwaway `scripts/_batch.ts` instead
   > that holds the translations as **template literals** (backticks) and upserts
   > directly — that was used for the first post. Delete it after running. Watch
   > out for backticks/`${` inside the markdown if you do this.

4. **Verify** it rendered:
   ```bash
   curl -s "https://mangomundi.com/blog/<SLUG>?lang=fr" | grep -o "<title>[^<]*"
   ```
   (No deploy needed — the blog reads Supabase live.)

## Notes

- **Don't re-translate** locales that already exist (see the state table / live
  query) — both methods skip them, but check first to save work.
- Once posts are multilingual, the sitemap + hreflang already cover all 20 langs
  (that plumbing was done). No code change needed to surface them.
- Optional: generalize `scripts/blog-publish.ts` (`LOCALES` is still `en/es/pt`)
  to all 20 so **future** posts auto-translate on publish.
