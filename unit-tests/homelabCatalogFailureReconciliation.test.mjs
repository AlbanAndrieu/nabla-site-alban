import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCatalogFailure } from "../lib/homelabCatalogFailureReconciliation.ts";

const fixture = (scope) => ({
  catalogScope: scope,
  catalog: { services: [{ id: "truenas", internalHost: "172.17.0.24" }] },
  topology: { nodes: [{ id: "truenas" }] },
  snapshot: { probes: [{ id: "truenas", state: "ok" }] },
  siteHealth: { services: [{ entityRef: "component:default/truenas", state: "ok" }] },
  unrelated: "retained",
});

test("transient error retains the matching OWNER snapshot within OWNER mode", () => {
  const original = fixture("owner");
  const result = reconcileCatalogFailure(original, false, false);
  assert.equal(result.retained, true);
  assert.equal(result.state, original);
});

test("OWNER data and health never survive failure after switch to public SERVICE", () => {
  const result = reconcileCatalogFailure(fixture("owner"), true, false);
  assert.equal(result.retained, false);
  for (const field of ["catalog", "topology", "snapshot", "siteHealth"])
    assert.equal(result.state[field], null, field);
  assert.equal(result.state.unrelated, "retained");
  assert.doesNotMatch(JSON.stringify(result.state), /172\.17\.0\.24/);
});

test("public catalog cannot substitute for a newly authorized OWNER snapshot", () => {
  const result = reconcileCatalogFailure(fixture("public"), false, false);
  assert.equal(result.retained, false);
  assert.equal(result.state.catalog, null);
  assert.equal(result.state.siteHealth, null);
});

test("revocation invalidates catalog and health even inside the same scope", () => {
  for (const scope of ["owner", "public"]) {
    const result = reconcileCatalogFailure(fixture(scope), scope === "public", true);
    assert.equal(result.retained, false);
    assert.equal(result.state.catalog, null);
    assert.equal(result.state.snapshot, null);
  }
});

test("partial health data is cleared when no canonical catalog exists", () => {
  const input = { ...fixture("public"), catalog: null };
  const result = reconcileCatalogFailure(input, true, false);
  assert.equal(result.retained, false);
  assert.equal(result.state.siteHealth, null);
  assert.equal(result.state.topology, null);
});
