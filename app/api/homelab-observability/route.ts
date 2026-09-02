import { NextResponse } from "next/server";
import { loadFastApiHealthBoard } from "@/lib/fastApiHealthBoard";
import { parseHomelabOperationalEvidence } from "@/lib/homelabOperationalEvidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { board, primaryUrl, error } = await loadFastApiHealthBoard();
	if (!board) {
		return NextResponse.json(
			{
				error: "FastAPI operational evidence is unavailable",
				detail: error,
			},
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
					"X-Homelab-Observability-Primary": primaryUrl,
				},
			},
		);
	}

	return NextResponse.json(parseHomelabOperationalEvidence(board), {
		headers: {
			"Cache-Control": "no-store",
			"X-Homelab-Observability-Primary": primaryUrl,
			"X-Homelab-Health-Board-State": board.state,
			"X-Homelab-Health-Board-Refreshing": String(board.refreshing),
		},
	});
}
