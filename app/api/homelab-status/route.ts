import { NextResponse } from "next/server";
import { loadHomelabStatusSnapshot } from "../../../lib/homelabStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { snapshot, source, primaryUrl } = await loadHomelabStatusSnapshot();
	if (!snapshot) {
		return NextResponse.json(
			{ error: "FastAPI homelab status unavailable" },
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
					"X-Homelab-Status-Source": source,
					"X-Homelab-Status-Primary": primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(snapshot, {
		headers: {
			"Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
			"X-Homelab-Status-Source": source,
			"X-Homelab-Status-Primary": primaryUrl,
		},
	});
}
