import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

test("agent policy reuses a PR, rebases conflicts and publishes one batch", () => {
	const main = source("../AGENTS.md");
	const details = source("../docs/agent-policy-details.md");
	const skill = source("../.agents/skills/local-first-quality/SKILL.md");
	for (const marker of [
		"synchronize the selected PR",
		"Batch publication",
		"production",
		"No auto-merge",
	])
		assert.ok(main.includes(marker), marker);
	for (const marker of [
		"git rebase origin/master",
		"agent-pr-guard",
		"force-push is",
		"completed",
		"[skip ci]",
	]) {
		assert.ok(details.includes(marker), marker);
	}
	assert.match(skill, /Existing PR first and no micro-push/);
	assert.match(skill, /strict L3 gate/);
});
