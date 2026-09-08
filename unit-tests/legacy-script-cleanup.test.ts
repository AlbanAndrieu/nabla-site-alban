import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);

test("retired install/test shell wrappers stay absent", async () => {
	await assert.rejects(access(projectUrl("scripts/run-install.sh")));
	await assert.rejects(access(projectUrl("scripts/run-test.sh")));
});

test("canonical package scripts own dependency installation and Playwright execution", async () => {
	const packageJson = JSON.parse(
		await readFile(projectUrl("package.json"), "utf8"),
	) as { scripts?: Record<string, string> };

	assert.equal(packageJson.scripts?.test, "playwright test");
	assert.equal(packageJson.scripts?.["test:ui"], "playwright test --ui");
	assert.equal(
		packageJson.scripts?.["test:headed"],
		"playwright test --headed",
	);
	assert.equal(packageJson.scripts?.["test:debug"], "playwright test --debug");
});
