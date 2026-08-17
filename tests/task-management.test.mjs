import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/task-management/index.html", import.meta.url), "utf8");
const metadata = JSON.parse(await readFile(new URL("../components/task-management/meta.json", import.meta.url), "utf8"));

test("task management is published to the shared board", () => {
  assert.equal(metadata.id, "task-management");
  assert.equal(metadata.published, true);
});

test("the global navigation contains an active task entry", () => {
  assert.match(html, /rail-item active[^>]*aria-current="page"[\s\S]*?<span>任务<\/span>/);
});

test("the six matrix video task states are available", () => {
  for (const status of ["生成中", "生成失败", "待审核", "待发布", "已发布", "发布失败"]) assert.match(html, new RegExp(status));
});

test("top navigation groups task states by workflow stage", () => {
  assert.match(html, /\{ id:"generation", label:"生成", statuses:\["generating","generation_failed"\] \}/);
  assert.match(html, /\{ id:"review", label:"审核", statuses:\["pending_review"\] \}/);
  assert.match(html, /\{ id:"publish", label:"发布", statuses:\["pending_publish","publish_failed"\] \}/);
  assert.match(html, /\{ id:"completed", label:"已完成", statuses:\["published"\] \}/);
  assert.match(html, /data-stage="\$\{stage\.id\}"/);
  assert.doesNotMatch(html, /data-status="\$\{status\.id\}"/);
});

