import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	type HomelabHealthEntry,
	parseHomelabHealthSnapshot,
} from "../lib/homelabHealth";
import { homelabHealthReasons } from "../lib/homelabHealthPresentation";
import {
	blockedDependencyLabels,
	degradedDependencyLabels,
	requiredDependencyRelationHealth,
	requiredDependencyTargetState,
	resolveEffectiveServiceState,
	unconfirmedDependencyLabels,
} from "../lib/homelabHealthResolver";

const DEPENDENCY_ENTRY: HomelabHealthEntry = {
	id: "langfuse-web",
	name: "Langfuse web",
	url: "https://langfuse.albandrieu.com/",
	reachable: true,
	http_status: 200,
	state: "warn",
	local_state: "ok",
	dependency_state: "fail",
	effective_state: "warn",
	required_dependencies: ["postgresql", "clickhouse", "redis", "minio"],
	blocked_by: ["postgresql"],
	degraded_by: ["redis"],
	unconfirmed_dependencies: ["minio"],
	dependency_evidence: [
		{
			target: "postgresql",
			target_name: "PostgreSQL",
			relation_type: "dependsOn",
			target_state: "fail",
			evidence: ["compose:langfuse"],
		},
		{
			target: "clickhouse",
			target_name: "ClickHouse",
			relation_type: "dependsOn",
			target_state: "ok",
			evidence: ["compose:langfuse"],
		},
		{
			target: "redis",
			target_name: "Redis",
			relation_type: "cache",
			target_state: "warn",
			evidence: ["compose:langfuse"],
		},
		{
			target: "minio",
			target_name: "MinIO",
			relation_type: "storesIn",
			target_state: "unknown",
			evidence: ["topology:declared"],
		},
	],
};

test("schema v5 parser preserves dependency-aware health evidence", () => {
	const snapshot = parseHomelabHealthSnapshot({
		schema_version: 5,
		checked_at: "2026-08-28T00:00:00Z",
		services: [DEPENDENCY_ENTRY],
	});

	assert.ok(snapshot);
	assert.equal(snapshot.schema_version, 5);
	assert.deepEqual(snapshot.services[0].blocked_by, ["postgresql"]);
	assert.deepEqual(snapshot.services[0].degraded_by, ["redis"]);
	assert.deepEqual(snapshot.services[0].unconfirmed_dependencies, ["minio"]);
	assert.equal(snapshot.services[0].local_state, "ok");
	assert.equal(snapshot.services[0].effective_state, "warn");
});

test("dependency-aware parser remains fail-soft per malformed service row", () => {
	const snapshot = parseHomelabHealthSnapshot({
		schema_version: 5,
		checked_at: "2026-08-28T00:00:00Z",
		services: [
			DEPENDENCY_ENTRY,
			{
				...DEPENDENCY_ENTRY,
				id: "bad",
				degraded_by: [42],
			},
		],
	});

	assert.ok(snapshot);
	assert.deepEqual(
		snapshot.services.map((entry) => entry.id),
		["langfuse-web"],
	);
});

test("shared resolver separates local and effective dependency health", () => {
	const resolved = resolveEffectiveServiceState(DEPENDENCY_ENTRY);

	assert.equal(resolved.localState, "ok");
	assert.equal(resolved.dependencyState, "fail");
	assert.equal(resolved.effectiveState, "warn");
	assert.deepEqual(resolved.requiredDependencies, [
		"postgresql",
		"clickhouse",
		"redis",
		"minio",
	]);
	assert.deepEqual(resolved.blockedBy, ["postgresql"]);
	assert.deepEqual(resolved.degradedBy, ["redis"]);
	assert.deepEqual(resolved.unconfirmedDependencies, ["minio"]);
});

test("dependency labels and relation state preserve FastAPI semantics", () => {
	assert.deepEqual(blockedDependencyLabels(DEPENDENCY_ENTRY), ["PostgreSQL"]);
	assert.deepEqual(degradedDependencyLabels(DEPENDENCY_ENTRY), ["Redis"]);
	assert.deepEqual(unconfirmedDependencyLabels(DEPENDENCY_ENTRY), ["MinIO"]);
	assert.equal(
		requiredDependencyRelationHealth(
			DEPENDENCY_ENTRY,
			"postgresql",
			"dependsOn",
		),
		"blocked",
	);
	assert.equal(
		requiredDependencyRelationHealth(
			DEPENDENCY_ENTRY,
			"clickhouse",
			"dependsOn",
		),
		"healthy",
	);
	assert.equal(
		requiredDependencyRelationHealth(DEPENDENCY_ENTRY, "redis", "cache"),
		"degraded",
	);
	assert.equal(
		requiredDependencyRelationHealth(DEPENDENCY_ENTRY, "minio", "storesIn"),
		"unconfirmed",
	);
	assert.equal(
		requiredDependencyRelationHealth(DEPENDENCY_ENTRY, "missing", "dependsOn"),
		"unconfirmed",
	);
});

