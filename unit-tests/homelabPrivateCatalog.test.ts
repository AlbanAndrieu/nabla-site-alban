import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GET as getV2 } from "../app/api/homelab-catalog-v2/route";
import { GET as getCards } from "../app/api/homelab-services/route";
import { parseHomelabCatalogV2 } from "../lib/homelabCatalogV2";
import { projectHomelabCatalogV2 } from "../lib/homelabCatalogV2Projection";
import { loadHomelabServicesCatalog } from "../lib/homelabServicesServer";
import {
	fetchSiteCatalogV2,
	SITE_CATALOG_V2_URL,
	SiteCatalogV2Error,
	sanitizeSiteCatalogV2,
} from "../lib/homelabSiteCatalog";
import { withPublicReadOnly } from "./helpers/homelabPublicReadOnly";

const originalFetch = globalThis.fetch;
const originalKey = process.env.DIAGNOSTICS_ACCESS_KEY;
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
				entityRef: "resource:default/postgresql",
				sourcePath: "apps/postgresql/catalog-info.yaml",
				metadata: {
					name: "postgresql",
					title: "PostgreSQL",
					annotations: { secret: "DO_NOT_EXPORT" },
					labels: {
						"albandrieu.com/operational-criticality": "critical",
						token: "DO_NOT_EXPORT",
					},
				},
				spec: { type: "database" },
			},
			{
				apiVersion: "backstage.io/v1alpha1",
				kind: "Component",
				entityRef: "component:default/fastapi",
				sourcePath: "apps/fastapi/catalog-info.yaml",
				metadata: {
					name: "fastapi",
					title: "FastAPI",
					remoteUrl: "https://internal.invalid",
				},
				spec: {
					type: "service",
					dependsOn: ["resource:default/postgresql"],
					internalPort: 5432,
				},
			},
		],
	};
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	if (originalKey === undefined) delete process.env.DIAGNOSTICS_ACCESS_KEY;
	else process.env.DIAGNOSTICS_ACCESS_KEY = originalKey;
});

test("invalid Preview diagnostics key is denied with no fallback", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "1234"; // deliberately invalid fixture
	globalThis.fetch = async (input, init) => {
		assert.equal(String(input), SITE_CATALOG_V2_URL);
		assert.equal(init?.redirect, "error");
		assert.equal(new Headers(init?.headers).get("X-Diagnostics-Key"), "1234");
		return new Response("unauthorized", { status: 401 });
	};
	await assert.rejects(
		() => loadHomelabServicesCatalog(),
		(error: unknown) =>
			error instanceof SiteCatalogV2Error && error.reason === "access-denied",
	);
});

test("missing diagnostics key fails closed before any network request", async () => {
	delete process.env.DIAGNOSTICS_ACCESS_KEY;
	globalThis.fetch = async () => {
		throw new Error("must not fetch without credentials");
	};
	await assert.rejects(
		() => fetchSiteCatalogV2(),
		(error: unknown) =>
			error instanceof SiteCatalogV2Error && error.reason === "key-missing",
	);
});

test("v2 503, v1 payload and invalid graph cannot become service cards", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-read-only";
	for (const response of [
		new Response("unavailable", { status: 503 }),
		Response.json({
			version: 1,
			services: [{ id: "postgresql", name: "PostgreSQL" }],
		}),
		// A valid Backstage catalog containing only organizational entities must
		// fail visibly, not render an apparently healthy but empty service grid.
		Response.json({
			schemaVersion: 2,
			model: "backstage",
			catalogRevision: revision,
			entities: [
				{
					apiVersion: "backstage.io/v1alpha1",
					kind: "System",
					entityRef: "system:default/platform",
					sourcePath: "catalog/catalog-info.yaml",
					metadata: { name: "platform" },
					spec: {},
				},
			],
		}),
		Response.json({
			...fixture(),
			entities: [
				{
					...fixture().entities[1],
					spec: { dependsOn: ["resource:default/missing"] },
				},
			],
		}),
	]) {
		globalThis.fetch = async () => response.clone();
		await assert.rejects(
			() => fetchSiteCatalogV2(),
			(error: unknown) =>
				error instanceof SiteCatalogV2Error && error.reason === "unavailable",
		);
	}
});

test("only Backstage v2 can materialize cards and canonical dependencies", async () => {
	process.env.DIAGNOSTICS_ACCESS_KEY = "fixture-read-only";
	globalThis.fetch = async () => Response.json(fixture());
	const result = await loadHomelabServicesCatalog();
	assert.equal(result.source, "fastapi");
	assert.equal(result.primaryUrl, SITE_CATALOG_V2_URL);
	assert.equal(result.catalog.catalogRevision, revision);
	assert.deepEqual(
		result.catalog.services.map((item) => item.id),
		["fastapi", "postgresql"],
	);
	assert.ok(
		result.catalog.services.every((item) => item.endpointEnabled === false),
	);
	assert.doesNotMatch(
		JSON.stringify(result.catalog),
		/DO_NOT_EXPORT|5432|internal\\.invalid/,
	);
	const parsed = parseHomelabCatalogV2(fixture());
	assert.ok(parsed);
	const sanitized = sanitizeSiteCatalogV2(parsed);
	assert.ok(sanitized);
	const projected = projectHomelabCatalogV2(sanitized);
	assert.equal(projected.topology.catalogRevision, revision);
	assert.deepEqual(projected.topology.relations, [
		{
			source: "fastapi",
			target: "postgresql",
			type: "dependsOn",
			strength: "required",
			evidence: [],
		},
	]);
	assert.doesNotMatch(
		JSON.stringify(sanitized),
		/DO_NOT_EXPORT|5432|internal\\.invalid/,
	);
});

test("v2 backend rejects an invalid sourcePath and dangling relations", () => {
	const parsed = parseHomelabCatalogV2(fixture());
	assert.ok(parsed);
	parsed.entities[0].sourcePath = "../../etc/secrets";
	assert.equal(sanitizeSiteCatalogV2(parsed), null);
});

test("anonymous visitors receive a neutral 404 without querying either private route", () =>
	withPublicReadOnly(false, async () => {
		globalThis.fetch = async () => {
			throw new Error("should never reach FastAPI");
		};
		for (const get of [getCards, getV2]) {
			const response = await get(
				new Request("https://www.albanandrieu.com/api/homelab-services", {
					headers: { "x-real-ip": "203.0.113.7" },
				}),
			);
			assert.equal(response.status, 404);
			assert.match(response.headers.get("cache-control") ?? "", /no-store/);
		}
	}));

test("scalar subcomponentOf must resolve before publishing a complete v2 graph", () => {
	const parsed = parseHomelabCatalogV2(fixture());
	assert.ok(parsed);
	parsed.entities[1].spec.subcomponentOf = "component:default/missing";
	assert.equal(sanitizeSiteCatalogV2(parsed), null);
	parsed.entities[1].spec.subcomponentOf = ["resource:default/postgresql"];
	assert.equal(sanitizeSiteCatalogV2(parsed), null);
	parsed.entities[1].spec.subcomponentOf = "resource:default/postgresql";
	parsed.entities[1].spec.owner = "group:default/not-published";
	const sanitized = sanitizeSiteCatalogV2(parsed);
	assert.ok(sanitized);
	assert.equal(sanitized.entities[1].spec.owner, undefined);
	const projected = projectHomelabCatalogV2(sanitized);
	assert.ok(
		projected.topology.relations.some(
			(relation) =>
				relation.source === "fastapi" &&
				relation.target === "postgresql" &&
				relation.type === "partOf",
		),
	);
});
