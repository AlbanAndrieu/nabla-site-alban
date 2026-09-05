import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture keeps the legacy standalone mobile hierarchy retired", async () => {
	const legacyStyles = await source(
		"app/[locale]/architecture/MobileArchitectureHierarchy.module.css",
	);

	assert.match(legacyStyles, /^\.mobileHierarchy \{\s*display: none;\s*\}\s*$/);
	assert.doesNotMatch(legacyStyles, /@media/);
	assert.doesNotMatch(legacyStyles, /display: grid/);
});

test("hierarchical explorer owns the single active compact mobile view", async () => {
	const [component, styles] = await Promise.all([
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css"),
	]);

	assert.match(component, /data-mobile-architecture-hierarchy/);
	assert.match(component, /data-mobile-architecture-group=/);
	assert.match(component, /data-mobile-architecture-item=/);
	assert.match(component, /<details/);
	assert.match(component, /groups=\{groups\}/);
	assert.match(component, /nodeDataById=\{nodeDataById\}/);
	assert.match(component, /relations=\{edges\}/);
	assert.match(styles, /@media \(max-width: 700px\)/);
	assert.match(styles, /\.mobileHierarchy \{[\s\S]*display: grid/);
	assert.match(styles, /\.flowShell \{[\s\S]*display: none/);
});

test("integrated mobile hierarchy shares graph health, criticality and filters", async () => {
	const component = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);

	assert.match(component, /resolveEffectiveServiceState/);
	assert.match(component, /blockedDependencyLabels/);
	assert.match(component, /analyzeServiceCriticality\(topology\)/);
	assert.match(component, /blastRadiusLevel/);
	assert.match(component, /showOptional/);
	assert.match(component, /scope/);
	assert.match(component, /filtered\.visible/);
	assert.match(component, /data-health-state=/);
	assert.match(component, /data-blast-radius-level=/);
});
