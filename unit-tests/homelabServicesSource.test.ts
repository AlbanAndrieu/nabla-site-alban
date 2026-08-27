import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-services/route";
import {
	getStaticHomelabServicesCatalog,
	HOMELAB_SERVICES_DEFAULT_API_URL,
	homelabServiceEndpointUrl,
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

test("homelab service endpoint uses explicit URL before the stable-id DNS fallback", () => {
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

test("static homelab catalog never probes FastAPI during prerender", () => {
	setApiUrl("https://catalog.example.test/homelab");
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("static catalog must not fetch");
	}) as typeof fetch;

	const result = getStaticHomelabServicesCatalog();

	assert.equal(fetchCalled, false);
	assert.equal(result.source, "local-fallback");
	assert.equal(result.primaryUrl, "https://catalog.example.test/homelab");
	assert.ok(
		result.catalog.services.some((service) => service.name === "TrueNAS"),
	);
});

test("homelab catalog prefers FastAPI when a valid payload is available", async () => {
	setApiUrl(undefined);
	let requestedUrl = "";
	globalThis.fetch = (async (input) => {
		requestedUrl = String(input);
		return Response.json({
			version: 1,
			services: [{ name: "FastAPI service", external: true }],
		});
	}) as typeof fetch;

	const result = await loadHomelabServicesCatalog();

	assert.equal(requestedUrl, HOMELAB_SERVICES_DEFAULT_API_URL);
	assert.equal(result.source, "fastapi");
	assert.equal(result.catalog.services[0].name, "FastAPI service");
});

test("homelab catalog falls back to the repository JSON when FastAPI is unavailable", async () => {
	setApiUrl("https://catalog.example.test/homelab");
	globalThis.fetch = (async () =>
		new Response("unavailable", { status: 503 })) as typeof fetch;

	const result = await loadHomelabServicesCatalog();

	assert.equal(result.source, "local-fallback");
	assert.equal(result.primaryUrl, "https://catalog.example.test/homelab");
	assert.ok(result.catalog.services.length > 1);
	assert.ok(
		result.catalog.services.some((service) => service.name === "TrueNAS"),
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
