import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("social image routes avoid deprecated edge runtime and dynamic nabla glyph loading", async () => {
	const [socialCard, legacyOg] = await Promise.all([
		readFile("app/api/social-card/route.tsx", "utf8"),
		readFile("app/api/og/route.tsx", "utf8"),
	]);

	assert.match(socialCard, /export const runtime = "nodejs"/);
	assert.match(legacyOg, /export const runtime = "nodejs"/);
	assert.doesNotMatch(socialCard, />\s*∇\s*</);
	assert.match(socialCard, /<svg[\s\S]*<path/);
});

test("Vercel skips CI-only changes", async () => {
	const script = await readFile("scripts/vercel-ignore-build.sh", "utf8");

	assert.ok(script.includes("VERCEL_GIT_PREVIOUS_SHA"));
	assert.ok(script.includes("unit-tests/*"));
	assert.ok(script.includes(".github/*"));
	assert.ok(!script.includes("Playwright workflow changed; build preview"));
});

test("Playwright ignores production deployment dispatches", async () => {
	const workflow = await readFile(".github/workflows/playwright.yml", "utf8");

	assert.ok(workflow.includes("github.event.client_payload.git.sha != github.sha"));
	assert.ok(workflow.includes("github.event.client_payload.git.ref != 'master'"));
	assert.ok(workflow.includes("github.event.client_payload.environment != 'production'"));
});
