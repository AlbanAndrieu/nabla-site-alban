import type { Metadata } from "next";
import { canonicalPagePath, type SeoPageSlug } from "@/lib/sitePageCatalog";

export const SITE_NAME = "Alban Andrieu";
export const SITE_ORIGIN = "https://www.albanandrieu.com";
export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;
export const TWITTER_HANDLE = "@AlbanAndrieu";

export type SiteLocale = "en" | "fr";

type SocialMetadataOptions = {
	title: string;
	description?: string;
	slug: SeoPageSlug;
	locale: SiteLocale;
	type?: "website" | "profile";
};

type ExistingMetadataOptions = Pick<
	SocialMetadataOptions,
	"slug" | "locale" | "type"
>;

function socialLocale(locale: SiteLocale) {
	return locale === "fr" ? "fr_FR" : "en_US";
}

function metadataTitle(metadata: Metadata) {
	return typeof metadata.title === "string" ? metadata.title : SITE_NAME;
}

function metadataDescription(metadata: Metadata) {
	return typeof metadata.description === "string"
		? metadata.description
		: undefined;
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
	type,
}: SocialMetadataOptions): Metadata {
	const canonical = canonicalPagePath(slug, locale);
	const canonicalUrl = new URL(canonical, SITE_ORIGIN).toString();
	const socialImage = new URL(
		socialCardPath({ title, description, locale }),
		SITE_ORIGIN,
	).toString();
	const openGraphType = type ?? (slug === "index" ? "profile" : "website");

	return {
		title,
		description,
		creator: SITE_NAME,
		publisher: SITE_NAME,
		alternates: {
			canonical,
			languages: {
				en: canonicalPagePath(slug, "en"),
				fr: canonicalPagePath(slug, "fr"),
				"x-default": canonicalPagePath(slug, "en"),
			},
		},
		openGraph: {
			type: openGraphType,
			title,
			description,
			url: canonicalUrl,
			siteName: SITE_NAME,
			locale: socialLocale(locale),
			alternateLocale: [socialLocale(locale === "fr" ? "en" : "fr")],
			images: [
				{
					url: socialImage,
					width: SOCIAL_CARD_WIDTH,
					height: SOCIAL_CARD_HEIGHT,
					alt: title,
					type: "image/png",
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

export function enrichPageMetadata(
	metadata: Metadata,
	{ slug, locale, type }: ExistingMetadataOptions,
): Metadata {
	return {
		...metadata,
		...buildPageMetadata({
			title: metadataTitle(metadata),
			description: metadataDescription(metadata),
			slug,
			locale,
			type,
		}),
	};
}
