import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Quality records warning-only exact-checkout performance baselines", async () => {
	const [workflow, budget, info] = await Promise.all([
		read(".github/workflows/ci.yml"),
		read("scripts/ci-performance-budget.sh"),
		stat(new URL("../scripts/ci-performance-budget.sh", import.meta.url)),
	]);

	assert.notEqual(info.mode & 0o100, 0);
	assert.match(workflow, /id: install/);
	assert.match(workflow, /npm_ci_seconds/);
	assert.match(workflow, /node_modules_mb/);
	assert.match(workflow, /agent_gate_seconds/);
	assert.match(workflow, /id: next-build/);
	assert.match(workflow, /next_build_seconds/);
	assert.match(workflow, /next_mb/);
	assert.match(workflow, /Check CI performance warning budgets/);
	assert.match(workflow, /if: always\(\)/);
	assert.match(workflow, /bash scripts\/ci-performance-budget\.sh/);

	for (const marker of [
		"NPM_CI_WARN_SECONDS",
		"NODE_MODULES_WARN_MB",
		"AGENT_GATE_WARN_SECONDS",
		"NEXT_BUILD_WARN_SECONDS",
		"NEXT_OUTPUT_WARN_MB",
		"CI_PERF_BASELINE schema=1",
		"npm_cache_hit=",
		"next_cache_hit=",
		"npm_ci_s=",
		"agent_gate_s=",
		"next_build_s=",
	]) {
		assert.ok(budget.includes(marker), `missing CI metric contract: ${marker}`);
	}

	assert.match(budget, /quality result remains non-blocking/);
	assert.doesNotMatch(budget, /exit 1/);
	assert.doesNotMatch(workflow, /ci-performance.*upload-artifact/is);
});
