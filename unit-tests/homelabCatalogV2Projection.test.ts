import assert from "node:assert/strict";
import test from "node:test";
import { parseHomelabCatalogV2 } from "../lib/homelabCatalogV2";
import { projectHomelabCatalogV2 } from "../lib/homelabCatalogV2Projection";

function entity(
	kind: "Component" | "Resource" | "API",
	namespace: string,
	name: string,
	spec: Record<string, unknown> = {},
) {
	return {
		apiVersion: "backstage.io/v1alpha1",
		kind,
		entityRef: `${kind.toLowerCase()}:${namespace}/${name}`,
		sourcePath: `apps/${name}/catalog-info.yaml`,
		metadata: { name },
		spec,
	};
}

function project(entities: ReturnType<typeof entity>[]) {
	const catalog = parseHomelabCatalogV2({
		schemaVersion: 2,
		model: "backstage",
		catalogRevision: `sha256:${"a".repeat(64)}`,
		entities,
	});
	assert.ok(catalog);
	return projectHomelabCatalogV2(catalog);
}

function idsByRef(output: ReturnType<typeof project>) {
	return new Map(
		output.services.services.map((service) => [service.entityRef, service.id]),
	);
}

test("unique Backstage names retain their existing service IDs", () => {
	const output = project([
		entity("Component", "default", "nexus"),
		entity("Resource", "default", "postgres"),
	]);
	assert.deepEqual(
		output.services.services.map((service) => service.id).sort(),
		["nexus", "postgres"],
	);
});

test("duplicate names across namespaces are invalid catalog data", () => {
	const entities = [
		entity("Component", "default", "api"),
		entity("Component", "edge", "api"),
	];
	assert.equal(
		parseHomelabCatalogV2({
			schemaVersion: 2,
			model: "backstage",
			catalogRevision: `sha256:${"a".repeat(64)}`,
			entities,
		}),
		null,
	);
});

test("duplicate service names across Backstage kinds are rejected", () => {
	const entities = [
		entity("Component", "default", "foo"),
		entity("Resource", "default", "foo"),
	];
	assert.equal(
		parseHomelabCatalogV2({
			schemaVersion: 2,
			model: "backstage",
			catalogRevision: `sha256:${"a".repeat(64)}`,
			entities,
		}),
		null,
	);
});

test("service IDs and graph relations are independent of source entity order", () => {
	const entities = [
		entity("Component", "default", "frontend", {
			dependsOn: ["resource:default/postgres"],
		}),
		entity("Resource", "default", "postgres"),
		entity("API", "default", "service-api"),
	];
	const one = project(entities);
	const two = project([...entities].reverse());
	assert.deepEqual(idsByRef(one), idsByRef(two));
	assert.deepEqual(one.topology.relations, two.topology.relations);
});

test("scalar subcomponentOf builds the parent partOf graph edge", () => {
	const output = project([
		entity("Component", "default", "frontend", {
			subcomponentOf: "component:default/backend",
		}),
		entity("Component", "default", "backend"),
	]);
	assert.deepEqual(output.topology.relations, [
		{
			source: "frontend",
			target: "backend",
			type: "partOf",
			strength: "required",
			evidence: [],
		},
	]);
});

test("relation order remains stable when upstream changes entity order", () => {
	const entries = [
		entity("Component", "default", "frontend", {
			dependsOn: ["resource:default/cache", "resource:default/postgres"],
		}),
		entity("Resource", "default", "cache"),
		entity("Resource", "default", "postgres"),
		entity("Component", "default", "backend", {
			dependsOn: ["resource:default/postgres"],
		}),
	];
	const normal = project(entries);
	const reversed = project([...entries].reverse());
	assert.deepEqual(normal.topology.relations, reversed.topology.relations);
	assert.deepEqual(
		normal.topology.relations.map((relation) => relation.source),
		["backend", "frontend", "frontend"],
	);
});

test("different names that normalize to the same service-card slug are rejected", () => {
	const entities = [
		entity("Component", "default", "a.b"),
		entity("Resource", "default", "a_b"),
	];
	assert.equal(
		parseHomelabCatalogV2({
			schemaVersion: 2,
			model: "backstage",
			catalogRevision: `sha256:${"a".repeat(64)}`,
			entities,
		}),
		null,
	);
});
