import { NextResponse } from "next/server";
import {
	type FastApiHealthBoardSnapshot,
	loadFastApiHealthBoard,
} from "../../../lib/fastApiHealthBoard";
import {
	type HomelabHealthSnapshot,
	loadHomelabHealthSnapshot,
	loadHomelabProbeSnapshot,
	parseHomelabHealthSnapshot,
} from "../../../lib/homelabHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withHealthBoardMetadata(
	snapshot: HomelabHealthSnapshot,
	board: FastApiHealthBoardSnapshot | null,
): HomelabHealthSnapshot {
	if (!board) return snapshot;
	return {
		...snapshot,
		health_board: {
			state: board.state,
			refreshing: board.refreshing,
			generated_at: board.generated_at,
			...(typeof board.age_seconds === "number"
				? { age_seconds: board.age_seconds }
				: {}),
			...(typeof board.retry_after_seconds === "number"
				? { retry_after_seconds: board.retry_after_seconds }
				: {}),
			...(board.error === null || typeof board.error === "string"
				? { error: board.error }
				: {}),
		},
	};
}

export async function GET() {
	const boardResult = await loadFastApiHealthBoard();
	const boardSnapshot = parseHomelabHealthSnapshot(boardResult.board?.homelab);
	if (boardSnapshot && boardResult.board) {
		return NextResponse.json(
			withHealthBoardMetadata(boardSnapshot, boardResult.board),
			{
				headers: {
					"Cache-Control":
						"public, max-age=0, s-maxage=10, stale-while-revalidate=30",
					"X-Homelab-Health-Source": "fastapi-health-board",
					"X-Homelab-Health-Primary": boardResult.primaryUrl,
					"X-Homelab-Health-Board-State": boardResult.board.state,
					"X-Homelab-Health-Board-Refreshing": String(
						boardResult.board.refreshing,
					),
				},
			},
		);
	}

	// A cold FastAPI worker can legitimately return `pending` before its first
	// background health-board snapshot exists. Prefer FastAPI's bounded raw
	// probe matrix so the UI gets scheduled/completed/deadline fan-out evidence
	// without waiting for aggregate reconciliation.
	const probes = await loadHomelabProbeSnapshot();
	if (probes.snapshot) {
		return NextResponse.json(
			withHealthBoardMetadata(probes.snapshot, boardResult.board),
			{
				headers: {
					"Cache-Control":
						"public, max-age=0, s-maxage=10, stale-while-revalidate=30",
					"X-Homelab-Health-Source": probes.source,
					"X-Homelab-Health-Primary": probes.primaryUrl,
					"X-Homelab-Health-Board-State":
						boardResult.board?.state ?? "fallback",
				},
			},
		);
	}

	// Preserve the historical aggregate endpoint as the final compatibility
	// fallback because it can still provide richer reconciliation evidence.
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
					"X-Homelab-Health-Board-State":
						boardResult.board?.state ?? "unavailable",
				},
			},
		);
	}

	return NextResponse.json(
		withHealthBoardMetadata(snapshot, boardResult.board),
		{
			headers: {
				"Cache-Control":
					"public, max-age=0, s-maxage=15, stale-while-revalidate=30",
				"X-Homelab-Health-Source": source,
				"X-Homelab-Health-Primary": primaryUrl,
				"X-Homelab-Health-Board-State": boardResult.board?.state ?? "fallback",
			},
		},
	);
}
