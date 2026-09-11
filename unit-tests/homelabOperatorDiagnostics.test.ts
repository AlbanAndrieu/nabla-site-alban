import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { HomelabHealthSnapshot } from "../lib/homelabHealth";
import { parsePfSenseDnsPosture } from "../lib/homelabHealthPfSenseParsing";
import { readHomelabOperatorDiagnostics } from "../lib/homelabOperatorDiagnostics";
import { mergeHomelabProbeDiagnostics } from "../lib/homelabProbeMerge";
import { probeScopeMetricRows } from "../lib/homelabProbeMetrics";

const aggregate = {
	schema_version: 6,
	checked_at: "2026-09-11T10:00:00Z",
	services: [
		{
			id: "garage",
			name: "Garage",
			url: "https://garage.albandrieu.com/",
			reachable: true,
			http_status: 200,
			state: "ok",
			effective_state: "ok",
			runtime_state: "RUNNING",
		},
	],
} as HomelabHealthSnapshot;

test("raw probe diagnostics enrich but never override reconciled service health", () => {
	const probes = {
		...aggregate,
		probe_runtime: {
			state: "ready",
			known_probe_slots: 12,
			eligible_probe_slots: 16,
			coverage_percent: 75,
		},
		services: [
			{
				...aggregate.services[0],
				reachable: false,
				http_status: 403,
				state: "fail",
				anonymous_http_status: 403,
				public_probe_auth_mode: "cloudflare_service_token",
				cloudflare_service_token_access_passed: true,
				cloudflare_service_token_http_status: 200,
				probe_source: "memory",
				probe_interval_seconds: 120,
				last_known_state: "ok",
				last_known_reachable: true,
				last_known_http_status: 200,
				warning: "cached evidence retained after refresh timeout",
				api_key: "must-not-survive",
				raw_config: { secret: true },
			},
		],
	} as unknown as HomelabHealthSnapshot;

	const merged = mergeHomelabProbeDiagnostics(aggregate, probes);
	const service = merged.services[0] as unknown as Record<string, unknown>;
	assert.equal(service.state, "ok");
	assert.equal(service.reachable, true);
	assert.equal(service.http_status, 200);
	assert.equal(service.anonymous_http_status, 403);
	assert.equal(service.cloudflare_service_token_access_passed, true);
	assert.equal(service.cloudflare_service_token_http_status, 200);
	assert.equal(service.public_probe_auth_mode, "cloudflare_service_token");
	assert.equal(service.probe_source, "memory");
	assert.equal(service.probe_interval_seconds, 120);
	assert.equal(service.last_known_state, "ok");
	assert.equal(service.last_known_reachable, true);
	assert.equal(service.last_known_http_status, 200);
	assert.equal(
		service.warning,
		"cached evidence retained after refresh timeout",
	);
	assert.equal("api_key" in service, false);
	assert.equal("raw_config" in service, false);
	assert.equal(
		(merged as unknown as Record<string, unknown>).probe_runtime !== undefined,
		true,
	);
});

test("probe metric rows expose sampling, completion, timeout, cache and budget ratios", () => {
	const rows = probeScopeMetricRows(
		{
			enabled: true,
			eligible: 20,
			sampled: 10,
			scheduled: 10,
			completed: 9,
			timed_out: 1,
			budget_seconds: 4,
			elapsed_ms: 2000,
			per_probe_timeout_seconds: 1,
			max_concurrency: 4,
			states: { ok: 7, warn: 1, fail: 1 },
			evidence: {
				known: 20,
				fresh: 8,
				cached: 12,
				coverage_percent: 100,
				evidence_ttl_seconds: 300,
				evidence_max_retention_seconds: 900,
			},
		},
		false,
	);
	const byLabel = new Map(rows.map((row) => [row.label, row.value]));
	assert.equal(byLabel.get("Sample ratio"), "50.0%");
	assert.equal(byLabel.get("Completion ratio"), "90.0%");
	assert.equal(byLabel.get("Timeout ratio"), "10.0%");
	assert.equal(byLabel.get("Budget utilization"), "50.0%");
	assert.equal(byLabel.get("Fresh ratio"), "40.0%");
	assert.equal(byLabel.get("Cached ratio"), "60.0%");
});

