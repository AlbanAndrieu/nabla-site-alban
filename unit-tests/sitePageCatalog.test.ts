import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap";
import { POLICY_PAGE_SLUGS } from "../lib/policyPages";
import {
	canonicalPagePath,
	PAGE_CATEGORIES,
	SEO_PAGE_SLUGS,
	SITE_PAGES,
} from "../lib/sitePageCatalog";

const expectedSeoSlugs = [
	"index",
	"expertise",
	"contact",
	"security",
	"ai",
	"architecture",
	"ciso",
	"truenas",
	"link",
	"email",
	"nabla",
	"cv",
	"jm",
];

test("SEO allowlist contains the intended site pages plus native policies", () => {
	assert.deepEqual([...SEO_PAGE_SLUGS], expectedSeoSlugs);
	assert.equal(sitemap().length, expectedSeoSlugs.length + POLICY_PAGE_SLUGS.length);
});

test("technical pages stay outside the sitemap", () => {
	const urls = sitemap().map(({ url }) => url);
	for (const slug of PAGE_CATEGORIES.technicalFlow) {
		assert.equal(urls.some((url) => url.includes(`/${slug}`)), false);
	}
});

test("every catalog page belongs to exactly one derived category", () => {
	const categorizedSlugs = Object.values(PAGE_CATEGORIES).flat();
	assert.equal(categorizedSlugs.length, Object.keys(SITE_PAGES).length);
	assert.equal(new Set(categorizedSlugs).size, categorizedSlugs.length);
});

test("sitemap uses localized extensionless canonical URLs", () => {
	assert.equal(canonicalPagePath("index", "en"), "/");
	assert.equal(canonicalPagePath("index", "fr"), "/fr");
	assert.equal(canonicalPagePath("expertise", "en"), "/expertise");
	assert.equal(canonicalPagePath("expertise", "fr"), "/fr/expertise");
	assert.equal(canonicalPagePath("cv", "en"), "/cv");
	assert.equal(canonicalPagePath("cv", "fr"), "/fr/cv");
	assert.equal(canonicalPagePath("jm", "en"), "/jm");
	assert.equal(canonicalPagePath("jm", "fr"), "/fr/jm");
});

test("policy sitemap entries use clean localized routes and reciprocal alternates", () => {
	const entries = new Map(sitemap().map((entry) => [new URL(entry.url).pathname, entry]));
	for (const slug of POLICY_PAGE_SLUGS) {
		const path = `/policy/${slug}`;
		const entry = entries.get(path);
		assert.ok(entry, path);
		assert.equal(entry.alternates?.languages?.en, `https://www.albanandrieu.com${path}`);
		assert.equal(entry.alternates?.languages?.fr, `https://www.albanandrieu.com/fr${path}`);
		assert.equal(entry.alternates?.languages?.["x-default"], `https://www.albanandrieu.com${path}`);
	}
});
