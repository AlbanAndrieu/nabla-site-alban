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
		assert.ok(
			gate.includes(expected),
			"missing agent gate contract: " + expected,
		);
	}
	assert.match(canonical, /--publish/);
	assert.match(gate, /public\/assets\/fontawesome-free-7\.1\.0-web\/\*/);
	assert.match(gate, /public\/assets\/fontawesome\/\*/);
	for (const retired of [
		"ArchitectureExplorer.tsx",
		"ArchitectureExplorer.module.css",
		"HomeLabNetworkFlow.module.css",
		"lib/resourcePages.ts",
	]) {
		assert.ok(
			gate.includes(retired),
			`missing reviewed retirement: ${retired}`,
		);
	}
	assert.doesNotMatch(gate, /package-lock\.json \| public\/assets\/\*\)/);
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
	assert.equal(
		pkg.scripts["quality:agent"],
		"bash scripts/agent-quality-gate.sh",
	);
	assert.equal(
		pkg.scripts["quality:agent:fix"],
		"bash scripts/agent-quality-gate.sh --fix",
	);
	assert.equal(
		pkg.scripts["quality:agent:publish"],
		"bash scripts/agent-quality-gate.sh --publish",
	);
	assert.match(
		prePush,
		/entry: bash scripts\/agent-quality-gate\.sh --publish/,
	);
});

test("CI runs the same agent gate before the production build without duplicate checks", async () => {
	const ci = await source(".github/workflows/ci.yml");
	const gatePosition = ci.indexOf("Run agent-first quality gate before build");
	const preCommitSavePosition = ci.indexOf("Save pre-commit environments");
	const gateEnforcementPosition = ci.indexOf(
		"Enforce agent-first quality gate",
	);
	const buildPosition = ci.indexOf("Build Next.js production bundle");

	assert.ok(gatePosition >= 0, "CI must run the agent-first gate");
	assert.ok(
		preCommitSavePosition > gatePosition,
		"pre-commit cache must be saved after the gate populates hook environments",
	);
	assert.ok(
		gateEnforcementPosition > preCommitSavePosition,
		"gate failure must be enforced only after pre-commit cache persistence",
	);
	assert.ok(
		buildPosition > gateEnforcementPosition,
		"build must start only after the agent gate is enforced",
	);
	assert.match(
		ci,
		/- name: Restore pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Restore npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Save pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Save npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(ci, /steps\.agent-quality-gate\.outcome != 'success'/);
	assert.doesNotMatch(ci, /cache-primary-key/);
	assert.match(ci, /fetch-depth: 0/);
	assert.match(ci, /QUALITY_BASE_REF:/);
	assert.match(ci, /github\.event\.before/);
	assert.match(ci, /persist-credentials: false/);
	assert.match(ci, /pre-commit==4\.6\.2/);
	assert.doesNotMatch(ci, /- name: Lint JavaScript and TypeScript/);
	assert.doesNotMatch(ci, /- name: Type-check/);
	assert.doesNotMatch(ci, /- name: Run unit tests/);
});

test("Copilot bootstrap can execute the repository agent gate", async () => {
	const setup = await source(".github/workflows/copilot-setup-steps.yml");

	assert.match(setup, /fetch-depth: 0/);
	assert.match(setup, /persist-credentials: false/);
	assert.match(setup, /actions\/setup-python@[0-9a-f]{40}\s+# v6/);
	assert.match(setup, /pre-commit==4\.6\.2/);
	assert.match(setup, /pre-commit install-hooks/);
	assert.match(
		setup,
		/- name: Restore pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		setup,
		/- name: Save pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		setup,
		/- name: Restore npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		setup,
		/- name: Save npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(setup, /npm ci --no-audit --no-fund/);
});

test("local agent toolchain matches CI bootstrap pins", async () => {
	const [mise, pythonVersion, nvmrc, ci, setup] = await Promise.all([
		source("mise.toml"),
		source(".python-version"),
		source(".nvmrc"),
		source(".github/workflows/ci.yml"),
		source(".github/workflows/copilot-setup-steps.yml"),
	]);

	assert.equal(pythonVersion.trim(), "3.13");
	assert.equal(nvmrc.trim(), "25.9.0");
	assert.ok(mise.includes('node = "25.9.0"'));
	assert.ok(mise.includes("default='3.13'"));
	assert.ok(mise.includes('pre-commit = "4.6.2"'));
	for (const workflow of [ci, setup]) {
		assert.ok(workflow.includes('python-version-file: ".python-version"'));
		assert.ok(!workflow.includes('python-version: "3.13"'));
		assert.ok(workflow.includes("pre-commit==4.6.2"));
		assert.ok(
			workflow.includes(
				"hashFiles('.pre-commit-config.yaml', '.python-version')",
			),
		);
	}
	assert.ok(ci.includes('- ".python-version"'));
	for (const bootstrapInput of [
		".python-version",
		".nvmrc",
		"package.json",
		"package-lock.json",
		".pre-commit-config.yaml",
	]) {
		assert.ok(
			setup.includes("- " + bootstrapInput),
			"Copilot setup trigger must include " + bootstrapInput,
		);
	}
});

test("pre-commit validation is deterministic and does not mutate hook revisions", async () => {
	const config = await source(".pre-commit-config.yaml");

	assert.doesNotMatch(config, /pre-commit-update/);
	assert.match(config, /autoupdate_schedule: monthly/);
});
