import type { MetadataRoute } from "next";

import {
  canonicalPagePath,
  SEO_PAGE_SLUGS,
  seoSettings,
} from "@/lib/sitePageCatalog";

const SITE_URL = "https://albanandrieu.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return SEO_PAGE_SLUGS.map((slug) => {
    const englishPath = canonicalPagePath(slug, "en");
    const frenchPath = canonicalPagePath(slug, "fr");
    const settings = seoSettings(slug);

    return {
      url: new URL(englishPath, SITE_URL).href,
      changeFrequency: settings.changeFrequency,
      priority: settings.priority,
      alternates: {
        languages: {
          en: new URL(englishPath, SITE_URL).href,
          fr: new URL(frenchPath, SITE_URL).href,
        },
      },
    };
  });
}
