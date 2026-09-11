import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("CI and Copilot bootstrap each use one explicit npm cache authority", async () => {
	const [ci, setup] = await Promise.all([
		source(".github/workflows/ci.yml"),
		source(".github/workflows/copilot-setup-steps.yml"),
	]);

	for (const [label, workflow] of [
		["CI", ci],
		["Copilot", setup],
	] as const) {
		const nodeSetup = workflow.match(
			/(?:- name: Set up Node\.js|- name: Setup Node\.js)[\s\S]*?- name: Restore npm downloads/,
		)?.[0];

		assert.ok(nodeSetup, `${label} Node setup block must be present`);
		assert.match(nodeSetup, /package-manager-cache: false/);
		assert.match(workflow, /path: ~\/\.npm/);
		assert.match(workflow, /actions\/cache\/restore@[0-9a-f]{40}/);
		assert.match(workflow, /actions\/cache\/save@[0-9a-f]{40}/);
	}
});
