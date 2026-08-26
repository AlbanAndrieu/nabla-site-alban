import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("TrueNAS page scopes accessible dark-theme contrast overrides", async () => {
	const [page, globals] = await Promise.all([
		readFile("app/[locale]/truenas/page.tsx", "utf8"),
		readFile("app/globals.css", "utf8"),
	]);

	assert.match(page, /page-dark page-truenas/);
	assert.match(globals, /\.page-truenas \{/);
	assert.match(globals, /--truenas-text-secondary: #d7e0ec/);
	assert.match(globals, /--truenas-text-muted: #b9c6d8/);
	assert.match(globals, /\.page-truenas :is\(\.text-secondary, \.text-muted\)/);
	assert.match(globals, /\.page-truenas a:not\(\.btn\)/);
});
