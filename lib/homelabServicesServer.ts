import { projectHomelabCatalogV2 } from "./homelabCatalogV2Projection";
import type {
	HomelabServicesCatalog,
	HomelabServicesSource,
} from "./homelabServices";
import { fetchSiteCatalogV2, SITE_CATALOG_V2_URL } from "./homelabSiteCatalog";
import type { ServiceTopology } from "./serviceTopology";

/** Exclusive server-side canonical v2 reader. Never import into client code. */
export async function loadHomelabServicesCatalog(): Promise<{
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	source: HomelabServicesSource;
	primaryUrl: string;
}> {
	const v2 = await fetchSiteCatalogV2();
	const projected = projectHomelabCatalogV2(v2);
	return {
		catalog: projected.services,
		topology: projected.topology,
		source: "fastapi",
		primaryUrl: SITE_CATALOG_V2_URL,
	};
}
