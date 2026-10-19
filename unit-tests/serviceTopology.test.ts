import assert from "node:assert/strict";
import test from "node:test";

import { parseServiceTopology } from "../lib/serviceTopology";
import {
	hasRequiredTopologyRelation,
	hasTopologyRelation,
	loadLocalServiceTopology,
} from "./helpers/serviceTopology";

test("public topology is a sanitized, valid overview", async () => {
	const graph = await loadLocalServiceTopology();
	assert.equal(graph.version, 1);
	assert.equal(graph.nodes.length, 1);
	assert.deepEqual(graph.relations, []);
	assert.doesNotMatch(
		JSON.stringify(graph),
		/internalUrl|sourcePath|172\.17\.|endpointUrl|tunnelUrl/,
	);
});

test("the parser retains relation and security contracts on synthetic private data", () => {
	const graph = parseServiceTopology({
		version: 1,
		name: "synthetic private fixture",
		nodes: [
			{
				id: "application",
				name: "Application",
				kind: "service",
				category: "test",
			},
			{
				id: "database",
				name: "Database",
				kind: "database",
				category: "test",
				internalUrl: "https://database.example.invalid",
				securityFunctions: ["protect"],
			},
			{
				id: "runtime",
				name: "Runtime",
				kind: "container",
				category: "test",
			},
		],
		relations: [
			{
				source: "application",
				target: "database",
				type: "dependsOn",
				strength: "required",
				evidence: ["fixture"],
			},
			{
				source: "database",
				target: "runtime",
				type: "hostedBy",
				strength: "required",
				evidence: ["fixture"],
			},
		],
	});
	assert.ok(graph);
	assert.ok(
		hasRequiredTopologyRelation(graph, "application", "database", "dependsOn"),
	);
	assert.ok(hasTopologyRelation(graph, "database", "runtime", "hostedBy"));
	assert.equal(
		graph.nodes.find((node) => node.id === "database")?.internalUrl,
		"https://database.example.invalid",
	);
	assert.deepEqual(
		graph.nodes.find((node) => node.id === "database")?.securityFunctions,
		["protect"],
	);
});

test("topology parser rejects relations referencing unknown nodes", () => {
	assert.equal(
		parseServiceTopology({
			version: 1,
			name: "invalid",
			nodes: [{ id: "a", name: "A", kind: "service", category: "test" }],
			relations: [
				{
					source: "a",
					target: "missing",
					type: "dependsOn",
					strength: "required",
					evidence: ["fixture"],
				},
			],
		}),
		null,
	);
});

test("topology parser validates deployment environment names and URLs", () => {
	const base = { version: 1, name: "environments", relations: [] };
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
	for (const environment of [
		{
			name: "qa",
			url: "https://qa.example.invalid",
			external: true,
			cloudflareTunnel: false,
		},
		{
			name: "production",
			url: " ",
			external: true,
			cloudflareTunnel: false,
		},
	]) {
		assert.equal(
			parseServiceTopology({
				...base,
				nodes: [
					{
						id: "sample",
						name: "Sample",
						kind: "api",
						category: "test",
						environments: [environment],
					},
				],
			}),
			null,
		);
	}
});

test("public topology does not expose transport, deployment or authentication metadata", async () => {
	const topology = await loadLocalServiceTopology();
	for (const node of topology.nodes) {
		assert.equal(node.internalUrl, undefined);
		assert.equal(node.sourcePath, undefined);
		assert.equal(node.url, undefined);
		assert.equal(node.environments, undefined);
	}
	assert.ok(topology.nodes.every((node) => node.id !== "pfsense"));
	assert.ok(topology.nodes.every((node) => node.id !== "truenas"));
	assert.deepEqual(topology.relations, []);
});
