import assert from "node:assert/strict";
import test from "node:test";
import {
	clearPublicHomelabBrowserCache,
	catalogRevalidationDue,
	readPublicCatalogCache,
	readStalePublicHealthCache,
	writePublicCatalogCache,
	writePublicHealthCache,
} from "../lib/homelabPublicBrowserCache.ts";

const REVISION = "sha256:" + "a".repeat(64);
const OTHER_REVISION = "sha256:" + "b".repeat(64);

function storageFixture() {
	const values = new Map();
	return {
		values,
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	};
}

function catalogFixture() {
	return {
		version: 2,
		catalogRevision: REVISION,
		accessToken: "must-not-store",
		services: [{
			id: "grafana", name: "Grafana", entityRef: "component:default/grafana",
			iconSrc: "assets/selfh-icons/grafana-icon.svg", endpointEnabled: false,
			internalHost: "172.17.0.24", internalPort: 3000, token: "secret",
			kind: "service", category: "monitoring",
		}],
	};
}

function topologyFixture() {
	return {
		version: 2, catalogRevision: REVISION, name: "Sensitive source network",
		nodes: [{
			id: "grafana", name: "Grafana", kind: "service", category: "monitoring",
			sourcePath: "/private/source", url: "http://172.17.0.24:3000",
		}],
		relations: [], adminKey: "secret",
	};
}

function healthFixture() {
	return {
		schemaVersion: 2, model: "backstage-health", catalogRevision: REVISION,
		boardState: "fresh", services: [{
			entityRef: "component:default/grafana", state: "ok", token: "must-not-store",
		}],
	};
}

test("public catalog cache excludes OWNER fields, secrets and LAN addresses", () => {
	const storage = storageFixture();
	assert.equal(writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000), true);
	const stored = [...storage.values.values()].join(" ");
	for (const token of ["172.17.0.24", "secret", "accessToken", "/private/source", "internalHost"]) {
		assert.equal(stored.includes(token), false, token);
	}
	const restored = readPublicCatalogCache(storage, 1001);
	assert.equal(restored.catalog.services[0].iconSrc, "assets/selfh-icons/grafana-icon.svg");
	assert.equal(restored.topology.nodes.length, 1);
	assert.deepEqual(restored.topology.relations, []);
});

test("invalid catalogs and remote icon URLs cannot enter browser storage", () => {
	const storage = storageFixture();
	const invalidIcon = { ...catalogFixture(), services: [{ ...catalogFixture().services[0], iconSrc: "https://evil.example/logo.svg" }] };
	assert.equal(writePublicCatalogCache(storage, invalidIcon, null, 1000), false);
	const activeEndpoint = { ...catalogFixture(), services: [{ ...catalogFixture().services[0], endpointEnabled: true }] };
	assert.equal(writePublicCatalogCache(storage, activeEndpoint, null, 1000), false);
	assert.equal(storage.values.size, 0);
});

test("browser catalog cache expires and rejects future-dated snapshots", () => {
	const storage = storageFixture();
	assert.equal(writePublicCatalogCache(storage, catalogFixture(), null, 1000), true);
	assert.ok(readPublicCatalogCache(storage, 1000 + 15 * 60_000 - 1));
	assert.equal(readPublicCatalogCache(storage, 1000 + 15 * 60_000), null);
	writePublicCatalogCache(storage, catalogFixture(), null, 1000);
	assert.equal(readPublicCatalogCache(storage, 999), null);
});

test("cached green health is always reclassified as stale UNKNOWN", () => {
	const storage = storageFixture();
	assert.equal(writePublicHealthCache(storage, healthFixture(), 1000), true);
	assert.equal([...storage.values.values()].join(" ").includes("must-not-store"), false);
	const restored = readStalePublicHealthCache(storage, REVISION, 1001);
	assert.equal(restored.boardState, "stale");
	assert.equal(restored.services[0].state, "unknown");
	assert.equal(readStalePublicHealthCache(storage, OTHER_REVISION, 1001), null);
	assert.equal(readStalePublicHealthCache(storage, REVISION, 1000 + 2 * 60_000), null);
});

