import { NextResponse } from "next/server";
import { loadHomelabDiagnostics } from "@/lib/homelabDiagnostics";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function diagnosticsResponse() {
	const diagnostics = await loadHomelabDiagnostics();
	if (!diagnostics) {
		return NextResponse.json(
			{ error: "FastAPI homelab diagnostics unavailable" },
			{ status: 503 },
		);
	}
	return NextResponse.json(diagnostics);
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, diagnosticsResponse);
}
