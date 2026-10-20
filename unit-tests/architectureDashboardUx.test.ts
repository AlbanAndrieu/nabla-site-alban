import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
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
			source(`app/[locale]/architecture/${file}`),
		),
	);
	return parts.join("\n");
}

test("architecture exposes stable anchors for every major section", async () => {
	const page = await source("app/[locale]/architecture/page.tsx");
	const nav = await source(
		"app/[locale]/architecture/ArchitectureSectionNav.tsx",
	);
	const privateViews = await source(
		"app/[locale]/architecture/ArchitecturePrivateViews.tsx",
	);
	const evidence = await source(
		"app/components/homelab/HomelabOperationalEvidence.tsx",
	);
	const inspector = await source(
		"app/[locale]/architecture/ArchitectureImpactInspector.tsx",
	);
	const topology = await topologyViewSource();
	const hierarchy = await source(
		"app/[locale]/architecture/ArchitectureServiceHierarchy.tsx",
	);
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	const criticality = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);
	const rendered = [
		page,
		privateViews,
		evidence,
		inspector,
		topology,
		hierarchy,
		explorer,
		criticality,
	].join("\n");

	// Every navigation target must exist in a rendered section, not only in
	// the navigation itself.
	const targets = [...nav.matchAll(/\["([a-z-]+)", "/g)].map((m) => m[1]);
	assert.ok(targets.length >= 9);
	for (const anchor of new Set(targets)) {
		// Exact literal (id="…" or an id constant), not a "-title" suffix.
		assert.match(rendered, new RegExp(`["'\`]${anchor}["'\`]`), anchor);
	}
	assert.match(page, /id="declared-observed-architecture"/);
	// Owner-only views are mounted through the access gate, never directly.
	assert.match(page, /<ArchitecturePrivateViews locale=\{locale\} \/>/);
	assert.doesNotMatch(
		page,
		/<ArchitectureTopologyView|<HomelabOperationalEvidence/,
	);
	assert.match(privateViews, /id="homelab-network-architecture"/);
	assert.match(hierarchy, /id="service-directory"/);
});

test("architecture dashboard filters declared services by health and operator presentation", async () => {
	const topology = await topologyViewSource();

	assert.match(topology, /type HealthFilter = "all" \| HomelabHealthState/);
	assert.match(
		topology,
		/type GroupFilter = "all" \| ServicePresentationGroup/,
	);
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
