import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("reviewed privacy and module splits keep large deletion exceptions path-scoped", async () => {
	const [gate, ci] = await Promise.all([
		readFile(
			new URL("../scripts/lib/agent-quality-guards.sh", import.meta.url),
			"utf8",
		),
		readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
	]);
	assert.match(gate, /Reviewed module splits/);
	assert.match(gate, /scripts\/verify-master-baseline\.sh/);
	assert.match(gate, /lib\/homelabObservability\.ts/);
	assert.match(gate, /lib\/homelabHealthBase\.ts/);
	for (const path of [
		"public/freenas.html",
		"public/locales/fr/freenas.html",
		"public/homelab-services.json",
		"public/service-topology.json",
	]) {
		assert.ok(gate.includes(path), `missing reviewed P0 exception: ${path}`);
	}
	assert.match(gate, /QUALITY_ALLOW_LARGE_DELETION:-0/);
	assert.doesNotMatch(ci, /QUALITY_ALLOW_LARGE_DELETION:\s*["']?1["']?/);
});
