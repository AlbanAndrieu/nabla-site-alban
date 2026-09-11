import assert from "node:assert/strict";
import test from "node:test";
import { parseFastApiHealthBoard } from "../lib/fastApiHealthBoard";
import {
	parseHomelabObservability,
	withObservabilityFallbacks,
} from "../lib/homelabObservability";
import { parseRuntimeTopology } from "../lib/runtimeTopology";

test("runtime endpoint remains a compatibility fallback only when aggregate runtime is absent", () => {
	const board = parseFastApiHealthBoard({
		schema_version: 1,
		state: "fresh",
		refreshing: false,
		generated_at: null,
		runtime: null,
		healthz: {},
		homelab: {},
		platform_metrics: null,
		sickz: {},
	});
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
	const enriched = withObservabilityFallbacks(parsed, {
		runtimeTopology: fallback,
	});
	assert.equal(enriched.sources.runtime, "fallback");
});
