import assert from "node:assert/strict";
import {
	existsSync,
	lstatSync,
	readdirSync,
	readFileSync,
	realpathSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const shared = join(root, ".agents/skills");
const claude = join(root, ".claude/skills");
const skills = readdirSync(shared).filter((name) =>
	lstatSync(join(shared, name)).isDirectory(),
);

function frontmatter(source) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n/);
	return match ? match[1] : null;
}

test("every shared skill is discoverable by Codex (name + description frontmatter)", () => {
	assert.ok(skills.length > 0);
	for (const name of skills) {
		const file = join(shared, name, "SKILL.md");
		assert.ok(existsSync(file), `${name}: missing SKILL.md`);
		const meta = frontmatter(readFileSync(file, "utf8"));
		assert.ok(meta, `${name}: missing YAML frontmatter`);
		assert.match(meta, new RegExp(`^name:\\s*${name}\\s*$`, "m"), name);
		assert.match(meta, /^description:\s*\S/m, `${name}: missing description`);
	}
});

test("every shared skill is exposed to Claude through a symlink, never a copy", () => {
	for (const name of skills) {
		const link = join(claude, name);
		assert.ok(existsSync(link), `${name}: missing .claude/skills link`);
		assert.ok(lstatSync(link).isSymbolicLink(), `${name}: must be a symlink`);
		assert.equal(realpathSync(link), realpathSync(join(shared, name)), name);
	}
	for (const name of readdirSync(claude)) {
		assert.ok(
			skills.includes(name),
			`${name}: Claude-only skill must live in .agents/skills`,
		);
	}
});

test("Claude and Codex read the same canonical agent policy", () => {
	assert.equal(
		readFileSync(join(root, "CLAUDE.md"), "utf8").trim(),
		"@AGENTS.md",
	);
	const policy = readFileSync(join(root, "AGENTS.md"), "utf8");
	assert.match(policy, /## Claude and Codex/);
	assert.match(policy, /one `git worktree` per agent/);
	assert.ok(
		Buffer.byteLength(policy) < 9000,
		"AGENTS.md exceeds the shared context budget",
	);
});
