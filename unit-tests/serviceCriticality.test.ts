import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
} from "../lib/serviceCriticality";
import type { ServiceTopology } from "../lib/serviceTopology";

const topology: ServiceTopology = {
	version: 1,
	name: "criticality fixture",
	nodes: [
		{
			id: "truenas",
			name: "TrueNAS",
			kind: "storage-platform",
			category: "infrastructure",
		},
		{
			id: "postgresql",
			name: "PostgreSQL",
			kind: "database",
			category: "data",
		},
		{ id: "ollama", name: "Ollama", kind: "model-runtime", category: "ai" },
		{ id: "litellm", name: "LiteLLM", kind: "gateway", category: "ai" },
		{
			id: "openwebui",
			name: "Open WebUI",
			kind: "application",
			category: "ai",
		},
		{ id: "searxng", name: "SearXNG", kind: "search", category: "ai" },
		{
			id: "prometheus",
			name: "Prometheus",
			kind: "observability",
			category: "observability",
		},
		{ id: "n8n", name: "n8n", kind: "workflow", category: "automation" },
	],
	relations: [
		{
			source: "openwebui",
			target: "litellm",
			type: "consumesApi",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "litellm",
			target: "ollama",
			type: "routesTo",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "openwebui",
			target: "searxng",
			type: "consumesApi",
			strength: "optional",
			evidence: ["fixture"],
		},
		{
			source: "n8n",
			target: "postgresql",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "openwebui",
			target: "prometheus",
			type: "observedBy",
			strength: "required",
			evidence: ["fixture"],
		},
	],
};

test("criticality ranks foundations and shared state ahead of leaf applications", () => {
	const analysis = analyzeServiceCriticality(topology);

	assert.equal(analysis.get("truenas")?.tier, "foundation");
	assert.equal(analysis.get("postgresql")?.tier, "shared-data");
	assert.equal(analysis.get("ollama")?.tier, "shared-platform");
	assert.equal(analysis.get("litellm")?.tier, "shared-platform");
	assert.equal(analysis.get("openwebui")?.tier, "application");
	assert.equal(analysis.get("n8n")?.tier, "application");
	assert.equal(analysis.get("prometheus")?.tier, "support");
	assert.equal(analysis.get("ollama")?.transitiveDependents, 2);
	assert.deepEqual(analysis.get("openwebui")?.optionalDependencies, ["searxng"]);
});

test("required observability links do not inflate startup criticality", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.equal(analysis.get("prometheus")?.directDependents, 0);
	assert.equal(analysis.get("prometheus")?.transitiveDependents, 0);
});

test("criticality sorting is deterministic and impact-first within a tier", () => {
	const analysis = analyzeServiceCriticality(topology);
	const ids = topology.nodes
		.map((node) => node.id)
		.sort((left, right) =>
			compareServiceCriticality(left, right, topology, analysis),
		);

	assert.equal(ids[0], "truenas");
	assert.ok(ids.indexOf("postgresql") < ids.indexOf("openwebui"));
	assert.ok(ids.indexOf("ollama") < ids.indexOf("litellm"));
	assert.ok(ids.indexOf("litellm") < ids.indexOf("openwebui"));
});

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("architecture and TrueNAS service views share the criticality hierarchy", async () => {
	const architecture = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");

	assert.match(architecture, /ServiceCriticalityOverview/);
	assert.match(architecture, /\/api\/homelab-topology/);
	assert.match(block, /ServiceCriticalityOverview/);
	assert.match(block, /compareServiceCriticality/);
	assert.match(block, /fetch\("\/api\/homelab-topology"/);
});

test("same-origin topology API keeps live topology out of static prerender", async () => {
	const route = await source("app/api/homelab-topology/route.ts");
	assert.match(route, /loadServiceTopology/);
	assert.match(route, /dynamic = "force-dynamic"/);
	assert.match(route, /Cache-Control/);
});
