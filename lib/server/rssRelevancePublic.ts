import { type FeedItem } from "../cisoThreatFeed";

const RELEVANCE_URL = "https://fastapi-sample.fastapicloud.dev/api/site/rss/v1";
const ID = /^[0-9a-f]{64}$/;
const REVISION = /^sha256:[0-9a-f]{64}$/;
const TAG = /^[a-z0-9][a-z0-9-]{1,63}$/;

export type ClassifiedDecision = {
  article_id: string;
  matched: string[];
};

export type ClassifiedFeed = {
  schemaVersion: 1;
  model: "rss-relevance";
  catalogRevision: string;
  promptVersion: number;
  items: ClassifiedDecision[];
};

/** Fail closed on malformed classifications; never trust a public API blindly. */
export function validClassifiedFeed(value: unknown): value is ClassifiedFeed {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (
    data.schemaVersion !== 1 ||
    data.model !== "rss-relevance" ||
    typeof data.catalogRevision !== "string" ||
    !REVISION.test(data.catalogRevision) ||
    !Number.isSafeInteger(data.promptVersion) ||
    Number(data.promptVersion) < 1 ||
    !Array.isArray(data.items) ||
    data.items.length > 150
  ) return false;
  const seen = new Set<string>();
  return data.items.every((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const entry = item as Record<string, unknown>;
    if (
      Object.keys(entry).sort().join(",") !== "article_id,matched" ||
      typeof entry.article_id !== "string" ||
      !ID.test(entry.article_id) ||
      seen.has(entry.article_id) ||
      !Array.isArray(entry.matched) ||
      entry.matched.length < 1 ||
      entry.matched.length > 8 ||
      !entry.matched.every((tag: unknown) => typeof tag === "string" && TAG.test(tag))
    ) return false;
    seen.add(entry.article_id);
    return true;
  });
}

/** Join only with the separate FreshRSS allowlist, never publish Cloud titles or URLs. */
export function joinClassifiedArticles(
  articles: FeedItem[],
  classified: ClassifiedFeed,
): FeedItem[] {
  const decisions = new Map(
    classified.items.map((row) => [row.article_id, row.matched]),
  );
  return articles.flatMap((article) => {
    const id = article.rssId;
    const matched = id && decisions.get(id);
    return matched ? [{ ...article, aiTechnologies: matched }] : [];
  });
}

/** Optional server-only AI source; a 404/503 leaves the existing reader untouched. */
export async function fetchClassifiedFeed(): Promise<ClassifiedFeed | null> {
  if (process.env.FRESHRSS_AI_SELECTION_ENABLED !== "true") return null;
  try {
    const response = await fetch(RELEVANCE_URL, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(2500),
      headers: { Accept: "application/json" },
    });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > 40000) return null;
    const source = await response.text();
    if (source.length > 40000) return null;
    const value: unknown = JSON.parse(source);
    return validClassifiedFeed(value) ? value : null;
  } catch {
    return null;
  }
}
