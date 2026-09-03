import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("route header keeps breadcrumb labels local without requesting a missing site message", async () => {
	const source = await readFile(
		new URL("../components/RouteHeader.tsx", import.meta.url),
		"utf8",
	);

	assert.match(source, /breadcrumb: "Breadcrumb"/);
	assert.match(source, /breadcrumb: "Fil d’Ariane"/);
	assert.match(source, /aria-label={labels\.breadcrumb}/);
	assert.doesNotMatch(source, /t\("breadcrumbLabel"\)/);
});
