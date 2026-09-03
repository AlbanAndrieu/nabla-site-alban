import type { MetadataRoute } from "next";

import { type AppLocale, routing } from "@/i18n/routing";
import {
	getPolicyPage,
	POLICY_PAGE_SLUGS,
	type PolicyPageSlug,
} from "@/lib/policyPages";
import {
	canonicalPagePath,
	SEO_PAGE_SLUGS,
	seoSettings,
} from "@/lib/sitePageCatalog";
import { SITE_ORIGIN } from "@/lib/socialMetadata";

function localizedPolicyIndexPath(locale: AppLocale) {
	return locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
}

function localizedPolicyPath(slug: PolicyPageSlug, locale: AppLocale) {
	const path = getPolicyPage(slug).canonicalPath;
	return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

function policyIndexSitemapEntry(): MetadataRoute.Sitemap[number] {
	const defaultPath = localizedPolicyIndexPath(routing.defaultLocale);
	const languages = Object.fromEntries([
		...routing.locales.map((locale) => [
			locale,
			new URL(localizedPolicyIndexPath(locale), SITE_ORIGIN).href,
		]),
		["x-default", new URL(defaultPath, SITE_ORIGIN).href],
	]);
	return {
		url: new URL(defaultPath, SITE_ORIGIN).href,
		changeFrequency: "yearly" as const,
		priority: 0.4,
		alternates: { languages },
	};
}

function policySitemapEntries(): MetadataRoute.Sitemap {
	return POLICY_PAGE_SLUGS.map((slug) => {
		const defaultPath = localizedPolicyPath(slug, routing.defaultLocale);
		const languages = Object.fromEntries([
			...routing.locales.map((locale) => [
				locale,
				new URL(localizedPolicyPath(slug, locale), SITE_ORIGIN).href,
			]),
			["x-default", new URL(defaultPath, SITE_ORIGIN).href],
		]);

		return {
			url: new URL(defaultPath, SITE_ORIGIN).href,
			changeFrequency: "yearly" as const,
			priority: 0.3,
			alternates: { languages },
		};
	});
}

export default function sitemap(): MetadataRoute.Sitemap {
	const pageEntries = SEO_PAGE_SLUGS.map((slug) => {
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

	return [
		...pageEntries,
		policyIndexSitemapEntry(),
		...policySitemapEntries(),
	];
}
