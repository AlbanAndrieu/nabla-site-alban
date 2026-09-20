import { NextResponse } from "next/server";
import {
	loadServiceCatalogV2,
	SERVICE_CATALOG_V2_API_ENV,
} from "../../../lib/serviceCatalogV2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const { catalog, source, primaryUrl } = await loadServiceCatalogV2();
	return NextResponse.json(catalog, {
		headers: {
			"Cache-Control": "no-store",
			"X-Homelab-Catalog-V2-Source": source,
			"X-Homelab-Catalog-Revision": catalog.metadata.catalogRevision,
			"X-Homelab-Topology-Version": String(
				catalog.metadata.topologyVersion,
			),
			"X-Homelab-Catalog-V2-Config": SERVICE_CATALOG_V2_API_ENV,
			...(primaryUrl
				? { "X-Homelab-Catalog-V2-Primary": primaryUrl }
				: {}),
		},
	});
}
