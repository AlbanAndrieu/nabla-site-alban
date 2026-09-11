import assert from "node:assert/strict";
import test from "node:test";

import { parseServiceTopology } from "../lib/serviceTopology";
import { loadLocalServiceTopology } from "./helpers/serviceTopology";

test("local topology fallback is a valid connected graph", async () => {
	const topology = await loadLocalServiceTopology();

	assert.ok(topology.nodes.length >= 10);
	assert.ok(topology.relations.length >= 10);
	assert.ok(
		topology.relations.some(
			(relation) =>
				relation.source === "openwebui" && relation.target === "litellm",
		),
	);
	assert.ok(
		topology.relations.some(
			(relation) =>
				relation.source === "litellm" && relation.target === "ollama",
		),
	);
});

test("local fallback preserves the Elasticsearch and Kibana multi-service contract", async () => {
	const topology = await loadLocalServiceTopology();
	const nodeIds = new Set(topology.nodes.map((node) => node.id));
	assert.ok(nodeIds.has("elasticsearch"));
	assert.ok(nodeIds.has("kibana"));
	assert.ok(nodeIds.has("docker"));
	assert.ok(nodeIds.has("truenas"));

	const hasRelation = (
		source: string,
		target: string,
		type: string,
		strength = "required",
	) =>
		topology.relations.some(
			(relation) =>
				relation.source === source &&
				relation.target === target &&
				relation.type === type &&
				relation.strength === strength,
		);

	assert.ok(hasRelation("kibana", "elasticsearch", "dependsOn"));
	assert.ok(hasRelation("elasticsearch", "docker", "hostedBy"));
	assert.ok(hasRelation("kibana", "docker", "hostedBy"));
	assert.ok(hasRelation("docker", "truenas", "hostedBy"));
});

test("local fallback tracks current runtime placement and Talos topology", async () => {
	const topology = await loadLocalServiceTopology();
	const nodeIds = new Set(topology.nodes.map((node) => node.id));
	for (const id of [
		"fastapi-sample",
		"influxdb",
		"scrutiny",
		"scrutiny-collector",
		"talos",
		"kubernetes",
	]) {
		assert.ok(nodeIds.has(id), `expected authoritative fallback node ${id}`);
	}

	const hasRelation = (
		source: string,
		target: string,
		type: string,
		strength = "required",
	) =>
		topology.relations.some(
			(relation) =>
				relation.source === source &&
				relation.target === target &&
				relation.type === type &&
				relation.strength === strength,
		);

	assert.ok(hasRelation("fastapi-sample", "docker", "hostedBy"));
	assert.ok(hasRelation("scrutiny", "influxdb", "storesIn"));
	assert.ok(hasRelation("scrutiny-collector", "scrutiny", "consumesApi"));
	assert.ok(hasRelation("kubernetes", "talos", "hostedBy"));
	assert.ok(hasRelation("talos", "truenas", "hostedBy"));
});

test("Garage models direct S3 ingress separately from Cloudflare Tunnel administration surfaces", async () => {
	const topology = await loadLocalServiceTopology();
	const nodes = new Map(topology.nodes.map((node) => [node.id, node]));
	assert.equal(nodes.get("garage")?.url, "https://s3.int.albandrieu.com");
	assert.equal(nodes.get("garage-webui")?.url, "https://garage.albandrieu.com");
	assert.equal(
		nodes.get("garage-admin")?.url,
		"https://garage-admin.albandrieu.com",
	);
	assert.ok(nodes.has("cloudflared"));

	const hasRelation = (source: string, target: string, type: string) =>
		topology.relations.some(
			(relation) =>
				relation.source === source &&
				relation.target === target &&
				relation.type === type,
		);

	assert.ok(hasRelation("garage", "traefik", "exposedBy"));
	assert.ok(hasRelation("garage-webui", "cloudflared", "exposedBy"));
	assert.ok(hasRelation("garage-admin", "cloudflared", "exposedBy"));
	assert.equal(
		topology.relations.some(
			(relation) =>
				relation.source === "garage-webui" &&
				relation.target === "traefik" &&
				relation.type === "exposedBy",
		),
		false,
	);
});

test("topology parser accepts hostedBy placement edges", () => {
	const topology = parseServiceTopology({
		version: 1,
		name: "hosting",
		nodes: [
			{ id: "service", name: "Service", kind: "application", category: "test" },
			{
				id: "docker",
				name: "Docker",
				kind: "container-runtime",
				category: "infrastructure",
			},
		],
		relations: [
			{
				source: "service",
				target: "docker",
				type: "hostedBy",
				strength: "required",
				evidence: ["x-nabla.runtime.containerService"],
			},
		],
	});

	assert.ok(topology);
	assert.equal(topology.relations[0]?.type, "hostedBy");
});