test("generation and publish stages expose a secondary status filter", () => {
  assert.match(html, /id="stage-status-filter" aria-label="阶段状态" hidden/);
  assert.match(html, /generation:\[\{ id:"all", label:"全部生成状态" \}/);
  assert.match(html, /publish:\[\{ id:"all", label:"全部发布状态" \}/);
  assert.match(html, /stageStatusFilter = event\.target\.value; selectedFailed\.clear\(\); renderTasks\(\)/);
});

test("the task table keeps only the requested business columns", () => {
  for (const field of ["商品名称", "Handle", "视频标题", "生成视频预览", "发布时间", "操作"]) assert.match(html, new RegExp(`<th[^>]*>${field}<\\/th>`));
  assert.doesNotMatch(html, /<th[^>]*>(?:商品卖点|类目|脚本类型|视频模型|当前节点)<\/th>/);
  assert.match(html, /data-copy=/);
  assert.match(html, /任务 ID：/);
});

test("failed generation tasks support single and batch retry", () => {
  assert.match(html, /id="enter-batch-retry"[^>]*>批量重试失败任务<\/button>/);
  assert.doesNotMatch(html, /id="failed-count"/);
  assert.match(html, /id="batch-retry"/);
  assert.match(html, /generation_failed:\{ action:"retry", label:"重试生成"/);
  assert.match(html, /selectedFailed/);
  assert.match(html, /batchEntry\.hidden = failureMode \|\| failedCount === 0/);
  assert.match(html, /batchEntry\.onclick = \(\) => \{[\s\S]*?activeStage = "generation";[\s\S]*?stageStatusFilter = "generation_failed"/);
  assert.match(html, /id="exit-batch-retry">退出批量操作/);
  assert.match(html, /已重试 \$\{count\} 条任务/);
});

test("selection controls appear only for generation failures and time filters affect rows", () => {
  assert.match(html, /\.check-col \{ display:none;/);
  assert.match(html, /\.selection-mode \.check-col \{ display:table-cell;/);
  assert.match(html, /classList\.toggle\("selection-mode", failureMode\)/);
  assert.match(html, /timeFilter = event\.target\.value; renderTasks\(\)/);
  assert.match(html, /matchesTime && matchesHandle && matchesStage && matchesStageStatus && matchesQuery/);
  assert.match(html, /activeStage === "generation" && stageStatusFilter === "generation_failed"/);
});

test("tasks can be filtered by a dynamically generated Handle menu", () => {
  assert.match(html, /id="handle-filter" aria-label="Handle"/);
  assert.match(html, /new Set\(tasks\.map\(task => task\.handle\)\)/);
  assert.match(html, /handleFilter === "all" \|\| task\.handle === handleFilter/);
  assert.match(html, /handleFilter = event\.target\.value; selectedFailed\.clear\(\); renderTasks\(\)/);
});

test("review supports approval and rejection with an optional reason", () => {
  assert.match(html, /id="review-dialog"/);
  assert.match(html, /class="review-material"[\s\S]*?>审核内容</);
  assert.match(html, /<strong>分镜脚本<\/strong>/);
  assert.match(html, /class="review-decision"/);
  assert.match(html, /id="review-approve">通过<\/button>/);
  assert.match(html, /id="review-reject">拒绝<\/button>/);
  assert.match(html, /拒绝原因（选填）/);
  assert.doesNotMatch(html, /确认审核|review-submit|setReviewDecision/);
  assert.match(html, /updateTaskStatus\(activeTask,"pending_publish"/);
  assert.match(html, /updateTaskStatus\(activeTask,"generating"/);
});

test("pending publish tasks can choose immediate or scheduled publishing", () => {
  assert.match(html, /data-publish-mode="now"/);
  assert.match(html, /data-publish-mode="schedule"/);
  assert.match(html, /type="datetime-local"/);
});

test("the publish stage links to the finished-video upload workflow", () => {
  assert.match(html, /id="upload-video-entry" href="\.\.\/matrix-video-creation\/index\.html#\/matrix-video\/upload" hidden>上传成片/);
  assert.match(html, /uploadEntry\.hidden = activeStage !== "publish"/);
  assert.match(html, /location\.hash === "#\/publish" \? "publish" : "all"/);
  assert.match(html, /manualUpload:true/);
});

test("generating tasks expose details and cancellation", () => {
  assert.match(html, /generating:\{ action:"detail", label:"查看进度"[\s\S]*?showDetail:false/);
  assert.match(html, /id="detail-dialog"/);
  assert.match(html, /id="detail-cancel"/);
  assert.match(html, /detailCancel\.hidden = task\.status !== "generating"/);
  assert.match(html, /素材与生成/);
  assert.match(html, /运行记录/);
});

test("row actions separate the next step from secondary management commands", () => {
  assert.match(html, /generating:\{ action:"detail", label:"查看进度"[\s\S]*?showDetail:false/);
  assert.match(html, /generation_failed:\{ action:"retry", label:"重试生成"[\s\S]*?showDetail:true/);
  assert.match(html, /pending_review:\{ action:"review", label:"审核", icon:"✓", tone:"review", showDetail:true/);
  assert.match(html, /pending_publish:\{ action:"publish", label:"设置发布", icon:"↗", tone:"publish", showDetail:true/);
  assert.match(html, /published:\{ action:"detail", label:"查看详情"[\s\S]*?showDetail:false/);
  assert.match(html, /publish_failed:\{ action:"retry-publish", label:"重试发布"[\s\S]*?showDetail:true/);
  assert.match(html, /class="row-detail"[^>]*data-action="detail"[^>]*>查看详情<\/button>/);
  assert.match(html, /configuration\.action === "detail" \? "row-detail"/);
  assert.match(html, /\$\{primaryIcon\}\$\{configuration\.label\}/);
  assert.doesNotMatch(html, /row-more|action-menu|data-menu-trigger|closeActionMenus/);
  assert.doesNotMatch(html, /<button class="link" data-action/);
});

test("row status and primary actions use explicit matching visual tones", () => {
  for (const status of ["generating", "generation_failed", "pending_review", "pending_publish", "published", "publish_failed"]) {
    assert.match(html, new RegExp(`\\.status-badge\\.${status}`));
  }
  assert.match(html, /tone:"retry"/);
  assert.match(html, /tone:"review"/);
  assert.match(html, /tone:"publish"/);
  assert.doesNotMatch(html, /row-primary\.progress|row-primary\.complete/);
  assert.doesNotMatch(html, />更多 <span aria-hidden="true">⌄<\/span>/);
  assert.doesNotMatch(html, />⋯<\/button>/);
});
