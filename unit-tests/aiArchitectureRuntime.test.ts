import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const architecturePath = new URL("../app/[locale]/ai/AiHomelabArchitecture.tsx", import.meta.url);

test("AI architecture diagram is rendered locally without Mermaid CDN", async () => {
	const source = await readFile(architecturePath, "utf8");

	assert.doesNotMatch(source, /cdn\.jsdelivr\.net/);
	assert.doesNotMatch(source, /mermaid/i);
	assert.doesNotMatch(source, /next\/script/);
	assert.match(source, /<ArchitectureFlow french=\{french\} \/>/);
	assert.match(source, /LiteLLM/);
	assert.match(source, /FastAPI MCP/);
	assert.match(source, /Langfuse/);
});
