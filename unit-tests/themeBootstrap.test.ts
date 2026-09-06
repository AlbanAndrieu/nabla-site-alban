import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("locale layout applies the theme before page-specific widget runtimes", async () => {
	const layout = await readFile(
		new URL("../app/[locale]/layout.tsx", import.meta.url),
		"utf8",
	);
	assert.match(layout, /ThemeBootstrap/);
	assert.match(layout, /<ThemeBootstrap \/>/);
});

test("theme bootstrap preserves the legacy preference contract without loading widgets", async () => {
	const source = await readFile(
		new URL("../components/ThemeBootstrap.tsx", import.meta.url),
		"utf8",
	);

	assert.match(source, /site-theme-preference/);
	assert.match(source, /prefers-color-scheme: dark/);
	assert.match(source, /document\.documentElement\.dataset\.theme/);
	assert.doesNotMatch(source, /site-widgets\.js/);
	assert.doesNotMatch(source, /theme-toggle/);
});
