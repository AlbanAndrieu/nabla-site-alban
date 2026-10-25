import assert from "node:assert/strict";
import test from "node:test";
import { projectC4Topology, c4NodeRelations } from "../app/[locale]/architecture/c4ArchitectureModel.ts";
import { catalogHttpFailureStage, catalogTransportFailureStage, parseOwnerCatalogIncident, visibleCatalogFailureDetails } from "../lib/homelabCatalogFailureStage.ts";
import { catalogFailureReason, catalogScopeMatches } from "../lib/homelabClientAccessBoundary.ts";
import { uniqueHomelabEvidenceIndex } from "../lib/homelabHealthIdentity.ts";

const topology = {
  catalogRevision: "test-revision",
  nodes: [
    { id: "api", name: "API", kind: "api", category: "application", privateUrl: "http://172.17.0.24:8091" },
    { id: "site", name: "Site", kind: "website", category: "application" },
  ],
  relations: [{ source: "site", target: "api", type: "dependsOn" }],
};

test("C4 L1 displays conceptual system context without live probes", () => {
  const result = projectC4Topology(topology, "context");
  assert.equal(result.revision, "test-revision");
  assert.ok(result.nodes.some((node) => node.role === "person"));
  assert.ok(result.nodes.some((node) => node.role === "system"));
});

test("C4 L2 uses declared edges and does not copy private URLs", () => {
  const result = projectC4Topology(topology, "containers");
  assert.equal(result.links.length, 1);
  assert.equal(c4NodeRelations(result, "api").length, 1);
  assert.deepEqual(c4NodeRelations(result, "absent"), []);
  assert.doesNotMatch(JSON.stringify(result), /172\.17\.|privateUrl/);
});

test("C4 L2 bounds large catalogs without inventing health", () => {
  const large = { nodes: Array.from({ length: 40 }, (_, i) => ({ id: "service-" + i, name: "Service " + i, kind: "app", category: "app" })), relations: [] };
  const projection = projectC4Topology(large, "containers");
  assert.equal(projection.nodes.length, 16);
  assert.equal(projection.omitted, 24);
  assert.deepEqual(projection, projectC4Topology(large, "containers"));
});

test("catalog stages classify failure without forwarding untrusted headers", () => {
  assert.equal(catalogHttpFailureStage(503, "catalog_validation"), "catalog_validation");
  assert.equal(catalogHttpFailureStage(503, "172.17.0.24"), "upstream_http");
  assert.equal(catalogHttpFailureStage(403, "catalog_validation"), "upstream_auth");
  const aborted = new Error("timeout");
  aborted.name = "AbortError";
  assert.equal(catalogTransportFailureStage(aborted), "upstream_timeout");
});

test("public catalog errors never expose private stage, request ID or configuration denial", () => {
  const id = "f82c6652-fcf3-4a89-9f05-3c2e3cc214fd";
  const details = visibleCatalogFailureDetails(false, "key-missing", "site_configuration", id);
  assert.deepEqual(details, { reason: "unavailable" });
  assert.ok(!JSON.stringify(details).includes(id));
  assert.deepEqual(visibleCatalogFailureDetails(true, "access-denied", "upstream_auth", id), { reason: "access-denied", stage: "upstream_auth", requestId: id });
});

test("OWNER incident requires a safe stage and UUID", () => {
  const id = "f82c6652-fcf3-4a89-9f05-3c2e3cc214fd";
  assert.deepEqual(parseOwnerCatalogIncident("upstream_timeout", id), { stage: "upstream_timeout", requestId: id });
  assert.equal(parseOwnerCatalogIncident("raw-header-private", id), null);
  assert.equal(parseOwnerCatalogIncident("upstream_auth", "bad-id"), null);
});

test("OWNER snapshots are blocked synchronously after access-mode changes", () => {
  assert.equal(catalogScopeMatches("owner", true), false);
  assert.equal(catalogScopeMatches("public", false), false);
  assert.equal(catalogScopeMatches("owner", false), true);
  assert.equal(catalogFailureReason({ reason: "hostname-private" }), "unavailable");
});

test("duplicated service observations do not pick a different upstream", () => {
  const index = uniqueHomelabEvidenceIndex([
    { id: "api", name: "API", url: "https://example.test/api" },
    { id: "api", name: "API clone", url: "https://example.test/other" },
  ]);
  assert.equal(index.byId.has("api"), false);
  assert.ok(index.ambiguousIds.has("api"));
});
