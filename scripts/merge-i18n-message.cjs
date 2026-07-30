#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
  console.error(
    "Usage: node merge-i18n-message.js <messages.lang.json> <patch.json>",
  );
  process.exit(1);
}
const target = process.argv[2];
const patchFile = process.argv[3];

const basePath = process.cwd();
const targetFile = path.resolve(basePath, target);
const patchPath = path.resolve(basePath, patchFile);

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`Could not read ${file} as JSON: ${e.message}`);
    process.exit(2);
  }
}

function deepMerge(base, patch) {
  for (const key in patch) {
    if (
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key]) &&
      typeof patch[key] === "object" &&
      !Array.isArray(patch[key])
    ) {
      deepMerge(base[key], patch[key]);
    } else {
      base[key] = patch[key];
    }
  }
}

const json = loadJSON(targetFile);
const patch = loadJSON(patchPath);

deepMerge(json, patch);

fs.writeFileSync(targetFile, JSON.stringify(json, null, 2), "utf8");

console.log(
  `Merged patch in ${patchFile} into ${targetFile}. All previous keys are preserved.`,
);
