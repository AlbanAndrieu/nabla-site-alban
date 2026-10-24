import { NextResponse } from "next/server";
import { loadHomelabServicesCatalog } from "@/lib/homelabServicesServer";
import { catalogUnavailableResponse } from "@/lib/homelabCatalogUnavailableResponse";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function catalogResponse(request: Request) {
	try {
		const { catalog, topology } = await loadHomelabServicesCatalog();
		return NextResponse.json(
			{ ...catalog, topology },
			{
				headers: {
					"X-Homelab-Services-Source": "backstage-v2",
					"X-Homelab-Inventory-Complete": "true",
					"X-Homelab-Catalog-Revision": String(catalog.catalogRevision),
				},
			},
		);
	} catch (error) {
		return catalogUnavailableResponse(request, error, "Backstage v2 inventory unavailable", {
			"X-Homelab-Inventory-Complete": "false",
		});
	}
}

/** OWNER gate or allowlisted temporary public SERVICE projection, with neutral errors. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, () => catalogResponse(request));
}
