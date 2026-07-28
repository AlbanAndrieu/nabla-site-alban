export type PageCategory =
	| "primaryVisibility"
	| "discoverability"
	| "editorialShowcase"
	| "portfolioEvidence"
	| "technicalFlow";

type SeoSettings = {
	priority: number;
	changeFrequency: "weekly" | "monthly";
};

type SitePageDefinition = {
	category: PageCategory;
	seo?: SeoSettings;
};

/**
 * Single source of truth for the purpose and indexability of public pages.
 * Object order defines sitemap order: strongest visibility pages come first.
 */
export const SITE_PAGES = {
	index: {
		category: "primaryVisibility",
		seo: { priority: 1, changeFrequency: "monthly" },
	},
	expertise: {
		category: "primaryVisibility",
		seo: { priority: 0.95, changeFrequency: "monthly" },
	},
	contact: {
		category: "primaryVisibility",
		seo: { priority: 0.9, changeFrequency: "monthly" },
	},
	security: {
		category: "editorialShowcase",
		seo: { priority: 0.85, changeFrequency: "monthly" },
	},
	ai: {
		category: "editorialShowcase",
		seo: { priority: 0.8, changeFrequency: "monthly" },
	},
	ciso: {
		category: "editorialShowcase",
		seo: { priority: 0.8, changeFrequency: "weekly" },
	},
	truenas: {
		category: "editorialShowcase",
		seo: { priority: 0.75, changeFrequency: "monthly" },
	},
	link: {
		category: "discoverability",
		seo: { priority: 0.65, changeFrequency: "monthly" },
	},
	email: {
		category: "discoverability",
		seo: { priority: 0.65, changeFrequency: "monthly" },
	},
	ctid: { category: "editorialShowcase" },
	freenas: { category: "editorialShowcase" },
	nabla: { category: "editorialShowcase" },
	workstation: { category: "editorialShowcase" },
	cv: { category: "portfolioEvidence" },
	jm: { category: "portfolioEvidence" },
	startup: { category: "technicalFlow" },
	"startup-thanks": { category: "technicalFlow" },
	pricing: { category: "technicalFlow" },
	payment: { category: "technicalFlow" },
	success: { category: "technicalFlow" },
	cancel: { category: "technicalFlow" },
	checkout: { category: "technicalFlow" },
	"checkout-tjm": { category: "technicalFlow" },
	login: { category: "technicalFlow" },
	test: { category: "technicalFlow" },
} as const satisfies Record<string, SitePageDefinition>;

export type SitePageSlug = keyof typeof SITE_PAGES;
export type SeoPageSlug = {
	[Slug in SitePageSlug]: (typeof SITE_PAGES)[Slug] extends { seo: SeoSettings }
		? Slug
		: never;
}[SitePageSlug];

const sitePageEntries = Object.entries(SITE_PAGES) as Array<
	[SitePageSlug, SitePageDefinition]
>;

export const PAGE_CATEGORIES = Object.fromEntries(
	(
		[
			"primaryVisibility",
			"discoverability",
			"editorialShowcase",
			"portfolioEvidence",
			"technicalFlow",
		] as const
	).map((category) => [
		category,
		sitePageEntries
			.filter(([, page]) => page.category === category)
			.map(([slug]) => slug),
	]),
) as Record<PageCategory, SitePageSlug[]>;

export const SEO_PAGE_SLUGS = sitePageEntries
	.filter(([, page]) => page.seo !== undefined)
	.map(([slug]) => slug) as SeoPageSlug[];

const seoPageSlugs = new Set<SitePageSlug>(SEO_PAGE_SLUGS);

export const NON_INDEXABLE_ROBOTS = { index: false, follow: false } as const;

export function isSeoPageSlug(slug: string): slug is SeoPageSlug {
	return seoPageSlugs.has(slug as SitePageSlug);
}

export function seoSettings(slug: SeoPageSlug): SeoSettings {
	const settings = (SITE_PAGES[slug] as SitePageDefinition).seo;
	if (!settings) throw new Error(`Missing SEO settings for page: ${slug}`);
	return settings;
}

export function canonicalPagePath(slug: SeoPageSlug, locale: "en" | "fr") {
	if (slug === "index") return locale === "fr" ? "/fr" : "/";
	return `${locale === "fr" ? "/fr" : ""}/${slug}.html`;
}
