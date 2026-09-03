import assert from "node:assert/strict";
import test from "node:test";

import { getLegalPolicyCopy, LEGAL_POLICY_EMAIL } from "../lib/legalPolicies";
import { getPrivacyPolicyCopy, PRIVACY_POLICY_EMAIL } from "../lib/privacyPolicy";
import { getPublicPolicyCopy } from "../lib/publicPolicies";
import { getServiceTermsCopy, SERVICE_TERMS_EMAIL } from "../lib/serviceTerms";

for (const locale of ["en", "fr"] as const) {
	test(`native policy copy stays Site Alban-specific in ${locale}`, () => {
		const privacy = getPrivacyPolicyCopy(locale);
		const terms = getServiceTermsCopy(locale);
		const legal = getLegalPolicyCopy("legal", locale);
		const impressum = getLegalPolicyCopy("impressum", locale);
		const cookies = getPublicPolicyCopy("cookie_policy", locale);
		const accessibility = getPublicPolicyCopy("accessibility_statement", locale);
		const serialized = JSON.stringify({ privacy, terms, legal, impressum, cookies, accessibility });

		assert.equal(PRIVACY_POLICY_EMAIL, "job@albandrieu.com");
		assert.equal(SERVICE_TERMS_EMAIL, "job@albandrieu.com");
		assert.equal(LEGAL_POLICY_EMAIL, "job@albandrieu.com");
		assert.match(serialized, /albanandrieu\.com/);
		assert.doesNotMatch(serialized, /bababou\.com|related to the child|\[COUNTRY\]|\[CITY \/ COUNTRY\]/i);
	});
}

test("service terms use French law without overriding mandatory jurisdiction", () => {
	const terms = getServiceTermsCopy("en");
	const serialized = JSON.stringify(terms);
	assert.match(serialized, /French law/);
	assert.match(serialized, /mandatory statutory jurisdiction/);
});

test("impressum uses current DDG framing instead of the obsolete TMG claim", () => {
	const impressum = JSON.stringify(getLegalPolicyCopy("impressum", "en"));
	assert.match(impressum, /\{ddg\}/);
	assert.doesNotMatch(impressum, /Telemediengesetz|TMG/);
});

test("cookie policy describes the actual configurable analytics runtime", () => {
	const cookies = JSON.stringify(getPublicPolicyCopy("cookie_policy", "en"));
	for (const provider of ["Vercel Web Analytics", "Speed Insights", "Ahrefs", "Google Tag Manager", "PostHog", "Datadog RUM", "Mixpanel"]) {
		assert.match(cookies, new RegExp(provider));
	}
	assert.match(cookies, /not guaranteed to be available on every site surface/);
	assert.doesNotMatch(cookies, /openAxeptioCookies/);
});

test("accessibility policy keeps the WCAG 2.1 AA target qualified by practicability", () => {
	const accessibility = JSON.stringify(getPublicPolicyCopy("accessibility_statement", "en"));
	assert.match(accessibility, /WCAG/);
	assert.match(accessibility, /Level AA where practicable/);
});
