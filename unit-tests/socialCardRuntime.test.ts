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

test("Vercel skips unit-test-only commits but keeps Playwright deployment validation", async () => {
	const script = await readFile("scripts/vercel-ignore-build.sh", "utf8");

	assert.match(script, /unit-tests\/\*/);
	assert.match(script, /\.github\/workflows\/playwright\.yml/);
	assert.match(script, /Playwright workflow changed; build preview/);
});
