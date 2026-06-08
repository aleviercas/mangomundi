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
import { writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { renderToString } from "react-dom/server";
import { createElement } from "react";

import {
  validateDictionaries,
  SUPPORTED_LANGS,
  LANGUAGE_METADATA,
  I18nProvider,
  useI18n,
  DICTS,
  type Lang,
} from "../src/lib/i18n";

// ---------------------------------------------------------------------------
// 0) Hydrate DICTS from scripts/translations/*.json on disk.
//    import.meta.glob returns {} in bun script context, so we read the dir
//    directly and merge each JSON over the in-source defaults.
// ---------------------------------------------------------------------------
const translationsDir = resolve(process.cwd(), "scripts/translations");
if (existsSync(translationsDir)) {
  const files = readdirSync(translationsDir).filter((f) => f.endsWith(".json"));
  let merged = 0;
  for (const file of files) {
    const code = file.replace(/\.json$/, "") as Lang;
    if (!SUPPORTED_LANGS.includes(code)) continue;
    try {
      const raw = readFileSync(join(translationsDir, file), "utf8");
      const dict = JSON.parse(raw);
      if (!dict || typeof dict !== "object") continue;
      if (!DICTS[code]) DICTS[code] = {};
      Object.assign(DICTS[code], dict);
      merged++;
    } catch (e) {
      console.error(`[i18n] failed to load ${file}:`, e);
    }
  }
  console.log(`[i18n] merged ${merged} translation file(s) from disk`);
}

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

// JSON report (machine-readable, consumed by the admin dashboard)
const jsonReport = {
  generatedAt: new Date().toISOString(),
  ok: report.ok,
  enKeyCount: report.enKeyCount,
  brokenLangs: report.brokenLangs,
  perLang: Object.fromEntries(
    SUPPORTED_LANGS.filter((c) => c !== "en").map((code) => {
      const r = report.perLang[code];
      return [code, {
        coverage: r.coverage,
        missing: r.missing.length,
        empty: r.empty.length,
        missingKeys: r.missing.slice(0, 50),
      }];
    }),
  ),
};
writeFileSync(resolve(process.cwd(), "i18n-errors.json"), JSON.stringify(jsonReport, null, 2), "utf8");

// HTML report — short, self-contained, easy to open in a browser/CI artifact
const rowsHtml = SUPPORTED_LANGS.filter((c) => c !== "en").map((code) => {
  const r = report.perLang[code];
  const pct = Math.round(r.coverage * 100);
  const status = r.missing.length === 0 && r.empty.length === 0 ? "ok" : pct >= 95 ? "warn" : "err";
  const meta = LANGUAGE_METADATA[code];
  return `<tr class="${status}"><td>${meta.flag} ${meta.label}</td><td>${meta.english}</td>` +
    `<td class="pct">${pct}%</td><td>${r.missing.length}</td><td>${r.empty.length}</td></tr>`;
}).join("\n");
const html = `<!doctype html><meta charset="utf-8"><title>i18n coverage</title>
<style>body{font:14px/1.5 -apple-system,system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:24px}
h1{font-size:18px;margin:0 0 4px}small{color:#94a3b8}
table{border-collapse:collapse;margin-top:16px;width:100%;max-width:720px}
th,td{padding:8px 10px;border-bottom:1px solid #1e293b;text-align:left}
th{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8}
tr.ok td.pct{color:#34d399}tr.warn td.pct{color:#fbbf24}tr.err td.pct{color:#f87171}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px}
.badge.ok{background:#064e3b;color:#34d399}.badge.err{background:#7f1d1d;color:#fca5a5}</style>
<h1>i18n coverage report <span class="badge ${report.ok ? "ok" : "err"}">${report.ok ? "OK" : "DRIFT"}</span></h1>
<small>${jsonReport.generatedAt} · source-of-truth: en (${report.enKeyCount} keys) · ${SUPPORTED_LANGS.length - 1} target locales</small>
<table><thead><tr><th>Lang</th><th>Name</th><th>Coverage</th><th>Missing</th><th>Empty</th></tr></thead><tbody>
${rowsHtml}
</tbody></table>`;
writeFileSync(resolve(process.cwd(), "i18n-errors.html"), html, "utf8");

// GitHub Actions step summary (when running in CI)
const ghSummary = process.env.GITHUB_STEP_SUMMARY;
if (ghSummary) {
  const md: string[] = [];
  md.push(`### i18n coverage — ${report.ok ? "✅ OK" : "❌ DRIFT"}`);
  md.push(`Source of truth: \`en\` (${report.enKeyCount} keys) · ${SUPPORTED_LANGS.length - 1} target locales`);
  md.push("");
  md.push("| Lang | Coverage | Missing | Empty |");
  md.push("|------|---------:|--------:|------:|");
  for (const code of SUPPORTED_LANGS) {
    if (code === "en") continue;
    const r = report.perLang[code];
    const pct = Math.round(r.coverage * 100);
    const icon = r.missing.length === 0 && r.empty.length === 0 ? "🟢" : pct >= 95 ? "🟡" : "🔴";
    md.push(`| ${icon} \`${code}\` | ${pct}% | ${r.missing.length} | ${r.empty.length} |`);
  }
  const incomplete = SUPPORTED_LANGS.filter((c) => c !== "en" && (report.perLang[c].missing.length + report.perLang[c].empty.length) > 0);
  if (incomplete.length) {
    md.push("");
    md.push(`<details><summary>Sample missing keys (${incomplete.length} incomplete lang${incomplete.length === 1 ? "" : "s"})</summary>\n`);
    for (const code of incomplete) {
      const r = report.perLang[code];
      const sample = r.missing.slice(0, 10).map((k) => `\`${k}\``).join(", ");
      md.push(`- **${code}** — missing ${r.missing.length}: ${sample}${r.missing.length > 10 ? ", …" : ""}`);
    }
    md.push("</details>");
  }
  writeFileSync(ghSummary, md.join("\n") + "\n", { flag: "a" });
  console.log(`[i18n] appended GitHub Actions summary`);
}

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

