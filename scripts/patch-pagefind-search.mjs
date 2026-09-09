// desc: Patch pagefind.js/pagefind-worker.js to fix Chinese word segmentation issue.
// Intl.Segmenter splits Chinese queries character-by-character (e.g., "镜像" -> ["镜","像"]),
// but Pagefind indexes them as compound words. Disable word-level segmentation for zh
// at query time so the WASM backend handles matching with its own segmenter.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist/pagefind");

const files = ["pagefind.js", "pagefind-worker.js"];
let patched = 0;

for (const file of files) {
  const filePath = resolve(distDir, file);
  try {
    let js = readFileSync(filePath, "utf-8");

    const oldFn = 'needsWordSegmentation=(lang)=>{if(!lang)return false;const primaryLang=lang.split("-")[0].toLowerCase();return["zh","ja","th"].includes(primaryLang);}';
    const newFn = 'needsWordSegmentation=(lang)=>{if(!lang)return false;const primaryLang=lang.split("-")[0].toLowerCase();return["ja","th"].includes(primaryLang);}';

    if (js.includes(oldFn)) {
      js = js.replace(oldFn, newFn);
      writeFileSync(filePath, js, "utf-8");
      console.log(`[patch] Patched ${file} - removed zh from needsWordSegmentation.`);
      patched++;
    } else if (js.includes('"zh","ja","th"')) {
      js = js.replace('"zh","ja","th"', '"ja","th"');
      writeFileSync(filePath, js, "utf-8");
      console.log(`[patch] Patched ${file} (alt format) - removed zh.`);
      patched++;
    } else if (js.indexOf('needsWordSegmentation') === -1) {
      console.log(`[patch] ${file} does not contain needsWordSegmentation (may be playground).`);
    } else {
      console.warn(`[patch] ${file} - needsWordSegmentation found but pattern unrecognized.`);
    }
  } catch (err) {
    console.error(`[patch] Error processing ${file}: ${err.message}`);
  }
}

if (patched === 0) {
  console.warn("[patch] No files were patched. Check the dist/pagefind directory.");
} else {
  console.log(`[patch] Done. Patched ${patched} file(s).`);
}
