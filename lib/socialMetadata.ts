import type { Metadata } from "next";
import { canonicalPagePath, type SeoPageSlug } from "@/lib/sitePageCatalog";

export const SITE_ORIGIN = "https://albanandrieu.com";
export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;
export const TWITTER_HANDLE = "@AlbanAndrieu";

type SocialMetadataOptions = {
	title: string;
	description?: string;
	slug: SeoPageSlug;
	locale: "en" | "fr";
	type?: "website" | "profile";
};

function socialLocale(locale: "en" | "fr") {
	return locale === "fr" ? "fr_FR" : "en_US";
}

export function socialCardPath({
	title,
	description,
	locale,
}: Pick<SocialMetadataOptions, "title" | "description" | "locale">) {
	const params = new URLSearchParams({ title, locale });
	if (description) params.set("description", description);
	return `/api/social-card?${params.toString()}`;
}

export function buildPageMetadata({
	title,
	description,
	slug,
	locale,
	type = "website",
}: SocialMetadataOptions): Metadata {
	const canonical = canonicalPagePath(slug, locale);
	const canonicalUrl = new URL(canonical, SITE_ORIGIN).toString();
	const socialImage = new URL(
		socialCardPath({ title, description, locale }),
		SITE_ORIGIN,
	).toString();

	return {
		title,
		description,
		alternates: {
			canonical,
			languages: {
				en: canonicalPagePath(slug, "en"),
				fr: canonicalPagePath(slug, "fr"),
			},
		},
		openGraph: {
			type,
			title,
			description,
			url: canonicalUrl,
			siteName: "Alban Andrieu",
			locale: socialLocale(locale),
			alternateLocale: [socialLocale(locale === "fr" ? "en" : "fr")],
			images: [
				{
					url: socialImage,
					width: SOCIAL_CARD_WIDTH,
					height: SOCIAL_CARD_HEIGHT,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			site: TWITTER_HANDLE,
			creator: TWITTER_HANDLE,
			title,
			description,
			images: [{ url: socialImage, alt: title }],
		},
	};
}
