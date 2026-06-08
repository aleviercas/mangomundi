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
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const I18N_PATH = resolve(ROOT, "src/lib/i18n.tsx");
const OUT_DIR = resolve(ROOT, "scripts/translations");

// Mirror of SUPPORTED_LANGS minus "en" (en is the source of truth).
const TARGET_LANGS = [
  "es", "pt", "ru", "tr", "bn", "ur", "zh", "pl", "hi",
  "tl", "vi", "ar", "de", "fr", "it", "ja", "ko", "id", "th",
] as const;

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

async function extractEnDict(): Promise<Record<string, string>> {
  // Parse DICTS.en out of i18n.tsx by isolating the first `en: { ... }` block.
  const src = await readFile(I18N_PATH, "utf8");
  const start = src.indexOf("const DICTS:");
  if (start === -1) throw new Error("Could not find `const DICTS:` in i18n.tsx");
  const enIdx = src.indexOf("en: {", start);
  if (enIdx === -1) throw new Error("Could not find `en: {` in DICTS");
  // Walk braces to find matching `}`
  let depth = 0;
  let i = enIdx + "en: ".length;
  let openIdx = -1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      if (depth === 0) openIdx = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const block = src.slice(openIdx, i + 1);
        // Evaluate as a JS object literal (no top-level imports allowed).
        // Use Function to avoid require/eval and module scope leakage.
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const dict = new Function(`return (${block});`)() as Record<string, string>;
        return dict;
      }
    }
  }
  throw new Error("Failed to parse DICTS.en block");
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
  const entries = Object.entries(enDict);
  const out: Record<string, string> = {};

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const slice = entries.slice(i, i + BATCH_SIZE);
    let translated: Record<string, string> = {};
    try {
      translated = await translateBatch(apiKey, lang, slice);
    } catch (err) {
      console.error(`  ! batch ${i}/${entries.length} failed for ${lang}:`, (err as Error).message);
    }
    // Inject EN fallback for any missing/empty key.
    for (const [k, en] of slice) {
      const v = translated[k];
      out[k] = typeof v === "string" && v.trim().length > 0 ? v : en;
    }
    process.stdout.write(`  ${lang}: ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length}\r`);
    await new Promise((r) => setTimeout(r, 350));
  }

  const path = resolve(OUT_DIR, `${lang}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`\n  ✓ wrote ${path}`);
}

async function main() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.error("Missing LOVABLE_API_KEY env var.");
    process.exit(1);
  }
  const requested = process.argv.slice(2);
  const langs = requested.length > 0 ? requested : [...TARGET_LANGS];

  console.log(`→ Loading EN dictionary from ${I18N_PATH}`);
  const enDict = await extractEnDict();
  console.log(`→ ${Object.keys(enDict).length} keys to translate × ${langs.length} languages`);

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
