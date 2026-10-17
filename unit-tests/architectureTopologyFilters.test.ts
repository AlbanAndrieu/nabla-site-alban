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

const catalog: HomelabServicesCatalog = {
	version: 1,
	services: [
		{ id: "grafana", name: "Grafana" },
		{ id: "vault", name: "Vault" },
		{ name: "Home Assistant" },
		{ id: "ollama", name: "Ollama" },
	],
};

const presentation = new Map<string, { group: ServicePresentationGroup }>([
	["grafana", { group: "services" }],
	["vault", { group: "security-controls" }],
	["ollama", { group: "services" }],
]);

const health = indexHealth(
	snapshot([
		entry("Grafana", "ok", "grafana"),
		entry("  VAULT ", "fail"),
		entry("Home Assistant", "warn", "home-assistant"),
	]),
);

test("indexHealth indexes entries by id and normalized name", () => {
	assert.equal(health.byId.size, 2);
	assert.ok(health.byId.has("grafana"));
	assert.ok(health.byName.has("vault"));
	assert.ok(health.byName.has("home assistant"));
	assert.equal(indexHealth(null).byId.size, 0);
	assert.equal(indexHealth(null).byName.size, 0);
});

test("effectiveState prefers id, falls back to name, else unknown", () => {
	assert.equal(effectiveState("grafana", "Other", health), "ok");
	assert.equal(effectiveState("vault", "Vault", health), "fail");
	assert.equal(effectiveState("missing", "Missing", health), "unknown");
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
	assert.equal(all.version, 1);
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
	assert.deepEqual(filtered({ searchQuery: "home-assistant" }), [
		"Home Assistant",
	]);
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
