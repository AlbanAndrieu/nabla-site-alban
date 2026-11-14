import assert from "node:assert/strict";
import test from "node:test";
import { matchesCatalogServiceSearch } from "../lib/homelabCatalogSearch";
import type { HomelabService } from "../lib/homelabServices";

const sample: HomelabService = {
	id: "component:default/auth-gateway",
	entityRef: "component:default/auth-gateway",
	name: "Identity Gateway",
	kind: "network-gateway",
	category: "security",
	catalogEntityKind: "Component",
	lifecycle: "production",
	criticality: "high",
	businessCriticality: "critical",
	internalHost: "172.17.0.24",
	endpointUrl: "https://private.example",
};

test("same search facets work in Architecture and TrueNAS", () => {
	for (const query of [
		"identity",
		"component:default/auth-gateway",
		"network-gateway",
		"security",
		"component",
		"production",
		"high",
		"critical",
	])
		assert.equal(matchesCatalogServiceSearch(sample, query), true, query);
	assert.equal(matchesCatalogServiceSearch(sample, ""), true);
	assert.equal(matchesCatalogServiceSearch(sample, "unmatched"), false);
});

test("public catalog search does not match OWNER endpoints, secrets or LAN hosts", () => {
	for (const query of ["172.17.0.24", "private.example", "https://", "token"]) {
		assert.equal(matchesCatalogServiceSearch(sample, query), false, query);
	}
});
