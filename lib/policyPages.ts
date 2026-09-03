export type PolicyPageDefinition = Readonly<{
	sourceFile: `policy/${string}.html`;
	canonicalPath: `/policy/${string}`;
	siteName: string;
}>;

export const POLICY_PAGES = {
	accessibility_statement: {
		sourceFile: "policy/accessibility_statement.html",
		canonicalPath: "/policy/accessibility_statement",
		siteName: "Alban Andrieu",
	},
	cookie_policy: {
		sourceFile: "policy/cookie_policy.html",
		canonicalPath: "/policy/cookie_policy",
		siteName: "Alban Andrieu",
	},
	impressum: {
		sourceFile: "policy/impressum.html",
		canonicalPath: "/policy/impressum",
		siteName: "Alban Andrieu",
	},
	legal: {
		sourceFile: "policy/legal.html",
		canonicalPath: "/policy/legal",
		siteName: "Alban Andrieu",
	},
	privacy_policy: {
		sourceFile: "policy/privacy_policy.html",
		canonicalPath: "/policy/privacy_policy",
		siteName: "Alban Andrieu",
	},
	service_terms: {
		sourceFile: "policy/service_terms.html",
		canonicalPath: "/policy/service_terms",
		siteName: "Alban Andrieu",
	},
} as const satisfies Record<string, PolicyPageDefinition>;

export type PolicyPageSlug = keyof typeof POLICY_PAGES;

export const POLICY_PAGE_SLUGS = Object.keys(POLICY_PAGES) as PolicyPageSlug[];

export const NATIVE_LOCALIZED_POLICY_SLUGS = [
	"accessibility_statement",
	"cookie_policy",
	"privacy_policy",
	"service_terms",
	"legal",
	"impressum",
] as const satisfies readonly PolicyPageSlug[];

export type NativeLocalizedPolicySlug =
	(typeof NATIVE_LOCALIZED_POLICY_SLUGS)[number];

export function isPolicyPageSlug(value: string): value is PolicyPageSlug {
	return Object.prototype.hasOwnProperty.call(POLICY_PAGES, value);
}

export function getPolicyPage(slug: PolicyPageSlug) {
	return POLICY_PAGES[slug];
}

/** Legacy short aliases retained for repository tooling during the migration. */
export const POLICY_SEGMENT_TO_FILE: Record<string, string> = {
	legal: POLICY_PAGES.legal.sourceFile,
	impressum: POLICY_PAGES.impressum.sourceFile,
	privacy: POLICY_PAGES.privacy_policy.sourceFile,
	terms: POLICY_PAGES.service_terms.sourceFile,
	cookies: POLICY_PAGES.cookie_policy.sourceFile,
	accessibility: POLICY_PAGES.accessibility_statement.sourceFile,
};
