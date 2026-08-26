import assert from "node:assert/strict";
import test from "node:test";
import {
	buildPageMetadata,
	SOCIAL_CARD_HEIGHT,
	SOCIAL_CARD_WIDTH,
	TWITTER_HANDLE,
} from "../lib/socialMetadata";

test("buildPageMetadata creates complete English social metadata", () => {
	const metadata = buildPageMetadata({
		title: "Nabla service architecture",
		description: "Interactive service topology.",
		slug: "architecture",
		locale: "en",
	});
	const images = Array.isArray(metadata.openGraph?.images)
		? metadata.openGraph.images
		: [];
	const image = images[0] as { url?: string; width?: number; height?: number };

	assert.equal(metadata.alternates?.canonical, "/architecture");
	assert.equal(metadata.openGraph?.url, "https://albanandrieu.com/architecture");
	assert.equal(metadata.openGraph?.locale, "en_US");
	assert.equal(image.width, SOCIAL_CARD_WIDTH);
	assert.equal(image.height, SOCIAL_CARD_HEIGHT);
	assert.match(String(image.url), /\/api\/social-card\?/);
	assert.equal(metadata.twitter?.card, "summary_large_image");
	assert.equal(metadata.twitter?.creator, TWITTER_HANDLE);
	assert.equal(metadata.twitter?.site, TWITTER_HANDLE);
});

test("buildPageMetadata preserves French canonical and social locale", () => {
	const metadata = buildPageMetadata({
		title: "Architecture des services Nabla",
		description: "Topologie interactive.",
		slug: "architecture",
		locale: "fr",
	});

	assert.equal(metadata.alternates?.canonical, "/fr/architecture");
	assert.deepEqual(metadata.alternates?.languages, {
		en: "/architecture",
		fr: "/fr/architecture",
	});
	assert.equal(metadata.openGraph?.locale, "fr_FR");
	assert.deepEqual(metadata.openGraph?.alternateLocale, ["en_US"]);
});
