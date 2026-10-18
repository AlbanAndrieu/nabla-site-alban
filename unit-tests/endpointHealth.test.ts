import assert from "node:assert/strict";
import test from "node:test";
import {
	classifyHttpStatus,
	endpointEvidenceItems,
	hasAuthoritativeEvidence,
	snapshotAgeSeconds,
	snapshotHealth,
	tunnelIndicatorState,
} from "../app/components/homelab/endpointHealth";
import type { HomelabHealthEntry } from "../lib/homelabHealth";

function entry(
	overrides: Partial<HomelabHealthEntry> = {},
): HomelabHealthEntry {
	return {
		name: "Service",
		url: "https://service.example.test/",
		reachable: null,
		http_status: 0,
		state: "unknown",
		...overrides,
	} as HomelabHealthEntry;
}

test("HTTP status classification treats auth and rate limits as warnings", () => {
	assert.equal(classifyHttpStatus(200), "ok");
	assert.equal(classifyHttpStatus(302), "ok");
	assert.equal(classifyHttpStatus(399), "ok");
	for (const status of [401, 403, 407, 429]) {
		assert.equal(classifyHttpStatus(status), "warn");
	}
	assert.equal(classifyHttpStatus(404), "fail");
	assert.equal(classifyHttpStatus(500), "fail");
	assert.equal(classifyHttpStatus(0), "fail");
});

test("an application error overrides the snapshot state", () => {
	assert.equal(snapshotHealth(entry({ state: "ok" })), "ok");
	assert.equal(
		snapshotHealth(entry({ state: "ok", application_error: "boom" })),
		"fail",
	);
});

test("authoritative evidence requires an observed FastAPI signal", () => {
	assert.equal(hasAuthoritativeEvidence(undefined), false);
	assert.equal(hasAuthoritativeEvidence(entry()), false);
	assert.equal(hasAuthoritativeEvidence(entry({ tunnel_status: "  " })), false);
	assert.equal(hasAuthoritativeEvidence(entry({ http_status: 200 })), true);
	assert.equal(hasAuthoritativeEvidence(entry({ state: "warn" })), true);
	assert.equal(hasAuthoritativeEvidence(entry({ direct_state: "fail" })), true);
	assert.equal(hasAuthoritativeEvidence(entry({ internal_state: "ok" })), true);
	assert.equal(
		hasAuthoritativeEvidence(entry({ runtime_state: "RUNNING" })),
		true,
	);
	assert.equal(
		hasAuthoritativeEvidence(entry({ tunnel_status: "healthy" })),
		true,
	);
	assert.equal(
		hasAuthoritativeEvidence(entry({ application_error: "boom" })),
		true,
	);
});

test("tunnel indicator distinguishes healthy, missing and degraded tunnels", () => {
	assert.equal(tunnelIndicatorState(false, entry()), "unknown");
	assert.equal(tunnelIndicatorState(true, undefined), "unknown");
	assert.equal(tunnelIndicatorState(true, entry()), "missing");
	assert.equal(
		tunnelIndicatorState(true, entry({ tunnel_status: " Healthy " })),
		"healthy",
	);
	assert.equal(
		tunnelIndicatorState(true, entry({ tunnel_status: "down" })),
		"degraded",
	);
});

test("snapshot age is rounded, clamped and null for invalid timestamps", () => {
	const now = Date.parse("2026-01-01T00:01:00Z");
	assert.equal(snapshotAgeSeconds(undefined, now), null);
	assert.equal(snapshotAgeSeconds("not-a-date", now), null);
	assert.equal(snapshotAgeSeconds("2026-01-01T00:00:00Z", now), 60);
	assert.equal(snapshotAgeSeconds("2026-01-01T00:02:00Z", now), 0);
});

test("evidence items list observed signals and gate Cloudflare", () => {
	assert.deepEqual(endpointEvidenceItems(undefined, true), []);
	const observed = entry({
		http_status: 200,
		direct_state: "ok",
		runtime_state: "RUNNING",
		internal_state: "ok",
		tunnel_status: "healthy",
	});
	assert.deepEqual(endpointEvidenceItems(observed, true), [
		"HTTP 200",
		"direct ok",
		"TrueNAS RUNNING",
		"internal ok",
		"Cloudflare healthy",
	]);
	assert.deepEqual(endpointEvidenceItems(observed, false), [
		"HTTP 200",
		"direct ok",
		"TrueNAS RUNNING",
		"internal ok",
	]);
});