test("operator diagnostics decode FastAPI probe runtime, performance and TrueNAS stages", () => {
	const snapshot = {
		...aggregate,
		probe_runtime: {
			started_at: "2026-09-11T09:00:00Z",
			uptime_seconds: 3600,
			state: "ready",
			eligible_probe_slots: 20,
			known_probe_slots: 18,
			coverage_percent: 90,
			estimated_full_cycle_seconds: 150,
		},
		performance: {
			phases_ms: { declared_catalog: 5, reconciliation: 17, total: 42 },
			fixed_cardinality: true,
			phase_count: 7,
		},
		reconciliation: {
			evidence_priority: ["truenas_runtime", "http_https_tcp", "cloudflare"],
		},
		truenas_runtime_error: "deadline exceeded",
		truenas: {
			state: "warn",
			api: {
				reachable: false,
				phase: "connect",
				stage: "websocket",
				elapsed_ms: 845,
				error: "upgrade failed",
				exception_type: "TimeoutError",
				cache_layer: "redis",
				cache_age_seconds: 11,
				circuit_breaker: {
					provider: "truenas",
					state: "open",
					failures: 3,
					retry_after_seconds: 27,
					origin_suppressed: true,
					redis_shared: true,
				},
				credential_selection: {
					username_variable: "TRUENAS_API_USERNAME",
					api_key_variable: "TRUENAS_API_KEY",
					shadowed_api_key_variables: ["TRUENAS_CSI_API_KEY"],
				},
			},
			diagnostics: {
				target: "home.albandrieu.com:10443",
				path_mode: "haproxy",
				verify_ssl: true,
				stages: [
					{ id: "dns", label: "DNS resolution", state: "ok", elapsed_ms: 2 },
					{
						id: "websocket",
						label: "WebSocket upgrade",
						state: "fail",
						elapsed_ms: 843,
						failure_stage: "upgrade",
					},
				],
			},
		},
	} as unknown as HomelabHealthSnapshot;

	const parsed = readHomelabOperatorDiagnostics(snapshot);
	assert.equal(parsed.probeRuntime?.coveragePercent, 90);
	assert.equal(parsed.performance?.phasesMs.total, 42);
	assert.deepEqual(parsed.evidencePriority, [
		"truenas_runtime",
		"http_https_tcp",
		"cloudflare",
	]);
	assert.equal(parsed.trueNasApi?.stage, "websocket");
	assert.equal(parsed.trueNasApi?.circuitBreaker?.state, "open");
	assert.equal(parsed.trueNasApi?.circuitBreaker?.retryAfterSeconds, 27);
	assert.equal(parsed.trueNasApi?.circuitBreaker?.redisShared, true);
	assert.equal(parsed.trueNasTransport?.stages[1]?.failureStage, "upgrade");
	assert.equal(parsed.trueNasRuntimeError, "deadline exceeded");
});

test("pfSense operator evidence is explicit and strips raw configuration", () => {
	const parsed = parsePfSenseDnsPosture({
		configured: true,
		reachable: true,
		policy_state: "ok",
		reason: "resolver healthy",
		api_evidence_state: "partial",
		successful_endpoint_count: 3,
		endpoint_count: 4,
		endpoint_status: {
			system: { observed: true },
			services: { observed: false, error: "HTTP 503" },
		},
		services_observed: false,
		service_summary: { running: 2, stopped: 1, unknown: 0, total: 3 },
		last_good_available: true,
		cache: { cache_layer: "redis", cached: true, cache_age_seconds: 8 },
		api_key: "must-not-survive",
		raw_config: { secret: true },
	});

	assert.ok(parsed);
	assert.equal(parsed.operator?.api_evidence_state, "partial");
	assert.equal(parsed.operator?.endpoint_status?.services?.observed, false);
	assert.equal(parsed.operator?.service_summary?.stopped, 1);
	assert.equal(parsed.operator?.cache?.cache_layer, "redis");
	assert.equal("api_key" in parsed, false);
	assert.equal("raw_config" in parsed, false);
	assert.equal("api_key" in (parsed.operator ?? {}), false);
});

test("homelab UI keeps reconciled health and exposes progressive operator metrics", async () => {
	const [
		block,
		globalDiagnostics,
		trueNasDiagnostics,
		pfSenseDiagnostics,
		serviceDiagnostics,
		reasons,
	] = await Promise.all([
		readFile("app/components/homelab/HomelabServicesBlock.tsx", "utf8"),
		readFile("app/components/homelab/HomelabProbeDiagnostics.tsx", "utf8"),
		readFile("app/components/homelab/HomelabTrueNasProbeDiagnostics.tsx", "utf8"),
		readFile("app/components/homelab/HomelabPfSenseProbeDiagnostics.tsx", "utf8"),
		readFile("app/components/homelab/ServiceOperatorDiagnostics.tsx", "utf8"),
		readFile("app/components/homelab/ServiceHealthReasons.tsx", "utf8"),
	]);
	assert.match(block, /mergeHomelabProbeDiagnostics/);
	assert.match(block, /<HomelabProbeDiagnostics snapshot=\{state\.snapshot\}/);
	assert.match(globalDiagnostics, /probeScopeMetricRows/);
	assert.match(globalDiagnostics, /HomelabTrueNasProbeDiagnostics/);
	assert.match(globalDiagnostics, /HomelabPfSenseProbeDiagnostics/);
	assert.match(globalDiagnostics, /Evidence priority/);
	assert.match(trueNasDiagnostics, /data-truenas-diagnostic-stages/);
	assert.match(pfSenseDiagnostics, /data-pfsense-endpoint-status/);
	assert.match(serviceDiagnostics, /cloudflare_service_token_access_passed/);
	assert.match(serviceDiagnostics, /\["direct", "internal"\]/);
	assert.match(serviceDiagnostics, /\$\{prefix\}_probe_source/);
	assert.match(serviceDiagnostics, /last_known_http_status/);
	assert.match(reasons, /ServiceOperatorDiagnostics/);
});
