import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("TrueNAS cards replace a failed local icon without retrying a broken image", () => {
  const component = source("app/components/homelab/HomelabServiceCard.tsx");
  assert.match(component, /failedIconSrc === iconSrc/);
  assert.match(component, /onError=\{\(\) => setFailedIconSrc\(iconSrc\)\}/);
  assert.match(component, /data-service-icon-fallback=\{serviceId\}/);
  assert.match(component, /homelabIconFallback\(serviceId, svc\.name\)/);
});

test("ReactFlow nodes replace failed image URLs with service-specific monograms", () => {
  const component = source("app/[locale]/architecture/HierarchicalArchitectureNodes.tsx");
  assert.match(component, /failedIconSrc !== item\.iconSrc/);
  assert.match(component, /onError=\{\(\) => setFailedIconSrc\(item\.iconSrc \?\? null\)\}/);
  assert.match(component, /data-architecture-icon-fallback=\{id\}/);
  assert.match(component, /homelabIconFallback\(id, item\.name\)/);
});

test("public catalog storage remains sanitized and cached health is never green", () => {
  const cache = source("lib/homelabPublicBrowserCache.ts");
  assert.match(cache, /boardState: "stale", services/);
  assert.match(cache, /state: "unknown"/);
  assert.doesNotMatch(cache, /service\.internalHost/);
  assert.doesNotMatch(cache, /service\.endpointUrl/);
});
