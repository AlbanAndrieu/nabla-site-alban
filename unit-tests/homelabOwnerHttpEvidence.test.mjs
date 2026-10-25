import assert from "node:assert/strict";
import test from "node:test";
import { ownerHttpObservationState, ownerLatencyObserved } from "../lib/homelabOwnerHttpEvidence.ts";

const probe = (overrides = {}) => ({
  state: "observed", observedAt: "2026-10-25T11:00:00.000Z",
  source: "origin", latencyMs: 120, status: "HTTP 200", ...overrides,
});

test("historical HTTP 200 without a measured probe remains UNKNOWN", () => {
  assert.equal(ownerHttpObservationState(probe({ observedAt: null, state: "not-run" }), 200, false, false), "unknown");
});

test("fresh timestamped HTTP 200 can be healthy", () => {
  assert.equal(ownerHttpObservationState(probe(), 200, false, false), "ok");
  assert.equal(ownerHttpObservationState(probe({ source: "memory" }), 204, false, false), "ok");
});

test("403 protected origin stays warning and 5xx stays failed", () => {
  assert.equal(ownerHttpObservationState(probe(), 403, false, true), "warn");
  assert.equal(ownerHttpObservationState(probe({ state: "failed" }), 503, false, false), "fail");
});

test("stale, deadline or invalid status cannot create false green", () => {
  assert.equal(ownerHttpObservationState(probe(), 200, true, false), "unknown");
  assert.equal(ownerHttpObservationState(probe({ source: "deadline" }), 200, false, false), "unknown");
  assert.equal(ownerHttpObservationState(probe({ source: null }), 200, false, false), "unknown");
  assert.equal(ownerHttpObservationState(probe({ state: "failed" }), 200, false, false), "unknown");
  for (const value of [undefined, "200", -1, 99, 600, NaN, Infinity, 200.5])
    assert.equal(ownerHttpObservationState(probe(), value, false, false), "unknown");
});

test("latency requires its own completed fresh probe", () => {
  assert.equal(ownerLatencyObserved(probe(), false), true);
  assert.equal(ownerLatencyObserved(probe({ source: "deadline" }), false), false);
  assert.equal(ownerLatencyObserved(probe({ source: null }), false), false);
  assert.equal(ownerLatencyObserved(probe({ observedAt: null }), false), false);
  assert.equal(ownerLatencyObserved(probe(), true), false);
  assert.equal(ownerLatencyObserved(probe({ latencyMs: null }), false), false);
});
