/**
 * Structure of the security acronym glossary. Translatable copy lives in the
 * `securityGlossaryPage` next-intl namespace; this file only owns ordering,
 * anchors and non-translatable external references.
 */
export type GlossarySource = {
	label: string;
	href: string;
};

export type GlossaryTermDefinition = {
	/** Stable anchor id, rendered as `#term-<id>`. */
	id: string;
	sources?: readonly GlossarySource[];
};

export type GlossaryCategoryDefinition = {
	id: string;
	iconClass: string;
	terms: readonly GlossaryTermDefinition[];
};

export const GLOSSARY_CATEGORIES = [
	{
		id: "continuity",
		iconClass: "fa-solid fa-life-ring",
		terms: [
			{ id: "bia" },
			{ id: "dima" },
			{ id: "mtpd" },
			{ id: "mbco" },
			{ id: "bcp" },
			{ id: "drp" },
			{ id: "itdrp" },
			{ id: "rto" },
			{ id: "rpo" },
			{ id: "spof" },
		],
	},
	{
		id: "assets",
		iconClass: "fa-solid fa-database",
		terms: [{ id: "cmdb" }],
	},
	{
		id: "architecture",
		iconClass: "fa-solid fa-diagram-project",
		terms: [
			{
				id: "ipaas",
				sources: [
					{
						label: "IBM — iPaaS",
						href: "https://www.ibm.com/fr-fr/think/topics/ipaas",
					},
				],
			},
			{
				id: "adr-architecture",
				sources: [{ label: "adr.github.io", href: "https://adr.github.io/" }],
			},
		],
	},
	{
		id: "performance",
		iconClass: "fa-solid fa-gauge-high",
		terms: [
			{ id: "kpo" },
			{
				id: "kpi",
				sources: [
					{
						label: "ISO 22400-2",
						href: "https://www.iso.org/standard/56847.html",
					},
				],
			},
			{
				id: "slo",
				sources: [
					{
						label: "Google Cloud — SRE fundamentals",
						href: "https://cloud.google.com/blog/products/devops-sre/sre-fundamentals-slis-slas-and-slos",
					},
				],
			},
			{
				id: "sla",
				sources: [
					{
						label: "Google Cloud — SRE fundamentals",
						href: "https://cloud.google.com/blog/products/devops-sre/sre-fundamentals-slis-slas-and-slos",
					},
				],
			},
		],
	},
	{
		id: "control",
		iconClass: "fa-solid fa-shield-halved",
		terms: [
			{
				id: "dica",
				sources: [
					{
						label: "Visiativ — DICP",
						href: "https://www.visiativ.com/actualites/actualites/dicp-informatique-comment-piloter-securite-numerique/",
					},
					{
						label: "SecuriteInfo.com — DICAN",
						href: "https://www.securiteinfo.com/conseils-cybersecurite/les-5-principes-fondamentaux-cybersecurite-dican.shtml",
					},
				],
			},
			{
				id: "scim",
				sources: [
					{
						label: "IETF RFC 7644",
						href: "https://datatracker.ietf.org/doc/html/rfc7644",
					},
				],
			},
			{ id: "dlp" },
			{ id: "worm" },
			{ id: "adr-detection" },
			{ id: "ioc" },
			{ id: "sod" },
		],
	},
	{
		id: "vulnerabilities",
		iconClass: "fa-solid fa-bug",
		terms: [
			{ id: "appsec" },
			{ id: "sca" },
			{ id: "sast" },
			{ id: "dast" },
			{ id: "iast" },
			{
				id: "ssrf",
				sources: [
					{
						label: "OWASP — SSRF",
						href: "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery",
					},
				],
			},
			{
				id: "cve",
				sources: [{ label: "CVE.org", href: "https://www.cve.org/" }],
			},
			{
				id: "cvss",
				sources: [
					{ label: "FIRST — CVSS", href: "https://www.first.org/cvss/" },
				],
			},
			{
				id: "epss",
				sources: [
					{ label: "FIRST — EPSS", href: "https://www.first.org/epss/" },
				],
			},
			{
				id: "kev",
				sources: [
					{
						label: "CISA — KEV catalog",
						href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
					},
				],
			},
		],
	},
	{
		id: "privacy",
		iconClass: "fa-solid fa-user-lock",
		terms: [
			{
				id: "dpa",
				sources: [
					{
						label: "GDPR — Regulation (EU) 2016/679",
						href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
					},
				],
			},
			{
				id: "dpia",
				sources: [
					{
						label: "GDPR — Regulation (EU) 2016/679",
						href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
					},
				],
			},
		],
	},
	{
		id: "regulation",
		iconClass: "fa-solid fa-scale-balanced",
		terms: [
			{
				id: "dora",
				sources: [
					{
						label: "Regulation (EU) 2022/2554",
						href: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
					},
				],
			},
			{
				id: "pra",
				sources: [
					{
						label: "Bank of England — PRA",
						href: "https://www.bankofengland.co.uk/prudential-regulation",
					},
				],
			},
		],
	},
] as const satisfies readonly GlossaryCategoryDefinition[];

export function glossaryTermAnchor(termId: string) {
	return `term-${termId}`;
}

export function glossaryCategoryAnchor(categoryId: string) {
	return `category-${categoryId}`;
}
