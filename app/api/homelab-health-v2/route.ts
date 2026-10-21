import { NextResponse } from "next/server";
import { SiteCatalogV2Error } from "@/lib/homelabSiteCatalog";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";
import { loadSiteHealthV2 } from "@/lib/siteHealthV2Server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function healthResponse() {
	try {
		const payload = await loadSiteHealthV2();
		return NextResponse.json(payload, {
			headers: { "X-Homelab-Catalog-Revision": payload.catalogRevision },
		});
	} catch (error) {
		const reason =
			error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
		return NextResponse.json(
			{ error: "Backstage v2 health unavailable", reason },
			{ status: 503 },
		);
	}
}

/** The SERVICE key authenticates Vercel, but never the visitor. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, healthResponse);
}
