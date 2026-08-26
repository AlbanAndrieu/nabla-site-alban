import type { MetadataRoute } from "next";

import {
	canonicalPagePath,
	SEO_PAGE_SLUGS,
	seoSettings,
} from "@/lib/sitePageCatalog";
import { SITE_ORIGIN } from "@/lib/socialMetadata";

export default function sitemap(): MetadataRoute.Sitemap {
	return SEO_PAGE_SLUGS.map((slug) => {
		const englishPath = canonicalPagePath(slug, "en");
		const frenchPath = canonicalPagePath(slug, "fr");
		const settings = seoSettings(slug);

		return {
			url: new URL(englishPath, SITE_ORIGIN).href,
			changeFrequency: settings.changeFrequency,
			priority: settings.priority,
			alternates: {
				languages: {
					en: new URL(englishPath, SITE_ORIGIN).href,
					fr: new URL(frenchPath, SITE_ORIGIN).href,
				},
			},
		};
	});
}
