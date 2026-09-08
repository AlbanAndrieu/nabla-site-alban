import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("agent Python toolchain stays pinned across bootstraps", async () => {
	const [pythonVersion, mise, quality, copilot] = await Promise.all([
		read(".python-version"),
		read("mise.toml"),
		read(".github/workflows/ci.yml"),
		read(".github/workflows/copilot-setup-steps.yml"),
	]);

	assert.equal(pythonVersion.trim(), "3.13");
	assert.match(mise, /default='3\.13'/);
	assert.match(mise, /pre-commit = "4\.6\.2"/);

	for (const workflow of [quality, copilot]) {
		assert.match(workflow, /python-version-file:\s*"\.python-version"/);
		assert.match(workflow, /pre-commit==4\.6\.2/);
		assert.match(workflow, /hashFiles\(/);
		assert.match(workflow, /'\.python-version'/);
	}
});
