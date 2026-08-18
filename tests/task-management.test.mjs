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

test("the seven matrix video task states are available", () => {
  for (const status of ["待配置", "生成中", "生成失败", "待审核", "待发布", "已发布", "发布失败"]) assert.match(html, new RegExp(status));
});

test("top navigation groups task states by workflow stage", () => {
  assert.match(html, /\{ id:"configuration", label:"待配置", statuses:\["pending_configuration"\], pendingStatus:"pending_configuration" \}/);
  assert.match(html, /\{ id:"generation", label:"生成", statuses:\["generating","generation_failed"\] \}/);
  assert.match(html, /\{ id:"review", label:"待审核", statuses:\["pending_review"\], pendingStatus:"pending_review" \}/);
  assert.match(html, /\{ id:"publish", label:"待发布", statuses:\["pending_publish","publish_failed"\], pendingStatus:"pending_publish" \}/);
  assert.match(html, /\{ id:"completed", label:"已完成", statuses:\["published"\] \}/);
  assert.match(html, /data-stage="\$\{stage\.id\}"/);
  assert.doesNotMatch(html, /data-status="\$\{status\.id\}"/);
});

test("only human-action stages show remaining unfinished counts", () => {
  assert.match(html, /stage\.pendingStatus \? tasks\.filter\(task => task\.status === stage\.pendingStatus\)\.length : null/);
  assert.match(html, /class="pending-count" aria-label="\$\{pendingCount\} 项待处理"/);
  assert.doesNotMatch(html, /class="count"/);
});

test("pending configuration tasks expose only configure and delete actions", () => {
  assert.match(html, /pending_configuration:\{ action:"configure", label:"配置"[\s\S]*?canDelete:true/);
  assert.doesNotMatch(html, /pending_configuration:\{[^}]*showEdit:true/);
  assert.match(html, /class="row-delete"[^>]*data-action="delete"[^>]*>删除<\/button>/);
  assert.match(html, /action\.dataset\.action === "configure"\) openConfiguration\(task\)/);
  assert.match(html, /action\.dataset\.action === "delete" && confirm/);
  assert.match(html, /status-badge\.pending_configuration/);
});

