import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Copilot bootstrap uses one explicit npm cache authority", async () => {
	const setup = await source(".github/workflows/copilot-setup-steps.yml");
	const nodeSetup = setup.match(
		/- name: Set up Node\.js[\s\S]*?- name: Restore npm downloads/,
	)?.[0];

	assert.ok(nodeSetup, "Node setup block must be present");
	assert.match(nodeSetup, /package-manager-cache: false/);
	assert.match(setup, /path: ~\/\.npm/);
	assert.match(setup, /actions\/cache\/restore@[0-9a-f]{40}/);
	assert.match(setup, /actions\/cache\/save@[0-9a-f]{40}/);
});
