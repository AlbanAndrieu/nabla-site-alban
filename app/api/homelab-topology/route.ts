import { NextResponse } from "next/server";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";
import {
	loadServiceTopology,
	SERVICE_TOPOLOGY_DEFAULT_API_URL,
} from "@/lib/serviceTopology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function topologyResponse() {
	const { topology, source } = await loadServiceTopology();
	return NextResponse.json(topology, {
		headers: {
			"X-Homelab-Topology-Source": source,
			"X-Homelab-Topology-Primary": SERVICE_TOPOLOGY_DEFAULT_API_URL,
		},
	});
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, topologyResponse);
}
