import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// The explorer is split into cohesive sibling modules; source contracts apply
// to the whole explorer implementation.
const EXPLORER_SOURCE_FILES = [
	"HierarchicalArchitectureExplorer.tsx",
	"HierarchicalArchitectureToolbar.tsx",
	"HierarchicalArchitectureLegends.tsx",
	"HierarchicalArchitectureNodes.tsx",
	"hierarchicalArchitectureModel.ts",
	"hierarchicalArchitectureGroups.ts",
	"hierarchicalArchitectureFlow.ts",
	"useHierarchicalArchitectureGraph.ts",
];

async function explorerSource() {
	const parts = await Promise.all(
		EXPLORER_SOURCE_FILES.map((file) =>
			readFile(
				new URL(`../app/[locale]/architecture/${file}`, import.meta.url),
				"utf8",
			),
		),
	);
	return parts.join("\n");
}

// The topology view is split into cohesive sibling modules; source contracts
// apply to the whole view implementation (original file first).
const TOPOLOGY_VIEW_SOURCE_FILES = [
	"ArchitectureTopologyView.tsx",
	"ArchitectureHealthDashboard.tsx",
	"architectureTopologyFilters.ts",
	"useArchitectureLiveData.ts",
];

async function topologyViewSource() {
	const parts = await Promise.all(
		TOPOLOGY_VIEW_SOURCE_FILES.map((file) =>
			readFile(
				new URL(`../app/[locale]/architecture/${file}`, import.meta.url),
				"utf8",
			),
		),
	);
	return parts.join("\n");
}

test("architecture health polling has a single owner and adaptive schedule", async () => {
	const [view, explorer, healthPolling, runtimePolling] = await Promise.all([
		topologyViewSource(),
		explorerSource(),
		readFile(
			"app/[locale]/architecture/useArchitectureHealthPolling.ts",
			"utf8",
		),
		readFile(
			"app/[locale]/architecture/useArchitectureRuntimeStatus.ts",
			"utf8",
		),
	]);

	assert.match(view, /useArchitectureHealthPolling/);
	assert.match(view, /healthStatus=\{health\}/);
	assert.match(view, /healthSource=\{healthSource\}/);
	assert.doesNotMatch(view, /fetch\("\/api\/homelab-health"/);

	assert.match(explorer, /healthStatus: HomelabHealthSnapshot \| null/);
	assert.match(explorer, /healthSource: ArchitectureHealthSource/);
	assert.match(explorer, /useArchitectureRuntimeStatus/);
	assert.doesNotMatch(explorer, /\/api\/homelab-health/);
	assert.doesNotMatch(explorer, /parseHomelabHealthSnapshot/);
	assert.doesNotMatch(explorer, /parseHomelabStatusSnapshot/);

	assert.match(
		healthPolling,
		/readOnly \? "\/api\/homelab-health-v2" : "\/api\/homelab-health"/,
	);
	assert.match(healthPolling, /HEALTH_POLL_REFRESHING_MS = 2_000/);
	assert.match(healthPolling, /HEALTH_POLL_FRESH_MS = 5_000/);
	assert.match(healthPolling, /HEALTH_POLL_FALLBACK_MS = 30_000/);
	assert.match(healthPolling, /health_board\?\.refreshing/);
	assert.match(healthPolling, /health_board\?\.state === "fresh"/);
	assert.match(healthPolling, /window\.setTimeout/);

	assert.match(runtimePolling, /fetch\("\/api\/homelab-status"/);
	assert.match(runtimePolling, /RUNTIME_POLL_MS = 30_000/);
	assert.match(runtimePolling, /window\.setInterval/);
	assert.doesNotMatch(runtimePolling, /\/api\/homelab-health/);
});
