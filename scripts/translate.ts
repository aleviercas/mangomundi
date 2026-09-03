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
 * Requires the OPENROUTER_API_KEY env var (https://openrouter.ai/keys).
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
  es: "Spanish",
  pt: "Portuguese (Brazil)",
  ru: "Russian",
  tr: "Turkish",
  bn: "Bengali",
  ur: "Urdu",
  zh: "Simplified Chinese",
  pl: "Polish",
  hi: "Hindi",
  tl: "Tagalog (Filipino)",
  vi: "Vietnamese",
  ar: "Arabic",
  de: "German",
  fr: "French",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  id: "Indonesian",
  th: "Thai",
};

const GATEWAY_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:free";
const BATCH_SIZE = 40;
// Re-queue values identical to EN (pre-ledger English placeholders). Usage:
//   bun run scripts/translate.ts --retranslate-identical [langs...]
const RETRANSLATE_IDENTICAL = process.argv.includes("--retranslate-identical");
const FORCE_KEYS = new Set([
  "hero.headline",
  "hero.subheadline.short",
  "seo.home.title",
  "seo.home.description",
  "search.verified",
  "search.noHiddenFees",
  "search.destination",
  "search.destinationPrompt",
  "search.guide",
  "search.promise",
  "chat.welcome",
  "comparator.copilot.agent",
  "footer.tagline",
  "footer.brandLine",
  "comparator.transferDetails",
  "comparator.transferDetails.subtitle",
  "comparator.field.amountMode",
  "comparator.amountMode.send",
  "comparator.amountMode.receive",
  "comparator.field.amountSent",
  "comparator.field.amountReceived",
  "comparator.cta.compareRates",
  "comparator.table.amountSent",
  "comparator.table.bestRate",
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
    "Translate values into the target language while preserving: brand 'mangomundi' verbatim, " +
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
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "mangomundi",
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

// Keys whose translation FAILED and were written with the EN value as a
// placeholder. Without this ledger they'd look "complete" forever (the
// incremental check only queues missing/empty values) and would never be
// retried — permanent English. Each run re-queues a language's pending keys
// and removes the ones that finally got a real translation.
const PENDING_PATH = () => resolve(OUT_DIR, ".pending.json");

async function loadPending(): Promise<Record<string, string[]>> {
  try {
    const raw = await readFile(PENDING_PATH(), "utf8");
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function savePending(pending: Record<string, string[]>): Promise<void> {
  const compact = Object.fromEntries(Object.entries(pending).filter(([, keys]) => keys.length > 0));
  await writeFile(PENDING_PATH(), JSON.stringify(compact, null, 2) + "\n", "utf8");
}

async function translateLang(
  apiKey: string,
  lang: string,
  enDict: Record<string, string>,
  pending: Record<string, string[]>,
): Promise<void> {
  // Incremental: keep prior translations; queue missing/empty keys, FORCE_KEYS,
  // and this language's pending (EN-fallback) keys from previous runs.
  const existing = await loadExisting(lang);
  const pendingSet = new Set(pending[lang] ?? []);

  // Prune: drop keys that no longer exist in the EN source of truth.
  const out: Record<string, string> = {};
  for (const k of Object.keys(enDict)) {
    if (typeof existing[k] === "string") out[k] = existing[k];
  }

  const todo: Array<[string, string]> = [];
  for (const [k, en] of Object.entries(enDict)) {
    const cur = out[k];
    if (
      FORCE_KEYS.has(k) ||
      pendingSet.has(k) ||
      typeof cur !== "string" ||
      cur.trim().length === 0 ||
      // --retranslate-identical: queue values identical to the EN source —
      // usually EN placeholders left by pre-ledger failed runs. Some short
      // strings are legitimately identical; retranslating them is harmless.
      (RETRANSLATE_IDENTICAL && cur === en)
    ) {
      todo.push([k, en]);
    }
  }

  const stillPending = new Set<string>();
  if (todo.length === 0) {
    console.log(`  ${lang}: already complete (${Object.keys(out).length} keys)`);
  } else {
    console.log(`  ${lang}: filling ${todo.length} / ${Object.keys(enDict).length} keys`);
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
        if (typeof v === "string" && v.trim().length > 0) {
          out[k] = v;
        } else {
          // EN placeholder keeps the strict validator green, but the key goes
          // on the pending ledger so the next run retries it.
          if (typeof out[k] !== "string" || out[k].trim().length === 0) out[k] = en;
          stillPending.add(k);
        }
      }
      process.stdout.write(`  ${lang}: ${Math.min(i + BATCH_SIZE, todo.length)}/${todo.length}\r`);
      await new Promise((r) => setTimeout(r, 250));
    }
    process.stdout.write("\n");
  }

  pending[lang] = [...stillPending].sort();
  if (stillPending.size > 0) {
    console.warn(`  ! ${lang}: ${stillPending.size} key(s) fell back to EN — recorded as pending`);
  }

  const path = resolve(OUT_DIR, `${lang}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote ${path}`);
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENROUTER_API_KEY env var.");
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const requested = args.filter((a) => !a.startsWith("--"));
  const langs = requested.length > 0 ? requested : [...TARGET_LANGS];

  const enDict = LIVE_DICTS.en;
  console.log(`→ ${Object.keys(enDict).length} EN keys × ${langs.length} languages`);

  const pending = await loadPending();
  for (const lang of langs) {
    if (lang === "en") continue;
    console.log(`\n→ ${lang} (${LANG_NAMES[lang] ?? "?"})`);
    try {
      await translateLang(apiKey, lang, enDict, pending);
    } catch (err) {
      console.error(`  ✗ ${lang} failed:`, (err as Error).message);
    }
  }
  await savePending(pending);
  console.log(`\nDone. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
