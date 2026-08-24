import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Messages = Record<string, unknown>;

type Locale = "en" | "fr";

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

test("French and English TrueNAS feature catalogs have the same structure", async () => {
	await assertLocaleParity("truenas");
});

test("TrueNAS presentation components do not embed locale dictionaries", async () => {
	for (const component of ["FastPoolPlan.tsx", "GpuUpgradePlan.tsx", "InferenceModelSummary.tsx"]) {
		const source = await readFile(
			new URL(`../app/components/truenas/${component}`, import.meta.url),
			"utf8",
		);
		assert.doesNotMatch(source, /const\s+COPY\s*=|\bfr:\s*\{|\ben:\s*\{/);
	}
});
