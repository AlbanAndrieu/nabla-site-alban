import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

export type HtmlExtractMode =
	| "body"
	| "main"
	| "headerMain"
	/** Breadcrumb `<nav class="…page-nav…">` through `</main>` (TrueNAS: homelab cards live in `<header>`). */
	| "navHeaderMain"
	| "mainOuter";
export type SiteLocale = "en" | "fr";

const DEFAULT_LOCALE: SiteLocale = "en";
const SUPPORTED_LOCALES: readonly SiteLocale[] = ["en", "fr"];

export const HOME_JSON_LD = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: "Alban Andrieu",
	jobTitle: "Freelance DevSecOps Engineer & Cloud Architect",
	description:
		"Freelance DevSecOps engineer and cloud architect (AWS, Azure, OVH). Cloud security consultant for AI-driven and security-critical products; ISO 27001, SOC 2, GDPR-aligned delivery.",
	url: "https://albandrieu.com/",
	email: "job@albandrieu.com",
	sameAs: [
		"https://www.linkedin.com/in/nabla/",
		"https://twitter.com/AlbanAndrieu",
		"https://github.com/AlbanAndrieu",
	],
	knowsAbout: [
		"Freelance DevSecOps",
		"Cloud architecture",
		"AWS",
		"Azure",
		"OVHcloud",
		"Cloud security",
		"AI infrastructure",
		"MLOps",
		"ISO 27001",
		"SOC 2",
	],
	hasCredential: [
		{
			"@type": "EducationalOccupationalCredential",
			name: "LinkedIn Professional Profile",
			url: "https://www.linkedin.com/in/nabla/",
		},
	],
	subjectOf: [
		{
			"@type": "DigitalDocument",
			name: "LaTeX Resume PDF",
			description: "Traditional formatted resume in PDF format",
			url: "https://albandrieu.com/cv/cv-aandrieu-2026.pdf",
			encodingFormat: "application/pdf",
		},
		{
			"@type": "DigitalDocument",
			name: "LinkedIn Resume PDF",
			description: "LinkedIn profile exported as PDF",
			url: "https://albandrieu.com/cv/linkedin/cv-aandrieu-linkedin-2026-01-01.pdf",
			encodingFormat: "application/pdf",
		},
		{
			"@type": "WebPage",
			name: "Online CV Landing Page",
			description: "Interactive web-based CV and professional profile",
			url: "https://albandrieu.com/cv/index.html",
		},
	],
};

export const HOME_JSON_LD_FR = {
	...HOME_JSON_LD,
	jobTitle: "Ingénieur DevSecOps freelance et architecte cloud",
	description:
		"Ingénieur DevSecOps freelance et architecte cloud (AWS, Azure, OVH). Consultant en sécurité cloud pour produits pilotés par l’IA et à enjeux sécurité ; livraisons alignées ISO 27001, SOC 2 et RGPD.",
	knowsAbout: [
		"DevSecOps freelance",
		"Architecture cloud",
		"AWS",
		"Azure",
		"OVHcloud",
		"Sécurité cloud",
		"Infrastructure IA",
		"MLOps",
		"ISO 27001",
		"SOC 2",
	],
	hasCredential: [
		{
			"@type": "EducationalOccupationalCredential",
			name: "Profil professionnel LinkedIn",
			url: "https://www.linkedin.com/in/nabla/",
		},
	],
	subjectOf: [
		{
			"@type": "DigitalDocument",
			name: "CV LaTeX (PDF)",
			description: "CV classique au format PDF",
			url: "https://albandrieu.com/cv/cv-aandrieu-2026.pdf",
			encodingFormat: "application/pdf",
		},
		{
			"@type": "DigitalDocument",
			name: "CV LinkedIn (PDF)",
			description: "Profil LinkedIn exporté en PDF",
			url: "https://albandrieu.com/cv/linkedin/cv-aandrieu-linkedin-2026-01-01.pdf",
			encodingFormat: "application/pdf",
		},
		{
			"@type": "WebPage",
			name: "Page CV en ligne",
			description: "CV interactif et profil professionnel",
			url: "https://albandrieu.com/cv/index.html",
		},
	],
};

function decodeBasicEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

function normalizeLocale(locale?: string): SiteLocale {
	if (locale && SUPPORTED_LOCALES.includes(locale as SiteLocale)) {
		return locale as SiteLocale;
	}
	return DEFAULT_LOCALE;
}

function getLocalePathPrefix(locale?: string): string {
	const normalized = normalizeLocale(locale);
	return normalized === DEFAULT_LOCALE ? "" : `/${normalized}`;
}

