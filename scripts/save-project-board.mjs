import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [, , projectId, source] = process.argv;

if (!projectId || !source) {
  throw new Error("Usage: node scripts/save-project-board.mjs <project-id> <exported-board-json>");
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(projectId)) {
  throw new Error("Project id must use lowercase letters, numbers, and hyphens (1-64 characters).");
}

const projectDir = path.join(process.cwd(), "components", projectId);
const projectMetadata = JSON.parse(await readFile(path.join(projectDir, "project.json"), "utf8"));
if (projectMetadata.id !== projectId) {
  throw new Error("Project metadata id must match the project directory.");
}

const payload = source.trim().startsWith("{")
  ? JSON.parse(source)
  : JSON.parse(await readFile(path.resolve(source), "utf8"));
if (payload.projectId && payload.projectId !== projectId) {
  throw new Error(`Exported board belongs to project ${payload.projectId}, not ${projectId}.`);
}

const state = payload.state || payload;
if (!state || !Array.isArray(state.items) || !state.camera) {
  throw new Error("The exported board JSON is missing items or camera state.");
}

const board = {
  schemaVersion: 2,
  projectId,
  title: String(payload.title || projectMetadata.name).trim() || projectMetadata.name,
  revision: payload.revision || new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
  updatedAt: new Date().toISOString(),
  state
};
const outputPath = path.join(projectDir, "board.json");

await writeFile(outputPath, `${JSON.stringify(board, null, 2)}\n`);
console.log(`Saved ${outputPath}`);
console.log(`Open ?project=${projectId} after deployment.`);