test("topology parser rejects edges with unknown nodes", () => {
	const topology = parseServiceTopology({
		version: 1,
		name: "invalid",
		nodes: [{ id: "a", name: "A", kind: "service", category: "test" }],
		relations: [
			{
				source: "a",
				target: "missing",
				type: "dependsOn",
				strength: "required",
				evidence: ["test"],
			},
		],
	});

	assert.equal(topology, null);
});

test("local topology fallback is synchronized with the current Nabla Compose catalog", async () => {
	const topology = await loadLocalServiceTopology();

	if (topology.catalogRevision !== undefined) {
		assert.match(topology.catalogRevision, /^sha256:[0-9a-f]{64}$/);
	}
	assert.equal(topology.nodes.length, 113);
	assert.equal(topology.relations.length, 216);

	const nodeIds = new Set(topology.nodes.map((node) => node.id));
	for (const id of [
		"akvorado-console",
		"akvorado-inlet",
		"akvorado-orchestrator",
		"akvorado-outlet",
		"clamav",
		"docker-socket-proxy",
		"doco-cd",
		"kafka",
		"keycloak",
		"mongo",
		"nexus",
		"pfsense-unbound",
		"pihole-dns-sync",
		"pyroscope",
		"sentry-edge",
		"sentry-relay",
		"sentry-snuba-api",
		"sentry-taskbroker",
		"sentry-taskworker",
	]) {
		assert.ok(nodeIds.has(id), `expected synchronized topology node ${id}`);
	}

	const hasRelation = (source: string, target: string, type: string) =>
		topology.relations.some(
			(relation) =>
				relation.source === source &&
				relation.target === target &&
				relation.type === type,
		);

	assert.ok(hasRelation("pfsense-unbound", "pihole", "dependsOn"));
	assert.ok(hasRelation("keycloak", "postgresql", "dependsOn"));
	assert.ok(hasRelation("openwebui", "cloudflared", "exposedBy"));
	assert.ok(hasRelation("pihole-dns-sync", "pihole", "automates"));
	assert.ok(hasRelation("akvorado-inlet", "kafka", "routesTo"));
	assert.ok(hasRelation("akvorado-outlet", "clickhouse", "storesIn"));
	assert.ok(hasRelation("pyroscope", "docker", "hostedBy"));
	assert.ok(hasRelation("sentry-edge", "sentry-relay", "routesTo"));
});

test("local topology preserves FastAPI Sample production and staging environments", async () => {
	const topology = await loadLocalServiceTopology();
	const sample = topology.nodes.find((node) => node.id === "fastapi-sample");
	assert.deepEqual(
		sample?.environments?.map((environment) => environment.name),
		["production", "staging"],
	);
});

test("topology parser validates deployment environment names and URLs", () => {
	const base = {
		version: 1,
		name: "environment-contract",
		relations: [],
	};

	assert.ok(
		parseServiceTopology({
			...base,
			nodes: [
				{
					id: "sample",
					name: "Sample",
					kind: "api",
					category: "test",
					environments: [],
				},
			],
		}),
	);
	assert.equal(
		parseServiceTopology({
			...base,
			nodes: [
				{
					id: "sample",
					name: "Sample",
					kind: "api",
					category: "test",
					environments: [
						{
							name: "qa",
							url: "https://qa.example.com",
							external: true,
							cloudflareTunnel: false,
						},
					],
				},
			],
		}),
		null,
	);
	assert.equal(
		parseServiceTopology({
			...base,
			nodes: [
				{
					id: "sample",
					name: "Sample",
					kind: "api",
					category: "test",
					environments: [
						{
							name: "production",
							url: " ",
							external: true,
							cloudflareTunnel: false,
						},
					],
				},
			],
		}),
		null,
	);
});

test("synchronized topology preserves internal URL and security-function metadata", async () => {
	const topology = await loadLocalServiceTopology();
	const clamav = topology.nodes.find((node) => node.id === "clamav");
	assert.equal(clamav?.internalUrl, "https://clamav.int.albandrieu.com");
	assert.deepEqual(clamav?.securityFunctions, ["protect", "detect"]);
	assert.equal(
		topology.nodes.find((node) => node.id === "pfsense-unbound")?.criticality,
		"critical",
	);
});
