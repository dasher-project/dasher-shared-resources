// Batch-translate the new ui-strings.json keys across all locales using
// jsontt (@parvineyvazov/json-translator) with engine fallback (Google →
// Bing → Libre), per the project's translation recipe: batch, and have a
// range of engines. Only fills locales MISSING for the target keys —
// never touches existing translations.
//
// Usage: node translate-new-keys.mjs <key1> <key2> ...
import fs from "fs";
import path from "path";
import pkg from "@parvineyvazov/json-translator";
const { translateObject, TranslationModules } = pkg;

const SHARED = path.resolve(import.meta.dirname, "..", "ui-strings.json");
const targets = process.argv.slice(2);
if (!targets.length) { console.error("usage: node translate-new-keys.mjs key..."); process.exit(1); }

const d = JSON.parse(fs.readFileSync(SHARED, "utf8"));
const locales = d.meta.locales.filter(l => l !== "en");

// Only keys that still miss locales.
const work = [];
for (const key of targets) {
  const entry = d.shared[key];
  if (!entry) { console.error(`unknown key: ${key}`); process.exit(1); }
  const missing = locales.filter(l => !entry[l] || !entry[l].trim());
  if (missing.length) work.push({ key, en: entry.en, missing });
}
if (!work.length) { console.log("nothing missing"); process.exit(0); }

(async () => {
  for (const { key, en, missing } of work) {
    console.log(`== ${key}: ${missing.length} locales`);
    // Batch ALL missing locales for this key in one call per engine set —
    // jsontt takes an object and translates values, returning the same shape.
    // engineFallback walks the engine list on failure.
    let done = {};
    try {
      const res = await translateObject({ msg: en }, "en", missing, {
        moduleKey: "google",
        TranslationModule: TranslationModules.google,
        concurrencyLimit: 5,
        fallback: true, // engine fallback (bing, libre, ...) on failure
        cacheEnabled: true,
      });
      // Shape can be { msg: {<locale>: text } } or an array of per-locale maps.
      if (res && typeof res === "object" && !Array.isArray(res)) {
        const inner = res.msg ?? res;
        for (const [loc, v] of Object.entries(inner)) done[loc] = typeof v === "string" ? v : v?.msg;
      } else if (Array.isArray(res)) {
        // Positional: res[i] corresponds to missing[i].
        res.forEach((r, i) => { const loc = missing[i]; if (loc && r?.msg) done[loc] = r.msg; });
      }
      if (!Object.keys(done).length) console.log("  raw result shape:", JSON.stringify(res)?.slice(0, 200));
    } catch (e) {
      console.error(`  translator error for ${key}: ${e.message}`);
    }
    for (const loc of missing) {
      const t = done[loc];
      if (typeof t === "string" && t.trim()) {
        d.shared[key][loc] = t.trim();
        console.log(`  ${loc}: OK`);
      } else {
        console.log(`  ${loc}: STILL MISSING`);
      }
    }
  }
  fs.writeFileSync(SHARED, JSON.stringify(d, null, 1) + "\n", "utf8");
  console.log("written");
})();
