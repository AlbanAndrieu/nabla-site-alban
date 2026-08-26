import type { Metadata } from "next";
import {
	canonicalPagePath,
	type SeoPageSlug,
} from "@/lib/sitePageCatalog";

export type SiteLocale = "en" | "fr";

const SITE_NAME = "Alban Andrieu";
const SITE_URL = "https://albanandrieu.com";
const OPEN_GRAPH_LOCALE: Record<SiteLocale, string> = {
	en: "en_US",
	fr: "fr_FR",
};

function socialImageUrl(title: string, locale: SiteLocale) {
	const params = new URLSearchParams({ title, locale });
	return `${SITE_URL}/api/og?${params.toString()}`;
}

export function buildPageMetadata({
	slug,
	locale,
	title,
	description,
}: {
	slug: SeoPageSlug;
	locale: SiteLocale;
	title: string;
	description: string;
}): Metadata {
	const canonical = canonicalPagePath(slug, locale);
	const alternateLocale: SiteLocale = locale === "fr" ? "en" : "fr";
	const image = socialImageUrl(title, locale);

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
			type: slug === "index" ? "profile" : "website",
			title,
			description,
			url: canonical,
			locale: OPEN_GRAPH_LOCALE[locale],
			alternateLocale: [OPEN_GRAPH_LOCALE[alternateLocale]],
			siteName: SITE_NAME,
			images: [
				{
					url: image,
					width: 1200,
					height: 630,
					alt: title,
					type: "image/png",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			creator: "@AlbanAndrieu",
			images: [image],
		},
	};
}
