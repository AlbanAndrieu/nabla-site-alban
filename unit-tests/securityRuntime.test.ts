import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const securityPagePath = new URL("../app/[locale]/security/page.tsx", import.meta.url);
const arfComponentPath = new URL(
	"../app/[locale]/security/SecurityArfTree.tsx",
	import.meta.url,
);

test("security page no longer loads the legacy D3 v3 ARF runtime", async () => {
	const page = await readFile(securityPagePath, "utf8");

	assert.doesNotMatch(page, /d3\/3\.5\.17/);
	assert.doesNotMatch(page, /arf\.js/);
	assert.match(page, /SecurityArfTree/);
});

test("security ARF tree keeps arf.json as data-only input", async () => {
	const component = await readFile(arfComponentPath, "utf8");

	assert.match(component, /fetch\("\/arf\.json"/);
	assert.match(component, /createPortal/);
	assert.match(component, /<details/);
});