test("Vaultwarden runtime inventory drift is degraded when fresh origin evidence proves it is up", () => {
	const vaultwarden: HomelabHealthEntry = {
		id: "vaultwarden",
		name: "Vaultwarden",
		url: "https://vaultwarden.albandrieu.com/",
		reachable: false,
		http_status: 503,
		state: "fail",
		local_state: "fail",
		effective_state: "fail",
		direct_state: "fail",
		internal_state: "ok",
		runtime_reachable: true,
		runtime_missing: true,
		runtime_stale: false,
		observation_stale: false,
	};

	const resolved = resolveEffectiveServiceState(vaultwarden);
	assert.equal(resolved.localState, "fail");
	assert.equal(resolved.effectiveState, "warn");
	assert.deepEqual(homelabHealthReasons(vaultwarden), [
		{ kind: "runtime_inventory_mismatch" },
		{ kind: "public_endpoint_down", detail: "HTTP 503" },
	]);
});

test("runtime missing remains failed without fresh positive origin proof", () => {
	const missing: HomelabHealthEntry = {
		id: "missing-runtime",
		name: "Missing runtime",
		url: "https://missing.example.com/",
		reachable: false,
		http_status: 0,
		state: "fail",
		effective_state: "fail",
		direct_state: "fail",
		internal_state: "fail",
		runtime_reachable: true,
		runtime_missing: true,
		observation_stale: false,
	};

	assert.equal(resolveEffectiveServiceState(missing).effectiveState, "fail");
});

test("stale origin evidence cannot override runtime missing failure", () => {
	const stale: HomelabHealthEntry = {
		id: "stale-runtime",
		name: "Stale runtime",
		url: "https://stale.example.com/",
		reachable: true,
		http_status: 200,
		state: "fail",
		effective_state: "fail",
		direct_state: "ok",
		internal_state: "ok",
		runtime_reachable: true,
		runtime_missing: true,
		observation_stale: true,
	};

	assert.equal(resolveEffectiveServiceState(stale).effectiveState, "fail");
});

test("schema v6 parser preserves runtime_missing evidence used by UI reconciliation", () => {
	const snapshot = parseHomelabHealthSnapshot({
		schema_version: 6,
		checked_at: "2026-09-09T15:00:00Z",
		services: [
			{
				id: "vaultwarden",
				name: "Vaultwarden",
				url: "https://vaultwarden.albandrieu.com/",
				reachable: false,
				http_status: 503,
				state: "fail",
				direct_state: "fail",
				internal_state: "ok",
				runtime_reachable: true,
				runtime_missing: true,
				observation_stale: false,
			},
		],
	});

	assert.ok(snapshot);
	assert.equal(snapshot.services[0].runtime_missing, true);
	assert.equal(
		resolveEffectiveServiceState(snapshot.services[0]).effectiveState,
		"warn",
	);
});

test("shared resolver remains compatible with legacy state-only rows", () => {
	const legacy: HomelabHealthEntry = {
		name: "Legacy",
		url: "https://legacy.albandrieu.com/",
		reachable: true,
		http_status: 200,
		state: "ok",
	};

	assert.deepEqual(resolveEffectiveServiceState(legacy), {
		localState: "ok",
		dependencyState: null,
		effectiveState: "ok",
		requiredDependencies: [],
		blockedBy: [],
		degradedBy: [],
		unconfirmedDependencies: [],
		dependencyEvidence: [],
	});
});

test("blocker labels and required-edge evidence use the declared dependency", () => {
	assert.deepEqual(blockedDependencyLabels(DEPENDENCY_ENTRY), ["PostgreSQL"]);
	assert.equal(
		requiredDependencyTargetState(DEPENDENCY_ENTRY, "postgresql", "dependsOn"),
		"fail",
	);
	assert.equal(
		requiredDependencyTargetState(DEPENDENCY_ENTRY, "postgresql", "storesIn"),
		null,
	);
});

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS public line cannot inherit dependency degradation", async () => {
	const grid = await source("app/components/homelab/HomelabServiceGrid.tsx");

	assert.match(grid, /state: publicHealth\.state/);
	assert.match(grid, /local_state: publicHealth\.state/);
	assert.match(grid, /dependency_state: null/);
	assert.match(grid, /effective_state: publicHealth\.state/);
	assert.match(grid, /blocked_by: \[\]/);
	assert.match(grid, /dependency_evidence: \[\]/);
});

test("service grid shows effective dependency degradation without replacing runtime status", async () => {
	const grid = await source("app/components/homelab/HomelabServiceGrid.tsx");

	assert.match(grid, /resolveEffectiveServiceState\(initialHealth\)/);
	assert.match(grid, /blockedDependencyLabels\(initialHealth\)/);
	assert.match(grid, /data-dependency-health/);
	assert.match(grid, /data-truenas-runtime-state=\{runtimeState\}/);
	assert.match(grid, /data-runtime-inventory-conflict/);
	assert.match(grid, /data-dependency-health-legend/);
});

test("architecture graph uses explicit consumer-side dependency evidence on required edges", async () => {
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);

	assert.match(explorer, /blockedDependencyLabels\(health\)/);
	assert.match(explorer, /degradedDependencyLabels\(health\)/);
	assert.match(explorer, /unconfirmedDependencyLabels\(health\)/);
	assert.match(explorer, /requiredDependencyRelationHealth/);
	assert.match(explorer, /requiredEdgeDependencyState/);
	assert.match(explorer, /dependencyState === "blocked"/);
	assert.match(explorer, /dependencyState === "degraded"/);
	assert.match(explorer, /dependencyState === "unconfirmed"/);
	assert.match(explorer, /data-dependency-evidence-legend/);
});
