import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { AI_ENTITIES } from "../app/[locale]/architecture/architectureData";

const architecturePath = new URL(
	"../app/[locale]/ai/AiHomelabArchitecture.tsx",
	import.meta.url,
);

test("AI architecture diagram is rendered locally without Mermaid CDN", async () => {
	const source = await readFile(architecturePath, "utf8");

	assert.doesNotMatch(source, /cdn\.jsdelivr\.net/);
	assert.doesNotMatch(source, /mermaid/i);
	assert.doesNotMatch(source, /next\/script/);
	assert.match(source, /<ArchitectureFlow \/>/);
	assert.match(source, /useTranslations\("ai"\)/);
	assert.match(source, /architecture\.layers/);
	assert.match(source, /AI_ENTITIES/);

	const names = new Set(AI_ENTITIES.map((entity) => entity.name));
	assert.ok(names.has("LiteLLM"));
	assert.ok(names.has("FastAPI MCP"));
	assert.ok(names.has("Langfuse"));
});
