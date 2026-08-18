import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
const componentGenerator = await readFile(new URL("../scripts/generate-components.mjs", import.meta.url), "utf8");
const saveScript = await readFile(new URL("../scripts/save-board.mjs", import.meta.url), "utf8");

test("named boards load from stable query-string URLs", () => {
  assert.match(html, /new URLSearchParams\(location\.search\)\.get\("board"\)/);
  assert.match(html, /fetch\(`\.\/components\/_boards\/\$\{encodeURIComponent\(slug\)\}\.json`/);
  assert.match(html, /state = migrateState\(boardState\)/);
  assert.match(html, /await loadNamedBoard\(\)/);
});

test("named board links remain stable and do not overwrite personal storage", () => {
  assert.match(html, /id="copy-board-link"[^>]*hidden/);
  assert.match(html, /stableUrl\.searchParams\.set\("board", namedBoard\.slug\)/);
  assert.match(html, /showToast\("命名画板链接已复制"\)/);
  assert.match(html, /本地修改未发布/);
  assert.match(html, /if \(namedBoard\) \{[\s\S]*?return;[\s\S]*?\}\s*saveStatus\.textContent = "保存中/);
});

test("deployment includes repository-backed board files without treating them as components", () => {
  assert.match(workflow, /cp -R components _site\/components/);
  assert.match(componentGenerator, /entry\.isDirectory\(\) && !entry\.name\.startsWith\("_"\)/);
});

test("the board saving script accepts exported JSON and legacy shared state", () => {
  assert.match(saveScript, /\^\[a-z0-9\]\[a-z0-9-\]\{0,63\}\$/);
  assert.match(saveScript, /Buffer\.from\(normalized, "base64"\)/);
  assert.match(saveScript, /readFile\(path\.resolve\(value\), "utf8"\)/);
  assert.match(saveScript, /const state = payload\.state \|\| payload/);
  assert.match(saveScript, /path\.join\(process\.cwd\(\), "components", "_boards"\)/);
  assert.match(saveScript, /path\.join\(boardsDir, `\$\{slug\}\.json`\)/);
});

test("working boards export structured JSON instead of new base64 URLs", () => {
  assert.match(html, /id="export-board"[^>]*>[^<]*<i data-lucide="download"><\/i><span>导出 JSON<\/span>/);
  assert.match(html, /id="export-dialog"/);
  assert.match(html, /schemaVersion: 1,[\s\S]*?projectId,[\s\S]*?revision: projectRevision\(\),[\s\S]*?state/);
  assert.match(html, /new Blob\(\[`\$\{JSON\.stringify\(documentData, null, 2\)\}\\n`\], \{ type: "application\/json;charset=utf-8" \}\)/);
  assert.match(html, /link\.download = `\$\{projectId\}\.json`/);
  assert.doesNotMatch(html, /\bbtoa\(/);
  assert.doesNotMatch(html, /id="share-board"/);
});

test("exported JSON can be imported as a local working board", () => {
  assert.match(html, /id="board-file-input" accept="\.json,application\/json" hidden/);
  assert.match(html, /id="import-board"/);
  assert.match(html, /const payload = JSON\.parse\(await file\.text\(\)\)/);
  assert.match(html, /const boardState = payload\.state \|\| payload/);
  assert.match(html, /localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\)/);
  assert.match(html, /showToast\("画板 JSON 已导入"\)/);
});
