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

test("Vercel auto-deploy rules cover slash-named feature branches", async () => {
	const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
		git?: { deploymentEnabled?: Record<string, boolean> };
	};
	const rules = config.git?.deploymentEnabled;

	assert.ok(rules);
	assert.equal(rules["**"], false);
	assert.equal(rules.master, true);
	assert.equal(rules["vercel-preview-*"], true);
	assert.equal(rules["*"], undefined);
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

	assert.ok(
		workflow.includes("github.event.client_payload.git.sha != github.sha"),
	);
	assert.ok(
		workflow.includes("github.event.client_payload.git.ref != 'master'"),
	);
	assert.ok(
		workflow.includes(
			"github.event.client_payload.environment != 'production'",
		),
	);
});


test("on-demand Vercel Preview requires exact Quality success and triggers a first ref update", async () => {
	const workflow = await readFile(".github/workflows/vercel-preview.yml", "utf8");

	assert.match(workflow, /actions:\s*read/);
	assert.match(workflow, /listWorkflowRunsForRepo/);
	assert.match(workflow, /head_sha:\s*sha/);
	assert.match(workflow, /CI \(Quality and Security\)/);
	assert.match(workflow, /qualityRun\.conclusion !== 'success'/);
	assert.match(workflow, /sha:\s*pr\.base\.sha/);
	assert.match(
		workflow,
		/createRef[\s\S]*sha:\s*pr\.base\.sha[\s\S]*updateRef[\s\S]*sha,/,
	);
});
