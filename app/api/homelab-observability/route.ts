import { NextResponse } from "next/server";
import { loadFastApiHealthBoard } from "@/lib/fastApiHealthBoard";
import { loadHomelabDiagnostics } from "@/lib/homelabDiagnostics";
import {
	parseHomelabObservability,
	withObservabilityFallbacks,
} from "@/lib/homelabObservability";
import { loadRuntimeTopology } from "@/lib/runtimeTopology";

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
			"Cache-Control": "no-store",
			"X-Homelab-Observability-Primary": primaryUrl,
			"X-Homelab-Health-Board-State": board.state,
			"X-Homelab-Health-Board-Refreshing": String(board.refreshing),
			"X-Homelab-Runtime-Source": evidence.sources.runtime,
			"X-Homelab-Diagnostics-Source": evidence.sources.diagnostics,
		},
	});
}
