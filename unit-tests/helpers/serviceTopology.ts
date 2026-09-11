import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseServiceTopology } from "../../lib/serviceTopology";

type ParsedServiceTopology = NonNullable<
	ReturnType<typeof parseServiceTopology>
>;

export async function loadLocalServiceTopology() {
	const raw = JSON.parse(
		await readFile("public/service-topology.json", "utf8"),
	) as unknown;
	const topology = parseServiceTopology(raw);
	assert.ok(topology);
	return topology;
}

export function hasTopologyRelation(
	topology: ParsedServiceTopology,
	source: string,
	target: string,
	type: string,
) {
	return topology.relations.some(
		(relation) =>
			relation.source === source &&
			relation.target === target &&
			relation.type === type,
	);
}
