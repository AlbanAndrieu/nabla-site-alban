import { NextResponse } from "next/server";
import { catalogUnavailableResponse } from "@/lib/homelabCatalogUnavailableResponse";
import {
	fetchSiteCatalogV2,
} from "@/lib/homelabSiteCatalog";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function catalogResponse(request: Request) {
	try {
		const catalog = await fetchSiteCatalogV2();
		return NextResponse.json(catalog, {
			headers: { "X-Homelab-Catalog-Revision": catalog.catalogRevision },
		});
	} catch (error) {
		return catalogUnavailableResponse(request, error, "Backstage v2 catalog unavailable");
	}
}

/** Separate owner CIDR gate; the SERVICE key never authorizes a visitor. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, () => catalogResponse(request));
}
