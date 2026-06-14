/**
 * scripts/translate.ts
 *
 * Auto-generates per-language JSON dictionaries from DICTS.en in src/lib/i18n.tsx,
 * using the Lovable AI Gateway. Output is written to scripts/translations/<lang>.json.
 *
 * Fallback policy: if a key fails to translate or the model returns an empty value,
 * the EN canonical string is injected so the UI never breaks.
 *
 * Run:  bun run scripts/translate.ts            # all target languages
 *       bun run scripts/translate.ts es fr ja   # specific languages
 *
 * Requires the LOVABLE_API_KEY env var (auto-provisioned in Lovable projects).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

// Import the LIVE merged dictionary so we translate every key actually used
// in the app (in-source DICTS + all *_KEYS overlays), not just the literal block.
import { DICTS as LIVE_DICTS, SUPPORTED_LANGS } from "../src/lib/i18n";

const ROOT = resolve(import.meta.dir, "..");
const OUT_DIR = resolve(ROOT, "scripts/translations");

// Mirror of SUPPORTED_LANGS minus "en" (en is the source of truth).
const TARGET_LANGS = SUPPORTED_LANGS.filter((l) => l !== "en");

const LANG_NAMES: Record<string, string> = {
  es: "Spanish", pt: "Portuguese (Brazil)", ru: "Russian", tr: "Turkish",
  bn: "Bengali", ur: "Urdu", zh: "Simplified Chinese", pl: "Polish",
  hi: "Hindi", tl: "Tagalog (Filipino)", vi: "Vietnamese", ar: "Arabic",
  de: "German", fr: "French", it: "Italian", ja: "Japanese",
  ko: "Korean", id: "Indonesian", th: "Thai",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const BATCH_SIZE = 40;
const FORCE_KEYS = new Set([
  "hero.headline",
  "hero.subheadline.short",
  "seo.home.title",
  "seo.home.description",
  "search.verified",
  "search.noHiddenFees",
  "comparator.copilot.business.success",
  "about.title",
  "about.metric4.label",
  "about.coverage.eyebrow",
  "about.coverage.title",
  "about.coverage.body",
  "contact.success",
  "contact.error",
]);

async function loadExisting(lang: string): Promise<Record<string, string>> {
  const path = resolve(OUT_DIR, `${lang}.json`);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(await readFile(path, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}



async function translateBatch(
  apiKey: string,
  targetLang: string,
  pairs: Array<[string, string]>,
): Promise<Record<string, string>> {
  const obj: Record<string, string> = Object.fromEntries(pairs);
  const system =
    "You are a professional UI/UX translator for a fintech (FX, cross-border payments, treasury). " +
    "Translate values into the target language while preserving: brand 'mangoglobal' verbatim, " +
    "ICU/markdown/HTML, placeholders like {var}, leading/trailing whitespace, punctuation and emoji. " +
    "Keep tone professional and concise. Return ONLY a valid JSON object with the same keys.";
  const user =
    `Target language: ${LANG_NAMES[targetLang] ?? targetLang} (${targetLang}).\n` +
    `Translate the values of this JSON object. Return JSON with identical keys.\n\n` +
    JSON.stringify(obj);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as Record<string, string>;
  } catch {
    return {};
  }
}

async function translateLang(
  apiKey: string,
  lang: string,
  enDict: Record<string, string>,
): Promise<void> {
  // Incremental: keep any prior translation, only fill missing/empty keys.
  const existing = await loadExisting(lang);
  const out: Record<string, string> = { ...existing };

  const todo: Array<[string, string]> = [];
  for (const [k, en] of Object.entries(enDict)) {
    const cur = out[k];
    if (FORCE_KEYS.has(k) || typeof cur !== "string" || cur.trim().length === 0) todo.push([k, en]);
  }

  if (todo.length === 0) {
    console.log(`  ${lang}: already complete (${Object.keys(out).length} keys)`);
  } else {
    console.log(`  ${lang}: filling ${todo.length} / ${Object.keys(enDict).length} missing keys`);
    for (let i = 0; i < todo.length; i += BATCH_SIZE) {
      const slice = todo.slice(i, i + BATCH_SIZE);
      let translated: Record<string, string> = {};
      try {
        translated = await translateBatch(apiKey, lang, slice);
      } catch (err) {
        console.error(`  ! batch ${i}/${todo.length} failed for ${lang}:`, (err as Error).message);
      }
      for (const [k, en] of slice) {
        const v = translated[k];
        out[k] = typeof v === "string" && v.trim().length > 0 ? v : en;
      }
      process.stdout.write(`  ${lang}: ${Math.min(i + BATCH_SIZE, todo.length)}/${todo.length}\r`);
      await new Promise((r) => setTimeout(r, 250));
    }
    process.stdout.write("\n");
  }

  const path = resolve(OUT_DIR, `${lang}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote ${path}`);
}

async function main() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.error("Missing LOVABLE_API_KEY env var.");
    process.exit(1);
  }
  const requested = process.argv.slice(2);
  const langs = requested.length > 0 ? requested : [...TARGET_LANGS];

  const enDict = LIVE_DICTS.en;
  console.log(`→ ${Object.keys(enDict).length} EN keys × ${langs.length} languages`);

  for (const lang of langs) {
    if (lang === "en") continue;
    console.log(`\n→ ${lang} (${LANG_NAMES[lang] ?? "?"})`);
    try {
      await translateLang(apiKey, lang, enDict);
    } catch (err) {
      console.error(`  ✗ ${lang} failed:`, (err as Error).message);
    }
  }
  console.log(`\nDone. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

