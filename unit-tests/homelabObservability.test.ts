import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseFastApiHealthBoard } from "../lib/fastApiHealthBoard";
import {
	parseHomelabObservability,
	withObservabilityFallbacks,
} from "../lib/homelabObservability";
import { parseRuntimeTopology } from "../lib/runtimeTopology";

test("health board preserves runtime and unified observability consumes all aggregate sections", () => {
	const board = parseFastApiHealthBoard({
		schema_version: 1,
		state: "fresh",
		refreshing: false,
		generated_at: "2026-09-03T00:30:00Z",
		runtime: {
			provider: "FastAPI Cloud",
			runtime_mode: "fastapi_cloud",
			observed_at: "2026-09-03T00:29:59Z",
			platform_replica_count: null,
			platform_replica_count_available: false,
			count_semantics: "Observed heartbeat count only",
			heartbeat_interval_seconds: 30,
			active_window_seconds: 120,
			recent_egress_window_seconds: 86400,
			observed_instance_count: 1,
			instances: [{ id: "runtime-a", last_seen_at: "2026-09-03T00:29:50Z", egress_ip: "203.0.113.4", egress_observed: true, egress_cached: false }],
			active_egress_ips: ["203.0.113.4"],
			recent_egress_ips: ["203.0.113.4"],
			aggregation: "redis_heartbeat",
			degraded: false,
			redis: {
				backend: "application_redis",
				provider_attribution: "unavailable",
				telemetry_scope: "redis_server_and_selected_database",
				key_count_scope: "selected_database_total",
				configured: true,
				available: true,
				telemetry_available: true,
				used_memory_bytes: 1048576,
				used_memory_human: "1M",
				maxmemory_bytes: 8388608,
				maxmemory_human: "8M",
				memory_utilization_percent: 12.5,
				connected_clients: 4,
				blocked_clients: 0,
				keys: 42,
				instantaneous_ops_per_sec: 7,
				keyspace_hits: 90,
				keyspace_misses: 10,
				keyspace_hit_rate_percent: 90,
				evicted_keys: 0,
				expired_keys: 5,
			},
		},
		healthz: {
			contract: "deep_diagnostic",
			status: "degraded",
			version: "1.7.0",
			checks: {
				postgres: { reachable: true },
				redis: { reachable: true },
				supabase: { reachable: true, http_status: 200, probe: "data_api", authentication: "publishable_key", resource: "note", path: "/rest/v1/note" },
				pfsense: {
					reachable: false,
					stale: true,
					refresh_error: "connect timeout",
					error_kind: "connect_timeout",
					failure_stage: "connect",
					exception_type: "ConnectTimeout",
					cache_layer: "redis",
					cached: true,
					cache_age_seconds: 12,
					redis_available: true,
					ingress_policy: {
						state: "possible_ingress_policy_block",
						access_policy: "trusted_sources_only",
						active_egress_ips: ["203.0.113.4"],
						possible_causes: ["trusted_source_policy_drift", "pf_or_snort_filter"],
						attribution_available: false,
						detail: "Pre-HTTP ingress evidence",
						recommended_control_path: "out_of_band",
					},
				},
				tavily: { reachable: null, skipped: true, reason: "TAVILY_API_KEY not configured" },
				garage: { reachable: true, http_status: 200, tls_trusted: true, display_label: "Garage", elapsed_ms: 44 },
			},
		},
		homelab: {
			schema_version: 5,
			checked_at: "2026-09-03T00:29:58Z",
			components_status: "degraded",
			components: {
				truenas: { reachable: true, state: "ok" },
				pfsense: { reachable: false, stale: true, refresh_error: "read timeout", error_kind: "read_timeout", failure_stage: "response", exception_type: "ReadTimeout", cache_layer: "redis", cached: true, cache_age_seconds: 12, redis_available: true },
				cloudflare: { reachable: true, state: "ok" },
			},
			pfsense: {
				dns: {
					configured: true,
					reachable: true,
					policy_state: "ok",
					reason: "pfSense / Unbound keeps a resolution path independent from TrueNAS",
					resolver: { enabled: true, running: true, forwarding: false, forward_tls_upstream: false, port: 53 },
					upstream: { count: 2, independent_from_truenas: true, truenas_only: false },
				},
			},
			cloudflare: {
				configured: true,
				tunnels_observed: 2,
				access_applications_observed: 3,
				tunnel_observer_state: "ok",
				access_observer_state: "ok",
				stale: true,
				refresh_error: "Cloudflare refresh in progress",
				cache: { cache_layer: "redis", cached: true, stale: true, refresh_in_progress: true, redis_available: true, cache_age_seconds: 18 },
			},
			services: [{
				id: "openwebui",
				name: "Open WebUI",
				exposure: {
					state: "mismatch",
					reasons: ["Cloudflare Access is required but no matching application was observed"],
					declared: { external: true, endpoint_enabled: true, edge_mode: "cloudflare", cloudflare_access_required: true, security_exception_declared: false },
					observed: { public_https_reachable: true, cloudflare_tunnel_observed: true, cloudflare_tunnel_name: "homelab", cloudflare_tunnel_status: "healthy", cloudflare_access_observed: false, cloudflare_access_application_count: 0, cloudflare_access_policy_count: 0, cloudflare_access_policy_decisions: [], cloudflare_access_public: null, cloudflare_access_public_scope: null, cloudflare_access_public_policy_count: 0 },
				},
			}],
		},
		platform_metrics: {
			schema_version: 1,
			generated_at: "2026-09-03T00:29:57Z",
			state: "degraded",
			configured: true,
			source: "prometheus",
			metrics: {
				truenas_memory_available_ratio: {
					metric: "nabla:core:truenas_memory_available_ratio",
					value: 0.42,
				},
				truenas_cpu_busy_ratio: {
					metric: "nabla:core:truenas_cpu_busy_ratio",
					value: 0.31,
				},
				truenas_node_up: {
					metric: "nabla:telemetry:truenas_node_up",
					value: 1,
				},
				truenas_cadvisor_up: {
					metric: "nabla:telemetry:truenas_cadvisor_up",
					value: 1,
				},
				pfsense_metrics_up: {
					metric: "nabla:telemetry:pfsense_metrics_up",
					value: 0,
				},
				prometheus_up: {
					metric: "nabla:observability:prometheus_up",
					value: 1,
				},
				unexpected_raw_series: {
					metric: "unsafe:unbounded:metric",
					value: 999,
				},
			},
			summary: {
				signals_available: 6,
				signals_total: 6,
				telemetry_up: 3,
				telemetry_total: 4,
				truenas_memory_available_ratio: 0.42,
				truenas_cpu_busy_ratio: 0.31,
				pfsense_metrics_up: 0,
			},
		},
		sickz: {
			checks: {
				pfsense_admin: {
					http_evidence_skipped: true,
					http_evidence_skip_reason:
						"pfSense admin endpoint is not a Cloudflare edge target",
				},
			},
		},
	});
	assert.ok(board);
	assert.ok(board.runtime);
	assert.ok(board.platform_metrics);

	const evidence = parseHomelabObservability(board);
	assert.equal(evidence.runtimeTopology?.observed_instance_count, 1);
	assert.equal(evidence.runtimeTopology?.runtime_mode, "fastapi_cloud");
	assert.equal(evidence.runtimeTopology?.redis?.telemetry_available, true);
	assert.equal(evidence.runtimeTopology?.redis?.keyspace_hit_rate_percent, 90);
	assert.equal(evidence.runtimeTopology?.redis?.keys, 42);
	assert.equal(evidence.sources.runtime, "health-board");
	assert.equal(evidence.healthSnapshot?.pfsense?.dns?.resolver?.running, true);
	assert.equal(evidence.healthSnapshot?.pfsense?.dns?.resolver?.forwarding, false);
	assert.equal(evidence.healthSnapshot?.pfsense?.dns?.upstream?.count, 2);
	assert.equal(evidence.deepDiagnostics.status, "degraded");
	assert.equal(evidence.deepDiagnostics.checks.find((check) => check.id === "postgres")?.category, "required");
	assert.equal(evidence.deepDiagnostics.checks.find((check) => check.id === "tavily")?.category, "integration");
	assert.equal(evidence.deepDiagnostics.checks.find((check) => check.id === "garage")?.category, "homelab");
	assert.equal(evidence.deepDiagnostics.checks.find((check) => check.id === "pfsense")?.cache?.layer, "redis");
	assert.equal(evidence.pfsenseIngressPolicy?.state, "possible_ingress_policy_block");
	assert.deepEqual(evidence.pfsenseIngressPolicy?.activeEgressIps, ["203.0.113.4"]);
	assert.deepEqual(evidence.pfsenseIngressPolicy?.possibleCauses, [
		"trusted_source_policy_drift",
		"pf_or_snort_filter",
	]);
	assert.equal(evidence.pfsenseIngressPolicy?.recommendedControlPath, "out_of_band");
	assert.equal(evidence.controlPlaneDiagnostics.pfsense?.exceptionType, "ReadTimeout");
	assert.equal(evidence.controlPlaneDiagnostics.pfsense?.cache?.ageSeconds, 12);
	assert.equal(evidence.cloudflareCache?.stale, true);
	assert.equal(evidence.cloudflareCache?.cache?.refreshInProgress, true);
	assert.equal(evidence.platformMetrics?.state, "degraded");
	assert.equal(evidence.platformMetrics?.source, "prometheus");
	assert.equal(evidence.platformMetrics?.summary.signalsAvailable, 6);
	assert.equal(evidence.platformMetrics?.summary.telemetryUp, 3);
	assert.equal(
		evidence.platformMetrics?.metrics.truenas_memory_available_ratio?.value,
		0.42,
	);
	assert.equal(evidence.platformMetrics?.metrics.pfsense_metrics_up?.value, 0);
	assert.equal(
		Object.prototype.hasOwnProperty.call(
			evidence.platformMetrics?.metrics ?? {},
			"unexpected_raw_series",
		),
		false,
	);
	assert.equal(evidence.diagnostics?.exposure_by_service.openwebui?.state, "mismatch");
	assert.deepEqual(evidence.edgeEvidenceSkips, [
		{
			id: "pfsense_admin",
			reason: "pfSense admin endpoint is not a Cloudflare edge target",
		},
	]);
});

