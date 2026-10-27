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

test("revocation and replacement cancel pending resource imports", () => {
  const importer = read("app/components/homelab/HomelabResourceSnapshotImport.tsx");
  assert.match(importer, /ownerSession\.current = ownerAllowed/);
  assert.match(importer, /ownerSession\.current = false/);
  assert.match(importer, /importSequence\.current \+= 1/);
  assert.match(importer, /const sequence = \+\+importSequence\.current/);
  assert.match(importer, /if \(!ownerSession\.current \|\| sequence !== importSequence\.current\) return/);
  assert.match(importer, /const contents = await file\.text\(\)/);
  assert.match(importer, /if \(!file \|\| !ownerAllowed \|\| !ownerSession\.current\) return/);
  assert.match(importer, /importSequence\.current \+= 1;\s*try \{ window\.localStorage\.removeItem/);
});

test("resource age ticks after commit and never reads the clock during render", () => {
  const importer = read("app/components/homelab/HomelabResourceSnapshotImport.tsx");
  assert.match(importer, /useState<number \| null>\(null\)/);
  assert.match(importer, /window\.setTimeout\(\(\) => setNow\(Date\.now\(\)\), 0\)/);
  assert.match(importer, /window\.setInterval\(\(\) => setNow\(Date\.now\(\)\), 60_000\)/);
  assert.match(importer, /window\.clearInterval\(interval\)/);
  assert.match(importer, /window\.clearTimeout\(initial\)/);
  assert.match(importer, /snapshotAgeState\(snapshot, now, catalogRevision\)/);
  assert.doesNotMatch(importer, /snapshotAgeState\(snapshot, Date\.now\(\)/);
  assert.doesNotMatch(importer, /useState\(\(\) => Date\.now\(\)\)/);
});

test("SERVICE admission deletes browser OWNER resource evidence but preserves public caches", () => {
  const block = read("app/components/homelab/HomelabServicesBlock.tsx");
  assert.match(block, /if \(!readOnly\) return;/);
  assert.match(block, /window\.localStorage\.removeItem\(RESOURCE_SNAPSHOT_KEY\)/);
  assert.match(block, /queueMicrotask\(\(\) => \{/);
  assert.match(block, /if \(!cancelled\) setResourceSnapshot\(null\)/);
  assert.match(block, /return \(\) => \{ cancelled = true; \}/);
  assert.doesNotMatch(block, /clearPublicHomelabBrowserCache/);
  assert.match(block, /resources=\{resourceSnapshot\}/);
  assert.match(block, /ownerAllowed=\{!state\.ownerBoundary\}/);
});
