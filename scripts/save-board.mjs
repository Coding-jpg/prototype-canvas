import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [, , slug, source, title = slug] = process.argv;

if (!slug || !source) {
  throw new Error("Usage: node scripts/save-board.mjs <slug> '<share-link-or-board-payload>' '<display title>'");
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
  throw new Error("Board slug must use lowercase letters, numbers, and hyphens (1-64 characters).");
}

function decodeBoard(value) {
  const marker = "#board=";
  const encoded = value.includes(marker) ? value.slice(value.indexOf(marker) + marker.length) : value;
  const normalized = decodeURIComponent(encoded.trim());
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

const state = decodeBoard(source);
if (!state || !Array.isArray(state.items) || !state.camera) {
  throw new Error("The shared board payload is missing items or camera state.");
}

const board = {
  slug,
  title: String(title || slug).trim() || slug,
  updatedAt: new Date().toISOString(),
  state
};
const boardsDir = path.join(process.cwd(), "components", "_boards");
const outputPath = path.join(boardsDir, `${slug}.json`);

await mkdir(boardsDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(board, null, 2)}\n`);
console.log(`Saved ${outputPath}`);
console.log(`Open ?board=${slug} after deployment.`);
