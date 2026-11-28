// Plain ESM so next.config.mjs can consume routing compatibility lists.
// SEO policy lives in sitePageCatalog.ts; the test suite keeps both lists aligned.

// SEO pages that historically used `*.html` canonicals and now migrate to clean URLs.
export const SEO_HTML_MIGRATION_SLUGS = [
	"expertise",
	"contact",
	"security",
	"ai",
	"truenas",
	"link",
	"email",
	"nabla",
];

// Non-SEO pages that still retain legacy `*.html` compatibility for now.
export const HTML_ROUTE_SLUGS = [
	"workstation",
	"startup",
	"startup-thanks",
	"pricing",
	"success",
	"cancel",
	"payment",
	"login",
	"freenas",
	"test",
];

// Former top-level security pages. All variants redirect in a single hop.
// CTID retains its noindex policy; CISO is indexed at its new canonical route.
export const SECURITY_MOVED_SLUGS = ["ciso", "ctid"];

export const SECURITY_ROUTE_REDIRECTS = SECURITY_MOVED_SLUGS.flatMap((slug) =>
	["", "/en", "/fr"].flatMap((prefix) =>
		["", ".html"].map((suffix) => ({
			source: `${prefix}/${slug}${suffix}`,
			destination: `${prefix === "/fr" ? "/fr" : ""}/security/${slug}`,
			permanent: true,
		})),
	),
);
