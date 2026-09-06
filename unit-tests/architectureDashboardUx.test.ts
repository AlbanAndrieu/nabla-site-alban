import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture exposes stable anchors for every major section", async () => {
	const page = await source("app/[locale]/architecture/page.tsx");
	const nav = await source("app/[locale]/architecture/ArchitectureSectionNav.tsx");
	const topology = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);
	const hierarchy = await source(
		"app/[locale]/architecture/ArchitectureServiceHierarchy.tsx",
	);
	const criticality = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	for (const anchor of [
		"architecture-overview",
		"architecture-health-dashboard",
		"architecture-services",
		"critical-dependency-hierarchy",
		"service-architecture-explorer",
		"homelab-network-ingress-paths",
		"declared-observed-health",
	]) {
		assert.match(
			`${page}\n${nav}\n${topology}\n${hierarchy}\n${criticality}`,
			new RegExp(anchor),
		);
	}
	assert.match(page, /id="homelab-network-architecture"/);
	assert.match(page, /id="declared-observed-architecture"/);
	assert.match(hierarchy, /id="service-directory"/);
});

test("architecture dashboard filters declared services by health and operator presentation", async () => {
	const topology = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);

	assert.match(topology, /type HealthFilter = "all" \| HomelabHealthState/);
	assert.match(topology, /type GroupFilter = "all" \| ServicePresentationGroup/);
	assert.match(topology, /resolveEffectiveServiceState/);
	assert.match(topology, /analyzeServicePresentation/);
	assert.match(topology, /filteredCatalog/);
	assert.match(topology, /data-health-filter/);
	assert.match(topology, /data-architecture-presentation-filter/);
	assert.match(topology, /data-architecture-service-search/);
	assert.match(topology, /Reset filters/);
	assert.match(topology, /HomelabServicesBlock\.module\.css/);
});

test("architecture places TrueNAS-style services between filters and critical hierarchy", async () => {
	const topology = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);
	const hierarchy = await source(
		"app/[locale]/architecture/ArchitectureServiceHierarchy.tsx",
	);
	const criticality = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	const dashboardIndex = topology.indexOf('id="architecture-health-dashboard"');
	const servicesIndex = topology.indexOf("<ArchitectureServiceHierarchy");
	const criticalityIndex = topology.indexOf("<CriticalDependencyHierarchy");
	const explorerIndex = topology.indexOf('id="service-architecture-explorer"');

	assert.ok(dashboardIndex >= 0);
	assert.ok(servicesIndex > dashboardIndex);
	assert.ok(criticalityIndex > servicesIndex);
	assert.ok(explorerIndex > criticalityIndex);
	assert.match(hierarchy, /<HomelabServiceGrid/);
	assert.match(hierarchy, /className={styles\.groupDetails}/);
	assert.match(hierarchy, /className={styles\.groupSummary}/);
	assert.match(criticality, /<details/);
	assert.match(criticality, /data-criticality-toggle/);
	assert.doesNotMatch(criticality, /defaultOpen|open=\{true\}/);
});
