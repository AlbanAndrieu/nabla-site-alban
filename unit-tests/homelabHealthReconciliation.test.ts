import assert from "node:assert/strict";
import test from "node:test";
import type { HomelabHealthEntry } from "../lib/homelabHealth";
import { reconcileHomelabHealth } from "../lib/homelabHealthReconciliation";

function entry(overrides: Partial<HomelabHealthEntry> = {}): HomelabHealthEntry {
	return {
		name: "service",
		url: "https://service.example.test",
		reachable: true,
		http_status: 200,
		state: "ok",
		...overrides,
	};
}

test("reachable application errors are degraded rather than downtime", () => {
	const result = reconcileHomelabHealth(entry({ application_error: "backend unhealthy" }));
	assert.equal(result.state, "warn");
	assert.equal(result.reason, "application_error");
});

test("failed public probe with a fresh RUNNING origin is degraded", () => {
	const result = reconcileHomelabHealth(
		entry({ direct_state: "fail", http_status: 503, runtime_state: "RUNNING" }),
		{ external: true },
	);
	assert.equal(result.state, "warn");
});

test("failed private probe with a fresh RUNNING origin is degraded, never green", () => {
	const result = reconcileHomelabHealth(
		entry({ direct_state: "fail", http_status: 503, runtime_state: "RUNNING" }),
		{ external: false },
	);
	assert.equal(result.state, "warn");
});

test("failed HTTP probe without origin proof is red", () => {
	const result = reconcileHomelabHealth(
		entry({ direct_state: "fail", http_status: 503, state: "fail" }),
		{ external: false },
	);
	assert.equal(result.state, "fail");
	assert.equal(result.reason, "http_failure");
});

test("fresh STOPPED runtime is authoritative without a current 2xx origin", () => {
	const result = reconcileHomelabHealth(
		entry({ direct_state: "ok", http_status: 302, runtime_state: "STOPPED" }),
	);
	assert.equal(result.state, "fail");
	assert.equal(result.reason, "runtime_failure");
});

test("fresh DEPLOYING runtime is not considered an available application", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, state: "unknown", runtime_state: "DEPLOYING" }),
	);
	assert.equal(result.state, "fail");
});

test("healthy 2xx origin with a failed runtime is degraded instead of green", () => {
	const result = reconcileHomelabHealth(
		entry({ direct_state: "ok", http_status: 200, runtime_state: "STOPPED" }),
	);
	assert.equal(result.state, "warn");
});

test("unreachable RUNNING runtime cannot rescue a failed application probe", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "fail",
			http_status: 503,
			state: "fail",
			runtime_state: "RUNNING",
			runtime_reachable: false,
		}),
	);
	assert.equal(result.state, "fail");
});

test("stale RUNNING runtime cannot rescue a failed application probe", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "fail",
			http_status: 503,
			state: "fail",
			runtime_state: "RUNNING",
			runtime_stale: true,
		}),
	);
	assert.equal(result.state, "fail");
});

test("stale healthy Cloudflare observation cannot rescue a failed origin", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "fail",
			http_status: 503,
			state: "fail",
			tunnel_status: "healthy",
			tunnel_stale: true,
		}),
		{ tunnelExpected: true },
	);
	assert.equal(result.state, "fail");
});

test("Cloudflare-only health is degraded evidence, not application health", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, state: "unknown", tunnel_status: "healthy" }),
		{ tunnelExpected: true },
	);
	assert.equal(result.state, "warn");
});

test("failed Cloudflare exposure alone is degraded, not origin downtime", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, state: "unknown", tunnel_status: "failed" }),
		{ external: true, tunnelExpected: true },
	);
	assert.equal(result.state, "warn");
});

test("Cloudflare telemetry is ignored when no tunnel is configured", () => {
	const result = reconcileHomelabHealth(
		entry({
			http_status: 0,
			state: "unknown",
			runtime_state: "RUNNING",
			tunnel_status: "failed",
		}),
		{ external: false, tunnelExpected: false },
	);
	assert.equal(result.state, "warn");
	assert.equal(result.evidence.some((item) => item.kind === "cloudflare"), false);
});

test("healthy runtime with failed internal evidence is degraded", () => {
	const result = reconcileHomelabHealth(
		entry({
			http_status: 0,
			state: "unknown",
			runtime_state: "RUNNING",
			internal_state: "fail",
		}),
	);
	assert.equal(result.state, "warn");
});

test("multiple fresh healthy proofs reconcile to ok", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "ok",
			http_status: 200,
			runtime_state: "RUNNING",
			tunnel_status: "healthy",
		}),
		{ external: true, tunnelExpected: true },
	);
	assert.equal(result.state, "ok");
	assert.equal(result.reason, "healthy_evidence");
});

test("insufficient evidence preserves an old-schema unknown", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, reachable: false, state: "unknown" }),
	);
	assert.equal(result.state, "unknown");
});
