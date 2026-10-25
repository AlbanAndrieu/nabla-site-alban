import { NextResponse } from "next/server";
import { SiteCatalogV2Error } from "@/lib/homelabSiteCatalog";
import { createHomelabTrace } from "@/lib/homelabTraceContext";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";
import { loadSiteHealthV2 } from "@/lib/siteHealthV2Server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function healthResponse() {
	const trace = createHomelabTrace();
	let confirmed = false;
	try {
		const payload = await loadSiteHealthV2(trace.traceparent, (verified) => { confirmed = verified; });
		return NextResponse.json(payload, {
			headers: { "X-Homelab-Catalog-Revision": payload.catalogRevision,
				"X-Nabla-Trace-ID": trace.traceId,
				"X-Nabla-Trace-Propagation": confirmed ? "confirmed" : "sent",
				"Cache-Control": "private, no-store" },
		});
	} catch (error) {
		const reason =
			error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
		const stage = error instanceof SiteCatalogV2Error ? error.stage : "unknown";
		console.warn("[site-health-v2]", { traceId: trace.traceId, stage, reason });
		return NextResponse.json(
			{ error: "Backstage v2 health unavailable", reason },
			{ status: 503, headers: { "X-Nabla-Trace-ID": trace.traceId,
				"X-Nabla-Trace-Propagation": confirmed ? "confirmed" : "sent",
				"Cache-Control": "private, no-store" } },
		);
	}
}

/** The SERVICE key authenticates Vercel, but never the visitor. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, healthResponse);
}
