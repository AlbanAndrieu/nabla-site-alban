import { NextResponse } from "next/server";
import { loadHomelabServicesCatalog } from "../../../lib/homelabServices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { catalog, source, primaryUrl } = await loadHomelabServicesCatalog();
	const catalogRevision =
		typeof catalog.catalogRevision === "string" &&
		catalog.catalogRevision.trim()
			? catalog.catalogRevision.trim()
			: null;
	return NextResponse.json(catalog, {
		headers: {
			"Cache-Control": "no-store",
			"X-Homelab-Services-Source": source,
			"X-Homelab-Services-Primary": primaryUrl,
			...(catalogRevision
				? { "X-Homelab-Catalog-Revision": catalogRevision }
				: {}),
		},
	});
}
