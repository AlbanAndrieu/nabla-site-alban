import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHomelabHealthSnapshot } from "../lib/homelabHealth";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const STALE_PUBLIC = {
	id: "vaultwarden",
	name: "Vaultwarden",
	url: "https://vaultwarden.albandrieu.com/",
	reachable: null,
	http_status: 0,
	state: "warn",
	probe_source: "memory",
	probe_observed_at: "2026-09-10T20:00:00Z",
	probe_age_seconds: 180.5,
	probe_stale: true,
	probe_stale_after_seconds: 120,
	probe_interval_seconds: 60,
	next_probe_in_seconds: 0,
	probe_refresh_error: "service probe fan-out budget exceeded",
	last_known_state: "ok",
	last_known_reachable: true,
	last_known_http_status: 200,
	warning:
		"⚠️ Last probe evidence is stale; current service reachability is not confirmed.",
};

const STALE_INTERNAL = {
	id: "vaultwarden",
	name: "Vaultwarden",
	host: "172.17.0.24",
	port: 3012,
	reachable: null,
	state: "warn",
	probe_source: "memory",
	probe_observed_at: "2026-09-10T20:00:00Z",
	probe_age_seconds: 180.5,
	probe_stale: true,
	probe_stale_after_seconds: 120,
	probe_interval_seconds: 60,
	next_probe_in_seconds: 0,
	last_known_state: "ok",
	last_known_reachable: true,
};

test("stale FastAPI rolling evidence keeps null current reachability and last-known evidence", () => {
	const snapshot = parseHomelabHealthSnapshot({
		schema_version: 3,
		checked_at: "2026-09-10T20:03:00Z",
		services: [STALE_PUBLIC],
		internal_probes_enabled: true,
		internal_services: [STALE_INTERNAL],
		probe_summary: {
			public: {
				scope: "public",
				enabled: true,
				eligible: 22,
				sampled: 12,
				scheduled: 12,
				completed: 11,
				timed_out: 1,
				states: { ok: 10, warn: 1, fail: 0 },
				evidence: {
					known: 21,
					fresh: 11,
					cached: 10,
					coverage_percent: 95.5,
					evidence_ttl_seconds: 300,
					evidence_max_retention_seconds: 3600,
				},
			},
			internal: {
				scope: "internal",
				enabled: true,
				eligible: 40,
				sampled: 12,
				scheduled: 12,
				completed: 12,
				timed_out: 0,
				states: { ok: 12, warn: 0, fail: 0 },
				evidence: {
					known: 32,
					fresh: 12,
					cached: 20,
					coverage_percent: 80,
					evidence_ttl_seconds: 300,
					evidence_max_retention_seconds: 3600,
				},
			},
		},
	});

	assert.ok(snapshot);
	assert.equal(snapshot.services.length, 1);
	assert.equal(snapshot.services[0].reachable, null);
	assert.equal(snapshot.services[0].probe_source, "memory");
	assert.equal(snapshot.services[0].probe_stale, true);
	assert.equal(snapshot.services[0].last_known_state, "ok");
	assert.equal(snapshot.services[0].last_known_reachable, true);
	assert.equal(
		snapshot.services[0].probe_refresh_error,
		"service probe fan-out budget exceeded",
	);
	assert.equal(snapshot.internal_services?.length, 1);
	assert.equal(snapshot.internal_services?.[0].reachable, null);
	assert.equal(snapshot.internal_services?.[0].last_known_state, "ok");
	assert.equal(
		snapshot.probe_summary?.public?.evidence?.evidence_max_retention_seconds,
		3600,
	);
});

test("non-rolling null reachability is still rejected defensively", () => {
	const snapshot = parseHomelabHealthSnapshot({
		schema_version: 3,
		checked_at: "2026-09-10T20:03:00Z",
		services: [
			{
				...STALE_PUBLIC,
				id: "malformed",
				probe_source: undefined,
				probe_stale: false,
			},
		],
	});
	assert.ok(snapshot);
	assert.deepEqual(snapshot.services, []);
});

test("service cards expose FastAPI rolling provenance, cadence and retained state", async () => {
	const evidence = await source(
		"app/components/homelab/ServiceProbeEvidence.tsx",
	);
	const reasons = await source(
		"app/components/homelab/ServiceHealthReasons.tsx",
	);

	assert.match(reasons, /ServiceProbeEvidence/);
	assert.match(evidence, /data-probe-evidence/);
	assert.match(evidence, /data-probe-source/);
	assert.match(evidence, /probe_age_seconds/);
	assert.match(evidence, /probe_stale_after_seconds/);
	assert.match(evidence, /probe_interval_seconds/);
	assert.match(evidence, /next_probe_in_seconds/);
	assert.match(evidence, /probe_refresh_error/);
	assert.match(evidence, /last_known_state/);
	assert.match(evidence, /last_known_reachable/);
});

test("observation UI separates rolling evidence coverage from healthy coverage", async () => {
	const coverage = await source(
		"app/components/homelab/HomelabObservationCoverage.tsx",
	);

	assert.match(coverage, /healthyRollingEvidence/);
	assert.match(coverage, /data-public-probe-healthy-coverage/);
	assert.match(coverage, /data-internal-probe-healthy-coverage/);
	assert.match(coverage, /evidence_max_retention_seconds/);
	assert.match(coverage, /probe_source === "origin"/);
	assert.match(coverage, /probe_source === "memory"/);
	assert.match(coverage, /probe_stale !== true/);
});
