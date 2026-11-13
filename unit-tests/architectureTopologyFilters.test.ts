import assert from "node:assert/strict";
import test from "node:test";
import {
	type ArchitectureCatalogFilters,
	countHealthStates,
	effectiveState,
	filterArchitectureCatalog,
	GROUP_FILTERS,
	HEALTH_STATES,
	indexHealth,
	PRESENTATION_GROUP_TITLE_KEY,
	snapshotAgeSeconds,
} from "../app/[locale]/architecture/architectureTopologyFilters";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "../lib/homelabHealth";
import type { HomelabServicesCatalog } from "../lib/homelabServices";
import type { ServicePresentationGroup } from "../lib/servicePresentation";

function entry(
	name: string,
	state: HomelabHealthState,
	id?: string,
): HomelabHealthEntry {
	return {
		id,
		name,
		url: `https://${name.toLowerCase()}.example.test`,
		reachable: state === "ok",
		http_status: state === "ok" ? 200 : 503,
		state,
	} as HomelabHealthEntry;
}

function snapshot(entries: HomelabHealthEntry[]): HomelabHealthSnapshot {
	return {
		schema_version: 1,
		checked_at: "2026-01-01T00:00:00Z",
		services: entries,
	} as HomelabHealthSnapshot;
}

function service(name: string, slug: string) {
	const entityRef = `component:default/${slug}`;
	return { id: entityRef, entityRef, name };
}

const catalog: HomelabServicesCatalog = {
	version: 2,
	services: [
		service("Grafana", "grafana"),
		service("Vault", "vault"),
		service("Home Assistant", "homeassistant"),
		service("Ollama", "ollama"),
	],
};

const presentation = new Map<string, { group: ServicePresentationGroup }>([
	["component:default/grafana", { group: "services" }],
	["component:default/vault", { group: "security-controls" }],
	["component:default/ollama", { group: "services" }],
]);

const health = indexHealth(
	snapshot([
		entry("Grafana", "ok", "grafana"),
		entry("Vault", "fail", "vault"),
		entry("Home Assistant", "warn", "homeassistant"),
		// Display-name-only evidence is never attached to a catalog entity.
		entry("Ollama", "ok"),
	]),
);

test("indexHealth keys OWNER evidence by id only", () => {
	assert.equal(health.owner.byId.size, 3);
	assert.ok(health.owner.byId.has("grafana"));
	assert.equal(indexHealth(null).owner.byId.size, 0);
});

test("effectiveState joins OWNER rows by entity name, never by display name", () => {
	assert.equal(effectiveState("component:default/grafana", health), "ok");
	assert.equal(effectiveState("component:default/vault", health), "fail");
	assert.equal(effectiveState("component:default/ollama", health), "unknown");
	assert.equal(effectiveState("component:default/missing", health), "unknown");
});

test("snapshotAgeSeconds handles missing, invalid and future timestamps", () => {
	const checkedAt = "2026-01-01T00:00:00Z";
	const base = Date.parse(checkedAt);
	assert.equal(snapshotAgeSeconds(undefined, base), null);
	assert.equal(snapshotAgeSeconds("not-a-date", base), null);
	assert.equal(snapshotAgeSeconds(checkedAt, base + 12_999), 12);
	assert.equal(snapshotAgeSeconds(checkedAt, base - 5_000), 0);
});

test("countHealthStates counts every declared service once", () => {
	assert.deepEqual(countHealthStates(catalog.services, health), {
		ok: 1,
		warn: 1,
		fail: 1,
		unknown: 1,
	});
});

test("filterArchitectureCatalog combines health, group and search filters", () => {
	const filters = {
		healthIndex: health,
		presentation,
		healthFilter: "all" as const,
		groupFilter: "all" as const,
		searchQuery: "",
	};
	const names = (result: HomelabServicesCatalog) =>
		result.services.map((service) => service.name);

	const all = filterArchitectureCatalog(catalog, filters);
	assert.deepEqual(names(all), [
		"Grafana",
		"Vault",
		"Home Assistant",
		"Ollama",
	]);
	assert.equal(all.version, 2);
	assert.notEqual(all, catalog);

	const filtered = (overrides: Partial<ArchitectureCatalogFilters>) =>
		names(filterArchitectureCatalog(catalog, { ...filters, ...overrides }));

	assert.deepEqual(filtered({ healthFilter: "fail" }), ["Vault"]);
	assert.deepEqual(filtered({ groupFilter: "services" }), [
		"Grafana",
		"Ollama",
	]);
	// Services without a presentation entry fall back to the support group.
	assert.deepEqual(filtered({ groupFilter: "support" }), ["Home Assistant"]);
	assert.deepEqual(filtered({ searchQuery: "  GRAF " }), ["Grafana"]);
	// Search also matches the canonical entity ref.
	assert.deepEqual(
		filtered({ searchQuery: "component:default/homeassistant" }),
		["Home Assistant"],
	);
	assert.deepEqual(
		filtered({ healthFilter: "ok", groupFilter: "security-controls" }),
		[],
	);
});

test("filter option constants keep their rendered order and i18n keys", () => {
	assert.deepEqual(HEALTH_STATES, ["ok", "warn", "fail", "unknown"]);
	assert.deepEqual(GROUP_FILTERS, [
		"all",
		"services",
		"core-critical",
		"security-controls",
		"shared-core",
		"support",
	]);
	for (const group of GROUP_FILTERS) {
		if (group === "all") continue;
		assert.equal(
			PRESENTATION_GROUP_TITLE_KEY[group],
			`presentation.groups.${group}`,
		);
	}
});

test("external Backstage v2 health maps by entityRef only at matching fresh revision", () => {
	const revision = "sha256:" + "a".repeat(64);
	const entity = "component:default/grafana";
	const projected = {
		schemaVersion: 2 as const,
		model: "backstage-health" as const,
		catalogRevision: revision,
		boardState: "fresh" as const,
		services: [{ entityRef: entity, state: "ok" as const }],
	};
	const projectedCatalog: HomelabServicesCatalog = {
		version: 2,
		catalogRevision: revision,
		services: [
			{ id: entity, name: "Grafana", entityRef: entity },
			{
				id: "component:default/vault",
				name: "Vault",
				entityRef: "component:default/vault",
			},
		],
	};
	const matching = indexHealth(
		null,
		projected,
		projectedCatalog.catalogRevision,
	);
	assert.deepEqual(countHealthStates(projectedCatalog.services, matching), {
		ok: 1,
		warn: 0,
		fail: 0,
		unknown: 1,
	});
	const staleRevision = indexHealth(
		null,
		projected,
		"sha256:" + "b".repeat(64),
	);
	assert.deepEqual(
		countHealthStates(projectedCatalog.services, staleRevision),
		{
			ok: 0,
			warn: 0,
			fail: 0,
			unknown: 2,
		},
	);
	const stale = indexHealth(
		null,
		{ ...projected, boardState: "stale" },
		revision,
	);
	assert.equal(effectiveState(entity, stale), "unknown");
});
