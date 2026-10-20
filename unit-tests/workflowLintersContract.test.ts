import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pre-commit runs pinned actionlint and offline zizmor on GitHub Actions files", async () => {
	const config = await read(".pre-commit-config.yaml");

	assert.match(
		config,
		/repo: https:\/\/github\.com\/rhysd\/actionlint\n\s+rev: v\d+\.\d+\.\d+\n\s+hooks:\n\s+-\s+id: actionlint\n/,
	);
	assert.match(
		config,
		/repo: https:\/\/github\.com\/zizmorcore\/zizmor-pre-commit\n\s+rev: v\d+\.\d+\.\d+\n\s+hooks:\n\s+-\s+id: zizmor\n/,
	);
	assert.match(config, /id: zizmor[\s\S]*?args: \["--offline"\]/);
	assert.match(config, /id: zizmor[\s\S]*?files: \^\\\.github\/\(workflows/);
});

test("CI audits every workflow with actionlint and zizmor and fails closed", async () => {
	const ci = await read(".github/workflows/ci.yml");

	assert.match(ci, /pre-commit run actionlint --all-files/);
	assert.match(ci, /pre-commit run zizmor --all-files/);
	assert.match(ci, /id: workflow-audit/);
	assert.match(
		ci,
		/if: steps\.workflow-audit\.outcome != 'success'\n\s+run: exit 1/,
	);
	// The audit runs before the cache save so its hook environments are cached.
	assert.ok(
		ci.indexOf("id: workflow-audit") <
			ci.indexOf("name: Save pre-commit environments"),
	);
});

test("intentional zizmor exceptions carry an adjacent justification", async () => {
	for (const workflow of [
		"ci-policy.yml",
		"post-merge-quality-remediation.yml",
		"release.yml",
		"ci.yml",
		"vercel-preview.yml",
		"mega-linter.yml",
	]) {
		const source = await read(`.github/workflows/${workflow}`);
		const lines = source.split("\n");
		const ignores = lines.flatMap((line, index) =>
			/# zizmor: ignore\[/.test(line) ? [index] : [],
		);
		assert.ok(ignores.length > 0, `${workflow} lost its reviewed exception`);
		for (const index of ignores) {
			assert.match(
				lines[index - 1] ?? "",
				/^\s*# \S/,
				`${workflow}:${index + 1} zizmor ignore needs a justification comment`,
			);
		}
	}
});
