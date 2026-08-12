import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

function section(start, end) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `Missing section: ${start}`);
  assert.notEqual(endIndex, -1, `Missing section end: ${end}`);
  return html.slice(startIndex, endIndex);
}

test("the canvas has one contextual interaction mode", () => {
  assert.doesNotMatch(html, /data-tool-button="(?:select|pan)"/);
  assert.doesNotMatch(html, /tool === "pan"/);
});

test("item reconciliation preserves existing iframe elements", () => {
  const renderItems = section("function renderItems()", "function createItemElement");
  assert.doesNotMatch(renderItems, /replaceChildren/);
  assert.match(renderItems, /existing = new Map/);
  assert.match(renderItems, /syncItemElement/);
});

test("dragging updates only the active item", () => {
  const pointerMove = section('viewport.addEventListener("pointermove"', 'viewport.addEventListener("pointerup"');
  assert.doesNotMatch(pointerMove, /renderItems\(\)/);
  assert.match(pointerMove, /syncItemElement/);
});

test("selection changes do not rebuild components", () => {
  const selectItem = section("function selectItem(id)", "function updateSelectionStatus");
  assert.doesNotMatch(selectItem, /renderItems\(\)/);
  assert.match(selectItem, /syncItemElement/);
});

test("component library preferences persist aliases and deleted components", () => {
  assert.match(html, /prototype-canvas-component-preferences-v1/);
  const loadPreferences = section("function loadComponentPreferences()", "function saveComponentPreferences");
  const savePreferences = section("function saveComponentPreferences()", "function componentDisplayName");
  assert.match(loadPreferences, /names:/);
  assert.match(loadPreferences, /deleted:/);
  assert.match(savePreferences, /localStorage\.setItem\(COMPONENT_PREFERENCES_KEY/);
});

test("component library supports rename, delete, and restore", () => {
  const management = section("function renameLibraryComponent(component)", "function addComponentFrame(component)");
  assert.match(management, /componentPreferences\.names\[component\.id\] = name/);
  assert.match(management, /componentPreferences\.deleted\.push\(component\.id\)/);
  assert.match(management, /componentPreferences\.deleted = componentPreferences\.deleted\.filter/);
  assert.match(management, /saveComponentPreferences\(\)/);
});

test("frame toolbar controls do not start frame dragging", () => {
  const renderFrame = section("function renderFrame(item)", "function renameFrame(item, element)");
  assert.match(renderFrame, /querySelectorAll\("\.frame-bar button"\)/);
  assert.match(renderFrame, /button\.addEventListener\("pointerdown", event => event\.stopPropagation\(\)\)/);
  assert.match(renderFrame, /data-rename/);
});

test("each frame can download its standalone HTML", () => {
  const renderFrame = section("function renderFrame(item)", "function renameFrame(item, element)");
  const downloadFrame = section("async function downloadFrame(item)", "function renderNote(item)");
  assert.match(renderFrame, /data-download/);
  assert.match(renderFrame, /await downloadFrame\(item\)/);
  assert.match(downloadFrame, /fetch\(componentUrl\(item\.componentPath\)/);
  assert.match(downloadFrame, /new Blob\(\[html\], \{ type: "text\/html;charset=utf-8" \}\)/);
  assert.match(downloadFrame, /URL\.createObjectURL/);
  assert.match(downloadFrame, /URL\.revokeObjectURL/);
  assert.match(downloadFrame, /link\.download = downloadFileName\(item\.title\)/);
});

test("download filenames are safe and keep the html extension", () => {
  const fileNameSource = section("function downloadFileName(title)", "async function downloadFrame(item)");
  const downloadFileName = new Function(`${fileNameSource}; return downloadFileName;`)();
  assert.equal(downloadFileName("商品导入流程 · 桌面"), "商品导入流程 · 桌面.html");
  assert.equal(downloadFileName("流程:/测试?.html"), "流程--测试-.html");
  assert.equal(downloadFileName("   "), "component.html");
});

test("the default board showcases the product import flow", () => {
  const defaultState = section("function defaultState()", "function migrateState");
  assert.match(defaultState, /version: 6/);
  assert.match(defaultState, /componentId: "product-import-flow"/);
  assert.match(defaultState, /components\/product-import-flow\/index\.html/);
  assert.match(defaultState, /product-import-entry-arrow/);
  assert.match(defaultState, /product-import-failure-arrow/);
  assert.match(defaultState, /product-detail-conditional-fields/);
  assert.match(defaultState, /类目有识别结果时显示/);
});

test("legacy boards receive the product import frame without replacing their items", () => {
  const migration = section("function migrateState(savedState)", "function loadState");
  assert.match(migration, /savedState\.items\.push/);
  assert.match(migration, /componentId === "product-import-flow"/);
  assert.match(migration, /product-import-entry/);
  assert.match(migration, /product-import-failure/);
  assert.doesNotMatch(migration, /savedState\.items\s*=/);
});

test("product import annotations are added once to a version 2 board", () => {
  const migrationSource = section("function migrateState(savedState)", "function loadState");
  let sequence = 0;
  const migrateState = new Function("uid", `${migrationSource}; return migrateState;`)(prefix => `${prefix}-${++sequence}`);
  const userNote = { id: "note-user", type: "note", text: "用户自己的批注" };
  const board = {
    version: 2,
    items: [
      { id: "frame-product", type: "frame", x: 0, y: 1040, componentId: "product-import-flow" },
      { id: "note-old", type: "note", text: "新增：商品导入流程。主入口按 TK 商品与独立站商品分流。" },
      userNote
    ]
  };

  migrateState(board);
  const itemCount = board.items.length;
  migrateState(board);

  assert.equal(board.version, 6);
  assert.equal(board.items.length, itemCount);
  assert.equal(board.items.filter(item => item.annotationKey?.startsWith("product-import-")).length, 4);
  assert.equal(board.items.filter(item => item.type === "note" && item.annotationKey?.startsWith("product-import-")).length, 2);
  assert.ok(board.items.includes(userNote));
});

test("version 3 boards replace the task-center annotation with product readiness", () => {
  const migrationSource = section("function migrateState(savedState)", "function loadState");
  const migrateState = new Function("uid", `${migrationSource}; return migrateState;`)(prefix => `${prefix}-new`);
  const board = {
    version: 3,
    items: [
      { id: "frame-product", type: "frame", x: 0, y: 0, componentId: "product-import-flow" },
      { id: "note-readiness", type: "note", annotationKey: "product-import-failure", text: "抓取失败不会生成空商品，可在统一任务中心重试或转为手动录入。" },
      { id: "arrow-readiness", type: "arrow", annotationKey: "product-import-failure-arrow" }
    ]
  };

  migrateState(board);

  assert.equal(board.version, 6);
  assert.match(board.items.find(item => item.annotationKey === "product-import-failure").text, /准备中.*可用.*物料缺失/);
  assert.doesNotMatch(board.items.find(item => item.annotationKey === "product-import-failure").text, /任务中心/);
});

test("version 4 boards receive the conditional detail fields annotation once", () => {
  const migrationSource = section("function migrateState(savedState)", "function loadState");
  let sequence = 0;
  const migrateState = new Function("uid", `${migrationSource}; return migrateState;`)(prefix => `${prefix}-${++sequence}`);
  const userNote = { id: "user-note", type: "note", text: "保留我的说明" };
  const board = {
    version: 4,
    items: [
      { id: "frame-product", type: "frame", x: 100, y: 200, componentId: "product-import-flow" },
      { id: "existing-note", type: "note", annotationKey: "product-import-entry", text: "已有入口说明" },
      userNote
    ]
  };

  migrateState(board);
  const itemCount = board.items.length;
  migrateState(board);

  assert.equal(board.version, 6);
  assert.equal(board.items.length, itemCount);
  assert.equal(board.items.filter(item => item.annotationKey === "product-detail-conditional-fields").length, 1);
  assert.equal(board.items.filter(item => item.annotationKey === "product-detail-conditional-fields-arrow").length, 1);
  assert.match(board.items.find(item => item.annotationKey === "product-detail-conditional-fields").text, /商品 ID、国家固定显示/);
  assert.equal(board.items.find(item => item.annotationKey === "product-import-entry").text, "已有入口说明");
  assert.ok(board.items.includes(userNote));
});

test("version 5 boards remove only the retired showcase components", () => {
  const migrationSource = section("function migrateState(savedState)", "function loadState");
  const migrateState = new Function("uid", `${migrationSource}; return migrateState;`)(prefix => `${prefix}-new`);
  const productFrame = { id: "frame-product", type: "frame", title: "商品导入流程 · 桌面", componentId: "product-import-flow" };
  const userFrame = { id: "frame-user", type: "frame", title: "我的组件", componentId: "custom-component" };
  const userNote = { id: "note-user", type: "note", text: "保留我的说明" };
  const productNote = { id: "note-product", type: "note", annotationKey: "product-import-entry", text: "商品说明" };
  const board = {
    version: 5,
    items: [
      { id: "frame-filter", type: "frame", title: "项目筛选 · 桌面", componentId: "filter-panel" },
      { id: "frame-release", type: "frame", title: "发布确认 · 手机", componentId: "release-confirm" },
      { id: "note-release", type: "note", text: "确认按钮需要在勾选后启用。" },
      { id: "arrow-release", type: "arrow", x: 1180, y: 840, x2: 1330, y2: 940 },
      productFrame,
      userFrame,
      userNote,
      productNote
    ]
  };

  migrateState(board);
  const itemCount = board.items.length;
  migrateState(board);

  assert.equal(board.version, 6);
  assert.equal(board.items.length, itemCount);
  assert.deepEqual(board.items, [productFrame, userFrame, userNote, productNote]);
});

test("legacy embedded showcase frames are removed by their exact titles", () => {
  const migrationSource = section("function migrateState(savedState)", "function loadState");
  const migrateState = new Function("uid", `${migrationSource}; return migrateState;`)(prefix => `${prefix}-new`);
  const similarlyNamedUserFrame = { id: "frame-similar", type: "frame", title: "项目筛选 · 自定义" };
  const board = {
    version: 5,
    items: [
      { id: "frame-filter", type: "frame", title: "项目筛选 · 桌面", html: "legacy" },
      { id: "frame-release", type: "frame", title: "发布确认 · 手机", html: "legacy" },
      similarlyNamedUserFrame
    ]
  };

  migrateState(board);

  assert.equal(board.version, 6);
  assert.deepEqual(board.items, [similarlyNamedUserFrame]);
});
