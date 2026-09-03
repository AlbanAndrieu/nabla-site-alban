import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routing } from "../i18n/routing";
import {
	NATIVE_LOCALIZED_POLICY_SLUGS,
	POLICY_PAGE_SLUGS,
} from "../lib/policyPages";

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
	assert.deepEqual([...NATIVE_LOCALIZED_POLICY_SLUGS].sort(), [...POLICY_PAGE_SLUGS].sort());
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
