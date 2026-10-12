import { NextResponse } from "next/server";
import { fetchFreshRssPublicArticles } from "@/lib/server/freshRssPublic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const items = await fetchFreshRssPublicArticles();
		if (!items) {
			return NextResponse.json(
				{ items: [], mode: "unconfigured" },
				{ status: 503, headers: { "Cache-Control": "no-store" } },
			);
		}
		return NextResponse.json(
			{ items, mode: "freshrss" },
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
