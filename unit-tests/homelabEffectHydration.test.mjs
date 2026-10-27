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
  assert.match(source.slice(hydrate, hydrate + 700), /setState\(\s*cachedCatalog/);
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
  assert.match(hydration, /: INITIAL_HOMELAB_SERVICES_STATE,?\s*\);/);
});

test("OWNER-to-SERVICE transition masks old scope synchronously", () => {
  assert.match(source, /if \(!catalogScopeMatches\(state\.catalogScope, readOnly\)\)/);
  assert.match(source, /snapshot: null/);
  assert.match(source, /siteHealthTraceId: null/);
  assert.match(source, /siteHealthTraceConfirmed: false/);
  assert.match(source, /return \(\) => \{/);
  assert.match(source, /initialController\.abort\(\)/);
});

test("health selectors remain independently testable without hook-side effects", () => {
  const selectors = readFileSync(
    new URL("../app/components/homelab/homelabHealthSelectors.ts", import.meta.url),
    "utf8",
  );
  for (const exported of ["healthIndex", "effectiveState", "countHealthStates"]) {
    assert.match(selectors, new RegExp(`export function ${exported}\\(`));
    assert.match(source, new RegExp(`\\b${exported}\\b`));
  }
  assert.match(selectors, /canonicalHomelabEvidence\(index, serviceId\)/);
  assert.match(selectors, /return "unknown"/);
  assert.doesNotMatch(selectors, /fetch\(|localStorage|sessionStorage|useEffect\(/);
  assert.doesNotMatch(source, /export function countHealthStates\(/);
});
