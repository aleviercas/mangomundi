/**
 * blog-ingest.ts — upsert hand-authored translations into Supabase blog_posts.
 *
 * Reads a JSON file: { "slug": "...", "translations": { "<locale>": {
 * "title": "...", "excerpt": "...", "content_md": "..." }, ... } }
 *
 * Reuses the existing source row's metadata (audience, vertical, cover_url,
 * published_at) so only the translated text needs to be supplied. Idempotent
 * via on_conflict (slug, locale); published=true.
 *
 * Run: bun run scripts/blog-ingest.ts <file.json>
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFile } from "node:fs/promises";

interface Tr {
  title: string;
  excerpt?: string | null;
  content_md: string;
}
interface Batch {
  slug: string;
  translations: Record<string, Tr>;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: bun run scripts/blog-ingest.ts <file.json>");
    process.exit(1);
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const batch = JSON.parse(await readFile(file, "utf8")) as Batch;

  // Pull the source row's metadata (any existing locale for this slug).
  const metaRes = await fetch(
    `${url}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(batch.slug)}&select=audience,vertical,cover_url,published_at&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const [meta] = (await metaRes.json()) as Array<{
    audience: string;
    vertical: string | null;
    cover_url: string | null;
    published_at: string | null;
  }>;
  if (!meta) throw new Error(`No existing row for slug ${batch.slug} — can't inherit metadata`);

  let ok = 0;
  for (const [locale, tr] of Object.entries(batch.translations)) {
    const row = {
      slug: batch.slug,
      locale,
      title: tr.title,
      excerpt: tr.excerpt ?? null,
      content_md: tr.content_md,
      cover_url: meta.cover_url,
      audience: meta.audience,
      vertical: meta.vertical,
      published: true,
      published_at: meta.published_at ?? new Date().toISOString(),
    };
    const res = await fetch(`${url}/rest/v1/blog_posts?on_conflict=slug,locale`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.error(`  ✗ ${locale}: ${res.status} ${(await res.text()).slice(0, 160)}`);
    } else {
      ok++;
      console.log(`  ✓ ${locale}: "${tr.title.slice(0, 55)}"`);
    }
  }
  console.log(`\nDone. ${batch.slug}: ${ok}/${Object.keys(batch.translations).length} locales`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
