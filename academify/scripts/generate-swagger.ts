import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { generateSwaggerSpec } from "../lib/swagger";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "openapi.json");

const spec = generateSwaggerSpec();
const pathCount = Object.keys((spec as { paths?: Record<string, unknown> }).paths ?? {}).length;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(spec, null, 2));

console.log(`Wrote ${outPath} (${pathCount} paths)`);
