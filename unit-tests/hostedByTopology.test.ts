import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	analyzeServiceCriticality,
	buildServiceImpactFocus,
} from "../lib/serviceCriticality";
import { parseServiceTopology, type ServiceTopology } from "../lib/serviceTopology";

const topology: ServiceTopology = {
	version: 1,
	name: "hosted placement fixture",
	nodes: [
		{ id: "truenas", name: "TrueNAS", kind: "storage-platform", category: "infrastructure" },
		{ id: "docker", name: "Docker", kind: "container-runtime", category: "infrastructure" },
		{ id: "litellm", name: "LiteLLM", kind: "gateway", category: "ai" },
		{ id: "openwebui", name: "Open WebUI", kind: "application", category: "ai" },
		{ id: "prometheus", name: "Prometheus", kind: "observability", category: "observability" },
	],
	relations: [
		{
			source: "openwebui",
			target: "litellm",
			type: "consumesApi",
			strength: "required",
			evidence: ["fixture:functional"],
		},
		{
			source: "openwebui",
			target: "docker",
			type: "hostedBy",
			strength: "required",
			evidence: ["fixture:runtime.containerService"],
		},
		{
			source: "prometheus",
			target: "docker",
			type: "hostedBy",
			strength: "required",
			evidence: ["fixture:runtime.containerService"],
		},
		{
			source: "docker",
			target: "truenas",
			type: "hostedBy",
			strength: "required",
			evidence: ["fixture:docker-host"],
		},
	],
};

test("hostedBy is accepted as a first-class topology relation", () => {
	const parsed = parseServiceTopology(topology);
	assert.ok(parsed);
	assert.equal(parsed.relations.filter((relation) => relation.type === "hostedBy").length, 3);
});

test("hosting expands infrastructure blast radius without becoming a functional dependency", () => {
	const analysis = analyzeServiceCriticality(topology);

	assert.deepEqual(analysis.get("openwebui")?.requiredDependencies, ["litellm"]);
	assert.deepEqual(analysis.get("prometheus")?.requiredDependencies, []);
	assert.equal(analysis.get("prometheus")?.tier, "support");
	assert.equal(analysis.get("docker")?.tier, "foundation");
	assert.equal(analysis.get("truenas")?.tier, "foundation");
	assert.deepEqual(analysis.get("docker")?.directDependentIds, ["openwebui", "prometheus"]);
	assert.deepEqual(analysis.get("truenas")?.directDependentIds, ["docker"]);
	assert.deepEqual(analysis.get("truenas")?.transitiveDependentIds, [
		"docker",
		"openwebui",
		"prometheus",
	]);

	const impact = buildServiceImpactFocus("truenas", topology, analysis);
	assert.deepEqual(impact?.directDependentIds, ["docker"]);
	assert.deepEqual(impact?.indirectDependentIds, ["openwebui", "prometheus"]);
	assert.deepEqual(impact?.requiredDependencyIds, []);
});

test("architecture graph treats hostedBy and partOf as structural placement without target-health colouring", async () => {
	const explorer = await readFile(
		"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
		"utf8",
	);
	assert.match(explorer, /\["partOf", "hostedBy"\]/);
	assert.match(
		explorer,
		/relation\.optional \|\| \["partOf", "hostedBy"\]\.includes\(relation\.type\)/,
	);
});
