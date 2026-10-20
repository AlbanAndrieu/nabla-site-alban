import { NextResponse } from "next/server";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";
import { loadRuntimeTopology } from "@/lib/runtimeTopology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function runtimeTopologyResponse() {
	const topology = await loadRuntimeTopology();
	if (!topology) {
		return NextResponse.json(
			{ error: "FastAPI runtime topology unavailable" },
			{ status: 503 },
		);
	}
	return NextResponse.json(topology);
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, runtimeTopologyResponse);
}
