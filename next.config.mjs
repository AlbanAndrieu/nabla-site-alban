import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

import { HTML_ROUTE_SLUGS } from "./lib/htmlRoutes.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const localePrefixes = ["en", "fr"];

/** Serve legacy root HTML under `*.html` URLs through App Router before `public/*.html` wins. */
const htmlPageBeforeFiles = HTML_ROUTE_SLUGS.flatMap((slug) => [
	{ source: `/${slug}.html`, destination: `/en/${slug}` },
	{ source: `/en/${slug}.html`, destination: `/en/${slug}` },
	{ source: `/fr/${slug}.html`, destination: `/fr/${slug}` },
]).concat([
	{ source: `/ai.html`, destination: `/en/ai` },
	{ source: `/fr/ai.html`, destination: `/fr/ai` },
	{ source: `/cancel.html`, destination: `/en/cancel` },
	{ source: `/fr/cancel.html`, destination: `/fr/cancel` },
	{ source: `/ciso.html`, destination: `/en/ciso` },
	{ source: `/fr/ciso.html`, destination: `/fr/ciso` },
]);

/** Home legacy URLs → localized home routes. */
const homeHtmlBeforeFiles = [
	{ source: "/index.html", destination: "/en" },
	{ source: "/fr/index.html", destination: "/fr" },
];

/** Keep legacy CV entry points on the maintained App Router page. */
const cvIndexBeforeFiles = [
	{ source: "/cv/index.html", destination: "/en/cv" },
	{ source: "/en/cv/index.html", destination: "/en/cv" },
	{ source: "/fr/cv/index.html", destination: "/fr/cv" },
];

/** Extensionless content URLs → canonical `*.html` (browser URL matches static hosting). */
const canonicalHtmlRedirects = HTML_ROUTE_SLUGS.flatMap((slug) => [
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
	experimental: {
		/** Keep concise repository agent instructions instead of regenerating large context files. */
		agentRules: false,
		/** Required because the root layout lives below the dynamic `[locale]` segment. */
		globalNotFound: true,
	},
	allowedDevOrigins: ["172.17.0.57"],
	/** Parent `package-lock.json` exists; pin app root so Turbopack does not infer the wrong workspace. */
	turbopack: {
		root: __dirname,
	},
	async redirects() {
		return canonicalHtmlRedirects;
	},
	async rewrites() {
		return {
			beforeFiles: [
				...homeHtmlBeforeFiles,
				...cvIndexBeforeFiles,
				...htmlPageBeforeFiles,
			],
			afterFiles: [...localizedPolicyRewrites, ...policyRewrites],
		};
	},
};

export default withNextIntl(nextConfig);
