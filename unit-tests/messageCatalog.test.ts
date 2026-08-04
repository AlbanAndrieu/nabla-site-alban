import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Messages = Record<string, unknown>;

async function loadMessages(locale: "en" | "fr"): Promise<Messages> {
	const source = await readFile(
		new URL(`../messages/${locale}.json`, import.meta.url),
		"utf8",
	);

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

test("French and English message catalogs have the same structure", async () => {
	const [english, french] = await Promise.all([
		loadMessages("en"),
		loadMessages("fr"),
	]);

	assert.deepEqual(
		scalarPaths(french).sort(),
		scalarPaths(english).sort(),
	);
});
