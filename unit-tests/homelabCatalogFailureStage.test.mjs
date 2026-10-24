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

test("Architecture and TrueNAS share failure reasons, while only OWNER may receive incident details", async () => {
  const { readFileSync } = await import("node:fs");
  const { catalogFailureReason } = await import("../lib/homelabClientAccessBoundary.ts");
  assert.equal(catalogFailureReason({ reason: "key-missing" }), "key-missing");
  assert.equal(catalogFailureReason({ reason: "arbitrary upstream" }), "unavailable");
  const arch = readFileSync(new URL("../app/[locale]/architecture/ArchitecturePrivateViews.tsx", import.meta.url), "utf8");
  const notice = readFileSync(new URL("../app/[locale]/architecture/ArchitectureCatalogNotice.tsx", import.meta.url), "utf8");
  assert.match(arch, /ownerAuthorized\s*\?\s*parseOwnerCatalogIncident/);
  assert.match(arch, /access === "trusted" \? incident : null/);
  assert.match(notice, /incident\?\s*:\s*OwnerCatalogIncident/);
});

test("OWNER architecture results cannot survive a public/readonly transition at render time", async () => {
  const { catalogScopeMatches } = await import("../lib/homelabClientAccessBoundary.ts");
  assert.equal(catalogScopeMatches("owner", true), false);
  assert.equal(catalogScopeMatches("public", false), false);
  assert.equal(catalogScopeMatches("owner", false), true);
  assert.equal(catalogScopeMatches("public", true), true);
  const { readFileSync } = await import("node:fs");
  const component = readFileSync(new URL("../app/[locale]/architecture/ArchitecturePrivateViews.tsx", import.meta.url), "utf8");
  assert.match(component, /catalogScopeMatches\(request\.scope, !ownerAuthorized\)/);
  assert.match(component, /scope: ownerAuthorized \? "owner" : "public"/);
});

test("public catalogue failures redact provenance at the server boundary", async () => {
  const { visibleCatalogFailureDetails } = await import("../lib/homelabCatalogFailureStage.ts");
  const uuid = "f82c6652-fcf3-4a89-9f05-3c2e3cc214fd";
  assert.deepEqual(
    visibleCatalogFailureDetails(false, "key-missing", "site_configuration", uuid),
    { reason: "unavailable" },
  );
  assert.deepEqual(
    visibleCatalogFailureDetails(false, "access-denied", "upstream_auth", uuid),
    { reason: "unavailable" },
  );
  assert.deepEqual(
    visibleCatalogFailureDetails(true, "access-denied", "upstream_auth", uuid),
    { reason: "access-denied", stage: "upstream_auth", requestId: uuid },
  );
});

test("both public-readable catalog routes authorize diagnostics independently", async () => {
  const { readFileSync } = await import("node:fs");
  const owner = readFileSync(new URL("../app/api/homelab-services/route.ts", import.meta.url), "utf8");
  const canonical = readFileSync(new URL("../app/api/homelab-catalog-v2/route.ts", import.meta.url), "utf8");
  const server = readFileSync(new URL("../lib/homelabCatalogUnavailableResponse.ts", import.meta.url), "utf8");
  assert.match(owner, /catalogUnavailableResponse\(request, error/);
  assert.match(canonical, /catalogUnavailableResponse\(request, error/);
  assert.match(server, /await isTrustedHomelabRequest\(request\)/);
  assert.match(server, /visibleCatalogFailureDetails\(owner,/);
});