test("manual task configuration includes every required generation field", () => {
  assert.match(html, /id="configuration-dialog"/);
  for (const id of ["configuration-product", "configuration-handle", "configuration-script", "configuration-video-title", "configuration-model", "configuration-duration", "configuration-ratio", "configuration-reference", "configuration-generation"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /保存配置并开始生成/);
  assert.match(html, /activeTask\.status = "generating"/);
  assert.match(html, /activeStage = "generation"/);
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

test("pending review combines video, script, editing, and review in one drawer", () => {
  assert.match(html, /id="review-dialog"/);
  assert.match(html, /class="review-drawer" id="review-dialog"/);
  assert.match(html, /审核与编辑视频任务/);
  assert.match(html, /成片与分镜脚本/);
  assert.match(html, /<strong>分镜脚本<\/strong>/);
  for (const id of ["review-handle", "review-script", "review-video-title", "review-model", "review-generation", "review-ratio", "review-reference"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /视频提示词 · 第 1 段 · 8s/);
  assert.match(html, /视频提示词 · 第 2 段 · 8s/);
  assert.match(html, /id="review-approve">通过<\/button>/);
  assert.match(html, /id="review-reject">拒绝<\/button>/);
  assert.match(html, /拒绝原因（选填）/);
  assert.doesNotMatch(html, /确认审核|review-submit|setReviewDecision/);
  assert.match(html, /updateTaskStatus\(activeTask,"pending_publish"/);
  assert.match(html, /updateTaskStatus\(activeTask,"generating"/);
});

test("reviewers can download and upload a replacement video", () => {
  assert.match(html, /id="review-download">↓ 下载成片<\/button>/);
  assert.match(html, /id="review-replacement" accept="video\/mp4,video\/quicktime,video\/webm" hidden/);
  assert.match(html, /id="review-upload">↑ 上传替换<\/button>/);
  assert.match(html, /new Blob\(\[`Prototype video for \$\{activeTask\.id\}`\],\{ type:"video\/mp4" \}\)/);
  assert.match(html, /link\.download = `\$\{activeTask\.id\}-\$\{activeTask\.replacementFile \? "edited" : "generated"\}\.mp4`/);
  assert.match(html, /activeTask\.replacementVideoUrl = URL\.createObjectURL\(file\)/);
  assert.match(html, /activeTask\.replacementFile = file\.name/);
  assert.match(html, /替换成片已上传/);
});

test("generation-sensitive review edits require regeneration", () => {
  assert.match(html, /function reviewNeedsRegeneration\(\)/);
  assert.match(html, /review-approve"\)\.disabled = needsRegeneration \|\| !hasTitle/);
  assert.match(html, /id="review-regenerate" hidden>保存并重新生成<\/button>/);
  assert.match(html, /配置已保存，任务重新进入生成中/);
});

test("pending publish tasks can choose immediate or scheduled publishing", () => {
  assert.match(html, /data-publish-mode="now"/);
  assert.match(html, /data-publish-mode="schedule"/);
  assert.match(html, /type="datetime-local"/);
});

test("the publish stage accepts uploaded tasks without exposing an upload entry", () => {
  assert.doesNotMatch(html, /id="upload-video-entry"|uploadEntry/);
  assert.match(html, /location\.hash === "#\/publish" \? "publish" : "all"/);
  assert.match(html, /manualUpload:true/);
});

test("generating tasks expose details and cancellation", () => {
  assert.match(html, /generating:\{ action:"edit", label:"查看进度"[\s\S]*?showEdit:false/);
  assert.match(html, /class="detail-drawer" id="task-editor-drawer"/);
  assert.match(html, /editorDrawer\.showModal\(\)/);
  assert.match(html, /\.detail-drawer \{ position:fixed; inset:0 0 0 auto;/);
  assert.match(html, /id="detail-cancel"/);
  assert.match(html, /detailCancel\.hidden = task\.status !== "generating"/);
  assert.match(html, /素材与生成/);
  assert.match(html, /运行记录/);
});

test("row actions separate the next step from secondary management commands", () => {
  assert.match(html, /pending_configuration:\{ action:"configure", label:"配置"/);
  assert.match(html, /generating:\{ action:"edit", label:"查看进度"[\s\S]*?showEdit:false/);
  assert.match(html, /generation_failed:\{ action:"retry", label:"重试生成"[\s\S]*?showEdit:true/);
  assert.match(html, /pending_review:\{ action:"review", label:"审核", icon:"✓", tone:"review", showEdit:false/);
  assert.match(html, /pending_publish:\{ action:"publish", label:"设置发布", icon:"↗", tone:"publish", showEdit:true/);
  assert.match(html, /published:\{ action:"edit", label:"编辑"[\s\S]*?showEdit:false/);
  assert.match(html, /publish_failed:\{ action:"retry-publish", label:"重试发布"[\s\S]*?showEdit:true/);
  assert.match(html, /class="row-detail"[^>]*data-action="edit"[^>]*>编辑<\/button>/);
  assert.match(html, /configuration\.action === "edit" \? "row-detail"/);
  assert.match(html, /\$\{primaryIcon\}\$\{configuration\.label\}/);
  assert.doesNotMatch(html, /row-more|action-menu|data-menu-trigger|closeActionMenus/);
  assert.doesNotMatch(html, /<button class="link" data-action/);
});

test("row status and primary actions use explicit matching visual tones", () => {
  for (const status of ["pending_configuration", "generating", "generation_failed", "pending_review", "pending_publish", "published", "publish_failed"]) {
    assert.match(html, new RegExp(`\\.status-badge\\.${status}`));
  }
  assert.match(html, /tone:"retry"/);
  assert.match(html, /tone:"review"/);
  assert.match(html, /tone:"publish"/);
  assert.match(html, /tone:"configure"/);
  assert.doesNotMatch(html, /row-primary\.progress|row-primary\.complete/);
  assert.doesNotMatch(html, />更多 <span aria-hidden="true">⌄<\/span>/);
  assert.doesNotMatch(html, />⋯<\/button>/);
});
