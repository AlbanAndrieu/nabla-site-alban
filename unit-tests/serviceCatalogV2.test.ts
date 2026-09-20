import assert from "node:assert/strict";
import test from "node:test";

import {
	getStaticServiceCatalogV2,
	loadServiceCatalogV2,
	parseServiceCatalogV2,
	SERVICE_CATALOG_V2_API_ENV,
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
	for (const entity of catalog.entities) {
		assert.equal(
			entity.integrations?.cartography?.joinProperty,
			"nabla_ref",
		);
		assert.equal(
			entity.integrations?.cartography?.joinValue,
			entity.ref,
		);
	}
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

test("catalog v2 loader stays local until the upstream URL is explicitly configured", async () => {
	const originalFetch = globalThis.fetch;
	const originalUrl = process.env[SERVICE_CATALOG_V2_API_ENV];
	delete process.env[SERVICE_CATALOG_V2_API_ENV];
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("v2 loader must remain local without explicit opt-in");
	}) as typeof fetch;

	try {
		const result = await loadServiceCatalogV2();
		assert.equal(fetchCalled, false);
		assert.equal(result.source, "local-v2");
		assert.equal(result.primaryUrl, null);
	} finally {
		globalThis.fetch = originalFetch;
		if (originalUrl === undefined) {
			delete process.env[SERVICE_CATALOG_V2_API_ENV];
		} else {
			process.env[SERVICE_CATALOG_V2_API_ENV] = originalUrl;
		}
	}
});

test("catalog v2 loader can switch to a validated upstream contract by configuration", async () => {
	const originalFetch = globalThis.fetch;
	const originalUrl = process.env[SERVICE_CATALOG_V2_API_ENV];
	process.env[SERVICE_CATALOG_V2_API_ENV] =
		"https://catalog.example.test/api/homelab-catalog/v2";
	const local = getStaticServiceCatalogV2().catalog;
	const remote = {
		...local,
		metadata: {
			...local.metadata,
			catalogRevision:
				"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		},
	};
	globalThis.fetch = (async () => Response.json(remote)) as typeof fetch;

	try {
		const result = await loadServiceCatalogV2();
		assert.equal(result.source, "fastapi-v2");
		assert.equal(
			result.catalog.metadata.catalogRevision,
			remote.metadata.catalogRevision,
		);
		assert.equal(
			result.primaryUrl,
			"https://catalog.example.test/api/homelab-catalog/v2",
		);
	} finally {
		globalThis.fetch = originalFetch;
		if (originalUrl === undefined) {
			delete process.env[SERVICE_CATALOG_V2_API_ENV];
		} else {
			process.env[SERVICE_CATALOG_V2_API_ENV] = originalUrl;
		}
	}
});

test("legacy aliases and workstation deployments resolve without duplicating logical entities", () => {
	const { catalog } = getStaticHomelabServicesCatalog();

	const openWebUi = catalog.services.find(
		(service) => service.name === "Open WebUI",
	);
	assert.ok(openWebUi);
	assert.equal(openWebUi.id, "openwebui");

	const portracker = catalog.services.find(
		(service) => service.name === "Portracker",
	);
	assert.ok(portracker);
	assert.equal(portracker.id, "portracker");

	const languageTool = catalog.services.find(
		(service) => service.name === "LanguageTool",
	);
	assert.ok(languageTool);
	assert.equal(languageTool.id, "languagetool");

	const prometheusDev = catalog.services.find(
		(service) => service.id === "prometheus-albandrieu",
	);
	assert.ok(prometheusDev);
	assert.equal(prometheusDev.canonicalEntityId, "prometheus");
	assert.equal(prometheusDev.environment, "dev");
	assert.equal(prometheusDev.kind, "observability");

	const litellmDev = catalog.services.find(
		(service) => service.id === "litellm-albandrieu",
	);
	assert.ok(litellmDev);
	assert.equal(litellmDev.canonicalEntityId, "litellm");
	assert.equal(litellmDev.environment, "dev");
});
