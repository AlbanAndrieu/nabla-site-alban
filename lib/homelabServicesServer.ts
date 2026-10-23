import type { HomelabCatalogV2 } from "./homelabCatalogV2";
import { projectHomelabCatalogV2 } from "./homelabCatalogV2Projection";
import type {
	HomelabServicesCatalog,
	HomelabServicesSource,
} from "./homelabServices";
import { fetchSiteCatalogV2, SITE_CATALOG_V2_URL } from "./homelabSiteCatalog";
import type { ServiceTopology } from "./serviceTopology";

// The verified catalog object is shared for its cache lifetime; project it
// once instead of on every request.
const projections = new WeakMap<
	HomelabCatalogV2,
	ReturnType<typeof projectHomelabCatalogV2>
>();

/** Exclusive server-side canonical v2 reader. Never import into client code. */
export async function loadHomelabServicesCatalog(): Promise<{
	catalog: HomelabServicesCatalog;
	topology: ServiceTopology;
	source: HomelabServicesSource;
	primaryUrl: string;
}> {
	const v2 = await fetchSiteCatalogV2();
	let projected = projections.get(v2);
	if (!projected) {
		projected = projectHomelabCatalogV2(v2);
		projections.set(v2, projected);
	}
	return {
		catalog: projected.services,
		topology: projected.topology,
		source: "fastapi",
		primaryUrl: SITE_CATALOG_V2_URL,
	};
}
