import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

import {
	HTML_ROUTE_SLUGS,
	SEO_HTML_MIGRATION_SLUGS,
} from "./lib/htmlRoutes.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** Non-SEO legacy HTML routes that still render through App Router. */
const htmlPageBeforeFiles = HTML_ROUTE_SLUGS.flatMap((slug) => [
	{ source: `/${slug}.html`, destination: `/en/${slug}` },
	{ source: `/en/${slug}.html`, destination: `/en/${slug}` },
	{ source: `/fr/${slug}.html`, destination: `/fr/${slug}` },
]);

/** Old SEO `*.html` URLs permanently move to their clean canonical routes. */
const seoHtmlRedirects = SEO_HTML_MIGRATION_SLUGS.flatMap((slug) => [
	{ source: `/${slug}.html`, destination: `/${slug}`, permanent: true },
	{ source: `/en/${slug}.html`, destination: `/${slug}`, permanent: true },
	{ source: `/fr/${slug}.html`, destination: `/fr/${slug}`, permanent: true },
]);

/** Historical SEO entry points that already had extensionless canonicals. */
const seoIndexRedirects = [
	{ source: "/index.html", destination: "/", permanent: true },
	{ source: "/en/index.html", destination: "/", permanent: true },
	{ source: "/fr/index.html", destination: "/fr", permanent: true },
	{ source: "/cv/index.html", destination: "/cv", permanent: true },
	{ source: "/en/cv/index.html", destination: "/cv", permanent: true },
	{ source: "/fr/cv/index.html", destination: "/fr/cv", permanent: true },
];

/** Non-SEO extensionless URLs keep their legacy HTML canonical form for now. */
const canonicalHtmlRedirects = HTML_ROUTE_SLUGS.flatMap((slug) => [
	{ source: `/${slug}`, destination: `/${slug}.html`, permanent: true },
	{ source: `/fr/${slug}`, destination: `/fr/${slug}.html`, permanent: true },
]);

const policyNames = [
	"legal",
	"impressum",
	"privacy_policy",
	"service_terms",
	"cookie_policy",
	"accessibility_statement",
];

/** Policy HTML files remain archival sources; public navigation uses native clean routes. */
const policyHtmlRedirects = policyNames.flatMap((name) => [
	{ source: `/policy/${name}.html`, destination: `/policy/${name}`, permanent: true },
	{ source: `/en/policy/${name}.html`, destination: `/policy/${name}`, permanent: true },
	{ source: `/fr/policy/${name}.html`, destination: `/fr/policy/${name}`, permanent: true },
]);

const nextConfig = {
	reactStrictMode: true,
	experimental: {
		/** Required because the root layout lives below the dynamic `[locale]` segment. */
		globalNotFound: true,
	},
	allowedDevOrigins: ["172.17.0.57"],
	/** Parent `package-lock.json` exists; pin app root so Turbopack does not infer the wrong workspace. */
	turbopack: {
		root: __dirname,
	},
	async redirects() {
		return [
			...seoHtmlRedirects,
			...seoIndexRedirects,
			...canonicalHtmlRedirects,
			...policyHtmlRedirects,
		];
	},
	async rewrites() {
		return {
			beforeFiles: [...htmlPageBeforeFiles],
			afterFiles: [],
		};
	},
};

export default withNextIntl(nextConfig);
