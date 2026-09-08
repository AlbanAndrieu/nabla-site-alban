import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const source = (path: string) => readFile(projectUrl(path), "utf8");

test("Preview E2E includes integration, pentest and performance baselines", async () => {
	const [pkgRaw, workflow] = await Promise.all([
		source("package.json"),
		source(".github/workflows/playwright.yml"),
	]);
	const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };

	assert.equal(
		pkg.scripts?.["test:baselines"],
		"playwright test tests/integration-baseline.spec.ts tests/security-baseline.spec.ts tests/performance-baseline.spec.ts --project=chromium",
	);
	assert.equal(
		pkg.scripts?.["test:integration"],
		"playwright test tests/integration-baseline.spec.ts --project=chromium",
	);
	assert.equal(
		pkg.scripts?.["test:security"],
		"playwright test tests/security-baseline.spec.ts --project=chromium",
	);
	assert.equal(
		pkg.scripts?.["test:performance"],
		"playwright test tests/performance-baseline.spec.ts --project=chromium",
	);

	for (const path of [
		"tests/integration-baseline.spec.ts",
		"tests/security-baseline.spec.ts",
		"tests/performance-baseline.spec.ts",
	]) {
		await access(projectUrl(path));
	}

	assert.match(workflow, /npm test -- --project=chromium/);
	assert.match(workflow, /integration, security, performance and E2E/i);
});

test("basic security response headers stay configured", async () => {
	const config = await source("next.config.mjs");

	assert.match(config, /X-Content-Type-Options/);
	assert.match(config, /nosniff/);
	assert.match(config, /X-Frame-Options/);
	assert.match(config, /SAMEORIGIN/);
	assert.match(config, /Referrer-Policy/);
	assert.match(config, /strict-origin-when-cross-origin/);
	assert.match(config, /Permissions-Policy/);
});
