#!/usr/bin/env node
/** Synchronize bundled site icon mappings from nabla-compose's authoritative catalog.
 *
 * This script is deliberately offline: provide a local checkout or downloaded
 * catalog/service-icons.json as --source. Next.js builds never fetch GitHub.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_DIR = join(ROOT, "public/assets/selfh-icons");
const OUTPUT = join(ROOT, "lib/homelabCatalogIcons.generated.ts");
const SERVICE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ASSET_FILE = /^[a-zA-Z0-9._-]+\.(?:svg|png|jpg)$/;

/** Validate both the upstream authority and the local asset contract. */
export function renderIconModule(catalog, assetDirectory = ICON_DIR) {
  if (!catalog || catalog.version !== 1 ||
      !catalog.icons || typeof catalog.icons !== "object" ||
      !catalog.webAssets || typeof catalog.webAssets !== "object" ||
      Array.isArray(catalog.webAssets)) {
    throw new Error("Expected nabla-compose catalog/service-icons.json with webAssets");
  }
  const entries = Object.entries(catalog.webAssets).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (entries.length === 0) throw new Error("No service icon mappings in upstream catalog");
  for (const [id, filename] of entries) {
    if (!SERVICE_ID.test(id) || typeof filename !== "string" ||
        !ASSET_FILE.test(filename) || filename.includes("..") ||
        !existsSync(join(assetDirectory, filename))) {
      throw new Error(`Invalid or missing local icon: ${id} -> ${filename}`);
    }
  }
  return [
    "/** GENERATED from nabla-compose/catalog/service-icons.json webAssets. */",
    "/** Do not edit: node scripts/sync-homelab-icons.mjs --source ../nabla-compose/catalog/service-icons.json */",
    "export const HOMELAB_CATALOG_ICON_FILES: Readonly<Record<string, string>> = " +
      JSON.stringify(Object.fromEntries(entries), null, "\t") + ";",
    "",
  ].join("\n");
}

function main(argv) {
  const sourceIndex = argv.indexOf("--source");
  if (sourceIndex < 0 || !argv[sourceIndex + 1] ||
      argv[sourceIndex + 1].startsWith("--") ||
      argv.some((arg) => arg.startsWith("--") && arg !== "--source" && arg !== "--check")) {
    throw new Error("Usage: node scripts/sync-homelab-icons.mjs --source ../nabla-compose/catalog/service-icons.json [--check]");
  }
  const source = resolve(argv[sourceIndex + 1]);
  const expected = renderIconModule(JSON.parse(readFileSync(source, "utf8")));
  if (argv.includes("--check")) {
    if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== expected) {
      throw new Error("Icons are out of sync: rerun without --check and commit the generated file");
    }
    process.stdout.write("Icon mapping matches nabla-compose; all assets exist.\n");
  } else {
    writeFileSync(OUTPUT, expected, "utf8");
    process.stdout.write("Generated " + OUTPUT + "\n");
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(String(error.message ?? error) + "\n");
    process.exitCode = 1;
  }
}
