import { NextResponse } from "next/server";
import { loadHomelabProbeSnapshot } from "@/lib/homelabHealth";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function probesResponse() {
	const probes = await loadHomelabProbeSnapshot();
	if (!probes.snapshot) {
		return NextResponse.json(
			{ error: "FastAPI bounded homelab probe matrix unavailable" },
			{
				status: 503,
				headers: {
					"X-Homelab-Health-Source": "unavailable",
					"X-Homelab-Health-Primary": probes.primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(probes.snapshot, {
		headers: {
			"X-Homelab-Health-Source": probes.source,
			"X-Homelab-Health-Primary": probes.primaryUrl,
		},
	});
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, probesResponse);
}
