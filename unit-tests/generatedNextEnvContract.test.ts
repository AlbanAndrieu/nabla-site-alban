import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL("../" + path, import.meta.url), "utf8");

test("Next wrapper restores generated next-env.d.ts after runtime commands", async () => {
	const [script, pkgRaw] = await Promise.all([
		source("scripts/run-next-clean.sh"),
		source("package.json"),
	]);
	const pkg = JSON.parse(pkgRaw) as { scripts: Record<string, string> };

	assert.match(script, /snapshot_next_env/);
	assert.match(script, /trap restore_next_env EXIT INT TERM/);
	assert.ok(script.includes('cp "${NEXT_ENV}" "${NEXT_ENV_SNAPSHOT}"'));
	assert.doesNotMatch(script, /git checkout -- next-env\.d\.ts/);
	assert.match(script, /npx next/);
	assert.equal(pkg.scripts.dev, "bash scripts/run-next-clean.sh dev");

	assert.equal(
		pkg.scripts["dev:test"],
		"bash scripts/run-next-clean.sh dev --hostname 127.0.0.1",
	);
	assert.equal(pkg.scripts.build, "bash scripts/run-next-clean.sh build");
});

test("security.txt references the canonical localized privacy policy", async () => {
	const security = await source("public/security.txt");

	assert.match(
		security,
		/^Policy: https:\/\/www\.albanandrieu\.com\/fr\/policy\/privacy_policy$/m,
	);
	assert.doesNotMatch(security, /\/policy\/privacy\.html/);
});

test("local accessibility harness isolates Next runtime artifacts", async () => {
	const [script, pkgRaw, playwright] = await Promise.all([
		source("scripts/run-a11y-local.sh"),
		source("package.json"),
		source("playwright.config.ts"),
	]);
	const pkg = JSON.parse(pkgRaw) as { scripts: Record<string, string> };

	assert.equal(pkg.scripts["test:a11y"], "bash scripts/run-a11y-local.sh");
	assert.doesNotMatch(script, /^#!\/usr\/bin\/env bash/m);
	assert.ok(script.includes('git diff --quiet -- "${NEXT_ENV}"'));
	assert.ok(script.includes("rm -rf .next test-results"));
	assert.ok(script.includes('PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3103}"'));
	assert.ok(script.includes("PLAYWRIGHT_REUSE_SERVER=false"));
	assert.ok(playwright.includes('process.env.PLAYWRIGHT_REUSE_SERVER !== "false"'));
});
