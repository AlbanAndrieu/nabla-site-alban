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
	const [overview, nativeSections, englishRaw] = await Promise.all([
		readFile(overviewPath, "utf8"),
		readFile(nativeSectionsPath, "utf8"),
		readFile("messages/ai/en.json", "utf8"),
	]);

	assert.match(nativeSections, /<AiSecurePlatformOverview \/>/);
	assert.ok(
		nativeSections.indexOf("<AiSecurePlatformOverview") <
			nativeSections.indexOf("<AiWorkflowAutomation"),
		"secure AI architecture should appear before the tool/workflow catalogue",
	);

	assert.match(overview, /useTranslations\("ai"\)/);
	assert.match(overview, /securePlatform\.pillars/);
	const english = JSON.parse(englishRaw) as {
		ai: {
			securePlatform: {
				pillars: Record<string, { title: string; description: string }>;
			};
		};
	};
	const copy = JSON.stringify(english.ai.securePlatform);
	assert.match(copy, /Controlled model gateway/);
	assert.match(copy, /MCP & agent trust boundaries/);
	assert.match(copy, /RAG provenance & lifecycle/);
	assert.match(copy, /Observability, evaluation & FinOps/);
	assert.match(copy, /ISO 27001 and ISO 42001/);
});

test("secure AI architecture is localized for French readers through next-intl", async () => {
	const [overview, frenchRaw] = await Promise.all([
		readFile(overviewPath, "utf8"),
		readFile("messages/ai/fr.json", "utf8"),
	]);
	const french = JSON.parse(frenchRaw) as { ai: { securePlatform: unknown } };
	const copy = JSON.stringify(french.ai.securePlatform);

	assert.match(overview, /useTranslations\("ai"\)/);
	assert.doesNotMatch(overview, /locale === ["']fr["']/);
	assert.match(copy, /Ingénierie d’une plateforme IA sécurisée/);
	assert.match(copy, /Frontières de confiance MCP et agents/);
	assert.match(copy, /Gouvernance dès la conception/);
	assert.match(copy, /RGPD, ISO 27001 et ISO 42001/);
});
