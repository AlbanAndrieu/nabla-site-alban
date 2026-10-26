import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url),
  "utf8",
);

test("access-scope reset never synchronously sets React state inside the effect", () => {
  const start = source.indexOf("\tuseEffect(() => {", source.indexOf("export function useHomelabHealth"));
  const hydrate = source.indexOf("\t\tqueueMicrotask(() => {", start);
  assert.ok(start >= 0 && hydrate > start);
  assert.doesNotMatch(source.slice(start, hydrate), /setState\(/);
  assert.match(source.slice(hydrate, hydrate + 700), /if \(initialController\.signal\.aborted\) return/);
  assert.match(source.slice(hydrate, hydrate + 700), /setState\(cachedCatalog/);
});

test("only validated SERVICE cache is hydrated and stale statuses stay unavailable", () => {
  assert.match(source, /if \(!readOnly\) return null;/);
  assert.match(source, /readPublicCatalogCache\(publicStorage\)/);
  const start = source.indexOf("\t\tqueueMicrotask(() => {");
  const hydration = source.slice(start, start + 1100);
  assert.match(hydration, /\.\.\.INITIAL_HOMELAB_SERVICES_STATE/);
  assert.match(hydration, /catalogScope: "public"/);
  assert.match(hydration, /catalogStale: true/);
  assert.match(hydration, /readStalePublicHealthCache/);
  assert.match(hydration, /healthUnavailable: true/);
  assert.match(hydration, /: INITIAL_HOMELAB_SERVICES_STATE\);/);
});

test("OWNER-to-SERVICE transition masks old scope synchronously", () => {
  assert.match(source, /if \(!catalogScopeMatches\(state\.catalogScope, readOnly\)\)/);
  assert.match(source, /snapshot: null/);
  assert.match(source, /siteHealthTraceId: null/);
  assert.match(source, /siteHealthTraceConfirmed: false/);
  assert.match(source, /return \(\) => \{/);
  assert.match(source, /initialController\.abort\(\)/);
});
