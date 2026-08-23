import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

test("Vercel ignores only the legacy root api directory", async () => {
	const ignore = await readFile(new URL(".vercelignore", ROOT), "utf8");
	const rules = ignore
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));

	assert.ok(rules.includes("/api/"));
	assert.ok(!rules.includes("api"));
	assert.ok(!rules.some((rule) => rule.startsWith("!app/api")));
});

test("Nabla and TrueNAS pages stay statically renderable with shared homelab UI", async () => {
	for (const page of ["nabla", "truenas"]) {
		const source = await readFile(
			new URL(`app/[locale]/${page}/page.tsx`, ROOT),
			"utf8",
		);

		assert.doesNotMatch(source, /force-dynamic/);
		assert.doesNotMatch(
			source,
			/loadHomelabServicesCatalog|loadHomelabHealthSnapshot/,
		);
		assert.match(source, /HomelabServicesSection/);
	}
});

test("dynamic homelab data is isolated behind same-origin APIs", async () => {
	const source = await readFile(
		new URL("app/components/homelab/HomelabServicesBlock.tsx", ROOT),
		"utf8",
	);

	assert.match(source, /^"use client";/);
	assert.match(source, /fetch\("\/api\/homelab-services"/);
	assert.match(source, /fetch\("\/api\/homelab-health"/);
});

test("Nabla and TrueNAS do not keep legacy html routing", async () => {
	const routes = await readFile(
		new URL("lib/htmlRoutes.config.mjs", ROOT),
		"utf8",
	);
	const config = await readFile(new URL("next.config.mjs", ROOT), "utf8");

	assert.doesNotMatch(routes, /["']nabla["']/);
	assert.doesNotMatch(routes, /["']truenas["']/);
	assert.doesNotMatch(config, /\/locales\/fr\/nabla\.html/);
	assert.doesNotMatch(config, /\/locales\/fr\/truenas\.html/);
});

test("legacy homelab renderer is retired", async () => {
	for (const path of [
		"public/homelab-services-render.js",
		"components/HomelabServicesScripts.tsx",
		"public/locales/fr/nabla.html",
		"public/locales/fr/truenas.html",
	]) {
		await assert.rejects(readFile(new URL(path, ROOT), "utf8"));
	}
});
