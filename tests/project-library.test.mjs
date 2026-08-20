import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const project = JSON.parse(await readFile(new URL("../components/reelflock/project.json", import.meta.url), "utf8"));
const board = JSON.parse(await readFile(new URL("../components/reelflock/board.json", import.meta.url), "utf8"));
const generator = await readFile(new URL("../scripts/generate-components.mjs", import.meta.url), "utf8");
const saveProjectBoard = await readFile(new URL("../scripts/save-project-board.mjs", import.meta.url), "utf8");
const componentDirectories = (await readdir(new URL("../components/reelflock/", import.meta.url), { withFileTypes: true }))
  .filter(entry => entry.isDirectory());
const componentMetadata = await Promise.all(componentDirectories.map(entry =>
  readFile(new URL(`../components/reelflock/${entry.name}/meta.json`, import.meta.url), "utf8").then(JSON.parse)
));

test("repository directories define the ReelFlock project and its components", () => {
  assert.deepEqual(project, {
    id: "reelflock",
    name: "ReelFlock",
    description: "ReelFlock 产品原型与业务流程组件。"
  });
  assert.equal(componentMetadata.length, 7);
  assert.equal(componentMetadata.filter(component => component.published === true).length, 5);
  assert.equal(board.projectId, "reelflock");
  assert.ok(Array.isArray(board.state.items));
  assert.match(generator, /projects\.push\(\{/);
  assert.match(generator, /boardPath: `\.\/components\/\$\{projectDirectory\.name\}\/board\.json`/);
  assert.match(generator, /path: `\.\/components\/\$\{projectDirectory\.name\}\/\$\{componentDirectory\.name\}\/index\.html`/);
});

test("the component library groups repository components by project", () => {
  assert.match(html, /if \(!Array\.isArray\(manifest\.projects\)\)/);
  assert.match(html, /visibleProjects\.forEach\(project =>/);
  assert.match(html, /className = "library-project"/);
  assert.match(html, /section\.dataset\.projectId = project\.id/);
  assert.match(html, /project\.components\.forEach\(component => renderLibraryItem\(component, section\)\)/);
  assert.match(html, /setAttribute\("aria-label", `添加\$\{componentDisplayName\(component\)\}`\)/);
  assert.doesNotMatch(html, /新建项目|创建项目|添加项目/);
});

test("projects switch by route and isolate their local board state", () => {
  assert.match(html, /id="project-select" aria-label="切换项目"/);
  assert.match(html, /new URLSearchParams\(location\.search\)\.get\("project"\)/);
  assert.match(html, /url\.searchParams\.set\("project", projectId\)/);
  assert.match(html, /location\.assign\(projectUrl\(projectSelect\.value\)\)/);
  assert.match(html, /prototype-canvas-project-v1:/);
  assert.match(html, /localStorage\.setItem\(projectStorageKey\(activeProject\.id\), JSON\.stringify\(state\)\)/);
  assert.match(html, /migrateState\(payload\.state, project\.id\)/);
  assert.match(html, /if \(projectId !== "reelflock"\)/);
});

test("ReelFlock history migrations do not add components to another project", () => {
  const start = html.indexOf("function migrateState(savedState, projectId");
  const end = html.indexOf("function projectStorageKey", start);
  const source = html.slice(start, end);
  const migrateState = new Function("uid", `${source}; return migrateState;`)(prefix => `${prefix}-new`);
  const board = {
    version: 1,
    camera: { x: 0, y: 0, zoom: 1 },
    items: [{ id: "other-frame", type: "frame", componentId: "overview", componentPath: "./components/other/overview/index.html" }]
  };

  migrateState(board, "other");

  assert.equal(board.version, 10);
  assert.equal(board.items.length, 1);
  assert.equal(board.items[0].projectId, "other");
  assert.equal(board.items[0].componentPath, "./components/other/overview/index.html");
});

test("share controls expose one fixed board per repository project", () => {
  assert.match(html, />项目\s*<[^>]*input id="share-project-title"[^>]*readonly/);
  assert.match(html, />项目标识\s*<[^>]*input id="share-project-id"[^>]*readonly/);
  assert.match(html, /下载画板 JSON/);
  assert.match(html, /更新这个项目画板/);
  assert.match(html, /projectUrl\(activeProject\.id\)\.toString\(\)/);
  assert.doesNotMatch(html, /新建项目|创建项目|添加项目/);
});

test("the repository helper saves an export to its matching project board", () => {
  assert.match(saveProjectBoard, /path\.join\(process\.cwd\(\), "components", projectId\)/);
  assert.match(saveProjectBoard, /payload\.projectId !== projectId/);
  assert.match(saveProjectBoard, /schemaVersion: 2/);
  assert.match(saveProjectBoard, /path\.join\(projectDir, "board\.json"\)/);
  assert.match(saveProjectBoard, /Open \?project=\$\{projectId\} after deployment/);
});
