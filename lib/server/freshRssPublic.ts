import { type FeedItem, normalizeArticle } from "@/lib/cisoThreatFeed";

const FRESHRSS_ORIGIN = "https://freshrss.albandrieu.com";
const CONTENT_LIMIT = 1_500_000;

type GReaderEntry = {
	title?: string;
	canonical?: Array<{ href?: string }>;
	alternate?: Array<{ href?: string }>;
	origin?: { title?: string };
	published?: number;
	summary?: { content?: string };
	content?: { content?: string };
};

/** Only a purpose-built public security account may ever be used here. */
export async function fetchFreshRssPublicArticles(): Promise<FeedItem[] | null> {
	const auth = process.env.FRESHRSS_GREADER_AUTH;
	if (!auth || process.env.FRESHRSS_PUBLICATION_ENABLED !== "true") return null;

	const headers: Record<string, string> = {
		Authorization: "GoogleLogin auth=" + auth,
		Accept: "application/json",
	};
	const id = process.env.FRESHRSS_CF_ACCESS_CLIENT_ID;
	const secret = process.env.FRESHRSS_CF_ACCESS_CLIENT_SECRET;
	if (id && secret) {
		headers["CF-Access-Client-Id"] = id;
		headers["CF-Access-Client-Secret"] = secret;
	}
	const response = await fetch(
		`${FRESHRSS_ORIGIN}/api/greader.php/reader/api/0/stream/contents/reading-list?output=json&n=100`,
		{
			headers,
			redirect: "error",
			cache: "no-store",
			signal: AbortSignal.timeout(8500),
		},
	);
	if (!response.ok || Number(response.headers.get("content-length") || "0") > CONTENT_LIMIT) {
		throw new Error("Public security feed upstream unavailable");
	}
	const raw = await response.text();
	if (raw.length > CONTENT_LIMIT) throw new Error("Public security feed exceeds size budget");
	const data = JSON.parse(raw) as { items?: GReaderEntry[] };
	if (!Array.isArray(data.items)) throw new Error("Invalid public security feed response");
	return data.items.slice(0, 100).flatMap((entry) => {
		const published = typeof entry.published === "number"
			? new Date(entry.published * 1000)
			: null;
		const article = normalizeArticle({
			title: entry.title,
			link: entry.canonical?.[0]?.href ?? entry.alternate?.[0]?.href,
			source: entry.origin?.title,
			pubDate: published && Number.isFinite(published.getTime())
				? published.toISOString() : undefined,
			summary: entry.summary?.content ?? entry.content?.content,
		});
		return article ? [article] : [];
	});
}
