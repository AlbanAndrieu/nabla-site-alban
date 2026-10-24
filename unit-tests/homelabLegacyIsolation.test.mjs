import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Backstage v2 runtime service model imports no legacy v1 catalog", () => {
  const runtime = read("lib/homelabServices.ts");
  const server = read("lib/homelabServicesServer.ts");
  assert.doesNotMatch(runtime, /import\s+.+\s+from\s+["'][^"']*homelab-services\.json/);
  assert.doesNotMatch(runtime, /homelab-navigation-overrides\.json/);
  assert.doesNotMatch(runtime, /getStaticHomelabServicesCatalog|parseHomelabServicesCatalog/);
  assert.match(server, /fetchSiteCatalogV2\(\)/);
  assert.doesNotMatch(server, /homelabLegacyCatalogFixture|LOCAL_FALLBACK/);
});

test("legacy compatibility remains an isolated test-only module", () => {
  const fixture = read("unit-tests/helpers/homelabLegacyCatalogFixture.ts");
  const tests = read("unit-tests/homelabServicesSource.test.ts");
  assert.match(fixture, /public\/homelab-services\.json/);
  assert.match(tests, /from "\.\/helpers\/homelabLegacyCatalogFixture"/);
  assert.doesNotMatch(read("app/components/homelab/HomelabServiceGrid.tsx"),
    /homelabServiceEndpointUrl/);
});
