import assert from "node:assert/strict";
import test from "node:test";
import {
	buildPageMetadata,
	SITE_ORIGIN,
	SOCIAL_CARD_HEIGHT,
	SOCIAL_CARD_WIDTH,
} from "../lib/siteMetadata";

test("buildPageMetadata keeps canonical, Open Graph and Twitter metadata aligned", () => {
	const metadata = buildPageMetadata({
		slug: "architecture",
		locale: "en",
		title: "Nabla service architecture",
		description: "Interactive service topology.",
	});
	const expectedCanonical = `${SITE_ORIGIN}/architecture`;
	const expectedImage = `${SITE_ORIGIN}/api/social-card?title=Nabla+service+architecture&locale=en&description=Interactive+service+topology.`;

	assert.equal(metadata.title, "Nabla service architecture");
	assert.equal(metadata.description, "Interactive service topology.");
	assert.deepEqual(metadata.alternates?.languages, {
		en: "/architecture",
		fr: "/fr/architecture",
		"x-default": "/architecture",
	});
	assert.equal(metadata.openGraph?.title, "Nabla service architecture");
	assert.equal(metadata.openGraph?.description, "Interactive service topology.");
	assert.equal(metadata.openGraph?.url, expectedCanonical);
	assert.equal(metadata.openGraph?.locale, "en_US");
	assert.deepEqual(metadata.openGraph?.alternateLocale, ["fr_FR"]);
	assert.deepEqual(metadata.openGraph?.images, [
		{
			url: expectedImage,
			width: SOCIAL_CARD_WIDTH,
			height: SOCIAL_CARD_HEIGHT,
			alt: "Nabla service architecture",
			type: "image/png",
		},
	]);
	assert.equal(metadata.twitter?.card, "summary_large_image");
	assert.equal(metadata.twitter?.title, "Nabla service architecture");
	assert.equal(metadata.twitter?.creator, "@AlbanAndrieu");
	assert.deepEqual(metadata.twitter?.images, [
		{ url: expectedImage, alt: "Nabla service architecture" },
	]);
});

test("buildPageMetadata localizes French social metadata and defaults hreflang to English", () => {
	const metadata = buildPageMetadata({
		slug: "expertise",
		locale: "fr",
		title: "Expertise DevSecOps",
		description: "Architecture cloud et sécurité.",
	});

	assert.equal(metadata.alternates?.canonical, "/fr/expertise");
	assert.equal(metadata.openGraph?.url, `${SITE_ORIGIN}/fr/expertise`);
	assert.equal(metadata.openGraph?.locale, "fr_FR");
	assert.deepEqual(metadata.openGraph?.alternateLocale, ["en_US"]);
	assert.equal(metadata.alternates?.languages?.["x-default"], "/expertise");
	assert.match(
		String((metadata.twitter?.images?.[0] as { url?: string } | undefined)?.url),
		/title=Expertise\+DevSecOps&locale=fr&description=Architecture\+cloud\+et\+s%C3%A9curit%C3%A9\.$/,
	);
});
