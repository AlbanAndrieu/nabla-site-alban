import { NextResponse } from "next/server";
import { loadHomelabDiagnostics } from "@/lib/homelabDiagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const diagnostics = await loadHomelabDiagnostics();
	if (!diagnostics) {
		return NextResponse.json(
			{ error: "FastAPI homelab diagnostics unavailable" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
	return NextResponse.json(diagnostics, {
		headers: {
			"Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
		},
	});
}
