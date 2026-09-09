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
	const boardPromise = loadFastApiHealthBoard();
	const aggregatePromise = loadHomelabHealthSnapshot();
	const boardResult = await boardPromise;
	const boardSnapshot = parseHomelabHealthSnapshot(boardResult.board?.homelab);
	if (boardSnapshot && boardResult.board?.state === "fresh") {
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

	// The client renders the dedicated bounded probe route independently. This
	// endpoint therefore prefers the richer reconciled aggregate as enrichment.
	const aggregate = await aggregatePromise;
	if (aggregate.snapshot) {
		return NextResponse.json(
			withHealthBoardMetadata(aggregate.snapshot, boardResult.board),
			{
				headers: {
					"Cache-Control":
						"public, max-age=0, s-maxage=15, stale-while-revalidate=30",
					"X-Homelab-Health-Source": aggregate.source,
					"X-Homelab-Health-Primary": aggregate.primaryUrl,
					"X-Homelab-Health-Board-State":
						boardResult.board?.state ?? "fallback",
				},
			},
		);
	}

	// Backward-compatible fallback for consumers that only call this route.
	const probes = await loadHomelabProbeSnapshot();
	if (probes.snapshot) {
		return NextResponse.json(
			withHealthBoardMetadata(probes.snapshot, boardResult.board),
			{
				headers: {
					"Cache-Control": "no-store, max-age=0",
					Pragma: "no-cache",
					"X-Homelab-Health-Source": probes.source,
					"X-Homelab-Health-Primary": probes.primaryUrl,
					"X-Homelab-Health-Board-State":
						boardResult.board?.state ?? "fallback",
				},
			},
		);
	}

	// A stale health-board may still be useful when every fresher path is down,
	// but it must never overwrite a newer aggregate or bounded probe snapshot.
	if (boardSnapshot && boardResult.board) {
		return NextResponse.json(
			withHealthBoardMetadata(boardSnapshot, boardResult.board),
			{
				headers: {
					"Cache-Control": "no-store, max-age=0",
					"X-Homelab-Health-Source": "fastapi-health-board-stale",
					"X-Homelab-Health-Primary": boardResult.primaryUrl,
					"X-Homelab-Health-Board-State": boardResult.board.state,
					"X-Homelab-Health-Board-Refreshing": String(
						boardResult.board.refreshing,
					),
				},
			},
		);
	}

	return NextResponse.json(
		{ error: "FastAPI homelab health snapshot unavailable" },
		{
			status: 503,
			headers: {
				"Cache-Control": "no-store",
				"X-Homelab-Health-Source": "unavailable",
				"X-Homelab-Health-Primary": aggregate.primaryUrl,
				"X-Homelab-Health-Board-State":
					boardResult.board?.state ?? "unavailable",
			},
		},
	);
}
