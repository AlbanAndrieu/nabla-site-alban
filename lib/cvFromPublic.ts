import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

import { rewriteLegacyHtmlHrefs } from "@/lib/htmlFromPublic";

export type CvLocale = "en" | "fr";

function normalizeCvLocale(locale?: string): CvLocale {
	return locale === "fr" ? "fr" : "en";
}

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function resolveCvPublicFilePath(
	urlPath: string[],
	locale?: string,
): Promise<string | null> {
	const normalizedLocale = normalizeCvLocale(locale);

	const rel =
		urlPath.length === 0 ? "cv/index.html" : `cv/${urlPath.join("/")}`;

	// Keep nested directories (e.g. cv/jusmundi/index.html) as-is.
	if (rel.includes("/")) {
		const raw = path.join(process.cwd(), "public", rel);
		if (await exists(raw)) return raw;

		// If it ends with -en.html/-fr.html, try the requested locale variant.
		if (/-(en|fr)\.html$/.test(rel)) {
			const base = rel.replace(/-(en|fr)\.html$/, "");
			const localized = path.join(
				process.cwd(),
				"public",
				`${base}-${normalizedLocale}.html`,
			);
			if (await exists(localized)) return localized;
		}
		return null;
	}

	return null;
}

/*
export async function loadCvHtmlFragment(
	urlPath: string[],
	locale?: string,
): Promise<{ html: string; file: string }> {
	const fullPath = await resolveCvPublicFilePath(urlPath, locale);
	if (!fullPath) {
		throw new Error("CV file not found");
	}
	const file = path.relative(path.join(process.cwd(), "public"), fullPath);
	const raw = await readFile(fullPath, "utf8");

	// CV pages are full HTML docs; embed their <body> content if present.
	const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	const body = bodyMatch?.[1] ?? raw;

	return {
		file,
		html: rewriteLegacyHtmlHrefs(body, locale),
	};
}
*/

export async function metadataFromCvHtml(
	urlPath: string[],
	canonicalPath: string,
	locale?: string,
): Promise<Metadata> {
	const fullPath = await resolveCvPublicFilePath(urlPath, locale);
	if (!fullPath) return {};
	const raw = await readFile(fullPath, "utf8");
	const titleMatch = raw.match(/<title>([^<]*)<\/title>/i);
	const descMatch = raw.match(
		/<meta\s+name="description"\s+content="([^"]*)"/i,
	);
	const title = titleMatch?.[1]?.trim();
	const description = descMatch?.[1]?.trim();

	const normalizedPath = canonicalPath.startsWith("/")
		? canonicalPath
		: `/${canonicalPath}`;
	const canonical = `https://dr-alban.com${normalizedPath}`;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: title
			? { title, description, url: canonical }
			: { url: canonical },
	};
}
