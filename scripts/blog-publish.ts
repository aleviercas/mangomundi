/**
 * blog-publish.ts — systematic multilingual blog publishing (en/es/pt).
 *
 * Takes a markdown file with YAML-ish frontmatter, inserts the source-locale
 * row into Supabase `blog_posts`, AI-translates title/excerpt/content to the
 * other two locales via OpenRouter, and inserts those as DRAFTS
 * (published=false) for human review. Use --publish-all to publish the
 * translations immediately.
 *
 * Frontmatter (--- delimited, key: value):
 *   slug: how-to-send-money-to-argentina   (required)
 *   title: How to send money to Argentina  (required)
 *   locale: en                             (source locale; default en)
 *   excerpt: One-line summary…             (optional)
 *   cover_url: https://…                   (optional)
 *   audience: retail | business | both     (default both)
 *
 * Run:
 *   bun run scripts/blog-publish.ts posts/my-post.md [--publish-all] [--dry-run]
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY.
 */
import { readFile } from "node:fs/promises";

const GATEWAY_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:free";
const LOCALES = ["en", "es", "pt"] as const;
type Locale = (typeof LOCALES)[number];
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Spanish (rioplatense)",
  pt: "Portuguese (Brazil)",
};

interface FrontMatter {
  slug: string;
  title: string;
  locale: Locale;
  excerpt?: string;
  cover_url?: string;
  audience: string;
}

function parseFrontmatter(raw: string): { fm: FrontMatter; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error("Missing frontmatter block (--- … ---)");
  const fields: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  if (!fields.slug || !fields.title) throw new Error("Frontmatter needs slug and title");
  const locale = (fields.locale ?? "en") as Locale;
  if (!LOCALES.includes(locale)) throw new Error(`locale must be one of ${LOCALES.join("/")}`);
  return {
    fm: {
      slug: fields.slug,
      title: fields.title,
      locale,
      excerpt: fields.excerpt || undefined,
      cover_url: fields.cover_url || undefined,
      audience: fields.audience || "both",
    },
    body: m[2].trim(),
  };
}

async function callModel(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "mangomundi",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("empty model response");
  return text;
}

/** Translate markdown chunked by top-level sections to stay inside limits. */
async function translateMarkdown(apiKey: string, target: Locale, md: string): Promise<string> {
  const system =
    `You are a professional translator for a fintech blog (FX, cross-border payments). ` +
    `Translate the user's markdown into ${LOCALE_NAMES[target]}. Preserve the brand ` +
    `'mangomundi' verbatim, all markdown structure (headings, lists, links, code), URLs, ` +
    `numbers and currency codes. Return ONLY the translated markdown, no commentary.`;
  // Chunk on H2 boundaries; a whole-post chunk if none.
  const sections = md.split(/(?=^## )/m).filter((s) => s.trim().length > 0);
  const out: string[] = [];
  for (const section of sections) {
    out.push(await callModel(apiKey, system, section));
    await new Promise((r) => setTimeout(r, 300));
  }
  return out.join("\n\n");
}

async function translateLine(apiKey: string, target: Locale, text: string): Promise<string> {
  const system =
    `Translate into ${LOCALE_NAMES[target]} for a fintech blog. Preserve 'mangomundi' ` +
    `verbatim. Return ONLY the translation.`;
  return callModel(apiKey, system, text);
}

async function upsertPost(
  env: { url: string; key: string },
  row: Record<string, unknown>,
): Promise<void> {
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
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const publishAll = args.includes("--publish-all");
  const dryRun = args.includes("--dry-run");
  if (!file) {
    console.error("Usage: bun run scripts/blog-publish.ts <post.md> [--publish-all] [--dry-run]");
    process.exit(1);
  }
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY || !OPENROUTER_KEY) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OPENROUTER_API_KEY.");
    process.exit(1);
  }
  const env = { url: SUPABASE_URL, key: SERVICE_KEY };

  const raw = await readFile(file, "utf8");
  const { fm, body } = parseFrontmatter(raw);
  console.log(`→ ${fm.slug} (source: ${fm.locale}) — "${fm.title}"`);

  const now = new Date().toISOString();
  const sourceRow = {
    slug: fm.slug,
    locale: fm.locale,
    title: fm.title,
    excerpt: fm.excerpt ?? null,
    content_md: body,
    cover_url: fm.cover_url ?? null,
    audience: fm.audience,
    published: true,
    published_at: now,
  };

  if (dryRun) console.log("  [dry-run] source row ready");
  else {
    await upsertPost(env, sourceRow);
    console.log(`  ✓ source ${fm.locale} published`);
  }

  for (const target of LOCALES) {
    if (target === fm.locale) continue;
    console.log(`  translating → ${target}…`);
    try {
      const [title, excerpt, content] = await Promise.all([
        translateLine(OPENROUTER_KEY, target, fm.title),
        fm.excerpt ? translateLine(OPENROUTER_KEY, target, fm.excerpt) : Promise.resolve(null),
        translateMarkdown(OPENROUTER_KEY, target, body),
      ]);
      const row = {
        ...sourceRow,
        locale: target,
        title,
        excerpt,
        content_md: content,
        published: publishAll,
        published_at: publishAll ? now : null,
      };
      if (dryRun) console.log(`  [dry-run] ${target}: "${title}"`);
      else {
        await upsertPost(env, row);
        console.log(
          `  ✓ ${target} ${publishAll ? "published" : "inserted as DRAFT (review + set published=true)"}`,
        );
      }
    } catch (err) {
      console.error(`  ✗ ${target} failed: ${(err as Error).message} — publish it manually later`);
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
