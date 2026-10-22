import { NextResponse } from "next/server";
import {
	OWNER_BOUNDARY_REASON,
	ownerUpstreamBlocked,
} from "@/lib/homelabOwnerBoundary";
import { loadHomelabProbeSnapshot } from "@/lib/homelabHealth";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function probesResponse() {
	// Fast fail: machine SERVICE credentials cannot authorize FastAPI OWNER diagnostics.
	if (
		ownerUpstreamBlocked(
			process.env.VERCEL_ENV,
			process.env.HOMELAB_OWNER_RAW_UPSTREAM_ENABLED,
		)
	) {
		return NextResponse.json(
			{
				error: "Detailed homelab diagnostics require an OWNER channel",
				reason: OWNER_BOUNDARY_REASON,
			},
			{
				status: 503,
				headers: {
					"X-Homelab-Health-Reason": OWNER_BOUNDARY_REASON,
					"Cache-Control": "private, no-store",
				},
			},
		);
	}
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
