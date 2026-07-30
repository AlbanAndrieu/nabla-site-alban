import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

import {
  extractDocumentMetadata,
  rewriteLegacyHtmlHrefs,
} from "@/lib/htmlFromPublic";

export type CvLocale = "en" | "fr";

const CV_HTML_FILES = {
  "cv/index.html": path.join(process.cwd(), "public/cv/index.html"),
  "cv/cv-full-de.html": path.join(process.cwd(), "public/cv/cv-full-de.html"),
  "cv/cv-full-en.html": path.join(process.cwd(), "public/cv/cv-full-en.html"),
  "cv/cv-full-fr.html": path.join(process.cwd(), "public/cv/cv-full-fr.html"),
  "cv/cv-full-no.html": path.join(process.cwd(), "public/cv/cv-full-no.html"),
  "cv/cv-large-de.html": path.join(process.cwd(), "public/cv/cv-large-de.html"),
  "cv/cv-large-en.html": path.join(process.cwd(), "public/cv/cv-large-en.html"),
  "cv/cv-large-fr.html": path.join(process.cwd(), "public/cv/cv-large-fr.html"),
  "cv/cv-large-no.html": path.join(process.cwd(), "public/cv/cv-large-no.html"),
  "cv/cv-medium-de.html": path.join(
    process.cwd(),
    "public/cv/cv-medium-de.html",
  ),
  "cv/cv-medium-en.html": path.join(
    process.cwd(),
    "public/cv/cv-medium-en.html",
  ),
  "cv/cv-medium-fr.html": path.join(
    process.cwd(),
    "public/cv/cv-medium-fr.html",
  ),
  "cv/cv-medium-no.html": path.join(
    process.cwd(),
    "public/cv/cv-medium-no.html",
  ),
  "cv/cv-small-de.html": path.join(process.cwd(), "public/cv/cv-small-de.html"),
  "cv/cv-small-en.html": path.join(process.cwd(), "public/cv/cv-small-en.html"),
  "cv/cv-small-fr.html": path.join(process.cwd(), "public/cv/cv-small-fr.html"),
  "cv/cv-small-no.html": path.join(process.cwd(), "public/cv/cv-small-no.html"),
  "cv/linkedin/cv-aandrieu-linkedin-2026-en.html": path.join(
    process.cwd(),
    "public/cv/linkedin/cv-aandrieu-linkedin-2026-en.html",
  ),
} as const;

type CvHtmlFile = keyof typeof CV_HTML_FILES;

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

  const raw = CV_HTML_FILES[rel as CvHtmlFile];
  if (raw && (await exists(raw))) return raw;

  // If it ends with -en.html/-fr.html, try the requested locale variant.
  if (/-(en|fr)\.html$/.test(rel)) {
    const localizedRel = rel.replace(
      /-(en|fr)\.html$/,
      `-${normalizedLocale}.html`,
    ) as CvHtmlFile;
    const localized = CV_HTML_FILES[localizedRel];
    if (localized && (await exists(localized))) return localized;
  }

  return null;
}

/**
 * Transitional renderer for the detailed static CV variants linked from the
 * React CV landing page. Keep this loader until those documents are migrated;
 * the explicit allowlist prevents arbitrary filesystem reads.
 */
export async function loadCvHtmlFragment(
  urlPath: string[],
  locale?: string,
): Promise<{ html: string; file: string }> {
  const fullPath = await resolveCvPublicFilePath(urlPath, locale);
  if (!fullPath) {
    throw new Error("CV file not found");
  }
  const raw = await readFile(fullPath, "utf8");

  // CV pages are full HTML docs; embed their <body> content if present.
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = (bodyMatch?.[1] ?? raw).replace(
    /<nav\b[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );

  return {
    file: path.relative(path.join(process.cwd(), "public"), fullPath),
    html: rewriteLegacyHtmlHrefs(body, locale),
  };
}

export async function metadataFromCvHtml(
  urlPath: string[],
  canonicalPath: string,
  locale?: string,
): Promise<Metadata> {
  const fullPath = await resolveCvPublicFilePath(urlPath, locale);
  if (!fullPath) return {};
  const raw = await readFile(fullPath, "utf8");
  const { title, description } = extractDocumentMetadata(raw);

  const normalizedPath = canonicalPath.startsWith("/")
    ? canonicalPath
    : `/${canonicalPath}`;
  const canonical = `https://albanandrieu.com${normalizedPath}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: title
      ? { title, description, url: canonical }
      : { url: canonical },
  };
}
