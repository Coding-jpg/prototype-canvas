import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/account-management-flow/index.html", import.meta.url), "utf8");
const metadata = JSON.parse(await readFile(new URL("../components/account-management-flow/meta.json", import.meta.url), "utf8"));

test("account management is published to the shared board", () => {
  assert.equal(metadata.id, "account-management-flow");
  assert.equal(metadata.published, true);
});

test("the account list keeps the existing field structure", () => {
  assert.match(html, /<th>Handle<\/th><th>人物图片<\/th><th>帐号标签<\/th><th>人物标签<\/th><th>动作<\/th>/);
  assert.match(html, /参与自动化/);
  assert.match(html, /不参与自动化/);
  assert.ok((html.match(/data-edit/g) || []).length >= 3);
});

test("manual import collects required publishing and automation fields", () => {
  assert.match(html, /id="import-dialog"/);
  assert.match(html, /id="import-handle"/);
  assert.match(html, /id="import-nickname"/);
  assert.match(html, /id="import-language"/);
  assert.match(html, /id="import-country"/);
  assert.match(html, /id="import-automation"/);
  assert.match(html, /帐号已导入，请继续添加人物形象/);
});

test("account details control automation, language, and separate tag sets", () => {
  assert.match(html, /id="automation-switch"/);
  assert.match(html, /决定该帐号使用什么语言制作视频/);
  assert.match(html, /标记该帐号经营的商品品类/);
  assert.match(html, /id="account-tags"/);
  assert.match(html, /persona-tag-input/);
  assert.match(html, /不参与自动化制作/);
  assert.doesNotMatch(html, /id="automation-label"|function updateAutomationLabel/);
});

test("account tags use a scalable searchable multi-select", () => {
  assert.match(html, /id="account-tag-menu"/);
  assert.match(html, /aria-multiselectable="true"/);
  assert.match(html, /data-account-tag-option/);
  assert.match(html, /max-height: 210px; overflow-y: auto/);
  assert.match(html, /draftAccountTags\.slice\(0, 3\)/);
  assert.match(html, /\+\$\{draftAccountTags\.length - 3\}/);
  assert.match(html, /＋ 新建“\$\{document\.querySelector/);
  assert.match(html, /activeRow\.dataset\.accountTags = draftAccountTags\.join/);
  assert.match(html, /draftAccountTagCatalog = \[\.\.\.accountTagCatalog\]/);
  assert.match(html, /accountTagCatalog\.splice\(0, accountTagCatalog\.length, \.\.\.draftAccountTagCatalog\)/);
  assert.match(html, /renderRowAccountTags\(activeRow\)/);
});

test("each persona owns an original image, sketch, and labels", () => {
  assert.match(html, /aria-label="人物原图"/);
  assert.match(html, /aria-label="黑白素描图"/);
  assert.match(html, /assets\/person-original\.png/);
  assert.match(html, /assets\/person-sketch\.png/);
  assert.match(html, /data-replace-image/);
  assert.match(html, /data-regenerate-sketch/);
  assert.match(html, /data-remove-persona/);
  assert.match(html, /黑白素描图用于规避视频生成限制/);
});

test("personas can be added from all three requested sources", () => {
  assert.match(html, /data-persona-source="upload">上传图片/);
  assert.match(html, /data-persona-source="library">从资产库选择/);
  assert.match(html, /data-persona-source="ai">AI 生成/);
  assert.match(html, /自动生成用于视频生成的黑白素描图/);
  assert.match(html, /function createPersonaCard\(source\)/);
  assert.match(html, /function setActivePersona\(card\)/);
});
