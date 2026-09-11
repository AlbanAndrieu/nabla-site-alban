import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("impact inspector has an immediate topology-backed service contract", async () => {
	const inspector = await source(
		"app/[locale]/architecture/ArchitectureImpactInspector.tsx",
	);

	assert.match(inspector, /getStaticServiceTopology\(\)\.topology/);
	assert.match(inspector, /initialTopology = FALLBACK_TOPOLOGY/);
	assert.match(inspector, /topology\.nodes/);
	assert.match(inspector, /nodes\.map\(\(node\) =>/);
	assert.match(inspector, /data-topology-contract="server-static-fallback"/);
	assert.match(inspector, /serviceCount/);
	assert.doesNotMatch(inspector, /fetchServiceTopologyOnce/);
	assert.doesNotMatch(inspector, /fetch\("\/api\/homelab-topology/);
});

test("impact inspector keeps live health separate from declared topology", async () => {
	const inspector = await source(
		"app/[locale]/architecture/ArchitectureImpactInspector.tsx",
	);

	assert.match(inspector, /fetchHomelabHealthOnce/);
	assert.match(inspector, /affectedDependents\(topology, selectedId\)/);
	assert.match(inspector, /incidentDependencyPath/);
	assert.match(inspector, /data-architecture-root-cause/);
	assert.match(inspector, /data-architecture-blast-radius/);
});
