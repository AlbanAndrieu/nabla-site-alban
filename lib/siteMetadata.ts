import type { Metadata } from "next";
import {
	canonicalPagePath,
	type SeoPageSlug,
} from "@/lib/sitePageCatalog";

export type SiteLocale = "en" | "fr";

const SITE_NAME = "Alban Andrieu";
const OPEN_GRAPH_LOCALE: Record<SiteLocale, string> = {
	en: "en_US",
	fr: "fr_FR",
};

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

	return {
		title,
		description,
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
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
	};
}
