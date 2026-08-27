import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const overviewPath = new URL(
	"../app/[locale]/ai/AiSecurePlatformOverview.tsx",
	import.meta.url,
);
const nativeSectionsPath = new URL(
	"../app/[locale]/ai/AiNativeSections.tsx",
	import.meta.url,
);

test("AI page leads native content with secure platform engineering", async () => {
	const [overview, nativeSections] = await Promise.all([
		readFile(overviewPath, "utf8"),
		readFile(nativeSectionsPath, "utf8"),
	]);

	assert.match(
		nativeSections,
		/<AiSecurePlatformOverview locale=\{locale\} \/>/,
	);
	assert.ok(
		nativeSections.indexOf("<AiSecurePlatformOverview") <
			nativeSections.indexOf("<AiWorkflowAutomation"),
		"secure AI architecture should appear before the tool/workflow catalogue",
	);

	assert.match(overview, /Controlled model gateway/);
	assert.match(overview, /MCP & agent trust boundaries/);
	assert.match(overview, /RAG provenance & lifecycle/);
	assert.match(overview, /Observability, evaluation & FinOps/);
	assert.match(overview, /ISO 27001 and ISO 42001/);
});

test("secure AI architecture is localized for French readers", async () => {
	const overview = await readFile(overviewPath, "utf8");

	assert.match(overview, /Ingénierie d’une plateforme IA sécurisée/);
	assert.match(overview, /Frontières de confiance MCP et agents/);
	assert.match(overview, /Gouvernance dès la conception/);
	assert.match(overview, /RGPD, ISO 27001 et ISO 42001/);
});
