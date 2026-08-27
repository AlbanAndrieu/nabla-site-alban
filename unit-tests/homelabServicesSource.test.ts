import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-services/route";
import {
	getStaticHomelabServicesCatalog,
	HOMELAB_SERVICES_DEFAULT_API_URL,
	homelabServiceEndpointUrl,
	homelabServiceId,
	loadHomelabServicesCatalog,
	parseHomelabServicesCatalog,
} from "../lib/homelabServices";

const ORIGINAL_API_URL = process.env.HOMELAB_SERVICES_API_URL;
const ORIGINAL_FETCH = globalThis.fetch;

function setApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_SERVICES_API_URL;
	} else {
		process.env.HOMELAB_SERVICES_API_URL = value;
	}
}

test.afterEach(() => {
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

test("TrueNAS and pfSense navigation keeps their published ports", () => {
	assert.equal(
		homelabServiceEndpointUrl({
			id: "truenas",
			name: "TrueNAS",
			tunnelUrl: "https://truenas.albandrieu.com",
		}),
		"https://truenas.albandrieu.com:7000/",
	);
	assert.equal(
		homelabServiceEndpointUrl({
			id: "pfsense",
			name: "pfSense",
			tunnelUrl: "https://pfsense.albandrieu.com",
		}),
		"https://home.albandrieu.com:10443/",
	);
	assert.equal(homelabServiceId({ name: "pfSense" }), "pfsense");
});

test("static homelab catalog never probes FastAPI during prerender", () => {
	setApiUrl("https://catalog.example.test/homelab");
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("static catalog must not fetch");
	}) as typeof fetch;

	const result = getStaticHomelabServicesCatalog();
	const truenas = result.catalog.services.find((service) => service.name === "TrueNAS");
	const pfsense = result.catalog.services.find((service) => service.name === "pfSense");

	assert.equal(fetchCalled, false);
	assert.equal(result.source, "local-fallback");
	assert.ok(truenas);
	assert.ok(pfsense);
	assert.equal(
		homelabServiceEndpointUrl(truenas),
		"https://truenas.albandrieu.com:7000/",
	);
	assert.equal(
		homelabServiceEndpointUrl(pfsense),
		"https://home.albandrieu.com:10443/",
	);
});

test("homelab catalog prefers FastAPI and overlays site-owned navigation details", async () => {
	setApiUrl(undefined);
	let requestedUrl = "";
	globalThis.fetch = (async (input) => {
		requestedUrl = String(input);
		return Response.json({
			version: 1,
			services: [
				{
					id: "truenas",
					name: "TrueNAS",
					tunnelUrl: "https://truenas.albandrieu.com",
					external: false,
				},
				{
					id: "pfsense",
					name: "pfSense",
					tunnelUrl: "https://pfsense.albandrieu.com",
					external: false,
				},
				{ name: "FastAPI service", external: true },
			],
		});
	}) as typeof fetch;

	const result = await loadHomelabServicesCatalog();
	const truenas = result.catalog.services.find((service) => service.id === "truenas");
	const pfsense = result.catalog.services.find((service) => service.id === "pfsense");

	assert.equal(requestedUrl, HOMELAB_SERVICES_DEFAULT_API_URL);
	assert.equal(result.source, "fastapi");
	assert.equal(truenas?.endpointUrl, "https://truenas.albandrieu.com:7000/");
	assert.equal(pfsense?.endpointUrl, "https://home.albandrieu.com:10443/");
	assert.equal(
		result.catalog.services.find((service) => service.name === "FastAPI service")?.name,
		"FastAPI service",
	);
});

test("homelab catalog falls back to the repository JSON when FastAPI is unavailable", async () => {
	setApiUrl("https://catalog.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("unavailable", { status: 503 })) as typeof fetch;

	const result = await loadHomelabServicesCatalog();

	assert.equal(result.source, "local-fallback");
	assert.equal(result.primaryUrl, "https://catalog.example.test/homelab");
	assert.ok(result.catalog.services.length > 1);
	assert.equal(
		homelabServiceEndpointUrl(
			result.catalog.services.find((service) => service.name === "TrueNAS")!,
		),
		"https://truenas.albandrieu.com:7000/",
	);
});

test("homelab proxy exposes which source served the catalog", async () => {
	setApiUrl("https://catalog.example.test/homelab");
	globalThis.fetch = (async () =>
		Response.json({
			services: [{ name: "Remote through proxy" }],
		})) as typeof fetch;

	const response = await GET();
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.equal(response.headers.get("x-homelab-services-source"), "fastapi");
	assert.equal(
		response.headers.get("x-homelab-services-primary"),
		"https://catalog.example.test/homelab",
	);
	assert.equal(body.services[0].name, "Remote through proxy");
});
