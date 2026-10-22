import { NextResponse } from "next/server";
import {
	OWNER_BOUNDARY_REASON,
	ownerUpstreamBlocked,
} from "@/lib/homelabOwnerBoundary";
import {
	type FastApiHealthBoardSnapshot,
	loadFastApiHealthBoard,
} from "@/lib/fastApiHealthBoard";
import {
	type HomelabHealthSnapshot,
	loadHomelabHealthSnapshot,
	loadHomelabProbeSnapshot,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

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

async function healthResponse() {
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
	const boardResult = await loadFastApiHealthBoard();
	const boardSnapshot = parseHomelabHealthSnapshot(boardResult.board?.homelab);
	if (boardSnapshot && boardResult.board?.state === "fresh") {
		return NextResponse.json(
			withHealthBoardMetadata(boardSnapshot, boardResult.board),
			{
				headers: {
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

	// Only start the richer aggregate request after the cached health-board has
	// proved insufficient. A fresh board therefore stays on the low-cost path and
	// faster browser refreshes cannot accidentally fan out to the aggregate probe.
	const aggregate = await loadHomelabHealthSnapshot();
	if (aggregate.snapshot) {
		return NextResponse.json(
			withHealthBoardMetadata(aggregate.snapshot, boardResult.board),
			{
				headers: {
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
				"X-Homelab-Health-Source": "unavailable",
				"X-Homelab-Health-Primary": aggregate.primaryUrl,
				"X-Homelab-Health-Board-State":
					boardResult.board?.state ?? "unavailable",
			},
		},
	);
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, healthResponse);
}
