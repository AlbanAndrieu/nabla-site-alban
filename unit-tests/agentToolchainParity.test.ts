import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("agent Python toolchain stays pinned across bootstraps", async () => {
	const [pythonVersion, mise, quality, copilot, recovery] = await Promise.all([
		read(".python-version"),
		read("mise.toml"),
		read(".github/workflows/ci.yml"),
		read(".github/workflows/copilot-setup-steps.yml"),
		read(".github/workflows/post-merge-quality-remediation.yml"),
	]);

	assert.equal(pythonVersion.trim(), "3.12.10");
	assert.match(mise, /default='3\.12\.10'/);
	assert.match(mise, /pre-commit = "4\.6\.2"/);
	const pythonMinor = pythonVersion.trim().split(".").slice(0, 2).join(".");
	assert.equal(pythonMinor, "3.12");

	for (const workflow of [quality, copilot]) {
		assert.ok(workflow.includes(`python-version: "${pythonMinor}"`));
		assert.doesNotMatch(workflow, /python-version-file:/);
		assert.match(workflow, /pre-commit==4\.6\.2/);
		assert.match(workflow, /hashFiles\(/);
		assert.match(workflow, /'\.python-version'/);
	}
	assert.ok(recovery.includes(`python-version: "${pythonMinor}"`));
	assert.doesNotMatch(recovery, /python-version-file:/);
});
