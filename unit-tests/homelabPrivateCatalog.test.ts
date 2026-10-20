import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
	isHomelabCatalogPlaceholder,
	loadHomelabServicesCatalog,
} from "../lib/homelabServices";
import { GET } from "../app/api/homelab-services/route";

const originalFetch = globalThis.fetch;
const originalKey = process.env.HOMELAB_SERVICES_API_KEY;
const originalUrl = process.env.HOMELAB_SERVICES_API_URL;
afterEach(() => {
	globalThis.fetch = originalFetch;
	if (originalKey === undefined) delete process.env.HOMELAB_SERVICES_API_KEY;
	else process.env.HOMELAB_SERVICES_API_KEY = originalKey;
	if (originalUrl === undefined) delete process.env.HOMELAB_SERVICES_API_URL;
	else process.env.HOMELAB_SERVICES_API_URL = originalUrl;
});

test("public placeholder is not a private service catalog", async () => {
	globalThis.fetch = async () => { throw new Error("source unavailable"); };
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "local-fallback");
	assert.equal(isHomelabCatalogPlaceholder(result.catalog), true);
	assert.equal(result.catalog.services.length, 1);
});

test("server-to-server FastAPI request uses read-only key only in headers", async () => {
	process.env.HOMELAB_SERVICES_API_KEY = "fixture-read-only-key";
	process.env.HOMELAB_SERVICES_API_URL = "https://fastapi-sample.fastapicloud.dev/api/homelab-services";
	let called = false;
	globalThis.fetch = async (input, init) => {
		called = true;
		assert.equal(String(input), process.env.HOMELAB_SERVICES_API_URL);
		const headers = new Headers(init?.headers);
		assert.equal(headers.get("X-Diagnostics-Key"), "fixture-read-only-key");
		return Response.json({ version: 1, services: [{ id: "postgresql", name: "PostgreSQL", kind: "database" }] });
	};
	const result = await loadHomelabServicesCatalog();
	assert.equal(called, true);
	assert.equal(result.source, "fastapi");
	assert.equal(isHomelabCatalogPlaceholder(result.catalog), false);
	assert.equal(result.catalog.services[0]?.id, "postgresql");
	assert.doesNotMatch(JSON.stringify(result.catalog), /fixture-read-only-key/);
});

test("upstream placeholder never masquerades as the operational inventory", async () => {
	globalThis.fetch = async () => Response.json({ version: 1, services: [
		{ id: "homelab", name: "Self-hosted engineering platform", endpointEnabled: false },
	] });
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "local-fallback");
	assert.equal(isHomelabCatalogPlaceholder(result.catalog), true);
});

test("private inventory routes remain owner gated", async () => {
	const response = await GET(new Request("https://site.example/api/homelab-services"));
	assert.equal(response.status, 404);
	assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
});
