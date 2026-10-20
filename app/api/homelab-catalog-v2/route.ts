import { NextResponse } from "next/server";
import {
	fetchSiteCatalogV2,
	SiteCatalogV2Error,
} from "@/lib/homelabSiteCatalog";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function catalogResponse() {
	try {
		const catalog = await fetchSiteCatalogV2();
		return NextResponse.json(catalog, {
			headers: { "X-Homelab-Catalog-Revision": catalog.catalogRevision },
		});
	} catch (error) {
		const reason =
			error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
		// Never return a partial v1 catalog, source URL, credentials or upstream body.
		return NextResponse.json(
			{ error: "Backstage v2 catalog unavailable", reason },
			{ status: 503 },
		);
	}
}

/** Separate owner CIDR gate; the SERVICE key never authorizes a visitor. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, catalogResponse);
}
