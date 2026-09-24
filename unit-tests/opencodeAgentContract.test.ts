import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string) =>
	readFile(path.join(ROOT, relativePath), "utf8");

test("OpenCode build agent stays model-agnostic and deterministic", async () => {
	const config = JSON.parse(await read("opencode.json"));
	const build = config.agent?.build;

	assert.ok(build);
	assert.equal("model" in build, false);
	assert.equal(build.temperature, 0.1);
	assert.ok(build.steps >= 32);
	assert.equal(
		build.prompt,
		"{file:./.opencode/prompts/repository-build.txt}",
	);
	assert.equal(config.permission?.skill?.["*"], "allow");
});

test("OpenCode allows local quality work but protects master publication", async () => {
	const config = JSON.parse(await read("opencode.json"));
	const bash = config.permission?.bash;

	assert.equal(bash["npm run quality:agent:fix*"], "allow");
	assert.equal(bash["npm run quality:agent:publish*"], "allow");
	assert.equal(bash["git push *"], "ask");
	assert.equal(bash["git push *master*"], "deny");
	assert.equal(bash["git push *--force*"], "deny");
	assert.equal(bash["git switch master*"], "deny");
	assert.equal(bash["git checkout master*"], "deny");
});

test("OpenCode prompt routes small-model work through repository skills and scripts", async () => {
	const prompt = await read(".opencode/prompts/repository-build.txt");

	assert.match(prompt, /AGENTS\.md/);
	assert.match(prompt, /nabla-maintenance/);
	assert.match(prompt, /nabla-quality/);
	assert.match(prompt, /nabla-pr/);
	assert.match(prompt, /quality:agent:fix/);
	assert.match(prompt, /quality:agent:publish/);
	assert.match(prompt, /never push or edit `master`/);
});

test("repository OpenCode skills expose focused maintenance workflows", async () => {
	const expected = new Map([
		["nabla-maintenance", ["docs/quality-roadmap.md", "nabla-quality", "nabla-pr"]],
		["nabla-quality", ["quality:agent:fix", "quality:agent:publish", "--status"]],
		["nabla-pr", ["current GitHub pull request", "exact HEAD SHA", "Do not merge"]],
	]);

	for (const [name, markers] of expected) {
		const skill = await read(`.agents/skills/${name}/SKILL.md`);
		assert.match(skill, new RegExp(`^---\\nname: ${name}\\n`));
		assert.match(skill, /description: .+/);
		for (const marker of markers) {
			assert.ok(skill.includes(marker), `${name}: ${marker}`);
		}
	}
});
