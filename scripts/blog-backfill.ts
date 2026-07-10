/**
 * blog-backfill.ts — translate EXISTING posts into every site language (Gemini).
 *
 * Reads all published rows from Supabase `blog_posts`, groups them by slug, and
 * for each slug fills the MISSING locales (of the 20 site languages) by
 * translating an existing source row (prefers `en`, else the native row) with
 * the Google Gemini API. Idempotent: an existing (slug, locale) is skipped, so
 * the run is safely resumable after any stop.
 *
 * ONE Gemini call per (post, locale) — title + excerpt + full body translated
 * together as JSON — so a full 20×19 backfill is ~380 calls, well inside the
 * free-tier daily cap.
 *
 * Run:
 *   bun run scripts/blog-backfill.ts                 # all posts, all missing locales
 *   bun run scripts/blog-backfill.ts --slug=<slug>   # one post only (validation)
 *   bun run scripts/blog-backfill.ts --limit=2       # first N slugs
 *   bun run scripts/blog-backfill.ts --dry-run       # translate + print, no writes
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
 */
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"] as const;
const api = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish (rioplatense, Argentina)",
  pt: "Portuguese (Brazil)",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  pl: "Polish",
  tr: "Turkish",
  id: "Indonesian",
  vi: "Vietnamese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Simplified Chinese",
  ar: "Arabic",
  hi: "Hindi",
  bn: "Bengali",
  ur: "Urdu",
  th: "Thai",
  tl: "Tagalog (Filipino)",
};
const ALL_LOCALES = Object.keys(LOCALE_NAMES);

interface Row {
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  cover_url: string | null;
  audience: string;
  vertical: string | null;
  published_at: string | null;
}
interface Translated {
  title: string;
  excerpt: string | null;
  content_md: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One Gemini call → { title, excerpt, content_md } in the target language. */
async function translatePost(key: string, target: string, src: Row): Promise<Translated> {
  const langName = LOCALE_NAMES[target];
  const system =
    `You are a professional translator for a fintech blog (FX, cross-border payments, ` +
    `remittances). Translate every field into ${langName}. Keep the brand 'mangomundi' ` +
    `verbatim. In content_md preserve ALL markdown structure (headings, lists, tables, links, ` +
    `code fences), URLs, numbers and ISO currency codes. Natural, fluent, professional register. ` +
    `Return the translation only.`;
  const payload = {
    title: src.title,
    excerpt: src.excerpt ?? "",
    content_md: src.content_md ?? "",
  };
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ parts: [{ text: JSON.stringify(payload) }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          excerpt: { type: "string" },
          content_md: { type: "string" },
        },
        required: ["title", "content_md"],
      },
    },
  };

  let lastErr = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(api(model, key), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 429 || res.status >= 500) {
          lastErr = `${model} ${res.status}`;
          await sleep(4000 * (attempt + 1)); // free tier ~15 RPM → back off
          continue;
        }
        if (!res.ok) {
          lastErr = `${model} ${res.status}: ${(await res.text()).slice(0, 160)}`;
          break; // try next model
        }
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) {
          lastErr = `${model} empty`;
          continue;
        }
        const parsed = JSON.parse(text) as Translated;
        return {
          title: parsed.title,
          excerpt: parsed.excerpt || null,
          content_md: parsed.content_md || null,
        };
      } catch (e) {
        lastErr = `${model} ${(e as Error).message}`;
        await sleep(2000 * (attempt + 1));
      }
    }
  }
  throw new Error(lastErr || "all models failed");
}

async function fetchAll(env: { url: string; key: string }): Promise<Row[]> {
  const res = await fetch(
    `${env.url}/rest/v1/blog_posts?select=slug,locale,title,excerpt,content_md,cover_url,audience,vertical,published_at&published=eq.true`,
    { headers: { apikey: env.key, Authorization: `Bearer ${env.key}` } },
  );
  if (!res.ok) throw new Error(`fetch ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as Row[];
}

async function upsert(env: { url: string; key: string }, row: Record<string, unknown>) {
  const res = await fetch(`${env.url}/rest/v1/blog_posts?on_conflict=slug,locale`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`upsert ${res.status}: ${(await res.text()).slice(0, 250)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlySlug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gkey = process.env.GEMINI_API_KEY;
  if (!url || !key || !gkey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY.");
    process.exit(1);
  }
  const env = { url, key };

  const rows = await fetchAll(env);
  const bySlug = new Map<string, Row[]>();
  for (const r of rows) {
    if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
    bySlug.get(r.slug)!.push(r);
  }

  let slugs = [...bySlug.keys()].sort();
  if (onlySlug) slugs = slugs.filter((s) => s === onlySlug);
  if (limit > 0) slugs = slugs.slice(0, limit);

  console.log(`${slugs.length} slug(s). Model: ${MODELS[0]} (→ ${MODELS[1]} fallback)`);
  let created = 0;
  let failed = 0;

  for (const slug of slugs) {
    const variants = bySlug.get(slug)!;
    const have = new Set(variants.map((v) => v.locale));
    const source = variants.find((v) => v.locale === "en") ?? variants[0];
    const missing = ALL_LOCALES.filter((l) => !have.has(l));
    console.log(`\n▸ ${slug}  (source: ${source.locale}, missing: ${missing.length})`);

    for (const target of missing) {
      try {
        const tr = await translatePost(gkey, target, source);
        if (dryRun) {
          console.log(`   [dry] ${target}: "${tr.title.slice(0, 55)}"`);
        } else {
          await upsert(env, {
            slug,
            locale: target,
            title: tr.title,
            excerpt: tr.excerpt,
            content_md: tr.content_md,
            cover_url: source.cover_url,
            audience: source.audience,
            vertical: source.vertical,
            published: true,
            published_at: source.published_at ?? new Date().toISOString(),
          });
          created++;
          console.log(`   ✓ ${target}: "${tr.title.slice(0, 55)}"`);
        }
        await sleep(1200); // stay under free-tier RPM
      } catch (e) {
        failed++;
        console.error(`   ✗ ${target}: ${(e as Error).message}`);
      }
    }
  }
  console.log(`\nDone. created=${created} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
