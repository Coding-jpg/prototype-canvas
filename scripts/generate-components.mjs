import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, "components");
const outputPath = path.join(rootDir, "component-library.json");
const validDevices = new Set(["desktop", "tablet", "mobile"]);

const entries = await readdir(componentsDir, { withFileTypes: true });
const directories = entries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
const components = [];
const ids = new Set();

for (const directory of directories) {
  const componentDir = path.join(componentsDir, directory.name);
  const metadataPath = path.join(componentDir, "meta.json");
  const htmlPath = path.join(componentDir, "index.html");

  let metadata;
  try {
    metadata = JSON.parse(await readFile(metadataPath, "utf8"));
    await readFile(htmlPath, "utf8");
  } catch (error) {
    throw new Error(`Invalid component ${directory.name}: ${error.message}`);
  }

  for (const field of ["id", "name", "device", "category", "description"]) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      throw new Error(`Invalid component ${directory.name}: ${field} must be a non-empty string`);
    }
  }

  if (metadata.id !== directory.name) {
    throw new Error(`Invalid component ${directory.name}: metadata id must match the directory name`);
  }
  if (!validDevices.has(metadata.device)) {
    throw new Error(`Invalid component ${directory.name}: device must be desktop, tablet, or mobile`);
  }
  if (ids.has(metadata.id)) {
    throw new Error(`Duplicate component id: ${metadata.id}`);
  }

  ids.add(metadata.id);
  components.push({
    id: metadata.id,
    name: metadata.name,
    device: metadata.device,
    category: metadata.category,
    description: metadata.description,
    path: `./components/${directory.name}/index.html`
  });
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), components }, null, 2)}\n`);
console.log(`Generated component-library.json with ${components.length} components.`);
