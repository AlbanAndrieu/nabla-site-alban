import assert from "node:assert/strict";
import test from "node:test";
import {
	extractHtmlFragment,
	extractDocumentMetadata,
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
	rewriteLegacyHtmlHrefs,
} from "../lib/htmlFromPublic";

test("extractDocumentMetadata supports attribute order and quote styles", () => {
	const metadata = extractDocumentMetadata(
		"<title>Cloud &amp; Security</title><meta content='DevSecOps &amp; cloud' name='description'>",
	);

	assert.deepEqual(metadata, {
		title: "Cloud & Security",
		description: "DevSecOps & cloud",
	});
});

test("extractHtmlFragment keeps the requested structural boundary", () => {
	const html =
		'<body><nav class="page-nav">Nav</nav><header>Hero</header><main id="main">Content</main><footer>Footer</footer></body>';

	assert.equal(extractHtmlFragment(html, "main"), "Content");
	assert.equal(
		extractHtmlFragment(html, "mainOuter"),
		'<main id="main">Content</main>',
	);
	assert.match(extractHtmlFragment(html, "navHeaderMain"), /^<nav/);
	assert.doesNotMatch(extractHtmlFragment(html, "body"), /Footer/);
});

test("extractHtmlFragment returns empty content when the boundary is missing", () => {
	assert.equal(extractHtmlFragment("<section>Content</section>", "main"), "");
});

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
	assert.equal(metadata.alternates?.canonical, "https://albandrieu.com/");
	assert.equal(metadata.openGraph?.url, "https://albandrieu.com/");
});

test("metadataFromPublicHtml uses locale-specific source when available", async () => {
	const metadata = await metadataFromPublicHtml("index.html", "/", "fr");

	assert.equal(
		metadata.title,
		"Alban Andrieu — Freelance DevSecOps & Cloud Architect (AWS, Azure, OVH)",
	);
	assert.equal(metadata.alternates?.canonical, "https://albandrieu.com/fr");
	assert.equal(metadata.openGraph?.url, "https://albandrieu.com/fr");
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
	assert.equal(
		metadata.alternates?.canonical,
		"https://albandrieu.com/contact",
	);
});

test("loadPublicHtmlFragment returns inner main content for localized page", async () => {
	const fragment = await loadPublicHtmlFragment("index.html", "main", "fr");

	assert.match(fragment, /Architecte Cloud et DevSecOps/);
	assert.doesNotMatch(fragment, /<main/i);
});

test("loadPublicHtmlFragment can reuse the static 404 body", async () => {
	const fragment = await loadPublicHtmlFragment("404.html", "body", "en");

	assert.match(fragment, /<h1>404<\/h1>/);
	assert.match(fragment, /We're fairly sure that page/);
	assert.doesNotMatch(fragment, /<body/i);
});

test("loadPublicHtmlFragment removes legacy page navigation", async () => {
	const fragment = await loadPublicHtmlFragment(
		"ai.html",
		"navHeaderMain",
		"fr",
	);

	assert.match(fragment, /AI Best Practices/);
	assert.doesNotMatch(fragment, /<nav[^>]*page-nav/i);
});
