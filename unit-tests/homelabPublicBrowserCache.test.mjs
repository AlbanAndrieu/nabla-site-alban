import assert from "node:assert/strict";
import test from "node:test";
import {
	catalogRevalidationDue,
	clearPublicHomelabBrowserCache,
	parsePublicHomelabCatalogPayload,
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
		services: [
			{
				id: "component:default/grafana",
				name: "Grafana",
				entityRef: "component:default/grafana",
				iconSrc: "assets/selfh-icons/grafana-icon.svg",
				endpointEnabled: false,
				internalHost: "172.17.0.24",
				internalPort: 3000,
				token: "secret",
				kind: "service",
				category: "monitoring",
			},
		],
	};
}

function topologyFixture() {
	return {
		version: 2,
		catalogRevision: REVISION,
		name: "Sensitive source network",
		nodes: [
			{
				id: "component:default/grafana",
				name: "Grafana",
				kind: "service",
				category: "monitoring",
				sourcePath: "/private/source",
				url: "http://172.17.0.24:3000",
			},
		],
		relations: [],
		adminKey: "secret",
	};
}

function healthFixture() {
	return {
		schemaVersion: 2,
		model: "backstage-health",
		catalogRevision: REVISION,
		boardState: "fresh",
		services: [
			{
				entityRef: "component:default/grafana",
				state: "ok",
				token: "must-not-store",
			},
		],
	};
}

test("public catalog cache excludes OWNER fields, secrets and LAN addresses", () => {
	const storage = storageFixture();
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000),
		true,
	);
	const stored = [...storage.values.values()].join(" ");
	for (const token of [
		"172.17.0.24",
		"secret",
		"accessToken",
		"/private/source",
		"internalHost",
		"iconSrc",
		"grafana-icon.svg",
	]) {
		assert.equal(stored.includes(token), false, token);
	}
	const restored = readPublicCatalogCache(storage, 1001);
	assert.equal("iconSrc" in restored.catalog.services[0], false);
	assert.equal(restored.topology.nodes.length, 1);
	assert.deepEqual(restored.topology.relations, []);
});

test("invalid catalogs and remote icon URLs cannot enter browser storage", () => {
	const storage = storageFixture();
	const invalidIcon = {
		...catalogFixture(),
		services: [
			{
				...catalogFixture().services[0],
				iconSrc: "https://evil.example/logo.svg",
			},
		],
	};
	assert.equal(
		writePublicCatalogCache(storage, invalidIcon, null, 1000),
		false,
	);
	const activeEndpoint = {
		...catalogFixture(),
		services: [{ ...catalogFixture().services[0], endpointEnabled: true }],
	};
	assert.equal(
		writePublicCatalogCache(storage, activeEndpoint, null, 1000),
		false,
	);
	assert.equal(storage.values.size, 0);
});

test("browser catalog cache expires and rejects future-dated snapshots", () => {
	const storage = storageFixture();
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), null, 1000),
		true,
	);
	// Public catalog survives a typical multi-hour TrueNAS freeze.
	assert.ok(readPublicCatalogCache(storage, 1000 + 15 * 60_000));
	assert.ok(readPublicCatalogCache(storage, 1000 + 24 * 60 * 60_000 - 1));
	assert.equal(readPublicCatalogCache(storage, 1000 + 24 * 60 * 60_000), null);
	writePublicCatalogCache(storage, catalogFixture(), null, 1000);
	assert.equal(readPublicCatalogCache(storage, 999), null);
});

test("old 15-minute SERVICE v3 cache remains usable for up to 24h during an outage", () => {
	const storage = storageFixture();
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000),
		true,
	);
	const [[key, serialized]] = [...storage.values.entries()];
	const old = JSON.parse(serialized);
	old.expiresAt = old.savedAt + 15 * 60_000;
	storage.values.set(key, JSON.stringify(old));
	const cached = readPublicCatalogCache(storage, 1000 + 60 * 60_000);
	assert.ok(cached);
	assert.deepEqual(
		cached.catalog.services.map((s) => s.id),
		["component:default/grafana"],
	);
	assert.equal("accessToken" in cached.catalog, false);
	assert.equal("internalHost" in cached.catalog.services[0], false);
	// Do not refresh savedAt by reading the cache; its original age is authoritative.
	assert.equal(JSON.parse(storage.values.get(key)).savedAt, 1000);
	assert.equal(readPublicCatalogCache(storage, 1000 + 24 * 60 * 60_000), null);
});

