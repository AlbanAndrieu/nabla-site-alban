import { NextResponse } from "next/server";
import { EDGES } from "@/app/components/truenas/homelabNetworkFlowEdges";
import { NODES } from "@/app/components/truenas/homelabNetworkFlowNodes";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function networkFlowResponse() {
	return NextResponse.json({ nodes: NODES, edges: EDGES });
}

/**
 * The network graph carries addresses, ports and the WAN identity, so it is
 * served only to the owner network or verified Cloudflare Access instead of
 * being bundled into a public JavaScript chunk.
 */
export function GET(request: Request) {
	return gatedHomelabResponse(request, networkFlowResponse);
}
