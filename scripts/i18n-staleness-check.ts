/**
 * i18n-staleness-check — catches the class of bug found 2026-09-07:
 * translations that exist (so i18n-validate.ts's "incomplete" check is
 * happy) but are WRONG in one of three ways that plain key-presence can
 * never detect:
 *
 *   1. STALE — the translation is a real, coherent sentence in the target
 *      language, but it was translated from an OLDER version of the EN
 *      source that has since changed in code. The key is "complete" but
 *      the meaning has drifted from what EN currently says.
 *      (Found this way: footer.tagline, home.hero.tagline,
 *      home.hero.headline, comparator.copilot.business.email/.consent —
 *      EN was edited after the translation pass and nobody re-ran it.)
 *
 *   2. UNTRANSLATED — the "translation" is just the EN string copy-pasted
 *      into the JSON as a placeholder and never actually translated.
 *      (Found this way: 187 keys across comparator.tab, comparator.row,
 *      comparator.filters, etc. — untranslated in 8-19 of 19 languages
 *      simultaneously.)
 *
 *   3. WRONG LANGUAGE ENTIRELY — a value in a non-Latin-script language
 *      (ar/bn/hi/ja/ko/ru/th/ur/zh) that's actually plain English/Latin
 *      text, not a translation at all.
 *      (Found this way: ur.json had 46 keys — the entire RFQ flow, the
 *      chat wizard, the rate-alert form — sitting in raw English.)
 *
 * HOW STALENESS DETECTION WORKS (the part i18n-validate.ts can't do):
 * `scripts/translations/.source-hashes.json` is a baseline snapshot —
 * one sha256 hash per EN key, taken the last time someone confirmed the
 * translations for that key were in sync with EN. Every run of this
 * script recomputes the hash of the CURRENT EN value and compares it to
 * the baseline. A mismatch means EN changed since the last confirmed
 * translation pass — every language's value for that key is now suspect,
 * even though none of them are technically "missing". This is the piece
 * that actually prevents recurrence: without it, an EN copy edit is
 * invisible to every other check in this repo.
 *
 * Usage:
 *   bun run scripts/i18n-staleness-check.ts              # report only
 *   bun run scripts/i18n-staleness-check.ts --ci          # same, but exits 1 on findings (wire into prebuild)
 *   bun run scripts/i18n-staleness-check.ts --update-baseline
 *       Re-snapshots EVERY key's current EN hash as "confirmed in sync".
 *       Run this ONLY after actually reviewing/updating translations for
 *       whatever this script flagged — never as a way to silence it
 *       without doing the translation work, since that just hides the
 *       next real drift too.
 */
