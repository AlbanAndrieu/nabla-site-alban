import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("optional Snyk gate does not pull a Docker action when no token is configured", async () => {
	const workflow = await readFile(
		new URL("../.github/workflows/ci.yml", import.meta.url),
		"utf8",
	);

	assert.match(workflow, /if: env\.SNYK_TOKEN != ''/);
	assert.match(workflow, /run: npx --yes snyk test/);
	assert.doesNotMatch(workflow, /uses: snyk\/actions\/node@master/);
});
