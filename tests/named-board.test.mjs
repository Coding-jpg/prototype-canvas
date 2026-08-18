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
  assert.match(html, /id="published-share" hidden/);
  assert.match(html, /stableBoardUrl\(namedBoard\.slug\)/);
  assert.match(html, /showToast\("公开链接已复制"\)/);
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

test("share downloads structured JSON for Codex publishing", () => {
  assert.match(html, /id="share-board"[^>]*>[^<]*<i data-lucide="share-2"><\/i><span>分享<\/span>/);
  assert.match(html, /id="share-dialog"/);
  assert.match(html, /下载项目 JSON/);
  assert.match(html, /发送给 Codex/);
  assert.match(html, /获得公开链接/);
  assert.match(html, /schemaVersion: 1,[\s\S]*?projectId,[\s\S]*?revision: projectRevision\(\),[\s\S]*?state/);
  assert.match(html, /new Blob\(\[`\$\{JSON\.stringify\(documentData, null, 2\)\}\\n`\], \{ type: "application\/json;charset=utf-8" \}\)/);
  assert.match(html, /link\.download = `\$\{projectId\}\.json`/);
  assert.doesNotMatch(html, /\bbtoa\(/);
  assert.doesNotMatch(html, /id="import-board"/);
  assert.doesNotMatch(html, /id="board-file-input"/);
});
