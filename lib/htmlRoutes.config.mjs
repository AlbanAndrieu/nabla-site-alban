// Plain ESM so next.config.mjs can consume routing compatibility lists.
// SEO policy lives in sitePageCatalog.ts; the test suite keeps both lists aligned.

// SEO pages that historically used `*.html` canonicals and now migrate to clean URLs.
export const SEO_HTML_MIGRATION_SLUGS = [
	"expertise",
	"contact",
	"security",
	"ai",
	"ciso",
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
	"ctid",
	"login",
	"freenas",
	"test",
];
