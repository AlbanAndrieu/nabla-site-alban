import assert from "node:assert/strict";
import test from "node:test";
import {
	decodeHtmlAttributeValue,
	linkHref,
	metaContent,
} from "../scripts/lib/production-smoke-html.mjs";
import {
	decodeHtmlAttributeValue as publicDecode,
} from "../scripts/post-deploy-smoke.mjs";

test("production smoke preserves its public single-pass HTML decoder", () => {
	for (const source of [decodeHtmlAttributeValue, publicDecode]) {
		assert.equal(source("&amp;locale=fr"), "&locale=fr");
		assert.equal(source("&amp;quot;"), "&quot;");
		assert.equal(source("&#x22;"), '"');
		assert.equal(source("&#38;"), "&");
	}
});

test("HTML metadata parser handles order and escaped query strings", () => {
	const html = [
		'<link href="https://www.albanandrieu.com/fr?x=1&amp;y=2" hreflang="fr" rel="alternate">',
		'<link href="https://www.albanandrieu.com/" rel="canonical">',
		'<meta content="https://www.albanandrieu.com/api/social-card?locale=fr&amp;title=Site" property="og:image">',
		'<meta name="twitter:image" content="https://www.albanandrieu.com/api/social-card?locale=fr&amp;title=Site">',
	].join("\n");
	assert.equal(linkHref(html, "canonical"), "https://www.albanandrieu.com/");
	assert.equal(
		linkHref(html, "alternate", "fr"),
		"https://www.albanandrieu.com/fr?x=1&y=2",
	);
	assert.equal(
		metaContent(html, "og:image"),
		"https://www.albanandrieu.com/api/social-card?locale=fr&title=Site",
	);
	assert.equal(
		metaContent(html, "twitter:image"),
		metaContent(html, "og:image"),
	);
	assert.equal(linkHref(html, "alternate", "de"), null);
	assert.equal(metaContent(html, "missing"), null);
});

test("HTML parser does not treat missing tags as valid SEO evidence", () => {
	const html = '<meta name="robots" content="noindex"><link rel="stylesheet" href="/main.css">';
	assert.equal(linkHref(html, "canonical"), null);
	assert.equal(linkHref(html, "alternate", "en"), null);
	assert.equal(metaContent(html, "og:image"), null);
});
