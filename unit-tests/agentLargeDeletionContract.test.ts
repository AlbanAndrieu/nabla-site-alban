import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("reviewed homelab split keeps the destructive-diff exception path-scoped", async () => {
	const [gate, ci] = await Promise.all([
		source("scripts/agent-quality-gate.sh"),
		source(".github/workflows/ci.yml"),
	]);

	assert.match(gate, /Reviewed P1 module split/);
	assert.match(gate, /lib\/homelabHealth\.ts\)/);
	assert.match(gate, /lib\/homelabHealthBase\.ts \|/);
	assert.match(gate, /QUALITY_ALLOW_LARGE_DELETION:-0/);
	assert.doesNotMatch(ci, /QUALITY_ALLOW_LARGE_DELETION:\s*["']?1["']?/);
});
