import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path: string) {
	return readFile(new URL(path, root), "utf8");
}

test("Betterleaks is the pinned canonical pre-commit secrets detector", async () => {
	const [hooks, config, megaLinter] = await Promise.all([
		read(".pre-commit-config.yaml"),
		read(".betterleaks.toml"),
		read(".mega-linter.yml"),
	]);
	assert.match(hooks, /repo: https:\/\/github\.com\/betterleaks\/betterleaks/);
	assert.match(hooks, /rev: v1\.9\.0/);
	assert.match(hooks, /id: betterleaks/);
	assert.match(
		hooks,
		/entry: betterleaks dir --redact --config \.betterleaks\.toml/,
	);
	assert.match(hooks, /pass_filenames: true/);
	assert.doesNotMatch(
		hooks,
		/repo: https:\/\/github\.com\/zricethezav\/gitleaks/,
	);
	assert.match(config, /betterleaksMinVersion = "v1\.9\.0"/);
	assert.match(config, /useDefault = true/);
	assert.match(megaLinter, /- REPOSITORY_GITLEAKS/);
	assert.match(megaLinter, /REPOSITORY_SECRETLINT_DISABLE_ERRORS: false/);
});

test("Just keeps the original Makefile and delegates to existing quality gates", async () => {
	const [just, make, mise] = await Promise.all([
		read("justfile"),
		read("Makefile"),
		read("mise.toml"),
	]);
	assert.match(mise, /just = "1\.58\.0"/);
	assert.match(just, /quality:\n\s+npm run quality:agent\n/);
	assert.match(just, /quality-fix:\n\s+npm run quality:agent:fix\n/);
	assert.match(just, /publish:\n\s+npm run quality:agent:publish\n/);
	assert.match(
		just,
		/secrets:\n\s+betterleaks dir \. --config \.betterleaks\.toml --redact\n/,
	);
	assert.match(
		just,
		/secrets-history:\n\s+betterleaks git \. --config \.betterleaks\.toml --redact\n/,
	);
	assert.match(make, /\.DEFAULT_GOAL = build/);
	assert.match(make, /^build: build-pdf$/m);
});

test("Dagger PoC is pinned, measurable and explicitly non-blocking", async () => {
	const [daggerConfig, workflow, just, mise] = await Promise.all([
		read("dagger.json"),
		read(".github/workflows/dagger-poc.yml"),
		read("justfile"),
		read("mise.toml"),
	]);
	assert.match(daggerConfig, /"engineVersion": "v0\.21\.10"/);
	assert.match(mise, /dagger = "0\.21\.10"/);
	assert.match(mise, /hyperfine = "1\.21\.0"/);
	assert.match(workflow, /continue-on-error: true/);
	assert.match(
		workflow,
		/f9ee083767dd12cdac583f9db3fedbebbbb3064f69152998be1f121d1a6cc103/,
	);
	assert.match(workflow, /dagger call check --source=\./);
	assert.match(
		workflow,
		/ref: \${{ github\.event\.pull_request\.head\.sha \|\| github\.sha }}/,
	);
	assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$\{source_sha\}"/);
	assert.match(workflow, /git archive --format=tar\.gz/);
	assert.match(
		workflow,
		/actions\/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f/,
	);
	assert.match(workflow, /retention-days: 1/);
	assert.match(
		await read("biome.json"),
		/\.dagger\/\*\*\/\*\.ts[\s\S]*unsafeParameterDecoratorsEnabled": true/,
	);
	assert.match(
		await read(".dagger/src/index.ts"),
		/@argument\(\{ defaultPath: "\/", ignore: SOURCE_IGNORE \}\)/,
	);
	assert.match(just, /dagger-check:\n\s+dagger call check --source=\./);
	assert.match(just, /bench-dev-loop:/);
});
