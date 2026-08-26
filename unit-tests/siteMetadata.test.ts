import assert from "node:assert/strict";
import test from "node:test";
import { buildPageMetadata } from "../lib/siteMetadata";

test("buildPageMetadata keeps canonical, Open Graph and Twitter metadata aligned", () => {
	const metadata = buildPageMetadata({
		slug: "architecture",
		locale: "en",
		title: "Nabla service architecture",
		description: "Interactive service topology.",
	});
	const expectedImage =
		"https://albanandrieu.com/api/og?title=Nabla+service+architecture&locale=en";

	assert.equal(metadata.title, "Nabla service architecture");
	assert.equal(metadata.description, "Interactive service topology.");
	assert.deepEqual(metadata.alternates?.languages, {
		en: "/architecture",
		fr: "/fr/architecture",
		"x-default": "/architecture",
	});
	assert.equal(metadata.openGraph?.title, "Nabla service architecture");
	assert.equal(metadata.openGraph?.description, "Interactive service topology.");
	assert.equal(metadata.openGraph?.url, "/architecture");
	assert.equal(metadata.openGraph?.locale, "en_US");
	assert.deepEqual(metadata.openGraph?.alternateLocale, ["fr_FR"]);
	assert.deepEqual(metadata.openGraph?.images, [
		{
			url: expectedImage,
			width: 1200,
			height: 630,
			alt: "Nabla service architecture",
			type: "image/png",
		},
	]);
	assert.equal(metadata.twitter?.card, "summary_large_image");
	assert.equal(metadata.twitter?.title, "Nabla service architecture");
	assert.equal(metadata.twitter?.creator, "@AlbanAndrieu");
	assert.deepEqual(metadata.twitter?.images, [expectedImage]);
});

test("buildPageMetadata localizes French social metadata and defaults hreflang to English", () => {
	const metadata = buildPageMetadata({
		slug: "expertise",
		locale: "fr",
		title: "Expertise DevSecOps",
		description: "Architecture cloud et sécurité.",
	});

	assert.equal(metadata.alternates?.canonical, "/fr/expertise");
	assert.equal(metadata.openGraph?.url, "/fr/expertise");
	assert.equal(metadata.openGraph?.locale, "fr_FR");
	assert.deepEqual(metadata.openGraph?.alternateLocale, ["en_US"]);
	assert.equal(metadata.alternates?.languages?.["x-default"], "/expertise");
	assert.match(
		String(metadata.twitter?.images?.[0]),
		/title=Expertise\+DevSecOps&locale=fr$/,
	);
});
