import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("merged OWNER resource controls remain private after TrueNAS refactor", () => {
  const block = read("app/components/homelab/HomelabServicesBlock.tsx");
  const grid = read("app/components/homelab/HomelabServiceGrid.tsx");
  const card = read("app/components/homelab/HomelabServiceCard.tsx");
  assert.match(block, /\{!readOnly && \(\s*<HomelabResourceSnapshotImport/);
  assert.match(block, /ownerAllowed=\{!state\.ownerBoundary\}/);
  assert.match(block, /catalogRevision=\{state\.catalog\.catalogRevision\}/);
  assert.match(block, /resources=\{resourceSnapshot\}/);
  assert.match(grid, /!readOnly && !ownerBoundary/);
  assert.match(card, /!readOnly && resource/);
});

test("resource snapshot hydration is cancellable and revocation deletes storage immediately", () => {
  const importer = read("app/components/homelab/HomelabResourceSnapshotImport.tsx");
  const effect = importer.slice(importer.indexOf("useEffect(() => {"), importer.indexOf("async function importFile"));
  assert.match(effect, /if \(!ownerAllowed\)/);
  assert.match(effect, /localStorage\.removeItem\(RESOURCE_SNAPSHOT_KEY\)/);
  assert.doesNotMatch(effect.slice(0, effect.indexOf("queueMicrotask(")), /setSnapshot\(|onSnapshot\(/);
  assert.match(effect, /queueMicrotask\(\(\) => \{/);
  assert.match(effect, /if \(cancelled\) return/);
  assert.match(effect, /setSnapshot\(restored\)/);
  assert.match(effect, /onSnapshot\(restored\)/);
  assert.match(effect, /return \(\) => \{\s*cancelled = true;/);
  assert.match(effect, /\}, \[ownerAllowed, onSnapshot\]\);/);
  assert.doesNotMatch(importer, /eslint-disable-next-line react-hooks\/exhaustive-deps/);
  assert.match(importer, /if \(!ownerAllowed\) return null/);
  assert.doesNotMatch(importer, /fetch\(/);
});

test("health filters still exist independently of resource controls", () => {
  const filters = read("app/components/homelab/HomelabServiceFilters.tsx");
  const block = read("app/components/homelab/HomelabServicesBlock.tsx");
  assert.match(block, /<HomelabServiceFilters/);
  assert.match(filters, /data-homelab-health-filter=\{healthState\}/);
  assert.match(filters, /data-homelab-service-search/);
  assert.match(filters, /data-homelab-presentation-filter/);
  assert.doesNotMatch(filters, /ResourceSnapshot|localStorage|ownerAllowed/);
});
