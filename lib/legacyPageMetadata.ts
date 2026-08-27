import type { Metadata } from "next";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";
import { buildPageMetadata, type SiteLocale } from "@/lib/siteMetadata";
import type { SeoPageSlug } from "@/lib/sitePageCatalog";

function metadataTitle(metadata: Metadata, fallback: string) {
	return typeof metadata.title === "string" ? metadata.title : fallback;
}

function metadataDescription(metadata: Metadata, fallback: string) {
	return typeof metadata.description === "string"
		? metadata.description
		: fallback;
}

export async function buildLegacyPageMetadata({
	file,
	slug,
	locale,
	fallbackTitle,
	fallbackDescription,
}: {
	file: string;
	slug: SeoPageSlug;
	locale: SiteLocale;
	fallbackTitle: string;
	fallbackDescription: string;
}): Promise<Metadata> {
	const extracted = await metadataFromPublicHtml(file, `/${slug}`, locale);
	return buildPageMetadata({
		slug,
		locale,
		title: metadataTitle(extracted, fallbackTitle),
		description: metadataDescription(extracted, fallbackDescription),
	});
}
