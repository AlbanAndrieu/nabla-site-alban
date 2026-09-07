import assert from "node:assert/strict";
import test from "node:test";
import type { HomelabHealthEntry } from "../lib/homelabHealth";
import { homelabHealthReasons } from "../lib/homelabHealthPresentation";

function entry(overrides: Partial<HomelabHealthEntry>): HomelabHealthEntry {
	return {
		id: "service",
		name: "Service",
		url: "https://service.albandrieu.com/",
		reachable: false,
		http_status: 0,
		state: "fail",
		...overrides,
	};
}

test("stopped runtime is exposed as the primary failure reason", () => {
	const reasons = homelabHealthReasons(
		entry({
			runtime_state: "STOPPED",
			direct_state: "fail",
			error: "origin unavailable",
		}),
		{ tunnelExpected: true, cloudflareConfigured: true },
	);

	assert.deepEqual(
		reasons.map((reason) => reason.kind),
		["runtime_down", "public_endpoint_down", "tunnel_missing"],
	);
});

test("reachable application error remains an explicit degradation reason", () => {
	const reasons = homelabHealthReasons(
		entry({
			reachable: true,
			http_status: 200,
			state: "warn",
			direct_state: "ok",
			runtime_state: "RUNNING",
			application_error: "backend initialization failed",
		}),
	);

	assert.deepEqual(reasons, [
		{
			kind: "application_error",
			detail: "backend initialization failed",
		},
	]);
});

test("stale runtime is never presented as current runtime health", () => {
	const reasons = homelabHealthReasons(
		entry({
			state: "unknown",
			runtime_state: "RUNNING",
			runtime_stale: true,
			observation_stale: true,
		}),
		{ runtimeStale: true },
	);

	assert.deepEqual(
		reasons.map((reason) => reason.kind),
		["runtime_stale", "stale_evidence"],
	);
});

test("down Cloudflare tunnel is explicit when the service expects a tunnel", () => {
	const reasons = homelabHealthReasons(
		entry({
			state: "warn",
			direct_state: "warn",
			runtime_state: "RUNNING",
			tunnel_status: "down",
		}),
		{ tunnelExpected: true, cloudflareConfigured: true },
	);

	assert.deepEqual(reasons, [{ kind: "tunnel_down", detail: "down" }]);
});


test("deploying runtime is explicitly reported as not ready", () => {
	const reasons = homelabHealthReasons(
		entry({
			state: "fail",
			runtime_state: "DEPLOYING",
			direct_state: "warn",
			http_status: 403,
			reachable: true,
		}),
	);

	assert.deepEqual(reasons, [{ kind: "runtime_down", detail: "DEPLOYING" }]);
});
