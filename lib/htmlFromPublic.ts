import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

export type HtmlExtractMode = "main" | "headerMain" | "mainOuter";
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

	const noExt = pathPart.slice(0, -5);
	const segments = noExt.split("/").filter(Boolean);
	const last = segments[segments.length - 1];
	let out: string;
	if (last === "index") {
		segments.pop();
		out = segments.length ? `/${segments.join("/")}` : "/";
	} else {
		out = `/${noExt.replace(/^\/+/, "")}`;
	}

	const localizedOut = withLocalePrefix(out, locale);
	return `href=${quote}${localizedOut}${query}${hash}${quote}`;
}

/** Rewrite internal *.html links to clean paths for the Next.js app. */
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
		const m = html.match(
			/<header[^>]*>[\s\S]*?<\/header>\s*<main[^>]*>[\s\S]*?<\/main>/i,
		);
		fragment = m?.[0] ? `<div class="site-content-page">${m[0]}</div>` : "";
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
