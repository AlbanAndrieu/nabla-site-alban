import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { loadHomelabServicesCatalog } from "../lib/homelabServicesServer";
import {
	fetchSiteCatalogV2,
	SiteCatalogV2Error,
} from "../lib/homelabSiteCatalog";

const originalFetch = globalThis.fetch;
const originalKey = process.env.DIAGNOSTICS_ACCESS_KEY;

function catalog() {
	return {
		schemaVersion: 2,
		model: "backstage",
		catalogRevision: `sha256:${"b".repeat(64)}`,
		entities: [
			{
				apiVersion: "backstage.io/v1alpha1",
				kind: "Component",
				entityRef: "component:default/fastapi",
				sourcePath: "apps/fastapi/catalog-info.yaml",
				metadata: { name: "fastapi", title: "FastAPI" },
				spec: { type: "service" },
			},
		],
	};
}

/** A fresh fetch identity per test gets an isolated cache entry. */
function countingFetch(respond: (call: number) => Response) {
	let calls = 0;
	const fetchImpl = (async () => respond(++calls)) as typeof fetch;
	globalThis.fetch = fetchImpl;
	return () => calls;
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	if (originalKey === undefined) delete process.env.DIAGNOSTICS_ACCESS_KEY;
	else process.env.DIAGNOSTICS_ACCESS_KEY = originalKey;
});

test("a verified catalog is shared across requests and its projection reused", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-cache-shared";
	const calls = countingFetch(() => Response.json(catalog()));
	const first = await loadHomelabServicesCatalog();
	const second = await loadHomelabServicesCatalog();
	assert.equal(calls(), 1);
	assert.equal(second.catalog, first.catalog);
	assert.equal(second.topology, first.topology);
});

test("concurrent loads share one upstream request", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-cache-concurrent";
	const calls = countingFetch(() => Response.json(catalog()));
	const [left, right] = await Promise.all([
		fetchSiteCatalogV2(),
		fetchSiteCatalogV2(),
	]);
	assert.equal(calls(), 1);
	assert.equal(left, right);
});

test("upstream failures are never cached", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-cache-failure";
	const calls = countingFetch((call) =>
		call === 1
			? new Response("down", { status: 503 })
			: Response.json(catalog()),
	);
	await assert.rejects(fetchSiteCatalogV2(), SiteCatalogV2Error);
	const recovered = await fetchSiteCatalogV2();
	assert.equal(calls(), 2);
	assert.equal(recovered.entities.length, 1);
});

test("a changed access key never reuses another key's catalog", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-cache-key-a";
	const calls = countingFetch((call) =>
		call === 1 ? Response.json(catalog()) : new Response("no", { status: 403 }),
	);
	await fetchSiteCatalogV2();
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-cache-key-b";
	await assert.rejects(
		fetchSiteCatalogV2(),
		(error: unknown) =>
			error instanceof SiteCatalogV2Error && error.reason === "access-denied",
	);
	assert.equal(calls(), 2);
});
