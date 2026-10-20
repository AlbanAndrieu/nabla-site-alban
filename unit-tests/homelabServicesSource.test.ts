import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GET } from "../app/api/homelab-services/route";
import {
	getStaticHomelabServicesCatalog,
	HOMELAB_SERVICES_DEFAULT_API_URL,
	homelabServiceEndpointUrl,
	homelabServiceId,
} from "../lib/homelabServices";
import { SITE_CATALOG_V2_URL } from "../lib/homelabSiteCatalog";

test("canonical homelab SERVICE upstream is Backstage v2, never legacy services", () => {
	assert.equal(HOMELAB_SERVICES_DEFAULT_API_URL, SITE_CATALOG_V2_URL);
	assert.equal(
		SITE_CATALOG_V2_URL,
		"https://fastapi-sample.fastapicloud.dev/api/site/catalog/v2",
	);
});

test("browser navigation helpers never override explicitly declared destinations", () => {
	assert.equal(
		homelabServiceEndpointUrl({
			id: "prometheus",
			name: "Prometheus",
			endpointUrl: "https://metrics.example.test:9443/",
			tunnelUrl: "https://metrics.albandrieu.com",
		}),
		"https://metrics.example.test:9443/",
	);
	assert.equal(homelabServiceId({ name: "pfSense" }), "pfsense");
});

test("inert legacy JSON remains a non-operational placeholder, never a v2 source", () => {
	const local = getStaticHomelabServicesCatalog().catalog;
	assert.equal(local.services.length, 1);
	assert.equal(local.services[0].id, "homelab");
	assert.equal(local.services[0].endpointEnabled, false);
	assert.ok(!local.services.some((s) => s.id === "postgresql"));
});

test("runtime loader and owner architecture never request legacy endpoints or fall back", async () => {
	const [loader, architecture, refreshing] = await Promise.all([
		readFile(new URL("../lib/homelabServicesServer.ts", import.meta.url), "utf8"),
		readFile(
			new URL("../app/[locale]/architecture/ArchitecturePrivateViews.tsx", import.meta.url),
			"utf8",
		),
		readFile(
			new URL("../app/[locale]/architecture/useArchitectureLiveData.ts", import.meta.url),
			"utf8",
		),
	]);
	assert.match(loader, /fetchSiteCatalogV2\(\)/);
	assert.doesNotMatch(
		loader.slice(loader.indexOf("export async function loadHomelabServicesCatalog")),
		/LOCAL_FALLBACK|getStaticHomelabServicesCatalog|homelab-services\.json/,
	);
	assert.match(architecture, /fetchJson\("\/api\/homelab-catalog-v2"/);
	assert.doesNotMatch(architecture, /getStaticHomelabServicesCatalog|getStaticServiceTopology/);
	assert.match(refreshing, /fetch\("\/api\/homelab-catalog-v2"/);
	assert.doesNotMatch(refreshing, /fetch\("\/api\/homelab-topology"/);
});

test("anonymous service route does not leak catalog, URL or revision", async () => {
	const response = await GET(
		new Request("https://www.albanandrieu.com/api/homelab-services", {
			headers: { "x-real-ip": "203.0.113.7" },
		}),
	);
	assert.equal(response.status, 404);
	assert.match(response.headers.get("cache-control") ?? "", /no-store/);
	assert.equal(response.headers.get("x-homelab-catalog-revision"), null);
	assert.equal(response.headers.get("x-homelab-services-primary"), null);
});
