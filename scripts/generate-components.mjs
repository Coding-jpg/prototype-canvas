import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, "components");
const outputPath = path.join(rootDir, "component-library.json");
const validDevices = new Set(["desktop", "tablet", "mobile"]);
const projectEntries = await readdir(componentsDir, { withFileTypes: true });
const projectDirectories = projectEntries
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .sort((a, b) => a.name.localeCompare(b.name));
const projects = [];
const projectIds = new Set();
const componentKeys = new Set();

for (const projectDirectory of projectDirectories) {
  const projectDir = path.join(componentsDir, projectDirectory.name);
  const projectMetadataPath = path.join(projectDir, "project.json");
  const boardPath = path.join(projectDir, "board.json");
  let projectMetadata;

  try {
    projectMetadata = JSON.parse(await readFile(projectMetadataPath, "utf8"));
    const board = JSON.parse(await readFile(boardPath, "utf8"));
    if (board.projectId !== projectDirectory.name || !board.state || !Array.isArray(board.state.items) || !board.state.camera) {
      throw new Error("board.json must contain the matching projectId and a valid state");
    }
  } catch (error) {
    throw new Error(`Invalid project ${projectDirectory.name}: ${error.message}`);
  }

  for (const field of ["id", "name", "description"]) {
    if (typeof projectMetadata[field] !== "string" || projectMetadata[field].trim() === "") {
      throw new Error(`Invalid project ${projectDirectory.name}: ${field} must be a non-empty string`);
    }
  }
  if (projectMetadata.id !== projectDirectory.name) {
    throw new Error(`Invalid project ${projectDirectory.name}: metadata id must match the directory name`);
  }
  if (projectIds.has(projectMetadata.id)) {
    throw new Error(`Duplicate project id: ${projectMetadata.id}`);
  }
  projectIds.add(projectMetadata.id);

  const componentEntries = await readdir(projectDir, { withFileTypes: true });
  const componentDirectories = componentEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .sort((a, b) => a.name.localeCompare(b.name));
  const components = [];

  for (const componentDirectory of componentDirectories) {
    const componentDir = path.join(projectDir, componentDirectory.name);
    const metadataPath = path.join(componentDir, "meta.json");
    const htmlPath = path.join(componentDir, "index.html");
    let metadata;

    try {
      metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      await readFile(htmlPath, "utf8");
    } catch (error) {
      throw new Error(`Invalid component ${projectMetadata.id}/${componentDirectory.name}: ${error.message}`);
    }

    for (const field of ["id", "name", "device", "category", "description"]) {
      if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
        throw new Error(`Invalid component ${projectMetadata.id}/${componentDirectory.name}: ${field} must be a non-empty string`);
      }
    }
    if (metadata.id !== componentDirectory.name) {
      throw new Error(`Invalid component ${projectMetadata.id}/${componentDirectory.name}: metadata id must match the directory name`);
    }
    if (!validDevices.has(metadata.device)) {
      throw new Error(`Invalid component ${projectMetadata.id}/${componentDirectory.name}: device must be desktop, tablet, or mobile`);
    }

    const componentKey = `${projectMetadata.id}/${metadata.id}`;
    if (componentKeys.has(componentKey)) throw new Error(`Duplicate component id in project: ${componentKey}`);
    componentKeys.add(componentKey);
    if (metadata.published !== true) continue;

    components.push({
      id: metadata.id,
      name: metadata.name,
      device: metadata.device,
      category: metadata.category,
      description: metadata.description,
      path: `./components/${projectDirectory.name}/${componentDirectory.name}/index.html`
    });
  }

  projects.push({
    id: projectMetadata.id,
    name: projectMetadata.name,
    description: projectMetadata.description,
    boardPath: `./components/${projectDirectory.name}/board.json`,
    components
  });
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2)}\n`);
const componentCount = projects.reduce((count, project) => count + project.components.length, 0);
console.log(`Generated component-library.json with ${projects.length} projects and ${componentCount} components.`);
