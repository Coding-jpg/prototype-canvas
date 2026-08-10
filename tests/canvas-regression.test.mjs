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

test("the default board showcases the product import flow", () => {
  const defaultState = section("function defaultState()", "function migrateState");
  assert.match(defaultState, /version: 2/);
  assert.match(defaultState, /componentId: "product-import-flow"/);
  assert.match(defaultState, /components\/product-import-flow\/index\.html/);
});

test("legacy boards receive the product import frame without replacing their items", () => {
  const migration = section("function migrateState(savedState)", "function loadState");
  assert.match(migration, /savedState\.items\.push/);
  assert.match(migration, /componentId === "product-import-flow"/);
  assert.doesNotMatch(migration, /savedState\.items\s*=/);
});
