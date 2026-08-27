import { NextResponse } from "next/server";
import { loadHomelabHealthSnapshot } from "../../../lib/homelabHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { snapshot, source, primaryUrl } = await loadHomelabHealthSnapshot();
	if (!snapshot) {
		return NextResponse.json(
			{ error: "FastAPI homelab health snapshot unavailable" },
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
					"X-Homelab-Health-Source": source,
					"X-Homelab-Health-Primary": primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(snapshot, {
		headers: {
			"Cache-Control":
				"public, max-age=0, s-maxage=15, stale-while-revalidate=30",
			"X-Homelab-Health-Source": source,
			"X-Homelab-Health-Primary": primaryUrl,
		},
	});
}
