import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	AI_ENTITIES,
	AI_RELATIONS,
} from "../app/[locale]/architecture/architectureData";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AI architecture reuses the shared architecture catalog", async () => {
	const [architecture, sections, guide] = await Promise.all([
		source("app/[locale]/ai/AiHomelabArchitecture.tsx"),
		source("app/[locale]/ai/AiNativeSections.tsx"),
		source("app/[locale]/ai/AiPageGuide.tsx"),
	]);

	assert.match(architecture, /AI_ENTITIES/);
	assert.doesNotMatch(architecture, /"Open WebUI"/);
	assert.doesNotMatch(architecture, /"LiteLLM"/);
	assert.doesNotMatch(architecture, /"Ollama · local"/);

	const layers = new Map<number, string[]>();
	for (const entity of AI_ENTITIES) {
		assert.equal(typeof entity.layer, "number", `${entity.id} must define a layer`);
		const layer = entity.layer as number;
		layers.set(layer, [...(layers.get(layer) ?? []), entity.id]);
	}

	assert.deepEqual([...layers.keys()].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
	for (const layer of layers.values()) assert.ok(layer.length > 0);

	const hasRelation = (sourceId: string, targetId: string) =>
		AI_RELATIONS.some(
			(relation) =>
				relation.source === sourceId && relation.target === targetId,
		);
	assert.ok(hasRelation("openwebui", "litellm"));
	assert.ok(hasRelation("litellm", "ollama"));

	const sectionOrder = [
		"<AiSecurePlatformOverview",
		"<AiHomelabArchitecture",
		"<AiObservability",
		"<AiWorkflowAutomation",
		"<AiGlobalTools",
		"<AiResourceCatalog",
	];
	let previousIndex = -1;
	for (const marker of sectionOrder) {
		const index = sections.indexOf(marker);
		assert.ok(index > previousIndex, `${marker} must preserve the secure AI narrative order`);
		previousIndex = index;
	}

	const guideOrder = [
		'id: "secure-ai-platform"',
		'id: "ai-homelab-architecture"',
		'id: "ai-observability"',
		'id: "workflow-automation"',
		'id: "global-ai-tools"',
		'id: "ai-resource-catalog"',
	];
	previousIndex = -1;
	for (const marker of guideOrder) {
		const index = guide.indexOf(marker);
		assert.ok(index > previousIndex, `${marker} must match rendered section order`);
		previousIndex = index;
	}
});
