import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const securityPagePath = new URL(
	"../app/[locale]/security/page.tsx",
	import.meta.url,
);
const arfComponentPath = new URL(
	"../app/[locale]/security/SecurityArfTree.tsx",
	import.meta.url,
);
const visualizationsPath = new URL(
	"../app/[locale]/security/SecurityVisualizations.tsx",
	import.meta.url,
);

test("security page no longer loads the legacy D3 v3 ARF runtime", async () => {
	const page = await readFile(securityPagePath, "utf8");

	assert.doesNotMatch(page, /d3\/3\.5\.17/);
	assert.doesNotMatch(page, /arf\.js/);
	assert.match(page, /SecurityVisualizations/);
});

test("security ARF tree keeps arf.json as data-only input without a legacy portal", async () => {
	const component = await readFile(arfComponentPath, "utf8");

	assert.match(component, /fetch\("\/arf\.json"/);
	assert.doesNotMatch(component, /createPortal/);
	assert.doesNotMatch(component, /arf-viz-body/);
	assert.match(component, /<details/);
});

test("security visualizations own their native markup", async () => {
	const page = await readFile(securityPagePath, "utf8");
	const visualizations = await readFile(visualizationsPath, "utf8");

	assert.match(page, /"security-visualizations"/);
	assert.match(page, /<SecurityVisualizations locale=\{locale\}/);
	assert.match(visualizations, /id="security-visualizations"/);
	assert.match(visualizations, /<SecurityArfTree locale=\{locale\}/);
	assert.match(visualizations, /Kali Linux/);
});
