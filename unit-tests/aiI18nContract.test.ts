import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const AI_COMPONENTS = [
	"app/[locale]/ai/AiGlobalTools.tsx",
	"app/[locale]/ai/AiHomelabArchitecture.tsx",
	"app/[locale]/ai/AiNativeSections.tsx",
	"app/[locale]/ai/AiObservability.tsx",
	"app/[locale]/ai/AiPageGuide.tsx",
	"app/[locale]/ai/AiSecurePlatformOverview.tsx",
	"app/[locale]/ai/AiUsageAnalytics.tsx",
	"app/[locale]/ai/AiWorkflowAutomation.tsx",
] as const;

function leafKeys(value: unknown, prefix = ""): string[] {
	if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
	return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
		leafKeys(child, prefix ? `${prefix}.${key}` : key),
	);
}

test("AI native sections use the shared next-intl feature catalog", async () => {
	const [loader, page, enRaw, frRaw, ...components] = await Promise.all([
		readFile("i18n/messages.ts", "utf8"),
		readFile("app/[locale]/ai/page.tsx", "utf8"),
		readFile("messages/ai/en.json", "utf8"),
		readFile("messages/ai/fr.json", "utf8"),
		...AI_COMPONENTS.map((path) => readFile(path, "utf8")),
	]);

	assert.match(loader, /AI_LOADERS/);
	assert.match(loader, /\.\.\.ai/);
	assert.match(page, /<AiNativeSections \/>/);
	assert.match(page, /<AiPageGuide \/>/);
	assert.match(page, /PublicHtmlFragment/);

	for (const component of components) {
		assert.doesNotMatch(component, /locale === ["']fr["']/);
		assert.doesNotMatch(component, /const COPY\b/);
		assert.doesNotMatch(component, /\bfr:\s*["'{]/);
	}

	const en = JSON.parse(enRaw) as { ai: unknown };
	const fr = JSON.parse(frRaw) as { ai: unknown };
	assert.deepEqual(leafKeys(en.ai).sort(), leafKeys(fr.ai).sort());
});
