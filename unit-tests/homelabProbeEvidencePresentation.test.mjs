import assert from "node:assert/strict";
import test from "node:test";
import { describeServiceProbe } from "../lib/homelabProbeEvidencePresentation.ts";

const at = "2026-10-24T13:08:36Z";
const snapshot = {
  schema_version: 6,
  checked_at: at,
  internal_probes_enabled: true,
  health_board: { state: "stale", refreshing: true, generated_at: at },
  services: [],
};
const running = {
  id: "prometheus", name: "Prometheus", url: "https://prometheus.albandrieu.com/",
  runtime_state: "RUNNING", observed_at: at, reachable: false, http_status: 0,
  state: "warn",
};

test("disabled LAN is not failed, even for RUNNING Docker services", () => {
  const result = describeServiceProbe(running, { ...snapshot, internal_probes_enabled: false }, "internal");
  assert.equal(result.state, "disabled");
  assert.equal(result.observedAt, null);
});

test("a runtime inventory timestamp is not a successful public or LAN probe", () => {
  for (const scope of ["public", "internal"]) {
    const result = describeServiceProbe(running, snapshot, scope);
    assert.equal(result.state, "not-run");
    assert.equal(result.observedAt, null);
  }
});

test("last executed HTTP probe is distinct from stale global health board", () => {
  const entry = {
    ...running, http_status: 302, direct_state: "warn",
    direct_probe_source: "memory", direct_probe_observed_at: at,
    direct_probe_stale: false, latency_ms: 208,
  };
  const result = describeServiceProbe(entry, snapshot, "public");
  assert.equal(result.state, "observed");
  assert.equal(result.source, "memory");
  assert.equal(result.status, "HTTP 302");
  assert.equal(result.latencyMs, 208);
  assert.equal(result.observedAt, "2026-10-24T13:08:36.000Z");
});

test("an executed failed TCP probe is different from not-run", () => {
  const entry = {
    ...running, internal_state: "fail", internal_probe_source: "origin",
    internal_probe_observed_at: at,
  };
  const result = describeServiceProbe(entry, snapshot, "internal");
  assert.equal(result.state, "failed");
});

test("stale TCP evidence cannot confirm an outage", () => {
  const entry = {
    ...running, internal_state: "fail", internal_probe_source: "memory",
    internal_probe_observed_at: at, internal_probe_stale: true,
  };
  assert.equal(describeServiceProbe(entry, snapshot, "internal").state, "stale");
});

test("a LAN observation cannot be inferred from the Cloudflare tunnel status", () => {
  const entry = { ...running, tunnel_status: "healthy", tunnel_name: "nabla-truescale" };
  assert.equal(describeServiceProbe(entry, snapshot, "internal").state, "not-run");
});
