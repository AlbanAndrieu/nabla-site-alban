import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture exposes stable anchors for every major section", async () => {
	const page = await source("app/[locale]/architecture/page.tsx");
	const nav = await source("app/[locale]/architecture/ArchitectureSectionNav.tsx");
	const topology = await source("app/[locale]/architecture/ArchitectureTopologyView.tsx");
	const criticality = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	for (const anchor of [
		"architecture-overview",
		"architecture-health-dashboard",
		"critical-dependency-hierarchy",
		"service-architecture-explorer",
		"homelab-network-ingress-paths",
		"declared-observed-health",
	]) {
		assert.match(
			`${page}\n${nav}\n${topology}\n${criticality}`,
			new RegExp(anchor),
		);
	}
	assert.match(page, /id="homelab-network-architecture"/);
	assert.match(page, /id="declared-observed-architecture"/);
});

test("architecture dashboard filters declared services by health and criticality", async () => {
	const topology = await source("app/[locale]/architecture/ArchitectureTopologyView.tsx");

	assert.match(topology, /type HealthFilter = "all" \| HomelabHealthState/);
	assert.match(topology, /type TierFilter = "all" \| ServiceCriticalityTier/);
	assert.match(topology, /resolveEffectiveServiceState/);
	assert.match(topology, /analyzeServiceCriticality/);
	assert.match(topology, /filteredCatalog/);
	assert.match(topology, /data-health-filter/);
	assert.match(topology, /Reset filters/);
});

test("architecture reuses the same collapsed critical hierarchy as TrueNAS", async () => {
	const topology = await source("app/[locale]/architecture/ArchitectureTopologyView.tsx");
	const criticality = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	const criticalityIndex = topology.indexOf("<CriticalDependencyHierarchy");
	const explorerIndex = topology.indexOf('id="service-architecture-explorer"');

	assert.ok(criticalityIndex >= 0);
	assert.ok(explorerIndex > criticalityIndex);
	assert.match(topology, /import CriticalDependencyHierarchy/);
	assert.doesNotMatch(topology, /ServiceCriticalityOverview/);
	assert.match(criticality, /<details/);
	assert.match(criticality, /data-criticality-toggle/);
	assert.doesNotMatch(criticality, /defaultOpen|open=\{true\}/);
});
