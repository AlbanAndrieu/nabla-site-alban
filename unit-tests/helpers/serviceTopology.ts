import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseServiceTopology } from "../../lib/serviceTopology";

export async function loadLocalServiceTopology() {
	const raw = JSON.parse(
		await readFile("public/service-topology.json", "utf8"),
	) as unknown;
	const topology = parseServiceTopology(raw);
	assert.ok(topology);
	return topology;
}
