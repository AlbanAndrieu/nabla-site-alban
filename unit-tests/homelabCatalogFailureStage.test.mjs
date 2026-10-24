import assert from "node:assert/strict";
import test from "node:test";
import { catalogHttpFailureStage, catalogTransportFailureStage } from "../lib/homelabCatalogFailureStage.ts";

test("only allowlisted FastAPI failure stages can reach the SITE operator", () => {
  assert.equal(catalogHttpFailureStage(503, "catalog_validation"), "catalog_validation");
  assert.equal(catalogHttpFailureStage(503, "upstream_timeout"), "upstream_timeout");
  assert.equal(catalogHttpFailureStage(503, "hostname=172.17.0.24"), "upstream_http");
  assert.equal(catalogHttpFailureStage(502, "catalog_validation"), "upstream_http");
  assert.equal(catalogHttpFailureStage(403, "catalog_validation"), "upstream_auth");
});

test("timeouts are not confused with generic fetch/network errors", () => {
  const timeout = new Error("request expired");
  timeout.name = "AbortError";
  assert.equal(catalogTransportFailureStage(timeout), "upstream_timeout");
  assert.equal(catalogTransportFailureStage(new TypeError("fetch failed")), "upstream_network");
});

test("an OWNER incident requires a valid request identifier and allowlisted stage", async () => {
  const { parseOwnerCatalogIncident } = await import("../lib/homelabCatalogFailureStage.ts");
  const id = "f82c6652-fcf3-4a89-9f05-3c2e3cc214fd";
  assert.deepEqual(parseOwnerCatalogIncident("catalog_validation", id), { stage: "catalog_validation", requestId: id });
  assert.equal(parseOwnerCatalogIncident("hostname=private", id), null);
  assert.equal(parseOwnerCatalogIncident("upstream_auth", "not-a-request-id"), null);
});

test("catalog routes and OWNER UI share the diagnostic contract", async () => {
  const { readFileSync } = await import("node:fs");
  const owner = readFileSync(new URL("../app/api/homelab-services/route.ts", import.meta.url), "utf8");
  const canonical = readFileSync(new URL("../app/api/homelab-catalog-v2/route.ts", import.meta.url), "utf8");
  const component = readFileSync(new URL("../app/components/homelab/HomelabServicesBlock.tsx", import.meta.url), "utf8");
  assert.match(owner, /catalogUnavailableResponse\(/);
  assert.match(canonical, /catalogUnavailableResponse\(/);
  assert.match(component, /!readOnly && state\.error && state\.catalogIncident/);
});
