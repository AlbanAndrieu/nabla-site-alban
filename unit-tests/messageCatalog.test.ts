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

test("the French Nabla catalog matches the English message structure", async () => {
	const [english, french] = await Promise.all([
		loadMessages("en"),
		loadMessages("fr"),
	]);

	assert.ok(english.nabla, "English Nabla messages are missing");
	assert.ok(french.nabla, "French Nabla messages are missing");
	assert.deepEqual(
		scalarPaths(french.nabla).sort(),
		scalarPaths(english.nabla).sort(),
	);
});
