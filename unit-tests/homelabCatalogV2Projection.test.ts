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
	return new Map(output.services.services.map((service) => [service.entityRef, service.id]));
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

test("same name and kind across namespaces never collapse cards or graph nodes", () => {
	const output = project([
		entity("Component", "default", "api", {
			dependsOn: ["component:edge/api"],
		}),
		entity("Component", "edge", "api"),
	]);
	const ids = idsByRef(output);
	assert.notEqual(ids.get("component:default/api"), ids.get("component:edge/api"));
	assert.equal(new Set(output.topology.nodes.map((node) => node.id)).size, 2);
	assert.deepEqual(
		output.topology.relations.map((relation) => [relation.source, relation.target]),
		[[ids.get("component:default/api"), ids.get("component:edge/api")]],
	);
});

test("cross-kind collisions do not steal a different service's reserved ID", () => {
	const output = project([
		entity("Component", "default", "foo"),
		entity("Resource", "default", "foo"),
		entity("API", "default", "component-foo"),
	]);
	const ids = [...idsByRef(output).values()];
	assert.equal(new Set(ids).size, ids.length);
	assert.ok(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? "")));
});

test("service IDs and graph relations are independent of source entity order", () => {
	const entities = [
		entity("Component", "default", "api", {
			dependsOn: ["resource:default/api"],
		}),
		entity("Resource", "default", "api"),
		entity("API", "default", "component-api"),
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

test("normalizes Backstage punctuation before deduplicating card and graph IDs", () => {
	const output = project([
		entity("Component", "default", "a.b"),
		entity("Component", "edge", "a_b"),
		entity("Resource", "default", "a-b"),
	]);
	const ids = output.services.services.map((service) => service.id);
	assert.equal(new Set(ids).size, ids.length);
	assert.ok(
		ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? "")),
	);
	assert.deepEqual(
		new Set(output.topology.nodes.map((node) => node.id)),
		new Set(ids),
	);
});
