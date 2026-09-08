import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("agent quality gate is executable and wraps the canonical publication gate", async () => {
	const [gate, canonical, fileStat] = await Promise.all([
		source("scripts/agent-quality-gate.sh"),
		source("scripts/quality-gate.sh"),
		stat(new URL("../scripts/agent-quality-gate.sh", import.meta.url)),
	]);

	assert.notEqual(fileStat.mode & 0o100, 0, "agent gate must be executable");
	for (const expected of [
		"QG_BASE_STALE",
		"QG_LARGE_DELETION",
		"QG_EXEC_BIT",
		"npm run lint",
		"npm run lint:css",
		"npx next typegen",
		"npm run typecheck",
		"npm run test:unit",
		"bash scripts/quality-gate.sh --publish",
	]) {
		assert.ok(gate.includes(expected), "missing agent gate contract: " + expected);
	}
	assert.match(canonical, /--publish/);
});

test("repository exposes fix, check and publish commands to agents", async () => {
	const [mise, pkgRaw, prePush] = await Promise.all([
		source("mise.toml"),
		source("package.json"),
		source(".pre-commit-pre-push.yaml"),
	]);
	const pkg = JSON.parse(pkgRaw) as { scripts: Record<string, string> };

	assert.match(mise, /\[tasks\.agent-fix\]/);
	assert.match(mise, /\[tasks\.agent-quality\]/);
	assert.match(mise, /\[tasks\.agent-publish\]/);
	assert.equal(pkg.scripts["quality:agent"], "bash scripts/agent-quality-gate.sh");
	assert.equal(pkg.scripts["quality:agent:fix"], "bash scripts/agent-quality-gate.sh --fix");
	assert.equal(pkg.scripts["quality:agent:publish"], "bash scripts/agent-quality-gate.sh --publish");
	assert.match(prePush, /entry: bash scripts\/agent-quality-gate\.sh --publish/);
});

test("CI runs the same agent gate before the production build without duplicate checks", async () => {
	const ci = await source(".github/workflows/ci.yml");
	const gatePosition = ci.indexOf("Run agent-first quality gate before build");
	const buildPosition = ci.indexOf("Build Next.js production bundle");

	assert.ok(gatePosition >= 0, "CI must run the agent-first gate");
	assert.ok(buildPosition > gatePosition, "build must start only after the agent gate");
	assert.match(ci, /fetch-depth: 0/);
	assert.match(ci, /QUALITY_BASE_REF:/);
	assert.match(ci, /pre-commit==4\.6\.2/);
	assert.doesNotMatch(ci, /- name: Lint JavaScript and TypeScript/);
	assert.doesNotMatch(ci, /- name: Type-check/);
	assert.doesNotMatch(ci, /- name: Run unit tests/);
});

test("Copilot bootstrap can execute the repository agent gate", async () => {
	const setup = await source(".github/workflows/copilot-setup-steps.yml");

	assert.match(setup, /fetch-depth: 0/);
	assert.match(setup, /actions\/setup-python@v6/);
	assert.match(setup, /pre-commit==4\.6\.2/);
	assert.match(setup, /npm ci --no-audit --no-fund/);
});
