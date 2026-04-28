import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

export type HtmlExtractMode =
	| "main"
	| "headerMain"
	/** Breadcrumb `<nav class="…page-nav…">` through `</main>` (TrueNAS: homelab cards live in `<header>`). */
	| "navHeaderMain"
	| "mainOuter";
export type SiteLocale = "en" | "fr";

const DEFAULT_LOCALE: SiteLocale = "en";
const SUPPORTED_LOCALES: readonly SiteLocale[] = ["en", "fr"];

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

function rewriteOneSrc(
	quote: '"' | "'",
	raw: string,
): string {
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

	if (mode === "main") {
		const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
		fragment = m?.[1] ?? "";
	} else if (mode === "headerMain") {
		// Allow comments/other nodes between </header> and <main>.
		const m = html.match(
			/<header[^>]*>[\s\S]*?<\/header>[\s\S]*?<main[^>]*>[\s\S]*?<\/main>/i,
		);
		fragment = m?.[0] ? `<div class="site-content-page">${m[0]}</div>` : "";
	} else if (mode === "navHeaderMain") {
		const m = html.match(
			/<nav[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/main>/i,
		);
		fragment = m?.[0] ?? "";
	} else {
		const m = html.match(/<main[^>]*>[\s\S]*?<\/main>/i);
		fragment = m?.[0] ?? "";
	}

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
	const canonical = `https://dr-alban.com${withLocalePrefix(normalizedPath, locale)}`;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: title
			? { title, description, url: canonical }
			: { url: canonical },
	};
}
