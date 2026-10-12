import { NextResponse } from "next/server";
import { normalizeArticle, type FeedItem } from "@/lib/cisoThreatFeed";

// Explicit outbound origin, never derived from a query parameter: mitigate SSRF.
const ORIGIN = "https://freshrss.albandrieu.com";
export const runtime = "nodejs";

type GReaderEntry = {
  title?: string;
  canonical?: Array<{ href?: string }>;
  alternate?: Array<{ href?: string }>;
  origin?: { title?: string };
  published?: number;
  summary?: { content?: string };
  content?: { content?: string };
};

export async function GET() {
  const auth = process.env.FRESHRSS_GREADER_AUTH;
  // IMPORTANT: This is a PUBLIC endpoint. Provision a dedicated account with
  // only public security subscriptions; never use a personal FreshRSS account.
  if (!auth) {
    return NextResponse.json(
      { items: [], mode: "unconfigured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const headers: Record<string, string> = {
    Authorization: "GoogleLogin auth=" + auth,
    Accept: "application/json",
  };
  const accessId = process.env.FRESHRSS_CF_ACCESS_CLIENT_ID;
  const accessSecret = process.env.FRESHRSS_CF_ACCESS_CLIENT_SECRET;
  if (accessId && accessSecret) {
    headers["CF-Access-Client-Id"] = accessId;
    headers["CF-Access-Client-Secret"] = accessSecret;
  }
  try {
    const response = await fetch(
      ORIGIN + "/api/greader.php/reader/api/0/stream/contents/reading-list?output=json&n=100",
      { headers, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8500) },
    );
    const length = Number(response.headers.get("content-length") ?? "0");
    if (!response.ok || length > 1_500_000) throw new Error("Upstream unavailable or oversized");
    const raw = await response.text();
    if (raw.length > 1_500_000) throw new Error("Upstream oversized");
    const parsed = JSON.parse(raw) as { items?: GReaderEntry[] };
    if (!Array.isArray(parsed.items)) throw new Error("Malformed GReader response");
    const items: FeedItem[] = parsed.items.slice(0, 100).flatMap((entry) => {
      const published = typeof entry.published === "number" && Number.isFinite(entry.published)
        ? new Date(entry.published * 1000)
        : undefined;
      const item = normalizeArticle({
        title: entry.title,
        link: entry.canonical?.[0]?.href ?? entry.alternate?.[0]?.href,
        source: entry.origin?.title,
        pubDate: published && !Number.isNaN(published.getTime()) ? published.toISOString() : undefined,
        summary: entry.summary?.content ?? entry.content?.content,
      });
      return item ? [item] : [];
    });
    return NextResponse.json(
      { items, mode: "freshrss" },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=300",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    // Do not expose tokens or upstream diagnostic payloads to public visitors.
    return NextResponse.json(
      { items: [], mode: "unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
