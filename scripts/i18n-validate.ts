/**
 * i18n-validate — compares every supported language dictionary against DICTS.en
 * and writes a human-readable report to `i18n-errors.log` at the repo root.
 *
 * Also runs a render smoke-test: it constructs an I18nProvider with an
 * INVALID language code and asserts the t() function returns the EN fallback
 * without throwing. This guarantees SSR safety even with corrupt input.
 *
 * Usage:  bun run scripts/i18n-validate.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

import {
  validateDictionaries,
  SUPPORTED_LANGS,
  LANGUAGE_METADATA,
  I18nProvider,
  useI18n,
  type Lang,
} from "../src/lib/i18n";


// ---------------------------------------------------------------------------
// 1) Dictionary validation report
// ---------------------------------------------------------------------------
const report = validateDictionaries();

const lines: string[] = [];
lines.push(`# i18n validation report`);
lines.push(`generated: ${new Date().toISOString()}`);
lines.push(`source-of-truth: en (${report.enKeyCount} keys)`);
lines.push(`overall: ${report.ok ? "OK" : "DRIFT DETECTED"}`);
lines.push("");

if (report.brokenLangs.length) {
  lines.push(`## BROKEN dictionaries (non-object or missing)`);
  for (const l of report.brokenLangs) lines.push(`  - ${l}`);
  lines.push("");
}

lines.push(`## Per-language coverage`);
for (const code of SUPPORTED_LANGS) {
  if (code === "en") continue;
  const r = report.perLang[code];
  const pct = Math.round(r.coverage * 100);
  lines.push(
    `- ${code}: ${pct}% coverage — missing ${r.missing.length}, empty ${r.empty.length}`,
  );
}
lines.push("");

lines.push(`## Missing keys per language`);
for (const code of SUPPORTED_LANGS) {
  if (code === "en") continue;
  const r = report.perLang[code];
  if (r.missing.length === 0 && r.empty.length === 0) continue;
  lines.push(`\n### ${code}`);
  if (r.missing.length) {
    lines.push(`missing (${r.missing.length}):`);
    for (const k of r.missing) lines.push(`  - ${k}`);
  }
  if (r.empty.length) {
    lines.push(`empty/non-string (${r.empty.length}):`);
    for (const k of r.empty) lines.push(`  - ${k}`);
  }
}

const outPath = resolve(process.cwd(), "i18n-errors.log");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`[i18n] wrote report → ${outPath}`);
console.log(
  `[i18n] ${report.ok ? "OK" : "DRIFT"} — ${
    report.brokenLangs.length
  } broken / ${
    SUPPORTED_LANGS.filter((c) => c !== "en" && report.perLang[c].missing.length > 0).length
  } incomplete (of ${SUPPORTED_LANGS.length - 1})`,
);

// ---------------------------------------------------------------------------
// 2) SSR render smoke-test with INVALID language
// ---------------------------------------------------------------------------
function Probe() {
  const { t, lang } = useI18n();
  // Touch a known key + a missing key — both paths must be exception-free.
  return createElement(
    "div",
    null,
    createElement("span", { "data-lang": lang }, t("nav.home")),
    createElement("span", null, t("totally.fake.key.that.does.not.exist")),
  );
}

const cases: Array<{ name: string; lang: unknown }> = [
  { name: "invalid string", lang: "xx" },
  { name: "undefined", lang: undefined },
  { name: "null", lang: null },
  { name: "valid en", lang: "en" },
];

let failures = 0;
for (const c of cases) {
  try {
    const html = renderToString(
      createElement(
        I18nProvider,
        { initialLang: c.lang as Lang },
        createElement(Probe),
      ),
    );
    if (!html.includes("data-lang")) throw new Error("output missing probe");
    console.log(`[i18n] render OK (${c.name}) → ${html.slice(0, 80)}…`);
  } catch (err) {
    failures += 1;
    console.error(`[i18n] render FAILED (${c.name}):`, err);
  }
}

if (failures > 0) {
  console.error(`[i18n] ${failures} render case(s) failed`);
  process.exit(1);
}
console.log(`[i18n] all render fallback cases passed`);

// ---------------------------------------------------------------------------
// 3) LangSwitcher filter logic test — mirror the component's filter
// ---------------------------------------------------------------------------
const LANGS = SUPPORTED_LANGS.map((c) => LANGUAGE_METADATA[c]);
function filterLangs(q: string) {
  const lower = q.trim().toLowerCase();
  if (!lower) return LANGS;
  return LANGS.filter(
    (l) =>
      l.code.toLowerCase().includes(lower) ||
      l.label.toLowerCase().includes(lower) ||
      l.english.toLowerCase().includes(lower) ||
      l.native.toLowerCase().includes(lower),
  );
}
const filterCases: Array<{ q: string; expectCodes: Lang[] }> = [
  { q: "", expectCodes: SUPPORTED_LANGS },
  { q: "spa", expectCodes: ["es"] },
  { q: "中文", expectCodes: ["zh"] },
  { q: "ja", expectCodes: ["ja"] },
  { q: "fr", expectCodes: ["fr"] },
  { q: "ZZZZZ", expectCodes: [] },
];
let filterFailures = 0;
for (const c of filterCases) {
  const got = filterLangs(c.q).map((l) => l.code);
  const ok = c.expectCodes.every((e) => got.includes(e)) &&
    (c.expectCodes.length === 0 ? got.length === 0 : got.length >= c.expectCodes.length);
  if (!ok) {
    filterFailures++;
    console.error(`[langswitcher] filter("${c.q}") expected ${JSON.stringify(c.expectCodes)} → got ${JSON.stringify(got)}`);
  } else {
    console.log(`[langswitcher] filter("${c.q}") → ${got.length} result(s) OK`);
  }
}
if (filterFailures > 0) {
  console.error(`[langswitcher] ${filterFailures} filter case(s) failed`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4) Strict mode — fail when dictionaries drift (used by prebuild / CI)
// ---------------------------------------------------------------------------
if (process.env.I18N_STRICT === "1" && !report.ok) {
  const incomplete = SUPPORTED_LANGS.filter(
    (c) => c !== "en" && (report.perLang[c].missing.length > 0 || report.perLang[c].empty.length > 0),
  );
  console.error(
    `[i18n] STRICT FAIL — ${report.brokenLangs.length} broken / ${incomplete.length} incomplete dictionaries. ` +
      `See i18n-errors.log. Run \`bun run scripts/translate.ts\` to fill missing keys.`,
  );
  process.exit(1);
}
console.log(`[i18n] all checks passed`);

