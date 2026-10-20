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
const ORIGINAL_API_KEY = process.env.HOMELAB_SERVICES_API_KEY;
const ORIGINAL_FETCH = globalThis.fetch;

function setApiUrl(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_SERVICES_API_URL;
	} else {
		process.env.HOMELAB_SERVICES_API_URL = value;
	}
}

test.afterEach(() => {
	if (ORIGINAL_API_KEY === undefined) delete process.env.HOMELAB_SERVICES_API_KEY;
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

test("homelab catalog prefers FastAPI and keeps upstream inventory/exposure authoritative", async () => {
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
				{
					id: "adguard-home",
					name: "AdGuard Home",
					tunnelUrl: "https://adguardhome.albandrieu.com",
					external: true,
				},
				{
					id: "joplin",
					name: "Joplin",
					tunnelUrl: "https://joplin.int.albandrieu.com",
					external: true,
				},
				{ name: "FastAPI service", external: true },
			],
		});
	}) as typeof fetch;

	const result = await loadHomelabServicesCatalog();
	const truenas = result.catalog.services.find(
		(service) => service.id === "truenas",
	);
	const pfsense = result.catalog.services.find(
		(service) => service.id === "pfsense",
	);
	const adguard = result.catalog.services.find(
		(service) => service.id === "adguard-home",
	);
	const joplin = result.catalog.services.find(
		(service) => service.id === "joplin",
	);

	assert.equal(requestedUrl, HOMELAB_SERVICES_DEFAULT_API_URL);
	assert.equal(result.source, "fastapi");
	assert.equal(truenas?.endpointUrl, undefined);
	assert.equal(pfsense?.endpointUrl, undefined);
	assert.equal(adguard?.external, true);
	assert.equal(joplin?.external, true);
	assert.equal(joplin?.tunnelUrl, "https://joplin.int.albandrieu.com");
	assert.equal(
		result.catalog.services.find(
			(service) => service.name === "FastAPI service",
		)?.name,
		"FastAPI service",
	);
});

test("homelab fallback is generic if upstream FastAPI is unavailable", async () => {
	setApiUrl("https://catalog.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("unavailable", { status: 503 })) as typeof fetch;
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "local-fallback");
	assert.equal(result.catalog.services.length, 1);
	assert.equal(result.catalog.services[0].id, "homelab");
});

test("private inventory sends read-only diagnostics key server-to-server only", async () => {
	setApiUrl("https://catalog.example.test/homelab");
	process.env.HOMELAB_SERVICES_API_KEY = "test-only-private-key";
	let passedHeader = "";
	globalThis.fetch = (async (_input, init) => {
		passedHeader = new Headers(init?.headers).get("X-Diagnostics-Key") ?? "";
		return Response.json({
			version: 1,
			services: [{ id: "postgresql", name: "PostgreSQL" }],
		});
	}) as typeof fetch;
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "fastapi");
	assert.equal(passedHeader, "test-only-private-key");
	assert.ok(result.catalog.services.some((service) => service.id === "postgresql"));
	assert.doesNotMatch(JSON.stringify(result.catalog), /test-only-private-key/);
});

test("rejected upstream key never publishes a private fallback catalog", async () => {
	process.env.HOMELAB_SERVICES_API_KEY = "test-only-invalid-key";
	setApiUrl("https://catalog.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("Forbidden", { status: 403 })) as typeof fetch;
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "local-fallback");
	assert.equal(result.catalog.services.length, 1);
	assert.equal(result.catalog.services[0].id, "homelab");
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
