import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/reelflock/task-management/index.html", import.meta.url), "utf8");
const metadata = JSON.parse(await readFile(new URL("../components/reelflock/task-management/meta.json", import.meta.url), "utf8"));

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
  for (const field of ["商品名称", "Handle", "视频标题", "生成视频预览", "预计发布时间", "操作"]) assert.match(html, new RegExp(`<th[^>]*>${field}<\\/th>`));
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
  assert.match(html, /batchEntry\.hidden = activeStage !== "generation" \|\| failureMode \|\| failedCount === 0/);
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
  assert.match(html, /id="review-redo">重做<\/button>/);
  assert.match(html, /重做要求（选填）/);
  assert.doesNotMatch(html, /确认审核|review-submit|setReviewDecision|id="review-reject"|id="review-regenerate"/);
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

test("review uses one redo action for settings and prompt requirements", () => {
  assert.match(html, /function reviewSettingsChanged\(\)/);
  assert.match(html, /Object\.keys\(currentConfig\)\.some\(key => currentConfig\[key\] !== reviewOriginalConfig\[key\]\)/);
  assert.match(html, /id="review-redo-requirement"/);
  assert.match(html, /review-redo"\)\.disabled = !hasTitle/);
  assert.match(html, /review-approve"\)\.disabled = !hasTitle/);
  assert.match(html, /review-redo"\)\.onclick = \(\) => \{[\s\S]*?saveReviewFields\(\)[\s\S]*?updateTaskStatus\(activeTask,"generating","创作配置已保存，任务进入生成中"\)/);
  assert.match(html, /review-approve"\)\.onclick = \(\) => \{[\s\S]*?saveReviewTitle\(\)[\s\S]*?updateTaskStatus\(activeTask,"pending_publish"/);
});

test("redo requirements belong to the creation configuration section", () => {
  assert.match(html, /<h3>创作配置<\/h3>[\s\S]*?id="review-reference"[\s\S]*?id="review-redo-requirement"[\s\S]*?<\/section>/);
  assert.match(html, /<footer class="dialog-foot"><div class="decision-actions">/);
  assert.doesNotMatch(html, /review-foot|<h3>重做设置<\/h3>/);
});

test("generation settings use dropdown controls in review", () => {
  for (const id of ["review-model", "review-generation", "review-ratio", "review-reference"]) {
    assert.match(html, new RegExp(`<select id="${id}">`));
  }
  assert.match(html, /activeTask\.model = document\.querySelector\("#review-model"\)\.value/);
  assert.match(html, /activeTask\.reference = document\.querySelector\("#review-reference"\)\.value/);
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

test("failed generation tasks expose editable creation settings", () => {
  for (const id of ["detail-edit-handle", "detail-edit-script", "detail-edit-title", "detail-edit-model", "detail-edit-generation", "detail-edit-ratio", "detail-edit-reference"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /editableConfiguration = task\.status === "generation_failed"/);
  assert.match(html, /视频模型[\s\S]*?生成模式[\s\S]*?画面比例[\s\S]*?参考图/);
  assert.match(html, /function saveDetailEditFields\(\)/);
  assert.match(html, /activeTask\.model = document\.querySelector\("#detail-edit-model"\)\.value/);
  assert.match(html, /editableConfiguration \? editableMarkup : detailSections/);
});

test("editable generation drawers omit operational detail sections", () => {
  assert.match(html, /const detailSections = `<div class="detail-grid">[\s\S]*?任务基础[\s\S]*?素材与生成[\s\S]*?运行记录/);
  assert.match(html, /innerHTML = `[\s\S]*?\$\{editableConfiguration \? editableMarkup : detailSections\}`/);
  assert.doesNotMatch(html, /\$\{editableConfiguration \? editableMarkup : ""\}<div class="detail-grid">/);
});

test("failed generation edits can save and regenerate", () => {
  assert.match(html, /id="detail-regenerate" hidden>保存并重新生成<\/button>/);
  assert.match(html, /detailRegenerate\.hidden = task\.status !== "generation_failed"/);
  assert.match(html, /detail-regenerate"\)\.onclick = \(\) => \{[\s\S]*?saveDetailEditFields\(\)[\s\S]*?updateTaskStatus\(activeTask,"generating","配置已保存，任务重新进入生成中"\)/);
});

test("pending publish tasks are read-only until returned to review", () => {
  assert.match(html, /id="detail-back-review" hidden>退回待审核<\/button>/);
  assert.match(html, /pending_publish:\{ action:"publish", label:"设置发布", icon:"↗", tone:"publish", showView:true \}/);
  assert.match(html, /data-action="view-pending-publish"[^>]*>查看详情<\/button>/);
  assert.match(html, /function openPendingPublishDetails\(task\)/);
  assert.match(html, /readOnlyTaskConfiguration\(task,true\)\}\$\{readOnlyPromptSection\(\)\}/);
  assert.match(html, /detail-back-review"\)\.onclick = \(\) => \{[\s\S]*?updateTaskStatus\(activeTask,"pending_review","任务已退回待审核"\)/);
  assert.doesNotMatch(html, /detail-back-review"\)\.onclick = \(\) => \{[\s\S]*?saveDetailEditFields\(\)/);
});

test("publish failures support only retry and returning to review", () => {
  assert.match(html, /publish_failed:\{ action:"retry-publish", label:"重试发布", icon:"↻", tone:"retry", canReturnReview:true \}/);
  assert.match(html, /data-action="return-review"[^>]*>退回审核<\/button>/);
  assert.match(html, /action\.dataset\.action === "return-review"\) updateTaskStatus\(task,"pending_review","任务已退回待审核"\)/);
  assert.match(html, /\["pending_publish","publish_failed"\]\.includes\(task\.status\) \? openPendingPublishDetails\(task\)/);
  assert.doesNotMatch(html, /publish_failed:\{[^}]*showEdit:true/);
});

test("completed tasks expose a read-only configuration and TikTok link", () => {
  assert.match(html, /published:\{ action:"view-published", label:"查看详情", showEdit:false \}/);
  assert.match(html, /tkVideoUrl:"https:\/\/www\.tiktok\.com\/@garagekit\.us\/video\//);
  assert.match(html, /function openPublishedDetails\(task\)/);
  assert.match(html, /查看任务详情/);
  assert.match(html, /<h3>任务配置<\/h3>/);
  assert.match(html, /<h3>TikTok 视频<\/h3>/);
  assert.match(html, /published-details"><section class="published-section"><h3>TikTok 视频<\/h3>[\s\S]*?readOnlyTaskConfiguration\(task\)/);
  assert.match(html, /readOnlyTaskConfiguration\(task\)\}\$\{readOnlyPromptSection\(\)\}/);
  assert.match(html, /class="tk-video-link"[\s\S]*?target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /action\.dataset\.action === "view-published"\) openPublishedDetails\(task\)/);
  assert.match(html, /task\.status === "published" \? openPublishedDetails\(task\)/);
});

test("review and read-only detail drawers share the same prompt layout", () => {
  assert.match(html, /id="review-prompt-section"/);
  assert.match(html, /function promptContentMarkup\(\)/);
  assert.match(html, /视频提示词 · 第 1 段 · 8s/);
  assert.match(html, /视频提示词 · 第 2 段 · 8s/);
  assert.match(html, /review-prompt-section"\)\.innerHTML = promptContentMarkup\(\)/);
  assert.match(html, /function readOnlyPromptSection\(\)/);
});

test("row actions separate the next step from secondary management commands", () => {
  assert.match(html, /pending_configuration:\{ action:"configure", label:"配置"/);
  assert.match(html, /generating:\{ action:"edit", label:"查看进度"[\s\S]*?showEdit:false/);
  assert.match(html, /generation_failed:\{ action:"retry", label:"重试生成"[\s\S]*?showEdit:true/);
  assert.match(html, /pending_review:\{ action:"review", label:"审核", icon:"✓", tone:"review", showEdit:false, canDelete:true/);
  assert.match(html, /pending_publish:\{ action:"publish", label:"设置发布", icon:"↗", tone:"publish", showView:true/);
  assert.match(html, /published:\{ action:"view-published", label:"查看详情"[\s\S]*?showEdit:false/);
  assert.match(html, /publish_failed:\{ action:"retry-publish", label:"重试发布"[\s\S]*?canReturnReview:true/);
  assert.match(html, /class="row-detail"[^>]*data-action="edit"[^>]*>编辑<\/button>/);
  assert.match(html, /\["edit","view-published"\]\.includes\(configuration\.action\) \? "row-detail"/);
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
