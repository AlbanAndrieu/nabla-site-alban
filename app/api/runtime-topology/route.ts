import { NextResponse } from "next/server";
import { loadRuntimeTopology } from "@/lib/runtimeTopology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const topology = await loadRuntimeTopology();
	if (!topology) {
		return NextResponse.json(
			{ error: "FastAPI runtime topology unavailable" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
	return NextResponse.json(topology, {
		headers: {
			"Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
		},
	});
}
