import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("standalone runtime retains node but removes npm-only attack surface", async () => {
	const dockerfile = await readFile(
		new URL("../Dockerfile", import.meta.url),
		"utf8",
	);
	const builder = dockerfile.indexOf("FROM ${NODE_IMAGE} AS builder");
	const runtime = dockerfile.indexOf("FROM ${NODE_IMAGE} AS runtime");
	const runtimeLayer = dockerfile.slice(runtime);
	assert.ok(builder >= 0 && runtime > builder);
	assert.match(dockerfile.slice(0, runtime), /npm ci --no-audit --no-fund/);
	assert.match(runtimeLayer, /rm -rf \/usr\/local\/lib\/node_modules\/npm/);
	assert.match(
		runtimeLayer,
		/rm -f \/usr\/local\/bin\/npm \/usr\/local\/bin\/npx/,
	);
	assert.match(runtimeLayer, /USER 10001:10001/);
	assert.match(runtimeLayer, /CMD \["node", "server\.js"\]/);
	assert.doesNotMatch(runtimeLayer, /npm (?:ci|install|run|start)/);
});
