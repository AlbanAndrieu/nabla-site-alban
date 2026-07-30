import { access, readFile } from "node:fs/promises";
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

const PUBLIC_HTML_FILES = [
	"404.html",
	"ai.html",
	"cancel.html",
	"checkout.html",
	"ciso.html",
	"contact.html",
	"ctid.html",
	"cv/index.html",
	"email.html",
	"expertise.html",
	"freenas.html",
	"index.html",
	"link.html",
	"login.html",
	"nabla.html",
	"payment.html",
	"pricing.html",
	"security.html",
	"startup-thanks.html",
	"startup.html",
	"success.html",
	"test.html",
	"truenas.html",
	"workstation.html",
] as const;

type PublicHtmlFile = (typeof PUBLIC_HTML_FILES)[number];

function isPublicHtmlFile(file: string): file is PublicHtmlFile {
	return PUBLIC_HTML_FILES.includes(file as PublicHtmlFile);
}

function publicHtmlUrl(file: PublicHtmlFile, locale: SiteLocale): URL {
	const base = locale === "fr" ? "../public/locales/fr/" : "../public/";
	return new URL(`${base}${file}`, import.meta.url);
}

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

function htmlAttribute(tag: string, name: string): string | undefined {
	const match = tag.match(
		new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
	);
	return match?.[1] ?? match?.[2];
}

export function extractDocumentMetadata(html: string): {
	title?: string;
	description?: string;
} {
	const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
	const descriptionTag = (html.match(/<meta\b[^>]*>/gi) ?? []).find(
		(tag) => htmlAttribute(tag, "name")?.toLowerCase() === "description",
	);
	const rawDescription = descriptionTag
		? htmlAttribute(descriptionTag, "content")?.trim()
		: undefined;

	return {
		title: rawTitle ? decodeBasicEntities(rawTitle) : undefined,
		description: rawDescription
			? decodeBasicEntities(rawDescription)
			: undefined,
	};
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

	pathPart = `/${pathPart.replace(/^\/+/, "")}`;
	pathPart = pathPart.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");
	const localizedOut = withLocalePrefix(pathPart || "/", locale);
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
): Promise<URL> {
	if (!isPublicHtmlFile(file)) {
		throw new Error(`Unsupported public HTML file: ${file}`);
	}
	const normalizedLocale = normalizeLocale(locale);
	if (normalizedLocale !== DEFAULT_LOCALE) {
		const localized = publicHtmlUrl(file, normalizedLocale);
		try {
			await access(localized);
			return localized;
		} catch {
			// Fallback to English source under public/.
		}
	}
	return publicHtmlUrl(file, DEFAULT_LOCALE);
}

export async function loadPublicHtmlFragment(
	file: string,
	mode: HtmlExtractMode,
	locale?: string,
): Promise<string> {
	const full = await resolvePublicFilePath(file, locale);
	const html = await readFile(full, "utf8");
	let fragment = extractHtmlFragment(html, mode);

	if (!fragment.trim()) {
		throw new Error(
			`Empty HTML fragment: file=${file}, mode=${mode}, locale=${normalizeLocale(locale)}`,
		);
	}

	// App Router supplies the consistent route header; remove legacy page breadcrumbs.
	fragment = fragment.replace(
		/<nav\b[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/nav>/gi,
		"",
	);

	return rewriteLegacyHtmlHrefs(fragment, locale);
}

export function extractHtmlFragment(
	html: string,
	mode: HtmlExtractMode,
): string {
	switch (mode) {
		case "body":
			return (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "").replace(
				/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,
				"",
			);
		case "main":
			return html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
		case "headerMain": {
			// Allow comments and other nodes between </header> and <main>.
			return (
				html.match(
					/<header[^>]*>[\s\S]*?<\/header>[\s\S]*?<main[^>]*>[\s\S]*?<\/main>/i,
				)?.[0] ?? ""
			);
		}
		case "navHeaderMain":
			return (
				html.match(/<nav[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? ""
			);
		case "mainOuter":
			return html.match(/<main[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? "";
	}
}

export async function metadataFromPublicHtml(
	file: string,
	canonicalPath: string,
	locale?: string,
): Promise<Metadata> {
	const full = await resolvePublicFilePath(file, locale);
	const html = await readFile(full, "utf8");
	const { title, description } = extractDocumentMetadata(html);

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
