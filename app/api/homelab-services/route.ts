import { NextResponse } from "next/server";
import {
	isHomelabCatalogPlaceholder,
	loadHomelabServicesCatalog,
} from "@/lib/homelabServices";
import { gatedHomelabResponse } from "@/lib/privateHomelabResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function catalogResponse() {
	const { catalog, source, primaryUrl } = await loadHomelabServicesCatalog();
	const catalogRevision =
		typeof catalog.catalogRevision === "string" &&
		catalog.catalogRevision.trim()
			? catalog.catalogRevision.trim()
			: null;
	return NextResponse.json(catalog, {
		headers: {
			"X-Homelab-Services-Source": source,
			"X-Homelab-Inventory-Complete": String(
				!isHomelabCatalogPlaceholder(catalog),
			),
			"X-Homelab-Services-Primary": primaryUrl,
			...(catalogRevision
				? { "X-Homelab-Catalog-Revision": catalogRevision }
				: {}),
		},
	});
}

/** Owner network or verified Cloudflare Access only; neutral 404 otherwise. */
export function GET(request: Request) {
	return gatedHomelabResponse(request, catalogResponse);
}
