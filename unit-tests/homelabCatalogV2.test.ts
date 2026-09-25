import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	catalogV2ServiceViews,
	parseHomelabCatalogV2,
} from "../lib/homelabCatalogV2";

const revision = `sha256:${"a".repeat(64)}`;

function fixture() {
	return {
		schemaVersion: 2,
		model: "backstage",
		catalogRevision: revision,
		entities: [
			{
				apiVersion: "backstage.io/v1alpha1",
				kind: "Resource",
				entityRef: "resource:default/neo4j-security",
				sourcePath: "apps/neo4j/catalog-info.yaml",
				metadata: {
					name: "neo4j-security",
					title: "Neo4j Security Graph",
					tags: ["security", "nist-identify", "nist-detect"],
					labels: {
						"albandrieu.com/operational-criticality": "medium",
					},
				},
				spec: {
					type: "graph-database",
					owner: "group:default/nabla-platform",
				},
			},
			{
				apiVersion: "backstage.io/v1alpha1",
				kind: "Component",
				entityRef: "component:default/cartography",
				sourcePath: "apps/cartography/catalog-info.yaml",
				metadata: {
					name: "cartography",
					title: "Cartography",
					tags: ["security", "nist-identify", "nist-detect"],
					labels: {
						"albandrieu.com/operational-criticality": "low",
					},
				},
				spec: {
					type: "job",
					lifecycle: "production",
					owner: "group:default/nabla-platform",
					dependsOn: ["resource:default/neo4j-security"],
				},
			},
		],
	};
}

describe("homelab catalog v2", () => {
	it("parses the Backstage-derived canonical read model", () => {
		const parsed = parseHomelabCatalogV2(fixture());
		assert.equal(parsed?.catalogRevision, revision);
		assert.equal(parsed?.entities.length, 2);
	});

	it("rejects duplicate canonical entity refs", () => {
		const payload = fixture();
		payload.entities[1].entityRef = payload.entities[0].entityRef;
		assert.equal(parseHomelabCatalogV2(payload), null);
	});

	it("projects service cards from standards metadata instead of v1 fields", () => {
		const parsed = parseHomelabCatalogV2(fixture());
		assert.ok(parsed);
		const views = catalogV2ServiceViews(parsed);
		const cartography = views.find((item) => item.id === "cartography");
		assert.ok(cartography);
		assert.partialDeepStrictEqual(cartography, {
			entityRef: "component:default/cartography",
			name: "Cartography",
			entityKind: "Component",
			type: "job",
			lifecycle: "production",
			category: "security",
			securityFunctions: ["identify", "detect"],
			operationalCriticality: "low",
		});
	});
});
