import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("TrueNAS SERVICE ReactFlow uses the existing Backstage v2 graph", () => {
	const component = source("app/components/homelab/HomelabServicesBlock.tsx");
	assert.match(component, /data-homelab-service-reactflow/);
	assert.match(component, /HierarchicalArchitectureExplorer/);
	assert.match(component, /initialMode="services"/);
	assert.match(component, /readOnly=\{readOnly\}/);
	assert.match(
		component,
		/healthStatus=\{readOnly \? null : state\.snapshot\}/,
	);
	assert.match(component, /relations: \[\]/);
	assert.match(component, /Relations indisponibles/);
});

test("ReactFlow does not start raw OWNER runtime polling in read-only mode", () => {
	const explorer = source(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
	);
	const graph = source(
		"app/[locale]/architecture/useHierarchicalArchitectureGraph.ts",
	);
	const runtime = source(
		"app/[locale]/architecture/useArchitectureRuntimeStatus.ts",
	);
	assert.match(explorer, /readOnly,/);
	assert.match(explorer, /initialMode,/);
	assert.match(graph, /useArchitectureRuntimeStatus\(readOnly\)/);
	assert.match(graph, /useState<GraphMode>\(initialMode\)/);
	assert.match(runtime, /if \(readOnly\) \{/);
});

test("canonical Backstage entity references are typed rather than unknown", () => {
	const types = source("lib/homelabServices.ts");
	assert.match(types, /entityRef\?: string;/);
	assert.match(types, /catalogRevision\?: string;/);
});
