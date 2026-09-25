import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL("../" + path, import.meta.url), "utf8");

test("OpenCode defaults to the repository maintainer without overriding the selected model", async () => {
	const config = JSON.parse(await read("opencode.json")) as {
		default_agent?: string;
		model?: string;
		skills?: string[];
		commands?: Record<string, { agent?: string; template?: string }>;
	};

	assert.equal(config.default_agent, "nabla-maintainer");
	assert.equal(config.model, undefined);
	assert.deepEqual(config.skills, ["./.agents/skills"]);
	for (const command of ["qg-fix", "qg-publish", "roadmap-next"]) {
		assert.equal(config.commands?.[command]?.agent, "nabla-maintainer");
	}
	assert.match(
		config.commands?.["qg-fix"]?.template ?? "",
		/quality-local-first/,
	);
	assert.match(
		config.commands?.["qg-fix"]?.template ?? "",
		/npm run quality:agent:fix/,
	);
	assert.match(
		config.commands?.["qg-publish"]?.template ?? "",
		/npm run quality:agent:publish/,
	);
});

test("OpenCode maintainer and local quality skill delegate to canonical repository policy", async () => {
	const [agent, skill, rules] = await Promise.all([
		read(".opencode/agents/nabla-maintainer.md"),
		read(".agents/skills/quality-local-first/SKILL.md"),
		read("AGENTS.md"),
	]);

	assert.match(agent, /mode: primary/);
	assert.match(agent, /root `AGENTS\.md` as the canonical repository policy/);
	assert.match(agent, /load `quality-local-first`/);
	assert.match(agent, /npm run quality:agent:fix/);
	assert.match(agent, /npm run quality:agent:publish/);
	assert.match(agent, /never write directly to `master`/);

	assert.match(skill, /name: quality-local-first/);
	assert.match(skill, /authority: AGENTS\.md/);
	assert.match(skill, /QG_AUTOFIX_REQUIRED/);
	assert.match(skill, /QG_PRECOMMIT_FAILED/);
	assert.match(skill, /QG_FIX_DID_NOT_CONVERGE/);
	assert.match(skill, /QG_PUBLISH_\*/);
	assert.match(skill, /npm run quality:agent:fix/);
	assert.match(skill, /npm run quality:agent:publish/);

	assert.match(rules, /Small-model \/ OpenCode execution protocol/);
	assert.match(rules, /load \*\*one matching skill first\*\*/);
	assert.match(rules, /selected OpenCode model remains authoritative/);
});
