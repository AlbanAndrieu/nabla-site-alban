import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("npm Stylelint 17 is the single CSS lint authority over maintained stylesheets", async () => {
	const [pkgRaw, config, preCommitConfig] = await Promise.all([
		source("package.json"),
		source("stylelint.config.cjs"),
		source(".pre-commit-config.yaml"),
	]);
	const pkg = JSON.parse(pkgRaw) as {
		scripts: Record<string, string>;
		devDependencies: Record<string, string>;
	};

	assert.equal(pkg.devDependencies.stylelint, "^17.14.1");
	assert.equal(
		pkg.scripts["lint:css"],
		'stylelint "app/**/*.css" "components/**/*.css" "public/*.css"',
	);
	assert.equal(
		pkg.scripts["lint:css:fix"],
		'stylelint --fix "app/**/*.css" "components/**/*.css" "public/*.css"',
	);
	for (const maintainedScope of [
		"app/**/*.css",
		"components/**/*.css",
		"public/*.css",
	]) {
		assert.ok(
			pkg.scripts["lint:css"].includes(maintainedScope),
			`Stylelint must cover ${maintainedScope}`,
		);
	}
	assert.match(config, /"public\/assets\/\*\*\/\*\.css"/);
	assert.match(config, /"\.next\/\*\*\/\*"/);
	assert.match(config, /"dist\/\*\*\/\*"/);
	assert.doesNotMatch(preCommitConfig, /pre-commit-stylelint/);
	assert.doesNotMatch(preCommitConfig, /stylelint@14\.4\.0/);
	assert.doesNotMatch(preCommitConfig, /stylelint-config-standard-scss/);
});
