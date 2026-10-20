import { NextResponse } from "next/server";
import { loadHomelabStatusSnapshot } from "@/lib/homelabStatus";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function statusResponse() {
	const { snapshot, source, primaryUrl } = await loadHomelabStatusSnapshot();
	if (!snapshot) {
		return NextResponse.json(
			{ error: "FastAPI homelab status unavailable" },
			{
				status: 503,
				headers: {
					"X-Homelab-Status-Source": source,
					"X-Homelab-Status-Primary": primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(snapshot, {
		headers: {
			"X-Homelab-Status-Source": source,
			"X-Homelab-Status-Primary": primaryUrl,
		},
	});
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, statusResponse);
}
