import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [, , slug, source, titleArgument] = process.argv;

if (!slug || !source) {
  throw new Error("Usage: node scripts/save-board.mjs <slug> <exported-json-or-legacy-share-link> '<display title>'");
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
  throw new Error("Board slug must use lowercase letters, numbers, and hyphens (1-64 characters).");
}

function decodeLegacyBoard(value) {
  const marker = "#board=";
  const encoded = value.includes(marker) ? value.slice(value.indexOf(marker) + marker.length) : value;
  const normalized = decodeURIComponent(encoded.trim());
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

async function readBoardSource(value) {
  if (value.includes("#board=")) return decodeLegacyBoard(value);
  if (value.trim().startsWith("{")) return JSON.parse(value);
  return JSON.parse(await readFile(path.resolve(value), "utf8"));
}

const payload = await readBoardSource(source);
const state = payload.state || payload;
if (!state || !Array.isArray(state.items) || !state.camera) {
  throw new Error("The exported board JSON is missing items or camera state.");
}

const board = {
  schemaVersion: 1,
  boardId: slug,
  slug,
  title: String(titleArgument || payload.title || slug).trim() || slug,
  revision: payload.revision || new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
  updatedAt: new Date().toISOString(),
  state
};
const boardsDir = path.join(process.cwd(), "components", "_boards");
const outputPath = path.join(boardsDir, `${slug}.json`);

await mkdir(boardsDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(board, null, 2)}\n`);
console.log(`Saved ${outputPath}`);
console.log(`Open ?board=${slug} after deployment.`);
