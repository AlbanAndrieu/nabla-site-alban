import { NextResponse } from "next/server";
import { loadFastApiHealthBoard } from "@/lib/fastApiHealthBoard";
import { loadHomelabDiagnostics } from "@/lib/homelabDiagnostics";
import {
	parseHomelabObservability,
	withObservabilityFallbacks,
} from "@/lib/homelabObservability";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";
import { loadRuntimeTopology } from "@/lib/runtimeTopology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function observabilityResponse() {
	const { board, primaryUrl, error } = await loadFastApiHealthBoard();
	if (!board) {
		// A SERVICE key cannot authorize OWNER diagnostics from Vercel.
		// Only expose a fixed reason, never an upstream body, URL or raw error.
		const reason =
			error === "owner-upstream-disabled"
				? "owner-boundary"
				: "upstream-unavailable";
		return NextResponse.json(
			{ error: "FastAPI operational evidence unavailable", reason },
			{ status: 503 },
		);
	}

	const parsed = parseHomelabObservability(board);
	const [runtimeFallback, diagnosticsFallback] = await Promise.all([
		parsed.runtimeTopology ? Promise.resolve(null) : loadRuntimeTopology(),
		parsed.diagnostics ? Promise.resolve(null) : loadHomelabDiagnostics(),
	]);
	const evidence = withObservabilityFallbacks(parsed, {
		runtimeTopology: runtimeFallback,
		diagnostics: diagnosticsFallback,
	});

	return NextResponse.json(evidence, {
		headers: {
			"X-Homelab-Observability-Primary": primaryUrl,
			"X-Homelab-Health-Board-State": board.state,
			"X-Homelab-Health-Board-Refreshing": String(board.refreshing),
			"X-Homelab-Runtime-Source": evidence.sources.runtime,
			"X-Homelab-Diagnostics-Source": evidence.sources.diagnostics,
		},
	});
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, observabilityResponse);
}
