import { NextResponse } from "next/server";
import { loadHomelabServicesCatalog } from "@/lib/homelabServicesServer";
import { SiteCatalogV2Error } from "@/lib/homelabSiteCatalog";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function catalogResponse() {
	try {
		const { catalog, topology } = await loadHomelabServicesCatalog();
		return NextResponse.json({ ...catalog, topology }, {
			headers: {
				"X-Homelab-Services-Source": "backstage-v2",
				"X-Homelab-Inventory-Complete": "true",
				"X-Homelab-Catalog-Revision": String(catalog.catalogRevision),
			},
		});
	} catch (error) {
		const reason =
			error instanceof SiteCatalogV2Error ? error.reason : "unavailable";
		return NextResponse.json(
			{ error: "Backstage v2 inventory unavailable", reason },
			{
				status: 503,
				headers: { "X-Homelab-Inventory-Complete": "false" },
			},
		);
	}
}

/** Owner-only: an invalid SERVICE key never weakens the CIDR restriction. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, catalogResponse);
}
