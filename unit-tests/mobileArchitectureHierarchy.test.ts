import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture uses the standalone mobile hierarchy as the single compact view", async () => {
	const [view, mobile, mobileStyles, explorer] = await Promise.all([
		source("app/[locale]/architecture/ArchitectureTopologyView.tsx"),
		source("app/[locale]/architecture/MobileArchitectureHierarchy.tsx"),
		source("app/[locale]/architecture/MobileArchitectureHierarchy.module.css"),
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
	]);

	assert.match(view, /<MobileArchitectureHierarchy/);
	assert.match(mobile, /data-mobile-architecture-hierarchy/);
	assert.match(mobile, /data-mobile-criticality-tier=/);
	assert.match(mobile, /data-mobile-service=/);
	assert.match(mobile, /analyzeServiceCriticality\(topology\)/);
	assert.match(mobile, /blockedDependencyLabels\(health\)/);
	assert.match(mobileStyles, /@media \(max-width: 700px\)/);
	assert.match(mobileStyles, /\.mobileHierarchy \{[\s\S]*display: grid/);
	assert.doesNotMatch(explorer, /function MobileArchitectureHierarchy/);
	assert.doesNotMatch(explorer, /data-mobile-architecture-hierarchy/);
});

test("desktop React Flow remains the single interactive graph and yields to page scrolling", async () => {
	const [explorer, styles] = await Promise.all([
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css"),
	]);

	assert.match(explorer, /<ReactFlow/);
	assert.match(explorer, /zoomOnScroll=\{false\}/);
	assert.match(explorer, /panOnScroll=\{false\}/);
	assert.match(explorer, /preventScrolling=\{false\}/);
	assert.match(explorer, /zoomActivationKeyCode=\{\["Control", "Meta"\]\}/);
	assert.match(explorer, /architecture-flow-interaction-hint/);
	assert.match(styles, /@media \(max-width: 700px\)/);
	assert.match(styles, /\.flowShell \{[\s\S]*display: none/);
});

test("mobile hierarchy shares service health, criticality and relation filters", async () => {
	const component = await source(
		"app/[locale]/architecture/MobileArchitectureHierarchy.tsx",
	);

	assert.match(component, /resolveEffectiveServiceState/);
	assert.match(component, /blockedDependencyLabels/);
	assert.match(component, /analyzeServiceCriticality\(topology\)/);
	assert.match(component, /criticalOnly/);
	assert.match(component, /showOptional/);
	assert.match(component, /data-health-state=/);
	assert.match(component, /data-mobile-relation-strength=/);
});
