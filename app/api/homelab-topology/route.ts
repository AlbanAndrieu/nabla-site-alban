import { NextResponse } from "next/server";
import {
	loadServiceTopology,
	SERVICE_TOPOLOGY_DEFAULT_API_URL,
} from "../../../lib/serviceTopology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { topology, source } = await loadServiceTopology();
	return NextResponse.json(topology, {
		headers: {
			"Cache-Control": "no-store",
			"X-Homelab-Topology-Source": source,
			"X-Homelab-Topology-Primary": SERVICE_TOPOLOGY_DEFAULT_API_URL,
		},
	});
}