function withLocalePrefix(pathname: string, locale?: string): string {
	if (/^\/(en|fr)(\/|$)/.test(pathname)) {
		return pathname;
	}
	const prefix = getLocalePathPrefix(locale);
	if (!prefix) {
		return pathname;
	}
	return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function rewriteOneHref(
	quote: '"' | "'",
	raw: string,
	locale?: string,
): string {
	const href = raw.trim();
	if (
		/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(href) ||
		href.length === 0
	) {
		return `href=${quote}${raw}${quote}`;
	}

	const ref = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
	let pathPart = ref?.[1] ?? href;
	const query = ref?.[2] ?? "";
	const hash = ref?.[3] ?? "";

	while (pathPart.startsWith("../")) pathPart = pathPart.slice(3);
	while (pathPart.startsWith("./")) pathPart = pathPart.slice(2);

	if (!pathPart.endsWith(".html")) {
		return `href=${quote}${raw}${quote}`;
	}

	/** Keep static-style `.html` URLs; only add locale prefix when needed (Next rewrites these to `[locale]/[slug]`). */
	const localizedOut = withLocalePrefix(pathPart, locale);
	return `href=${quote}${localizedOut}${query}${hash}${quote}`;
}

function rewriteOneSrc(quote: '"' | "'", raw: string): string {
	const src = raw.trim();
	if (
		/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(src) ||
		src.length === 0 ||
		src.startsWith("/")
	) {
		return `src=${quote}${raw}${quote}`;
	}

	let pathPart = src;
	const ref = src.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
	if (ref) pathPart = ref[1] ?? src;
	const query = ref?.[2] ?? "";
	const hash = ref?.[3] ?? "";

	while (pathPart.startsWith("../")) pathPart = pathPart.slice(3);
	while (pathPart.startsWith("./")) pathPart = pathPart.slice(2);

	return `src=${quote}/${pathPart}${query}${hash}${quote}`;
}

/** Rewrite internal *.html links: add locale prefix only (paths stay `*.html`). */
export function rewriteLegacyHtmlHrefs(
	fragment: string,
	locale?: string,
): string {
	let out = fragment.replace(/\bhref="([^"]*)"/gi, (_full, raw: string) =>
		rewriteOneHref('"', raw, locale),
	);
	out = out.replace(/\bhref='([^']*)'/gi, (_full, raw: string) =>
		rewriteOneHref("'", raw, locale),
	);
	out = out.replace(/\bsrc="([^"]*)"/gi, (_full, raw: string) =>
		rewriteOneSrc('"', raw),
	);
	out = out.replace(/\bsrc='([^']*)'/gi, (_full, raw: string) =>
		rewriteOneSrc("'", raw),
	);
	return out;
}

async function resolvePublicFilePath(
	file: string,
	locale?: string,
): Promise<string> {
	const normalizedLocale = normalizeLocale(locale);
	if (normalizedLocale !== DEFAULT_LOCALE) {
		const localized = path.join(
			process.cwd(),
			"public",
			"locales",
			normalizedLocale,
			file,
		);
		try {
			await access(localized);
			return localized;
		} catch {
			// Fallback to English source under public/.
		}
	}
	return path.join(process.cwd(), "public", file);
}

export async function loadPublicHtmlFragment(
	file: string,
	mode: HtmlExtractMode,
	locale?: string,
): Promise<string> {
	const full = await resolvePublicFilePath(file, locale);
	const html = await readFile(full, "utf8");
	let fragment = "";

	try {
		if (mode === "body") {
			const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
			fragment = (m?.[1] ?? "").replace(
				/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
				"",
			);
		} else if (mode === "main") {
			const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
			fragment = m?.[1] ?? "";
		} else if (mode === "headerMain") {
			// Allow comments/other nodes between <\/header> and <main>.
			const m = html.match(
				/<header[^>]*>[\s\S]*?<\/header>[\s\S]*?<main[^>]*>[\s\S]*?<\/main>/i,
			);
			fragment = m?.[0] ? `<div class="site-content-page">${m[0]}</div>` : "";
		} else if (mode === "navHeaderMain") {
			const m = html.match(/<nav[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/main>/i);
			fragment = m?.[0] ?? "";
		} else {
			const m = html.match(/<main[^>]*>[\s\S]*?<\/main>/i);
			fragment = m?.[0] ?? "";
		}
	} catch (err) {
		console.error(
			`Error extracting HTML for file: ${file}, mode: ${mode}, locale: ${locale}`,
			err,
		);
		throw err;
	}

	if (!fragment) {
		console.warn(
			`[loadPublicHtmlFragment] EMPTY FRAGMENT for file: ${file} (mode: ${mode}, locale: ${locale})`,
		);
	}

	console.log(
		`[loadPublicHtmlFragment] file: ${file} mode: ${mode} locale: ${locale} => extracted length: ${fragment.length}`,
	);

	return rewriteLegacyHtmlHrefs(fragment, locale);
}

export async function metadataFromPublicHtml(
	file: string,
	canonicalPath: string,
	locale?: string,
): Promise<Metadata> {
	const full = await resolvePublicFilePath(file, locale);
	const html = await readFile(full, "utf8");
	const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
	const descMatch = html.match(
		/<meta\s+name="description"\s+content="([^"]*)"/i,
	);
	const title = titleMatch?.[1]
		? decodeBasicEntities(titleMatch[1].trim())
		: undefined;
	const description = descMatch?.[1]
		? decodeBasicEntities(descMatch[1].trim())
		: undefined;

	const normalizedPath = canonicalPath.startsWith("/")
		? canonicalPath
		: `/${canonicalPath}`;
	const canonical = `https://albandrieu.com${withLocalePrefix(normalizedPath, locale)}`;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: title
			? { title, description, url: canonical }
			: { url: canonical },
	};
}
