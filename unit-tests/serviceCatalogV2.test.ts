import assert from "node:assert/strict";
import test from "node:test";

import {
	getStaticServiceCatalogV2,
	parseServiceCatalogV2,
	serviceCatalogV2ToTopologyPayload,
} from "../lib/serviceCatalogV2";
import {
	getStaticHomelabServicesCatalog,
	homelabServiceId,
} from "../lib/homelabServices";
import {
	getStaticServiceTopology,
	parseServiceTopology,
} from "../lib/serviceTopology";

test("bundled Nabla catalog v2 has stable unique identities", () => {
	const { catalog, source } = getStaticServiceCatalogV2();
	assert.equal(source, "local-v2");
	assert.equal(catalog.apiVersion, "nabla.dev/v2");
	assert.equal(catalog.metadata.authoritativeSource, "x-nabla");
	assert.ok(catalog.entities.length > 0);

	const ids = new Set(catalog.entities.map((entity) => entity.id));
	const refs = new Set(catalog.entities.map((entity) => entity.ref));
	assert.equal(ids.size, catalog.entities.length);
	assert.equal(refs.size, catalog.entities.length);
	assert.ok(parseServiceCatalogV2(catalog));
});

test("v2 adapts into the existing topology view model without losing relations", () => {
	const catalog = getStaticServiceCatalogV2().catalog;
	const adapted = parseServiceTopology(serviceCatalogV2ToTopologyPayload(catalog));
	assert.ok(adapted);
	assert.equal(adapted.nodes.length, catalog.entities.length);
	assert.equal(adapted.relations.length, catalog.relations.length);
	assert.equal(adapted.catalogRevision, catalog.metadata.catalogRevision);

	assert.ok(
		adapted.relations.some(
			(relation) =>
				relation.source === "cartography" &&
				relation.target === "neo4j-security" &&
				relation.type === "storesIn",
		),
	);
});

test("static topology is now sourced from the bundled v2 catalog", () => {
	const catalog = getStaticServiceCatalogV2().catalog;
	const { topology, source } = getStaticServiceTopology();
	assert.equal(source, "local-fallback");
	assert.equal(topology.catalogRevision, catalog.metadata.catalogRevision);
	assert.equal(topology.nodes.length, catalog.entities.length);
	assert.equal(topology.relations.length, catalog.relations.length);
});

test("legacy service cards receive canonical v2 identity and classification", () => {
	const v2 = getStaticServiceCatalogV2().catalog;
	const { catalog } = getStaticHomelabServicesCatalog();
	assert.equal(catalog.catalogRevision, v2.metadata.catalogRevision);
	assert.equal(catalog.topologyVersion, v2.metadata.topologyVersion);

	const truenas = catalog.services.find(
		(service) => homelabServiceId(service) === "truenas",
	);
	assert.ok(truenas);
	assert.equal(truenas.id, "truenas");
	assert.equal(truenas.kind, "storage-platform");
	assert.equal(truenas.category, "infrastructure");
});

test("remote catalog revisions remain authoritative over the bundled v2 snapshot", async () => {
	const originalFetch = globalThis.fetch;
	const originalUrl = process.env.HOMELAB_SERVICES_API_URL;
	process.env.HOMELAB_SERVICES_API_URL =
		"https://catalog.example.test/services";
	globalThis.fetch = (async () =>
		Response.json({
			version: 1,
			catalogRevision: "sha256:remote-newer-revision",
			topologyVersion: 2,
			services: [
				{
					id: "truenas",
					name: "TrueNAS from remote",
					kind: "remote-kind",
					category: "remote-category",
				},
			],
		})) as typeof fetch;

	try {
		const { loadHomelabServicesCatalog } = await import("../lib/homelabServices");
		const result = await loadHomelabServicesCatalog();
		assert.equal(
			result.catalog.catalogRevision,
			"sha256:remote-newer-revision",
		);
		assert.equal(result.catalog.topologyVersion, 2);
		assert.equal(result.catalog.services[0]?.name, "TrueNAS from remote");
		assert.equal(result.catalog.services[0]?.kind, "remote-kind");
	} finally {
		globalThis.fetch = originalFetch;
		if (originalUrl === undefined) {
			delete process.env.HOMELAB_SERVICES_API_URL;
		} else {
			process.env.HOMELAB_SERVICES_API_URL = originalUrl;
		}
	}
});
