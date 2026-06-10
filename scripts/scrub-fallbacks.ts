import { DICTS, SUPPORTED_LANGS } from "../src/lib/i18n";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const en = DICTS.en;
const SKIP = new Set(["RFQ","FX","AI","API","OK","EN","ES","PT","URL","SDK"]);
const dir = resolve("scripts/translations");
for (const lang of SUPPORTED_LANGS.filter(l => l !== "en")) {
  const path = `${dir}/${lang}.json`;
  const d = JSON.parse(readFileSync(path, "utf8")) as Record<string,string>;
  let removed = 0;
  for (const [k,v] of Object.entries(d)) {
    const ev = en[k];
    if (typeof v !== "string" || typeof ev !== "string") continue;
    const vt = v.trim(), evt = ev.trim();
    if (vt === evt && !SKIP.has(vt) && (vt.includes(" ") || vt.length > 8)) {
      delete d[k]; removed++;
    }
  }
  writeFileSync(path, JSON.stringify(d, null, 2));
  console.log(`${lang}: removed ${removed}`);
}
