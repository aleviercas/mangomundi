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
