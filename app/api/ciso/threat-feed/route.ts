import { NextResponse } from "next/server";
import { fetchFreshRssPublicArticles, fetchFreshRssPublicSelection } from "@/lib/server/freshRssPublic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const allSources = new URL(request.url).searchParams.get("view") === "ctid";
		const articles = allSources ? await fetchFreshRssPublicArticles() : null;
		const selection = allSources
			? articles && { items: articles, mode: "freshrss" }
			: await fetchFreshRssPublicSelection();
		if (
			!selection ||
			(selection.items.length === 0 && selection.mode !== "ai-filtered")
		) {
			return NextResponse.json(
				{ items: [], mode: selection ? "warming-up" : "unconfigured" },
				{ status: 503, headers: { "Cache-Control": "no-store" } },
			);
		}
		return NextResponse.json(
			{ items: selection.items, mode: selection.mode },
			{
				headers: {
					"Cache-Control":
						"public, max-age=0, s-maxage=600, stale-while-revalidate=300",
					"X-Content-Type-Options": "nosniff",
				},
			},
		);
	} catch {
		return NextResponse.json(
			{ items: [], mode: "unavailable" },
			{ status: 502, headers: { "Cache-Control": "no-store" } },
		);
	}
}
