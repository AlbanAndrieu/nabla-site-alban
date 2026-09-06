import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	analyzeServiceCriticality,
	buildServiceImpactFocus,
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
		{ id: "redis", name: "Redis", kind: "cache", category: "runtime" },
		{
			id: "clickhouse",
			name: "ClickHouse",
			kind: "database",
			category: "analytics",
		},
		{
			id: "minio",
			name: "MinIO",
			kind: "object-storage",
			category: "storage",
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
			id: "langfuse",
			name: "Langfuse",
			kind: "application",
			category: "ai",
		},
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
			source: "langfuse",
			target: "postgresql",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "langfuse",
			target: "redis",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "langfuse",
			target: "clickhouse",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "langfuse",
			target: "minio",
			type: "storesIn",
			strength: "required",
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
	for (const id of ["postgresql", "redis", "clickhouse", "minio"]) {
		assert.equal(analysis.get(id)?.tier, "shared-data", id);
	}
	assert.equal(analysis.get("ollama")?.tier, "shared-platform");
	assert.equal(analysis.get("litellm")?.tier, "shared-platform");
	assert.equal(analysis.get("openwebui")?.tier, "application");
	assert.equal(analysis.get("langfuse")?.tier, "application");
	assert.equal(analysis.get("n8n")?.tier, "application");
	assert.equal(analysis.get("prometheus")?.tier, "support");
});

test("semantic data kinds stay shared-data even when their category is not data", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.equal(analysis.get("redis")?.tier, "shared-data");
	assert.equal(analysis.get("clickhouse")?.tier, "shared-data");
	assert.equal(analysis.get("minio")?.tier, "shared-data");
});

test("blast radius includes direct and transitive required dependents", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.equal(analysis.get("ollama")?.transitiveDependents, 2);
	assert.deepEqual(analysis.get("ollama")?.transitiveDependentIds, [
		"litellm",
		"openwebui",
	]);
	assert.equal(analysis.get("postgresql")?.transitiveDependents, 2);
	assert.deepEqual(analysis.get("postgresql")?.directDependentIds, [
		"langfuse",
		"n8n",
	]);
	assert.deepEqual(analysis.get("openwebui")?.optionalDependencies, ["searxng"]);
});

test("impact drill-down separates direct and indirect blast radius and exposes dependency path", () => {
	const analysis = analyzeServiceCriticality(topology);
	const openWebUi = buildServiceImpactFocus("openwebui", topology, analysis);
	const ollama = buildServiceImpactFocus("ollama", topology, analysis);
	const postgresql = buildServiceImpactFocus("postgresql", topology, analysis);

	assert.deepEqual(openWebUi?.requiredDependencyIds, ["litellm"]);
	assert.deepEqual(openWebUi?.optionalDependencyIds, ["searxng"]);
	assert.deepEqual(openWebUi?.dependencyPathIds, ["openwebui", "litellm", "ollama"]);
	assert.deepEqual(ollama?.directDependentIds, ["litellm"]);
	assert.deepEqual(ollama?.indirectDependentIds, ["openwebui"]);
	assert.deepEqual(postgresql?.directDependentIds, ["langfuse", "n8n"]);
	assert.deepEqual(postgresql?.indirectDependentIds, []);
	assert.equal(buildServiceImpactFocus("missing", topology, analysis), null);
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

test("TrueNAS cards use service-first groups while technical criticality remains separate", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");

	assert.match(block, /data-homelab-service-hierarchy/);
	assert.match(block, /data-service-presentation-group/);
	assert.match(block, /groupCatalogByPresentation/);
	assert.match(block, /<CriticalDependencyHierarchy/);
	assert.match(block, /parseHomelabHealthSnapshot/);
	assert.match(block, /resolveEffectiveServiceState/);
	assert.match(block, /data-homelab-health-filter/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
});

test("architecture and TrueNAS share dependency, optional-edge and blast-radius semantics", async () => {
	const architecture = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);
	const explorer = await source(
		"app/[locale]/architecture/ArchitectureExplorer.tsx",
	);
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);
	const overview = await source(
		"app/components/homelab/ServiceCriticalityOverview.tsx",
	);

	assert.match(architecture, /CriticalDependencyHierarchy/);
	assert.match(hierarchy, /ServiceCriticalityOverview/);
	assert.match(architecture, /\/api\/homelab-topology/);
	assert.match(explorer, /requiredEdgeHealthState/);
	assert.match(explorer, /relation\.optional/);
	assert.match(overview, /data-blast-radius/);
	assert.match(overview, /requiredDependencies/);
	assert.match(overview, /optionalDependencies/);
	assert.match(overview, /transitiveDependentIds/);
});

test("same-origin topology API keeps live topology out of static prerender", async () => {
	const route = await source("app/api/homelab-topology/route.ts");
	assert.match(route, /loadServiceTopology/);
	assert.match(route, /dynamic = "force-dynamic"/);
	assert.match(route, /Cache-Control/);
});