import { NextResponse } from "next/server";
import { loadHomelabProbeSnapshot } from "../../../lib/homelabHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const probes = await loadHomelabProbeSnapshot();
	if (!probes.snapshot) {
		return NextResponse.json(
			{ error: "FastAPI bounded homelab probe matrix unavailable" },
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store, max-age=0",
					Pragma: "no-cache",
					"X-Homelab-Health-Source": "unavailable",
					"X-Homelab-Health-Primary": probes.primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(probes.snapshot, {
		headers: {
			"Cache-Control": "no-store, max-age=0",
			Pragma: "no-cache",
			"X-Homelab-Health-Source": probes.source,
			"X-Homelab-Health-Primary": probes.primaryUrl,
		},
	});
}
