import assert from "node:assert/strict";
import test from "node:test";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
	rewriteLegacyHtmlHrefs,
} from "../lib/htmlFromPublic";

test("rewriteLegacyHtmlHrefs rewrites html links and keeps query/hash", () => {
	const fragment =
		'<a href="contact.html">Contact</a><a href="./cv/index.html?download=true#pdf">CV</a>';

	const rewritten = rewriteLegacyHtmlHrefs(fragment, "fr");

	assert.match(rewritten, /href="\/fr\/contact"/);
	assert.match(rewritten, /href="\/fr\/cv\?download=true#pdf"/);
});

test("rewriteLegacyHtmlHrefs does not rewrite external or non-html hrefs", () => {
	const fragment =
		'<a href="https://example.com/path.html">External</a>' +
		'<a href="mailto:test@example.com">Mail</a>' +
		'<a href="#section">Hash</a>' +
		'<a href="assets/logo.svg">Asset</a>';

	const rewritten = rewriteLegacyHtmlHrefs(fragment, "fr");

	assert.match(rewritten, /href="https:\/\/example\.com\/path\.html"/);
	assert.match(rewritten, /href="mailto:test@example\.com"/);
	assert.match(rewritten, /href="#section"/);
	assert.match(rewritten, /href="assets\/logo\.svg"/);
});

test("rewriteLegacyHtmlHrefs avoids double locale prefix and handles single quotes", () => {
	const fragment = "<a href='/fr/security.html'>Security</a>";
	const rewritten = rewriteLegacyHtmlHrefs(fragment, "fr");

	assert.equal(rewritten, "<a href='/fr/security'>Security</a>");
});

test("metadataFromPublicHtml decodes entities and builds canonical url", async () => {
	const metadata = await metadataFromPublicHtml("index.html", "/", "en");

	assert.equal(
		metadata.title,
		"Alban Andrieu — Freelance DevSecOps & Cloud Architect (AWS, Azure, OVH)",
	);
	assert.equal(metadata.alternates?.canonical, "https://dr-alban.com/");
	assert.equal(metadata.openGraph?.url, "https://dr-alban.com/");
});

test("metadataFromPublicHtml uses locale-specific source when available", async () => {
	const metadata = await metadataFromPublicHtml("index.html", "/", "fr");

	assert.equal(metadata.title, "Accueil | Alban Andrieu");
	assert.equal(metadata.alternates?.canonical, "https://dr-alban.com/fr");
	assert.equal(metadata.openGraph?.url, "https://dr-alban.com/fr");
});

test("metadataFromPublicHtml falls back to english source and normalizes locale", async () => {
	const metadata = await metadataFromPublicHtml(
		"contact.html",
		"contact",
		"de",
	);

	assert.equal(
		metadata.title,
		"Contact Alban Andrieu - DevSecOps Professional",
	);
	assert.equal(metadata.alternates?.canonical, "https://dr-alban.com/contact");
});

test("loadPublicHtmlFragment returns inner main content for localized page", async () => {
	const fragment = await loadPublicHtmlFragment("index.html", "main", "fr");

	assert.match(fragment, /Ingénieur DevSecOps freelance/);
	assert.doesNotMatch(fragment, /<main/i);
});
