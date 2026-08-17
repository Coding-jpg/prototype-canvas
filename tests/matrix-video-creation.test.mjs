import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/matrix-video-creation/index.html", import.meta.url), "utf8");
const metadata = JSON.parse(await readFile(new URL("../components/matrix-video-creation/meta.json", import.meta.url), "utf8"));

test("matrix creation is published to the shared board", () => {
  assert.equal(metadata.id, "matrix-video-creation");
  assert.equal(metadata.published, true);
});

test("the existing matrix video entry and two-step shell are preserved", () => {
  assert.match(html, /选择商品创建矩阵视频/);
  assert.match(html, /class="entry" id="open-batch" role="button" tabindex="0"/);
  assert.match(html, /document\.querySelector\("#open-batch"\)\.onclick = openBatch/);
  assert.match(html, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(html, /id="step-product"/);
  assert.match(html, /id="step-assignment"/);
  assert.match(html, />选择商品</);
  assert.match(html, />任务分配</);
});

test("uploaded finished videos use a separate publishing workflow", () => {
  assert.match(html, /class="upload-shortcut"[\s\S]*?<button id="open-upload" type="button">上传成片发布<\/button>/);
  assert.doesNotMatch(html, /class="entry-grid"/);
  assert.match(html, /class="upload-dialog" id="upload-dialog"/);
  assert.match(html, /uploadDialog\.showModal\(\)/);
  assert.match(html, /id="upload-handle" required/);
  assert.match(html, /id="upload-link-mode" role="radiogroup"[\s\S]*?data-link-mode="none"[\s\S]*?>不挂链<[\s\S]*?data-link-mode="product"[\s\S]*?>挂链商品</);
  assert.match(html, /id="upload-product-field" hidden[\s\S]*?<span>选择挂链商品<\/span>/);
  assert.match(html, /upload-product-field"\)\.hidden = !linked/);
  assert.match(html, /upload-product"\)\.required = linked/);
  assert.match(html, /id="upload-title" required/);
  assert.match(html, /type="file" id="upload-file"[^>]*required/);
  assert.match(html, />加入发布队列<\/button>/);
  assert.match(html, /location\.hash !== "#\/matrix-video\/upload"/);
  assert.match(html, /location\.href = "\.\.\/task-management\/index\.html#\/publish"/);
});

test("the creation flow opens as a page with browser history support", () => {
  assert.match(html, /class="creation-page" id="creation-page" hidden/);
  assert.match(html, /<h2>创建矩阵视频<\/h2>/);
  assert.match(html, /app\.hidden = true/);
  assert.match(html, /creationPage\.hidden = false/);
  assert.match(html, /location\.hash = "\/matrix-video\/create"/);
  assert.match(html, /window\.addEventListener\("hashchange"/);
  assert.doesNotMatch(html, /class="creation-page"[^>]*role="dialog"/);
});

test("the immersive header confirms destructive exits without drafts", () => {
  assert.match(html, /class="creation-logo">RF<\/span>/);
  assert.match(html, /id="back-workspace">← 返回工作台/);
  assert.match(html, /id="exit-confirm" hidden/);
  assert.match(html, /继续编辑/);
  assert.match(html, /确认退出/);
  assert.match(html, /当前商品选择和任务配置将丢失/);
  assert.doesNotMatch(html, /草稿|自动保存|保存中/);
  assert.doesNotMatch(html, /localStorage|scheduleDraftSave|saveDraft|restoreDraft/);
});

test("automatic and manual modes share one stable page frame", () => {
  assert.match(html, /\.creation-shell \{ width:min\(1240px,100%\); height:100vh/);
  assert.doesNotMatch(html, /creation-page\.manual-workspace|classList\.(?:toggle|remove)\("manual-workspace"/);
  assert.match(html, /classList\.toggle\("manual-mode", !automatic\)/);
});

test("product selection shows product information and readiness", () => {
  assert.match(html, /<th><input[^>]*id="select-page"[^>]*><\/th><th>商品信息<\/th><th>状态<\/th>/);
  assert.doesNotMatch(html, /<th>(?:类目|候选视频|机会分|来源|国家)<\/th>/);
  assert.doesNotMatch(html, /TK Shop API|TK ShOP API|SKU：|机会分|候选视频/);
});

test("only available products can be selected", () => {
  assert.match(html, /statusLabels = \{ available:"可用", missing:"物料缺失", preparing:"准备中" \}/);
  assert.match(html, /const unavailable = product\.status !== "available"/);
  assert.match(html, /unavailable \? "disabled" : ""/);
  assert.match(html, /filter\(product => product\.status === "available"\).*selected\.add/);
});

test("readiness can be filtered together with name and Product ID search", () => {
  assert.match(html, /id="status-filter" aria-label="商品状态"/);
  assert.match(html, /<option value="all">全部状态<\/option>/);
  assert.match(html, /<option value="available">可用<\/option>/);
  assert.match(html, /<option value="missing">物料缺失<\/option>/);
  assert.match(html, /<option value="preparing">准备中<\/option>/);
  assert.match(html, /statusFilter === "all" \|\| product\.status === statusFilter/);
  assert.match(html, /statusFilter = event\.target\.value; page = 1; renderProducts\(\)/);
});

test("TK products show Product IDs and independent-site products omit them", () => {
  assert.match(html, /productId:"1729483061000123456"/);
  assert.match(html, /name:"Minimal Travel Backpack", image:/);
  assert.doesNotMatch(html, /name:"Minimal Travel Backpack", productId:/);
  assert.match(html, /product\.productId \? `<span class="product-id">TK Product ID：\$\{product\.productId\}<\/span>` : ""/);
});

test("search supports product names and TK Product IDs", () => {
  assert.match(html, /placeholder="商品名称 \/ TK Product ID"/);
  assert.match(html, /product\.name\.toLowerCase\(\)\.includes\(normalized\)/);
  assert.match(html, /\(product\.productId \|\| ""\)\.includes\(normalized\)/);
});

test("selection persists across pages and can be cleared", () => {
  assert.match(html, /const selected = new Set\(\)/);
  assert.match(html, /selectable\.every\(product => selected\.has\(product\.id\)\)/);
  assert.match(html, /selected\.clear\(\)/);
  assert.match(html, /id="selected-count"/);
  assert.match(html, /id="continue" disabled/);
});

test("automatic assignment supports product totals and per-handle constraints", () => {
  assert.match(html, /data-mode="auto"/);
  assert.match(html, /AI 自动分配帐号、脚本并生成视频/);
  assert.match(html, /data-quantity-mode="product"/);
  assert.match(html, /每商品指定总数/);
  assert.match(html, /按总数均匀分配到多个可用帐号/);
  assert.match(html, /data-quantity-mode="handle"/);
  assert.match(html, /以每个帐号的视频数作为分配约束/);
  assert.match(html, /data-handle-amount/);
});

test("manual assignment completes every required video configuration field", () => {
  assert.match(html, /data-mode="manual"/);
  assert.match(html, /在这里完成每条视频的帐号、脚本和生成参数配置/);
  assert.match(html, /保存配置并开始生成/);
  assert.match(html, /data-product-amount/);
  for (const field of ["商品", "Handle \/ 发布帐号", "脚本", "视频标题", "视频模型", "视频时长", "画面比例", "参考素材", "片段生成方式"]) {
    assert.match(html, new RegExp(field));
  }
  assert.doesNotMatch(html, /<span>[^<]*\*<\/span>/);
  assert.match(html, /class="manual-workbench"/);
  assert.match(html, /class="task-sidebar"/);
  assert.match(html, /class="task-editor"/);
  assert.match(html, /class="product-nav/);
  assert.match(html, /data-manual-product="\$\{product\.id\}"/);
  assert.doesNotMatch(html, /条任务完整/);
  assert.match(html, /class="task-card \$\{expanded \? "expanded" : ""\}" data-task-card="\$\{task\.id\}"/);
  assert.match(html, /class="task-card-list"/);
  assert.match(html, /const cards = activeTasks\.map\(manualTaskCardMarkup\)\.join\(""\)/);
  assert.match(html, /data-task-toggle="\$\{task\.id\}" aria-expanded="\$\{expanded\}"/);
  assert.match(html, /class="task-summary"/);
  assert.match(html, /data-toggle-all-tasks/);
  assert.match(html, /expandedManualTaskIds\.clear\(\)/);
  assert.doesNotMatch(html, /已完成 \$\{completeCount\} \/ \$\{allTasks\.length\} 条手动视频任务/);
  assert.doesNotMatch(html, /data-task-id=/);
  assert.match(html, /data-manual-action="copy"/);
  assert.match(html, /data-manual-action="delete"/);
  assert.match(html, /data-add-task-product="\$\{activeProduct\.id\}"/);
  assert.match(html, /data-add-task-product/);
  assert.doesNotMatch(html, /data-manual-action="new"/);
  assert.match(html, /value="\$\{escapeMarkup\(product\.name\)\}" readonly aria-label="当前任务商品"/);
  assert.doesNotMatch(html, /data-task-field="productId"/);
  assert.doesNotMatch(html, /<h5>内容设置<\/h5>/);
  assert.doesNotMatch(html, /片段 1 提示词/);
  assert.doesNotMatch(html, /片段 2 提示词/);
  assert.match(html, /completeCount !== allTasks\.length/);
  assert.match(html, /手动配置已保存，开始生成视频/);
});
