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

test("repository exposes local fix, check and reusable strict publication commands", async () => {
	const [mise, pkgRaw, prePush, publish] = await Promise.all([
		source("mise.toml"),
		source("package.json"),
		source(".pre-commit-pre-push.yaml"),
		source("scripts/agent-publish.sh"),
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
		"bash scripts/agent-publish.sh",
	);
	assert.match(pkg.scripts["lint:fix"], /eslint --fix/);
	assert.match(pkg.scripts["lint:css:fix"], /stylelint --fix/);
	assert.match(mise, /run = "bash scripts\/agent-publish\.sh"/);
	assert.match(prePush, /entry: bash scripts\/agent-publish\.sh/);
	assert.match(publish, /agent-quality-gate\.sh --publish/);
	assert.match(publish, /QG_PUBLISH_PROOF_REUSED/);
	assert.match(publish, /QG_PUBLISH_DIRTY/);
	assert.match(publish, /git rev-parse --git-path agent-publication-proof/);
});

test("local fix phase converges formatter and npm lint fixes before publication", async () => {
	const gate = await source("scripts/agent-quality-gate.sh");

	assert.match(gate, /QUALITY_FIX_PASSES:-12/);
	assert.match(gate, /precommit_fix_until_stable/);
	assert.match(gate, /for \(\(pass = 1; pass <= FIX_PASSES; pass\+\+\)\)/);
	assert.match(
		gate,
		/applied deterministic fixes; retrying without log analysis/,
	);
	assert.match(gate, /npm run lint:fix/);
	assert.match(gate, /npm run lint:css:fix/);
	assert.match(gate, /QG_FIX_DID_NOT_CONVERGE/);
	assert.match(gate, /QG_PRECOMMIT_FAILED/);
});

test("canonical quality gate distinguishes auto-fix mutations from semantic failures", async () => {
	const canonical = await source("scripts/quality-gate.sh");

	assert.match(canonical, /QUALITY_LOG_TAIL:-40/);
	assert.match(canonical, /QG_AUTOFIX_REQUIRED/);
	assert.match(canonical, /QG_PRECOMMIT_FAILED/);
	assert.match(canonical, /No CI-log analysis is required for this condition/);
	assert.match(canonical, /--fail-fast/);
	assert.match(canonical, /QUALITY_SHOW_DIFF:-0/);
	assert.doesNotMatch(
		canonical,
		/pre-commit run[\s\S]*--show-diff-on-failure[\s\S]*QG_AUTOFIX_REQUIRED/,
	);
});

test("CI rejects formatting before expensive work and scopes application SAST/build conservatively", async () => {
	const ci = await source(".github/workflows/ci.yml");
	const scopePosition = ci.indexOf("Classify CI change scope");
	const canonicalPosition = ci.indexOf(
		"Run canonical changed-file quality gate before SAST/npm bootstrap",
	);
	const canonicalEnforcementPosition = ci.indexOf(
		"Enforce canonical changed-file quality gate",
	);
	const semgrepPosition = ci.indexOf("Run Semgrep SAST on changed source");
	const setupNodePosition = ci.indexOf("Setup Node.js");
	const npmInstallPosition = ci.indexOf("Install dependencies");
	const gatePosition = ci.indexOf("Run agent-first quality gate before build");
	const gateEnforcementPosition = ci.indexOf(
		"Enforce agent-first quality gate",
	);
	const buildPosition = ci.indexOf("Build Next.js production bundle");

	assert.ok(scopePosition >= 0, "CI must classify changed-file scope");
	assert.ok(canonicalPosition >= 0, "CI must run the canonical gate early");
	assert.ok(
		canonicalEnforcementPosition > canonicalPosition,
		"early canonical gate must be enforced",
	);
	assert.ok(
		semgrepPosition > canonicalEnforcementPosition,
		"SAST must not consume resources for formatter-only failures",
	);
	assert.ok(
		setupNodePosition > canonicalEnforcementPosition,
		"Node setup must not run for formatter-only failures",
	);
	assert.ok(
		npmInstallPosition > canonicalEnforcementPosition,
		"npm bootstrap must not run for formatter-only failures",
	);
	assert.ok(
		gatePosition > npmInstallPosition,
		"application gate requires npm deps",
	);
	assert.ok(
		gateEnforcementPosition > gatePosition,
		"agent gate must be enforced before build",
	);
	assert.ok(
		buildPosition > gateEnforcementPosition,
		"build must start only after the agent gate is enforced",
	);
	assert.match(ci, /id: ci-scope/);
	assert.match(ci, /bash scripts\/ci-scope\.sh/);
	assert.match(ci, /steps\.ci-scope\.outputs\.sast == 'true'/);
	assert.match(ci, /steps\.ci-scope\.outputs\.build == 'true'/);
	assert.match(ci, /QUALITY_CANONICAL_GATE_VERIFIED: "1"/);
	assert.match(ci, /QUALITY_LOG_TAIL: "40"/);
	assert.match(
		ci,
		/- name: Restore pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Save pre-commit environments[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Restore npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/restore@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(
		ci,
		/- name: Save npm downloads[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/cache\/save@[0-9a-f]{40}\s+# v5/,
	);
	assert.match(ci, /steps\.canonical-quality-gate\.outcome != 'success'/);
	assert.match(ci, /steps\.agent-quality-gate\.outcome != 'success'/);
	assert.doesNotMatch(ci, /cache-primary-key/);
	assert.match(ci, /fetch-depth: 0/);
	assert.match(ci, /QUALITY_BASE_REF:/);
	assert.match(ci, /github\.event\.before/);
	assert.match(ci, /persist-credentials: false/);
	assert.match(ci, /pre-commit==4\.6\.2/);
	assert.match(ci, /package-manager-cache: false/);
	assert.doesNotMatch(ci, /- name: Lint JavaScript and TypeScript/);
	assert.doesNotMatch(ci, /- name: Type-check/);
	assert.doesNotMatch(ci, /- name: Run unit tests/);
});

test("successful Semgrep results use Code Scanning without storing a duplicate artifact", async () => {
	const ci = await source(".github/workflows/ci.yml");

	assert.match(ci, /Upload Semgrep SARIF to GitHub Code Scanning/);
	assert.match(ci, /Preserve failed Semgrep SAST report/);
	assert.match(
		ci,
		/steps\.semgrep-sast\.outcome != 'success' && hashFiles\('semgrep\.sarif'\) != ''/,
	);
});

test("Copilot bootstrap installs repository hooks before the agent starts", async () => {
	const setup = await source(".github/workflows/copilot-setup-steps.yml");

	assert.match(setup, /fetch-depth: 0/);
	assert.match(setup, /persist-credentials: false/);
	assert.match(setup, /actions\/setup-python@[0-9a-f]{40}\s+# v6/);
	assert.match(setup, /pre-commit==4\.6\.2/);
	assert.match(setup, /pre-commit install-hooks/);
	assert.match(
		setup,
		/pre-commit install --hook-type pre-commit --hook-type commit-msg/,
	);
	assert.match(
		setup,
		/pre-commit install --config \.pre-commit-pre-push\.yaml --hook-type pre-push/,
	);
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
		".pre-commit-pre-push.yaml",
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
