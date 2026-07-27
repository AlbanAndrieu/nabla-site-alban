import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

import { MARKETING_PAGE_SLUGS } from "./lib/marketingPages.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const localePrefixes = ["en", "fr"];

const marketingSlugs = MARKETING_PAGE_SLUGS;

/** Serve marketing HTML under `*.html` URLs: rewrite to App Router before `public/*.html` wins. */
const marketingHtmlBeforeFiles = marketingSlugs
	.flatMap((slug) => [
		{ source: `/${slug}.html`, destination: `/en/${slug}` },
		{ source: `/en/${slug}.html`, destination: `/en/${slug}` },
		{ source: `/fr/${slug}.html`, destination: `/fr/${slug}` },
	])
	.concat([
		{ source: `/ai.html`, destination: `/en/ai` },
		{ source: `/fr/ai.html`, destination: `/fr/ai` },
		{ source: `/cancel.html`, destination: `/en/cancel` },
		{ source: `/fr/cancel.html`, destination: `/fr/cancel` },
	]);

/** Home legacy URLs → localized home routes. */
const homeHtmlBeforeFiles = [
	{ source: "/index.html", destination: "/en" },
	{ source: "/fr/index.html", destination: "/fr" },
];

/** Extensionless marketing URLs → canonical `*.html` (browser URL matches static hosting). */
const marketingHtmlRedirects = marketingSlugs.flatMap((slug) => [
	{ source: `/${slug}`, destination: `/${slug}.html`, permanent: true },
	{ source: `/fr/${slug}`, destination: `/fr/${slug}.html`, permanent: true },
]);

const policyRewrites = [
	"legal",
	"impressum",
	"privacy_policy",
	"service_terms",
	"cookie_policy",
	"accessibility_statement",
].map((name) => ({
	source: `/policy/${name}`,
	destination: `/policy/${name}.html`,
}));

const localizedPolicyRewrites = localePrefixes.flatMap((locale) =>
	policyRewrites.map((rewrite) => ({
		source: `/${locale}${rewrite.source}`,
		destination: rewrite.destination,
	})),
);

const nextConfig = {
	reactStrictMode: true,
	allowedDevOrigins: ["172.17.0.57"],
	/** Parent `package-lock.json` exists; pin app root so Turbopack does not infer the wrong workspace. */
	turbopack: {
		root: __dirname,
	},
	async redirects() {
		return marketingHtmlRedirects;
	},
	async rewrites() {
		return {
			beforeFiles: [...homeHtmlBeforeFiles, ...marketingHtmlBeforeFiles],
			afterFiles: [...localizedPolicyRewrites, ...policyRewrites],
		};
	},
};

export default withNextIntl(nextConfig);
