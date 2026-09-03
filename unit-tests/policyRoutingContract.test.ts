import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routing } from "../i18n/routing";
import { POLICY_PAGE_SLUGS } from "../lib/policyPages";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("all six policy routes are native, typed and statically generated for configured locales", async () => {
	assert.deepEqual([...POLICY_PAGE_SLUGS].sort(), [
		"accessibility_statement",
		"cookie_policy",
		"impressum",
		"legal",
		"privacy_policy",
		"service_terms",
	].sort());
	assert.deepEqual([...routing.locales], ["en", "fr"]);

	const page = await source("app/[locale]/policy/[policy]/page.tsx");
	assert.match(page, /dynamicParams = false/);
	assert.match(page, /routing\.locales\.flatMap/);
	assert.match(page, /POLICY_PAGE_SLUGS/);
	assert.match(page, /NativePolicyContent/);
	assert.match(page, /"x-default"/);
	assert.match(page, /SkipToMainContent/);
	assert.match(page, /TopAnchor/);
});

test("policy index links every native policy and derives localized SEO from routing", async () => {
	const index = await source("app/[locale]/policy/page.tsx");
	assert.match(index, /POLICY_PAGE_SLUGS\.map/);
	assert.match(index, /localizedPolicyPath/);
	assert.match(index, /localizedIndexPath/);
	assert.match(index, /routing\.locales\.map/);
	assert.match(index, /"x-default"/);
	assert.match(index, /policy-index-title/);
	assert.doesNotMatch(index, /\.html/);

	const sitemap = await source("app/sitemap.ts");
	assert.match(sitemap, /policyIndexSitemapEntry/);
	assert.match(sitemap, /localizedPolicyIndexPath/);
});

test("policy registry contains only runtime-native metadata after migration", async () => {
	const registry = await source("lib/policyPages.ts");
	assert.doesNotMatch(registry, /sourceFile/);
	assert.doesNotMatch(registry, /NATIVE_LOCALIZED_POLICY_SLUGS/);
	assert.doesNotMatch(registry, /POLICY_SEGMENT_TO_FILE/);
});

test("legacy policy html files stay archival while clean routes redirect to Next", async () => {
	const config = await source("next.config.mjs");
	assert.match(config, /policyHtmlRedirects/);
	assert.match(config, /`\/policy\/\${name}\.html`/);
	assert.match(config, /destination: `\/policy\/\${name}`/);
	assert.doesNotMatch(config, /policyRewrites/);
	for (const slug of POLICY_PAGE_SLUGS) {
		const html = await source(`public/policy/${slug}.html`);
		assert.match(html, /<!doctype html>/i);
	}
});

test("native policy metadata is localized and uses clean canonical paths", async () => {
	const page = await source("app/[locale]/policy/[policy]/page.tsx");
	assert.match(page, /localizedPolicyPath/);
	assert.match(page, /localizedPolicyAlternates/);
	assert.match(page, /openGraph/);
	assert.match(page, /twitter/);
	assert.doesNotMatch(page, /\.html/);
});
