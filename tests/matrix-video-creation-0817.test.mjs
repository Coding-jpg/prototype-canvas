import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/matrix-video-creation-0817/index.html", import.meta.url), "utf8");
const metadata = JSON.parse(await readFile(new URL("../components/matrix-video-creation-0817/meta.json", import.meta.url), "utf8"));

function section(start, end) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `Missing section: ${start}`);
  assert.notEqual(endIndex, -1, `Missing section end: ${end}`);
  return html.slice(startIndex, endIndex);
}

test("the 0817 matrix flow is a separate published library component", () => {
  assert.equal(metadata.id, "matrix-video-creation-0817");
  assert.equal(metadata.name, "矩阵视频创作流程（0817）");
  assert.equal(metadata.published, true);
  assert.match(html, /<title>矩阵视频创作流程（0817）<\/title>/);
});

test("0817 manual mode creates product-level pending task counts", () => {
  const manualCounts = section("function renderManualTaskCounts(list)", "function renderAssignmentProducts()");
  assert.match(manualCounts, /只创建待配置的视频任务/);
  assert.match(manualCounts, /进度管理 → 手动配置/);
  assert.match(manualCounts, /逐条填写 Handle、脚本、模型和标题/);
  assert.match(manualCounts, /data-product-amount/);
  assert.match(manualCounts, /该商品视频总数/);
  assert.match(manualCounts, /手动配置/);
  assert.doesNotMatch(manualCounts, /data-task-field|视频模型|参考素材|片段生成方式/);
});

test("0817 manual mode defers generation until later configuration", () => {
  const assignmentMode = section("function renderAssignmentMode()", "function showStep");
  assert.match(assignmentMode, /本步骤只创建任务，不开始生成/);
  assert.match(assignmentMode, /创建待配置任务/);
  assert.match(html, /待配置视频任务已创建，可到进度管理继续配置/);
});
