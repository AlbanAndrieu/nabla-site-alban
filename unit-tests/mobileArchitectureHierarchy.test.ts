import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture exposes a mobile-first compact dependency hierarchy", async () => {
	const [view, component, styles] = await Promise.all([
		source("app/[locale]/architecture/ArchitectureTopologyView.tsx"),
		source("app/[locale]/architecture/MobileArchitectureHierarchy.tsx"),
		source("app/[locale]/architecture/MobileArchitectureHierarchy.module.css"),
	]);

	assert.match(view, /MobileArchitectureHierarchy/);
	assert.match(component, /data-mobile-architecture-hierarchy/);
	assert.match(component, /data-mobile-criticality-tier/);
	assert.match(component, /data-mobile-service=/);
	assert.match(component, /<details/);
	assert.match(component, /expandedTiers/);
	assert.match(styles, /@media \(max-width: 760px\)/);
	assert.match(styles, /\.mobileHierarchy/);
	assert.match(styles, /display: none/);
	assert.match(styles, /min-height: var\(--ui-control-min-height, 44px\)/);
});

test("mobile hierarchy reuses effective health, criticality and blast radius", async () => {
	const component = await source(
		"app/[locale]/architecture/MobileArchitectureHierarchy.tsx",
	);
	assert.match(component, /resolveEffectiveServiceState/);
	assert.match(component, /blockedDependencyLabels/);
	assert.match(component, /analyzeServiceCriticality\(topology\)/);
	assert.match(component, /transitiveDependents/);
	assert.match(component, /data-health-state=/);
	assert.match(component, /data-mobile-service-blockers/);
});

test("mobile hierarchy can reduce noise to critical and required relations", async () => {
	const component = await source(
		"app/[locale]/architecture/MobileArchitectureHierarchy.tsx",
	);
	assert.match(component, /criticalOnly/);
	assert.match(component, /showOptional/);
	assert.match(component, /tier !== "support"/);
	assert.match(component, /relation\.strength === "required"/);
	assert.match(component, /data-mobile-relation-strength/);
	assert.match(component, /Critical only/);
	assert.match(component, /Optional relations/);
});
