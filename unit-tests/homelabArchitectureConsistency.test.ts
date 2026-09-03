import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("architecture renders the same homelab service cards as TrueNAS", async () => {
	const hierarchy = await readFile(
		new URL(
			"../app/[locale]/architecture/ArchitectureServiceHierarchy.tsx",
			import.meta.url,
		),
		"utf8",
	);
	const topology = await readFile(
		new URL(
			"../app/[locale]/architecture/ArchitectureTopologyView.tsx",
			import.meta.url,
		),
		"utf8",
	);
	const page = await readFile(
		new URL("../app/[locale]/architecture/page.tsx", import.meta.url),
		"utf8",
	);

	assert.match(hierarchy, /HomelabServiceGrid/);
	assert.match(hierarchy, /HomelabServicesBlock\.module\.css/);
	assert.match(hierarchy, /data-homelab-service-hierarchy/);
	assert.match(hierarchy, /id="architecture-services"/);
	assert.match(hierarchy, /id="service-directory"/);
	assert.match(topology, /<ArchitectureServiceHierarchy/);
	assert.match(topology, /className="container"/);
	assert.doesNotMatch(page, /ArchitectureServiceDirectory/);
});

test("TrueNAS provides health and criticality filters without a standalone DNS panel", async () => {
	const source = await readFile(
		new URL(
			"../app/components/homelab/HomelabServicesBlock.tsx",
			import.meta.url,
		),
		"utf8",
	);
	assert.match(source, /data-homelab-health-filter/);
	assert.match(source, /data-homelab-health-select/);
	assert.match(source, /data-homelab-tier-filter/);
	assert.match(source, /effectiveState/);
	assert.doesNotMatch(source, /PfSenseDnsPosture/);
});

test("critical dependency hierarchy uses one shared render and keeps chevron beside its label", async () => {
	const component = await readFile(
		new URL(
			"../app/components/homelab/CriticalDependencyHierarchy.tsx",
			import.meta.url,
		),
		"utf8",
	);
	const architecture = await readFile(
		new URL(
			"../app/[locale]/architecture/ArchitectureTopologyView.tsx",
			import.meta.url,
		),
		"utf8",
	);
	const truenas = await readFile(
		new URL(
			"../app/components/homelab/HomelabServicesBlock.tsx",
			import.meta.url,
		),
		"utf8",
	);
	assert.match(component, /ServiceCriticalityOverview/);
	assert.match(component, /styles\.chevron/);
	assert.match(architecture, /<CriticalDependencyHierarchy topology={topology}/);
	assert.match(truenas, /<CriticalDependencyHierarchy topology={state\.topology}/);
});
