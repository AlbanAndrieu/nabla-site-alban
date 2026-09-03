export type PolicyPageDefinition = Readonly<{
	canonicalPath: `/policy/${string}`;
	siteName: string;
}>;

export const POLICY_PAGES = {
	accessibility_statement: {
		canonicalPath: "/policy/accessibility_statement",
		siteName: "Alban Andrieu",
	},
	cookie_policy: {
		canonicalPath: "/policy/cookie_policy",
		siteName: "Alban Andrieu",
	},
	impressum: {
		canonicalPath: "/policy/impressum",
		siteName: "Alban Andrieu",
	},
	legal: {
		canonicalPath: "/policy/legal",
		siteName: "Alban Andrieu",
	},
	privacy_policy: {
		canonicalPath: "/policy/privacy_policy",
		siteName: "Alban Andrieu",
	},
	service_terms: {
		canonicalPath: "/policy/service_terms",
		siteName: "Alban Andrieu",
	},
} as const satisfies Record<string, PolicyPageDefinition>;

export type PolicyPageSlug = keyof typeof POLICY_PAGES;

export const POLICY_PAGE_SLUGS = Object.keys(POLICY_PAGES) as PolicyPageSlug[];

export function isPolicyPageSlug(value: string): value is PolicyPageSlug {
	return Object.prototype.hasOwnProperty.call(POLICY_PAGES, value);
}

export function getPolicyPage(slug: PolicyPageSlug) {
	return POLICY_PAGES[slug];
}
