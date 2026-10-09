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

test("deadline-only public probe is not misrepresented as confirmed origin downtime", () => {
	const reasons = homelabHealthReasons(
		entry({
			state: "warn",
			direct_state: "fail",
			direct_probe_source: "deadline",
			probe_stale: true,
			direct_probe_refresh_error: "probe budget exceeded",
		}),
	);
	assert.equal(
		reasons.some((reason) => reason.kind === "public_endpoint_down"),
		false,
	);
});

test("a failed fresh origin probe remains a genuine public failure", () => {
	const reasons = homelabHealthReasons(
		entry({
			direct_state: "fail",
			direct_probe_source: "origin",
			http_status: 503,
		}),
	);
	assert.equal(
		reasons.some((reason) => reason.kind === "public_endpoint_down"),
		true,
	);
});

for (const [label, evidence] of [
	["deadline", { direct_probe_source: "deadline" }],
	["refresh error", { direct_probe_refresh_error: "probe failed" }],
	["stale probe", { probe_stale: true }],
	["stale observation", { observation_stale: true }],
	["timeout", { timed_out: true }],
] as const) {
	test(`public endpoint does not report confirmed downtime with ${label}`, () => {
		const reasons = homelabHealthReasons(
			entry({ direct_state: "fail", ...evidence }),
		);
		assert.equal(
			reasons.some((reason) => reason.kind === "public_endpoint_down"),
			false,
		);
	});
}

for (const [label, evidence] of [
	["deadline", { internal_probe_source: "deadline" }],
	["refresh error", { internal_probe_refresh_error: "probe failed" }],
	["stale probe", { probe_stale: true }],
	["stale observation", { observation_stale: true }],
	["timeout", { timed_out: true }],
] as const) {
	test(`internal endpoint does not report confirmed downtime with ${label}`, () => {
		const reasons = homelabHealthReasons(
			entry({ internal_state: "fail", ...evidence }),
		);
		assert.equal(
			reasons.some((reason) => reason.kind === "internal_endpoint_down"),
			false,
		);
	});
}

test("a fresh failed internal probe remains a confirmed internal failure", () => {
	const reasons = homelabHealthReasons(
		entry({ internal_state: "fail", internal_probe_source: "origin" }),
	);
	assert.equal(
		reasons.some((reason) => reason.kind === "internal_endpoint_down"),
		true,
	);
});

test("inconclusive public and internal probes share one explicit explanation", () => {
	const reasons = homelabHealthReasons(
		entry({
			direct_state: "fail",
			direct_probe_source: "deadline",
			internal_state: "fail",
			internal_probe_refresh_error: "unavailable",
		}),
	);
	assert.deepEqual(reasons, [{ kind: "probe_unconfirmed" }]);
});

test("a fresh HTTP failure remains explicit without an inconclusive-probe reason", () => {
	const reasons = homelabHealthReasons(
		entry({ direct_state: "fail", direct_probe_source: "origin", http_status: 503 }),
	);
	assert.equal(reasons.some((reason) => reason.kind === "public_endpoint_down"), true);
	assert.equal(reasons.some((reason) => reason.kind === "probe_unconfirmed"), false);
});
