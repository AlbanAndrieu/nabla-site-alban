import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	canonicalPagePath,
	SEO_PAGE_SLUGS,
} from "../lib/sitePageCatalog";

const ROOT = new URL("../", import.meta.url);

test("Vercel keeps App Router APIs and excludes repository-only content", async () => {
	const ignore = await readFile(new URL(".vercelignore", ROOT), "utf8");
	const rules = ignore
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));

	assert.ok(!rules.includes("/api/"));
	assert.ok(!rules.includes("api"));
	assert.ok(!rules.some((rule) => rule.includes("app/api")));
	for (const rule of ["/.github/", "/docs/", "/tests/", "/unit-tests/"]) {
		assert.ok(rules.includes(rule));
	}
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
	assert.doesNotMatch(source, /homelab-tunnel-check/);
});

test("all SEO canonical and hreflang paths are extensionless", () => {
	for (const slug of SEO_PAGE_SLUGS) {
		for (const locale of ["en", "fr"] as const) {
			const path = canonicalPagePath(slug, locale);
			assert.doesNotMatch(path, /\.html(?:$|[?#])/);
			if (locale === "en") {
				assert.ok(path === "/" || !path.startsWith("/en/"));
			} else {
				assert.ok(path === "/fr" || path.startsWith("/fr/"));
			}
		}
	}
});

test("SEO html URLs permanently redirect to extensionless canonical routes", async () => {
	const routes = await readFile(
		new URL("lib/htmlRoutes.config.mjs", ROOT),
		"utf8",
	);
	const config = await readFile(new URL("next.config.mjs", ROOT), "utf8");

	for (const slug of [
		"expertise",
		"contact",
		"security",
		"ai",
		"ciso",
		"truenas",
		"link",
		"email",
		"nabla",
	]) {
		assert.match(routes, new RegExp(`["']${slug}["']`));
	}
	assert.match(config, /seoHtmlRedirects/);
	assert.match(config, /source: `\/\$\{slug\}\.html`/);
	assert.match(config, /destination: `\/\$\{slug\}`/);
	assert.match(config, /permanent: true/);
});

test("legacy homelab and Vercel runtimes are retired", async () => {
	for (const path of [
		"public/homelab-services-render.js",
		"components/HomelabServicesScripts.tsx",
		"public/locales/fr/nabla.html",
		"public/locales/fr/truenas.html",
		"app/api/homelab-tunnel-check/route.ts",
		"server.cjs",
		"api/create-checkout-session.js",
	]) {
		await assert.rejects(readFile(new URL(path, ROOT), "utf8"));
	}
});
