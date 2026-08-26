import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseServiceTopology } from "../lib/serviceTopology";

test("local topology fallback is a valid connected graph", async () => {
	const raw = JSON.parse(await readFile("public/service-topology.json", "utf8")) as unknown;
	const topology = parseServiceTopology(raw);

	assert.ok(topology);
	assert.ok(topology.nodes.length >= 10);
	assert.ok(topology.relations.length >= 10);
	assert.ok(topology.relations.some((relation) => relation.source === "openwebui" && relation.target === "litellm"));
	assert.ok(topology.relations.some((relation) => relation.source === "litellm" && relation.target === "ollama"));
});

test("topology parser rejects edges with unknown nodes", () => {
	const topology = parseServiceTopology({
		version: 1,
		name: "invalid",
		nodes: [{ id: "a", name: "A", kind: "service", category: "test" }],
		relations: [{ source: "a", target: "missing", type: "dependsOn", strength: "required", evidence: ["test"] }],
	});

	assert.equal(topology, null);
});

test("architecture route uses React Flow and preserves canonical product names", async () => {
	const [page, explorer, data, packageJson] = await Promise.all([
		readFile("app/[locale]/architecture/page.tsx", "utf8"),
		readFile("app/[locale]/architecture/ArchitectureExplorer.tsx", "utf8"),
		readFile("app/[locale]/architecture/architectureData.ts", "utf8"),
		readFile("package.json", "utf8"),
	]);

	assert.match(page, /buildPageMetadata\(/);
	assert.match(page, /slug: "architecture"/);
	assert.match(explorer, /from "@xyflow\/react"/);
	assert.match(explorer, /<MiniMap pannable zoomable \/>/);
	assert.match(explorer, /<Controls \/>/);
	assert.match(packageJson, /"@xyflow\/react": "12\.11\.3"/);
	for (const product of ["Open WebUI", "LiteLLM", "Ollama", "Paperless-ngx", "OpenRAG", "Langfuse"]) {
		assert.match(data, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
});
