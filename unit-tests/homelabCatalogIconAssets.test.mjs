import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";

const iconDirectory = fileURLToPath(new URL("../public/assets/selfh-icons/", import.meta.url));
const generatedSource = readFileSync(
  new URL("../lib/homelabCatalogIcons.generated.ts", import.meta.url),
  "utf8",
);
const generatedMatch = generatedSource.match(
  /export const HOMELAB_CATALOG_ICON_FILES:[\s\S]*?=\s*(\{[\s\S]*?\})\s*;/,
);
assert.ok(generatedMatch, "the Compose-generated icon mapping must be present");
const mapping = JSON.parse(generatedMatch[1]);

function invalidIconAssets(icons, directory) {
  const invalid = [];
  for (const [serviceId, filename] of Object.entries(icons)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(serviceId) ||
        typeof filename !== "string" ||
        !/^[a-zA-Z0-9._-]+\.(?:svg|png|jpg)$/.test(filename) ||
        filename.includes("..")) {
      invalid.push(serviceId);
      continue;
    }
    const filepath = join(directory, filename);
    if (!existsSync(filepath)) {
      invalid.push(serviceId);
      continue;
    }
    const info = lstatSync(filepath);
    if (!info.isFile() || info.size === 0) invalid.push(serviceId);
  }
  return invalid;
}

test("every generated Compose icon resolves to a non-empty bundled asset", () => {
  assert.ok(Object.keys(mapping).length > 0);
  assert.deepEqual(invalidIconAssets(mapping, iconDirectory), []);
});

test("unknown services have a local generic fallback", () => {
  assert.deepEqual(invalidIconAssets({ fallback: "generic-app.svg" }, iconDirectory), []);
});

test("important TrueNAS services retain distinct local branded mappings", () => {
  const expected = ["truenas", "sentry", "openwebui", "homeassistant", "adguardhome", "nexus", "prometheus", "defectdojo"];
  for (const service of expected) assert.ok(mapping[service], "missing branded identity: " + service);
  assert.equal(new Set(expected.map((service) => mapping[service])).size, expected.length);
});

test("invalid or absent icon assets are rejected", () => {
  for (const invalid of ["../private.svg", "https://remote.example/icon.svg", "missing.svg", "empty.svg"]) {
    assert.deepEqual(invalidIconAssets({ service: invalid }, iconDirectory), ["service"]);
  }
  assert.deepEqual(invalidIconAssets({ "Invalid-ID": "grafana-icon.svg" }, iconDirectory), ["Invalid-ID"]);
});

test("symlinks are not acceptable as public icon assets", () => {
  const folder = mkdtempSync(join(tmpdir(), "homelab-icon-contract-"));
  try {
    symlinkSync(join(iconDirectory, "generic-app.svg"), join(folder, "linked.svg"));
    assert.deepEqual(invalidIconAssets({ service: "linked.svg" }, folder), ["service"]);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
