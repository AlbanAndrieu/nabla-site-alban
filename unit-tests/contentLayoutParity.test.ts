import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared content layout and surface stay aligned with Bababou primitives", async () => {
	const [layout, surface, policy] = await Promise.all([
		source("components/ui/ContentLayout.module.css"),
		source("components/ui/Surface.module.css"),
		source("app/[locale]/policy/page.tsx"),
	]);

	for (const token of [
		"--ui-space-lg",
		"--ui-space-xl",
		"--ui-text-primary",
		"--ui-text-secondary",
	]) {
		assert.match(layout, new RegExp(token));
	}
	assert.match(layout, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
	assert.match(layout, /@media \(max-width:\s*900px\)/);
	assert.match(layout, /@media \(max-width:\s*575\.98px\)/);
	assert.match(layout, /overflow-wrap:\s*anywhere/);

	for (const token of [
		"--ui-border",
		"--ui-radius-card",
		"--ui-surface-card",
		"--ui-shadow-sm",
	]) {
		assert.match(surface, new RegExp(token));
	}
	assert.match(surface, /@media \(max-width:\s*760px\)/);

	assert.match(policy, /@\/components\/ui\/Container/);
	assert.match(policy, /@\/components\/ui\/ContentLayout\.module\.css/);
	assert.match(policy, /@\/components\/ui\/Surface\.module\.css/);
	assert.match(policy, /className=\{layout\.twoColumnGrid\}/);
	assert.match(policy, /className=\{surface\.card\}/);
	assert.doesNotMatch(policy, /container py-5/);
});
