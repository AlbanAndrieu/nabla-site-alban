import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Messages = Record<string, unknown>;
type Locale = "en" | "fr";

const FEATURE_CATALOGS = ["truenas", "homelab"] as const;

async function loadMessages(locale: Locale, feature?: string): Promise<Messages> {
	const path = feature
		? `../messages/${feature}/${locale}.json`
		: `../messages/${locale}.json`;
	const source = await readFile(new URL(path, import.meta.url), "utf8");
	return JSON.parse(source) as Messages;
}

function scalarPaths(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) {
		return [prefix];
	}

	return Object.entries(value).flatMap(([key, child]) =>
		scalarPaths(child, prefix ? `${prefix}.${key}` : key),
	);
}

async function assertLocaleParity(feature?: string) {
	const [english, french] = await Promise.all([
		loadMessages("en", feature),
		loadMessages("fr", feature),
	]);

	assert.deepEqual(
		scalarPaths(french).sort(),
		scalarPaths(english).sort(),
	);
}

test("French and English global message catalogs have the same structure", async () => {
	await assertLocaleParity();
});

for (const feature of FEATURE_CATALOGS) {
	test(`French and English ${feature} feature catalogs have the same structure`, async () => {
		await assertLocaleParity(feature);
	});
}

test("feature catalogs own distinct top-level namespaces", async () => {
	const catalogs = await Promise.all(
		FEATURE_CATALOGS.map((feature) => loadMessages("en", feature)),
	);
	const namespaces = catalogs.flatMap((catalog) => Object.keys(catalog));
	assert.equal(new Set(namespaces).size, namespaces.length);
	assert.deepEqual(namespaces.sort(), ["homelab", "truenas"]);
});

test("runtime i18n loader retires the legacy TrueNAS namespace", async () => {
	const source = await readFile(
		new URL("../i18n/messages.ts", import.meta.url),
		"utf8",
	);

	assert.match(source, /LEGACY_FEATURE_NAMESPACES[^\n]+truenasPage/);
	assert.match(source, /messages\/truenas/);
	assert.match(source, /messages\/homelab/);
	assert.match(source, /assertUniqueTopLevelNamespaces/);
});

test("migrated pages no longer consume legacy TrueNAS namespaces", async () => {
	for (const page of ["truenas", "nabla"]) {
		const source = await readFile(
			new URL(`../app/[locale]/${page}/page.tsx`, import.meta.url),
			"utf8",
		);
		assert.doesNotMatch(source, /truenasPage|truenasUpgrades/);
	}
});

test("TrueNAS presentation components do not embed locale dictionaries", async () => {
	for (const component of [
		"FastPoolPlan.tsx",
		"GpuUpgradePlan.tsx",
		"HardwareSection.tsx",
		"HeroSection.tsx",
		"HomeLabSection.tsx",
		"InferenceModelSummary.tsx",
		"ToolsSection.tsx",
	]) {
		const source = await readFile(
			new URL(`../app/components/truenas/${component}`, import.meta.url),
			"utf8",
		);
		assert.doesNotMatch(source, /const\s+COPY\s*=|\bfr:\s*\{|\ben:\s*\{/);
	}
});
