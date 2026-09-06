import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runProductionSmoke } from "../scripts/post-deploy-smoke.mjs";

const ORIGIN = "https://www.albanandrieu.com";

const ROUTE_METADATA: Record<
	string,
	{ canonical: string; en: string; fr: string; locale: "en" | "fr" }
> = {
	"/": { canonical: "/", en: "/", fr: "/fr", locale: "en" },
	"/fr": { canonical: "/fr", en: "/", fr: "/fr", locale: "fr" },
	"/truenas": {
		canonical: "/truenas",
		en: "/truenas",
		fr: "/fr/truenas",
		locale: "en",
	},
	"/fr/truenas": {
		canonical: "/fr/truenas",
		en: "/truenas",
		fr: "/fr/truenas",
		locale: "fr",
	},
	"/architecture": {
		canonical: "/architecture",
		en: "/architecture",
		fr: "/fr/architecture",
		locale: "en",
	},
	"/fr/architecture": {
		canonical: "/fr/architecture",
		en: "/architecture",
		fr: "/fr/architecture",
		locale: "fr",
	},
	"/contact": {
		canonical: "/contact",
		en: "/contact",
		fr: "/fr/contact",
		locale: "en",
	},
	"/fr/contact": {
		canonical: "/fr/contact",
		en: "/contact",
		fr: "/fr/contact",
		locale: "fr",
	},
};

function absolute(pathname: string) {
	return new URL(pathname, ORIGIN).href.replace(
		/\/$/,
		pathname === "/" ? "/" : "",
	);
}

function pageHtml({
	canonical,
	en,
	fr,
	locale,
}: (typeof ROUTE_METADATA)[string]) {
	const socialCard =
		ORIGIN +
		"/api/social-card?title=Smoke&amp;locale=" +
		locale;
	return `<!doctype html>
<html>
<head>
<link rel="canonical" href="${absolute(canonical)}">
<link rel="alternate" hreflang="en" href="${absolute(en)}">
<link rel="alternate" hreflang="fr" href="${absolute(fr)}">
<link rel="alternate" hreflang="x-default" href="${absolute(en)}">
<meta property="og:image" content="${socialCard}">
<meta name="twitter:image" content="${socialCard}">
</head>
<body>Smoke</body>
</html>`;
}

function socialPng() {
	const png = Buffer.alloc(24);
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
	png.writeUInt32BE(1200, 16);
	png.writeUInt32BE(630, 20);
	return png;
}

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
	assert.match(workflow, /BASE_URL: "https:\/\/www\.albanandrieu\.com"/);
	assert.match(workflow, /node scripts\/post-deploy-smoke\.mjs/);
	assert.match(workflow, /Production Post-deploy Smoke/);
	assert.doesNotMatch(workflow, /inputs\.base_url/);
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
		'path: "/contact"',
		'path: "/fr/contact"',
	]) {
		assert.match(
			script,
			new RegExp(pathname.replace(/[.*+?^$()|[\]\\]/g, "\\$&")),
		);
	}

	assert.match(script, /linkHref\(html, "canonical"\)/);
	assert.match(script, /linkHref\(html, "alternate", "en"\)/);
	assert.match(script, /linkHref\(html, "alternate", "fr"\)/);
	assert.match(script, /linkHref\(html, "alternate", "x-default"\)/);
	assert.match(script, /\/api\/homelab-status/);
	assert.match(script, /x-homelab-status-source/);
	assert.match(script, /\/api\/social-card/);
	assert.match(script, /image\.readUInt32BE\(16\) === 1200/);
	assert.match(script, /image\.readUInt32BE\(20\) === 630/);
	assert.match(script, /FETCH_ATTEMPTS = 3/);
	assert.match(script, /noindex/);
	assert.match(script, /\/sitemap\.xml/);
	assert.match(script, /\/robots\.txt/);
	assert.match(script, /\/policy\/legal/);
	assert.match(script, /\/nabla\/index\.html/);
});

test("production smoke validates pages, homelab API and social cards", async () => {
	const originalFetch = globalThis.fetch;
	const requests: string[] = [];

	globalThis.fetch = (async (input) => {
		const url = new URL(
			typeof input === "string"
				? input
				: input instanceof URL
					? input.href
					: input.url,
		);
		requests.push(url.pathname + url.search);

		if (url.pathname === "/sitemap.xml") {
			const locs = [
				"/",
				"/truenas",
				"/architecture",
				"/contact",
				"/policy",
				"/policy/legal",
			]
				.map((pathname) => `<loc>${absolute(pathname)}</loc>`)
				.join("");
			return new Response(`<urlset>${locs}</urlset>`, {
				status: 200,
				headers: { "content-type": "application/xml" },
			});
		}

		if (url.pathname === "/robots.txt") {
			return new Response(
				[
					"User-agent: *",
					"Allow: /nabla",
					"Sitemap: https://www.albanandrieu.com/sitemap.xml",
				].join("\n"),
				{
					status: 200,
					headers: { "content-type": "text/plain" },
				},
			);
		}

		if (url.pathname === "/api/homelab-status") {
			return new Response(
				JSON.stringify({
					schemaVersion: 1,
					checkedAt: "2026-09-07T00:00:00Z",
					services: [],
				}),
				{
					status: 200,
					headers: {
						"content-type": "application/json",
						"x-homelab-status-source": "fastapi",
					},
				},
			);
		}

		if (url.pathname === "/api/social-card") {
			return new Response(socialPng(), {
				status: 200,
				headers: { "content-type": "image/png" },
			});
		}

		const route = ROUTE_METADATA[url.pathname];
		if (route) {
			return new Response(pageHtml(route), {
				status: 200,
				headers: { "content-type": "text/html" },
			});
		}

		return new Response("not found", { status: 404 });
	}) as typeof fetch;

	try {
		await runProductionSmoke(ORIGIN);
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.ok(requests.includes("/contact"));
	assert.ok(requests.includes("/fr/contact"));
	assert.ok(requests.includes("/api/homelab-status"));
	assert.ok(requests.includes("/api/social-card?title=Smoke&locale=en"));
	assert.ok(requests.includes("/api/social-card?title=Smoke&locale=fr"));
});

test("production smoke rejects non-canonical targets", async () => {
	await assert.rejects(
		runProductionSmoke("https://example.com"),
		/canonical origin https:\/\/www\.albanandrieu\.com/,
	);
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