test("rejects poisoned or duplicate health entries", () => {
	const storage = storageFixture();
	writePublicHealthCache(storage, healthFixture(), 1000);
	const [key, stored] = [...storage.values][0];
	const cache = JSON.parse(stored);
	cache.data.services.push(cache.data.services[0]);
	storage.values.set(key, JSON.stringify(cache));
	assert.equal(readStalePublicHealthCache(storage, REVISION, 1001), null);
});

test("blocked browser storage never crashes the public view", () => {
	const storage = {
		getItem() { throw new Error("blocked"); },
		setItem() { throw new Error("quota"); },
		removeItem() { throw new Error("blocked"); },
	};
	assert.equal(writePublicCatalogCache(storage, catalogFixture(), null, 1000), false);
	assert.equal(readPublicCatalogCache(storage, 1000), null);
	assert.equal(writePublicHealthCache(storage, healthFixture(), 1000), false);
	assert.equal(readStalePublicHealthCache(storage, REVISION, 1000), null);
});

test("malformed browser payloads are ignored without rendering exceptions", () => {
	const storage = storageFixture();
	writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000);
	const [key, serialized] = [...storage.values][0];
	const poisoned = JSON.parse(serialized);
	poisoned.data.catalog.services = [null];
	storage.values.set(key, JSON.stringify(poisoned));
	assert.equal(readPublicCatalogCache(storage, 1001), null);
});

test("cached health requires an exact verified catalogue revision", () => {
	const storage = storageFixture();
	writePublicHealthCache(storage, healthFixture(), 1000);
	assert.equal(readStalePublicHealthCache(storage, "", 1001), null);
	assert.equal(readStalePublicHealthCache(storage, OTHER_REVISION, 1001), null);
	assert.equal(readStalePublicHealthCache(storage, REVISION, 1001)?.boardState, "stale");
});

test("duplicate Backstage entity references cannot poison the cached catalog", () => {
	const storage = storageFixture();
	const base = catalogFixture();
	base.services.push({ ...base.services[0], id: "grafana-copy" });
	assert.equal(writePublicCatalogCache(storage, base, null, 1000), false);
	assert.equal(storage.values.size, 0);
});

test("topology with missing nodes becomes explicitly node-only, not fictional edges", () => {
	const storage = storageFixture();
	const topology = topologyFixture();
	topology.nodes.length = 0;
	assert.equal(writePublicCatalogCache(storage, catalogFixture(), topology, 1000), true);
	assert.equal(readPublicCatalogCache(storage, 1001).topology, null);
});

test("a duplicate health entityRef is rejected before persistence", () => {
	const storage = storageFixture();
	const health = healthFixture();
	health.services.push({ ...health.services[0] });
	assert.equal(writePublicHealthCache(storage, health, 1000), false);
	assert.equal(storage.values.size, 0);
});

test("revoke access clears both public cache entries without throwing", () => {
	const storage = storageFixture();
	writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000);
	writePublicHealthCache(storage, healthFixture(), 1000);
	assert.equal(storage.values.size, 2);
	clearPublicHomelabBrowserCache(storage);
	assert.equal(storage.values.size, 0);
	assert.equal(readPublicCatalogCache(storage, 1001), null);
	assert.equal(readStalePublicHealthCache(storage, REVISION, 1001), null);
	clearPublicHomelabBrowserCache({removeItem() { throw new Error("blocked"); }});
});

test("catalog revalidation is bounded and resumes after a suspended tab", () => {
	assert.equal(catalogRevalidationDue(1_000, 1_000), false);
	assert.equal(catalogRevalidationDue(1_000, 1_000 + 5 * 60_000 - 1), false);
	assert.equal(catalogRevalidationDue(1_000, 1_000 + 5 * 60_000), true);
	assert.equal(catalogRevalidationDue(1_000, 1_000 + 60 * 60_000), true);
	assert.equal(catalogRevalidationDue(1_000, 999), false);
	assert.equal(catalogRevalidationDue(NaN, 1_000), false);
});

test("duplicated topology nodes cannot hide a missing service", () => {
	const storage = storageFixture();
	const catalog = catalogFixture();
	catalog.services.push({
		...catalog.services[0], id: "loki", name: "Loki",
		entityRef: "component:default/loki",
	});
	const topology = topologyFixture();
	topology.nodes.push({ ...topology.nodes[0] });
	assert.equal(writePublicCatalogCache(storage, catalog, topology, 1000), true);
	assert.equal(readPublicCatalogCache(storage, 1001).topology, null);
});
