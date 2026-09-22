import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

test("critical quality, performance and Preview shell entrypoints remain executable", async () => {
	const scripts = [
		"scripts/quality-gate.sh",
		"scripts/agent-quality-gate.sh",
		"scripts/ci-scope.sh",
		"scripts/ci-performance-budget.sh",
		"scripts/verify-production-baseline.sh",
		"scripts/publish-vercel-preview-checkpoint.sh",
	] as const;
	const stats = await Promise.all(
		scripts.map((path) => stat(new URL(`../${path}`, import.meta.url))),
	);

	for (const [index, fileStat] of stats.entries()) {
		assert.notEqual(
			fileStat.mode & 0o100,
			0,
			`${scripts[index]} must remain executable`,
		);
	}
});