test("runtime endpoint remains a compatibility fallback only when aggregate runtime is absent", () => {
	const board = parseFastApiHealthBoard({ schema_version: 1, state: "fresh", refreshing: false, generated_at: null, runtime: null, healthz: {}, homelab: {}, platform_metrics: null, sickz: {} });
	assert.ok(board);
	const parsed = parseHomelabObservability(board);
	const fallback = parseRuntimeTopology({
		provider: "fastapi-cloud",
		observed_at: "2026-09-03T00:29:59Z",
		platform_replica_count: null,
		platform_replica_count_available: false,
		count_semantics: "fallback",
		heartbeat_interval_seconds: 30,
		active_window_seconds: 120,
		recent_egress_window_seconds: 86400,
		observed_instance_count: 0,
		instances: [],
		active_egress_ips: [],
		recent_egress_ips: [],
	});
	assert.ok(fallback);
	const enriched = withObservabilityFallbacks(parsed, { runtimeTopology: fallback });
	assert.equal(enriched.sources.runtime, "fallback");
});

test("same-origin observability route uses aggregate evidence first and conditional fallbacks", async () => {
	const route = await readFile(new URL("../app/api/homelab-observability/route.ts", import.meta.url), "utf8");
	assert.match(route, /parseHomelabObservability/);
	assert.match(route, /parsed\.runtimeTopology \? Promise\.resolve\(null\) : loadRuntimeTopology\(\)/);
	assert.match(route, /parsed\.diagnostics \? Promise\.resolve\(null\) : loadHomelabDiagnostics\(\)/);
	assert.match(route, /X-Homelab-Runtime-Source/);
	assert.match(route, /X-Homelab-Diagnostics-Source/);
});

test("operations UI presents bounded metrics separately from functional health", async () => {
	const component = await readFile(
		new URL("../app/components/homelab/HomelabOperationalEvidence.tsx", import.meta.url),
		"utf8",
	);
	assert.match(component, /data-platform-metrics/);
	assert.match(component, /PLATFORM_METRIC_LABEL_KEY/);
	assert.match(component, /metrics\.healthSeparation/);
	assert.doesNotMatch(component, /data-effective-health=.*platformMetrics/);
});