import { createHash } from "node:crypto";
import { writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

import { DICTS, SUPPORTED_LANGS, type Lang } from "../src/lib/i18n";

const ROOT = resolve(process.cwd());
const TR_DIR = resolve(ROOT, "scripts/translations");
const BASELINE_PATH = resolve(TR_DIR, ".source-hashes.json");
const REPORT_PATH = resolve(ROOT, "i18n-staleness-report.log");

const args = process.argv.slice(2);
const CI_MODE = args.includes("--ci");
const UPDATE_BASELINE = args.includes("--update-baseline");

// ---------------------------------------------------------------------------
// 0) Hydrate DICTS from scripts/translations/*.json, same as i18n-validate.ts.
// ---------------------------------------------------------------------------
const data: Record<string, Record<string, string>> = { en: DICTS.en as Record<string, string> };
if (existsSync(TR_DIR)) {
  for (const file of readdirSync(TR_DIR)) {
    if (!file.endsWith(".json") || file.startsWith(".")) continue;
    const lang = file.replace(/\.json$/, "");
    if (!SUPPORTED_LANGS.includes(lang as Lang)) continue;
    try {
      data[lang] = JSON.parse(readFileSync(join(TR_DIR, file), "utf8"));
    } catch (e) {
      console.error(`[i18n-staleness] failed to parse ${file}:`, e);
      process.exit(1);
    }
  }
}

const enDict = data.en;
const langs = Object.keys(data).filter((l) => l !== "en");

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// 1) --update-baseline: snapshot every EN key's current hash and stop.
// ---------------------------------------------------------------------------
if (UPDATE_BASELINE) {
  const baseline: Record<string, string> = {};
  for (const [k, v] of Object.entries(enDict)) {
    if (typeof v === "string") baseline[k] = sha256(v);
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`[i18n-staleness] baseline updated — ${Object.keys(baseline).length} keys snapshotted.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2) Staleness — EN hash doesn't match the last-confirmed baseline.
// ---------------------------------------------------------------------------
const baseline: Record<string, string> = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
  : {};

const staleKeys: string[] = [];
for (const [k, v] of Object.entries(enDict)) {
  if (typeof v !== "string") continue;
  const current = sha256(v);
  const baselined = baseline[k];
  if (baselined !== current) staleKeys.push(k);
}

// ---------------------------------------------------------------------------
// 3) Untranslated — value identical to EN, shared across many languages.
//    (A single language matching EN is often legitimate — a shared proper
//    noun, a number, an intentionally-Latin placeholder like an email
//    example. Many languages agreeing with EN word-for-word on a real
//    sentence is not.)
// ---------------------------------------------------------------------------
const UNTRANSLATED_THRESHOLD = 8;
// Same idea as SCRIPT_CHECK_ALLOWLIST above — legitimately identical
// across languages (numbers, a product tier's brand-ish name and its
// price, loanwords like "Blog"/"Widget" that are the same word in many
// of these languages, email placeholder formats, technical tokens).
const UNTRANSLATED_ALLOWLIST = new Set([
  "nav.blog",
  "brand.blog",
  "home.blog.eyebrow",
  "home.widget.eyebrow",
  "retail.emailPlaceholder",
  "comparator.business.request.emailPlaceholder",
  "comingSoon.emailPlaceholder",
  "about.metric1.value",
  "about.metric2.value",
  "about.metric3.value",
  "home.widget.tab.iframe",
  "rfq.requestId",
  "pricing.pro.name",
  "pricing.pro.price",
  "platform.road.s4.s",
  "platform.road.s5.s",
]);
const untranslated: { key: string; count: number; langs: string[] }[] = [];
for (const [k, enVal] of Object.entries(enDict)) {
  if (UNTRANSLATED_ALLOWLIST.has(k)) continue;
  if (typeof enVal !== "string" || enVal.length <= 2) continue;
  const matching = langs.filter((l) => data[l]?.[k] === enVal);
  if (matching.length >= UNTRANSLATED_THRESHOLD) {
    untranslated.push({ key: k, count: matching.length, langs: matching });
  }
}

// ---------------------------------------------------------------------------
// 4) Wrong script — a non-Latin-script language whose value is mostly
//    ASCII/Latin letters (i.e., plain English/Latin text sitting where a
//    translation should be).
// ---------------------------------------------------------------------------
const SCRIPT_RANGES: Partial<Record<Lang, [number, number][]>> = {
  ar: [[0x0600, 0x06ff], [0x0750, 0x077f], [0x08a0, 0x08ff], [0xfb50, 0xfdff], [0xfe70, 0xfeff]],
  ur: [[0x0600, 0x06ff], [0x0750, 0x077f], [0x08a0, 0x08ff], [0xfb50, 0xfdff], [0xfe70, 0xfeff]],
  bn: [[0x0980, 0x09ff]],
  hi: [[0x0900, 0x097f]],
  zh: [[0x4e00, 0x9fff], [0x3400, 0x4dbf]],
  ja: [[0x3040, 0x30ff], [0x4e00, 0x9fff]],
  ko: [[0xac00, 0xd7a3], [0x1100, 0x11ff]],
  th: [[0x0e00, 0x0e7f]],
  ru: [[0x0400, 0x04ff]],
};

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

function inExpectedScript(text: string, ranges: [number, number][]): boolean {
  for (const ch of text) {
    if (!isLetter(ch)) continue;
    const cp = ch.codePointAt(0)!;
    if (ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}

function mostlyAsciiLetters(text: string): boolean {
  const letters = [...text].filter(isLetter);
  if (letters.length === 0) return false;
  const ascii = letters.filter((c) => c.codePointAt(0)! < 128);
  return ascii.length / letters.length > 0.6;
}

const wrongScript: { lang: string; key: string; value: string }[] = [];
// A handful of keys are CORRECTLY identical across every language on
// purpose — not a translation gap. Example placeholders in a Latin
// email format (nobody localizes "you@company.com"), and literal
// technical tokens (an HTML tag name, an API field name) that are not
// natural-language content at all. Excluded here so the report stays
// high-signal instead of re-flagging the same known-fine keys forever.
const SCRIPT_CHECK_ALLOWLIST = new Set([
  "comingSoon.emailPlaceholder",
  "comparator.business.request.emailPlaceholder",
  "contact.workEmailPlaceholder",
  "retail.emailPlaceholder",
  "home.widget.tab.iframe",
  "rfq.requestId",
]);
for (const [lang, ranges] of Object.entries(SCRIPT_RANGES)) {
  const dict = data[lang];
  if (!dict) continue;
  for (const [k, v] of Object.entries(dict)) {
    if (SCRIPT_CHECK_ALLOWLIST.has(k)) continue;
    if (typeof v !== "string" || v.length < 6) continue;
    if (mostlyAsciiLetters(v) && !inExpectedScript(v, ranges!)) {
      wrongScript.push({ lang, key: k, value: v });
    }
  }
}

// ---------------------------------------------------------------------------
// 5) Report + exit code
// ---------------------------------------------------------------------------
const lines: string[] = [];
lines.push(`# i18n staleness report`);
lines.push(`generated: ${new Date().toISOString()}`);
lines.push("");
lines.push(`## 1) Stale (EN changed since last confirmed translation pass): ${staleKeys.length}`);
lines.push(
  `These keys exist in every language, but EN's current text no longer matches the ` +
    `hash on file in .source-hashes.json — someone edited the EN copy without re-running ` +
    `translations for it. Review + retranslate, then run --update-baseline.`,
);
for (const k of staleKeys) lines.push(`  - ${k}  (EN: ${JSON.stringify(enDict[k]).slice(0, 90)})`);
lines.push("");
lines.push(`## 2) Untranslated (EN copy-pasted into ${UNTRANSLATED_THRESHOLD}+ languages): ${untranslated.length}`);
for (const { key, count, langs: ls } of untranslated) {
  lines.push(`  - ${key}  (${count}/${langs.length} langs: ${ls.join(", ")})`);
}
lines.push("");
lines.push(`## 3) Wrong script (Latin/English text in a non-Latin-script language): ${wrongScript.length}`);
for (const { lang, key, value } of wrongScript) {
  lines.push(`  - [${lang}] ${key}  ->  ${JSON.stringify(value).slice(0, 90)}`);
}
lines.push("");

writeFileSync(REPORT_PATH, lines.join("\n") + "\n");

const totalIssues = staleKeys.length + untranslated.length + wrongScript.length;
console.log(`[i18n-staleness] stale: ${staleKeys.length}, untranslated: ${untranslated.length}, wrong-script: ${wrongScript.length}`);
console.log(`[i18n-staleness] full report → ${REPORT_PATH}`);

if (!existsSync(BASELINE_PATH)) {
  console.log(
    `[i18n-staleness] no baseline found at ${BASELINE_PATH} — every key reports as "stale" ` +
      `until you run --update-baseline once to establish one.`,
  );
}

if (totalIssues > 0) {
  if (CI_MODE) {
    console.error(`[i18n-staleness] FAILED — ${totalIssues} issue(s) found. See ${REPORT_PATH}.`);
    process.exit(1);
  } else {
    console.warn(`[i18n-staleness] ${totalIssues} issue(s) found — not failing (no --ci flag).`);
  }
} else {
  console.log(`[i18n-staleness] OK — no issues found.`);
}
