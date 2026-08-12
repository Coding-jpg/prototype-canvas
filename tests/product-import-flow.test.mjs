import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../components/product-import-flow/index.html", import.meta.url), "utf8");

test("product library keeps only quick-check fields and a leading status marker", () => {
  assert.match(html, /visually-hidden">商品状态<\/span><\/th><th>商品信息<\/th><th>国家<\/th><th>商品白底图<\/th><th>操作/);
  assert.doesNotMatch(html, /<th>(?:商品图|商品名称|挂链状态|类目|商品卖点|挂链二维码|商品状态)<\/th>/);
  assert.ok((html.match(/class="product-info"/g) || []).length >= 4);
  assert.doesNotMatch(html, /更新时间/);
});

test("product preparation has three exhaustive library states", () => {
  assert.match(html, /data-status-filter="available">可用/);
  assert.match(html, /data-status-filter="preparing">准备中/);
  assert.match(html, /data-status-filter="missing">物料缺失/);
  assert.match(html, /data-status="available"/);
  assert.match(html, /data-status="preparing"/);
  assert.match(html, /data-status="missing"/);
  assert.match(html, /status-mark available[^>]*aria-label="可用"/);
  assert.match(html, /status-mark preparing[^>]*aria-label="准备中"/);
  assert.match(html, /status-mark missing[^>]*aria-label="物料缺失"/);
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

test("product actions use edit consistently and missing status has no field count", () => {
  assert.ok((html.match(/data-edit-product/g) || []).length >= 4);
  assert.doesNotMatch(html, /<button[^>]*>(?:查看|去完善)<\/button>/);
  assert.match(html, /id="missing-product-status"[^>]*aria-label="物料缺失"/);
  assert.doesNotMatch(html, /aria-label="物料缺失[^"·]*·/);
});

test("product names can be copied without showing source links", () => {
  assert.ok((html.match(/data-copy-name/g) || []).length >= 4);
  assert.match(html, /async function copyProductName/);
  assert.match(html, /navigator\.clipboard\?\.writeText/);
  assert.match(html, /document\.execCommand\("copy"\)/);
  assert.doesNotMatch(html, /来源链接 · shop\.example\.com|SKU · BP-2026-08/);
  assert.doesNotMatch(html, /id="new-product-source"/);
});

test("toolbar uses one query for names and IDs plus a country filter", () => {
  assert.match(html, /id="product-search"[^>]*placeholder="搜索商品名称 \/ TK Product ID"/);
  assert.doesNotMatch(html, /id="product-id-search"/);
  assert.match(html, /id="country-filter" aria-label="国家"/);
  assert.match(html, /<option value="all">全部国家<\/option>/);
  assert.doesNotMatch(html, /aria-label="商品来源"|全部来源/);
  assert.doesNotMatch(html, /aria-label="市场"|全部市场/);
  assert.match(html, /searchMismatch = productSearchQuery/);
  assert.match(html, /!productName\.includes\(productSearchQuery\) && !productId\.includes\(productSearchQuery\)/);
  assert.match(html, /countryMismatch = activeCountry !== "all"/);
  assert.match(html, /countryFilter\.onchange/);
});

test("TK product IDs appear under product names and drive ID filtering", () => {
  assert.ok((html.match(/data-product-id="\d+"/g) || []).length >= 2);
  assert.ok((html.match(/class="product-id">TK Product ID：\d+/g) || []).length >= 2);
  assert.match(html, /const productId = \(row\.dataset\.productId \|\| ""\)/);
  assert.match(html, /productSearch\.oninput/);
  assert.match(html, /delete newProductRow\.dataset\.productId/);
});

test("linked product QR codes appear as icons beside product names", () => {
  assert.ok((html.match(/data-show-qr/g) || []).length >= 3);
  assert.match(html, /class="qr-icon"[^>]*title="查看挂链二维码"/);
  assert.match(html, /showToast\("已打开挂链二维码"\)/);
});

test("TK import opens with upload spreadsheet as the first and default method", () => {
  const csvMethod = html.indexOf('id: "tk-csv"');
  const linkMethod = html.indexOf('id: "tk-link"');

  assert.ok(csvMethod >= 0 && csvMethod < linkMethod);
  assert.match(html, /let activeMethod = "tk-csv"/);
  assert.match(html, /source === "tk" \? "tk-csv" : "site-link"/);
});
