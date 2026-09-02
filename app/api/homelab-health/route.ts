import { NextResponse } from "next/server";
import { loadFastApiHealthBoard } from "../../../lib/fastApiHealthBoard";
import {
	loadHomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "../../../lib/homelabHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const boardResult = await loadFastApiHealthBoard();
	const boardSnapshot = parseHomelabHealthSnapshot(boardResult.board?.homelab);
	if (boardSnapshot && boardResult.board) {
		return NextResponse.json(boardSnapshot, {
			headers: {
				"Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30",
				"X-Homelab-Health-Source": "fastapi-health-board",
				"X-Homelab-Health-Primary": boardResult.primaryUrl,
				"X-Homelab-Health-Board-State": boardResult.board.state,
				"X-Homelab-Health-Board-Refreshing": String(boardResult.board.refreshing),
			},
		});
	}

	// A cold FastAPI worker can legitimately return `pending` before its first
	// background health-board snapshot exists. Preserve the historical direct
	// homelab endpoint as a compatibility fallback for that cold-start window.
	const { snapshot, source, primaryUrl } = await loadHomelabHealthSnapshot();
	if (!snapshot) {
		return NextResponse.json(
			{ error: "FastAPI homelab health snapshot unavailable" },
			{
				status: 503,
				headers: {
					"Cache-Control": "no-store",
					"X-Homelab-Health-Source": source,
					"X-Homelab-Health-Primary": primaryUrl,
					"X-Homelab-Health-Board-State": boardResult.board?.state ?? "unavailable",
				},
			},
		);
	}

	return NextResponse.json(snapshot, {
		headers: {
			"Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
			"X-Homelab-Health-Source": source,
			"X-Homelab-Health-Primary": primaryUrl,
			"X-Homelab-Health-Board-State": boardResult.board?.state ?? "fallback",
		},
	});
}
