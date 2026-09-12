import assert from "node:assert/strict";
import test from "node:test";

import { parseServiceTopology } from "../lib/serviceTopology";

const base = {
	version: 1,
	name: "lifecycle contract",
	relations: [],
};

test("topology parser accepts canonical Nabla Compose lifecycle phases", () => {
	for (const [phase, priority] of [
		["bootstrap-runtime", 0],
		["foundation", 10],
		["network-edge", 15],
		["primary-data", 20],
		["secondary-data", 30],
		["platform-services", 40],
		["applications", 50],
	] as const) {
		const topology = parseServiceTopology({
			...base,
			nodes: [
				{
					id: phase,
					name: phase,
					kind: "service",
					category: "test",
					lifecycle: { phase, priority },
				},
			],
		});
		assert.equal(topology?.nodes[0]?.lifecycle?.phase, phase);
		assert.equal(topology?.nodes[0]?.lifecycle?.priority, priority);
	}
});

test("topology parser rejects unknown phases and invalid lifecycle priorities", () => {
	for (const lifecycle of [
		{ phase: "unknown-phase", priority: 10 },
		{ phase: "foundation", priority: -1 },
		{ phase: "foundation", priority: 1.5 },
		{ phase: "foundation", priority: 1001 },
	]) {
		assert.equal(
			parseServiceTopology({
				...base,
				nodes: [
					{
						id: "service",
						name: "Service",
						kind: "service",
						category: "test",
						lifecycle,
					},
				],
			}),
			null,
		);
	}
});
