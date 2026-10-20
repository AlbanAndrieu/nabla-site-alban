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
import { parseHomelabServicesCatalog } from "../lib/homelabServices";

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
		readFile(
			new URL("../lib/homelabServicesServer.ts", import.meta.url),
			"utf8",
		),
		readFile(
			new URL(
				"../app/[locale]/architecture/ArchitecturePrivateViews.tsx",
				import.meta.url,
			),
			"utf8",
		),
		readFile(
			new URL(
				"../app/[locale]/architecture/useArchitectureLiveData.ts",
				import.meta.url,
			),
			"utf8",
		),
	]);
	assert.match(loader, /fetchSiteCatalogV2\(\)/);
	assert.doesNotMatch(
		loader.slice(
			loader.indexOf("export async function loadHomelabServicesCatalog"),
		),
		/LOCAL_FALLBACK|getStaticHomelabServicesCatalog|homelab-services\.json/,
	);
	assert.match(architecture, /fetchJson\("\/api\/homelab-catalog-v2"/);
	assert.doesNotMatch(
		architecture,
		/getStaticHomelabServicesCatalog|getStaticServiceTopology/,
	);
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

// Retained pure presentation/legacy-shape safety contracts. Runtime is v2-only.

const ORIGINAL_API_URL = process.env.HOMELAB_SERVICES_API_URL;
const ORIGINAL_API_KEY = process.env.HOMELAB_SERVICES_API_KEY;
const ORIGINAL_DIAGNOSTICS_KEY = process.env.DIAGNOSTICS_ACCESS_KEY;
const ORIGINAL_FETCH = globalThis.fetch;

function setApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_SERVICES_API_URL;
	} else {
		process.env.HOMELAB_SERVICES_API_URL = value;
	}
}

test.afterEach(() => {
	if (ORIGINAL_DIAGNOSTICS_KEY === undefined)
		delete process.env.DIAGNOSTICS_ACCESS_KEY;
	else process.env.DIAGNOSTICS_ACCESS_KEY = ORIGINAL_DIAGNOSTICS_KEY;
	if (ORIGINAL_API_KEY === undefined)
		delete process.env.HOMELAB_SERVICES_API_KEY;
	else process.env.HOMELAB_SERVICES_API_KEY = ORIGINAL_API_KEY;
	setApiUrl(ORIGINAL_API_URL);
	globalThis.fetch = ORIGINAL_FETCH;
});

test("homelab catalog parser accepts the expected contract and rejects unusable payloads", () => {
	assert.deepEqual(
		parseHomelabServicesCatalog({
			version: 1,
			services: [{ name: "Remote service", external: true }],
		}),
		{
			version: 1,
			services: [{ name: "Remote service", external: true }],
		},
	);
	assert.equal(parseHomelabServicesCatalog({ services: [] }), null);
	assert.equal(parseHomelabServicesCatalog({ services: [{}] }), null);
	assert.equal(
		parseHomelabServicesCatalog({ version: "1", services: [{ name: "x" }] }),
		null,
	);
});

test("homelab service endpoint separates browser navigation from tunnel identity", () => {
	assert.equal(
		homelabServiceEndpointUrl({
			id: "prometheus",
			name: "Prometheus",
			endpointUrl: "https://metrics.example.test:9443/",
			tunnelUrl: "https://metrics.albandrieu.com",
		}),
		"https://metrics.example.test:9443/",
	);
	assert.equal(
		homelabServiceEndpointUrl({
			id: "prometheus",
			name: "Prometheus",
			tunnelUrl: "https://metrics.albandrieu.com",
		}),
		"https://metrics.albandrieu.com",
	);
	assert.equal(
		homelabServiceEndpointUrl({ id: "prometheus", name: "Prometheus" }),
		"https://prometheus.albandrieu.com",
	);
	assert.equal(
		homelabServiceEndpointUrl({ name: "Prometheus - albandrieu" }),
		"https://prometheus-albandrieu.albandrieu.com",
	);
});

test("legacy navigation no longer overrides TrueNAS and pfSense with admin ports", () => {
	assert.equal(
		homelabServiceEndpointUrl({
			id: "truenas",
			name: "TrueNAS",
			tunnelUrl: "https://truenas.albandrieu.com",
		}),
		"https://truenas.albandrieu.com",
	);
	assert.equal(
		homelabServiceEndpointUrl({
			id: "pfsense",
			name: "pfSense",
			tunnelUrl: "https://pfsense.albandrieu.com",
		}),
		"https://pfsense.albandrieu.com",
	);
	assert.equal(homelabServiceId({ name: "pfSense" }), "pfsense");
});

test("static public catalog does not fetch and exposes only the conceptual node", () => {
	setApiUrl("https://catalog.example.test/homelab");
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("static catalog must not fetch");
	}) as typeof fetch;
	const result = getStaticHomelabServicesCatalog();
	assert.equal(fetchCalled, false);
	assert.equal(result.source, "local-fallback");
	assert.equal(result.catalog.services.length, 1);
	assert.equal(result.catalog.services[0].id, "homelab");
	assert.equal(result.catalog.services[0].endpointEnabled, false);
});

test("public homelab API refuses requests without querying FastAPI", async () => {
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("must not call upstream");
	}) as typeof fetch;
	const response = await GET(
		new Request("https://www.albanandrieu.com/api/homelab-services", {
			headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "10.0.0.2" },
		}),
	);
	assert.equal(fetchCalled, false);
	assert.equal(response.status, 404);
	assert.match(response.headers.get("cache-control") ?? "", /no-store/);
	assert.equal(response.headers.get("x-homelab-services-primary"), null);
	assert.deepEqual(await response.json(), {
		error: "Operational homelab data is private",
	});
});

test("public fallback never exposes PostgreSQL binding details", () => {
	const catalog = getStaticHomelabServicesCatalog().catalog;
	assert.equal(catalog.services.length, 1);
	assert.ok(
		!catalog.services.some(
			(service) => homelabServiceId(service) === "postgresql",
		),
	);
});
