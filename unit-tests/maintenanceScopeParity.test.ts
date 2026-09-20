import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("maintenance paths stay aligned across local scope, Preview and production baseline", async () => {
	const [scope, workflow, baseline] = await Promise.all([
		read("scripts/ci-scope.sh"),
		read(".github/workflows/ci.yml"),
		read("scripts/verify-production-baseline.sh"),
	]);

	const sharedMaintenancePaths = [
		"scripts/agent-quality-gate.sh",
		"scripts/quality-gate.sh",
		"scripts/ci-scope.sh",
		"scripts/verify-production-baseline.sh",
		"scripts/publish-vercel-preview-checkpoint.sh",
		"scripts/check_code_size.py",
		"scripts/eslint-github-formatter.mjs",
	];

	for (const path of sharedMaintenancePaths) {
		assert.ok(scope.includes(path), `${path} missing from CI scope`);
		assert.ok(
			workflow.includes(`filename === '${path}'`),
			`${path} missing from Preview scope`,
		);
		assert.ok(
			baseline.includes(path),
			`${path} missing from production-baseline scope`,
		);
	}
});
