import assert from "node:assert/strict";
import test from "node:test";
import { auditHeadersForUrl, expectedAccessMode, auditStoredEntries, classifyAuditAccess, safeRateLimitMetadata } from "../scripts/homelab-audit-policy.mjs";
test("JWT never reaches third-party assets or redirects", () => {
  const jwt = "test-jwt", origin = "https://www.albanandrieu.com";
  assert.equal(auditHeadersForUrl(origin + "/fr/truenas", origin, jwt)["cf-access-jwt-assertion"], jwt);
  for (const target of ["https://example.com", "https://www.albanandrieu.com.attacker.test", "http://www.albanandrieu.com"]) {
    assert.equal(auditHeadersForUrl(target, origin, jwt)["cf-access-jwt-assertion"], undefined);
  }
});
test("OWNER SERVICE DENIED modes are fail-closed", () => {
  assert.equal(expectedAccessMode({ trusted: true }), "owner");
  assert.equal(expectedAccessMode({ trusted: true, mode: "public-readonly" }), "service");
  assert.equal(expectedAccessMode({ trusted: false, mode: "public-readonly" }), "denied");
  assert.equal(expectedAccessMode(null), "denied");
});
test("public browser cache remains allowlisted", () => {
  assert.deepEqual(auditStoredEntries([["nabla:homelab:catalog-public-v2:3", "safe"]], "localStorage"), []);
  assert.equal(auditStoredEntries([["nabla:homelab:owner", "x"]], "sessionStorage").length, 1);
  assert.equal(auditStoredEntries([["nabla:homelab:health-public-v2:1", "172.17.0.24"]], "localStorage").length, 1);
});

test("HTTP 429 and malformed 200 cannot masquerade as a denied OWNER", () => {
  for (const status of [429, 403, 502]) {
    const state = classifyAuditAccess(status, { trusted: false });
    assert.equal(state.ok, false);
    assert.equal(state.mode, null);
  }
  assert.equal(classifyAuditAccess(429, { trusted: true }).reason, "rate_limited");
  assert.equal(classifyAuditAccess(200, null).reason, "invalid_access_payload");
  assert.equal(classifyAuditAccess(200, { trusted: false }).mode, "denied");
  assert.equal(classifyAuditAccess(200, { trusted: true }).mode, "owner");
});

test("429 metadata is allowlisted, never echoes secrets", () => {
  assert.deepEqual(safeRateLimitMetadata({
    "retry-after": "90",
    "x-vercel-id": "cdg1::sfo1-1234",
    "cf-ray": "abc123456789-def",
    "set-cookie": "do-not-log",
    "x-diagnostics-key": "do-not-log",
  }), {
    retryAfterSeconds: 90,
    vercelRequestId: "cdg1::sfo1-1234",
    cloudflareRay: "abc123456789-def",
  });
  assert.deepEqual(safeRateLimitMetadata({ "retry-after": "999999", "x-vercel-id": "bad\nSecret:abc" }), {});
});
