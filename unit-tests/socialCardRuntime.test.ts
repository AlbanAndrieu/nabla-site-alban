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

test("Vercel compares against the last successful deployment and skips safe-only changes", async () => {
	const script = await readFile("scripts/vercel-ignore-build.sh", "utf8");

	assert.match(script, /VERCEL_GIT_PREVIOUS_SHA/);
	assert.match(script, /git diff --name-only "\$base_sha" HEAD/);
	assert.match(script, /unit-tests\/\*/);
	assert.match(script, /\.github\/workflows\/playwright\.yml/);
	assert.match(script, /Playwright workflow changed; build preview/);
});
