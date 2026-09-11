import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("architecture health polling has a single owner and adaptive schedule", async () => {
	const [view, explorer, healthPolling, runtimePolling] = await Promise.all([
		readFile("app/[locale]/architecture/ArchitectureTopologyView.tsx", "utf8"),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
			"utf8",
		),
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

	assert.match(healthPolling, /fetch\("\/api\/homelab-health"/);
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
