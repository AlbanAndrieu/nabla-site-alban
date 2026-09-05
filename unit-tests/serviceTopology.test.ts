import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	getStaticServiceTopology,
	parseServiceTopology,
} from "../lib/serviceTopology";

test("local topology fallback is a valid connected graph", async () => {
	const raw = JSON.parse(
		await readFile("public/service-topology.json", "utf8"),
	) as unknown;
	const topology = parseServiceTopology(raw);

	assert.ok(topology);
	assert.ok(topology.nodes.length >= 10);
	assert.ok(topology.relations.length >= 10);
	assert.ok(
		topology.relations.some(
			(relation) =>
				relation.source === "openwebui" && relation.target === "litellm",
		),
	);
	assert.ok(
		topology.relations.some(
			(relation) =>
				relation.source === "litellm" && relation.target === "ollama",
		),
	);
});

test("local fallback preserves the Elasticsearch and Kibana multi-service contract", async () => {
	const raw = JSON.parse(
		await readFile("public/service-topology.json", "utf8"),
	) as unknown;
	const topology = parseServiceTopology(raw);

	assert.ok(topology);
	const nodeIds = new Set(topology.nodes.map((node) => node.id));
	assert.ok(nodeIds.has("elasticsearch"));
	assert.ok(nodeIds.has("kibana"));
	assert.ok(nodeIds.has("docker"));
	assert.ok(nodeIds.has("truenas"));

	const hasRelation = (
		source: string,
		target: string,
		type: string,
		strength = "required",
	) =>
		topology.relations.some(
			(relation) =>
				relation.source === source &&
				relation.target === target &&
				relation.type === type &&
				relation.strength === strength,
		);

	assert.ok(hasRelation("kibana", "elasticsearch", "dependsOn"));
	assert.ok(hasRelation("elasticsearch", "docker", "hostedBy"));
	assert.ok(hasRelation("kibana", "docker", "hostedBy"));
	assert.ok(hasRelation("docker", "truenas", "hostedBy"));
});

test("static architecture topology never probes FastAPI during prerender", () => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("static topology must not fetch");
	}) as typeof fetch;

	try {
		const result = getStaticServiceTopology();
		assert.equal(fetchCalled, false);
		assert.equal(result.source, "local-fallback");
		assert.ok(result.topology.nodes.length >= 10);
		assert.ok(result.topology.relations.length >= 10);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("topology parser accepts hostedBy placement edges", () => {
	const topology = parseServiceTopology({
		version: 1,
		name: "hosting",
		nodes: [
			{ id: "service", name: "Service", kind: "application", category: "test" },
			{ id: "docker", name: "Docker", kind: "container-runtime", category: "infrastructure" },
		],
		relations: [
			{
				source: "service",
				target: "docker",
				type: "hostedBy",
				strength: "required",
				evidence: ["x-nabla.runtime.containerService"],
			},
		],
	});

	assert.ok(topology);
	assert.equal(topology.relations[0]?.type, "hostedBy");
});

test("topology parser rejects edges with unknown nodes", () => {
	const topology = parseServiceTopology({
		version: 1,
		name: "invalid",
		nodes: [{ id: "a", name: "A", kind: "service", category: "test" }],
		relations: [
			{
				source: "a",
				target: "missing",
				type: "dependsOn",
				strength: "required",
				evidence: ["test"],
			},
		],
	});

	assert.equal(topology, null);
});

test("architecture route uses a static declared shell with live shared service health indicators", async () => {
	const [page, explorer, data, css, packageJson] = await Promise.all([
		readFile("app/[locale]/architecture/page.tsx", "utf8"),
		readFile("app/[locale]/architecture/ArchitectureExplorer.tsx", "utf8"),
		readFile("app/[locale]/architecture/architectureData.ts", "utf8"),
		readFile(
			"app/[locale]/architecture/ArchitectureExplorer.module.css",
			"utf8",
		),
		readFile("package.json", "utf8"),
	]);

	assert.match(page, /buildPageMetadata\(/);
	assert.match(page, /slug: "architecture"/);
	assert.match(page, /getStaticHomelabServicesCatalog\(\)/);
	assert.match(page, /getStaticServiceTopology\(\)/);
	assert.doesNotMatch(page, /loadHomelabServicesCatalog\(\)/);
	assert.doesNotMatch(page, /loadServiceTopology\(\)/);
	assert.match(explorer, /from "@xyflow\/react"/);
	assert.match(explorer, /colorMode="dark"/);
	assert.match(explorer, /<MiniMap[\s\S]*nodeColor=\{\(node\) =>/);
	assert.match(explorer, /homelabHealthColor\(data\.healthState\)/);
	assert.match(explorer, /: "#38bdf8"/);
	assert.match(explorer, /<Controls className=\{styles\.flowControls\} \/>/);
	assert.match(explorer, /iconSrc: entity\.iconSrc/);
	assert.match(explorer, /nodeIconFallback/);
	assert.match(explorer, /className="fas fa-lock"/);
	assert.match(explorer, /className="fas fa-cloud"/);
	assert.match(explorer, /className="fas fa-skull-crossbones"/);
	assert.match(explorer, /health\?\.url \?\? entity\.url/);
	assert.match(explorer, /parseHomelabHealthSnapshot/);
	assert.match(data, /iconSrc: serviceIconSrc\(service\)/);
	assert.match(css, /background: #020617/);
	assert.match(css, /\.nodeIconFrame/);
	assert.match(packageJson, /"@xyflow\/react": "12\.11\.3"/);
	for (const product of [
		"Open WebUI",
		"LiteLLM",
		"Ollama",
		"Paperless-ngx",
		"OpenRAG",
		"Langfuse",
	]) {
		assert.match(
			data,
			new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
		);
	}
});


test("hierarchical architecture exposes a compact mobile hierarchy driven by the same graph state", async () => {
	const [explorer, css] = await Promise.all([
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
			"utf8",
		),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css",
			"utf8",
		),
	]);

	assert.match(explorer, /data-mobile-architecture-hierarchy/);
	assert.match(explorer, /data-mobile-architecture-group=\{group\.key\}/);
	assert.match(explorer, /data-mobile-architecture-item=\{entity\.id\}/);
	assert.match(explorer, /relations=\{edges\}/);
	assert.match(explorer, /nodeDataById=\{nodeDataById\}/);
	assert.match(explorer, /<details[\s\S]*className=\{styles\.mobileGroup\}/);
	assert.match(explorer, /<details className=\{styles\.mobileRelations\}>/);
	assert.match(css, /\.mobileHierarchy\s*\{[\s\S]*display:\s*none/);
	assert.match(
		css,
		/@media \(max-width: 700px\)[\s\S]*\.mobileHierarchy\s*\{[\s\S]*display:\s*grid/,
	);
	assert.match(
		css,
		/@media \(max-width: 700px\)[\s\S]*\.flowShell\s*\{[\s\S]*display:\s*none/,
	);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*react-flow__edge\.animated path[\s\S]*animation:\s*none !important/,
	);
});