test("cached green health is always reclassified as stale UNKNOWN", () => {
	const storage = storageFixture();
	assert.equal(writePublicHealthCache(storage, healthFixture(), 1000), true);
	assert.equal(
		[...storage.values.values()].join(" ").includes("must-not-store"),
		false,
	);
	const restored = readStalePublicHealthCache(storage, REVISION, 1001);
	assert.equal(restored.boardState, "stale");
	assert.equal(restored.services[0].state, "unknown");
	assert.equal(readStalePublicHealthCache(storage, OTHER_REVISION, 1001), null);
	assert.equal(
		readStalePublicHealthCache(storage, REVISION, 1000 + 2 * 60_000),
		null,
	);
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
		getItem() {
			throw new Error("blocked");
		},
		setItem() {
			throw new Error("quota");
		},
		removeItem() {
			throw new Error("blocked");
		},
	};
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), null, 1000),
		false,
	);
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
	assert.equal(
		readStalePublicHealthCache(storage, REVISION, 1001)?.boardState,
		"stale",
	);
});

test("duplicate Backstage entity references cannot poison the cached catalog", () => {
	const storage = storageFixture();
	const base = catalogFixture();
	base.services.push({ ...base.services[0], name: "Grafana copy" });
	assert.equal(writePublicCatalogCache(storage, base, null, 1000), false);
	assert.equal(storage.values.size, 0);
});

test("topology with missing nodes becomes explicitly node-only, not fictional edges", () => {
	const storage = storageFixture();
	const topology = topologyFixture();
	topology.nodes.length = 0;
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), topology, 1000),
		true,
	);
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
	clearPublicHomelabBrowserCache({
		removeItem() {
			throw new Error("blocked");
		},
	});
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
		...catalog.services[0],
		id: "component:default/loki",
		name: "Loki",
		entityRef: "component:default/loki",
	});
	const topology = topologyFixture();
	topology.nodes.push({ ...topology.nodes[0] });
	assert.equal(writePublicCatalogCache(storage, catalog, topology, 1000), true);
	assert.equal(readPublicCatalogCache(storage, 1001).topology, null);
});

test("live SERVICE v2 response is sanitized before React can render it", () => {
	const raw = { ...catalogFixture(), topology: topologyFixture() };
	const parsed = parsePublicHomelabCatalogPayload(raw);
	assert.ok(parsed);
	assert.deepEqual(
		parsed.catalog.services.map((service) => service.id),
		["component:default/grafana"],
	);
	assert.equal("iconSrc" in parsed.catalog.services[0], false);
	assert.equal("token" in parsed.catalog.services[0], false);
	assert.equal("internalHost" in parsed.catalog.services[0], false);
	assert.equal("accessToken" in parsed.catalog, false);
	assert.equal("url" in parsed.topology.nodes[0], false);
	assert.equal("sourcePath" in parsed.topology.nodes[0], false);
	assert.equal("adminKey" in parsed.topology, false);
});

test("malformed successful HTTP DTO cannot enter the public state", () => {
	assert.equal(parsePublicHomelabCatalogPayload(null), null);
	assert.equal(
		parsePublicHomelabCatalogPayload({ version: 2, services: [] }),
		null,
	);
	const unsafeIcon = catalogFixture();
	unsafeIcon.services[0].iconSrc = "https://external.example/icon.svg";
	assert.equal(parsePublicHomelabCatalogPayload(unsafeIcon), null);
	const activeEndpoint = catalogFixture();
	activeEndpoint.services[0].endpointEnabled = true;
	assert.equal(parsePublicHomelabCatalogPayload(activeEndpoint), null);
});

test("a pre-icon-upgrade browser cache is not restored", () => {
	const storage = storageFixture();
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), topologyFixture(), 1000),
		true,
	);
	const [[key, value]] = storage.values.entries();
	assert.match(key, /catalog-public-v2:4$/);
	storage.values.delete(key);
	for (const version of [1, 2, 3])
		storage.values.set(key.replace(/:4$/, `:${version}`), value);
	assert.equal(readPublicCatalogCache(storage, 1001), null);
	clearPublicHomelabBrowserCache(storage);
	assert.equal(storage.values.size, 0);
});

test("a projection without upstream image metadata stays valid", () => {
	const raw = catalogFixture();
	delete raw.services[0].iconSrc;
	const parsed = parsePublicHomelabCatalogPayload(raw);
	assert.ok(parsed);
	assert.equal("iconSrc" in parsed.catalog.services[0], false);
});

