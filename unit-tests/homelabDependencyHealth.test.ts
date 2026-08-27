import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	parseHomelabHealthSnapshot,
	type HomelabHealthEntry,
} from "../lib/homelabHealth";
import {
	blockedDependencyLabels,
	requiredDependencyTargetState,
	resolveEffectiveServiceState,
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
	required_dependencies: ["postgresql", "clickhouse"],
	blocked_by: ["postgresql"],
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
				url: "https://invalid host.example/",
			},
		],
	});

	assert.ok(snapshot);
	assert.deepEqual(snapshot.services.map((entry) => entry.id), ["langfuse-web"]);
});

test("shared resolver separates local and effective health", () => {
	const resolved = resolveEffectiveServiceState(DEPENDENCY_ENTRY);

	assert.equal(resolved.localState, "ok");
	assert.equal(resolved.dependencyState, "fail");
	assert.equal(resolved.effectiveState, "warn");
	assert.deepEqual(resolved.requiredDependencies, ["postgresql", "clickhouse"]);
	assert.deepEqual(resolved.blockedBy, ["postgresql"]);
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
		dependencyEvidence: [],
	});
});

test("blocker labels and required-edge evidence use the declared dependency", () => {
	assert.deepEqual(blockedDependencyLabels(DEPENDENCY_ENTRY), ["PostgreSQL"]);
	assert.equal(
		requiredDependencyTargetState(
			DEPENDENCY_ENTRY,
			"postgresql",
			"dependsOn",
		),
		"fail",
	);
	assert.equal(
		requiredDependencyTargetState(
			DEPENDENCY_ENTRY,
			"postgresql",
			"storesIn",
		),
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
	assert.match(grid, /data-dependency-health-legend/);
});

test("architecture graph uses the shared effective resolver and target health on required edges", async () => {
	const explorer = await source(
		"app/[locale]/architecture/ArchitectureExplorer.tsx",
	);

	assert.match(explorer, /resolveEffectiveServiceState\(health\)/);
	assert.match(explorer, /blockedDependencyLabels\(health\)/);
	assert.match(explorer, /requiredDependencyTargetState/);
	assert.match(explorer, /requiredEdgeHealthState/);
	assert.match(explorer, /relation\.optional/);
	assert.match(explorer, /targetState === "fail"/);
	assert.match(explorer, /targetState === "warn" \|\| targetState === "unknown"/);
	assert.match(explorer, /data-dependency-health/);
});
