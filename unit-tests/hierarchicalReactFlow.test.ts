import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture topology view uses the grouped hierarchical React Flow", async () => {
	const [view, explorer] = await Promise.all([
		source("app/[locale]/architecture/ArchitectureTopologyView.tsx"),
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
	]);
	assert.match(view, /HierarchicalArchitectureExplorer/);
	assert.match(explorer, /data-hierarchical-architecture-explorer/);
	assert.match(explorer, /architectureGroup/);
	assert.match(explorer, /parentId: group\.id/);
	assert.match(explorer, /extent: "parent"/);
	assert.match(explorer, /nodesDraggable=\{false\}/);
});

test("React Flow preserves document scrolling and makes graph zoom explicit", async () => {
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	assert.match(explorer, /zoomOnScroll=\{false\}/);
	assert.match(explorer, /panOnScroll=\{false\}/);
	assert.match(explorer, /preventScrolling=\{false\}/);
	assert.match(explorer, /zoomActivationKeyCode=\{\["Control", "Meta"\]\}/);
	assert.match(explorer, /architecture-flow-interaction-hint/);
	assert.match(explorer, /<Controls/);
});

test("Nabla TrueNAS graph reuses criticality tiers, blast radius and required dependency direction", async () => {
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	assert.match(explorer, /analyzeServiceCriticality\(topology\)/);
	assert.match(explorer, /compareServiceCriticality/);
	assert.match(explorer, /"foundation"/);
	assert.match(explorer, /"shared-data"/);
	assert.match(explorer, /"shared-platform"/);
	assert.match(explorer, /"application"/);
	assert.match(
		explorer,
		/blastRadius: serviceCriticality\?\.transitiveDependents/,
	);
	assert.match(explorer, /required dependencies ↑/);
	assert.match(explorer, /Critical path/);
	assert.match(explorer, /All components/);
});

test("AI Platform is rendered as functional swimlanes and optional edges remain explicit", async () => {
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	for (const label of [
		"Interfaces & agents",
		"Control plane",
		"Inference",
		"Tools & knowledge",
		"Orchestration",
		"Observability & evaluation",
	]) {
		assert.match(
			explorer,
			new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
		);
	}
	assert.match(explorer, /Optional relations/);
	assert.match(
		explorer,
		/relationStrengthLabel\(Boolean\(relation\.optional\), french\)/,
	);
	assert.match(explorer, /strokeDasharray/);
});

test("hierarchical graph keeps consumer-side dependency evidence on service dependency edges", async () => {
	const [explorer, evidence] = await Promise.all([
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
		source("app/[locale]/architecture/ArchitectureDependencyEvidence.tsx"),
	]);
	assert.match(explorer, /resolveEffectiveServiceState\(health\)/);
	assert.match(explorer, /blockedDependencyLabels\(health\)/);
	assert.match(explorer, /degradedDependencyLabels\(health\)/);
	assert.match(explorer, /unconfirmedDependencyLabels\(health\)/);
	assert.match(explorer, /requiredDependencyRelationHealth/);
	assert.match(explorer, /requiredEdgeDependencyState/);
	assert.match(explorer, /mode === "services" && semantic === "dependency"/);
	assert.match(explorer, /dependencyState === "blocked"/);
	assert.match(explorer, /dependencyState === "degraded"/);
	assert.match(explorer, /dependencyState === "unconfirmed"/);
	assert.match(explorer, /dependencyState !== "unconfirmed"/);
	assert.match(explorer, /dependencyState,/);
	assert.match(evidence, /data-dependency-health=\{state\}/);
	assert.match(evidence, /data-dependency-evidence-legend/);
	assert.match(evidence, /Declared ≠ observed ≠ healthy/);
});

test("architecture graph distinguishes relation purpose from required or optional strength", async () => {
	const [explorer, styles] = await Promise.all([
		source("app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx"),
		source(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css",
		),
	]);
	assert.match(explorer, /type RelationSemantic/);
	assert.match(explorer, /relationSemantic\(relation\.type\)/);
	assert.match(explorer, /data-architecture-relation-legend/);
	for (const semantic of [
		"dependency",
		"flow",
		"exposure",
		"placement",
		"observation",
		"automation",
	]) {
		assert.match(
			explorer,
			new RegExp(`data-relation-kind=\\{semantic\\}|\\[\\"${semantic}\\"`),
		);
	}
	for (const className of [
		"edgeDependency",
		"edgeFlow",
		"edgeExposure",
		"edgePlacement",
		"edgeObservation",
		"edgeAutomation",
	]) {
		assert.match(styles, new RegExp(`\\.${className}\\b`));
	}
	assert.match(explorer, /semanticStyle\.color/);
	assert.match(explorer, /semanticStyle\.dash/);
});

test("exposure contract keeps direct, tunnel, LAN VPN and internal paths causally separate", async () => {
	const explorer = await source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	assert.match(explorer, /data-exposure-path-contract/);
	assert.match(explorer, /data-exposure-path="direct"/);
	assert.match(explorer, /data-exposure-path="cloudflare"/);
	assert.match(explorer, /data-exposure-path="lan-vpn"/);
	assert.match(explorer, /data-exposure-path="internal"/);
	assert.match(explorer, /pfSense:7000 → HAProxy → TrueNAS:7000/);
	assert.match(explorer, /10443\/tcp/);
	assert.match(explorer, /9922\/tcp/);
	assert.match(explorer, /data-cloudflare-direct-isolation/);
	assert.match(explorer, /Tunnel\/Access evidence never proves/);
});
