import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
	CLIENT_MESSAGE_NAMESPACES,
	loadMessages,
	pickClientMessages,
} from "../i18n/messages";

const SOURCE_ROOTS = ["app", "components", "lib"];

async function sourceFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) return sourceFiles(fullPath);
			return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
		}),
	);
	return nested.flat();
}

test("client components only read namespaces serialized by the locale layout", async () => {
	const files = (await Promise.all(SOURCE_ROOTS.map(sourceFiles))).flat();
	const allowed = new Set<string>(CLIENT_MESSAGE_NAMESPACES);
	const violations: string[] = [];
	for (const file of files) {
		const source = await readFile(file, "utf8");
		if (!/^["']use client["'];?/.test(source)) continue;
		for (const match of source.matchAll(
			/\buse(?:Translations|Messages)\(\s*(?:"([^"]*)")?\s*\)/g,
		)) {
			const root = match[1]?.split(".", 1)[0];
			if (!root || !allowed.has(root)) {
				violations.push(`${file}: ${match[0]}`);
			}
		}
	}
	assert.deepEqual(violations, []);
});

test("layout serializes only the client namespaces, not the full catalog", async () => {
	const layout = await readFile("app/[locale]/layout.tsx", "utf8");
	assert.match(layout, /messages=\{pickClientMessages\(messages\)\}/);

	for (const locale of ["en", "fr"] as const) {
		const messages = await loadMessages(locale);
		const picked = pickClientMessages(messages);
		assert.deepEqual(Object.keys(picked), [...CLIENT_MESSAGE_NAMESPACES]);
		assert.ok(JSON.stringify(picked).length < JSON.stringify(messages).length);
	}
});
