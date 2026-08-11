import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/product-import-flow/index.html", import.meta.url), "utf8");

test("product library uses the required material columns without time metadata", () => {
  assert.match(html, /商品名称<\/th><th>国家<\/th><th>挂链状态<\/th><th>挂链二维码<\/th><th>类目<\/th><th>商品卖点<\/th><th>商品图<\/th><th>商品白底图<\/th><th>商品状态<\/th><th>操作/);
  assert.doesNotMatch(html, /更新时间/);
});

test("product preparation has three exhaustive library states", () => {
  assert.match(html, /data-status-filter="available">可用/);
  assert.match(html, /data-status-filter="preparing">准备中/);
  assert.match(html, /data-status-filter="missing">物料缺失/);
  assert.match(html, /data-status="available"/);
  assert.match(html, /data-status="preparing"/);
  assert.match(html, /data-status="missing"/);
});

test("the component has no import task queue", () => {
  assert.doesNotMatch(html, /导入任务/);
  assert.doesNotMatch(html, /task-table|task-content|new-task/);
});

test("missing materials are repaired in product details and become available", () => {
  assert.match(html, /id="product-dialog"/);
  assert.match(html, /id="selling-point-field"/);
  assert.match(html, /id="white-image-field"/);
  assert.match(html, /missingProductRow\.dataset\.status = "available"/);
  assert.match(html, /商品物料已完整，状态已更新为可用/);
});

test("new imports appear in the product library as preparing", () => {
  assert.match(html, /id="new-product-row"/);
  assert.match(html, /newProductRow\.dataset\.created = "true"/);
  assert.match(html, /商品已加入商品库，正在准备必要物料/);
});

test("every product state supports confirmed deletion", () => {
  assert.ok((html.match(/data-delete-product/g) || []).length >= 4);
  assert.match(html, /id="delete-product-dialog"/);
  assert.match(html, /id="confirm-delete"/);
  assert.match(html, /productToDelete\.remove\(\)/);
  assert.match(html, /updateTabCount\("all", -1\)/);
  assert.match(html, /当前筛选下没有商品/);
});
