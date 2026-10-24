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
