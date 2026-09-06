import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production smoke stays lightweight and production-only", async () => {
	const workflow = await readFile(
		new URL("../.github/workflows/production-smoke.yml", import.meta.url),
		"utf8",
	);
	const script = await readFile(
		new URL("../scripts/post-deploy-smoke.mjs", import.meta.url),
		"utf8",
	);

	assert.match(workflow, /vercel\.deployment\.success/);
	assert.match(workflow, /git\.ref == 'master'/);
	assert.match(workflow, /environment == 'production'/);
	assert.match(workflow, /node scripts\/post-deploy-smoke\.mjs/);
	assert.match(workflow, /Production Post-deploy Smoke/);
	assert.doesNotMatch(workflow, /npm ci/);
	assert.doesNotMatch(workflow, /playwright/i);
	assert.doesNotMatch(workflow, /VERCEL_AUTOMATION_BYPASS_SECRET/);

	for (const pathname of [
		'path: "/"',
		'path: "/fr"',
		'path: "/truenas"',
		'path: "/fr/truenas"',
		'path: "/architecture"',
		'path: "/fr/architecture"',
	]) {
		assert.match(script, new RegExp(pathname.replace(/[.*+?^$()|[\]\\]/g, "\\$&")));
	}

	assert.match(script, /linkHref\(html, "canonical"\)/);
	assert.match(script, /linkHref\(html, "alternate", "en"\)/);
	assert.match(script, /linkHref\(html, "alternate", "fr"\)/);
	assert.match(script, /noindex/);
	assert.match(script, /\/sitemap\.xml/);
	assert.match(script, /\/robots\.txt/);
	assert.match(script, /\/policy\/legal/);
	assert.match(script, /\/nabla\/index\.html/);
});

test("robots advertises the clean canonical site contract", async () => {
	const robots = await readFile(
		new URL("../public/robots.txt", import.meta.url),
		"utf8",
	);

	assert.match(
		robots,
		/Sitemap: https:\/\/www\.albanandrieu\.com\/sitemap\.xml/,
	);
	assert.match(robots, /Allow: \/nabla\b/);
	assert.doesNotMatch(robots, /\/nabla\/index\.html/);
});