test("successful v4 cache writes clean up slug-keyed v1 to v3 projections", () => {
	const storage = storageFixture();
	for (const version of [1, 2, 3])
		storage.values.set(`nabla:homelab:catalog-public-v2:${version}`, "stale");
	assert.equal(
		writePublicCatalogCache(storage, catalogFixture(), null, 1000),
		true,
	);
	assert.deepEqual(
		[...storage.values.keys()],
		["nabla:homelab:catalog-public-v2:4"],
	);
});

test("a slug service ID cannot enter the entity-ref keyed cache", () => {
	const storage = storageFixture();
	const slug = catalogFixture();
	slug.services[0].id = "grafana";
	assert.equal(writePublicCatalogCache(storage, slug, null, 1000), false);
	assert.equal(parsePublicHomelabCatalogPayload(slug), null);
});

test("public SERVICE text cannot carry IPs, URLs or credentials into browser storage", () => {
	const storage = storageFixture();
	const catalog = catalogFixture();
	catalog.services[0].description = "Dashboard: https://internal.example";
	catalog.services[0].kind = "service";
	catalog.services[0].category = "token=must-not-store";
	assert.equal(writePublicCatalogCache(storage, catalog, null, 1000), true);
	const stored = [...storage.values.values()].join(" ");
	assert.equal(stored.includes("internal.example"), false);
	assert.equal(stored.includes("must-not-store"), false);
	const restored = readPublicCatalogCache(storage, 1001);
	assert.equal("description" in restored.catalog.services[0], false);
	assert.equal("category" in restored.catalog.services[0], false);

	const poisonedName = catalogFixture();
	poisonedName.services[0].name = "Grafana 172.17.0.24";
	assert.equal(parsePublicHomelabCatalogPayload(poisonedName), null);
	assert.equal(
		writePublicCatalogCache(storageFixture(), poisonedName, null, 1000),
		false,
	);
});

test("unsafe topology labels are discarded without fabricating graph edges", () => {
	const catalog = catalogFixture();
	const topology = topologyFixture();
	topology.nodes[0].name = "Private http://172.17.0.24:3000";
	const parsed = parsePublicHomelabCatalogPayload({ ...catalog, topology });
	assert.ok(parsed);
	assert.equal(parsed.topology, null);
	assert.equal(parsed.catalog.services.length, 1);
});

test("public SERVICE rejects non-string identifiers before React or localStorage", () => {
	for (const id of [42, true, null, [], {}, "", "Grafana", "broken/path"]) {
		const original = catalogFixture();
		const malformed = {
			...original,
			services: [{ ...original.services[0], id }],
		};
		assert.equal(parsePublicHomelabCatalogPayload(malformed), null, String(id));
		assert.equal(
			writePublicCatalogCache(storageFixture(), malformed, null, 1000),
			false,
			String(id),
		);
	}
});

test("public SERVICE retains only reviewed Backstage v2 presentation metadata", () => {
	const storage = storageFixture();
	const payload = catalogFixture();
	payload.services[0].catalogEntityKind = "Component";
	payload.services[0].lifecycle = "production";
	payload.services[0].criticality = "high";
	payload.services[0].businessCriticality = "medium";
	payload.services[0].sourcePath = "/private/source";
	assert.equal(writePublicCatalogCache(storage, payload, null, 1000), true);
	const cached = readPublicCatalogCache(storage, 1001)?.catalog.services[0];
	assert.ok(cached);
	assert.equal(cached.catalogEntityKind, "Component");
	assert.equal(cached.lifecycle, "production");
	assert.equal(cached.criticality, "high");
	assert.equal(cached.businessCriticality, "medium");
	assert.equal("sourcePath" in cached, false);
	assert.equal("internalHost" in cached, false);
	assert.equal("iconSrc" in cached, false);

	const malformed = catalogFixture();
	malformed.services[0].catalogEntityKind = "Admin";
	malformed.services[0].lifecycle = "token=secret";
	malformed.services[0].businessCriticality = "unknown";
	const sanitized = parsePublicHomelabCatalogPayload(malformed);
	assert.ok(sanitized);
	assert.equal("catalogEntityKind" in sanitized.catalog.services[0], false);
	assert.equal("lifecycle" in sanitized.catalog.services[0], false);
	assert.equal("businessCriticality" in sanitized.catalog.services[0], false);
});
