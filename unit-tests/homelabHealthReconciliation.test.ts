import assert from "node:assert/strict";
import test from "node:test";
import type { HomelabHealthEntry } from "../lib/homelabHealth";
import { reconcileHomelabHealth } from "../lib/homelabHealthReconciliation";

function entry(
	overrides: Partial<HomelabHealthEntry> = {},
): HomelabHealthEntry {
	return {
		name: "service",
		url: "https://service.example.test",
		reachable: true,
		http_status: 200,
		state: "ok",
		...overrides,
	};
}

test("application errors are authoritative failures", () => {
	const result = reconcileHomelabHealth(
		entry({ application_error: "backend unhealthy" }),
	);
	assert.equal(result.state, "fail");
	assert.equal(result.reason, "application_error");
});

test("direct HTTP failure is not masked by a healthy TrueNAS runtime", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "fail",
			runtime_state: "RUNNING",
			runtime_reachable: true,
		}),
	);
	assert.equal(result.state, "fail");
	assert.equal(result.reason, "http_failure");
});

test("healthy HTTP with a failed runtime is degraded instead of green", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "ok",
			runtime_state: "STOPPED",
			runtime_reachable: false,
		}),
	);
	assert.equal(result.state, "warn");
	assert.equal(result.reason, "degraded_evidence");
});

test("healthy HTTP with failed Cloudflare telemetry is degraded instead of red", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "ok",
			tunnel_status: "down",
			tunnel_name: "service-tunnel",
		}),
	);
	assert.equal(result.state, "warn");
	assert.equal(result.reason, "degraded_evidence");
});

test("Cloudflare failure is authoritative when HTTP is not independently healthy", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, state: "unknown", tunnel_status: "failed" }),
	);
	assert.equal(result.state, "fail");
	assert.equal(result.reason, "cloudflare_failure");
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
	assert.equal(result.reason, "degraded_evidence");
});

test("multiple healthy proofs reconcile to ok", () => {
	const result = reconcileHomelabHealth(
		entry({
			direct_state: "ok",
			runtime_state: "RUNNING",
			tunnel_status: "healthy",
		}),
	);
	assert.equal(result.state, "ok");
	assert.equal(result.reason, "healthy_evidence");
	assert.ok(result.evidence.length >= 3);
});

test("insufficient evidence preserves unknown", () => {
	const result = reconcileHomelabHealth(
		entry({ http_status: 0, reachable: false, state: "unknown" }),
	);
	assert.equal(result.state, "unknown");
	assert.equal(result.reason, "insufficient_evidence");
});
