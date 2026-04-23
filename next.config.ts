import path from "node:path";

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { MARKETING_PAGES } from "./lib/marketingPages";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const localePrefixes = ["en", "fr"] as const;

const marketingSlugs = Object.keys(MARKETING_PAGES);

/** Serve marketing HTML under `*.html` URLs: rewrite to App Router before `public/*.html` wins. */
const marketingHtmlBeforeFiles = marketingSlugs.flatMap((slug) => [
	{ source: `/${slug}.html`, destination: `/en/${slug}` },
	{ source: `/fr/${slug}.html`, destination: `/fr/${slug}` },
]);

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

const nextConfig: NextConfig = {
	reactStrictMode: true,
	/** Parent `package-lock.json` exists; pin app root so Turbopack does not infer the wrong workspace. */
	turbopack: {
		root: path.resolve(process.cwd()),
	},
	async redirects() {
		return marketingHtmlRedirects;
	},
	async rewrites() {
		return {
			beforeFiles: marketingHtmlBeforeFiles,
			afterFiles: [...localizedPolicyRewrites, ...policyRewrites],
		};
	},
};

export default withNextIntl(nextConfig);
